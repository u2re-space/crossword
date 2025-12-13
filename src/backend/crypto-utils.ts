/**
 * Cryptographic Utilities for Server
 *
 * Provides AES-256-GCM decryption with RSA signature verification
 * for secure message processing on the server.
 *
 * Note: Server only needs to verify signatures and decrypt (inspect mode),
 * it does not need to encrypt or sign messages.
 */

// Use Deno's Node.js compatibility layer for crypto
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { getEnv, getEnvObject } from "./lib/runtime.ts";

/**
 * AES-256-GCM key.
 * In production, get from environment variable CLIPBOARD_MASTER_KEY.
 */
const AES_KEY = crypto
    .createHash("sha256")
    .update(getEnv("CLIPBOARD_MASTER_KEY") || "some-very-secret-key")
    .digest(); // 32 bytes

/**
 * Public keys for devices:
 *   deviceId -> PEM
 * On server: populate all devices.
 *
 * Example:
 *   export PUBKEY_pc1="$(cat pc1-public.pem)"
 *   export PUBKEY_phone1="$(cat phone1-public.pem)"
 */
const PUBLIC_KEYS: Record<string, string> = {};
for (const [envName, value] of Object.entries(getEnvObject())) {
    if (envName.startsWith("PUBKEY_")) {
        const deviceId = envName.slice("PUBKEY_".length); // PUBKEY_pc1 -> pc1
        PUBLIC_KEYS[deviceId] = value;
    }
}

/**
 * Decrypt cipherBlock (Buffer) -> innerObj
 */
function decryptPayload(cipherBlock: Buffer): any {
    const iv = cipherBlock.slice(0, 12);
    const authTag = cipherBlock.slice(cipherBlock.length - 16);
    const encrypted = cipherBlock.slice(12, cipherBlock.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Verify signature of cipherBlock using device's public key.
 */
function verifyCipher(deviceId: string, cipherBlock: Buffer, signature: Buffer): boolean {
    const pub = PUBLIC_KEYS[deviceId];
    if (!pub) {
        console.warn("No public key for deviceId:", deviceId);
        return false;
    }
    const verifier = crypto.createVerify("sha256");
    verifier.update(cipherBlock);
    verifier.end();
    return verifier.verify(pub, signature);
}

/**
 * Parse and decrypt payload:
 *   payloadB64 -> outer JSON -> verify signature -> decrypt -> {from, inner}
 */
export function parsePayload(payloadB64: string): { from: string; inner: any } {
    const outerJson = Buffer.from(payloadB64, "base64").toString("utf8");
    const outer = JSON.parse(outerJson); // {from, cipher, sig}

    const deviceId = outer.from;
    const cipherBlock = Buffer.from(outer.cipher, "base64");
    const sig = Buffer.from(outer.sig, "base64");

    const ok = verifyCipher(deviceId, cipherBlock, sig);
    if (!ok) {
        throw new Error("Signature verify failed for deviceId=" + deviceId);
    }

    const inner = decryptPayload(cipherBlock);
    return { from: deviceId, inner };
}

/**
 * Verify signature without decrypting content.
 * Used by server in blind mode.
 */
export function verifyWithoutDecrypt(payloadB64: string): boolean {
    try {
        const outerJson = Buffer.from(payloadB64, "base64").toString("utf8");
        const outer = JSON.parse(outerJson);
        const deviceId = outer.from;
        const cipherBlock = Buffer.from(outer.cipher, "base64");
        const sig = Buffer.from(outer.sig, "base64");
        return verifyCipher(deviceId, cipherBlock, sig);
    } catch (error) {
        console.error("Error verifying signature:", error);
        return false;
    }
}

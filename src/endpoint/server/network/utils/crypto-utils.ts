import crypto from "node:crypto";
import { Buffer } from "node:buffer";

type ParsedPayload = {
    from: string;
    inner: any;
};

type DenoProxyPayload = {
    from?: string;
    cipher?: string;
    sig?: string;
};

const AES_KEY = crypto
    .createHash("sha256")
    .update(process.env.CLIPBOARD_MASTER_KEY || "some-very-secret-key")
    .digest();

const PUBLIC_KEYS = (() => {
    const keys: Record<string, string> = {};
    for (const [envName, value] of Object.entries(process.env)) {
        if (envName.startsWith("PUBKEY_") && value) {
            keys[envName.slice("PUBKEY_".length)] = value;
        }
    }
    return keys;
})();

const tryDecodeBase64 = (value: unknown): Buffer | null => {
    if (typeof value !== "string") return null;
    try {
        return Buffer.from(value, "base64");
    } catch {
        return null;
    }
};

const isDenoProxyPayload = (payload: unknown): payload is DenoProxyPayload => {
    if (!payload || typeof payload !== "object") return false;
    const obj = payload as Record<string, unknown>;
    return typeof obj.from === "string" && typeof obj.cipher === "string" && typeof obj.sig === "string";
};

const tryParseDenoProxyEnvelope = (payload: unknown): DenoProxyPayload | null => {
    if (typeof payload === "string") {
        const decoded = Buffer.from(payload, "base64");
        try {
            const parsed = JSON.parse(decoded.toString("utf8"));
            return isDenoProxyPayload(parsed) ? (parsed as DenoProxyPayload) : null;
        } catch {
            return null;
        }
    }
    return isDenoProxyPayload(payload) ? (payload as DenoProxyPayload) : null;
};

const verifySignature = (deviceId: string, cipherBlock: Buffer, sig: Buffer): boolean => {
    const pub = PUBLIC_KEYS[deviceId];
    if (!pub) return true;
    const verifier = crypto.createVerify("sha256");
    verifier.update(cipherBlock);
    verifier.end();
    try {
        return verifier.verify(pub, sig);
    } catch {
        return false;
    }
};

const decryptPayload = (payloadB64: string): { from: string; inner: any } => {
    const outer = JSON.parse(payloadB64) as Record<string, unknown>;
    const deviceId = typeof outer.from === "string" ? outer.from : "unknown";

    const cipherBlock = tryDecodeBase64(outer.cipher);
    const sig = tryDecodeBase64(outer.sig);
    if (!cipherBlock || !sig || !verifySignature(deviceId, cipherBlock, sig)) {
        throw new Error(`Signature verify failed for deviceId=${deviceId}`);
    }

    const iv = cipherBlock.subarray(0, 12);
    const authTag = cipherBlock.subarray(cipherBlock.length - 16);
    const encrypted = cipherBlock.subarray(12, cipherBlock.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return {
        from: deviceId,
        inner: JSON.parse(decrypted.toString("utf8"))
    };
};

export const parsePayload = (payload: unknown): ParsedPayload => {
    const denoPayload = tryParseDenoProxyEnvelope(payload);
    if (denoPayload) {
        const payloadB64 = JSON.stringify(denoPayload);
        try {
            return decryptPayload(payloadB64);
        } catch {
            return { from: "unknown", inner: payload };
        }
    }

    if (payload && typeof payload === "object") {
        const obj = payload as Record<string, any>;
        return {
            from: typeof obj.from === "string" ? obj.from : "unknown",
            inner: obj.inner ?? obj.data ?? obj,
        };
    }

    if (typeof payload === "string") {
        try {
            const parsed = JSON.parse(payload) as Record<string, any>;
            return parsePayload(parsed);
        } catch {
            return { from: "unknown", inner: payload };
        }
    }

    return { from: "unknown", inner: payload };
};

export const verifyWithoutDecrypt = (payload: unknown): boolean => {
    const denoPayload = tryParseDenoProxyEnvelope(payload);
    if (!denoPayload) return true;
    try {
        const deviceId = typeof denoPayload.from === "string" ? denoPayload.from : "unknown";
        const cipherBlock = tryDecodeBase64(denoPayload.cipher);
        const sig = tryDecodeBase64(denoPayload.sig);
        if (!cipherBlock || !sig) return false;
        return verifySignature(deviceId, cipherBlock, sig);
    } catch {
        return false;
    }
};

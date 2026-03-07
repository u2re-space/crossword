// =========================
// HTTP Routes
// =========================

import { writeClipboard, setBroadcasting } from "../io/clipboard.ts";
import config from "../config/config.ts";
import { pickEnvBoolLegacy } from "../lib/env.ts";

function setUtf8Plain(reply: any) {
    reply.header("Content-Type", "text/plain; charset=utf-8");
}

function isAuthorized(request: any): boolean {
    const secret = (config as any)?.secret || "";
    if (!secret) return true;

    const headerToken = request?.headers?.["x-auth-token"] || request?.headers?.["X-Auth-Token"] || request?.headers?.["x-auth_token"];

    if (typeof headerToken === "string" && headerToken === secret) return true;

    const auth = request?.headers?.authorization || request?.headers?.Authorization;
    if (typeof auth === "string") {
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (m && m[1] === secret) return true;
    }

    return false;
}

const isClipboardLoggingEnabled = () => {
    return pickEnvBoolLegacy("CWS_CLIPBOARD_LOGGING", true) !== false;
};

const normalizeClipboardText = (body: any): string => {
    if (typeof body === "string") return body.trim();
    if (!body || typeof body !== "object") return "";
    const candidates = [
        body.text,
        body.body,
        body.payload,
        body.data,
        body.content,
        body.clipboard
    ];
    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
    }
    return "";
};

const normalizeClipboardTarget = (value: any): string[] => {
    if (typeof value !== "string") return [];
    const normalized = value.trim();
    if (!normalized) return [];
    return normalized
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
};

const summarizeClipboardText = (text: string): { len: number; preview: string } => {
    const value = String(text ?? "");
    const compact = value.replace(/\s+/g, " ").trim();
    const previewLimit = 64;
    return {
        len: value.length,
        preview: compact.length > previewLimit ? `${compact.slice(0, previewLimit)}...` : compact
    };
};

const collectClipboardTargets = (requestBody: any): string[] => {
    if (!requestBody || typeof requestBody !== "object") return [];
    const out = new Set<string>();
    const pushTargets = (value: any) => {
        for (const entry of normalizeClipboardTarget(value)) {
            out.add(entry);
        }
    };

    pushTargets(requestBody.targetDeviceId);
    pushTargets(requestBody.deviceId);
    pushTargets(requestBody.targetId);
    pushTargets(requestBody.target);
    pushTargets(requestBody.to);
    if (Array.isArray(requestBody.targets)) {
        for (const target of requestBody.targets) {
            pushTargets(target);
        }
    }
    return Array.from(out);
};

const buildClipboardBroadcastPayload = (requestBody: any, text: string, request: any) => {
    const targets = collectClipboardTargets(requestBody);
    if (!targets.length || !text) return null;
    const resolvedClientId = typeof requestBody.clientId === "string" ? requestBody.clientId.trim() : "";
    const resolvedToken = typeof requestBody.token === "string" ? requestBody.token.trim() : "";
    const requests = targets.map((target) => ({
        deviceId: target,
        body: text,
        method: "POST"
    }));
    const payload: any = {
        requests
    };
    if (resolvedClientId) payload.clientId = resolvedClientId;
    if (resolvedToken) payload.token = resolvedToken;
    if (typeof request.headers?.["x-auth-token"] === "string") {
        payload.token = payload.token || String(request.headers["x-auth-token"]).trim();
    }
    return payload;
};

export function registerRoutes(app: any) {
    // POST /clipboard  (Fastify-style)
    app.post("/clipboard", async (request: any, reply: any) => {
        if (!isAuthorized(request)) {
            setUtf8Plain(reply);
            return reply.code(401).send("Unauthorized");
        }

        try {
            const text = normalizeClipboardText(request.body);
            const relayPayload = buildClipboardBroadcastPayload(request.body, text, request);
            const source = String(
                request?.headers?.["x-forwarded-for"] ||
                request?.ip ||
                request?.socket?.remoteAddress ||
                ""
            ).trim() || "unknown";

            if (!text) {
                setUtf8Plain(reply);
                return reply.code(400).send("No text provided");
            }

            if (relayPayload) {
                if (isClipboardLoggingEnabled()) {
                    app.log.info(
                        {
                            source,
                            via: "http:/clipboard->dispatch",
                            targets: relayPayload.requests?.map((item: any) => item?.deviceId).filter(Boolean),
                            text: summarizeClipboardText(text)
                        },
                        "Clipboard relay request accepted"
                    );
                }
                const relayResponse = await app.inject({
                    method: "POST",
                    url: "/core/ops/http/dispatch",
                    headers: {
                        "content-type": "application/json"
                    },
                    payload: relayPayload
                });
                const relayBody = typeof relayResponse.body === "string" ? relayResponse.body : JSON.stringify(relayResponse.body ?? {});
                return reply.code(relayResponse.statusCode || 200).send(relayBody);
            }

            setBroadcasting(true);
            const written = await writeClipboard(text);
            if (written) {
                if (isClipboardLoggingEnabled()) {
                    app.log.info(
                        {
                            source,
                            via: "http:/clipboard->local-write",
                            text: summarizeClipboardText(text)
                        },
                        "Copied to clipboard"
                    );
                }
            } else {
                if (isClipboardLoggingEnabled()) {
                    app.log.warn("Clipboard backend unavailable, request accepted without local write");
                }
                setUtf8Plain(reply);
                return reply.code(204).send("Clipboard unavailable");
            }
            setUtf8Plain(reply);
            return reply.code(200).send("OK");
        } catch (err) {
            if (isClipboardLoggingEnabled()) {
                app.log.error({ err }, "Clipboard error");
            }
            setUtf8Plain(reply);
            return reply.code(500).send("Clipboard error");
        } finally {
            setBroadcasting(false);
        }
    });
}

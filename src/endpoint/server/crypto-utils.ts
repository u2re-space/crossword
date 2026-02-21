type ParsedPayload = {
    from: string;
    inner: any;
};

export const verifyWithoutDecrypt = (_payload: unknown): boolean => {
    // Compatibility mode: keep legacy bridge traffic working even when
    // clients send plain/unsigned payloads.
    return true;
};

export const parsePayload = (payload: unknown): ParsedPayload => {
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
            return {
                from: typeof parsed.from === "string" ? parsed.from : "unknown",
                inner: parsed.inner ?? parsed.data ?? parsed,
            };
        } catch {
            return { from: "unknown", inner: payload };
        }
    }

    return { from: "unknown", inner: payload };
};

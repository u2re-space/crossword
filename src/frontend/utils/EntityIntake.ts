import { type shareTargetFormData, postShareTarget } from "@rs-core/workers/FileSystem";
import { convertImageToJPEG } from "@rs-core/service/recognize/entity/EntityTypeDetect";

//
export type IntakeOptions = {
    entityType?: string;
    beforeSend?: (payload: shareTargetFormData) => Promise<shareTargetFormData> | shareTargetFormData;
};

//
const DEFAULT_ENTITY_TYPE = "bonus";
const BASE64_PREFIX = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/;
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB

//
const normalizePayload = async (payload: shareTargetFormData): Promise<shareTargetFormData> => {
    if (payload.file instanceof File || payload.file instanceof Blob) {
        if (payload.file instanceof File && payload.file.size > MAX_BASE64_SIZE && payload.file.type.startsWith("image/")) {
            return { ...payload, file: await convertImageToJPEG(payload.file) };
        }
        return payload;
    }

    const text = payload.text || payload.url;
    if (typeof text === "string") {
        const match = text.match(BASE64_PREFIX);
        if (match && match.groups) {
            const { mime, data } = match.groups;
            const byteLen = Math.ceil((data.length * 3) / 4);
            if (byteLen > MAX_BASE64_SIZE) {
                const binary = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
                const blob = new Blob([binary], { type: mime });
                const converted = await convertImageToJPEG(blob);
                return { file: converted };
            }
        }
    }

    return payload;
};

//
export const sendToEntityPipeline = async (payload: shareTargetFormData, options: IntakeOptions = {}) => {
    const entityType = options.entityType || DEFAULT_ENTITY_TYPE;
    const normalized = await normalizePayload(payload);
    const next = options.beforeSend ? await options.beforeSend(normalized) : normalized;
    return postShareTarget(next);
};

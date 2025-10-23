// for optimize images before sending to GPT
import { decode } from '@jsquash/png';
import { encode } from '@jsquash/jpeg';

//
export type CropArea = { x: number, y: number, width: number, height: number }

// for optimize images before sending to GPT
export const jpegConfig = { quality: 90, progressive: false, color_space: 2, optimize_coding: true, auto_subsample: true, baseline: true };

//
export const convertImageToJPEG = async (image: Blob | File | any): Promise<Blob> => {
    const decoded = await decode(await image.arrayBuffer());
    const encoded = await encode(decoded, jpegConfig);
    return new Blob([encoded], { type: 'image/jpeg' });
}

//
export const removeAnyDataPrefix = (b64url: string) => {
    return b64url?.replace?.('data:image/png;base64,', "")?.replace?.(/data:image\/jpeg;base64,/, "");
}

//
export const getMimeFromDataURL = (data_url: string) => {
    return data_url?.match?.(/data:image\/(.*);base64,/)?.[1] || "image/png";
}

//
export const ableToShowImage = async (data_url: string) => { // @ts-ignore
    const bitmap: any = await createImageBitmap(new Blob([Uint8Array.fromBase64(removeAnyDataPrefix(data_url), { alphabet: "base64" })], { type: getMimeFromDataURL(data_url) }))?.catch?.(e => { console.warn(e); return null; });
    return bitmap?.width > 0 && bitmap?.height > 0;
}

//
export const DEFAULT_ENTITY_TYPE = "bonus";
export const BASE64_PREFIX = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/;
export const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB

//
export const deAlphaChannel = async (src: string) => {
    //if (URL.canParse(src)) return src;

    //
    const img = new Image();
    {
        img.crossOrigin = "Anonymous";
        img.decoding = "async";
        img.src = src;
        await img.decode();
    }

    //
    const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
    const ctx = canvas.getContext("2d");
    ctx!.fillStyle = "white";
    ctx?.fillRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(img, 0, 0);
    const imgData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    const arrayBuffer = await encodeWithJSquash(imgData);

    // @ts-ignore
    return arrayBuffer ? `data:image/jpeg;base64,${new Uint8Array(arrayBuffer)?.toBase64?.({ alphabet: "base64" })}` : null;
}

//
export const encodeWithJSquash = async (frameData?: VideoFrame | ImageBitmap | ImageData | null, rect?: CropArea) => {
    if (!frameData) return null;

    //
    const imageDataOptions: ImageDataSettings = {
        colorSpace: "srgb",
    }

    // @ts-ignore
    rect ??= { x: 0, y: 0, width: frameData?.width || frameData?.codedWidth || 0, height: frameData?.height || frameData?.codedHeight || 0 };

    //
    if (frameData instanceof ImageData) {
        return encode(frameData, jpegConfig);
    } else
        if (frameData instanceof ImageBitmap) {
            const cnv = new OffscreenCanvas(rect.width, rect.height);
            const ctx = cnv.getContext("2d");
            ctx?.drawImage?.(frameData, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
            const idata = ctx?.getImageData?.(0, 0, rect.width, rect.height, imageDataOptions);
            if (idata) return encode(idata, jpegConfig);
        } else { // @ts-ignore
            const idata = new ImageData(rect.codedWidth, rect.codedHeight, imageDataOptions);
            try { frameData?.copyTo?.(idata.data, { format: "RGBA", rect }); } catch (e) { console.warn(e); }
            return encode(idata, jpegConfig);
        }
}

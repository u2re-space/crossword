import { writeFile } from "fest/lure";
import { sanitizeFileName } from "./Upload";

//
export const pasteIntoDir = async (dir: string) => {
    try {
        // Rich clipboard first
        if ((navigator.clipboard as any)?.read) {
            const items = await (navigator.clipboard as any).read();
            for (const item of items) {
                for (const type of item.types) {
                    const blob = await item.getType(type);
                    const ext = type.split('/').pop() || '';
                    const file = new File([blob], sanitizeFileName(`pasted-${Date.now()}.${ext}`), { type });
                    await writeFile(null, `${dir}${file.name}`, file);
                }
            }
            return true;
        }
        // Text fallback
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            const file = new File([text], sanitizeFileName(`pasted-${Date.now()}.txt`), { type: 'text/plain' });
            await writeFile(null, `${dir}${file.name}`, file);
            return true;
        }
    } catch (e) { console.warn(e); }
    return false;
}



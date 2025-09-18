import { writeFile } from "fest/lure";
import { sanitizeFileName } from "./Upload";

//
export const bindDropToDir = (host: HTMLElement, dir: string) => {
    const onDragOver = (ev: DragEvent) => {
        ev.preventDefault();
        (host as any).dataset.dragover = 'true';
    };
    const onDragLeave = () => { delete (host as any).dataset.dragover; };
    const onDrop = async (ev: DragEvent) => {
        ev.preventDefault();
        delete (host as any).dataset.dragover;
        try {
            const files: File[] = Array.from(ev.dataTransfer?.files ?? []);
            for (const file of files) {
                const name = sanitizeFileName(file.name || `dropped-${Date.now()}`);
                await writeFile(null, `${dir}${name}`, file);
            }
            host.dispatchEvent(new CustomEvent('dir-dropped', { detail: { count: files.length }, bubbles: true }));
        } catch (e) { console.warn(e); }
    };
    host.addEventListener('dragover', onDragOver);
    host.addEventListener('dragleave', onDragLeave);
    host.addEventListener('drop', onDrop);
    return () => {
        host.removeEventListener('dragover', onDragOver);
        host.removeEventListener('dragleave', onDragLeave);
        host.removeEventListener('drop', onDrop);
    };
}



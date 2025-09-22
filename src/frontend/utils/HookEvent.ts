//
export const handleDataByType = async (item: File | string | Blob, handler: (payload: shareTargetFormData) => Promise<void>) => {
    if (typeof item === 'string') {
        if (item?.startsWith?.("data:image/") && item?.includes?.(";base64,")) { // @ts-ignore
            const arrayBuffer = Uint8Array.fromBase64(text.split(';base64,')[1]);
            const type = item.split(';')[0].split(':')[1];
            await handler({ file: new File([arrayBuffer], 'clipboard-image', { type }) } as any);
            return;
        }
    } else
        if (item instanceof File || item instanceof Blob) {
            await handler({ file: item } as any);
        }
}

//
export const handleDataTransferFiles = async (files: (File | Blob)[] | FileList, handler: (payload: shareTargetFormData) => Promise<void>) => {
    // @ts-ignore
    for (const file of files) {
        handleDataByType(file, handler);
    }
}

//
export const handleDataTransferItemList = async (items: DataTransferItemList, handler: (payload: shareTargetFormData) => Promise<void>) => {
    // @ts-ignore
    for (const item of items) {
        handleDataByType(item, handler);
    }
}

//
export interface shareTargetFormData {
    text?: string;
    url?: string;
    file?: File | Blob;
}

//
export const handleClipboardItems = async (items: ClipboardItem[], handler: (payload: shareTargetFormData) => Promise<void>) => {
    for (const item of items) {
        for (const type of item?.types ?? []) {
            if (type.startsWith('text/')) {
                const text = await (await item?.getType?.(type))?.text?.();
                return handleDataByType(text, handler);
            }
            if (type.startsWith('image/')) {
                const blob = await item?.getType?.(type);
                return handleDataByType(blob, handler);
            }
        }
    }
}

//
export const handleDataTransferInputEvent = (dataTransfer: DataTransfer | null, handler: (payload: shareTargetFormData) => Promise<void>) => {
    const items = dataTransfer?.items;
    const files = dataTransfer?.files ?? [];

    if (items) {
        handleDataTransferItemList(items, handler);
    }

    if (files && (files?.length > 0)) {
        handleDataTransferFiles(files, handler);
    }
}

//
export const implementPasteEvent = (container: HTMLElement | null, handler: (payload: shareTargetFormData) => Promise<void>) => {
    (container || window)?.addEventListener("paste", (event) => {
        const dataTransfer: DataTransfer = event.clipboardData;
        const items = dataTransfer?.items;
        const files = dataTransfer?.files ?? [];

        //
        if (items || (files && (files?.length > 0))) {
            event.preventDefault();
            event.stopPropagation();
        }

        //
        handleDataTransferInputEvent(dataTransfer, handler);
    })
}

//
export const implementDropEvent = (container: HTMLElement, handler: (payload: shareTargetFormData) => Promise<void>) => {
    container.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    //
    container.addEventListener("drop", (event) => {
        const dataTransfer: DataTransfer | null = event.dataTransfer;
        const files = dataTransfer?.files ?? [];
        const items = dataTransfer?.items;

        //
        if (items || files && (files?.length > 0)) {
            event.preventDefault();
            event.stopPropagation();
        }

        //
        handleDataTransferInputEvent(dataTransfer, handler);
    })
}

import { handleDataByType, type shareTargetFormData } from "@rs-core/workers/FileSystem";

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

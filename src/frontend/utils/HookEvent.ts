import { handleDataTransferInputEvent, type shareTargetFormData } from "@rs-core/workers/FileSystem";

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

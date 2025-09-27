import { idbGet } from "@rs-core/store/IDBStorage";
import { encodeWithJSquash } from "./compress";
import { recognizeImageData } from "@rs-core/service/recognize/inputs/RecognizeData";

//
const removeAnyPrefix = (data_url: string) => {
    return data_url?.replace?.('data:image/jpeg;base64,', "").replace?.('data:image/png;base64,', "");
}

//
const ableToShowJPEG = async (data_url: string) => { // @ts-ignore
    const bitmap: any = await createImageBitmap(new Blob([Uint8Array.fromBase64(removeAnyPrefix(data_url), { alphabet: "base64" })], { type: "image/png" }))?.catch?.(e => { console.warn(e); return null; });
    return bitmap?.width > 0 && bitmap?.height > 0;
}

// send to any available content script to trigger copy text
const COPY_HACK = (ext, data, tabId?) => {
    return ext.tabs.query({
        currentWindow: true,
        lastFocusedWindow: true,
        active: true,
    })?.then?.((tabs) => {
        for (const tab of tabs) {
            if (tab?.id != null && tab?.id >= 0) {
                return chrome.tabs.sendMessage?.(tab.id, { type: "COPY_HACK", ...data })?.catch?.(console.warn.bind(console));
            }
        }
    })?.catch?.(console.warn.bind(console));

    //
    if (tabId != null && tabId >= 0) { return chrome.tabs.sendMessage?.(tabId, { type: "COPY_HACK", ...data })?.catch?.(console.warn.bind(console)); }
}

// service worker makes screenshot of visible area
export const enableCapture = (ext) => {
    ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg?.type === "CAPTURE") {
            const windowId = sender?.tab?.windowId; //@ts-ignore
            chrome.tabs.captureVisibleTab({ format: "png", scale: 1, rect: msg.rect ?? { x: 0, y: 0, width: 0, height: 0 } }, async ($dataUrl) => { // @ts-ignore
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    sendResponse({ ok: false, error: chrome.runtime.lastError.message, dataUrl: $dataUrl });
                } else {
                    let dataUrl = $dataUrl;

                    // too large image, compress it
                    if (dataUrl?.length > 1024 * 1024 * 2) { // @ts-ignore
                        const bitmap = await createImageBitmap(new Blob([Uint8Array.fromBase64(removeAnyPrefix($dataUrl), { alphabet: "base64" })], { type: "image/png" })/*, rect.x, rect.y, rect.width, rect.height*/);
                        const arrayBuffer = await encodeWithJSquash(bitmap)?.catch?.(e => { console.warn(e); return null; }); bitmap?.close?.(); // @ts-ignore
                        dataUrl = arrayBuffer ? `data:image/jpeg;base64,${new Uint8Array(arrayBuffer)?.toBase64?.({ alphabet: "base64" })}` : $dataUrl;
                    }

                    //
                    if (!dataUrl || !(await ableToShowJPEG(dataUrl))) {
                        dataUrl = $dataUrl;
                    }

                    //
                    recognizeImageData({
                        input: [{ role: "user", content: [{ type: "input_image", image_url: dataUrl, detail: "high" }] }]
                    }, await idbGet("rs-settings"))?.then(async (res) => {
                        //
                        if (res?.ok) {
                            await COPY_HACK(ext, {
                                data: res?.data?.output?.at?.(-1)?.content?.[0]?.text?.trim?.(),
                                ok: res?.ok,
                                error: res?.error
                            }, sender?.tab?.id)?.catch?.(console.warn.bind(console));
                        }

                        //
                        sendResponse(res); //return res;
                    })?.catch?.(console.warn.bind(console));
                }
            });
        }

        //
        if (msg?.type === "DOWNLOAD" && msg.dataUrl) {
            chrome.downloads.download(
                { url: msg.dataUrl, filename: "snip.png", saveAs: true },
                (id) => { // @ts-ignore
                    if (chrome.runtime.lastError) {
                        sendResponse({ ok: false, error: chrome.runtime.lastError.message, dataUrl: msg.dataUrl });
                    } else {
                        sendResponse({ ok: true, id });
                    }
                }
            );
        }
        return true;
    });
}

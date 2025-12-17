import { showToast } from "./overlay";
import { copyAsHTML, copyAsMathML, copyAsMarkdown, copyAsTeX } from "@rs-frontend/utils/Conversion";

//
const COPY_HACK = async (data) => {
    if (data) {
        try {
            await navigator?.clipboard?.writeText?.(data)?.catch?.(err => {
                console.warn('Failed to copy text: ', err);
            });
            console.log('Text copied to clipboard');
        } catch (err) {
            console.warn('Failed to copy text: ', err);
        }
    }
}

const opMap = new Map<string, (target: HTMLElement) => unknown>([
    ["copy-as-latex", copyAsTeX],
    ["copy-as-mathml", copyAsMathML],
    ["copy-as-markdown", copyAsMarkdown],
    ["copy-as-html", copyAsHTML],
]);

let lastX = 0;
let lastY = 0;
let lastElement: HTMLElement | null = null;

document.addEventListener(
    "pointerdown",
    (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        lastElement = e.target as HTMLElement | null;
    },
    { passive: true, capture: true }
);
document.addEventListener(
    "contextmenu",
    (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        lastElement = e.target as HTMLElement | null;
    },
    { passive: true, capture: true }
);

//
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "highlight-selection") {
        const selection = window.getSelection?.()?.toString?.() ?? "";
        sendResponse({ selection });
        return true;
    }
});

//
chrome.runtime.onMessage.addListener((res, sender, sendResponse) => {
    (async () => {
        if (res?.type == "COPY_HACK") {
            await COPY_HACK(res?.data);
            sendResponse({ ok: res?.ok ?? true, data: res?.data });
            showToast(res?.ok ? "Copying is done" : (res?.error || "Failed to copy"));
        }

        if (typeof res?.type === "string" && opMap.has(res.type)) {
            const op = opMap.get(res.type);
            const target = lastElement || (document.elementFromPoint(lastX, lastY) as HTMLElement | null) || (document.body as HTMLElement);
            try {
                if (op && target) {
                    await op(target);
                    showToast("Copied");
                    sendResponse({ ok: true });
                    return;
                }
            } catch (e) {
                console.warn(e);
            }
            showToast("Failed");
            sendResponse({ ok: false });
        }
    })();
    return true;
});

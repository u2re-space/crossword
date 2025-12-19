import { showToast } from "./overlay";
import { copyAsHTML, copyAsMathML, copyAsMarkdown, copyAsTeX } from "@rs-frontend/utils/Conversion";
import "./copy"; // handles COPY_HACK messages
import "./snip"; // handles START_SNIP messages

// coordinate and element tracking (similar to CrossHelp state.ts)
const coordinate: [number, number] = [0, 0];
const lastElementRef: [HTMLElement | null] = [null];

const saveCoordinate = (e: PointerEvent | MouseEvent) => {
    coordinate[0] = e?.clientX ?? coordinate[0];
    coordinate[1] = e?.clientY ?? coordinate[1];
};

const opMap = new Map<string, (target: HTMLElement) => unknown>([
    ["copy-as-latex", copyAsTeX],
    ["copy-as-mathml", copyAsMathML],
    ["copy-as-markdown", copyAsMarkdown],
    ["copy-as-html", copyAsHTML],
]);

// legacy aliases for compatibility
let lastX = 0;
let lastY = 0;
let lastElement: HTMLElement | null = null;

// event listeners for coordinate tracking
const updateLastPosition = (e: PointerEvent | MouseEvent) => {
    lastX = e.clientX;
    lastY = e.clientY;
    lastElement = e.target as HTMLElement | null;
    saveCoordinate(e);
    lastElementRef[0] = lastElement;
};

document.addEventListener("pointerdown", updateLastPosition, { passive: true, capture: true });
document.addEventListener("pointerup", updateLastPosition, { passive: true, capture: true });
document.addEventListener("click", saveCoordinate as EventListener, { passive: true, capture: true });
document.addEventListener(
    "contextmenu",
    (e) => {
        updateLastPosition(e);
        lastElementRef[0] = (e?.target as HTMLElement) || lastElementRef[0];
    },
    { passive: true, capture: true }
);

// message handler for selection queries
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "highlight-selection") {
        const selection = window.getSelection?.()?.toString?.() ?? "";
        sendResponse({ selection });
        return true;
    }
    return false;
});

// message handler for copy-as-* operations (context menu)
chrome.runtime.onMessage.addListener((res, _sender, sendResponse) => {
    // only handle copy-as-* operations here (COPY_HACK is handled in copy.ts)
    if (typeof res?.type === "string" && opMap.has(res.type)) {
        (async () => {
            const op = opMap.get(res.type);
            const target =
                lastElementRef[0] ||
                lastElement ||
                (document.elementFromPoint(coordinate[0], coordinate[1]) as HTMLElement | null) ||
                (document.elementFromPoint(lastX, lastY) as HTMLElement | null) ||
                document.body;

            try {
                if (op && target) {
                    await op(target);
                    showToast("Copied");
                    sendResponse({ ok: true });
                    return;
                }
            } catch (e) {
                console.warn("Copy operation failed:", e);
            }
            showToast("Failed to copy");
            sendResponse({ ok: false });
        })();
        return true;
    }
    return false;
});

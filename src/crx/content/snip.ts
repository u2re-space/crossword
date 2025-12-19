import { getBox, getHint, getOverlay, getSizeBadge, hideSelection, showSelection, showToast } from "./overlay";

// crop area for screen capture
export interface cropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

let __snipInjected = false;
let __snipActive = false;

// use chrome API to capture tab visible area
const captureTab = (rect?: cropArea) => {
    return chrome.runtime.sendMessage({ type: "CAPTURE", rect })
        ?.then?.(res => {
            console.log("[Snip] Capture result:", res);
            if (res?.ok && res?.data) {
                showToast("Copied to clipboard!");
            } else if (res?.error) {
                // Show shortened error for toast, log full error
                const shortError = res.error.length > 50 ? res.error.slice(0, 50) + "..." : res.error;
                showToast(shortError);
                console.error("[Snip] Recognition error:", res.error);
            } else {
                showToast("No data recognized");
            }
            return res || { ok: false, error: "no response" };
        })
        ?.catch?.(err => {
            console.error("[Snip] Capture failed:", err);
            showToast("Capture failed");
            return { ok: false, error: String(err) };
        });
};

// register message listener and export startSnip
const initSnip = () => {
    if (__snipInjected) return;
    __snipInjected = true;

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg?.type === "START_SNIP") {
            startSnip();
        }
    });
};

export function startSnip() {
    if (__snipActive) return;

    // get DOM elements
    const overlay = getOverlay();
    const box = getBox();
    const hint = getHint();
    const sizeBadge = getSizeBadge();

    if (!overlay || !box) {
        console.warn("Snip overlay not ready");
        return;
    }

    let startX = 0, startY = 0, currX = 0, currY = 0, dragging = false;

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
        }
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0 || !__snipActive) return;
        e.preventDefault();
        e.stopPropagation();

        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currX = startX;
        currY = startY;
        updateBox();

        // hide hint when drawing starts
        if (hint) hint.textContent = "";
        if (sizeBadge) sizeBadge.textContent = "";
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        e.preventDefault();
        currX = e.clientX;
        currY = e.clientY;
        updateBox();
    };

    const onMouseUp = async (e: MouseEvent) => {
        if (!dragging) return;
        e.preventDefault();
        dragging = false;

        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const w = Math.abs(currX - startX);
        const h = Math.abs(currY - startY);

        cleanup();

        if (w < 2 || h < 2) {
            showToast("Selection is too small");
            return;
        }

        showToast("Recognizing with AI...");

        try {
            const result = await captureTab({ x, y, width: w, height: h });
            // captureTab already shows success/error toast
            if (!result?.ok) {
                console.warn("Capture result:", typeof result == "string" ? result : JSON.stringify(result));
            }
        } catch (err) {
            console.warn(err);
            showToast("Recognition failed");
        }
    };

    const onMouseCancel = () => {
        if (!dragging) return;
        dragging = false;
        cleanup();
    };

    function updateBox() {
        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const w = Math.abs(currX - startX);
        const h = Math.abs(currY - startY);

        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        box.style.width = `${w}px`;
        box.style.height = `${h}px`;

        if (sizeBadge) {
            sizeBadge.textContent = `${Math.round(w)} × ${Math.round(h)}`;
            sizeBadge.style.left = `${w}px`;
            sizeBadge.style.top = `${h}px`;

            if (!sizeBadge.isConnected) {
                box.appendChild(sizeBadge);
            }
        }
    }

    function cleanup() {
        __snipActive = false;
        dragging = false;

        // remove all event listeners
        document.removeEventListener("keydown", onKeyDown, true);
        overlay.removeEventListener("mousedown", onMouseDown);
        overlay.removeEventListener("mousemove", onMouseMove);
        overlay.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousecancel", onMouseCancel, true);

        hideSelection();
    }

    // add event listeners to overlay (not document) for mouse events
    document.addEventListener("keydown", onKeyDown, true);
    overlay.addEventListener("mousedown", onMouseDown);
    overlay.addEventListener("mousemove", onMouseMove);
    overlay.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousecancel", onMouseCancel, true);

    // activate snip mode
    __snipActive = true;
    showSelection();

    if (hint) hint.textContent = "Select area. Esc — cancel";
    if (sizeBadge) sizeBadge.textContent = "";
}

// initialize on module load
initSnip();

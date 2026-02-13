import { createView } from "@rs-frontend/views/viewer";
import { loadVeelaVariant } from "fest/veela";


// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentSource = "";      // original source URL
let currentMarkdown = "";    // raw markdown text
let showRaw = false;


// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** Load markdown from chrome.storage.session by key */
const loadFromSessionKey = async (key: string): Promise<string | null> => {
    try {
        const data = await chrome.storage?.session?.get?.(key);
        const text = data?.[key];
        if (typeof text === "string" && text.trim()) return text;
    } catch (e) {
        console.warn("[Viewer] session storage read failed:", e);
    }
    return null;
};

/** Ask service worker to fetch markdown (benefits from host_permissions) */
const fetchViaServiceWorker = (src: string): Promise<{ ok: boolean; text?: string; key?: string; src?: string }> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "md:load", src }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("[Viewer] SW fetch failed:", chrome.runtime.lastError);
                resolve({ ok: false });
                return;
            }
            resolve(response || { ok: false });
        });
    });
};

/** Direct fetch (for same-origin or CORS-enabled resources) */
const fetchDirect = async (src: string): Promise<string | null> => {
    try {
        const res = await fetch(src, { credentials: "include", cache: "no-store" });
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
};

/** Load markdown by source URL - tries session key first, then SW fetch, then direct */
const loadMarkdown = async (src: string, sessionKey?: string | null): Promise<string> => {
    currentSource = src;

    // 1. Pre-fetched markdown in session storage
    if (sessionKey) {
        const text = await loadFromSessionKey(sessionKey);
        if (text) return text;
    }

    // 2. Ask service worker to fetch (has host_permissions)
    const swResult = await fetchViaServiceWorker(src);
    if (swResult.ok && swResult.key) {
        const text = await loadFromSessionKey(swResult.key);
        if (text) return text;
    }

    // 3. Direct fetch fallback
    const text = await fetchDirect(src);
    if (text) return text;

    return `> Failed to load markdown from:\n> ${src}`;
};

const showRawView = () => {
    if (rawPre) {
        rawPre.textContent = currentMarkdown;
        rawPre.hidden = false;
    }
    if (appDiv) appDiv.innerHTML = "";
};

const reloadFromSource = async () => {
    if (!currentSource) return;
    currentMarkdown = await loadMarkdown(currentSource);
    if (showRaw) showRawView();
    else showRendered();
};

const looksLikeHtml = (text: string): boolean => {
    const t = text.trimStart().toLowerCase();
    return t.startsWith("<!doctype html") || t.startsWith("<html") || t.startsWith("<head") || t.startsWith("<body");
};


const rawPre = document.getElementById("raw-md") as HTMLPreElement | null;
const appDiv = document.getElementById("app") as HTMLDivElement | null;


const showRendered = async (markdown?: string) => {
    if (!markdown) markdown = currentMarkdown;
    const viewer = createView({
        initialContent: markdown,
    });
    const viewerElement = viewer.render();
    (appDiv ?? document.body).appendChild(viewerElement);
    if (rawPre) rawPre.hidden = true;
    return viewerElement;
};


// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

//
const params = new URLSearchParams(location.search);
const paramSrc = params.get("src");   // source URL (http/https/file)
const paramMdk = params.get("mdk");   // session-storage key for pre-fetched markdown

//
const init = async () => {
    // Show loading state
    if (rawPre) {
        rawPre.textContent = "Loading...";
        rawPre.hidden = false;
    }

    let markdown = "";

    if (paramSrc) {
        markdown = await loadMarkdown(paramSrc, paramMdk);
    } else if (paramMdk) {
        markdown = (await loadFromSessionKey(paramMdk)) || "";
    }

    // If still empty, show empty state
    if (!markdown.trim()) {
        markdown = "# No content\n\nOpen a markdown file or navigate to a `.md` URL.";
    }

    //
    try {
        await loadVeelaVariant("basic");
    } catch {
        console.warn("[Viewer] Could not load veela-basic runtime");
    }

    // If content looks like HTML, show raw with a note
    if (looksLikeHtml(markdown)) {
        markdown = `> **Note:** The fetched content is HTML, not Markdown.\n> Showing raw content below.\n\n\`\`\`html\n${markdown}\n\`\`\``;
    } else {
        return showRaw ? showRawView() : showRendered(markdown);
    }
};

//
init().catch((e) => {
    console.error("[Viewer] init failed:", e);
    if (rawPre) {
        rawPre.textContent = `Failed to initialize viewer: ${e}`;
        rawPre.hidden = false;
    }
});

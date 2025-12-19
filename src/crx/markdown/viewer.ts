import frontend from "../../frontend/basic";

const mount = document.getElementById("app") as HTMLElement | null;
const raw = document.getElementById("raw-md") as HTMLPreElement | null;

const LAST_SRC_KEY = "rs-md-viewer-last-src";
const LAST_MD_KEY = "rs-basic-markdown";

const loadLastMarkdown = () => {
  try {
    return localStorage.getItem(LAST_MD_KEY) || "";
  } catch {
    return "";
  }
};

const saveLastSrc = (src: string) => {
  try {
    localStorage.setItem(LAST_SRC_KEY, src);
  } catch {
    // ignore
  }
};

const loadLastSrc = () => {
  try {
    return localStorage.getItem(LAST_SRC_KEY) || "";
  } catch {
    return "";
  }
};

const isProbablyUrl = (value: string) => {
  try {
    // Avoid persisting huge raw markdown strings as a "src".
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

const loadTextFromSrc = async (src: string): Promise<string> => {
  const trimmed = src.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const res = await fetch(u.href, { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      const cached = loadLastMarkdown();
      return cached || `# Failed to load\n\n**Status**: ${res.status}\n`;
    }
    return await res.text();
  } catch {
    // Not a URL - treat as raw markdown
    return trimmed;
  }
};

const loadTextFromSessionKey = async (key: string) => {
  try {
    const obj = await chrome.storage?.session?.get?.(key);
    const text = obj?.[key];
    if (typeof text === "string") {
      chrome.storage?.session?.remove?.(key)?.catch?.(() => {});
      return text;
    }
  } catch {
    // ignore
  }
  return "";
};

const requestMarkdownFromServiceWorker = async (src: string) => {
  try {
    const res = await chrome.runtime.sendMessage({ type: "md:load", src });
    const key = res?.key;
    const normalized = res?.src;
    if (typeof normalized === "string" && normalized && normalized !== src && isProbablyUrl(normalized)) {
      saveLastSrc(normalized);
    }
    if (typeof key === "string" && key) {
      return await loadTextFromSessionKey(key);
    }
  } catch {
    // ignore
  }
  return "";
};

void (async () => {
  if (!mount) return;
  // Show something immediately (sync) while we load the real markdown payload.
  // This is an internal "clipboard emulation" UX: raw-first, app-after.
  if (raw) raw.textContent = loadLastMarkdown() || "";

  const params = new URLSearchParams(location.search);
  const mdk = (params.get("mdk") || "").trim();
  const src = (params.get("src") || "").trim() || loadLastSrc();
  if (src && isProbablyUrl(src)) saveLastSrc(src);
  const text =
    mdk
      ? await loadTextFromSessionKey(mdk)
      : (src ? (await requestMarkdownFromServiceWorker(src)) : "") || (src ? await loadTextFromSrc(src) : "");

  // Display raw markdown ASAP (before loading the heavier app bundle).
  if (raw) raw.textContent = text || "";

  // Persist last markdown for "instant" raw fallback next time.
  try {
    if (text) localStorage.setItem(LAST_MD_KEY, text);
  } catch {
    // ignore
  }

  // Mount the app with the markdown content
  frontend(mount, { initialView: "markdown", initialMarkdown: text || undefined });

  // Once the app mounts, hide the raw layer.
  if (raw) raw.style.display = "none";
})();



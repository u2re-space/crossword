import frontend from "../../frontend/basic";

const mount = document.getElementById("app") as HTMLElement | null;

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

void (async () => {
  if (!mount) return;
  const params = new URLSearchParams(location.search);
  const src = (params.get("src") || "").trim() || loadLastSrc();
  if (src && isProbablyUrl(src)) saveLastSrc(src);
  const text = src ? await loadTextFromSrc(src) : "";
  frontend(mount, { initialView: "markdown", initialMarkdown: text || undefined });
})();



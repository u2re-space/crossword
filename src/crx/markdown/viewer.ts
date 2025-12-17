import frontend from "../../frontend/basic";

const mount = document.getElementById("app") as HTMLElement | null;

const loadTextFromSrc = async (src: string): Promise<string> => {
  const trimmed = src.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const res = await fetch(u.href, { credentials: "include", cache: "no-store" });
    if (!res.ok) return `# Failed to load\n\n**Status**: ${res.status}\n`;
    return await res.text();
  } catch {
    // Not a URL - treat as raw markdown
    return trimmed;
  }
};

void (async () => {
  if (!mount) return;
  const params = new URLSearchParams(location.search);
  const src = params.get("src") || "";
  const text = src ? await loadTextFromSrc(src) : "";
  frontend(mount, { initialView: "markdown", initialMarkdown: text || undefined });
})();



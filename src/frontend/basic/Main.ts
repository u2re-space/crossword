import "./Main.scss";

import { H } from "fest/lure";
import { recognizeByInstructions } from "@rs-core/service/AI-ops/RecognizeData";
import { loadSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import { createSettingsView } from "./Settings";
import { defineBasicMarkdownView, type BasicMarkdownView } from "./MarkdownView";
import { writeText } from "@rs-frontend/shared/Clipboard";

export type BasicView = "markdown" | "settings" | "history";

export type BasicAppOptions = {
  initialView?: BasicView;
  initialMarkdown?: string;
};

type HistoryEntry = {
  ts: number;
  prompt: string;
  before: string;
  after: string;
  ok: boolean;
  error?: string;
};

const HISTORY_KEY = "rs-basic-history";
const LAST_SRC_KEY = "rs-basic-last-src";
const DEFAULT_MD = "# CrossWord (Basic)\n\nOpen a markdown file or paste content here.\n";
const MARKDOWN_EXTENSION_PATTERN = /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i;

const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as T;
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const loadLastSrc = () => {
  try {
    return localStorage.getItem(LAST_SRC_KEY) || "";
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

const isLikelyExtension = () => {
  try {
    return (
      typeof chrome !== "undefined" &&
      Boolean((chrome as any)?.runtime?.id) &&
      window.location.protocol === "chrome-extension:"
    );
  } catch {
    return false;
  }
};

const applyTheme = (root: HTMLElement, theme: AppSettings["appearance"] extends infer A ? (A extends { theme?: infer T } ? T : never) : never) => {
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const resolved = theme === "dark" ? "dark" : theme === "light" ? "light" : prefersDark ? "dark" : "light";
  root.dataset.theme = resolved;
  // Drive scheme-aware styling (used by the markdown-view styles).
  try {
    root.style.colorScheme = resolved;
  } catch {
    // ignore
  }
};

const getSpeechPrompt = async (): Promise<string | null> => {
  const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Recognition) {
    const p = window.prompt("Prompt (for Markdown generation):", "");
    return p?.trim?.() ? p.trim() : null;
  }

  return await new Promise((resolve) => {
    const rec = new Recognition();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      try {
        rec.stop();
      } catch {
        // ignore
      }
      resolve(value);
    };

    rec.onresult = (e: any) => {
      const text = String(e?.results?.[0]?.[0]?.transcript || "").trim();
      finish(text || null);
    };
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);

    try {
      rec.start();
    } catch {
      finish(null);
    }
  });
};

const readMdFromUrlIfPossible = async (candidate: string): Promise<string | null> => {
  const s = candidate.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!MARKDOWN_EXTENSION_PATTERN.test(u.pathname)) return null;
    const res = await fetch(u.href, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};

const extractTextFromDataTransfer = async (dt: DataTransfer): Promise<string | null> => {
  try {
    const uriList = dt.getData("text/uri-list");
    if (uriList?.trim()) return uriList.trim();
  } catch {
    // ignore
  }
  try {
    const text = dt.getData("text/plain");
    if (text?.trim()) return text;
  } catch {
    // ignore
  }
  return null;
};

export const mountBasicApp = (mountElement: HTMLElement, options: BasicAppOptions = {}) => {
  const root = H`<div class="basic-app" />` as HTMLElement;
  mountElement.replaceChildren(root);

  const ext = isLikelyExtension();
  defineBasicMarkdownView();

  const state = {
    view: (options.initialView || "markdown") as BasicView,
    markdown: /*safeJsonParse<string>*/(localStorage.getItem("rs-basic-markdown")/*, DEFAULT_MD*/) ?? options.initialMarkdown ?? DEFAULT_MD,
    editing: false,
    busy: false,
    message: "",
    history: safeJsonParse<HistoryEntry[]>(localStorage.getItem(HISTORY_KEY), []),
    lastSavedTheme: "auto" as AppSettings["appearance"] extends { theme?: infer T } ? (T extends string ? T : "auto") : "auto",
  };

  const persistMarkdown = () => {
    try {
      if (state.markdown) localStorage.setItem("rs-basic-markdown", state.markdown);
    } catch {
      // ignore
    }
  };

  const persistHistory = () => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-50)));
    } catch {
      // ignore
    }
  };

  const toolbar = H`<div class="toolbar">
    <div class="left">
      <button class="btn" data-action="view-markdown" type="button">Markdown</button>
      <button class="btn" data-action="view-settings" type="button">Settings</button>
      <button class="btn" data-action="view-history" type="button">History</button>
    </div>
    <div class="right">
      ${ext ? H`<button class="btn" data-action="snip" type="button">Snip</button>` : ""}
      <button class="btn" data-action="open-md" type="button">Open</button>
      <button class="btn" data-action="export-md" type="button">Export</button>
      <button class="btn" data-action="toggle-edit" type="button">Edit</button>
      <button class="btn" data-action="voice" type="button">Voice</button>
    </div>
  </div>` as HTMLElement;

  const statusLine = H`<div class="status" aria-live="polite"></div>` as HTMLElement;
  const content = H`<div class="content"></div>` as HTMLElement;
  root.append(toolbar, statusLine, content);

  const fileInput = H`<input class="file-input" type="file" accept=".md,text/markdown,text/plain" />` as HTMLInputElement;
  fileInput.style.display = "none";
  root.append(fileInput);

  const renderStatus = () => {
    statusLine.textContent = state.message || (state.busy ? "Working…" : "");
    root.toggleAttribute("data-busy", state.busy);
  };

  const renderMarkdownView = async () => {
    const editor = H`<textarea class="markdown-editor" spellcheck="false"></textarea>` as HTMLTextAreaElement;
    editor.value = state.markdown || "";
    const previewHost = H`<div class="markdown-preview" />` as HTMLElement;
    const mdView = document.createElement("basic-md-view") as unknown as BasicMarkdownView;
    previewHost.append(mdView as unknown as Node);
    const wrapper = H`<div class="markdown-view"></div>` as HTMLElement;
    wrapper.append(editor, previewHost);

    const updatePreview = async () => {
      state.markdown = editor.value || "";
      persistMarkdown();
      await mdView.setMarkdown(state.markdown);
    };

    const isMobile = typeof window !== "undefined" && window.matchMedia?.("(max-inline-size: 720px)")?.matches;
    const mode = isMobile ? (state.editing ? "edit" : "view") : state.editing ? "split" : "view";
    wrapper.dataset.mode = mode;

    const applyMarkdown = async (text: string, src?: string) => {
      const md = text || "";
      state.markdown = md;
      editor.value = md;
      persistMarkdown();
      saveLastSrc(src?.trim?.() || "");
      await mdView.setMarkdown(md);
    };

    const tryConsumeFile = async (file: File | null | undefined) => {
      if (!file) return false;
      const name = String(file.name || "");
      if (!MARKDOWN_EXTENSION_PATTERN.test(name) && !String(file.type || "").includes("markdown") && !String(file.type || "").includes("text")) {
        return false;
      }
      const text = await file.text();
      await applyMarkdown(text);
      return true;
    };

    const handlePaste = async (e: ClipboardEvent) => {
      if (state.view !== "markdown") return;
      const dt = e.clipboardData;
      if (!dt) return;

      const files = Array.from(dt.files || []);
      if (files.length) {
        e.preventDefault();
        if (await tryConsumeFile(files[0])) return;
      }

      const raw = dt.getData("text/plain") || "";
      if (!raw.trim()) return;
      e.preventDefault();

      const fromUrl = await readMdFromUrlIfPossible(raw);
      if (fromUrl != null) {
        await applyMarkdown(fromUrl, raw);
        return;
      }
      await applyMarkdown(raw);
    };

    const handleDrop = async (e: DragEvent) => {
      if (state.view !== "markdown") return;
      const dt = e.dataTransfer;
      if (!dt) return;
      e.preventDefault();

      const files = Array.from(dt.files || []);
      if (files.length) {
        if (await tryConsumeFile(files[0])) return;
      }

      const raw = (await extractTextFromDataTransfer(dt)) || "";
      if (!raw.trim()) return;

      const fromUrl = await readMdFromUrlIfPossible(raw);
      if (fromUrl != null) {
        await applyMarkdown(fromUrl, raw);
        return;
      }
      await applyMarkdown(raw);
    };

    const allowDrop = (e: DragEvent) => {
      if (state.view !== "markdown") return;
      e.preventDefault();
    };

    editor.addEventListener("input", () => {
      void updatePreview();
    });

    // Paste/drop should work even in "view-only" mode, so we attach to the wrapper.
    wrapper.addEventListener("paste", (e) => void handlePaste(e as ClipboardEvent));
    wrapper.addEventListener("dragover", allowDrop);
    wrapper.addEventListener("drop", (e) => void handleDrop(e));

    await updatePreview();
    return wrapper;
  };

  const renderHistoryView = () => {
    const list = H`<div class="history-list" />` as HTMLElement;

    if (!state.history.length) {
      list.append(H`<div class="empty">No history yet.</div>` as HTMLElement);
      return list;
    }

    const items = state.history
      .slice()
      .reverse()
      .slice(0, 25)
      .map((h) => {
        const time = new Date(h.ts).toLocaleString();
        const title = h.ok ? "OK" : "Failed";
        const item = H`<div class="history-item">
          <div class="meta">
            <span class="tag ${h.ok ? "ok" : "fail"}">${title}</span>
            <span class="time">${time}</span>
          </div>
          <div class="prompt"></div>
          <div class="actions">
            <button class="btn small" type="button" data-action="apply">Apply</button>
            <button class="btn small" type="button" data-action="copy">Copy</button>
          </div>
        </div>` as HTMLElement;

        const prompt = item.querySelector(".prompt") as HTMLElement | null;
        if (prompt) prompt.textContent = h.prompt || "";

        const applyBtn = item.querySelector('[data-action="apply"]') as HTMLButtonElement | null;
        applyBtn?.addEventListener("click", () => {
          state.markdown = h.after || "";
          persistMarkdown();
          saveLastSrc("");
          state.view = "markdown";
          void render();
        });

        const copyBtn = item.querySelector('[data-action="copy"]') as HTMLButtonElement | null;
        copyBtn?.addEventListener("click", () => {
          const text = h.after || "";
          writeText(text).catch(() => void 0);
        });

        return item;
      });

    items.forEach((el) => list.append(el));
    return list;
  };

  const exportMarkdown = () => {
    const blob = new Blob([state.markdown || ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crossword-${Date.now()}.md`;
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 250);
  };

  const runPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    state.busy = true;
    state.message = "Generating markdown…";
    renderStatus();

    const before = state.markdown || "";
    const instructions =
      "Generate a NEW markdown document.\n" +
      "Requirements:\n" +
      "- Output ONLY markdown.\n" +
      "- Use the prompt and the current markdown as context.\n" +
      "- Keep it concise, structured with headings and lists.\n" +
      "- If you need to keep prior content, integrate it rather than repeating verbatim.\n";

    const input = [
      {
        role: "user",
        content: `Prompt:\n${promptText}\n\nCurrent markdown:\n${before}`,
      },
    ];

    try {
      const res = await recognizeByInstructions(input, instructions);
      const after = res?.ok && res?.data ? String(res.data) : "";

      state.history.push({
        ts: Date.now(),
        prompt: promptText,
        before,
        after: after || before,
        ok: Boolean(res?.ok && after),
        error: res?.ok ? undefined : res?.error || "Failed",
      });
      persistHistory();

      if (after) {
        state.markdown = after;
        persistMarkdown();
        saveLastSrc("");
        state.message = "Done.";
      } else {
        state.message = res?.error || "No output.";
      }
    } catch (e) {
      state.history.push({
        ts: Date.now(),
        prompt: promptText,
        before,
        after: before,
        ok: false,
        error: String(e),
      });
      persistHistory();
      state.message = String(e);
    } finally {
      state.busy = false;
      renderStatus();
      void render();
      setTimeout(() => {
        if (state.message === "Done.") {
          state.message = "";
          renderStatus();
        }
      }, 1200);
    }
  };

  const render = async () => {
    content.replaceChildren();

    if (state.view === "settings") {
      const settingsEl = createSettingsView({
        isExtension: isLikelyExtension(),
        onTheme: (t) => applyTheme(root, t),
      });
      content.append(settingsEl);
      renderStatus();
      return;
    }

    if (state.view === "history") {
      content.append(renderHistoryView());
      renderStatus();
      return;
    }

    content.append(await renderMarkdownView());
    renderStatus();
  };

  toolbar.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest?.("button[data-action]") as HTMLButtonElement | null;
    const action = btn?.dataset?.action;
    if (!action) return;

    if (action === "view-markdown") state.view = "markdown";
    if (action === "view-settings") state.view = "settings";
    if (action === "view-history") state.view = "history";

    if (action === "open-md") fileInput.click();
    if (action === "export-md") exportMarkdown();

    if (action === "toggle-edit") {
      if (state.view !== "markdown") return;
      state.editing = !state.editing;
    }

    if (action === "snip") {
      if (!ext) return;
      try {
        chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs: any[]) => {
          const tabId = tabs?.[0]?.id;
          if (tabId != null) {
            chrome.tabs.sendMessage(tabId, { type: "START_SNIP" })?.catch?.(() => void 0);
          }
          try {
            window.close?.();
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
    }

    if (action === "voice") {
      void (async () => {
        const p = await getSpeechPrompt();
        if (!p) return;
        await runPrompt(p);
      })();
    }

    void render();
  });

  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    void f
      .text()
      .then((text) => {
        state.markdown = text || "";
        persistMarkdown();
        saveLastSrc("");
        state.view = "markdown";
        void render();
      })
      .catch(() => void 0)
      .finally(() => {
        fileInput.value = "";
      });
  });

  void loadSettings()
    .then((s) => {
      state.lastSavedTheme = (s?.appearance?.theme as any) || "auto";
      applyTheme(root, state.lastSavedTheme);
    })
    .catch(() => applyTheme(root, "auto" as any));

  // In PWA / regular web app: if the last opened markdown was a URL, try to refresh it.
  // If offline, cached `rs-basic-markdown` will remain.
  //if (!options.initialMarkdown) {
    const lastSrc = loadLastSrc();
    if (lastSrc) {
        void readMdFromUrlIfPossible(lastSrc).then((text) => {
            if (!text) return;
            state.markdown = text;
            persistMarkdown();
            void render();
        });
    }
    //}

  void render();
};



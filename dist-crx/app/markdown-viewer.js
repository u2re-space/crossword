import { crxFrontend } from '../modules/crx-entry.js';
import '../modules/Settings.js';
import '../modules/Env.js';
import '../modules/UnifiedMessaging.js';
import '../modules/templates.js';

const rawPre = document.getElementById("raw-md");
const appDiv = document.getElementById("app");
const VIRTUAL_VIEW_TOKEN = "${view}";
const loadFromSessionKey = async (key) => {
  try {
    const data = await chrome.storage?.session?.get?.(key);
    const text = data?.[key];
    if (typeof text === "string" && text.trim()) return text;
  } catch (e) {
    console.warn("[Viewer] session storage read failed:", e);
  }
  return null;
};
const fetchViaServiceWorker = (src) => {
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
const fetchDirect = async (src) => {
  try {
    const res = await fetch(src, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};
const loadMarkdown = async (src, sessionKey) => {
  if (sessionKey) {
    const text2 = await loadFromSessionKey(sessionKey);
    if (text2) return text2;
  }
  const swResult = await fetchViaServiceWorker(src);
  if (swResult.ok && swResult.key) {
    const text2 = await loadFromSessionKey(swResult.key);
    if (text2) return text2;
  }
  const text = await fetchDirect(src);
  if (text) return text;
  return `> Failed to load markdown from:
> ${src}`;
};
const isVirtualViewValue = (value) => {
  const normalized = (value || "").trim().toLowerCase();
  return !normalized || normalized === VIRTUAL_VIEW_TOKEN || normalized === "view" || normalized === "current" || normalized === "active";
};
const isBrowsableUrl = (url) => {
  if (!url) return false;
  return !url.startsWith("chrome-extension:") && !url.startsWith("chrome://") && !url.startsWith("about:") && !url.startsWith("edge://");
};
const looksLikeMarkdownSourceUrl = (url) => /\.(?:md|markdown|mdown|mkd|mkdn|mdtxt|mdtext)(?:$|[?#])/i.test(url);
const resolveSourceFromOpenTabs = async () => {
  try {
    const currentTab = await chrome.tabs.getCurrent();
    const currentTabId = currentTab?.id;
    const tabs = await chrome.tabs.query({ lastFocusedWindow: true });
    const candidates = tabs.filter((tab) => typeof tab.id === "number" && tab.id !== currentTabId).map((tab) => tab.url).filter((url) => Boolean(url && isBrowsableUrl(url)));
    const markdownCandidate = candidates.find(looksLikeMarkdownSourceUrl);
    return markdownCandidate || candidates[0] || null;
  } catch {
    return null;
  }
};
const resolveSource = async (params) => {
  const explicitSource = params.get("src");
  if (explicitSource && !isVirtualViewValue(explicitSource)) {
    return explicitSource;
  }
  const sourceFromView = params.get("view-src") || params.get("view");
  if (sourceFromView && !isVirtualViewValue(sourceFromView)) {
    return sourceFromView;
  }
  return resolveSourceFromOpenTabs();
};
const resolveTargetView = (params) => {
  const requestedView = params.get("launch-view") || params.get("view") || "viewer";
  if (isVirtualViewValue(requestedView)) {
    return "viewer";
  }
  return requestedView;
};
const collectViewParams = (params) => {
  const collected = {};
  for (const [key, value] of params.entries()) {
    collected[key] = value;
  }
  return collected;
};
const hideRawLayer = () => {
  if (rawPre) rawPre.style.display = "none";
};
const showRawState = (message) => {
  if (!rawPre) return;
  rawPre.style.display = "";
  rawPre.hidden = false;
  rawPre.textContent = message;
};
const init = async () => {
  if (!appDiv) {
    throw new Error("Missing #app mount element");
  }
  showRawState("Loading...");
  const params = new URLSearchParams(location.search);
  const mdk = params.get("mdk");
  const filename = params.get("filename") || void 0;
  const appendContent = params.get("append") || params.get("extra") || "";
  const directContent = params.get("content") || params.get("text");
  const source = await resolveSource(params);
  let markdown = "";
  if (directContent) {
    markdown = directContent;
  } else if (source) {
    markdown = await loadMarkdown(source, mdk);
  } else if (mdk) {
    markdown = await loadFromSessionKey(mdk) || "";
  }
  if (appendContent) {
    markdown = markdown ? `${markdown}

${appendContent}` : appendContent;
  }
  if (!markdown.trim()) {
    markdown = "# No content\n\nOpen a markdown file or navigate to a `.md` URL.";
  }
  await crxFrontend(appDiv, {
    initialView: resolveTargetView(params),
    viewParams: collectViewParams(params),
    viewPayload: {
      text: markdown,
      content: markdown,
      filename,
      source: source || void 0,
      args: collectViewParams(params)
    }
  });
  hideRawLayer();
};
void init().catch((e) => {
  console.error("[Viewer] init failed:", e);
  showRawState(`Failed to initialize viewer: ${e}`);
});
//# sourceMappingURL=markdown-viewer.js.map

import type { BasicAppOptions } from "./Main";
import { mountBasicApp } from "./Main";

export default function frontend(mountElement: HTMLElement, options: BasicAppOptions = {}) {
  // Check for markdown content in URL parameters (from launch queue or direct links)
  const urlParams = new URLSearchParams(window.location.search);
  const markdownContent = urlParams.get('markdown-content');
  const markdownFilename = urlParams.get('markdown-filename');

  if (markdownContent) {
    console.log('[Basic] Loading markdown content from URL parameters');

    // Set the initial view to markdown viewer and pass the content
    options.initialView = 'markdown-viewer';
    options.initialMarkdown = markdownContent;

    // Clean up URL parameters after reading them
    const url = new URL(window.location.href);
    url.searchParams.delete('markdown-content');
    url.searchParams.delete('markdown-filename');
    window.history.replaceState({}, '', url.pathname + url.hash);
  }

  mountBasicApp(mountElement, options);
}



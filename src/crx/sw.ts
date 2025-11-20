import { enableCapture } from "./service/api";
import { handleMakeTimeline } from "@rs-core/service/AI-ops/Orchestrator";

enableCapture(chrome);

// Handle messages from Extension UI or Content Scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MAKE_TIMELINE') {
        const source = message.source || null;
        handleMakeTimeline(source).then((result) => {
            sendResponse(result);
        });
        return true; // Indicates that the response is asynchronous
    }
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "recognize-content",
        title: "Recognize Content (AI)",
        contexts: ["selection", "page", "image"]
    });
    
    // Add settings shortcut if needed, though it's usually in the popup
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "recognize-content") {
        if (tab?.id) {
             chrome.tabs.sendMessage(tab.id, { type: "RECOGNIZE_CONTENT", info });
        }
    }
});

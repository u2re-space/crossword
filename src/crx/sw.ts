import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { enableCapture } from "./service/api";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";

//
enableCapture(chrome);

// Handle messages from Extension UI or Content Scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MAKE_TIMELINE') {
        const source = message.source || null;
        const speechPrompt = message.speechPrompt || null;
        createTimelineGenerator(source, speechPrompt).then(async (gptResponses) => {
            sendResponse(await (requestNewTimeline(gptResponses as GPTResponses) as unknown as any[] || []));
        }).catch((error) => {
            console.error("Timeline generation failed:", error);
            sendResponse({ error: error.message });
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
             chrome.tabs.sendMessage(tab.id, { type: "RECOGNIZE_CONTENT", info }).catch(err => {
                 console.warn("Could not send message to tab", tab.id, err);
             });
        }
    }
});

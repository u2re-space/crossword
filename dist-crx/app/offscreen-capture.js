"use strict";
const canvas = document.getElementById("capture-canvas");
const ctx = canvas.getContext("2d");
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "capture-desktop" && message.streamId) {
    try {
      console.log("[Offscreen] Starting desktop capture...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: message.streamId,
            maxWidth: 4096,
            maxHeight: 2160
          }
        }
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      const blob = await new Promise(
        (resolve) => canvas.toBlob(resolve, "image/png", 1)
      );
      const arrayBuffer = await blob.arrayBuffer();
      console.log("[Offscreen] Desktop capture completed, size:", arrayBuffer.byteLength);
      sendResponse({ success: true, imageData: arrayBuffer });
    } catch (error) {
      console.error("[Offscreen] Desktop capture failed:", error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return true;
});
//# sourceMappingURL=offscreen-capture.js.map

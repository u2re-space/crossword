"use strict";
const getRuntimeLocation = () => globalThis?.location;
const getRuntimeLocationOrigin = () => getRuntimeLocation()?.origin;
const getRuntimeLocationHref = () => getRuntimeLocation()?.href || "";
const getRuntimeLocationSearch = () => getRuntimeLocation()?.search || "";
const canParseURL = (value, base) => {
  const source = value?.trim?.() || "";
  if (!source) return false;
  const fallbackBase = base ?? getRuntimeLocationOrigin();
  if (typeof URL?.canParse === "function") {
    return URL.canParse(source, fallbackBase);
  }
  try {
    new URL(source, fallbackBase);
    return true;
  } catch {
    return false;
  }
};
const scheduleFrame = (cb) => {
  if (typeof globalThis?.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(cb);
    return;
  }
  globalThis.setTimeout(cb, 0);
};

export { canParseURL, scheduleFrame };
//# sourceMappingURL=Runtime2.js.map

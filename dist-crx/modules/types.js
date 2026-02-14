"use strict";
function createViewState(key) {
  return {
    load() {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
      }
    }
  };
}
function createLoadingElement(message = "Loading...") {
  const el = document.createElement("div");
  el.className = "view-loading";
  el.innerHTML = `
        <div class="view-loading__spinner"></div>
        <span class="view-loading__text">${message}</span>
    `;
  return el;
}
function createErrorElement(message, retryFn) {
  const el = document.createElement("div");
  el.className = "view-error";
  el.innerHTML = `
        <div class="view-error__icon">⚠️</div>
        <h3 class="view-error__title">Error</h3>
        <p class="view-error__message">${message}</p>
        ${retryFn ? '<button class="view-error__retry" type="button">Try Again</button>' : ""}
    `;
  if (retryFn) {
    const btn = el.querySelector(".view-error__retry");
    btn?.addEventListener("click", retryFn);
  }
  return el;
}

export { createViewState };
//# sourceMappingURL=types.js.map

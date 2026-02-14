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

export { createViewState };
//# sourceMappingURL=types.js.map

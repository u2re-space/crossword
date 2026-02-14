"use strict";
const StorageKeys = {
  // User preferences
  FRONTEND_CHOICE: "rs-frontend-choice",
  FRONTEND_REMEMBER: "rs-frontend-choice-remember",
  THEME: "rs-theme",
  SETTINGS: "rs-settings",
  // Boot preferences
  BOOT_STYLE: "rs-boot-style",
  BOOT_SHELL: "rs-boot-shell",
  BOOT_VIEW: "rs-boot-view",
  BOOT_REMEMBER: "rs-boot-remember",
  // Shell preferences
  SHELL_CHOICE: "rs-shell-choice",
  SHELL_REMEMBER: "rs-shell-remember",
  // View state
  WORKCENTER_STATE: "rs-workcenter-state",
  VIEWER_STATE: "rs-viewer-state",
  EDITOR_STATE: "rs-editor-state",
  EXPLORER_STATE: "view-explorer-state",
  EXPLORER_PATH: "view-explorer-path",
  // Content
  LAST_MARKDOWN: "rs-last-markdown",
  HISTORY: "rs-history",
  RECENT_FILES: "rs-recent-files",
  // AI Config
  AI_CONFIG: "rs-ai-config"
};
function getItem(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}
function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
function getString(key, defaultValue = "") {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}
function setString(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
function isLocalStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
function getSessionItem(key, defaultValue) {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}
function setSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
const DEFAULT_DB_NAME = "crossword-storage";
const DEFAULT_STORE_NAME = "keyvalue";
const DB_VERSION = 1;
let dbPromise = null;
function getDB(dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME) {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
  return dbPromise;
}
async function getIDBItem(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_STORE_NAME, "readonly");
      const store = tx.objectStore(DEFAULT_STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  } catch {
    return null;
  }
}
async function setIDBItem(key, value) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_STORE_NAME, "readwrite");
      const store = tx.objectStore(DEFAULT_STORE_NAME);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}
async function removeIDBItem(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DEFAULT_STORE_NAME, "readwrite");
      const store = tx.objectStore(DEFAULT_STORE_NAME);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}
class IDBStorage {
  dbName;
  storeName;
  db = null;
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
  }
  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }
  async get(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  async set(id, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put({ id, ...value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  async delete(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  async getAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
  async clear() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  close() {
    this.db?.close();
    this.db = null;
  }
}
const workCenterStorage = new IDBStorage("rs-workcenter", "data");
const historyStorage = new IDBStorage("rs-history", "entries");
const settingsStorage = new IDBStorage("rs-settings", "config");

export { getItem, getString, setItem, setString };
//# sourceMappingURL=index18.js.map

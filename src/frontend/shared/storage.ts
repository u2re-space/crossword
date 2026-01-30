/**
 * Storage Utilities
 * 
 * Unified storage utilities for persistent state.
 */

// ============================================================================
// LOCAL STORAGE
// ============================================================================

/**
 * Safe localStorage get
 */
export function getItem<T>(key: string, defaultValue: T): T {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return defaultValue;
        return JSON.parse(stored) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Safe localStorage set
 */
export function setItem<T>(key: string, value: T): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * Safe localStorage remove
 */
export function removeItem(key: string): boolean {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get raw string from localStorage
 */
export function getString(key: string, defaultValue = ""): string {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Set raw string to localStorage
 */
export function setString(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// SESSION STORAGE
// ============================================================================

/**
 * Safe sessionStorage get
 */
export function getSessionItem<T>(key: string, defaultValue: T): T {
    try {
        const stored = sessionStorage.getItem(key);
        if (stored === null) return defaultValue;
        return JSON.parse(stored) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Safe sessionStorage set
 */
export function setSessionItem<T>(key: string, value: T): boolean {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// INDEXED DB (Simple Key-Value)
// ============================================================================

const DB_NAME = "crossword-storage";
const STORE_NAME = "keyvalue";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
    
    return dbPromise;
}

/**
 * Get value from IndexedDB
 */
export async function getIDBItem<T>(key: string): Promise<T | null> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result ?? null);
        });
    } catch {
        return null;
    }
}

/**
 * Set value in IndexedDB
 */
export async function setIDBItem<T>(key: string, value: T): Promise<boolean> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(value, key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    } catch {
        return false;
    }
}

/**
 * Remove value from IndexedDB
 */
export async function removeIDBItem(key: string): Promise<boolean> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    } catch {
        return false;
    }
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Common storage keys used across the app
 */
export const StorageKeys = {
    // Shell preferences
    SHELL_CHOICE: "rs-shell-choice",
    SHELL_REMEMBER: "rs-shell-remember",
    THEME: "rs-theme",
    
    // View state
    VIEWER_STATE: "rs-viewer-state",
    EDITOR_STATE: "rs-editor-state",
    WORKCENTER_STATE: "rs-workcenter-state",
    EXPLORER_PATH: "rs-explorer-path",
    
    // Content
    LAST_MARKDOWN: "rs-last-markdown",
    HISTORY: "rs-history",
    
    // Settings
    SETTINGS: "rs-settings",
    AI_CONFIG: "rs-ai-config"
} as const;

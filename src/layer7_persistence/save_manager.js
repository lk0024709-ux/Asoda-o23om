/* ============================================================================
   Layer 7 — Persistence: IndexedDB Save/Load Engine & Settings Profiles
   Stores BharatVerse progress in IndexedDB ("BharatVerseDB") with graceful
   localStorage fallback for PWA / Android WebView reliability.
   ============================================================================ */

const DB_NAME = "BharatVerseDB";
const DB_VERSION = 1;
const STORE_NAME = "saves";
const SLOT_KEY = "aarav_primary";
const LS_FALLBACK_KEY = "bharatverse_save_v1";

export class SaveManager {
  constructor() {
    this._dbPromise = null;
  }

  _openDB() {
    if (typeof indexedDB === "undefined") return Promise.resolve(null);
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
    return this._dbPromise;
  }

  async save(payload) {
    const data = {
      ...payload,
      savedAt: Date.now()
    };

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
      }
    } catch (_) {}

    const db = await this._openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(data, SLOT_KEY);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async load() {
    const db = await this._openDB();
    if (db) {
      const fromIdb = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(SLOT_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
      if (fromIdb) return fromIdb;
    }

    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(LS_FALLBACK_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return null;
  }

  async clear() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(LS_FALLBACK_KEY);
      }
    } catch (_) {}

    const db = await this._openDB();
    if (!db) return;
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(SLOT_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }
}

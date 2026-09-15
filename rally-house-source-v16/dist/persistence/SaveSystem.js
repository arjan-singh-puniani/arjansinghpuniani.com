import { CURRENT_SAVE_VERSION } from './migrations.js';
export class SaveConflictError extends Error {
    constructor() { super('Another tab saved a newer club. Reload that save, or export this tab before closing it.'); this.name = 'SaveConflictError'; }
}
const stamp = (v) => v ? `${v.savedAt}:${v.revision ?? 0}:${v.sessionId ?? 'legacy'}` : 'empty';
/** Compare-and-swap in IndexedDB; Web Locks serialize the fallback across cooperating tabs. */
export class SaveSystem {
    key;
    version;
    pending = Promise.resolve();
    loaded = false;
    primaryStamp = 'empty';
    fallbackStamp = 'empty';
    revision = 0;
    timestamp = 0;
    sessionId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random()}`;
    conflicts = 0;
    constructor(key = 'rally-house-save-v2', version = CURRENT_SAVE_VERSION) {
        this.key = key;
        this.version = version;
    }
    save(state) {
        const snapshot = structuredClone(state);
        const write = async (locked = false) => {
            if (!this.loaded)
                await this.load();
            const env = { version: this.version, savedAt: Math.max(Date.now(), this.timestamp + 1), revision: this.revision + 1, sessionId: this.sessionId, state: snapshot };
            if (this.loaded && stamp(this.readFallback()) !== this.fallbackStamp)
                throw this.conflict();
            try {
                await this.idbPut(env);
            }
            catch (e) {
                if (e instanceof SaveConflictError || e instanceof ProtectedSaveError)
                    throw e;
                // A read/check/write fallback is unsafe without a cross-tab mutex. Fail closed.
                if (!locked)
                    throw new Error('Safe fallback storage is unavailable. Keep this tab open.');
                const current = this.readFallback();
                if (this.loaded && stamp(current) !== this.fallbackStamp)
                    throw this.conflict();
                localStorage.setItem(this.key, JSON.stringify(env));
                this.fallbackStamp = stamp(env);
            }
            this.revision = env.revision;
            this.timestamp = env.savedAt;
            this.loaded = true;
        };
        const task = async () => { await (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request(`rally-house:${this.key}`, () => write(true)) : write(false)); };
        this.pending = this.pending.catch(() => { }).then(task);
        return this.pending;
    }
    conflict() { this.conflicts++; return new SaveConflictError(); }
    validate(v) {
        if (!v)
            return;
        if (!Number.isSafeInteger(v.version) || !Number.isFinite(v.savedAt) || !v.state || (v.revision !== undefined && (!Number.isSafeInteger(v.revision) || v.revision < 0)) || (v.sessionId !== undefined && typeof v.sessionId !== 'string'))
            throw new ProtectedSaveError('The saved club is unreadable. Storage has been left untouched.');
        if (v.version > this.version)
            throw new ProtectedSaveError('This club needs a newer Rally House version. Your save has been left untouched.');
    }
    readFallback() { let v = null; try {
        const raw = localStorage.getItem(this.key);
        if (raw)
            v = JSON.parse(raw);
    }
    catch {
        throw new ProtectedSaveError('The saved club is unreadable. Storage has been left untouched.');
    } this.validate(v); return v; }
    async load() {
        let primary = null, primaryFailed = false;
        try {
            primary = await this.idbGet();
        }
        catch {
            primaryFailed = true;
        }
        const fallback = this.readFallback();
        this.validate(primary);
        if (!primary && !fallback && primaryFailed)
            throw new Error('Browser storage could not be read. No saved club has been replaced.');
        const latest = [primary, fallback].filter((v) => v !== null).sort((a, b) => b.savedAt - a.savedAt || (b.revision ?? 0) - (a.revision ?? 0))[0] ?? null;
        this.primaryStamp = stamp(primary);
        this.fallbackStamp = stamp(fallback);
        this.revision = Math.max(primary?.revision ?? 0, fallback?.revision ?? 0);
        this.timestamp = latest?.savedAt ?? 0;
        this.loaded = true;
        return latest;
    }
    async clear() {
        const task = async () => { const latest = await this.idbGet(); if (this.loaded && stamp(latest) !== this.primaryStamp)
            throw this.conflict(); if (this.loaded && stamp(this.readFallback()) !== this.fallbackStamp)
            throw this.conflict(); await this.idbDelete(); localStorage.removeItem(this.key); this.primaryStamp = this.fallbackStamp = 'empty'; this.revision = 0; };
        if (typeof navigator === 'undefined' || !navigator.locks)
            throw new Error('Close other tabs before resetting this club in a browser with safe storage support.');
        await navigator.locks.request(`rally-house:${this.key}`, task);
    }
    open() { return new Promise((resolve, reject) => { const req = indexedDB.open('rally-house', 1); let settled = false; const timer = setTimeout(() => { settled = true; reject(new Error('Browser storage did not respond.')); }, 5000); req.onblocked = () => { clearTimeout(timer); settled = true; reject(new Error('Another tab is blocking club storage.')); }; req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('saves'))
        db.createObjectStore('saves'); }; req.onsuccess = () => { clearTimeout(timer); if (settled) {
        req.result.close();
        return;
    } settled = true; resolve(req.result); }; req.onerror = () => { clearTimeout(timer); settled = true; reject(req.error); }; }); }
    async idbPut(v) {
        const db = await this.open();
        return new Promise((res, rej) => {
            const tx = db.transaction('saves', 'readwrite'), store = tx.objectStore('saves'), req = store.get(this.key);
            let reason;
            req.onsuccess = () => { const current = req.result ?? null; try {
                this.validate(current);
                if (this.loaded && stamp(current) !== this.primaryStamp)
                    throw this.conflict();
                store.put(v, this.key);
            }
            catch (e) {
                reason = e;
                tx.abort();
            } };
            tx.oncomplete = () => { this.primaryStamp = stamp(v); db.close(); res(); };
            tx.onerror = () => { db.close(); rej(reason ?? tx.error); };
            tx.onabort = () => { db.close(); rej(reason ?? tx.error ?? new Error('Save transaction was aborted.')); };
        });
    }
    async idbGet() { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('saves', 'readonly'), req = tx.objectStore('saves').get(this.key); let value = null; req.onsuccess = () => value = req.result ?? null; tx.oncomplete = () => { db.close(); res(value); }; tx.onerror = () => { db.close(); rej(tx.error); }; tx.onabort = () => { db.close(); rej(tx.error); }; }); }
    async idbDelete() { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').delete(this.key); tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; tx.onabort = () => { db.close(); rej(tx.error ?? new Error('Save transaction was aborted.')); }; }); }
}
class ProtectedSaveError extends Error {
}

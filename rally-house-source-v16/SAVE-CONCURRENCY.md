# Save concurrency — v16

A save captures an immutable snapshot and queues writes within its tab. Its envelope includes revision and session ID while preserving schema 7 compatibility. IndexedDB compares the stored envelope stamp and the tab’s loaded stamp inside the same read/write transaction. A stale stamp aborts rather than overwriting newer work.

Web Locks serialize cooperating v16 tabs, including the localStorage fallback. Without a cross-tab lock, fallback writes fail closed. On primary-storage failure, a fallback write also compares its loaded stamp before writing. Loading compares both stores and adopts the newest valid envelope. Invalid or future-version storage remains protected.

The game displays a conflict and stops automatic retries. The user can reload the newer club or export the current tab’s snapshot before closing it. Export is explicit; the game does not merge two divergent simulations or silently choose a winner on the user’s behalf.

`qa/presence-browser.mjs` uses two real pages in the same browser context and origin. Both load the same revision and concurrently attempt different writes. Exactly one succeeds; the other receives SaveConflictError. The stored winner is read back. The test repeats with injected IndexedDB write failure to exercise the fallback. This is distinct from the baseline’s two-instances-in-one-page comparison.

Limits: old builds do not implement this protocol. Close older Rally House tabs before opening an existing club in v16. Saves are origin-specific: a different localhost port starts a separate browser save namespace. Physical Safari/private-browsing storage and a user-driven conflict/export workflow still need device testing.

Accepted coaching requests are tracked from request through queue, reservation, practice and completion. A timed-out reservation restores the request; an explicit End action does not. Saving an active lesson preserves a retry key. The bounded coaching trace retains 160 entries for diagnosis. The reproduced failure was interrupted travel after reservation; this does not prove the cause of every historical browser timeout.

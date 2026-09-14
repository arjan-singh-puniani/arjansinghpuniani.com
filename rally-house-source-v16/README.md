# Rally House v16 — Presence & Acting

A playable development candidate focused on people being easier to read: grounded movement, social spacing, quieter listening, reactions that linger, and a few conversations earned by what actually happened. It preserves the club simulation, contact-based coaching, building history and selectable Taylor/Arjan avatars.

**This is not a production certification or a demonstrated attachment success.** Read QA.md and RELEASE-CHECKLIST.md for measured results and remaining gates. The user confirmed they can arrange an independent tester; no responses have been received yet.

## Play

The compiled `dist/` is included. From this folder:

```sh
python3 -m http.server 8076 --bind 127.0.0.1
```

Open http://127.0.0.1:8076/. No npm installation is needed to play. On macOS, `run.command` is another launcher (port 8080). Saves belong to the exact browser origin: host and port matter. Close older builds before using an existing save with this version.

Choose Taylor or Arjan on arrival; Settings → Character changes the selection later. Tap an open floor tile to walk. Drag to pan, scroll/pinch to zoom, and double-click a character for a closer view. Club opens the book; Coach offers practice; Build places a bench, plant, lamp or basket. The club keeps going while you browse. With the canvas focused, 1–4 select the existing members, C opens coaching, B opens building and arrows pan. Escape closes panels and returns focus.

The existing members are Coach Contessa, Lucresia, Leo and Barbara. Internal save IDs remain unchanged for compatibility. Not every visible decorative object is interactive or sit-enabled. This release does not add a universal touch/kick/spin/draw system.

## What changed

The body’s local-to-world transform is corrected: turning now preserves the body instead of shearing it. The distance-driven foot solver is retained. Crowd detours, safe entrance waiting positions and more usable shared-seat spacing reduce overlaps and stalls. The acting layer reads confidence, energy, tone and relationships, with restrained gaze, posture and gesture changes. Witnesses visibly pause and match reactions persist after the result.

Completed events can lead to a witness-based three-person reflection or a later reconciliation after the bench joke. Memory is bounded and repeated ordinary events compress. Culture remains responsive over long play. Saves reject stale concurrent writes; interrupted accepted coaching requests recover instead of disappearing.

## Independent playtest

Give the tester the small `Rally-House-v16-Playtest.zip` and only TESTER-HANDOFF.md before play. Keep HUMAN-PLAYTEST.md and HUMAN-RESPONSES.md for the moderator afterward. The small archive excludes design documents and QA commentary to avoid priming personality answers. It is a playable build, not a hosted public URL; localhost works on the machine running the server.

## Develop and verify

```sh
npm ci
npm test
```

Node 22 and TypeScript 5.9.3 were used. Browser QA additionally requires Playwright and installed browser executables; qa/runtime.mjs supports PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE overrides. No runtime network service, account, paid API or generated portrait asset is required.

Current technical documents: ACTING-SYSTEM.md, DIALOGUE-COMPOSITION.md, MEMORY-RETENTION.md, SAVE-CONCURRENCY.md, CHARACTER-ASSET-PIPELINE.md, LONG-HORIZON-QA.md and DEVICE-QA.md. Older version-labelled documents describe historical builds and are not fresh verification claims. The original canonical v15 ZIP is preserved intact under reference-v15/.

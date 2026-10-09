---
name: faz
description: Picks the next unfinished item from docs/ROADMAP.md, implements it, tests it and marks it done. Use when the user says "next phase", "continue", "/faz" (or in Turkish "sıradaki faz", "devam et").
---

# Phase progression

1. Read `docs/ROADMAP.md`. Identify the phase and item of the first `[ ]` item. If the user named a specific item, take that one.
2. Before implementing the item, read the files it depends on (the structure section of `CLAUDE.md`, the relevant `src/lib/*` files, `docs/API-NOTES.md` if needed).
3. Implement in small, working steps. If you touch the validator (`src/lib/deck/validate.ts`) or deckstring code, write tests first.
4. Verify: `npx tsc --noEmit`, the relevant `npx vitest` file; for UI work, `npm run dev` and a screenshot.
5. When done:
   - Mark the item `[x]` in `docs/ROADMAP.md`.
   - If it is a user-visible change, add a single line to `CHANGELOG.md` → `[Unreleased]`.
   - If all items of the phase are done, check the "Done criterion" one by one and report the result to the user.
6. State the next item in one sentence and wait for approval before starting.

Rules: Don't skip phase order (Phase 3 UI work doesn't start before the Phase 2 pipeline is finished). If an out-of-scope request comes in (Wild, auth, TR), note it in the ROADMAP's "Later phases" section; don't do it now.

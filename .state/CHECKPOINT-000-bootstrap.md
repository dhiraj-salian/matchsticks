# Checkpoint 000 — Bootstrap

- **Goal:** Re-plan the project for the new constraints (Cloudflare-only, free tier, TDD, SOLID, GitHub Actions, secrets, resumable state).
- **Date:** 2026-06-30 21:55 IST
- **Owner:** atlas (orchestrator)
- **Git:** `master` @ HEAD before this checkpoint had no commit; this is the start of the new plan.

## What changed

| File | Change |
|---|---|
| `~/.openclaw/workspace/plans/matchsticks-game-2026-06-29.md` | Full rewrite: phases A–F, file tree, SOLID map, secrets inventory, resume protocol. |
| `~/.openclaw/workspace/projects/matchsticks/PROJECT_STATE.md` | **NEW** — single root state document. |
| `~/.openclaw/workspace/projects/matchsticks/.state/CHECKPOINT-000-bootstrap.md` | **NEW** — this file. |
| `~/.openclaw/workspace/projects/matchsticks/.gitignore` | **NEW** — explicitly blocks `.env*`, `.dev.vars*`, `dist/`, etc. |

## Tests added

- none yet (Phase A1 is the first test commit)

## Decisions made

- **Strategy** pattern for hazards (not chain-of-responsibility — strategies are selected, not requested).
- **Observer** for render/HUD subscriptions to `GameState` — keeps `core/` Three.js-free.
- **Composition root** in `bootstrap/container.js` — only place that imports `three`, DOM, `fetch`.
- **Vitest + @cloudflare/vitest-pool-workers** for worker tests so they run in actual Workers runtime.
- **Playwright** for E2E only (heavier, slower, run after unit/integration in CI).
- **Wrangler versions deploy** (not classic `wrangler deploy`) — gives us rollback for free.

## Inherited by next checkpoint (001)

- Initialize `vitest.config.js`, `playwright.config.js`, `tests/` directory tree.
- Write first failing Vitest test: `tests/unit/core/score-calculator.test.js` covering the formula from ARCHITECTURE.md §6.
- Add npm scripts: `test`, `test:unit`, `test:e2e`, `lint`, `build`.

## Resume command

```bash
cd ~/.openclaw/workspace/projects/matchsticks
cat PROJECT_STATE.md
cat .state/CHECKPOINT-000-bootstrap.md
# Next: forge runs Phase A1 — initialize vitest + playwright + tests/ tree
```

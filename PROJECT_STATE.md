# Project State — Matchsticks

> **Single source of truth** for where this project is right now. Read this first in any session.

Last updated: 2026-06-30 21:59 IST
Current checkpoint: 001-init-and-tests
Current branch: master
CI status: not configured yet
Live URLs: not deployed yet

## Done

- [x] **000-bootstrap** (2026-06-30 21:55) — Re-planned project for Cloudflare-only, TDD, SOLID, GH Actions CI/CD, resumable state.
- [x] **001-init-and-tests** (2026-06-30 21:59) — Vitest + Playwright + ESLint + Prettier initialized. First failing test written (score-calculator, TDD red).

## In Progress

- [ ] **A2** — Implement `src/core/score-calculator.js` to make the failing test pass (TDD green).

## Next

- [ ] **A3** — TDD loop for `core/game-state.js`, `core/physics-stepper.js`.
- [ ] **A5** — Author `.github/workflows/ci.yml`.

## Blocked / Open Questions

- *(none)*

## Key paths (for resume)

| What | Where |
|---|---|
| Plan (master) | `~/.openclaw/workspace/plans/matchsticks-game-2026-06-29.md` |
| Architecture doc | `~/.openclaw/workspace/projects/matchsticks/docs/ARCHITECTURE.md` |
| State (this file) | `~/.openclaw/workspace/projects/matchsticks/PROJECT_STATE.md` |
| Per-checkpoint state | `~/.openclaw/workspace/projects/matchsticks/.state/CHECKPOINT-*.md` |
| Game source | `~/.openclaw/workspace/projects/matchsticks/src/` |
| Worker source | `~/.openclaw/workspace/projects/matchsticks/worker/` |
| CI/CD workflows | `~/.openclaw/workspace/projects/matchsticks/.github/workflows/` |

## GitHub repo secrets required (before Phase E)

These go in **GitHub → repo → Settings → Secrets and variables → Actions**:

- `CF_API_TOKEN` (Cloudflare API token, scoped to Workers + Pages edit)
- `CF_ACCOUNT_ID` (Cloudflare account id)
- `HMAC_SECRET` (`openssl rand -hex 32`, generated once, shared between build and worker)
- `CORS_ALLOW_ORIGIN` (variable: `https://matchsticks.pages.dev`)
- `ENVIRONMENT` (variable: `production`)
- `LEADERBOARD_LIMIT` (variable: `10`)
- `RATE_LIMIT_PER_MIN` (variable: `5`)

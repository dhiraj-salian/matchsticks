# Project State — Matchsticks

> **Single source of truth** for where this project is right now. Read this first in any session.

Last updated: 2026-06-30 22:07 IST
Current checkpoint: 002-repo-extracted-and-a2-green
Current branch: master
CI status: not configured yet
Live URLs: not deployed yet

## Done

- [x] **000-bootstrap** (2026-06-30 21:55) — Re-planned project for Cloudflare-only, TDD, SOLID, GH Actions CI/CD, resumable state.
- [x] **001-init-and-tests** (2026-06-30 21:59) — Vitest + Playwright + ESLint + Prettier initialized. First failing test written (score-calculator, TDD red).
- [x] **002-repo-extracted-and-a2-green** (2026-06-30 22:07) — Matchsticks extracted to dedicated GitHub repo, score-calculator implemented (TDD green).

## In Progress

- [ ] **A3** — TDD loop for `core/game-state.js`, `core/physics-stepper.js`.

## Next

- [ ] **A5** — Author `.github/workflows/ci.yml`.

## Blocked / Open Questions

- **GitHub repo creation requires manual step** — the fine-grained PAT lacks `Administration` write permission to create repos. User needs to create `dhiraj-salian/matchsticks` on GitHub, then `git push origin master` from `~/.openclaw/workspace/matchsticks/`. The remote is already configured.

## Key paths (for resume)

| What | Where |
|---|---|
| Plan (master) | `~/.openclaw/workspace/plans/matchsticks-game-2026-06-29.md` |
| Architecture doc | `~/.openclaw/workspace/matchsticks/docs/ARCHITECTURE.md` |
| State (this file) | `~/.openclaw/workspace/matchsticks/PROJECT_STATE.md` |
| Per-checkpoint state | `~/.openclaw/workspace/matchsticks/.state/CHECKPOINT-*.md` |
| Game source | `~/.openclaw/workspace/matchsticks/src/` |
| Worker source | `~/.openclaw/workspace/matchsticks/worker/` |
| CI/CD workflows | `~/.openclaw/workspace/matchsticks/.github/workflows/` |
| GitHub remote | `git@github.com:dhiraj-salian/matchsticks.git` |

## GitHub repo secrets required (before Phase E)

These go in **GitHub → `dhiraj-salian/matchsticks` → Settings → Secrets and variables → Actions**:

- `CF_API_TOKEN` (Cloudflare API token, scoped to Workers + Pages edit)
- `CF_ACCOUNT_ID` (Cloudflare account id)
- `HMAC_SECRET` (`openssl rand -hex 32`, generated once, shared between build and worker)
- `CORS_ALLOW_ORIGIN` (variable: `https://matchsticks.pages.dev`)
- `ENVIRONMENT` (variable: `production`)
- `LEADERBOARD_LIMIT` (variable: `10`)
- `RATE_LIMIT_PER_MIN` (variable: `5`)

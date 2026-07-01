# Project State — Matchsticks

> **Single source of truth** for where this project is right now. Read this first in any session.

Last updated: 2026-07-01 15:25 IST
Current checkpoint: 004-ci-baseline
Current branch: master (tracking origin/master)
CI status: ✅ passing
Live URLs: not deployed yet
GitHub: https://github.com/dhiraj-salian/matchsticks

## Done

- [x] **000-bootstrap** (2026-06-30 21:55) — Re-planned project for Cloudflare-only, TDD, SOLID, GH Actions CI/CD, resumable state.
- [x] **001-init-and-tests** (2026-06-30 21:59) — Vitest + Playwright + ESLint + Prettier initialized. First failing test written (score-calculator, TDD red).
- [x] **002-repo-extracted-and-a2-green** (2026-06-30 22:10) — Matchsticks extracted to dedicated GitHub repo `dhiraj-salian/matchsticks`, all 3 commits pushed, `src/core/score-calculator.js` implemented (TDD green — 6/6 tests passing, lint clean).
- [x] **003-a3-more-core-modules** (2026-06-30 22:18) — game-state state machine and physics-stepper implemented via TDD. 19 + 9 = 28 new tests passing, lint clean.
- [x] **004-ci-baseline** (2026-07-01 15:25) — `.github/workflows/ci.yml` added (lint + unit + worker + build on every push/PR). CI green on master. Node 22. (A4+A5 collapsed — green CI confirmed.)

## In Progress

- [ ] **B1** — SOLID refactor: extract PlayerController from `src/player.js`

## Next

- [ ] **B2** — Extract HazardStrategy interface; convert existing hazards to strategies

## Blocked / Open Questions

- **Legacy copy at `~/.openclaw/workspace/projects/matchsticks/`** still exists inside the techblog repo (as a safety net during extraction). Safe to delete now that the new repo is live and pushed. Atlas will remove it on next user confirmation.
- **PAT scope note** — the fine-grained GitHub PAT on this box lacks `Administration: write` scope for repo creation AND `mergePullRequest` scope for PR merging. Atlas can push to existing repos but cannot create new ones or merge PRs via `gh`. If we ever need to create another repo, Dhiraj creates it on github.com. PR merges must be done via local git merge + push.

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

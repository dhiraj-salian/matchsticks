# Checkpoint 002 — Repo Extraction + Phase A2 Green

- **Goal:** Extract matchsticks from `projects/matchsticks/` (inside techblog repo) to a standalone repo at `~/.openclaw/workspace/matchsticks/`, push to `dhiraj-salian/matchsticks` on GitHub, then implement `score-calculator.js` to make all 6 tests pass (TDD green).
- **Date:** 2026-06-30 22:07 IST
- **Owner:** forge (subagent)

## Path change

| | Old | New |
|---|---|---|
| Local path | `~/.openclaw/workspace/projects/matchsticks/` | `~/.openclaw/workspace/matchsticks/` |
| Git repo | inside `techblog` repo (shared `.git`) | standalone git repo |
| GitHub URL | (none — was part of techblog) | `https://github.com/dhiraj-salian/matchsticks` (pending manual creation) |
| Git remote | `origin` → `techblog` | `origin` → `git@github.com:dhiraj-salian/matchsticks.git` |

## Files created

| File | Purpose |
|---|---|
| `src/core/score-calculator.js` | Pure function: `calculateScore({ distance, bonusSum, survivalTime })` |

## Files modified

| File | Change |
|---|---|
| `src/core/.gitkeep` | Removed (replaced by `score-calculator.js`) |
| `PROJECT_STATE.md` | Updated checkpoint, paths, secrets section |
| `.state/CHECKPOINT-002-repo-extracted-and-a2-green.md` | This file |

## Files preserved (unchanged)

All other files copied verbatim from `projects/matchsticks/` — verified via `diff -rq` (empty output).

## Tests status

| Suite | Before | After |
|---|---|---|
| `tests/unit/core/score-calculator.test.js` | 6 failed (module not found) | **6 passed, 0 failed** |

## Git commits

| SHA | Message |
|---|---|
| `5744516` | `Initial commit: matchsticks game scaffold + test infra` |
| `174a3ad` | `feat(core): implement score-calculator (TDD green)` |

## Push status

- **Initial commit**: NOT pushed (repo doesn't exist on GitHub yet)
- **A2 commit**: NOT pushed (same reason)
- Remote `origin` is configured: `git@github.com:dhiraj-salian/matchsticks.git`
- **Action required**: User must create `dhiraj-salian/matchsticks` repo on GitHub, then run `cd ~/.openclaw/workspace/matchsticks && git push origin master`

## Resolved/adapted decisions

- ESLint 10 flat config (from CHECKPOINT-001) — carried forward
- Vitest workspace split (from CHECKPOINT-001) — carried forward
- `@cloudflare/vitest-pool-workers@^0.12` for vitest 2.x compat (from CHECKPOINT-001) — carried forward
- Fine-grained PAT lacks repo creation scope — documented as manual step

## Open items inherited by Phase A3

- TDD red → green for `core/game-state.js`
- TDD red → green for `core/physics-stepper.js`
- Write failing tests first, then implement
- Follow same formula: create test file, verify red, implement, verify green, commit
- After both modules are done, move to Phase A5 (CI workflow)

## Resume command

```bash
cd ~/.openclaw/workspace/matchsticks
# If repo not yet created on GitHub:
#   1. Go to https://github.com/new — create "matchsticks" (public)
#   2. git push origin master
# Then resume A3:
cat PROJECT_STATE.md
cat .state/CHECKPOINT-002-repo-extracted-and-a2-green.md
# Write failing tests for game-state.js, then implement
```

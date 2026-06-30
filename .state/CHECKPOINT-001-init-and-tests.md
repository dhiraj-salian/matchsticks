# Checkpoint 001 — Init Test Infra + First Failing Test

- **Goal:** Initialize vitest + playwright + ESLint + Prettier; write the first failing unit test for `core/score-calculator.js` (TDD red).
- **Date:** 2026-06-30 21:59 IST
- **Owner:** forge (subagent)

## Files created

| File | Purpose |
|---|---|
| `vitest.config.js` | Vitest base config (unit include, node env) |
| `vitest.workspace.js` | Workspace projects: `unit` (node) + `worker` (cloudflare pool) |
| `playwright.config.js` | Playwright E2E config — chromium only, baseURL localhost:5173 |
| `eslint.config.js` | ESLint 10 flat config — ESM, browser env, vitest globals |
| `.prettierrc` | 2-space, single quotes, trailing comma all |
| `tests/unit/core/score-calculator.test.js` | 6 failing tests for score formula (TDD red) |
| `tests/unit/{core,hazards,input,net,ui,render}/.gitkeep` | Unit test directory structure |
| `tests/worker/{handlers,services,middleware}/.gitkeep` | Worker test directory structure |
| `tests/e2e/.gitkeep` | E2E test directory |
| `src/core/.gitkeep` | Core module directory (implementation comes in Phase B) |
| `src/interfaces/.gitkeep` | Interface/ports directory |
| `src/bootstrap/.gitkeep` | Composition root directory |

## Files modified

| File | Change |
|---|---|
| `package.json` | Added 9 devDeps + 7 new npm scripts |
| `src/*.js` (8 files) | Formatted with Prettier only (no logic changes) |

## Dev dependencies added

- `vitest@^2.1` — unit test runner
- `@vitest/coverage-v8@^2.1` — coverage
- `jsdom@^29` — DOM environment (future use)
- `@playwright/test@^1.61` — E2E
- `eslint@^10` — linter (flat config)
- `prettier@^3` — formatter
- `@cloudflare/vitest-pool-workers@^0.12` — worker test pool (vitest 2 compatible)
- `wrangler@^4` — Cloudflare Workers CLI
- `globals@^15` — ESLint globals package

## NPM scripts added

```json
{
  "test": "vitest run",
  "test:unit": "vitest run --project unit",
  "test:worker": "vitest run --project worker",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:install": "playwright install --with-deps chromium",
  "lint": "eslint src tests && prettier --check src tests",
  "format": "prettier --write src tests"
}
```

## Tests added (status: FAILING — intentional TDD red)

`tests/unit/core/score-calculator.test.js` — 6 tests, all failing because `src/core/score-calculator.js` does not exist:

1. ✘ distance only, no bonus, no survival time → score = distance
2. ✘ distance + bonus_sum, no survival time → score = distance + bonus
3. ✘ distance + bonus + 60s survival → score = (distance + bonus) * 2
4. ✘ distance + bonus + 120s survival → score = (distance + bonus) * 3
5. ✘ zero distance and zero bonus → score = 0
6. ✘ floating-point distance is handled correctly (epsilon check)

All failures are: `Failed to load url ../../../src/core/score-calculator.js — Does the file exist?`

## Inherited by Phase A2

- Implement `src/core/score-calculator.js` with `calculateScore({ distance, bonusSum, survivalTime })` using formula: `score = (distance + bonusSum) * (1 + survivalTime / 60)`
- After implementation, all 6 tests should pass (TDD green)
- `src/core/` directory already exists with `.gitkeep`

## Resume command

```bash
cd ~/.openclaw/workspace/projects/matchsticks
# Read state
cat PROJECT_STATE.md
cat .state/CHECKPOINT-001-init-and-tests.md
# Implement score-calculator to make tests green
# Then: git add src/core/score-calculator.js && git commit -m "feat(core): implement score-calculator (TDD green)"
```

## Notes / Deviations from plan

- Used `vitest.workspace.js` instead of `projects` array inside `vitest.config.js` — the latter didn't resolve test includes with `--project unit` in vitest 2.x.
- Used `eslint.config.js` (flat config) instead of `.eslintrc.json` — ESLint 10 no longer supports `.eslintrc` format.
- Added `globals` package as devDep — required by ESLint 10 flat config for `globals.browser`.
- `@cloudflare/vitest-pool-workers@^0.12` (not latest) — latest requires vitest 4.x; 0.12.x supports vitest 2.x.
- Prettier-formatted existing `src/*.js` files (no logic changes) so `npm run lint` passes cleanly.
- Git remote points to `techblog` repo — not a dedicated matchsticks repo. Push skipped (will note).

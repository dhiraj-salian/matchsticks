# Checkpoint 003 — A3 More Core Modules (game-state + physics-stepper)

- **Goal:** Implement `core/game-state.js` (state machine) and `core/physics-stepper.js` (fixed-timestep accumulator) via strict TDD (red-green-refactor).
- **Date:** 2026-06-30 22:18 IST
- **Owner:** forge (subagent)

## Files created

| File | Purpose |
|---|---|
| `src/core/game-state.js` | GameState class: START/PLAYING/GAME_OVER state machine, life pool, score, survival time, observer pattern |
| `src/core/physics-stepper.js` | PhysicsStepper class: fixed-timestep accumulator with max-steps-per-frame spiral-of-death prevention |
| `tests/unit/core/game-state.test.js` | 19 tests covering state transitions, life pool, score, survival time, observers |
| `tests/unit/core/physics-stepper.test.js` | 9 tests covering accumulation, rollover, max-steps, onStep callback, step delta accuracy |

## Files modified

| File | Change |
|---|---|
| `src/core/.gitkeep` | Removed (replaced by actual modules) |
| `PROJECT_STATE.md` | Updated checkpoint to 003, marked A3 done, A4 in progress |

## Tests status

| Suite | Count | Status |
|---|---|---|
| `tests/unit/core/score-calculator.test.js` | 6 | ✅ passed |
| `tests/unit/core/game-state.test.js` | 19 | ✅ passed |
| `tests/unit/core/physics-stepper.test.js` | 9 | ✅ passed |
| **Total** | **34** | **all passing** |

## Design decisions

1. **Auto GAME_OVER on life=0** — When `takeDamage()` brings lives to 0 during PLAYING, `GameState` auto-transitions to GAME_OVER. This simplifies the game loop: no external check needed.

2. **MAX_LIVES configurability** — `MAX_LIVES_DEFAULT = 3` is exported as a constant. The constructor accepts `{ maxLives }` to override. This allows difficulty settings in future phases.

3. **Observer subscribe API** — `subscribe(fn)` returns an unsubscribe function. Observers are called with the new state string on every transition. This interface is ready for Phase B wiring (HUD, renderers).

4. **addScore only in PLAYING** — Score represents "during play" effort. Calling `addScore()` in START or GAME_OVER is a silent no-op. Documented in JSDoc.

5. **Accumulator approach** — `accumulate(dt)` returns an array of step deltas (each equal to `timestep`). The caller can iterate or rely on `onStep` callback. This gives the render loop flexibility: it can batch-step or call per-step.

6. **Spiral-of-death prevention** — After emitting `maxStepsPerFrame` steps, any remaining accumulator time is **discarded** (reset to 0). This prevents a long pause from causing runaway catch-up that freezes the game.

7. **Leftover rollover** — If `dt < timestep`, the time accumulates for the next call. Two calls of `accumulate(1/120)` correctly produce 1 step on the second call.

## Git commits

| SHA | Message |
|---|---|
| `ee1d723` | `feat(core): implement game-state state machine (TDD green)` |
| `47dc074` | `feat(core): implement physics-stepper (TDD green)` |

## Resume command for Phase A4

```bash
cd ~/.openclaw/workspace/matchsticks
git log --oneline -8
npm run test:unit
# Next: author .github/workflows/ci.yml (lint + test on push/PR)
```

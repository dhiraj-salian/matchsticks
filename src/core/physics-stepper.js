/**
 * PhysicsStepper — fixed-timestep accumulator for deterministic game physics.
 *
 * Design:
 * - Fixed 60Hz timestep (1/60s ≈ 16.67ms per tick) by default.
 * - `accumulate(dt)` returns an array of step deltas (each equal to `timestep`),
 *   length between 0 and `maxStepsPerFrame`. The render loop calls `onStep(stepDt)`
 *   for each or iterates the array itself.
 * - Leftover time (sub-timestep remainder) rolls over to the next call.
 * - Maximum of `maxStepsPerFrame` steps per call (default 3) to prevent
 *   spiral-of-death after long pauses (e.g. tab switch). Any remainder beyond
 *   the max steps is **discarded** (by design — prevents runaway catch-up).
 *
 * @module core/physics-stepper
 */

/**
 * PhysicsStepper — accumulates real delta time and emits fixed-step ticks.
 */
export class PhysicsStepper {
  /**
   * @param {object} [options]
   * @param {number} [options.timestep=1/60] Fixed physics step in seconds
   * @param {number} [options.maxStepsPerFrame=3] Maximum steps emitted per accumulate() call
   * @param {Function} [options.onStep=()=>{}] Callback invoked once per step with (stepDelta)
   */
  constructor({ timestep = 1 / 60, maxStepsPerFrame = 3, onStep = () => {} } = {}) {
    /** @type {number} Fixed timestep in seconds */
    this._timestep = timestep;

    /** @type {number} Max steps per frame (spiral-of-death prevention) */
    this._maxStepsPerFrame = maxStepsPerFrame;

    /** @type {Function} Per-step callback */
    this._onStep = onStep;

    /** @type {number} Accumulated leftover time from previous frames */
    this._accumulator = 0;
  }

  /**
   * Feed real elapsed time into the accumulator and return an array of
   * fixed-step deltas. Also invokes `onStep` for each step if provided.
   *
   * @param {number} dtSeconds Real elapsed time in seconds since last call
   * @returns {number[]} Array of step deltas (each equal to `timestep`),
   *   length between 0 and `maxStepsPerFrame`
   */
  accumulate(dtSeconds) {
    this._accumulator += dtSeconds;

    const steps = [];
    let stepCount = 0;

    while (this._accumulator >= this._timestep && stepCount < this._maxStepsPerFrame) {
      steps.push(this._timestep);
      this._accumulator -= this._timestep;
      stepCount++;
    }

    // Discard any leftover that exceeds maxStepsPerFrame budget
    // (prevents spiral-of-death: if we had a huge dt, the remainder is dropped)
    if (stepCount === this._maxStepsPerFrame && this._accumulator > 0) {
      this._accumulator = 0;
    }

    // Invoke onStep callback for each step
    for (const stepDelta of steps) {
      this._onStep(stepDelta);
    }

    return steps;
  }
}

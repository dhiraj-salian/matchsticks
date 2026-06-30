import { describe, it, expect, vi } from 'vitest';

// PhysicsStepper — fixed-timestep accumulator
// Module does not exist yet — this is the TDD red phase.

describe('physics-stepper', () => {
  async function getPhysicsStepper() {
    const { PhysicsStepper } = await import('../../../src/core/physics-stepper.js');
    return { PhysicsStepper };
  }

  it('with default timestep (1/60), accumulate(0) returns []', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    const steps = stepper.accumulate(0);
    expect(steps).toEqual([]);
  });

  it('accumulate(1/60) returns 1 step', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    const steps = stepper.accumulate(1 / 60);
    expect(steps).toHaveLength(1);
  });

  it('accumulate(2/60) returns 2 steps', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    const steps = stepper.accumulate(2 / 60);
    expect(steps).toHaveLength(2);
  });

  it('accumulate(1/30) returns 2 steps (1/30 = 2 * 1/60)', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    const steps = stepper.accumulate(1 / 30);
    expect(steps).toHaveLength(2);
  });

  it('long frame: accumulate(1) returns exactly maxStepsPerFrame steps (default 3), drops remainder', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    const steps = stepper.accumulate(1);
    expect(steps).toHaveLength(3);
  });

  it('two calls of accumulate(1/120) accumulate to 1 step on the second call', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper();
    // First call: 1/120 < 1/60 → not enough, returns []
    const steps1 = stepper.accumulate(1 / 120);
    expect(steps1).toEqual([]);
    // Second call: leftover 1/120 + new 1/120 = 2/120 = 1/60 → 1 step
    const steps2 = stepper.accumulate(1 / 120);
    expect(steps2).toHaveLength(1);
  });

  it('constructor accepts custom timestep, maxStepsPerFrame, and onStep', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const onStep = vi.fn();
    const stepper = new PhysicsStepper({
      timestep: 1 / 30,
      maxStepsPerFrame: 5,
      onStep,
    });
    const steps = stepper.accumulate(2 / 30);
    expect(steps).toHaveLength(2);
  });

  it('if onStep is provided, it is called once per step (verify by counting calls)', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const onStep = vi.fn();
    const stepper = new PhysicsStepper({ onStep });
    stepper.accumulate(3 / 60); // 3 steps
    expect(onStep).toHaveBeenCalledTimes(3);
  });

  it('steps emitted have delta equal to the configured timestep', async () => {
    const { PhysicsStepper } = await getPhysicsStepper();
    const stepper = new PhysicsStepper({ timestep: 1 / 60 });
    const steps = stepper.accumulate(2 / 60);
    expect(steps[0]).toBeCloseTo(1 / 60, 10);
    expect(steps[1]).toBeCloseTo(1 / 60, 10);
  });
});

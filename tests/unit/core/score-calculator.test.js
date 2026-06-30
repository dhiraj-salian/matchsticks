import { describe, it, expect } from 'vitest';

// score = (distance + bonus_sum) * (1 + survival_time / 60)
// Implementation does not exist yet — this is the TDD red phase.

describe('score-calculator', () => {
  // Lazy-import so the test file loads but the import fails at test time
  async function getCalculateScore() {
    const { calculateScore } = await import('../../../src/core/score-calculator.js');
    return calculateScore;
  }

  it('distance only, no bonus, no survival time → score = distance', async () => {
    const calculateScore = await getCalculateScore();
    expect(calculateScore({ distance: 1000, bonusSum: 0, survivalTime: 0 })).toBe(1000);
  });

  it('distance + bonus_sum, no survival time → score = distance + bonus', async () => {
    const calculateScore = await getCalculateScore();
    expect(calculateScore({ distance: 1000, bonusSum: 200, survivalTime: 0 })).toBe(1200);
  });

  it('distance + bonus + 60s survival → score = (distance + bonus) * 2', async () => {
    const calculateScore = await getCalculateScore();
    expect(calculateScore({ distance: 1000, bonusSum: 200, survivalTime: 60 })).toBe(2400);
  });

  it('distance + bonus + 120s survival → score = (distance + bonus) * 3', async () => {
    const calculateScore = await getCalculateScore();
    expect(calculateScore({ distance: 1000, bonusSum: 200, survivalTime: 120 })).toBe(3600);
  });

  it('zero distance and zero bonus → score = 0', async () => {
    const calculateScore = await getCalculateScore();
    expect(calculateScore({ distance: 0, bonusSum: 0, survivalTime: 0 })).toBe(0);
  });

  it('floating-point distance is handled correctly (epsilon check)', async () => {
    const calculateScore = await getCalculateScore();
    const result = calculateScore({ distance: 333.7, bonusSum: 66.3, survivalTime: 30 });
    // (333.7 + 66.3) * (1 + 30/60) = 400 * 1.5 = 600
    expect(result).toBeCloseTo(600, 10);
  });
});

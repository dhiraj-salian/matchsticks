/**
 * Score calculator — pure function.
 * Formula: score = (distance + bonusSum) * (1 + survivalTime / 60)
 *
 * @param {object} input
 * @param {number} input.distance    accumulated distance points
 * @param {number} input.bonusSum    sum of pickup bonuses
 * @param {number} input.survivalTime seconds survived
 * @returns {number} computed score
 */
export function calculateScore({ distance, bonusSum, survivalTime }) {
  const base = distance + bonusSum;
  const multiplier = 1 + survivalTime / 60;
  return base * multiplier;
}

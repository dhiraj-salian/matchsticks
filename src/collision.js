/**
 * collision.js — Simple AABB collision detection
 */

/**
 * Test overlap of two axis-aligned bounding boxes.
 * Each box: { minX, maxX, minY, maxY }
 */
export function aabbOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

/**
 * input.js — Keyboard input manager for two players
 * Tracks held keys and edge events (just-pressed, just-released).
 */

const held = new Set();
const justPressed = new Set();

window.addEventListener('keydown', (e) => {
  if (!held.has(e.code)) justPressed.add(e.code);
  held.add(e.code);
  // Prevent arrow keys scrolling the page
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  held.delete(e.code);
});

/** Call once per frame at the end of update to clear just-pressed set */
export function clearFrame() {
  justPressed.clear();
}

/** Is key currently held? */
export function isDown(code) {
  return held.has(code);
}

/** Was key pressed this frame? */
export function justDown(code) {
  return justPressed.has(code);
}

/** Player 1 bindings (WASD + Space for start/interact) */
export const P1 = {
  left: 'KeyA',
  right: 'KeyD',
  up: 'KeyW',
  down: 'KeyS',
  jump: 'KeyW',
  crouch: 'KeyS',
};

/** Player 2 bindings (Arrow keys) */
export const P2 = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  jump: 'ArrowUp',
  crouch: 'ArrowDown',
};

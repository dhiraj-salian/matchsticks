import { describe, it, expect } from 'vitest';

// GameState — state machine with START | PLAYING | GAME_OVER
// Shared life pool, score, survival time, observer pattern.
// Module does not exist yet — this is the TDD red phase.

describe('game-state', () => {
  async function getGameState() {
    const { GameState, MAX_LIVES_DEFAULT } = await import('../../../src/core/game-state.js');
    return { GameState, MAX_LIVES_DEFAULT };
  }

  // --- State machine basics ---

  it('starts in START state', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    expect(gs.state).toBe('START');
  });

  it('start() transitions START → PLAYING', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    expect(gs.state).toBe('PLAYING');
  });

  it('gameOver() transitions PLAYING → GAME_OVER', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.gameOver();
    expect(gs.state).toBe('GAME_OVER');
  });

  it('resetToStart() transitions GAME_OVER → START', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.gameOver();
    gs.resetToStart();
    expect(gs.state).toBe('START');
  });

  it('invalid transition throws with clear message', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start(); // now PLAYING
    expect(() => gs.start()).toThrow(/transition/);
  });

  // --- Life pool ---

  it('takeDamage decrements life pool by 1 (default)', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    const livesBefore = gs.lives;
    gs.takeDamage();
    expect(gs.lives).toBe(livesBefore - 1);
  });

  it('takeDamage with amount=2 decrements by 2', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.takeDamage(2);
    expect(gs.lives).toBe(1); // started at 3, minus 2
  });

  it('takeDamage is no-op when state is START', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    expect(gs.state).toBe('START');
    gs.takeDamage();
    expect(gs.lives).toBe(3); // unchanged
  });

  it('takeDamage is no-op when state is GAME_OVER', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.gameOver();
    gs.takeDamage();
    expect(gs.lives).toBe(3); // unchanged — was in PLAYING when gameOver() called before damage
  });

  it('when life pool reaches 0, state auto-transitions to GAME_OVER', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.takeDamage(3); // 3 - 3 = 0
    expect(gs.state).toBe('GAME_OVER');
  });

  it('life pool is clamped to [0, MAX_LIVES] — cannot go negative', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.takeDamage(5); // more than max lives
    expect(gs.lives).toBe(0);
  });

  it('custom MAX_LIVES via constructor', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState({ maxLives: 5 });
    expect(gs.lives).toBe(5);
    gs.start();
    gs.takeDamage(5);
    expect(gs.lives).toBe(0);
    expect(gs.state).toBe('GAME_OVER');
  });

  it('exports MAX_LIVES_DEFAULT constant', async () => {
    const { MAX_LIVES_DEFAULT } = await getGameState();
    expect(MAX_LIVES_DEFAULT).toBe(3);
  });

  // --- Score ---

  it('addScore increases score when PLAYING', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.addScore(100);
    expect(gs.score).toBe(100);
  });

  it('addScore is no-op when state is not PLAYING', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    // state is START
    gs.addScore(100);
    expect(gs.score).toBe(0);

    gs.start();
    gs.gameOver();
    // state is GAME_OVER
    gs.addScore(50);
    expect(gs.score).toBe(0);
  });

  // --- Survival time ---

  it('tickSurvivalTime increases elapsed time by dt when PLAYING', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    gs.start();
    gs.tickSurvivalTime(0.5);
    expect(gs.elapsedTime).toBeCloseTo(0.5, 10);
    gs.tickSurvivalTime(0.3);
    expect(gs.elapsedTime).toBeCloseTo(0.8, 10);
  });

  it('tickSurvivalTime is no-op when state is not PLAYING', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    // state is START
    gs.tickSurvivalTime(1);
    expect(gs.elapsedTime).toBe(0);
  });

  // --- Observer pattern ---

  it('subscribe() fires on every state change with the new state', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    const states = [];
    gs.subscribe((newState) => states.push(newState));
    gs.start();
    gs.gameOver();
    gs.resetToStart();
    expect(states).toEqual(['PLAYING', 'GAME_OVER', 'START']);
  });

  it('subscribe() returns unsubscribe function that stops further notifications', async () => {
    const { GameState } = await getGameState();
    const gs = new GameState();
    const states = [];
    const unsub = gs.subscribe((newState) => states.push(newState));
    gs.start();
    unsub();
    gs.gameOver();
    expect(states).toEqual(['PLAYING']); // no GAME_OVER
  });
});

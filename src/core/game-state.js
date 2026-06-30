/**
 * GameState — state machine for the Matchsticks game.
 *
 * Three states: START | PLAYING | GAME_OVER
 *
 * Valid transitions:
 *   START       → PLAYING   (via start())
 *   PLAYING     → GAME_OVER (via gameOver(), or auto when lives reach 0)
 *   GAME_OVER   → START     (via resetToStart())
 *
 * Design decisions:
 * - addScore only works in PLAYING state (score represents "during play" effort)
 * - MAX_LIVES is exported as MAX_LIVES_DEFAULT (3) but configurable via constructor
 * - When life pool reaches 0 during PLAYING, auto-transitions to GAME_OVER
 * - Observer pattern: subscribe(fn) returns an unsubscribe function
 *
 * @module core/game-state
 */

/** @type {number} Default maximum lives for a new game */
export const MAX_LIVES_DEFAULT = 3;

/** @type {readonly string[]} Valid game states */
const STATES = Object.freeze(['START', 'PLAYING', 'GAME_OVER']);

/**
 * Valid state transitions map: currentState → Set of allowed next states
 * @type {Map<string, Set<string>>}
 */
const VALID_TRANSITIONS = new Map([
  ['START', new Set(['PLAYING'])],
  ['PLAYING', new Set(['GAME_OVER'])],
  ['GAME_OVER', new Set(['START'])],
]);

/**
 * GameState — tracks game state, lives, score, survival time.
 * Supports observer subscriptions for state changes.
 */
export class GameState {
  /**
   * @param {object} [options]
   * @param {number} [options.maxLives=MAX_LIVES_DEFAULT] Maximum lives for this game
   */
  constructor({ maxLives = MAX_LIVES_DEFAULT } = {}) {
    /** @type {number} */
    this._maxLives = maxLives;

    /** @type {string} Current game state */
    this._state = 'START';

    /** @type {number} Remaining lives, clamped to [0, maxLives] */
    this._lives = maxLives;

    /** @type {number} Current score */
    this._score = 0;

    /** @type {number} Elapsed survival time in seconds */
    this._elapsedTime = 0;

    /** @type {Set<Function>} Observer subscriptions */
    this._observers = new Set();
  }

  /** Current game state: 'START' | 'PLAYING' | 'GAME_OVER' */
  get state() {
    return this._state;
  }

  /** Current life count (clamped to [0, maxLives]) */
  get lives() {
    return this._lives;
  }

  /** Maximum lives for this game instance */
  get maxLives() {
    return this._maxLives;
  }

  /** Current score */
  get score() {
    return this._score;
  }

  /** Elapsed survival time in seconds */
  get elapsedTime() {
    return this._elapsedTime;
  }

  /**
   * Transition to a new state after validating the transition.
   * @param {string} newState
   * @throws {Error} If the transition is invalid
   * @private
   */
  _transition(newState) {
    const allowed = VALID_TRANSITIONS.get(this._state);
    if (!allowed || !allowed.has(newState)) {
      throw new Error(`Invalid transition: ${this._state} → ${newState}`);
    }
    this._state = newState;
    this._notifyObservers();
  }

  /**
   * Notify all observers of a state change.
   * @private
   */
  _notifyObservers() {
    for (const fn of this._observers) {
      fn(this._state);
    }
  }

  /**
   * Start the game: START → PLAYING.
   * Resets score and survival time for the new play session.
   * @throws {Error} If current state is not START
   */
  start() {
    this._score = 0;
    this._elapsedTime = 0;
    this._lives = this._maxLives;
    this._transition('PLAYING');
  }

  /**
   * End the game: PLAYING → GAME_OVER.
   * @throws {Error} If current state is not PLAYING
   */
  gameOver() {
    this._transition('GAME_OVER');
  }

  /**
   * Reset to start: GAME_OVER → START.
   * @throws {Error} If current state is not GAME_OVER
   */
  resetToStart() {
    this._transition('START');
  }

  /**
   * Apply damage to the life pool. Only works in PLAYING state.
   * If lives reach 0, auto-transitions to GAME_OVER.
   *
   * @param {number} [amount=1] Damage amount
   */
  takeDamage(amount = 1) {
    if (this._state !== 'PLAYING') return;

    this._lives = Math.max(0, this._lives - amount);

    if (this._lives === 0) {
      this._transition('GAME_OVER');
    }
  }

  /**
   * Add to the score. Only works in PLAYING state.
   * Score represents effort during active play.
   *
   * @param {number} points Points to add (must be non-negative)
   */
  addScore(points) {
    if (this._state !== 'PLAYING') return;
    this._score += points;
  }

  /**
   * Advance survival time. Only works in PLAYING state.
   * @param {number} dt Delta time in seconds
   */
  tickSurvivalTime(dt) {
    if (this._state !== 'PLAYING') return;
    this._elapsedTime += dt;
  }

  /**
   * Subscribe to state changes. Observer is called with the new state string
   * whenever a transition occurs.
   *
   * @param {Function} fn Observer function: (newState: string) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(fn) {
    this._observers.add(fn);
    return () => {
      this._observers.delete(fn);
    };
  }
}

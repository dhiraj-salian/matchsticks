/**
 * hud.js — HUD overlay manager: lives, score, game over, highscores
 * Mostly DOM manipulation of the elements already in index.html.
 */

const STORAGE_KEY = 'matchsticks:highscores';
const MAX_LIVES = 3;

export class HUD {
  constructor() {
    this.livesEl = document.getElementById('hud-lives');
    this.scoreEl = document.getElementById('hud-score');
    this.startScreen = document.getElementById('start-screen');
    this.startHighscores = document.getElementById('start-highscores');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.gameoverScore = document.getElementById('gameover-score');
    this.gameoverName = document.getElementById('gameover-name');
    this.gameoverRestart = document.getElementById('gameover-restart');

    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreSaved = false;

    this._showStartScreen();
  }

  // ── Lives ──
  setLives(n) {
    this.lives = n;
    const full = '❤️'.repeat(Math.max(0, n));
    const empty = '🖤'.repeat(Math.max(0, MAX_LIVES - n));
    this.livesEl.textContent = full + empty;
  }

  loseLife() {
    this.setLives(this.lives - 1);
  }

  // ── Score ──
  setScore(n) {
    this.score = n;
    this.scoreEl.textContent = Math.floor(n);
  }

  addScore(n) {
    this.setScore(this.score + n);
  }

  // ── Start screen ──
  _showStartScreen() {
    this.startScreen.classList.remove('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.livesEl.style.display = 'none';
    this.scoreEl.parentElement.style.display = 'none';
    this._renderHighscores();
  }

  _renderHighscores() {
    const scores = this._loadHighscores();
    if (scores.length === 0) {
      this.startHighscores.innerHTML = '';
      return;
    }
    let html = '<h3>🏆 Personal Bests</h3><ol>';
    for (const s of scores.slice(0, 5)) {
      html += `<li>${s.name}: ${s.score}</li>`;
    }
    html += '</ol>';
    this.startHighscores.innerHTML = html;
  }

  // ── Hide start screen ──
  hideStartScreen() {
    this.startScreen.classList.add('hidden');
    this.livesEl.style.display = '';
    this.scoreEl.parentElement.style.display = '';
  }

  // ── Game over screen ──
  showGameOver() {
    this.gameoverScreen.classList.remove('hidden');
    this.gameoverScore.textContent = `Score: ${Math.floor(this.score)}`;
    this.gameoverRestart.classList.add('hidden');
    this.gameoverName.value = '';
    this.scoreSaved = false;
    this.gameoverName.focus();
  }

  hideGameOver() {
    this.gameoverScreen.classList.add('hidden');
  }

  /** Save score on Enter press from gameover input */
  trySaveScore() {
    if (this.scoreSaved) return false;
    const name = this.gameoverName.value.trim() || 'Anonymous';
    this._saveHighscore(name, Math.floor(this.score));
    this.scoreSaved = true;
    this.gameoverRestart.classList.remove('hidden');
    this.gameoverName.disabled = true;
    return true;
  }

  /** Reset for new game */
  reset() {
    this.score = 0;
    this.lives = MAX_LIVES;
    this.setLives(MAX_LIVES);
    this.setScore(0);
    this.hideGameOver();
    this.scoreSaved = false;
    this.gameoverName.disabled = false;
  }

  // ── localStorage highscores ──
  _loadHighscores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  _saveHighscore(name, score) {
    const scores = this._loadHighscores();
    scores.push({ name, score, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    // Keep top 20
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 20)));
  }

  get isGameOverVisible() {
    return !this.gameoverScreen.classList.contains('hidden');
  }
}

/**
 * game.js — Main game controller: states, loop, collision, scoring
 * States: START, PLAYING, GAME_OVER
 */

import { isDown, justDown, clearFrame, P1, P2 } from './input.js';
import { Player } from './player.js';
import { World } from './world.js';
import { HazardManager } from './hazards.js';
import { aabbOverlap } from './collision.js';
import { Juice } from './juice.js';
import { HUD } from './hud.js';

const STATES = { START: 0, PLAYING: 1, GAME_OVER: 2 };

export class Game {
  constructor({ scene, camera, renderer }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.state = STATES.START;

    // World
    this.world = new World(scene);

    // Players
    this.player1 = new Player({ headColor: 0xff2200, scene, playerIndex: 0 });
    this.player2 = new Player({ headColor: 0x2266ff, scene, playerIndex: 1 });

    // Hazards
    this.hazards = new HazardManager(scene);

    // Juice
    this.juice = new Juice(scene, camera);

    // HUD
    this.hud = new HUD();

    // Scoring
    this.distance = 0;
    this.hazardsDodged = 0;
    this.scrollSpeed = 4; // base units/sec

    // Keyboard listeners for gameover name entry
    this._setupInputListeners();
  }

  _setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.state === STATES.START) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this._startGame();
        }
      } else if (this.state === STATES.GAME_OVER) {
        if (e.code === 'Enter') {
          if (!this.hud.scoreSaved) {
            this.hud.trySaveScore();
          } else {
            this._startGame();
          }
        } else if (e.code === 'Space' && this.hud.scoreSaved) {
          this._startGame();
        }
      }
    });
  }

  _startGame() {
    clearFrame(); // consume the start key so it doesn't trigger a jump
    this.state = STATES.PLAYING;
    this.hud.hideStartScreen();
    this.hud.reset();
    this.hazards.clear();
    this.juice.clear();
    this.distance = 0;
    this.hazardsDodged = 0;
    this.scrollSpeed = 4;

    // Reset players
    this.player1.reset(-1);
    this.player2.reset(1);
  }

  update(dt) {
    // Always update juice (particles, camera shake)
    this.juice.update(dt);

    if (this.state === STATES.START) return;

    if (this.state === STATES.PLAYING) {
      this._updatePlaying(dt);
    }
    // GAME_OVER: only juice updates (camera shake decay, particles)
  }

  _updatePlaying(dt) {
    // ── Input ──
    const p1Input = {
      left: isDown(P1.left),
      right: isDown(P1.right),
      jump: justDown(P1.jump),
      jumpPressed: justDown(P1.jump),
      crouch: isDown(P1.crouch),
    };
    const p2Input = {
      left: isDown(P2.left),
      right: isDown(P2.right),
      jump: justDown(P2.jump),
      jumpPressed: justDown(P2.jump),
      crouch: isDown(P2.crouch),
    };

    // ── Update players ──
    this.player1.update(dt, p1Input);
    this.player2.update(dt, p2Input);

    // ── World scroll ──
    this.scrollSpeed = 4 + this.distance * 0.003; // gradually faster
    this.distance += this.scrollSpeed * dt;
    this.world.scroll(this.scrollSpeed * dt);

    // ── Camera follows midpoint between players, smooth lerp ──
    const midX = (this.player1.x + this.player2.x) / 2;
    const midY = Math.max(this.player1.y, this.player2.y);
    const targetX = midX + this.distance * 0.3; // slight forward offset
    const targetY = 4 + midY * 0.2;
    this.juice.setCameraTarget(targetX, targetY);

    // ── Hazards ──
    this.hazards.update(dt, targetX);

    // ── Collision detection ──
    this._checkCollisions();

    // ── Scoring ──
    const dodged = this.hazards.checkDodged(targetX);
    if (dodged) {
      this.hazardsDodged++;
      this.hud.addScore(10);
      // Occasional dodge quip
      if (Math.random() < 0.2) {
        const p = Math.random() < 0.5 ? this.player1 : this.player2;
        this.juice.showQuip(p.x, p.y + 2.5, 'dodge');
      }
    }

    // Distance score (1 point per unit)
    this.hud.setScore(Math.floor(this.distance) + this.hazardsDodged * 10);

    // ── Clear just-pressed keys ──
    clearFrame();
  }

  _checkCollisions() {
    const activeBounds = this.hazards.getActiveBounds();

    for (const player of [this.player1, this.player2]) {
      if (!player.alive || player.invincible > 0) continue;

      const pb = player.bounds;

      for (const { bounds, hazard } of activeBounds) {
        if (aabbOverlap(pb, bounds)) {
          if (hazard.isHazard) {
            // Hit!
            player.hit();
            this.hud.loseLife();
            this.juice.shake(0.5, 0.3);
            this.juice.sparkBurst(player.x, player.y + 1, 15);
            this.juice.showQuip(player.x, player.y + 2.5, 'hit');

            if (this.hud.lives <= 0) {
              this._gameOver();
            }
            break;
          } else if (hazard.isPickup) {
            // Pickup!
            this.hud.addScore(50);
            this.juice.pickupSparkle(hazard.group.position.x, hazard.group.position.y);
            hazard.dead = true;
            break;
          }
        }
      }
    }
  }

  _gameOver() {
    this.state = STATES.GAME_OVER;
    this.player1.alive = false;
    this.player2.alive = false;
    this.hud.showGameOver();
  }
}

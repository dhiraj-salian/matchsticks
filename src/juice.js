/**
 * juice.js — Game feel: particles, camera shake, quips
 * Everything that makes it fun.
 */

import * as THREE from 'three';

// ── Quip texts ──
const HIT_QUIPS = [
  'ouch!',
  'yikes!',
  'nope!',
  'ahh!',
  'burned!',
  'hot!',
  'ouchie!',
  '🔥',
  'agh!',
  'no!',
];
const DODGE_QUIPS = ['nice!', 'smooth!', 'ha!', 'woohoo!', '😎', 'gg', 'ez', 'sick!'];

export class Juice {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.cameraShake = 0;
    this.cameraBaseX = 0;
    this.cameraBaseY = 4;

    // Particle pool
    this.particles = [];

    // Quip sprites
    this.quips = [];

    // Shared textures
    this._sparkTex = this._makeSparkTexture();
  }

  _makeSparkTexture() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,220,80,1)');
    g.addColorStop(0.5, 'rgba(255,100,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(c);
  }

  // ── Camera shake ──
  shake(intensity = 0.4, duration = 0.25) {
    this.cameraShake = duration;
    this._shakeIntensity = intensity;
  }

  // ── Spark burst on hit ──
  sparkBurst(x, y, count = 12) {
    const mat = new THREE.SpriteMaterial({
      map: this._sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(mat.clone());
      sprite.scale.set(0.3, 0.3, 1);
      sprite.position.set(x, y, 1);
      this.scene.add(sprite);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + 2;

      this.particles.push({
        sprite,
        vx,
        vy,
        life: 0.4 + Math.random() * 0.4,
        age: 0,
      });
    }
  }

  // ── Pickup sparkle ──
  pickupSparkle(x, y) {
    this.sparkBurst(x, y, 8);
    // Also golden particles
    const mat = new THREE.SpriteMaterial({
      map: this._sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      color: 0xffdd00,
    });
    for (let i = 0; i < 6; i++) {
      const sprite = new THREE.Sprite(mat.clone());
      sprite.scale.set(0.4, 0.4, 1);
      sprite.position.set(x, y, 1);
      this.scene.add(sprite);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 3,
        life: 0.5 + Math.random() * 0.3,
        age: 0,
      });
    }
  }

  // ── Text quip above character ──
  showQuip(x, y, type = 'hit') {
    const texts = type === 'hit' ? HIT_QUIPS : DODGE_QUIPS;
    const text = texts[Math.floor(Math.random() * texts.length)];

    // Create canvas text
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 48;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 28px Courier New';
    ctx.fillStyle = type === 'hit' ? '#ff4422' : '#44ff66';
    ctx.textAlign = 'center';
    ctx.fillText(text, 64, 32);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 0.75, 1);
    sprite.position.set(x, y + 3, 2);
    this.scene.add(sprite);

    this.quips.push({
      sprite,
      vy: 1.5,
      life: 0.8,
      age: 0,
    });
  }

  update(dt) {
    // Camera shake
    if (this.cameraShake > 0) {
      this.cameraShake -= dt;
      const i = this._shakeIntensity * (this.cameraShake / 0.25);
      this.camera.position.x = this.cameraBaseX + (Math.random() - 0.5) * i;
      this.camera.position.y = this.cameraBaseY + (Math.random() - 0.5) * i * 0.5;
    } else {
      // Return to base
      this.camera.position.x += (this.cameraBaseX - this.camera.position.x) * 0.2;
      this.camera.position.y += (this.cameraBaseY - this.camera.position.y) * 0.2;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      p.vy -= 12 * dt; // gravity on particles
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.sprite.material.opacity = 1 - p.age / p.life;

      if (p.age >= p.life) {
        this.scene.remove(p.sprite);
        this.particles.splice(i, 1);
      }
    }

    // Quips
    for (let i = this.quips.length - 1; i >= 0; i--) {
      const q = this.quips[i];
      q.age += dt;
      q.sprite.position.y += q.vy * dt;
      q.sprite.material.opacity = 1 - q.age / q.life;

      if (q.age >= q.life) {
        this.scene.remove(q.sprite);
        q.sprite.material.map.dispose();
        this.quips.splice(i, 1);
      }
    }
  }

  /** Set camera base position (called by game.js) */
  setCameraTarget(x, y) {
    this.cameraBaseX = x;
    this.cameraBaseY = y;
  }

  /** Clear all particles and quips */
  clear() {
    for (const p of this.particles) this.scene.remove(p.sprite);
    for (const q of this.quips) {
      this.scene.remove(q.sprite);
      q.sprite.material.map.dispose();
    }
    this.particles = [];
    this.quips = [];
    this.cameraShake = 0;
  }
}

/**
 * hazards.js — Procedural hazard spawner
 * Flame jets, falling embers, low obstacles, high obstacles.
 * Difficulty ramps over time.
 */

import * as THREE from 'three';

// ── Hazard types ──
const TYPES = {
  FLAME_JET: 'flame_jet', // shoots up from ground
  FALLING_EMBER: 'ember', // falls from above
  LOW_OBSTACLE: 'low_obs', // jump over it
  HIGH_OBSTACLE: 'high_obs', // crouch under it
  PICKUP: 'pickup', // bonus points
};

const HAZARD_WEIGHTS = [
  { type: TYPES.FLAME_JET, weight: 25 },
  { type: TYPES.FALLING_EMBER, weight: 20 },
  { type: TYPES.LOW_OBSTACLE, weight: 25 },
  { type: TYPES.HIGH_OBSTACLE, weight: 20 },
  { type: TYPES.PICKUP, weight: 10 },
];

/** Pick a random hazard type, weighted */
function pickType() {
  const total = HAZARD_WEIGHTS.reduce((s, h) => s + h.weight, 0);
  let r = Math.random() * total;
  for (const h of HAZARD_WEIGHTS) {
    r -= h.weight;
    if (r <= 0) return h.type;
  }
  return TYPES.LOW_OBSTACLE;
}

// ── Shared materials ──
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 });
const emberMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.8 });
const obsMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
const pickupMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.9 });

export class HazardManager {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.hazards = [];
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.cameraX = 0;

    // Flame glow sprite texture (shared)
    this._flameTex = this._makeFlameTexture();
    this._sparkTex = this._makeSparkTexture();
  }

  _makeFlameTexture() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 20, 2, 16, 32, 30);
    g.addColorStop(0, 'rgba(255,200,50,0.9)');
    g.addColorStop(0.4, 'rgba(255,80,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 64);
    return new THREE.CanvasTexture(c);
  }

  _makeSparkTexture() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,220,80,1)');
    g.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(c);
  }

  /** Spawn interval decreases over time (harder) */
  get spawnInterval() {
    const base = 1.8;
    const min = 0.5;
    return Math.max(min, base - this.elapsedTime * 0.015);
  }

  update(dt, cameraX) {
    this.cameraX = cameraX;
    this.elapsedTime += dt;
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this._spawn();
      this.spawnTimer = this.spawnInterval + (Math.random() - 0.5) * 0.5;
    }

    // Update existing hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.update(dt);

      // Remove if off screen
      const screenLeft = cameraX - 20;
      if (h.group.position.x < screenLeft - 5 || h.dead) {
        this.scene.remove(h.group);
        this.hazards.splice(i, 1);
      }
    }
  }

  _spawn() {
    const type = pickType();
    const spawnX = this.cameraX + 22 + Math.random() * 5;
    let h;

    switch (type) {
      case TYPES.FLAME_JET:
        h = this._makeFlameJet(spawnX);
        break;
      case TYPES.FALLING_EMBER:
        h = this._makeFallingEmber(spawnX);
        break;
      case TYPES.LOW_OBSTACLE:
        h = this._makeLowObstacle(spawnX);
        break;
      case TYPES.HIGH_OBSTACLE:
        h = this._makeHighObstacle(spawnX);
        break;
      case TYPES.PICKUP:
        h = this._makePickup(spawnX);
        break;
    }

    if (h) {
      this.hazards.push(h);
    }
  }

  // ── Flame Jet ──
  _makeFlameJet(x) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);

    // Base (small vent)
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    group.add(base);

    // Flame sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: this._flameTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 2.5, 1);
    sprite.position.y = 2;
    sprite.visible = false;
    group.add(sprite);

    this.scene.add(group);

    // Hazard object
    const lifetime = 6 + Math.random() * 4;
    const cycleOn = 1.5 + Math.random();
    const cycleOff = 1 + Math.random() * 0.5;

    return {
      type: TYPES.FLAME_JET,
      group,
      isHazard: true,
      isPickup: false,
      dodged: false,
      dead: false,
      age: 0,
      lifetime,
      cycleOn,
      cycleOff,
      flameOn: false,
      /** AABB when flame is active */
      get bounds() {
        if (!this.flameOn) return null;
        return {
          minX: group.position.x - 0.5,
          maxX: group.position.x + 0.5,
          minY: 0,
          maxY: 4,
        };
      },
      update(dt) {
        this.age += dt;
        if (this.age > this.lifetime) {
          this.dead = true;
          return;
        }
        const cycle = this.age % (this.cycleOn + this.cycleOff);
        this.flameOn = cycle < this.cycleOn;
        sprite.visible = this.flameOn;
        if (this.flameOn) {
          sprite.scale.y = 2.5 + Math.sin(this.age * 15) * 0.3;
          sprite.material.opacity = 0.7 + Math.sin(this.age * 10) * 0.2;
        }
      },
    };
  }

  // ── Falling Ember ──
  _makeFallingEmber(x) {
    const group = new THREE.Group();
    const startY = 12 + Math.random() * 4;
    group.position.set(x, startY, 0);

    const geo = new THREE.SphereGeometry(0.2, 8, 6);
    const mesh = new THREE.Mesh(geo, emberMat.clone());
    group.add(mesh);

    // Glow
    const spriteMat = new THREE.SpriteMaterial({
      map: this._sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.8, 0.8, 1);
    group.add(sprite);

    this.scene.add(group);

    const speed = 6 + Math.random() * 4;
    const drift = (Math.random() - 0.5) * 2;

    return {
      type: TYPES.FALLING_EMBER,
      group,
      isHazard: true,
      isPickup: false,
      dodged: false,
      dead: false,
      get bounds() {
        return {
          minX: group.position.x - 0.2,
          maxX: group.position.x + 0.2,
          minY: group.position.y - 0.2,
          maxY: group.position.y + 0.2,
        };
      },
      update(dt) {
        group.position.y -= speed * dt;
        group.position.x += drift * dt;
        if (group.position.y < -1) this.dead = true;
      },
    };
  }

  // ── Low Obstacle (jump over) ──
  _makeLowObstacle(x) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);

    const w = 0.8 + Math.random() * 0.6;
    const h = 0.8 + Math.random() * 0.3;
    const geo = new THREE.BoxGeometry(w, h, 0.8);
    const mesh = new THREE.Mesh(geo, obsMat);
    mesh.position.y = h / 2;
    group.add(mesh);

    this.scene.add(group);

    return {
      type: TYPES.LOW_OBSTACLE,
      group,
      isHazard: true,
      isPickup: false,
      dodged: false,
      dead: false,
      get bounds() {
        return {
          minX: group.position.x - w / 2,
          maxX: group.position.x + w / 2,
          minY: 0,
          maxY: h,
        };
      },
      update(dt) {
        /* static */
      },
    };
  }

  // ── High Obstacle (crouch under) ──
  _makeHighObstacle(x) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);

    // Two pillars with a crossbar
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 3, 6);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-0.6, 1.5, 0);
    group.add(p1);
    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(0.6, 1.5, 0);
    group.add(p2);

    // Crossbar
    const barGeo = new THREE.BoxGeometry(1.6, 0.3, 0.4);
    const barMat = new THREE.MeshLambertMaterial({ color: 0x774433 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 1.2;
    group.add(bar);

    // Fire on the crossbar
    const spriteMat = new THREE.SpriteMaterial({
      map: this._flameTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const fire = new THREE.Sprite(spriteMat);
    fire.scale.set(0.6, 0.8, 1);
    fire.position.y = 1.8;
    group.add(fire);

    this.scene.add(group);

    return {
      type: TYPES.HIGH_OBSTACLE,
      group,
      isHazard: true,
      isPickup: false,
      dodged: false,
      dead: false,
      get bounds() {
        return {
          minX: group.position.x - 0.8,
          maxX: group.position.x + 0.8,
          minY: 1.0,
          maxY: 2.0,
        };
      },
      update(dt) {
        fire.scale.y = 0.8 + Math.sin(Date.now() * 0.01) * 0.15;
      },
    };
  }

  // ── Pickup (bonus) ──
  _makePickup(x) {
    const group = new THREE.Group();
    const y = 1.5 + Math.random() * 2;
    group.position.set(x, y, 0);

    const geo = new THREE.OctahedronGeometry(0.25, 0);
    const mesh = new THREE.Mesh(geo, pickupMat.clone());
    group.add(mesh);

    // Glow
    const spriteMat = new THREE.SpriteMaterial({
      map: this._sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      color: 0xffdd00,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 1.2, 1);
    group.add(sprite);

    this.scene.add(group);

    return {
      type: TYPES.PICKUP,
      group,
      isHazard: false,
      isPickup: true,
      dodged: false,
      dead: false,
      get bounds() {
        return {
          minX: group.position.x - 0.3,
          maxX: group.position.x + 0.3,
          minY: group.position.y - 0.3,
          maxY: group.position.y + 0.3,
        };
      },
      update(dt) {
        mesh.rotation.y += dt * 3;
        sprite.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      },
    };
  }

  /** Get all active hazard/pickup bounds for collision */
  getActiveBounds() {
    const results = [];
    for (const h of this.hazards) {
      const b = h.bounds;
      if (b) results.push({ bounds: b, hazard: h });
    }
    return results;
  }

  /** Check if a hazard has been dodged (passed behind camera midpoint) */
  checkDodged(cameraX) {
    for (const h of this.hazards) {
      if (!h.dodged && h.isHazard && h.group.position.x < cameraX - 1) {
        h.dodged = true;
        return true;
      }
    }
    return false;
  }

  /** Clear all hazards */
  clear() {
    for (const h of this.hazards) {
      this.scene.remove(h.group);
    }
    this.hazards = [];
    this.spawnTimer = 0;
    this.elapsedTime = 0;
  }
}

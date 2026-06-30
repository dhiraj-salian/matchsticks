/**
 * player.js — Matchstick character: stick body + glowing head + tiny arms
 * Handles mesh creation, animation (squash/stretch, wobble, run cycle), physics.
 */

import * as THREE from 'three';

// ── Dimensions ──
const STICK_H = 1.6; // body height
const STICK_R = 0.08; // body radius
const HEAD_R = 0.28; // head sphere radius
const ARM_H = 0.5; // arm length
const ARM_R = 0.04; // arm radius
const LEG_H = 0.4;
const LEG_R = 0.06;

// ── Physics constants ──
const GRAVITY = -28;
const JUMP_IMPULSE = 14;
const MOVE_ACCEL = 60;
const MAX_SPEED = 10;
const FRICTION = 8;
const GROUND_Y = 0;

export class Player {
  /**
   * @param {object} opts
   * @param {string} opts.headColor - hex color for the glowing head
   * @param {THREE.Scene} opts.scene
   * @param {number} opts.playerIndex - 0 or 1
   */
  constructor({ headColor, scene, playerIndex }) {
    this.playerIndex = playerIndex;
    this.group = new THREE.Group();
    scene.add(this.group);

    // Physics state
    this.x = playerIndex === 0 ? -1 : 1;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.jumpsLeft = 2; // double jump
    this.crouching = false;
    this.alive = true;
    this.invincible = 0; // seconds of invincibility after hit

    // Animation state
    this.runPhase = 0;
    this.squashTimer = 0;
    this.landSquash = 0;
    this.hitFlash = 0;
    this.wobblePhase = 0;

    // Build mesh
    this._buildMesh(headColor);
  }

  _buildMesh(headHex) {
    const g = this.group;

    // Body (stick)
    const bodyGeo = new THREE.CylinderGeometry(STICK_R, STICK_R * 1.1, STICK_H, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xddc8a0 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = STICK_H / 2;
    g.add(this.body);

    // Head (glowing sphere)
    const headGeo = new THREE.SphereGeometry(HEAD_R, 16, 12);
    const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(headHex) });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = STICK_H + HEAD_R * 0.7;
    g.add(this.head);

    // Glow sprite around head
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    const c = new THREE.Color(headHex);
    grad.addColorStop(
      0,
      `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},0.6)`,
    );
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Sprite(spriteMat);
    this.glow.scale.set(1.8, 1.8, 1);
    this.glow.position.y = this.head.position.y;
    g.add(this.glow);

    // Left arm
    this.leftArm = this._makeArm(-1);
    g.add(this.leftArm);

    // Right arm
    this.rightArm = this._makeArm(1);
    g.add(this.rightArm);

    // Left leg
    this.leftLeg = this._makeLeg(-1);
    g.add(this.leftLeg);

    // Right leg
    this.rightLeg = this._makeLeg(1);
    g.add(this.rightLeg);

    g.position.set(this.x, this.y, 0);
  }

  _makeArm(side) {
    const geo = new THREE.CylinderGeometry(ARM_R, ARM_R, ARM_H, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0xddc8a0 });
    const arm = new THREE.Mesh(geo, mat);
    arm.position.set(side * (STICK_R + ARM_R + 0.02), STICK_H * 0.7, 0);
    arm.rotation.z = side * 0.3;
    return arm;
  }

  _makeLeg(side) {
    const geo = new THREE.CylinderGeometry(LEG_R, LEG_R, LEG_H, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    const leg = new THREE.Mesh(geo, mat);
    leg.position.set(side * 0.1, -LEG_H / 2, 0);
    return leg;
  }

  /** AABB for collision (world-space) */
  get bounds() {
    const w = this.crouching ? 0.5 : 0.6;
    const h = this.crouching ? STICK_H * 0.5 : STICK_H + HEAD_R * 2;
    return {
      minX: this.x - w / 2,
      maxX: this.x + w / 2,
      minY: this.y,
      maxY: this.y + h,
    };
  }

  /**
   * @param {number} dt
   * @param {object} input - { left, right, jump, crouch } booleans
   */
  update(dt, input) {
    if (!this.alive) return;

    // ── Invincibility timer ──
    if (this.invincible > 0) this.invincible -= dt;

    // ── Horizontal movement ──
    if (input.left) this.vx -= MOVE_ACCEL * dt;
    if (input.right) this.vx += MOVE_ACCEL * dt;
    // Friction
    if (!input.left && !input.right) {
      this.vx *= 1 - FRICTION * dt;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
    this.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.vx));

    // ── Crouch ──
    this.crouching = !!input.crouch && this.grounded;
    if (this.crouching) this.vx *= 0.5; // slow while crouching

    // ── Jump ──
    if (input.jumpPressed && this.jumpsLeft > 0) {
      this.vy = JUMP_IMPULSE;
      this.jumpsLeft--;
      this.grounded = false;
      // Squash on jump
      this.squashTimer = 0.12;
      this._squashDir = 1; // stretch vertical
    }

    // ── Gravity ──
    this.vy += GRAVITY * dt;

    // ── Integrate ──
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // ── Ground collision ──
    if (this.y <= GROUND_Y) {
      if (this.vy < -2 && !this.grounded) {
        // Landing squash
        this.landSquash = 0.15;
        this.squashTimer = 0.12;
        this._squashDir = -1; // squash horizontal
      }
      this.y = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
      this.jumpsLeft = 2;
    } else {
      this.grounded = false;
    }

    // ── Update mesh position ──
    this.group.position.set(this.x, this.y, 0);

    // ── Run animation ──
    if (Math.abs(this.vx) > 0.5 && this.grounded) {
      this.runPhase += dt * Math.abs(this.vx) * 3;
    }

    // ── Animate ──
    this._animate(dt);
  }

  _animate(dt) {
    const g = this.group;

    // Squash & stretch
    if (this.squashTimer > 0) {
      this.squashTimer -= dt;
      const t = 1 - this.squashTimer / 0.12;
      const amp = 0.25 * (1 - t);
      if (this._squashDir === 1) {
        // Stretch: tall + narrow
        g.scale.set(1 - amp, 1 + amp, 1);
      } else {
        // Squash: wide + short
        g.scale.set(1 + amp, 1 - amp, 1);
      }
    } else if (this.landSquash > 0) {
      this.landSquash -= dt;
      const t = 1 - this.landSquash / 0.15;
      const amp = 0.2 * (1 - t);
      g.scale.set(1 + amp, 1 - amp, 1);
    } else {
      g.scale.set(1, 1, 1);
    }

    // Crouch scale
    if (this.crouching) {
      g.scale.y *= 0.55;
      g.scale.x *= 1.3;
    }

    // Wobble while running
    if (Math.abs(this.vx) > 0.5 && this.grounded) {
      this.wobblePhase += dt * 15;
      g.rotation.z = Math.sin(this.wobblePhase) * 0.06 * Math.min(Math.abs(this.vx) / 4, 1);
    } else {
      g.rotation.z *= 0.9;
    }

    // Arm swing (running)
    if (this.grounded && Math.abs(this.vx) > 0.5) {
      const swing = Math.sin(this.runPhase) * 0.8;
      this.leftArm.rotation.z = swing * 0.5 + 0.3;
      this.rightArm.rotation.z = -swing * 0.5 - 0.3;
      // Leg swing
      this.leftLeg.rotation.z = -swing * 0.6;
      this.rightLeg.rotation.z = swing * 0.6;
    } else if (!this.grounded) {
      // Arms up while airborne
      this.leftArm.rotation.z = -0.8;
      this.rightArm.rotation.z = 0.8;
      this.leftLeg.rotation.z = 0.2;
      this.rightLeg.rotation.z = -0.2;
    } else {
      this.leftArm.rotation.z = 0.3;
      this.rightArm.rotation.z = -0.3;
      this.leftLeg.rotation.z = 0;
      this.rightLeg.rotation.z = 0;
    }

    // Hit flash
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      this.body.material.emissive = new THREE.Color(0xff2200);
      this.body.material.emissiveIntensity = this.hitFlash / 0.3;
    } else {
      this.body.material.emissiveIntensity = 0;
    }

    // Invincibility blink
    if (this.invincible > 0) {
      g.visible = Math.sin(this.invincible * 20) > 0;
    } else {
      g.visible = true;
    }

    // Head glow pulse
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    this.glow.scale.set(1.8 * pulse, 1.8 * pulse, 1);
  }

  /** Mark player as hit */
  hit() {
    this.hitFlash = 0.3;
    this.invincible = 1.5;
    this.vy = 8; // knock up
    this.vx = this.vx > 0 ? -5 : 5; // knock back
  }

  /** Reset to starting position */
  reset(startX) {
    this.x = startX;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.jumpsLeft = 2;
    this.crouching = false;
    this.alive = true;
    this.invincible = 0;
    this.hitFlash = 0;
    this.runPhase = 0;
    this.group.visible = true;
    this.group.scale.set(1, 1, 1);
    this.group.rotation.z = 0;
    this.group.position.set(this.x, this.y, 0);
  }
}

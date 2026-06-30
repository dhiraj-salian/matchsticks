/**
 * world.js — Side-scrolling world: ground, parallax background layers
 * Infinite scrolling via tiling/wrapping.
 */

import * as THREE from 'three';

export class World {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.scrollX = 0;

    this._buildGround(scene);
    this._buildParallax(scene);
  }

  // ── Ground plane (tiling) ──
  _buildGround(scene) {
    // Use two ground tiles that swap position for infinite scrolling
    const TILE_W = 100;
    const groundGeo = new THREE.PlaneGeometry(TILE_W, 3);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });

    this.groundTile1 = new THREE.Mesh(groundGeo, groundMat);
    this.groundTile1.position.set(0, -1.5, 0);
    scene.add(this.groundTile1);

    this.groundTile2 = new THREE.Mesh(groundGeo, groundMat.clone());
    this.groundTile2.position.set(TILE_W, -1.5, 0);
    scene.add(this.groundTile2);

    // Ground detail: thin lighter line at top edge
    const lineGeo = new THREE.PlaneGeometry(TILE_W, 0.04);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x7a5c3a });
    this.line1 = new THREE.Mesh(lineGeo, lineMat);
    this.line1.position.set(0, 0.02, 0.01);
    scene.add(this.line1);

    this.line2 = new THREE.Mesh(lineGeo, lineMat.clone());
    this.line2.position.set(TILE_W, 0.02, 0.01);
    scene.add(this.line2);

    this._tileW = TILE_W;
  }

  // ── Parallax background (3 layers with wrapping) ──
  _buildParallax(scene) {
    this.parallaxLayers = [];

    // Layer 0: Mountains (far, slow)
    const mountains = this._makeMountainLayer();
    this.parallaxLayers.push({ group: mountains, speed: 0.05, wrapW: 320 });

    // Layer 1: Bushes / tree silhouettes (mid)
    const bushes = this._makeBushLayer();
    this.parallaxLayers.push({ group: bushes, speed: 0.2, wrapW: 300 });

    // Layer 2: Fog / haze (near, medium)
    const fog = this._makeFogLayer();
    this.parallaxLayers.push({ group: fog, speed: 0.4, wrapW: 360 });

    for (const layer of this.parallaxLayers) {
      layer.group.position.z = -5;
      scene.add(layer.group);
    }
  }

  _makeMountainLayer() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0.7 });

    for (let i = 0; i < 40; i++) {
      const w = 6 + Math.random() * 10;
      const h = 3 + Math.random() * 6;
      const geo = new THREE.BufferGeometry();
      const verts = new Float32Array([-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i * 8 - 60, -1, 0);
      group.add(mesh);
    }
    return group;
  }

  _makeBushLayer() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a3a12, transparent: true, opacity: 0.5 });

    for (let i = 0; i < 60; i++) {
      const r = 0.3 + Math.random() * 0.8;
      const geo = new THREE.SphereGeometry(r, 6, 4);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i * 5 - 80, r * 0.3 - 0.5, 1);
      mesh.scale.y = 0.6;
      group.add(mesh);
    }
    return group;
  }

  _makeFogLayer() {
    const group = new THREE.Group();

    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 128;
    fogCanvas.height = 128;
    const ctx = fogCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(60,40,30,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(fogCanvas);

    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.3 });

    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Sprite(spriteMat.clone());
      sprite.scale.set(6 + Math.random() * 8, 3 + Math.random() * 4, 1);
      sprite.position.set(i * 12 - 100, -1 + Math.random() * 2, 2);
      group.add(sprite);
    }
    return group;
  }

  /** Scroll the world by delta-x */
  scroll(dx) {
    this.scrollX += dx;

    // ── Ground tiling: swap tiles to stay under camera ──
    const camX = this.scrollX;
    const halfTile = this._tileW / 2;

    // Keep tile1 centered around the nearest even multiple, tile2 around odd
    const tileCenter1 = Math.round(camX / this._tileW) * this._tileW;
    const tileCenter2 = tileCenter1 + this._tileW;

    this.groundTile1.position.x = tileCenter1;
    this.groundTile2.position.x = tileCenter2;
    this.line1.position.x = tileCenter1;
    this.line2.position.x = tileCenter2;

    // ── Parallax layers (wrap with modulo) ──
    for (const layer of this.parallaxLayers) {
      const offset = (this.scrollX * layer.speed) % layer.wrapW;
      layer.group.position.x = -offset;
    }
  }
}

/**
 * main.js — Entry point for Matchsticks
 * Boots Three.js scene, renderer, camera, and the game loop.
 */

import * as THREE from 'three';
import { Game } from './game.js';

// ── Renderer ──
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; // keep it simple for perf

// ── Scene ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0800);
scene.fog = new THREE.Fog(0x1a0800, 30, 80);

// ── Camera (orthographic for crisp 2D-feel side-scroller) ──
const FRUSTUM = 14; // vertical half-size in world units
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -FRUSTUM * aspect,
  FRUSTUM * aspect,
  FRUSTUM,
  -FRUSTUM,
  0.1,
  200,
);
camera.position.set(0, 4, 30);
camera.lookAt(0, 2, 0);

// ── Lighting ──
const ambient = new THREE.AmbientLight(0x332211, 1.2);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffaa55, 1.8);
dirLight.position.set(5, 15, 10);
scene.add(dirLight);

// ── Resize ──
function onResize() {
  const w = window.innerWidth,
    h = window.innerHeight;
  renderer.setSize(w, h);
  aspect = w / h;
  camera.left = -FRUSTUM * aspect;
  camera.right = FRUSTUM * aspect;
  camera.top = FRUSTUM;
  camera.bottom = -FRUSTUM;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// ── Boot game ──
const game = new Game({ scene, camera, renderer });

// ── Animation loop ──
let lastTime = 0;
function loop(time) {
  requestAnimationFrame(loop);
  const dt = Math.min((time - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = time;
  if (dt > 0) game.update(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

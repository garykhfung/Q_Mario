import { createWorld } from './world.js';
import { createAudio } from './audio.js';
import { createCanvas2D } from './present/canvas2d.js';
import { createThreePresentation } from './present/three-adapter.js';

const $ = (id) => document.getElementById(id);
const keys = {};
const audio = createAudio();
const world = createWorld((ev) => audio.event(ev));
const canvas = $('game-canvas');
const canvas2d = createCanvas2D(canvas);
const host = $('canvas-wrapper');
let three = null;
let mode = new URLSearchParams(location.search).get('view') === 'canvas' ? 'canvas' : 'three';
let paused = false;
let lastSnap = null;
let lastT = 0, acc = 0;
const STEP = 1000 / 60;

function presentation() {
  if (mode === 'three') {
    if (!three) three = createThreePresentation(host, canvas2d);
    three.show();
    return three;
  }
  if (three) three.hide();
  canvas2d.show();
  return canvas2d;
}

function hud(snap) {
  $('hud-score').textContent = String(snap.hud.score).padStart(6, '0');
  $('hud-coins').textContent = 'x' + String(snap.hud.coins).padStart(2, '0');
  $('hud-time').textContent = String(snap.hud.time);
  $('hud-lives').textContent = 'x' + snap.hud.lives;
  $('hud-player-name').textContent = snap.hud.name;
  $('hud-world').textContent = snap.hud.world;
}

function overlays(snap) {
  $('pause-indicator').classList.toggle('hidden', !paused);
  $('gameover-overlay').classList.toggle('hidden', snap.session !== 'gameover');
  $('victory-overlay').classList.toggle('hidden', snap.session !== 'victory');
  if (snap.session === 'gameover') $('go-score').textContent = snap.hud.score;
  if (snap.session === 'victory') {
    $('victory-name').textContent = snap.hud.name;
    $('victory-score').textContent = String(snap.hud.score).padStart(6, '0');
  }
}

function input() {
  return {
    left: keys.ArrowLeft || keys.KeyA,
    right: keys.ArrowRight || keys.KeyD,
    jump: keys.ArrowUp || keys.KeyW || keys.Space,
    run: keys.ShiftLeft || keys.ShiftRight || keys.KeyZ,
    duck: keys.ArrowDown || keys.KeyS,
    fire: keys.KeyX || keys.KeyC,
  };
}

function showMenu() {
  $('menu-screen').classList.remove('hidden');
  $('game-screen').classList.add('hidden');
  canvas2d.drawMenu($('menu-mario-canvas'));
}

function startGame() {
  audio.init();
  world.setName($('player-name').value.toUpperCase().replace(/[^A-Z0-9 ]/g, '') || 'MARIO');
  world.reset();
  paused = false;
  $('menu-screen').classList.add('hidden');
  $('game-screen').classList.remove('hidden');
  lastSnap = world.snapshot();
  hud(lastSnap);
  presentation().present(lastSnap);
}

function loop(ts) {
  if (!lastT) lastT = ts;
  acc += ts - lastT; lastT = ts;
  if (acc > 200) acc = 200;
  const playing = !$('game-screen').classList.contains('hidden') && !paused;
  while (acc >= STEP) {
    if (playing && lastSnap && (lastSnap.session === 'playing' || lastSnap.session === 'victory')) {
      lastSnap = world.step(input());
    }
    acc -= STEP;
  }
  if (lastSnap && !$('game-screen').classList.contains('hidden')) {
    hud(lastSnap);
    overlays(lastSnap);
    presentation().present(lastSnap);
  }
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (!$('game-screen').classList.contains('hidden')) {
      const s = lastSnap && lastSnap.session;
      if (s === 'playing' || paused) { paused = !paused; lastT = 0; }
    }
  }
  if (e.code === 'Enter' && !$('menu-screen').classList.contains('hidden')) startGame();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

$('start-btn').addEventListener('click', startGame);
$('controls-btn').addEventListener('click', () => $('controls-modal').classList.remove('hidden'));
$('close-controls').addEventListener('click', () => $('controls-modal').classList.add('hidden'));
$('controls-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
$('continue-btn').addEventListener('click', () => { world.reset(); paused = false; lastSnap = world.snapshot(); lastT = 0; });
$('playagain-btn').addEventListener('click', () => { world.reset(); paused = false; lastSnap = world.snapshot(); lastT = 0; });
$('player-name').addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
});
$('view-toggle').addEventListener('click', () => {
  mode = mode === 'three' ? 'canvas' : 'three';
  $('view-toggle').textContent = mode === 'three' ? '2D PIXELS' : '3D VIEW';
  if (lastSnap) presentation().present(lastSnap);
});

showMenu();
setInterval(() => { if (!$('menu-screen').classList.contains('hidden')) canvas2d.drawMenu($('menu-mario-canvas')); }, 400);
requestAnimationFrame(loop);

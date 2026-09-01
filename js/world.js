import {
  TILE, VIEW_W, VIEW_H, GRAVITY, JUMP_VEL, MAX_FALL, WALK_SPD, RUN_SPD, FRICTION,
  TOTAL_LIVES, INITIAL_TIME, STAR_DURATION, INV_TIME, PLAYER_W, FLAG_COL, CHECK_COL,
  LEVEL_TILES, LEVEL_W, PTS,
} from './config.js';
import { createCourse } from './course.js';

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnEnemies() {
  const list = [];
  const add = (type, col) => {
    const h = type === 'koopa' ? 46 : 28;
    list.push({
      type, x: col * TILE, y: 13 * TILE - h, w: 28, h,
      vx: type === 'koopa' ? -1.2 : -1, vy: 0,
      alive: true, squished: false, squishTimer: 0, animTimer: 0,
    });
  };
  [22, 26, 36, 50, 52, 55, 68, 70, 78, 80, 90, 100, 102, 116, 130, 132, 145, 159, 163, 173]
    .forEach(c => add('goomba', c));
  [42, 62, 98, 120, 138, 146, 164].forEach(c => add('koopa', c));
  return list;
}

function mkPlayer() {
  return {
    x: 3 * TILE, y: 11 * TILE, w: PLAYER_W, h: 30,
    vx: 0, vy: 0, onGround: false, facing: 1,
    state: 'small', starTimer: 0, invincible: 0, fireCooldown: 0,
    ducking: false, dead: false, deathTimer: 0, flagTargetY: 0,
    animFrame: 0, animCounter: 0,
  };
}

export function createWorld(onEvent = () => {}) {
  const course = createCourse();
  const emit = (name) => { try { onEvent(name); } catch (_) {} };

  let player = mkPlayer();
  let entities = spawnEnemies();
  let items = [];
  let fireballs = [];
  let particles = [];
  let flagReached = false;
  let flagSlideY = 0;
  let score = 0, coins = 0, lives = TOTAL_LIVES, gameTime = INITIAL_TIME, timeCounter = 0;
  let blockHitCooldown = 0, playerWasBig = false, coinsTo1up = 0;
  let checkpointX = null, checkpointDisplay = 0;
  let levelComplete = false, tick = 0;
  let session = 'playing';
  let name = 'MARIO';
  let fireworkWait = 0;

  const big = () => player.state !== 'small';
  const ph = () => player.state !== 'small' ? 62 : 30;

  function overlapping(px, py, pw, phit) {
    const res = [];
    const l = Math.floor(px / TILE), r = Math.floor((px + pw - 1) / TILE);
    const t = Math.floor(py / TILE), b = Math.floor((py + phit - 0.001) / TILE);
    for (let row = t; row <= b; row++) for (let col = l; col <= r; col++)
      if (course.solidAt(col, row)) res.push({ col, row });
    return res;
  }

  function particle(p) { particles.push(p); }

  function bumpBlock(col, row) {
    if (blockHitCooldown > 0) return;
    const { outcome } = course.bump(col, row, big());
    if (outcome === 'coin') {
      coins++; score += PTS.coin; emit('coin');
      particle({ x: col * TILE + 8, y: row * TILE, vy: -6, life: 20, type: 'coin' });
      blockHitCooldown = 8; coinsTo1up++;
      if (coinsTo1up >= 100) { coinsTo1up = 0; lives++; emit('1up'); }
    } else if (outcome === 'powerup') {
      blockHitCooldown = 8; emit('block');
      const type = big() ? 'flower' : 'mushroom';
      items.push({
        type, x: col * TILE + 4, y: row * TILE, vy: -3, vx: type === 'mushroom' ? 2 : 0,
        emerging: true, emergeTarget: row * TILE - TILE, collected: false, animTimer: 0,
      });
    } else if (outcome === 'brick-break') {
      emit('block');
      for (let i = 0; i < 4; i++)
        particle({
          x: col * TILE + 8 + (i % 2) * 16, y: row * TILE + (i < 2 ? 0 : 16),
          vx: (i % 2 === 0 ? -2 : 2) + Math.random() - 0.5, vy: -4 + Math.random() * -2,
          life: 40, type: 'brick',
        });
    } else if (outcome === 'brick-nudge') {
      emit('block'); blockHitCooldown = 8;
    }
  }

  function killPlayer() {
    if (!player || player.dead) return;
    player.dead = true; player.deathTimer = 0; player.vy = -9; player.vx = 0;
    lives--; emit('death');
  }

  function playerHit() {
    if (player.invincible > 0 || player.starTimer > 0) return;
    if (big()) {
      if (player.state === 'fire') player.state = 'big';
      else { player.state = 'small'; player.h = 30; player.y += 32; }
      player.invincible = INV_TIME; emit('block');
    } else killPlayer();
  }

  function collectItem(idx) {
    const it = items[idx]; it.collected = true;
    if (it.type === 'mushroom') {
      if (player.state === 'small') { player.state = 'big'; player.h = 62; player.y -= 32; }
      score += PTS.mush; emit('power');
    } else if (it.type === 'flower') { player.state = 'fire'; score += PTS.flower; emit('power'); }
    else if (it.type === 'star') {
      playerWasBig = big(); player.state = 'star'; player.starTimer = STAR_DURATION;
      score += PTS.star; emit('power');
    }
  }

  function triggerFlag() {
    flagReached = true;
    player.x = FLAG_COL * TILE + 4; player.vx = 0; player.vy = 0;
    player.flagTargetY = 13 * TILE - player.h - 4;
    emit('flag'); score += PTS.flag;
    entities.forEach(e => { e.vx = 0; });
  }

  function updateFlag() {
    if (!flagReached) return;
    if (player.y < player.flagTargetY) {
      player.y += 2.5;
      if (flagSlideY < 10 * TILE) flagSlideY += 2.5;
    } else {
      player.y = player.flagTargetY;
      if (player.x < 200 * TILE + 8) player.x += 1.5;
      else if (!levelComplete) {
        levelComplete = true; session = 'victory'; fireworkWait = 0; emit('victory');
      }
    }
  }

  function updatePlayer(input) {
    if (!player || player.dead || flagReached || levelComplete) return;
    const p = player;
    p.ducking = input.duck && big();
    const spd = input.run ? RUN_SPD : WALK_SPD;
    if (input.left) { p.vx = -spd; p.facing = -1; }
    else if (input.right) { p.vx = spd; p.facing = 1; }
    else { p.vx *= FRICTION; if (Math.abs(p.vx) < 0.1) p.vx = 0; }
    p.h = p.ducking ? 30 : ph();
    if (input.jump && p.onGround && !p.ducking) { p.vy = JUMP_VEL; p.onGround = false; emit('jump'); }
    if (!input.jump && p.vy < -3) p.vy *= 0.85;
    p.vy += GRAVITY; if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.animCounter++;
    if (!p.onGround) p.animFrame = 2;
    else if (Math.abs(p.vx) > 0.3) p.animFrame = p.animCounter % 10 < 5 ? 0 : 1;
    else { p.animFrame = 0; p.animCounter = 0; }

    p.x += p.vx;
    const ht = overlapping(p.x, p.y, p.w, p.h);
    if (p.vx > 0) {
      let bc = 999; ht.forEach(t => { if (t.col < bc) bc = t.col; });
      if (bc < 999) { p.x = bc * TILE - p.w; p.vx = 0; }
    } else if (p.vx < 0) {
      let bc = -1; ht.forEach(t => { if (t.col > bc) bc = t.col; });
      if (bc >= 0) { p.x = (bc + 1) * TILE; p.vx = 0; }
    }

    const prevY = p.y, prevH = p.h;
    p.y += p.vy; p.onGround = false;
    const vt = overlapping(p.x, p.y, p.w, p.h);
    if (p.vy > 0) {
      const prevBottom = prevY + prevH;
      let br = -1, bc = -1;
      vt.forEach(t => {
        const ty = t.row * TILE;
        if (ty < p.y + p.h && ty >= prevBottom - 0.001 && t.row > br) { br = t.row; bc = t.col; }
      });
      if (br >= 0) { p.y = br * TILE - prevH; p.vy = 0; p.onGround = true; }
    } else if (p.vy < 0) {
      const prevTop = prevY;
      let br = 99, bc = -1;
      vt.forEach(t => {
        const ty = t.row * TILE;
        if (ty + TILE > p.y && ty + TILE <= prevTop + 1 && t.row < br) { br = t.row; bc = t.col; }
      });
      if (br < 99) { p.y = (br + 1) * TILE; p.vy = 0; bumpBlock(bc, br); }
    }

    if (p.y > VIEW_H + 100) { killPlayer(); return; }
    if (p.starTimer > 0) { p.starTimer--; if (p.starTimer <= 0) p.state = playerWasBig ? 'big' : 'small'; }
    if (p.invincible > 0) p.invincible--;
    if (p.fireCooldown > 0) p.fireCooldown--;

    if (p.state === 'fire' && input.fire && !p.fireCooldown && !flagReached) {
      fireballs.push({ x: p.x + (p.facing > 0 ? p.w : -8), y: p.y + 8, vx: p.facing * 5, vy: -1.5, life: 100, w: 8, h: 8 });
      p.fireCooldown = 15; emit('fire');
    }

    items.forEach((it, i) => {
      if (!it.collected && aabb(p, { x: it.x, y: it.y, w: 28, h: 28 })) collectItem(i);
    });

    entities.forEach(e => {
      if (!e.alive || e.squished) return;
      if (!aabb(p, e)) return;
      if (p.starTimer > 0) {
        e.alive = false; score += PTS.stomp; emit('stomp');
        particle({ x: e.x, y: e.y, vy: -3, life: 30, type: 'pts', text: String(PTS.stomp) });
      } else if (p.vy > 0 && p.y + p.h - e.y < 20) {
        e.squished = true; e.squishTimer = 30; p.vy = -7; score += PTS.stomp; emit('stomp');
        particle({ x: e.x, y: e.y, vy: -3, life: 30, type: 'pts', text: String(PTS.stomp) });
      } else if (!p.invincible) playerHit();
    });
    entities.forEach(e => { if (e.squished) { e.squishTimer--; if (e.squishTimer <= 0) e.alive = false; } });

    if (checkpointX === null && p.x + p.w / 2 >= CHECK_COL * TILE) {
      checkpointX = CHECK_COL * TILE; checkpointDisplay = 90;
    }
    if (checkpointDisplay > 0) checkpointDisplay--;

    const fx = FLAG_COL * TILE;
    if (!flagReached && p.x + p.w >= fx && p.x <= fx + TILE) triggerFlag();
  }

  function updateEnemies() {
    entities.forEach(e => {
      if (!e.alive || e.squished || flagReached) return;
      e.animTimer++; e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL;
      e.x += e.vx;
      const fc = e.vx > 0 ? Math.floor((e.x + e.w) / TILE) : Math.floor(e.x / TILE) - 1;
      const er = Math.floor((e.y + e.h - 1) / TILE);
      if (fc >= 0 && fc < LEVEL_TILES && course.solidItem(fc, er)) e.vx *= -1;
      const ebot = Math.floor((e.y + e.h) / TILE);
      if (fc >= 0 && fc < LEVEL_TILES && !course.solidItem(fc, ebot) && !course.solidItem(fc, ebot + 1)) e.vx *= -1;
      e.y += e.vy;
      const btm = Math.floor((e.y + e.h) / TILE);
      const el = Math.floor(e.x / TILE), er2 = Math.floor((e.x + e.w - 1) / TILE);
      for (let c = el; c <= er2; c++) if (course.solidItem(c, btm)) { e.y = btm * TILE - e.h; e.vy = 0; }
      if (e.y > VIEW_H + 150) e.alive = false;
    });
  }

  function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.collected) { items.splice(i, 1); continue; }
      it.animTimer++;
      if (it.emerging) {
        it.y += it.vy; it.vy += 0.3;
        if (it.y <= it.emergeTarget) { it.y = it.emergeTarget; it.emerging = false; it.vy = 0; }
        continue;
      }
      if (it.type === 'mushroom' || it.type === 'star') {
        it.vy += GRAVITY; if (it.vy > MAX_FALL) it.vy = MAX_FALL;
        it.x += it.vx; it.y += it.vy;
        const b = Math.floor((it.y + 28) / TILE), l = Math.floor(it.x / TILE), r = Math.floor((it.x + 27) / TILE);
        for (let c = l; c <= r; c++) if (course.solidItem(c, b)) { it.y = b * TILE - 28; it.vy = 0; }
        const f = it.vx > 0 ? Math.floor((it.x + 28) / TILE) : Math.floor(it.x / TILE) - 1;
        if (f >= 0 && f < LEVEL_TILES && course.solidItem(f, Math.floor((it.y + 14) / TILE))) it.vx *= -1;
      }
      if (it.y > VIEW_H + 150) items.splice(i, 1);
    }
  }

  function updateFireballs() {
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const fb = fireballs[i]; fb.life--;
      if (fb.life <= 0) { fireballs.splice(i, 1); continue; }
      fb.x += fb.vx; fb.vy += 0.35; fb.y += fb.vy;
      if (fb.y > VIEW_H) { fireballs.splice(i, 1); continue; }
      let gone = false;
      for (const e of entities) {
        if (e.alive && !e.squished && aabb(fb, e)) {
          e.alive = false; fireballs.splice(i, 1); emit('stomp'); gone = true; break;
        }
      }
      if (gone) continue;
      const l = Math.floor(fb.x / TILE), r = Math.floor((fb.x + 7) / TILE);
      const t = Math.floor(fb.y / TILE), b = Math.floor((fb.y + 7) / TILE);
      outer: for (let r2 = t; r2 <= b; r2++) for (let c = l; c <= r; c++)
        if (course.solidItem(c, r2)) { fireballs.splice(i, 1); break outer; }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life--;
      if (p.vy !== undefined) p.vy += 0.2;
      if (p.vx !== undefined) p.x += p.vx;
      if (p.vy !== undefined && p.y !== undefined) p.y += p.vy;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function burstFireworks() {
    fireworkWait++;
    if (fireworkWait % 15 !== 1 || fireworkWait > 300) return;
    const cols = ['#F04040', '#40F040', '#4040F8', '#F8F840', '#F840F8'];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const fx = 50 + Math.random() * (VIEW_W - 100), fy = 40 + Math.random() * (VIEW_H - 160);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, s = 1.5 + Math.random() * 2;
      particle({ x: fx, y: fy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 50, type: 'fw', col });
    }
  }

  function initLevel(keepProgress) {
    course.reset();
    entities = spawnEnemies();
    items = []; fireballs = []; particles = [];
    flagReached = false; flagSlideY = 0; levelComplete = false; blockHitCooldown = 0;
    if (!keepProgress) {
      player = mkPlayer();
    } else {
      player.x = checkpointX != null ? checkpointX : 3 * TILE;
      player.y = 11 * TILE; player.vx = 0; player.vy = 0;
      player.onGround = false; player.dead = false; player.deathTimer = 0;
      player.state = 'small'; player.starTimer = 0; player.h = 30; player.invincible = 90;
    }
  }

  function snapshot() {
    return {
      tick,
      tile: TILE,
      viewW: VIEW_W,
      viewH: VIEW_H,
      levelW: LEVEL_W,
      layout: course.layout(),
      player: player && !player.dead ? {
        x: player.x, y: player.y, w: player.w, h: player.h,
        face: player.facing, state: player.state, animFrame: player.animFrame,
        inv: player.invincible, star: player.starTimer > 0, name,
      } : null,
      playerDead: !!(player && player.dead),
      entities: entities.filter(e => e.alive || e.squished).map(e => ({
        type: e.type, x: e.x, y: e.y, w: e.w, h: e.h,
        squished: e.squished, anim: e.animTimer,
      })),
      items: items.filter(it => !it.collected).map(it => ({ type: it.type, x: it.x, y: it.y })),
      fireballs: fireballs.map(fb => ({ x: fb.x, y: fb.y })),
      particles: particles.map(p => ({ ...p })),
      flag: { col: FLAG_COL, slideY: flagSlideY },
      checkpoint: { col: CHECK_COL, taken: checkpointX != null, display: checkpointDisplay },
      hud: {
        score, coins, time: gameTime, lives, name, world: '1-1',
      },
      session,
      focusX: player ? player.x + player.w / 2 : 0,
    };
  }

  function continueAfterDeath() {
    if (lives <= 0) { session = 'gameover'; return; }
    session = 'playing'; gameTime = INITIAL_TIME; timeCounter = 0;
    initLevel(true);
  }

  return {
    snapshot,
    setName(n) { name = (n || 'MARIO').slice(0, 8); },
    reset() {
      score = 0; coins = 0; lives = TOTAL_LIVES; gameTime = INITIAL_TIME; timeCounter = 0;
      coinsTo1up = 0; playerWasBig = false; checkpointX = null; checkpointDisplay = 0;
      session = 'playing'; player = mkPlayer(); initLevel(false);
    },
    continueAfterDeath,
    step(input) {
      if (session !== 'playing' && session !== 'victory') return snapshot();
      tick++;
      if (session === 'victory') {
        updateFlag(); updateParticles(); burstFireworks();
        return snapshot();
      }
      timeCounter++;
      if (timeCounter >= 60) { timeCounter = 0; if (gameTime > 0) gameTime--; if (gameTime <= 0) killPlayer(); }
      if (blockHitCooldown > 0) blockHitCooldown--;

      if (player.dead) {
        player.deathTimer++; player.vy += GRAVITY; player.y += player.vy;
        if (player.y > VIEW_H + 120) {
          if (lives <= 0) session = 'gameover';
          else continueAfterDeath();
        }
        return snapshot();
      }

      if (flagReached) updateFlag();
      updatePlayer(input || {});
      updateEnemies(); updateItems(); updateFireballs(); updateParticles();
      return snapshot();
    },
  };
}

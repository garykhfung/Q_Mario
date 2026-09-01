import { PAL, PIXEL, SPR_MARKO, SPR_PAL } from './sprites.js';

function spriteW(data) { return data[0]?.length ?? 0; }

function drawArt(ctx, data, pal, x, y, sc = PIXEL, flip = false) {
  const cols = spriteW(data);
  for (let r = 0; r < data.length; r++)
    for (let c = 0; c < data[r].length; c++) {
      const col = pal[data[r][c]];
      if (!col) continue;
      const cx = flip ? x + (cols - 1 - c) * sc : x + c * sc;
      ctx.fillStyle = col;
      ctx.fillRect(cx, y + r * sc, sc, sc);
    }
}

function marioData(big, frame) {
  if (big) {
    if (frame === 2) return SPR_MARKO.mBigJump;
    if (frame === 1) return SPR_MARKO.mBig2;
    return SPR_MARKO.mBig;
  }
  if (frame === 2) return SPR_MARKO.mJump;
  if (frame === 1) return SPR_MARKO.mSmall2;
  return SPR_MARKO.mSmall;
}

function drawGround(ctx, px, py, T) {
  ctx.fillStyle = PAL.groundT;
  ctx.fillRect(px, py, T, 5);
  ctx.fillStyle = '#D09858';
  ctx.fillRect(px, py + 5, T, 1);
  ctx.fillStyle = PAL.groundF;
  ctx.fillRect(px, py + 6, T, T - 6);
  for (let i = 8; i < T; i += 8) {
    ctx.fillStyle = '#A87038';
    ctx.fillRect(px + i, py + 10, 1, T - 10);
  }
}

function drawPipe(ctx, px, py, T, kind) {
  ctx.fillStyle = PAL.pipeLt;
  ctx.fillRect(px, py, 7, T);
  ctx.fillStyle = PAL.pipeM;
  ctx.fillRect(px + 7, py, T - 14, T);
  ctx.fillStyle = PAL.pipeDk;
  ctx.fillRect(px + T - 7, py, 7, T);
  ctx.fillStyle = '#90F090';
  ctx.fillRect(px + 2, py + 4, 3, T - 8);
  if (kind === 'pipeTL' || kind === 'pipeTR') {
    ctx.fillStyle = PAL.pipeGn;
    ctx.fillRect(px - 2, py, T + 4, 7);
    ctx.fillStyle = PAL.pipeDk;
    ctx.fillRect(px - 2, py + 5, T + 4, 2);
    ctx.fillStyle = '#90F090';
    ctx.fillRect(px + 1, py + 1, T - 2, 2);
  }
}

function drawTileArt(ctx, data, pal, px, py, T) {
  const w = spriteW(data);
  const h = data.length;
  drawArt(ctx, data, pal, px + (T - w) / 2, py + (T - h), PIXEL);
}

function drawTile(ctx, kind, px, py, T, tick) {
  switch (kind) {
    case 'ground': drawGround(ctx, px, py, T); break;
    case 'fill':
      ctx.fillStyle = PAL.groundF;
      ctx.fillRect(px, py, T, T);
      break;
    case 'brick': drawTileArt(ctx, SPR_MARKO.brick, SPR_PAL, px, py, T); break;
    case 'qblock': {
      const pulse = Math.floor(tick / 24) % 2;
      const pal = pulse ? SPR_PAL : { ...SPR_PAL, Q: PAL.questDk, I: PAL.quest };
      drawTileArt(ctx, SPR_MARKO.qblock, pal, px, py, T);
      break;
    }
    case 'used': drawTileArt(ctx, SPR_MARKO.used, SPR_PAL, px, py, T); break;
    case 'pipeTL': case 'pipeTR': case 'pipeBL': case 'pipeBR':
      drawPipe(ctx, px, py, T, kind);
      break;
    case 'flagTop':
      ctx.fillStyle = '#888';
      ctx.fillRect(px + 14, py, 4, T);
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(px + 12, py, 8, 8);
      break;
    case 'flagPole': case 'flagBase':
      ctx.fillStyle = '#888';
      ctx.fillRect(px + 14, py, 4, T);
      break;
    case 'castle': drawTileArt(ctx, SPR_MARKO.castle, SPR_PAL, px, py, T); break;
    case 'door':
      drawTileArt(ctx, SPR_MARKO.castle, SPR_PAL, px, py, T);
      ctx.fillStyle = '#1A0800';
      ctx.fillRect(px + 10, py + 14, 12, 18);
      break;
    case 'hard':
      ctx.fillStyle = '#C08040';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = PAL.groundT;
      ctx.fillRect(px, py, T, 5);
      ctx.fillStyle = '#A06830';
      for (let i = 0; i < T; i += 4) ctx.fillRect(px + i, py + 8, 2, 2);
      break;
  }
}

export function createCanvas2D(canvas) {
  const ctx = canvas.getContext('2d');
  let camX = 0;

  function present(snap) {
    const { viewW: W, viewH: H, tile: T, levelW } = snap;
    canvas.width = W;
    canvas.height = H;
    if (snap.player && snap.session === 'playing') {
      camX = snap.focusX - W / 2;
      camX = Math.max(0, Math.min(camX, levelW - W));
    }
    const cam = Math.floor(camX);
    ctx.fillStyle = PAL.sky;
    ctx.fillRect(0, 0, W, H);

    for (const hx of [100, 400, 700, 1100, 1500, 2300, 3100, 4000, 5000]) {
      const x = hx - cam * 0.3;
      if (x > -80 && x < W + 80) {
        ctx.fillStyle = PAL.cloud;
        ctx.beginPath();
        ctx.ellipse(x + 40, 40, 40, 14, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 20, 44, 24, 10, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 60, 44, 24, 10, 0, Math.PI, 0);
        ctx.fill();
      }
    }
    for (const hx of [0, 600, 1300, 2000, 2700, 4100]) {
      const sx = hx - cam * 0.5;
      ctx.fillStyle = PAL.hillGn;
      ctx.beginPath();
      ctx.ellipse(sx + 80, H - 62, 80, 48, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#50B888';
      ctx.beginPath();
      ctx.ellipse(sx + 60, H - 58, 40, 28, 0, Math.PI, 0);
      ctx.fill();
    }

    const sc = Math.floor(cam / T), ec = sc + 31;
    const kinds = snap.layout.kinds;
    for (let row = 0; row < kinds.length; row++) {
      for (let col = sc; col <= ec && col < kinds[0].length; col++) {
        const k = kinds[row][col];
        if (!k || k === 'air') continue;
        const px = col * T - cam;
        if (px > -T && px < W) drawTile(ctx, k, px, row * T, T, snap.tick);
      }
    }

    const chkX = snap.checkpoint.col * T - cam;
    if (chkX > -T && chkX < W + T) {
      ctx.fillStyle = '#888';
      ctx.fillRect(chkX + 14, 9 * T, 4, 4 * T);
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(chkX + 18, 9 * T, 16, 12);
    }
    if (snap.checkpoint.display > 0) {
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHECKPOINT!', W / 2, 60);
      ctx.textAlign = 'left';
    }

    snap.items.forEach(it => {
      const ix = it.x - cam;
      if (it.type === 'mushroom') drawArt(ctx, SPR_MARKO.mushroom, SPR_PAL, ix, it.y);
      else if (it.type === 'flower') drawArt(ctx, SPR_MARKO.fireflower, SPR_PAL, ix, it.y + 4);
      else drawArt(ctx, SPR_MARKO.star, SPR_PAL, ix, it.y + 4);
    });

    snap.entities.forEach(e => {
      const ex = e.x - cam;
      if (e.squished) {
        ctx.fillStyle = PAL.goombaBr;
        ctx.fillRect(ex, e.y + e.h - 6, e.w, 6);
        return;
      }
      const fr = Math.floor(e.anim / 12) % 2;
      const name = e.type === 'goomba' ? (fr ? 'goomba2' : 'goomba') : (fr ? 'koopa2' : 'koopa');
      const spr = SPR_MARKO[name];
      const flip = e.vx > 0;
      const dx = ex + (e.w - spriteW(spr)) / 2;
      const dy = e.y + e.h - spr.length;
      drawArt(ctx, spr, SPR_PAL, dx, dy, PIXEL, flip);
    });

    snap.fireballs.forEach(fb => {
      const fx = fb.x - cam;
      ctx.fillStyle = '#F8B000';
      ctx.beginPath();
      ctx.arc(fx + 4, fb.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF8A0';
      ctx.fillRect(fx + 2, fb.y + 2, 2, 2);
    });

    const fx = snap.flag.col * T - cam;
    if (fx > -T && fx < W + T) {
      ctx.fillStyle = '#888';
      ctx.fillRect(fx + 13, 2 * T, 6, 11 * T);
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(fx + 12, 2 * T - 2, 8, 8);
      const fy = 3 * T + snap.flag.slideY;
      ctx.fillStyle = PAL.flag;
      ctx.fillRect(fx + 18, fy, 28, 20);
    }

    const p = snap.player;
    if (p) {
      if (!(p.inv && Math.floor(p.inv / 4) % 2 === 0)) {
        const d = marioData(p.state !== 'small', p.animFrame);
        const pal = p.star ? { ...SPR_PAL, R: '#F8F800', B: '#F8A000', r: '#D0A000' } : SPR_PAL;
        const flip = p.face <= 0;
        const dx = p.x - cam + (p.w - spriteW(d)) / 2;
        const dy = p.y + p.h - d.length;
        drawArt(ctx, d, pal, dx, dy, PIXEL, flip);
      }
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(p.name, p.x - cam + p.w / 2, p.y - 4);
      ctx.fillText(p.name, p.x - cam + p.w / 2, p.y - 4);
      ctx.textAlign = 'left';
    }

    snap.particles.forEach(pt => {
      const px = pt.x - cam;
      if (pt.type === 'coin') {
        ctx.fillStyle = PAL.yellow;
        ctx.fillRect(px + 1, pt.y + 1, 6, 6);
        ctx.fillStyle = '#E8A800';
        ctx.fillRect(px, pt.y, 8, 2);
        ctx.fillRect(px, pt.y + 6, 8, 2);
      } else if (pt.type === 'pts') {
        ctx.fillStyle = '#FFF';
        ctx.font = '8px monospace';
        ctx.fillText(pt.text || '', px, pt.y);
      } else if (pt.type === 'brick') {
        ctx.fillStyle = PAL.brick;
        ctx.fillRect(px, pt.y, 8, 8);
        ctx.fillStyle = PAL.brickLn;
        ctx.fillRect(px, pt.y, 8, 2);
      } else if (pt.type === 'fw') {
        ctx.fillStyle = pt.col || '#FFF';
        ctx.fillRect(px, pt.y, 3, 3);
      }
    });
  }

  function drawMenu(mc) {
    const c = mc.getContext('2d');
    c.clearRect(0, 0, mc.width, mc.height);
    const mario = SPR_MARKO.mSmall;
    const sc = 4;
    const mx = (mc.width - spriteW(mario) * sc) / 2;
    drawArt(c, mario, SPR_PAL, mx, 16, sc);
    const qb = SPR_MARKO.qblock;
    const qx = (mc.width - spriteW(qb) * 3) / 2;
    drawArt(c, qb, SPR_PAL, qx, 108, 3);
  }

  return {
    present,
    drawMenu,
    show() { canvas.classList.remove('hidden'); },
    hide() { canvas.classList.add('hidden'); },
  };
}

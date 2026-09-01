import { PAL, SPR_MARKO, SPR_PAL } from './sprites.js';

function drawArt(ctx, data, pal, x, y, sc = 2) {
  for (let r = 0; r < data.length; r++)
    for (let c = 0; c < data[r].length; c++) {
      const col = pal[data[r][c]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x + c * sc, y + r * sc, sc, sc); }
    }
}

function marioData(face, big, frame) {
  if (big) {
    if (frame === 2) return face > 0 ? SPR_MARKO.mBigJumpR : SPR_MARKO.mBigJumpL;
    if (frame === 1) return face > 0 ? SPR_MARKO.mBigR2 : SPR_MARKO.mBigL2;
    return face > 0 ? SPR_MARKO.mBigR : SPR_MARKO.mBigL;
  }
  if (frame === 2) return face > 0 ? SPR_MARKO.mJumpR : SPR_MARKO.mJumpL;
  if (frame === 1) return face > 0 ? SPR_MARKO.mSmallR2 : SPR_MARKO.mSmallL2;
  return face > 0 ? SPR_MARKO.mSmallR : SPR_MARKO.mSmallL;
}

function drawTile(ctx, kind, px, py, T, tick) {
  switch (kind) {
    case 'ground':
      ctx.fillStyle = PAL.groundT; ctx.fillRect(px, py, T, 4);
      ctx.fillStyle = PAL.groundF; ctx.fillRect(px, py + 4, T, T - 4);
      break;
    case 'fill':
      ctx.fillStyle = PAL.groundF; ctx.fillRect(px, py, T, T); break;
    case 'brick': drawArt(ctx, SPR_MARKO.brick, SPR_PAL, px, py, 2); break;
    case 'qblock': {
      const pulse = Math.floor(tick / 24) % 2;
      const pal = pulse ? SPR_PAL : { ...SPR_PAL, Q: PAL.questDk, I: PAL.quest };
      drawArt(ctx, SPR_MARKO.qblock, pal, px, py, 2); break;
    }
    case 'used': drawArt(ctx, SPR_MARKO.used, SPR_PAL, px, py, 2); break;
    case 'pipeTL': case 'pipeTR': case 'pipeBL': case 'pipeBR':
      ctx.fillStyle = PAL.pipeLt; ctx.fillRect(px, py, 8, T);
      ctx.fillStyle = PAL.pipeM; ctx.fillRect(px + 8, py, T - 16, T);
      ctx.fillStyle = PAL.pipeDk; ctx.fillRect(px + T - 8, py, 8, T);
      if (kind === 'pipeTL' || kind === 'pipeTR') {
        ctx.fillStyle = PAL.pipeGn; ctx.fillRect(px - 2, py, T + 4, 6);
      }
      break;
    case 'flagTop':
      ctx.fillStyle = '#888'; ctx.fillRect(px + 14, py, 4, T);
      ctx.fillStyle = PAL.yellow; ctx.fillRect(px + 12, py, 8, 8); break;
    case 'flagPole': case 'flagBase':
      ctx.fillStyle = '#888'; ctx.fillRect(px + 14, py, 4, T); break;
    case 'castle': drawArt(ctx, SPR_MARKO.castle, SPR_PAL, px, py, 2); break;
    case 'door':
      drawArt(ctx, SPR_MARKO.castle, SPR_PAL, px, py, 2);
      ctx.fillStyle = '#000'; ctx.fillRect(px + 8, py + 12, 16, 20); break;
    case 'hard':
      ctx.fillStyle = '#C08040'; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = PAL.groundT; ctx.fillRect(px, py, T, 4); break;
  }
}

export function createCanvas2D(canvas) {
  const ctx = canvas.getContext('2d');
  let camX = 0;

  function present(snap) {
    const { viewW: W, viewH: H, tile: T, levelW } = snap;
    canvas.width = W; canvas.height = H;
    if (snap.player && snap.session === 'playing') {
      camX = snap.focusX - W / 2;
      camX = Math.max(0, Math.min(camX, levelW - W));
    }
    const cam = Math.floor(camX);
    ctx.fillStyle = PAL.sky; ctx.fillRect(0, 0, W, H);

    for (const hx of [100, 400, 700, 1100, 1500, 2300, 3100, 4000, 5000]) {
      const x = hx - cam * 0.3;
      if (x > -80 && x < W + 80) {
        ctx.fillStyle = PAL.cloud;
        ctx.beginPath(); ctx.ellipse(x + 40, 40, 40, 14, 0, Math.PI, 0); ctx.fill();
      }
    }
    for (const hx of [0, 600, 1300, 2000, 2700, 4100]) {
      const sx = hx - cam * 0.5;
      ctx.fillStyle = PAL.hillGn;
      ctx.beginPath(); ctx.ellipse(sx + 80, H - 62, 80, 48, 0, Math.PI, 0); ctx.fill();
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
      ctx.fillStyle = '#888'; ctx.fillRect(chkX + 14, 9 * T, 4, 4 * T);
      ctx.fillStyle = PAL.yellow; ctx.fillRect(chkX + 18, 9 * T, 16, 12);
    }
    if (snap.checkpoint.display > 0) {
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('CHECKPOINT!', W / 2, 60); ctx.textAlign = 'left';
    }

    snap.items.forEach(it => {
      const ix = it.x - cam;
      if (it.type === 'mushroom') drawArt(ctx, SPR_MARKO.mushroom, SPR_PAL, ix, it.y, 2);
      else if (it.type === 'flower') drawArt(ctx, SPR_MARKO.fireflower, SPR_PAL, ix, it.y + 4, 2);
      else drawArt(ctx, SPR_MARKO.star, SPR_PAL, ix, it.y + 4, 2);
    });
    snap.entities.forEach(e => {
      const ex = e.x - cam;
      if (e.squished) { ctx.fillStyle = PAL.goombaBr; ctx.fillRect(ex, e.y + e.h - 8, e.w, 7); return; }
      const fr = Math.floor(e.anim / 12) % 2;
      const name = e.type === 'goomba' ? (fr ? 'goomba2' : 'goomba') : (fr ? 'koopa2' : 'koopa');
      drawArt(ctx, SPR_MARKO[name], SPR_PAL, ex, e.y, 2);
    });
    snap.fireballs.forEach(fb => {
      const fx = fb.x - cam;
      ctx.fillStyle = '#F8B000'; ctx.beginPath(); ctx.arc(fx + 4, fb.y + 4, 5, 0, Math.PI * 2); ctx.fill();
    });

    const fx = snap.flag.col * T - cam;
    if (fx > -T && fx < W + T) {
      ctx.fillStyle = '#888'; ctx.fillRect(fx + 13, 2 * T, 6, 11 * T);
      ctx.fillStyle = PAL.yellow; ctx.fillRect(fx + 12, 2 * T - 2, 8, 8);
      const fy = 3 * T + snap.flag.slideY;
      ctx.fillStyle = PAL.flag; ctx.fillRect(fx + 18, fy, 28, 20);
    }

    const p = snap.player;
    if (p) {
      if (!(p.inv && Math.floor(p.inv / 4) % 2 === 0)) {
        const d = marioData(p.face, p.state !== 'small', p.animFrame);
        const pal = p.star ? { ...SPR_PAL, R: '#F8F800', B: '#F8A000' } : SPR_PAL;
        const dy = p.y + p.h - d.length * 2;
        drawArt(ctx, d, pal, p.x - cam, dy, 2);
      }
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeText(p.name, p.x - cam + 11, p.y - 4);
      ctx.fillText(p.name, p.x - cam + 11, p.y - 4);
      ctx.textAlign = 'left';
    }

    snap.particles.forEach(pt => {
      const px = pt.x - cam;
      if (pt.type === 'coin') { ctx.fillStyle = PAL.yellow; ctx.fillRect(px, pt.y, 8, 8); }
      else if (pt.type === 'pts') { ctx.fillStyle = '#FFF'; ctx.font = '8px monospace'; ctx.fillText(pt.text || '', px, pt.y); }
      else if (pt.type === 'brick') { ctx.fillStyle = PAL.brick; ctx.fillRect(px, pt.y, 8, 8); }
      else if (pt.type === 'fw') { ctx.fillStyle = pt.col || '#FFF'; ctx.fillRect(px, pt.y, 4, 4); }
    });
  }

  function drawMenu(mc) {
    const c = mc.getContext('2d');
    c.clearRect(0, 0, mc.width, mc.height);
    drawArt(c, SPR_MARKO.mSmallR, SPR_PAL, 24, 20, 5);
    drawArt(c, SPR_MARKO.qblock, SPR_PAL, 20, 110, 4);
  }

  return { present, drawMenu, show() { canvas.classList.remove('hidden'); }, hide() { canvas.classList.add('hidden'); } };
}

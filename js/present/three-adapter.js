import * as THREE from 'three';

const COLORS = {
  sky: 0x5c94fc,
  ground: 0xc08040,
  groundTop: 0xe8c080,
  brick: 0xc06040,
  qblock: 0xf8d050,
  used: 0x804040,
  pipe: 0x40c040,
  hard: 0xa06830,
  castle: 0xa08060,
  door: 0x202020,
  flag: 0x40c040,
  pole: 0xaaaaaa,
  mario: 0xd04040,
  overall: 0x3848dc,
  skin: 0xf8b050,
  goomba: 0xa05020,
  koopa: 0x50c850,
  mush: 0xf04040,
  flower: 0xf84040,
  star: 0xf8f800,
  fire: 0xf8b000,
};

function kindColor(k) {
  return ({
    ground: COLORS.ground, fill: COLORS.ground, brick: COLORS.brick, qblock: COLORS.qblock,
    used: COLORS.used, pipeTL: COLORS.pipe, pipeTR: COLORS.pipe, pipeBL: COLORS.pipe, pipeBR: COLORS.pipe,
    hard: COLORS.hard, castle: COLORS.castle, door: COLORS.door, flagTop: COLORS.pole,
    flagPole: COLORS.pole, flagBase: COLORS.pole,
  })[k] || null;
}

export function createThreePresentation(host, canvas2d) {
  const W = 960, H = 480;
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(1);
  renderer.domElement.id = 'game-canvas-3d';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '960px';
  renderer.domElement.style.height = '480px';
  renderer.domElement.style.imageRendering = 'pixelated';
  host.insertBefore(renderer.domElement, host.firstChild);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  const cam = new THREE.OrthographicCamera(0, W, H, 0, 0.1, 2000);
  cam.position.set(0, 0, 400);
  cam.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const sun = new THREE.DirectionalLight(0xfff2cc, 0.6);
  sun.position.set(-80, 200, 160);
  scene.add(sun);

  const tileGroup = new THREE.Group();
  scene.add(tileGroup);
  const actors = new THREE.Group();
  scene.add(actors);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mats = {};
  function mat(hex) {
    if (!mats[hex]) mats[hex] = new THREE.MeshLambertMaterial({ color: hex });
    return mats[hex];
  }
  function box(hex, w, h, d = 24) {
    const m = new THREE.Mesh(boxGeo, mat(hex));
    m.scale.set(w, h, d);
    return m;
  }

  let builtRev = -1;
  let camX = 0;

  function gy(y, h) { return H - y - h / 2; }
  function gx(x, w) { return x + w / 2; }

  function rebuildTiles(layout, T) {
    while (tileGroup.children.length) {
      const c = tileGroup.children[0];
      tileGroup.remove(c);
    }
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const k = layout.kinds[r][c];
        const col = kindColor(k);
        if (!col) continue;
        const depth = k.startsWith('pipe') ? 36 : k === 'qblock' ? 20 : 28;
        const mesh = box(col, T - 1, T - 1, depth);
        mesh.position.set(c * T + T / 2, H - r * T - T / 2, 0);
        tileGroup.add(mesh);
      }
    }
    builtRev = layout.revision;
  }

  function present(snap) {
    if (canvas2d) canvas2d.hide();
    renderer.domElement.classList.remove('hidden');
    const T = snap.tile;
    if (snap.layout.revision !== builtRev) rebuildTiles(snap.layout, T);

    if (snap.session === 'playing' && snap.player) {
      camX = snap.focusX - W / 2;
      camX = Math.max(0, Math.min(camX, snap.levelW - W));
    }
    cam.left = camX; cam.right = camX + W; cam.top = H; cam.bottom = 0; cam.updateProjectionMatrix();

    while (actors.children.length) actors.remove(actors.children[0]);

    const p = snap.player;
    if (p && !(p.inv && Math.floor(p.inv / 4) % 2 === 0)) {
      const body = box(p.star ? COLORS.star : COLORS.mario, p.w, p.h * 0.45, 18);
      body.position.set(gx(p.x, p.w), gy(p.y, p.h) + p.h * 0.2, 12);
      const legs = box(COLORS.overall, p.w * 0.9, p.h * 0.5, 16);
      legs.position.set(gx(p.x, p.w), gy(p.y, p.h) - p.h * 0.15, 10);
      const head = box(COLORS.skin, p.w * 0.7, Math.min(14, p.h * 0.3), 16);
      head.position.set(gx(p.x, p.w), gy(p.y, p.h) + p.h * 0.38, 14);
      actors.add(body, legs, head);
    }

    snap.entities.forEach(e => {
      const hex = e.type === 'koopa' ? COLORS.koopa : COLORS.goomba;
      const h = e.squished ? 8 : e.h;
      const m = box(hex, e.w, h, 20);
      m.position.set(gx(e.x, e.w), gy(e.y + (e.squished ? e.h - 8 : 0), h), 8);
      actors.add(m);
    });
    snap.items.forEach(it => {
      const hex = it.type === 'mushroom' ? COLORS.mush : it.type === 'flower' ? COLORS.flower : COLORS.star;
      const m = box(hex, 24, 24, 16);
      m.position.set(gx(it.x, 24), gy(it.y, 24), 14);
      actors.add(m);
    });
    snap.fireballs.forEach(fb => {
      const m = box(COLORS.fire, 10, 10, 10);
      m.position.set(gx(fb.x, 8), gy(fb.y, 8), 20);
      actors.add(m);
    });

    const flagX = snap.flag.col * T;
    const fy = 3 * T + snap.flag.slideY;
    const flag = box(COLORS.flag, 28, 18, 4);
    flag.position.set(flagX + 32, gy(fy, 18), 6);
    actors.add(flag);

    snap.particles.forEach(pt => {
      const m = box(pt.type === 'coin' ? COLORS.qblock : 0xffffff, 6, 6, 6);
      m.position.set(gx(pt.x, 6), gy(pt.y, 6), 30);
      actors.add(m);
    });

    renderer.render(scene, cam);
  }

  return {
    present,
    show() { renderer.domElement.style.display = 'block'; if (canvas2d) canvas2d.hide(); },
    hide() { renderer.domElement.style.display = 'none'; },
  };
}

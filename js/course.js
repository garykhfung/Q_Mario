import { LEVEL_TILES, ROWS, FLAG_COL } from './config.js';

const KIND = {
  0: 'air', 1: 'ground', 2: 'fill', 3: 'brick', 4: 'qblock', 5: 'qblock',
  6: 'used', 7: 'pipeTL', 8: 'pipeTR', 9: 'pipeBL', 10: 'pipeBR',
  12: 'flagTop', 13: 'flagBase', 14: 'flagPole', 15: 'castle', 16: 'door', 20: 'hard',
};

function solidType(t) {
  return (t >= 1 && t <= 6) || (t >= 7 && t <= 16) || t === 20;
}
function solidItemType(t) {
  return (t >= 1 && t <= 3) || (t >= 7 && t <= 16) || t === 20;
}

function buildGrid() {
  const t = Array.from({ length: ROWS }, () => Array(LEVEL_TILES).fill(0));
  const gaps = new Set([39, 40, 84, 85, 109, 110, 160, 161]);
  for (let c = 0; c < LEVEL_TILES; c++) if (!gaps.has(c)) { t[13][c] = 1; t[14][c] = 2; }
  const p = (r, c, v) => { if (c >= 0 && c < LEVEL_TILES && r >= 0 && r < ROWS) t[r][c] = v; };
  const pipe = (c, h) => {
    const tr = 13 - h; p(tr, c, 7); p(tr, c + 1, 8);
    for (let r = tr + 1; r < 13; r++) { p(r, c, 9); p(r, c + 1, 10); }
  };
  const stairs = (c, h, right) => {
    for (let i = 0; i < h; i++) for (let r = 13 - i; r <= 13; r++) p(r, right ? c + i : c - i, 20);
  };
  p(9, 16, 4); p(9, 21, 5); p(9, 22, 4); p(9, 23, 4);
  p(9, 18, 3); p(9, 19, 3); p(9, 20, 3);
  p(9, 41, 4); p(9, 42, 4); p(9, 43, 4); p(9, 44, 4);
  for (let c = 60; c <= 63; c++) p(9, c, 3);
  for (let c = 65; c <= 68; c++) p(9, c, 3);
  for (let c = 61; c <= 66; c++) p(5, c, 3);
  p(9, 77, 4); p(9, 78, 4); p(9, 79, 4); p(9, 80, 4);
  p(5, 78, 5);
  for (let c = 83; c <= 86; c++) p(9, c, 3);
  p(9, 91, 4); p(9, 92, 4); p(9, 93, 4);
  for (let c = 94; c <= 97; c++) p(9, c, 3);
  for (let c = 103; c <= 105; c++) p(9, c, 3);
  p(9, 107, 4); p(9, 108, 4);
  p(9, 118, 4); p(9, 119, 4);
  for (let c = 120; c <= 123; c++) p(9, c, 3);
  p(9, 126, 4); p(9, 127, 4);
  for (let c = 130; c <= 133; c++) p(9, c, 3);
  stairs(148, 4, true); stairs(157, 4, false);
  stairs(165, 4, true); stairs(172, 4, false);
  stairs(182, 2, true); stairs(185, 4, true); stairs(189, 8, true);
  p(2, FLAG_COL, 12);
  for (let r = 3; r <= 12; r++) p(r, FLAG_COL, 14);
  p(13, FLAG_COL, 13);
  for (let c = 200; c <= 207; c++) for (let r = 9; r <= 12; r++) p(r, c, 15);
  p(11, 203, 16); p(11, 204, 16);
  [28, 48, 57, 73, 95, 114, 136, 153].forEach((c, i) => pipe(c, [2, 3, 2, 4, 2, 3, 2, 2][i]));
  return t;
}

export function createCourse() {
  let grid = buildGrid();
  let revision = 1;

  function typeAt(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= LEVEL_TILES) return 0;
    return grid[row][col] || 0;
  }

  return {
    flagCol: FLAG_COL,
    revision() { return revision; },
    typeAt,
    kindAt(col, row) { return KIND[typeAt(col, row)] || 'air'; },
    solidAt(col, row) { return solidType(typeAt(col, row)); },
    solidItem(col, row) { return solidItemType(typeAt(col, row)); },
    layout() {
      const kinds = [];
      for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < LEVEL_TILES; c++) row.push(KIND[grid[r][c]] || 'air');
        kinds.push(row);
      }
      return { cols: LEVEL_TILES, rows: ROWS, kinds, revision };
    },
    /** @returns {{ outcome: 'coin'|'powerup'|'brick-break'|'brick-nudge'|null }} */
    bump(col, row, powered) {
      const t = typeAt(col, row);
      if (t === 4) { grid[row][col] = 6; revision++; return { outcome: 'coin' }; }
      if (t === 5) { grid[row][col] = 6; revision++; return { outcome: 'powerup' }; }
      if (t === 3) {
        if (powered) { grid[row][col] = 0; revision++; return { outcome: 'brick-break' }; }
        return { outcome: 'brick-nudge' };
      }
      return { outcome: null };
    },
    reset() { grid = buildGrid(); revision++; },
  };
}

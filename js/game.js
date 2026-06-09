// ============================================================
// SUPER MARIO BROS. — Complete Game Engine (v2)
// ============================================================

// ─── Constants ───────────────────────────────────────────────
const TILE = 32;
const COLS_VIS = 30;
const ROWS_VIS = 15;
const CANVAS_W = COLS_VIS * TILE;
const CANVAS_H = ROWS_VIS * TILE;
const GRAVITY = 0.52;
const JUMP_VEL = -13.0;
const MAX_FALL = 12;
const WALK_SPD = 2.4;
const RUN_SPD = 4.0;
const FRICTION = 0.85;
const TOTAL_LIVES = 3;
const INITIAL_TIME = 400;
const STAR_DURATION = 600;
const INVINCIBLE_DURATION = 90;
const COIN_POINTS = 200;
const STOMP_POINTS = 100;
const MUSHROOM_POINTS = 1000;
const FLOWER_POINTS = 1000;
const STAR_POINTS = 1000;
const FLAG_POINTS = 5000;
const LEVEL_WIDTH_TILES = 210;
const LEVEL_W = LEVEL_WIDTH_TILES * TILE;
const CANVAS_CX = CANVAS_W / 2;
const PLAYER_W = 22;

let canvas, ctx;
let gameState = 'menu';
let animFrameId = null;

// ─── Sound ───────────────────────────────────────────────────
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playNote(freq, dur, type, vol, delay) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime + (delay || 0);
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) {}
}
function sfxJump() { playNote(500, 0.08, 'square', 0.06); playNote(700, 0.06, 'square', 0.06, 0.04); }
function sfxCoin() { playNote(988, 0.06, 'square', 0.06); playNote(1319, 0.1, 'square', 0.06, 0.06); }
function sfxStomp() { playNote(250, 0.12, 'square', 0.07); }
function sfxPowerup() { playNote(523, 0.06, 'square', 0.06); playNote(659, 0.06, 'square', 0.06, 0.06); playNote(784, 0.08, 'square', 0.06, 0.12); }
function sfxDeath() { playNote(400, 0.12, 'square', 0.08); playNote(300, 0.12, 'square', 0.08, 0.12); playNote(200, 0.25, 'square', 0.08, 0.24); }
function sfxBlock() { playNote(180, 0.05, 'square', 0.04); }
function sfxFlag() { [523,587,659,784,880,988,1175].forEach((f,i) => playNote(f, 0.1, 'square', 0.06, i*0.06)); }
function sfxFire() { playNote(900, 0.04, 'square', 0.04); playNote(1300, 0.04, 'square', 0.04, 0.02); }
function sfx1up() { playNote(523, 0.08, 'square', 0.06); playNote(659, 0.08, 'square', 0.06, 0.08); playNote(784, 0.1, 'square', 0.06, 0.16); }

// ─── Color Palette ───────────────────────────────────────────
const PAL = {
  red:'#C04040', skin:'#F8B050', blue:'#4040F8', brown:'#804000',
  white:'#F8F8F8', black:'#000000', yellow:'#F8D050', green:'#40A040',
  goombaBr:'#A05020', goombaDk:'#682800',
  brick:'#C06040', brickDk:'#803020', brickLn:'#E09070',
  quest:'#F8D050', questDk:'#C08020', used:'#804040',
  pipeGn:'#40C040', pipeDk:'#208020', pipeLt:'#80E880',
  groundT:'#E8C080', groundF:'#C08040', sky:'#5C94FC',
  mushRd:'#F04040', mushWt:'#F8F8F8',
  starYl:'#F8F800', starOr:'#F8A000',
  flowerR:'#F84040', flowerW:'#F8F8F8',
  flag:'#40C040', flagPl:'#A0A0A0',
  castle:'#A08060', castleD:'#604020',
  cloud:'#F8F8F8', hillGn:'#68C8A0', bushGn:'#40A040',
  // Extended palette for sprite detail
  hatRd:'#D04040', shrt:'#D04848', ovrl:'#3848DC', shoe:'#683010',
  hair:'#5C3010', koLt:'#50C850', koDk:'#309030', koYl:'#E8C040',
  pipeM:'#60D860', pipeD:'#209020',
};

// ─── Pixel Art Sprite Data ──────────────────────────────────
// '.' = transparent, each sprite row is drawn at scale pixels per cell

const SPR_MARKO = {
  mSmallR: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '..77.77.77..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    '..NNNNNNNN..',
    '.NN..NN..NN.',
    '............',
  ],
  mSmallL: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWSSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '..77.77.77..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    '..NNNNNNNN..',
    '.NN..NN..NN.',
    '............',
  ],
  mSmallR2: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '..77.77.77..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BKKB.BBBB.BB',
    '..NNNN..NN..',
    '.NN......NN.',
    '............',
  ],
  mSmallL2: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWSSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '..77.77.77..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BB.BBBB.BKKB',
    '..NN..NNNN..',
    '.NN......NN.',
    '............',
  ],
  mJumpR: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '.77..77..77.',
    '.BB..BB..BB.',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    '..BBBBBBBB..',
    '..NNNN..NN..',
    '.NN......NN.',
    '............',
  ],
  mJumpL: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWSSS..',
    '..HHHHHHHH..',
    '..77777777..',
    '..77..77..77',
    '.BB..BB..BB.',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    '..BBBBBBBB..',
    '..NN..NNNN..',
    '.NN......NN.',
    '............',
  ],
  mBigR: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..SS...SS...',
    '..77777777..',
    '..77....77..',
    '.777...777..',
    '7777...7777.',
    '.777...777..',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    'BBB.BBBB.BBB',
    '.BB.BBBB.BB.',
    '..BBBBBBBB..',
    '..NNNNNNNN..',
    '.NN..NN..NN.',
    '.NN..NN..NN.',
    '.NN......NN.',
    '.NN......NN.',
    '............',
    '............',
    '............',
    '............',
  ],
  mBigL: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWWSS..',
    '...SS...SS..',
    '..77777777..',
    '..77....77..',
    '..777...777.',
    '.7777...7777',
    '..777...777.',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    'BBB.BBBB.BBB',
    '.BB.BBBB.BB.',
    '..BBBBBBBB..',
    '..NNNNNNNN..',
    '.NN..NN..NN.',
    '.NN..NN..NN.',
    '.NN......NN.',
    '.NN......NN.',
    '............',
    '............',
    '............',
    '............',
  ],
  mBigR2: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..SS...SS...',
    '..77777777..',
    '..77....77..',
    '.777...777..',
    '7777...7777.',
    '.777...777..',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    'BBB..BBB..BB',
    'BBB..BBB..BB',
    '.BBB.BB..BB.',
    '..BB......BB',
    '..NN..NN....',
    '.NN......NN.',
    '.NN......NN.',
    '..NN....NN..',
    '..NN....NN..',
    '............',
    '............',
    '............',
    '............',
  ],
  mBigL2: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWWSS..',
    '...SS...SS..',
    '..77777777..',
    '..77....77..',
    '..777...777.',
    '.7777...7777',
    '..777...777.',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    'BB..BBB..BBB',
    'BB..BBB..BBB',
    '.BB..BB.BBB.',
    'BB......BB..',
    '....NN..NN..',
    '.NN......NN.',
    '.NN......NN.',
    '..NN....NN..',
    '..NN....NN..',
    '............',
    '............',
    '............',
    '............',
  ],
  mBigJumpR: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..HHH.SSSS..',
    '..SS...SS...',
    '..SSWWSWSS..',
    '..SS...SS...',
    '..77777777..',
    '..77....77..',
    '77777...777.',
    '..77....77..',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    'BBB..BB..BB.',
    'BBB..BB..BB.',
    '.BB..BB..BB.',
    '..BB....BB..',
    '..NN....NN..',
    '.NN......NN.',
    '.NN......NN.',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
  ],
  mBigJumpL: [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..SSSS.HHH..',
    '...SS...SS..',
    '..SSWSWWSS..',
    '...SS...SS..',
    '..77777777..',
    '..77....77..',
    '.777...77777',
    '..77....77..',
    '..77....77..',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    'BBBBBBBBBBBB',
    'BBBBBBBBBBBB',
    'BBB.BBBB.BBB',
    '.BB..BB..BBB',
    '.BB..BB..BBB',
    '.BB..BB..BB.',
    '..BB....BB..',
    '..NN....NN..',
    '.NN......NN.',
    '.NN......NN.',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
  ],
  goomba: [
    '.....AAAAA.....',
    '....AAAAAAAA...',
    '...A.AAAAA.A...',
    '..AAA.K.K.AAA..',
    '..AAAAKKKAAAA..',
    '..AAAA.K.AAAA..',
    '..AA.WWWWW.AA..',
    '..AA.WK.KW.AA..',
    '..AA.WWWWW.AA..',
    '..AAAA.K.AAAA..',
    '...AAA.AAA.A...',
    '....AAAAAAA....',
    '...AADDDDDAA...',
    '..AAAA.DDDAAAA.',
    '..DDDD..DDDDDD.',
    '...............',
  ],
  goomba2: [
    '.....AAAAA.....',
    '....AAAAAAAA...',
    '...A.AAAAA.A...',
    '..AAA.K.K.AAA..',
    '..AAAAKKKAAAA..',
    '..AAAA.K.AAAA..',
    '..AA.WWWWW.AA..',
    '..AA.WK.KW.AA..',
    '..AA.WWWWW.AA..',
    '..AAAA.K.AAAA..',
    '...AAA.AAA.A...',
    '....AAAAAAA....',
    '...AAAA.DDDD...',
    '..DDDDD.DDDD...',
    '..DDDD..DDDD...',
    '...............',
  ],
  koopa: [
    '......EEEE......',
    '.....EEEEEE.....',
    '....EEEEEEEE....',
    '...EEEEEEEEEE...',
    '...EEE..EE.EE...',
    '...EEEEEEEEEE...',
    '...EEEEEEEEEE...',
    '....EEEEEEEE....',
    '....00000000....',
    '...0000000000...',
    '..000000000000..',
    '..00..0000..00..',
    '..EEEEEEEEEEEE..',
    '.EEEEEEEEEEEEEE.',
    'EEEEEEEEEEEEEEEE',
    'EEE.EEEEEE.EEEE.',
    '..EEE.EEEE.EEE..',
    '..EEE.EEEE.EEE..',
    '..EEE.EEEE.EEE..',
    '..EEE..EE..EEE..',
    '..EEE......EEE..',
    '...EE......EE...',
    '......E....E....',
  ],
  koopa2: [
    '......EEEE......',
    '.....EEEEEE.....',
    '....EEEEEEEE....',
    '...EEEEEEEEEE...',
    '...EEE..EE.EE...',
    '...EEEEEEEEEE...',
    '...EEEEEEEEEE...',
    '....EEEEEEEE....',
    '....00000000....',
    '...0000000000...',
    '..000000000000..',
    '..00..0000..00..',
    '..EEEEEEEEEEEE..',
    '.EEEEEEEEEEEEEE.',
    'EEEEEEEEEEEEEEEE',
    'EEE..EEEE..EEEE.',
    '..EEE.EEEE.EEE..',
    '..EEE.EEEE.EEE..',
    '..EEE.EEEE.EEE..',
    '..EEE..EE..EEE..',
    '..EEE......EEE..',
    '...EE......EE...',
    '......E....E....',
  ],
  mushroom: [
    '....2222....',
    '...222222...',
    '..22222222..',
    '..22.MMMM22.',
    '.222MMMM222.',
    '.22MMMMMM22.',
    '.22MM..MM22.',
    '.22MMMMMM22.',
    '..22222222..',
    '..22..MM22..',
    '..22MMMM22..',
    '..22MMMM22..',
    '...22..22...',
    '...22..22...',
  ],
  fireflower: [
    '.....22222.....',
    '....2222222....',
    '...222222222...',
    '...22..WW..22..',
    '..222..WW..222.',
    '..22222222222..',
    '..22222222222..',
    '....22222222...',
    '...22..33..22..',
    '..222..33..222.',
    '..22222222222..',
    '..222......222.',
    '....22....22...',
    '.....2....2....',
  ],
  star: [
    '.....OOO.....',
    '....OOOOO....',
    '...OOYYYOO...',
    '..OOOYYYOOO..',
    '.OOOOYYYYOOO.',
    'OOOOOYYOOOOOO',
    'OOOOOYYOOOOOO',
    '.OOOOYYYYOOO.',
    '..OOOYYYOOO..',
    '...OOYYYOO...',
    '....OOOOO....',
    '.....OOO.....',
  ],
  qblock: [
    '..QQQQQQQQQQQQ..',
    '.QQQQQQQQQQQQQQ.',
    '.QQIIIIIIIIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIQQQQQQIQQQQ.',
    '.QQIIIIIIIIQQQQ.',
    '.QQQQQQQQQQQQQQ.',
    '.QQQQQQQQQQQQQQ.',
    '..QQQQQQQQQQQQ..',
  ],
  used: [
    '..UUUUUUUUUUUU..',
    '.UUUUUUUUUUUUUU.',
    '.UUIIIIIIIIUUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIUUUUUUUQUUU.',
    '.UUIIIIIIIIUUUU.',
    '.UUUUUUUUUUUUUU.',
    '.UUUUUUUUUUUUUU.',
    '..UUUUUUUUUUUU..',
  ],
  brick: [
    '..BBJJBBJJBBJJ..',
    '.BJJBBJJBBJJBBJ.',
    'BBJJBBJJBBJJBBJJ',
    'BBVVBBJJBBJJBBJJ',
    'BBBBBBVVBBBBBBBB',
    '.BBBBBBBBBBBBBB.',
    '..BBJJBBJJBBJJ..',
    '.BJJBBJJBBJJBBJ.',
    'BBJJBBJJBBJJBBJJ',
    'BBVVBBJJBBVVBBJJ',
    'BBBBBBBBBBBBBBBB',
    '.BBBBBB..BBBBBB.',
    '..BBJJBBJJBBJJ..',
    '.BJJBBJJBBJJBBJ.',
    'BBJJBBJJBBJJBBJJ',
    '.BBBBBBBBBBBBBB.',
  ],
  castle: [
    '..CCCCCCCCCCCC..',
    '.CCCCCCCCCCCCCC.',
    'CCCCCCCCCCCCCCCC',
    'CCX..CCCCCC..XCC',
    'CCX..CCCCCC..XCC',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'CCX..CCCCCC..XCC',
    'CCX..CCCCCC..XCC',
    'CCCCCCCCCCCCCCCC',
    'CCX..CCCCCC..XCC',
    'CCX..CCCCCC..XCC',
    'CCCC..CCCC..CCCC',
    '.CCCC......CCCC.',
    '..CCCCCCCCCCCC..',
  ],
};

const SPR_PAL = {
  'R':PAL.hatRd,'S':PAL.skin,'B':PAL.ovrl,'N':PAL.shoe,'W':PAL.white,
  'K':PAL.black,'Y':PAL.yellow,'G':PAL.goombaBr,'D':PAL.goombaDk,
  'L':PAL.pipeLt,'P':PAL.pipeGn,'H':PAL.hair,'E':PAL.koLt,
  'F':PAL.koDk,'M':PAL.mushWt,'O':PAL.starOr,'Q':PAL.quest,
  'I':PAL.questDk,'J':PAL.brickLn,'V':PAL.brickDk,'T':PAL.groundT,
  'U':PAL.used,'C':PAL.castle,'X':PAL.castleD,'Z':PAL.flagPl,
  'A':PAL.goombaBr,'0':PAL.koYl,'1':PAL.skin,'2':PAL.mushRd,
  '3':PAL.green,'4':PAL.hillGn,'5':PAL.blue,'6':PAL.brown,
  '7':PAL.shrt,'8':PAL.brick,'9':PAL.white,'.':null,',':null,' ':null,
};

// ─── Drawing Primitives ──────────────────────────────────────
function drawPixelArt(data, pal, dx, dy, sc) {
  sc = sc || 1;
  for (let r = 0; r < data.length; r++) {
    const line = data[r];
    for (let c = 0; c < line.length; c++) {
      const col = pal[line[c]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(dx + c*sc, dy + r*sc, sc, sc); }
    }
  }
}

function drawPS(name, dx, dy, sc) {
  const d = SPR_MARKO[name];
  if (d) drawPixelArt(d, SPR_PAL, dx, dy, sc || 1);
}

function drawMario(x, y, facing, big, star, inv, animFrame) {
  if (inv && Math.floor(inv/4)%2 === 0) return;
  const sc = 2;
  let data;
  if (big) {
    if (animFrame === 2) data = facing>0 ? SPR_MARKO.mBigJumpR : SPR_MARKO.mBigJumpL;
    else if (animFrame === 1) data = facing>0 ? SPR_MARKO.mBigR2 : SPR_MARKO.mBigL2;
    else data = facing>0 ? SPR_MARKO.mBigR : SPR_MARKO.mBigL;
  } else {
    if (animFrame === 2) data = facing>0 ? SPR_MARKO.mJumpR : SPR_MARKO.mJumpL;
    else if (animFrame === 1) data = facing>0 ? SPR_MARKO.mSmallR2 : SPR_MARKO.mSmallL2;
    else data = facing>0 ? SPR_MARKO.mSmallR : SPR_MARKO.mSmallL;
  }
  if (!data) return;
  const hc = big ? 62 : 30;
  const drawY = y + hc - data.length * sc;
  if (star) {
    const clr = ['#F8F800','#F8A000','#FFFFFF','#F8F800'];
    const idx = Math.floor(Date.now()/100)%4;
    const pal = Object.assign({}, SPR_PAL, { 'R':clr[idx], 'B':clr[(idx+1)%4] });
    drawPixelArt(data, pal, x, drawY, sc);
  } else {
    drawPixelArt(data, SPR_PAL, x, drawY, sc);
  }
}

function drawQBlock(px, py) {
  // Animated ? block — pulse the inner question mark
  const pulse = Math.floor(Date.now() / 400) % 2;
  if (pulse) {
    const sc = 2;
    drawPixelArt(SPR_MARKO.qblock, SPR_PAL, px, py, sc);
  } else {
    const pal = Object.assign({}, SPR_PAL, { 'Q':PAL.questDk, 'I':PAL.quest });
    drawPixelArt(SPR_MARKO.qblock, pal, px, py, 2);
  }
}
function drawUsed(px, py) {
  drawPS('used', px, py, 2);
}
function drawBrick(px, py) {
  drawPS('brick', px, py, 2);
}
function drawCastle(px, py) {
  drawPS('castle', px, py, 2);
}
function drawGoomba(px, py) {
  drawPS('goomba', px, py, 2);
}
function drawKoopa(px, py) {
  drawPS('koopa', px, py, 2);
}
function drawMushroom(px, py) {
  drawPS('mushroom', px, py, 2);
}
function drawFlower(px, py) {
  drawPS('fireflower', px, py, 2);
}
function drawStarItem(px, py) {
  drawPS('star', px, py, 2);
}

// ─── Tile Types ──────────────────────────────────────────────
// 0=air 1=groundTop 2=groundFill 3=brick 4=qblockCoin 5=qblockPower
// 6=used 7=pipeTL 8=pipeTR 9=pipeBL 10=pipeBR 11=flagpole 12=flagTop
// 13=flagBase 14=flagPole 15=castleWall 16=castleDoor 20=hardBlock

function isSolid(type) {
  return type>=1 && type<=6 || type>=7 && type<=10 || type>=11 && type<=16 || type===20;
}
function isSolidItem(type) {
  return type>=1 && type<=3 || type>=7 && type<=10 || type>=11 && type<=16 || type===20;
}
function isBlock(type) {
  return type===3 || type===4 || type===5;
}

function tileAt(col, row) {
  if (row<0||row>=15||col<0||col>=LEVEL_WIDTH_TILES) return 0;
  return levelData[row]?.[col]||0;
}

// ─── Level Builder ───────────────────────────────────────────
let levelData = [];
let entities = [];
let items = [];
let fireballs = [];
let particles = [];
let cameraX = 0;
let flagReached = false;
let flagSlideY = 0;
let score = 0;
let coins = 0;
let lives = TOTAL_LIVES;
let gameTime = INITIAL_TIME;
let timeCounter = 0;
let playerName = 'MARIO';
let player = null;
let deathTimer = 0;
let levelComplete = false;
let levelCompleteTimer = 0;
let blockHitCooldown = 0;
let playerWasBig = false;
let coinsTo1up = 0;
let fireworksActive = false;
let fireworksInterval = null;
let checkpointX = null;
let checkpointDisplay = 0;

function buildLevel() {
  const W = LEVEL_WIDTH_TILES, H = 15;
  const t = Array.from({length:H},()=>Array(W).fill(0));
  const gaps = new Set([39,40,84,85,109,110,160,161]);
  for (let c=0;c<W;c++) if (!gaps.has(c)) { t[13][c]=1; t[14][c]=2; }
  function p(r,c,v) { if (c>=0&&c<W&&r>=0&&r<H) t[r][c]=v; }
  function addPipe(c,h) {
    const tr=13-h; p(tr,c,7); p(tr,c+1,8);
    for (let r=tr+1;r<13;r++) { p(r,c,9); p(r,c+1,10); }
  }
  function stairs(c,h,ltr) {
    for (let i=0;i<h;i++) for (let r=13-i;r<=13;r++) p(r,ltr?c+i:c-i,20);
  }

  // Early blocks
  p(9,16,4); p(9,21,5); p(9,22,4); p(9,23,4);
  p(9,18,3); p(9,19,3); p(9,20,3);
  p(9,41,4); p(9,42,4); p(9,43,4); p(9,44,4);
  // Mid section
  for (let c=60;c<=63;c++) p(9,c,3);
  for (let c=65;c<=68;c++) p(9,c,3);
  for (let c=61;c<=66;c++) p(5,c,3);
  p(9,77,4); p(9,78,4); p(9,79,4); p(9,80,4);
  p(5,78,5);
  for (let c=83;c<=86;c++) p(9,c,3);
  // Late section
  p(9,91,4); p(9,92,4); p(9,93,4);
  for (let c=94;c<=97;c++) p(9,c,3);
  for (let c=103;c<=105;c++) p(9,c,3);
  p(9,107,4); p(9,108,4);
  p(9,118,4); p(9,119,4);
  for (let c=120;c<=123;c++) p(9,c,3);
  p(9,126,4); p(9,127,4);
  for (let c=130;c<=133;c++) p(9,c,3);
  // Stairs
  stairs(148,4,true); stairs(157,4,false);
  stairs(165,4,true); stairs(172,4,false);
  stairs(182,2,true); stairs(185,4,true); stairs(189,8,true);
  // Flagpole
  const fc=197; p(2,fc,12);
  for (let r=3;r<=12;r++) p(r,fc,14);
  p(13,fc,13);
  // Castle
  for (let c=200;c<=207;c++) for (let r=9;r<=12;r++) p(r,c,15);
  p(11,203,16); p(11,204,16);
  // Pipes
  addPipe(28,2); addPipe(48,3); addPipe(57,2); addPipe(73,4);
  addPipe(95,2); addPipe(114,3); addPipe(136,2); addPipe(153,2);
  return t;
}

function spawnEntities() {
  const list = [];
  function addEnemy(type, col) {
    const x = col * TILE;
    const h = type==='koopa' ? 46 : 28;
    const y = 13*TILE - h;
    list.push({
      type,x,y,w:28,h,
      vx:type==='koopa'?-1.2:-1.0,vy:0,
      alive:true,squished:false,squishTimer:0,
      facing:-1,animTimer:0,onGround:false,offEdge:false,
    });
  }
  [22,26,36,50,52,55,68,70,78,80,90,100,102,116,130,132,145,159,163,173]
    .forEach(c=>addEnemy('goomba',c));
  [42,62,98,120,138,146,164]
    .forEach(c=>addEnemy('koopa',c));
  return list;
}

// ─── Player ──────────────────────────────────────────────────
function createPlayer() {
  return {
    x:3*TILE, y:11*TILE, w:PLAYER_W, h:30,
    vx:0, vy:0, onGround:false, facing:1,
    state:'small', starTimer:0, invincible:0, fireCooldown:0,
    run:false, ducking:false, dead:false, deathTimer:0,
    won:false, flagAnimating:false, flagTargetY:0,
    animFrame:0, animCounter:0,
  };
}

function getPlayerH() { return player&&player.state!=='small' ? 62 : 30; }
function isBig() { return player&&player.state!=='small'; }

// ─── Collision ───────────────────────────────────────────────
function overlappingTiles(px,py,pw,ph) {
  const res=[];
  const l=Math.floor(px/TILE), r=Math.floor((px+pw-1)/TILE);
  const t=Math.floor(py/TILE), b=Math.floor((py+ph-0.001)/TILE);
  for (let row=t;row<=b;row++) for (let col=l;col<=r;col++)
    if (isSolid(tileAt(col,row))) res.push({col,row});
  return res;
}

function aabb(a,b) {
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

// ─── Block Interaction ───────────────────────────────────────
function hitBlock(col,row) {
  if (blockHitCooldown>0) return;
  const type = tileAt(col,row);
  if (type===4) {
    levelData[row][col]=6;
    coins++; score+=COIN_POINTS; sfxCoin();
    spawnCoinParticle(col,row); blockHitCooldown=8;
    coinsTo1up++;
    if (coinsTo1up>=100) { coinsTo1up=0; lives++; sfx1up(); }
  } else if (type===5) {
    levelData[row][col]=6; blockHitCooldown=8; sfxBlock();
    spawnItemFromBlock(isBig()?'flower':'mushroom',col,row);
  } else if (type===3) {
    if (isBig()) { levelData[row][col]=0; sfxBlock(); spawnBrickBreak(col,row); }
    else { sfxBlock(); blockHitCooldown=8; }
  }
}

function spawnItemFromBlock(type,col,row) {
  items.push({
    type,x:col*TILE+4,y:row*TILE,
    vy:-3,vx:type==='mushroom'?2:0,
    emerging:true,emergeTarget:row*TILE-TILE,collected:false,animTimer:0,
  });
}

function spawnCoinParticle(col,row) {
  particles.push({x:col*TILE+8,y:row*TILE,vy:-6,life:20,type:'coin'});
}
function spawnPoints(x,y,pts) {
  particles.push({x,y,vy:-3,life:30,type:'points',text:String(pts)});
}
function spawnBrickBreak(col,row) {
  for (let i=0;i<4;i++)
    particles.push({x:col*TILE+8+(i%2)*16,y:row*TILE+(i<2?0:16),
      vx:(i%2===0?-2:2)+Math.random()-0.5,vy:-4+Math.random()*-2,life:40,type:'brick'});
}

// ─── Physics / Update ────────────────────────────────────────
function updatePlayer() {
  if (!player || player.dead || player.won || flagReached || levelComplete) return;
  const p = player;
  const jump = keys['ArrowUp']||keys['KeyW']||keys['Space'];
  const left = keys['ArrowLeft']||keys['KeyA'];
  const right = keys['ArrowRight']||keys['KeyD'];
  const run = keys['ShiftLeft']||keys['ShiftRight']||keys['KeyZ'];
  const duck = keys['ArrowDown']||keys['KeyS'];
  p.run = run;
  const spd = p.run ? RUN_SPD : WALK_SPD;
  p.ducking = duck && isBig();

  if (left) { p.vx = -spd; p.facing = -1; }
  else if (right) { p.vx = spd; p.facing = 1; }
  else { p.vx *= FRICTION; if (Math.abs(p.vx)<0.1) p.vx=0; }

  p.h = p.ducking ? 30 : getPlayerH();

  if (jump && p.onGround && !p.ducking) { p.vy=JUMP_VEL; p.onGround=false; sfxJump(); }
  if (!jump && p.vy<-3) p.vy *= 0.85;

  p.vy += GRAVITY;
  if (p.vy>MAX_FALL) p.vy=MAX_FALL;

  // Animation
  p.animCounter++;
  if (!p.onGround) {
    p.animFrame = 2; // jump frame
  } else if (Math.abs(p.vx) > 0.3) {
    if (p.animCounter % 10 < 5) p.animFrame = 0;
    else p.animFrame = 1;
  } else {
    p.animFrame = 0;
    p.animCounter = 0;
  }

  // Horizontal — find closest tile per direction
  p.x += p.vx;
  const hTiles = overlappingTiles(p.x,p.y,p.w,p.h);
  if (p.vx > 0) {
    let bestCol = 999;
    for (const t of hTiles) if (t.col < bestCol) bestCol = t.col;
    if (bestCol < 999) { p.x = bestCol * TILE - p.w; p.vx = 0; }
  } else if (p.vx < 0) {
    let bestCol = -1;
    for (const t of hTiles) if (t.col > bestCol) bestCol = t.col;
    if (bestCol >= 0) { p.x = (bestCol + 1) * TILE; p.vx = 0; }
  }

  // Vertical (swept collision)
  const prevY = p.y;
  const prevH = p.h;
  p.y += p.vy;
  p.onGround = false;
  const vTiles = overlappingTiles(p.x,p.y,p.w,p.h);

  if (p.vy > 0) {
    // Landing: tile top must be at or below previous bottom
    const prevBottom = prevY + prevH;
    let bestRow = -1, bestCol = -1;
    for (const t of vTiles) {
      const ty = t.row * TILE;
      if (ty < p.y + p.h && ty >= prevBottom - 0.001) {
        if (t.row > bestRow) { bestRow = t.row; bestCol = t.col; }
      }
    }
    if (bestRow >= 0) {
      p.y = bestRow * TILE - prevH;
      p.vy = 0;
      p.onGround = true;
    }
  } else if (p.vy < 0) {
    // Ceiling: tile bottom must be above previous top (with 1px margin)
    const prevTop = prevY;
    let bestRow = 99, bestCol = -1;
    for (const t of vTiles) {
      const ty = t.row * TILE;
      if (ty + TILE > p.y && ty + TILE <= prevTop + 1) {
        if (t.row < bestRow) { bestRow = t.row; bestCol = t.col; }
      }
    }
    if (bestRow < 99) {
      p.y = (bestRow + 1) * TILE;
      p.vy = 0;
      hitBlock(bestCol, bestRow);
    }
  }

  if (p.y>CANVAS_H+100) { killPlayer(); return; }

  // Star
  if (p.starTimer>0) {
    p.starTimer--;
    if (p.starTimer<=0) p.state = playerWasBig ? 'big' : 'small';
  }
  if (p.invincible>0) p.invincible--;
  if (p.fireCooldown>0) p.fireCooldown--;

  // Fireball
  if (p.state==='fire' && (keys['KeyX']||keys['KeyC']) && p.fireCooldown===0 && !p.dead && !flagReached) {
    fireballs.push({x:p.x+(p.facing>0?p.w:-8),y:p.y+8,vx:p.facing*5,vy:-1.5,life:100,w:8,h:8});
    p.fireCooldown=15; sfxFire();
  }

  // Item collection
  for (let i=items.length-1;i>=0;i--) {
    const it=items[i];
    if (!it.collected && aabb({x:p.x,y:p.y,w:p.w,h:p.h},{x:it.x,y:it.y,w:28,h:28})) {
      collectItem(i);
    }
  }

  // Enemy collision
  for (const e of entities) {
    if (!e.alive || e.squished) continue;
    if (aabb({x:p.x,y:p.y,w:p.w,h:p.h},{x:e.x,y:e.y,w:e.w,h:e.h})) {
      if (p.starTimer>0) {
        e.alive=false; spawnPoints(e.x,e.y,STOMP_POINTS); sfxStomp(); score+=STOMP_POINTS;
      } else if (p.vy>0 && p.y+p.h-e.y<20) {
        e.squished=true; e.squishTimer=30; p.vy=-7; sfxStomp();
        score+=STOMP_POINTS; spawnPoints(e.x,e.y,STOMP_POINTS);
      } else if (p.invincible===0) {
        playerHit();
      }
    }
  }

  // Squish cleanup
  for (const e of entities) {
    if (e.squished) { e.squishTimer--; if (e.squishTimer<=0) e.alive=false; }
  }

  // Checkpoint
  if (checkpointX === null && p.x + p.w / 2 >= 100 * TILE) {
    checkpointX = 100 * TILE;
    checkpointDisplay = 90;
  }
  if (checkpointDisplay > 0) checkpointDisplay--;

  // Flagpole
  const fcol=197; const fpx=fcol*TILE;
  if (!flagReached && p.x+p.w>=fpx && p.x<=fpx+TILE) {
    triggerFlagpole();
  }
}

function playerHit() {
  const p=player;
  if (p.invincible>0 || p.starTimer>0) return;
  if (isBig()) {
    if (p.state==='fire') p.state='big';
    else { p.state='small'; p.h=30; p.y+=32; }
    p.invincible=INVINCIBLE_DURATION; sfxBlock();
  } else killPlayer();
}

function killPlayer() {
  if (!player||player.dead) return;
  player.dead=true; player.deathTimer=0; player.vy=-9; player.vx=0;
  lives--; sfxDeath();
}

function collectItem(idx) {
  const it=items[idx];
  it.collected=true;
  if (it.type==='mushroom') {
    if (player.state==='small') { player.state='big'; player.h=62; player.y-=32; }
    score+=MUSHROOM_POINTS; sfxPowerup();
  } else if (it.type==='flower') {
    player.state='fire'; score+=FLOWER_POINTS; sfxPowerup();
  } else if (it.type==='star') {
    playerWasBig=isBig(); player.state='star'; player.starTimer=STAR_DURATION; score+=STAR_POINTS; sfxPowerup();
  }
}

function triggerFlagpole() {
  if (!player) return;
  flagReached=true;
  player.x=197*TILE+4; player.vx=0; player.vy=0;
  player.flagTargetY=13*TILE-player.h-4;
  sfxFlag(); score+=FLAG_POINTS;
  // Freeze enemies
  for (const e of entities) e.vx=0;
}

function updateFlagAnim() {
  if (!player||!flagReached) return;
  if (player.y < player.flagTargetY) {
    player.y += 2.5;
    if (flagSlideY < 10*TILE) flagSlideY += 2.5;
  } else {
    player.y = player.flagTargetY;
    // Walk to castle
    if (player.x < 200*TILE+8) {
      player.x += 1.5;
    } else if (!levelComplete) {
      levelComplete=true; levelCompleteTimer=90;
      showVictory();
    }
  }
}

function updateEnemies() {
  for (const e of entities) {
    if (!e.alive||e.squished) continue;
    if (flagReached) continue; // freeze
    e.animTimer++;
    e.vy += GRAVITY; if (e.vy>MAX_FALL) e.vy=MAX_FALL;
    e.x += e.vx;
    // Wall check
    const fc = e.vx>0 ? Math.floor((e.x+e.w)/TILE) : Math.floor(e.x/TILE)-1;
    const er = Math.floor((e.y+e.h-1)/TILE);
    if (fc>=0&&fc<LEVEL_WIDTH_TILES && isSolidItem(tileAt(fc,er))) { e.vx*=-1; }
    // Edge check
    const ebot = Math.floor((e.y+e.h)/TILE);
    if (fc>=0&&fc<LEVEL_WIDTH_TILES && !isSolidItem(tileAt(fc,ebot)) && isSolidItem(tileAt(fc,ebot+1))) { /*ok*/ }
    else if (fc>=0&&fc<LEVEL_WIDTH_TILES && !isSolidItem(tileAt(fc,ebot))) { e.vx*=-1; }
    // Fall
    e.y += e.vy;
    const btm = Math.floor((e.y+e.h)/TILE);
    const el=Math.floor(e.x/TILE), er2=Math.floor((e.x+e.w-1)/TILE);
    e.onGround=false;
    for (let c=el;c<=er2;c++) if (isSolidItem(tileAt(c,btm))) { e.y=btm*TILE-e.h; e.vy=0; e.onGround=true; }
    if (e.y>CANVAS_H+150) e.alive=false;
  }
}

function updateItems() {
  for (let i=items.length-1;i>=0;i--) {
    const it=items[i];
    if (it.collected) { items.splice(i,1); continue; }
    it.animTimer++;
    if (it.emerging) {
      it.y += it.vy; it.vy += 0.3;
      if (it.y <= it.emergeTarget) { it.y=it.emergeTarget; it.emerging=false; it.vy=0; }
      continue;
    }
    if (it.type==='mushroom'||it.type==='star') {
      it.vy+=GRAVITY; if (it.vy>MAX_FALL) it.vy=MAX_FALL;
      it.x+=it.vx; it.y+=it.vy;
      const b=Math.floor((it.y+28)/TILE);
      const l=Math.floor(it.x/TILE), r=Math.floor((it.x+27)/TILE);
      for (let c=l;c<=r;c++) if (isSolidItem(tileAt(c,b))) { it.y=b*TILE-28; it.vy=0; }
      const f=it.vx>0?Math.floor((it.x+28)/TILE):Math.floor(it.x/TILE)-1;
      if (f>=0&&f<LEVEL_WIDTH_TILES) {
        const ty=Math.floor((it.y+14)/TILE);
        if (isSolidItem(tileAt(f,ty))) it.vx*=-1;
      }
    }
    if (it.y>CANVAS_H+150) items.splice(i,1);
  }
}

function updateFireballs() {
  for (let i=fireballs.length-1;i>=0;i--) {
    const fb=fireballs[i];
    fb.life--; if (fb.life<=0) { fireballs.splice(i,1); continue; }
    fb.x+=fb.vx; fb.vy+=0.35; fb.y+=fb.vy;
    if (fb.y>CANVAS_H) { fireballs.splice(i,1); continue; }
    // Enemy hit
    for (const e of entities) {
      if (!e.alive||e.squished) continue;
      if (aabb(fb,e)) { e.alive=false; spawnPoints(e.x,e.y,STOMP_POINTS); fireballs.splice(i,1); sfxStomp(); break; }
    }
    // Tile hit
    const l=Math.floor(fb.x/TILE), r=Math.floor((fb.x+7)/TILE);
    const t=Math.floor(fb.y/TILE), b=Math.floor((fb.y+7)/TILE);
    let hit=false;
    outer: for (let r2=t;r2<=b;r2++) for (let c=l;c<=r;c++) if (isSolidItem(tileAt(c,r2))) { hit=true; break outer; }
    if (hit) { fireballs.splice(i,1); continue; }
  }
}

function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i]; p.life--;
    if (p.vy!==undefined) p.vy+=0.2;
    if (p.x!==undefined&&p.vx!==undefined) p.x+=p.vx;
    if (p.y!==undefined&&p.vy!==undefined) p.y+=p.vy;
    if (p.life<=0) particles.splice(i,1);
  }
}

// ─── Rendering ──────────────────────────────────────────────
function render() {
  // Sky
  ctx.fillStyle=PAL.sky;
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Camera
  if (player && !player.dead && !levelComplete) {
    cameraX = player.x - CANVAS_CX + player.w/2;
    cameraX = Math.max(0, Math.min(cameraX, LEVEL_W - CANVAS_W));
  }
  const camX = Math.floor(cameraX);
  const startCol = Math.floor(camX/TILE);
  const endCol = startCol + COLS_VIS + 1;

  drawBackground(camX);

  // Tiles
  for (let row=0;row<15;row++) {
    for (let col=startCol;col<=endCol&&col<LEVEL_WIDTH_TILES;col++) {
      if (col<0) continue;
      const type=tileAt(col,row);
      if (type===0) continue;
      const px=col*TILE-camX, py=row*TILE;
      if (px>-TILE&&px<CANVAS_W) drawTile(type,px,py);
    }
  }

  // Checkpoint flag
  const chkCol = 100;
  const chkX = chkCol * TILE - camX;
  if (chkX > -TILE && chkX < CANVAS_W + TILE) {
    const chkPoleTop = 9 * TILE;
    const chkGroundY = 13 * TILE;
    ctx.fillStyle = '#888';
    ctx.fillRect(chkX + 14, chkPoleTop, 4, chkGroundY - chkPoleTop);
    ctx.fillStyle = '#F8D050';
    ctx.fillRect(chkX + 18, chkPoleTop, 16, 12);
    ctx.fillStyle = '#C08020';
    ctx.fillRect(chkX + 18, chkPoleTop + 12, 16, 4);
    if (checkpointX !== null) {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(chkX + 18, chkPoleTop, 4, 4);
      ctx.fillRect(chkX + 30, chkPoleTop + 8, 4, 4);
    }
  }

  // Checkpoint text
  if (checkpointDisplay > 0) {
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHECKPOINT!', CANVAS_W / 2, 60);
    ctx.textAlign = 'left';
  }

  // Items
  for (const it of items) {
    if (it.collected) continue;
    const ix=it.x-camX;
    if (ix>-40&&ix<CANVAS_W+40) drawItem(it,ix,it.y);
  }

  // Enemies
  for (const e of entities) {
    if (!e.alive&&!e.squished) continue;
    const ex=e.x-camX;
    if (ex>-40&&ex<CANVAS_W+40) drawEnemy(e,ex,e.y);
  }

  // Fireballs — animated bouncing fire
  for (const fb of fireballs) {
    const fx=fb.x-camX;
    const pulse = Math.sin(Date.now()/80 + fb.life)*2;
    // Outer glow
    ctx.fillStyle='#F06020';
    ctx.beginPath(); ctx.arc(fx+4,fb.y+4,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#F8B000';
    ctx.beginPath(); ctx.arc(fx+4,fb.y+4,5,0,Math.PI*2); ctx.fill();
    // Core
    ctx.fillStyle='#F8F840';
    ctx.beginPath(); ctx.arc(fx+4+pulse*0.3,fb.y+4+pulse*0.2,3,0,Math.PI*2); ctx.fill();
  }

  // Flag
  drawFlag(camX);

  // Player
  if (player && !levelComplete) {
    const px=player.x-camX, py=player.y;
    if (!player.dead) drawPlayer(px,py);
  }

  // Particles
  for (const p of particles) {
    const px=p.x-camX;
    if (p.type==='coin') {
      ctx.fillStyle='#C08020'; ctx.fillRect(px+1,p.y+1,6,6);
      ctx.fillStyle=PAL.yellow; ctx.fillRect(px,p.y,8,8);
      ctx.fillStyle='#F8F8A0'; ctx.fillRect(px+2,p.y+2,2,4);
    }
    else if (p.type==='points') { ctx.fillStyle='#FFF'; ctx.font='8px monospace'; ctx.fillText(p.text||'',px,p.y); }
    else if (p.type==='brick') { ctx.fillStyle=PAL.brick; ctx.fillRect(px,p.y,8,8); }
    else if (p.type==='firework') { ctx.fillStyle=p.color||'#FFF'; ctx.fillRect(px,p.y,4,4); }
  }
}

function drawBackground(camX) {
  // Clouds — pixel-art cloud shape
  const cpos=[{x:100,y:36},{x:400,y:52},{x:700,y:28},{x:1100,y:48},{x:1500,y:38},
    {x:1900,y:54},{x:2300,y:32},{x:2700,y:50},{x:3100,y:30},{x:3500,y:52},
    {x:4000,y:40},{x:4500,y:44},{x:5000,y:28},{x:5500,y:50},{x:6000,y:36}];
  for (const c of cpos) {
    const cx=c.x-camX*0.3;
    if (cx>-96&&cx<CANVAS_W+96) {
      ctx.fillStyle=PAL.cloud;
      // dome
      ctx.beginPath(); ctx.ellipse(cx+48,c.y+16,48,16,0,Math.PI,0); ctx.fill();
      // smaller bumps
      ctx.beginPath(); ctx.ellipse(cx+20,c.y+10,20,12,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+76,c.y+12,16,10,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+48,c.y+22,52,10,0,Math.PI,0); ctx.fill();
      // darker bottom shadow
      ctx.fillStyle='#E8E8E8';
      ctx.beginPath(); ctx.ellipse(cx+48,c.y+24,48,6,0,Math.PI,0); ctx.fill();
    }
  }

  // Hills — dome with dark outline
  for (const hx of [0,600,1300,2000,2700,3400,4100,4800,5500,6200]) {
    const hw=120+((hx/100)%3)*40, hh=48+((hx/50)%3)*16;
    const sx=hx-camX*0.5;
    if (sx>-hw&&sx<CANVAS_W+hw) {
      // Dark outline
      ctx.fillStyle='#50907A';
      ctx.beginPath(); ctx.ellipse(sx+hw/2,CANVAS_H-62,hw/2+2,hh+2,0,Math.PI,0); ctx.fill();
      // Main body
      ctx.fillStyle=PAL.hillGn;
      ctx.beginPath(); ctx.ellipse(sx+hw/2,CANVAS_H-62,hw/2,hh,0,Math.PI,0); ctx.fill();
      // Subtle lighter highlight on top
      ctx.fillStyle='#78D8B0';
      ctx.beginPath(); ctx.ellipse(sx+hw/2-4,CANVAS_H-66,hw/4,hh/3,0,Math.PI,0); ctx.fill();
    }
  }

  // Bushes — 3-lobe pixel bush
  for (const bx of [200,500,900,1400,1800,2200,2800,3200,3700,4200,4700,5200,5800,6300]) {
    const bw=48+((bx/30)%4)*16, sx=bx-camX*0.7;
    if (sx>-bw&&sx<CANVAS_W+bw) {
      // Dark outline
      ctx.fillStyle='#287828';
      ctx.beginPath(); ctx.ellipse(sx+bw/2,CANVAS_H-58,bw/2+2,14,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+bw/2-10,CANVAS_H-66,bw/4+2,12,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+bw/2+12,CANVAS_H-70,bw/4+2,10,0,Math.PI,0); ctx.fill();
      // Main green
      ctx.fillStyle=PAL.bushGn;
      ctx.beginPath(); ctx.ellipse(sx+bw/2,CANVAS_H-58,bw/2,12,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+bw/2-10,CANVAS_H-66,bw/4,10,0,Math.PI,0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+bw/2+12,CANVAS_H-70,bw/4,8,0,Math.PI,0); ctx.fill();
    }
  }
}

function drawTile(type, px, py) {
  switch (type) {
    case 1:
      ctx.fillStyle=PAL.groundT; ctx.fillRect(px,py,TILE,4);
      ctx.fillStyle=PAL.groundF; ctx.fillRect(px,py+4,TILE,TILE-4);
      // Brick top texture
      ctx.fillStyle=PAL.groundT; ctx.fillRect(px,py+4,TILE,2);
      for (let i=0;i<4;i++) {
        ctx.fillStyle=PAL.groundF;
        ctx.fillRect(px+i*8+2, py+1, 4, 2);
        ctx.fillRect(px+i*8, py+6, 8, 2);
      }
      ctx.fillStyle='#A06830';
      for (let i=0;i<8;i++) {
        ctx.fillRect(px+i*4, py+8+((i%2)*4), 2, 4);
      }
      break;
    case 2:
      ctx.fillStyle=PAL.groundF; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#B07038';
      for (let r=0;r<4;r++) for (let i=0;i<8;i++) {
        ctx.fillRect(px+i*4, py+r*8+((i%2)*4)+((r%2)*2), 2, 4);
      }
      break;
    case 3: drawBrick(px,py); break;
    case 4: drawQBlock(px,py); break;
    case 5: drawQBlock(px,py); break;
    case 6: drawUsed(px,py); break;
    case 7: case 8: case 9: case 10:
      // Pipe body shading
      ctx.fillStyle=PAL.pipeLt; ctx.fillRect(px,py,8,TILE);
      ctx.fillStyle=PAL.pipeM; ctx.fillRect(px+8,py,TILE-16,TILE);
      ctx.fillStyle=PAL.pipeD; ctx.fillRect(px+TILE-8,py,8,TILE);
      if (type===7||type===8) {
        // Pipe top rim
        ctx.fillStyle=PAL.pipeGn; ctx.fillRect(px-2,py,TILE+4,6);
        ctx.fillStyle=PAL.pipeLt; ctx.fillRect(px-2,py,6,4);
        ctx.fillStyle=PAL.pipeD; ctx.fillRect(px+TILE-4,py,6,4);
        ctx.fillStyle=PAL.pipeM; ctx.fillRect(px+4,py,TILE-8,4);
      }
      break;
    case 12:
      ctx.fillStyle='#888'; ctx.fillRect(px+14,py,4,TILE);
      ctx.fillStyle=PAL.yellow; ctx.fillRect(px+12,py,8,8);
      break;
    case 14:
      ctx.fillStyle='#888'; ctx.fillRect(px+14,py,4,TILE);
      break;
    case 15: drawCastle(px,py); break;
    case 16: drawCastle(px,py); ctx.fillStyle='#000'; ctx.fillRect(px+8,py+12,16,20); break;
    case 20:
      ctx.fillStyle='#C08040'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#E8C080'; ctx.fillRect(px,py,TILE,4);
      break;
  }
}

function drawFlag(camX) {
  const fc=197; const fx=fc*TILE-camX;
  if (fx>-TILE&&fx<CANVAS_W+TILE) {
    // Pole
    ctx.fillStyle='#888'; ctx.fillRect(fx+13,2*TILE,6,11*TILE);
    ctx.fillStyle='#AAA'; ctx.fillRect(fx+14,2*TILE,2,11*TILE);
    ctx.fillStyle='#666'; ctx.fillRect(fx+17,2*TILE,2,11*TILE);
    // Ball top
    ctx.fillStyle=PAL.yellow; ctx.fillRect(fx+12,2*TILE-2,8,8);
    ctx.fillStyle=PAL.questDk; ctx.fillRect(fx+12,2*TILE-2,8,2);
    // Flag
    const fy = 3*TILE + flagSlideY;
    ctx.fillStyle=PAL.flag; ctx.fillRect(fx+18,fy,28,20);
    ctx.fillStyle='#60D860'; ctx.fillRect(fx+18,fy,6,20);
    ctx.fillStyle=PAL.pipeDk; ctx.fillRect(fx+40,fy,6,20);
    // Flag circle
    ctx.fillStyle='#F8F8F8'; ctx.fillRect(fx+26,fy+4,12,12);
    ctx.fillStyle=PAL.flag; ctx.fillRect(fx+30,fy+6,4,4);
    ctx.fillRect(fx+34,fy+10,4,4);
  }
}

function drawItem(it,x,y) {
  if (it.type==='mushroom') drawMushroom(x,y);
  else if (it.type==='flower') drawFlower(x,y+4);
  else if (it.type==='star') drawStarItem(x,y+4);
}

function drawEnemy(e,x,y) {
  if (e.squished) {
    ctx.fillStyle=PAL.goombaBr; ctx.fillRect(x,y+e.h-8,e.w,7);
    ctx.fillStyle=PAL.goombaDk; ctx.fillRect(x+2,y+e.h-8,3,7);
    ctx.fillStyle='#000'; ctx.fillRect(x+6,y+e.h-6,2,2);
    ctx.fillRect(x+e.w-10,y+e.h-6,2,2);
    return;
  }
  const frame = Math.floor(e.animTimer/12)%2;
  if (e.type==='goomba') drawPS(frame===0?'goomba':'goomba2', x, y, 2);
  else if (e.type==='koopa') drawPS(frame===0?'koopa':'koopa2', x, y, 2);
}

function drawPlayer(px,py) {
  if (!player||player.dead) return;
  drawMario(px,py,player.facing,isBig(),player.state==='star'&&player.starTimer>0,player.invincible,player.animFrame);
  // Name tag — position relative to sprite top
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  const big = isBig();
  const hc = big ? 62 : 30;
  const af = player.animFrame;
  let sLen;
  if (big) sLen = (af===2 ? SPR_MARKO.mBigJumpR : af===1 ? SPR_MARKO.mBigR2 : SPR_MARKO.mBigR).length;
  else sLen = (af===2 ? SPR_MARKO.mJumpR : af===1 ? SPR_MARKO.mSmallR2 : SPR_MARKO.mSmallR).length;
  const nameY = py + hc - sLen * 2 - 4;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(playerName, px + 11, nameY);
  ctx.fillText(playerName, px + 11, nameY);
  ctx.textAlign = 'left';
}

// ─── HUD ─────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hud-score').textContent = String(score).padStart(6,'0');
  document.getElementById('hud-coins').textContent = 'x'+String(coins).padStart(2,'0');
  document.getElementById('hud-time').textContent = String(gameTime);
  document.getElementById('hud-lives').textContent = 'x'+lives;
  document.getElementById('hud-player-name').textContent = playerName;
}

// ─── Game Loop ──────────────────────────────────────────────
let lastTime=0, accumulator=0;
const STEP = 1000/60;

function gameLoop(ts) {
  if (!lastTime) lastTime=ts;
  const dt=ts-lastTime; lastTime=ts; accumulator+=dt;
  if (accumulator>200) accumulator=200;
  while (accumulator>=STEP) { update(); accumulator-=STEP; }
  render();
  animFrameId = requestAnimationFrame(gameLoop);
}

function update() {
  if (gameState!=='playing') return;

  timeCounter++;
  if (timeCounter>=60) { timeCounter=0; if (gameTime>0) gameTime--; if (gameTime<=0) killPlayer(); }
  if (blockHitCooldown>0) blockHitCooldown--;

  if (player && player.dead) {
    player.deathTimer++;
    player.vy += GRAVITY; player.y += player.vy;
    if (player.y>CANVAS_H+120) {
      if (lives<=0) showGameOver();
      else resetAfterDeath();
    }
    return;
  }

  if (levelComplete) {
    levelCompleteTimer--;
    if (levelCompleteTimer<=0) { /* victory already shown */ }
    // Still render flag/pole animation
    if (flagReached) updateFlagAnim();
    return;
  }

  if (flagReached) { updateFlagAnim(); }
  updatePlayer();
  updateEnemies();
  updateItems();
  updateFireballs();
  updateParticles();
  updateHUD();
}

// ─── Reset ───────────────────────────────────────────────────
function resetAfterDeath() {
  initLevel();
  player.dead=false; player.deathTimer=0; player.vy=0;
  player.invincible=90;
  if (checkpointX !== null) {
    player.x = checkpointX;
    player.y = 11 * TILE;
  }
  // Reset timer
  gameTime=INITIAL_TIME; timeCounter=0;
}

function initLevel() {
  levelData=buildLevel(); entities=spawnEntities();
  items=[]; fireballs=[]; particles=[];
  cameraX=0; flagReached=false; flagSlideY=0;
  levelComplete=false; levelCompleteTimer=0; blockHitCooldown=0;
  if (!player) player=createPlayer();
  else {
    player.x=3*TILE; player.y=11*TILE; player.vx=0; player.vy=0;
    player.onGround=false; player.dead=false; player.deathTimer=0;
    player.won=false; player.flagAnimating=false;
    player.invincible=90; player.state='small'; player.starTimer=0; player.h=30;
  }
}

function resetGame() {
  score=0; coins=0; lives=TOTAL_LIVES; gameTime=INITIAL_TIME; timeCounter=0;
  coinsTo1up=0; playerWasBig=false; checkpointX=null; checkpointDisplay=0;
  player=createPlayer(); initLevel();
}

// ─── Screens ─────────────────────────────────────────────────
function showMenu() {
  gameState='menu';
  document.getElementById('menu-screen').classList.remove('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('victory-overlay').classList.add('hidden');
  document.getElementById('pause-indicator').classList.add('hidden');
  drawMenuMario();
}

function drawMenuMario() {
  const mc = document.getElementById('menu-mario-canvas').getContext('2d');
  mc.clearRect(0,0,120,160);
  const px=24, py=36, s=5;
  for (let r=0;r<SPR_MARKO.mSmallR.length;r++)
    for (let c=0;c<SPR_MARKO.mSmallR[r].length;c++) {
      const col=SPR_PAL[SPR_MARKO.mSmallR[r][c]];
      if (col) { mc.fillStyle=col; mc.fillRect(px+c*s,py+r*s,s,s); }
    }
  for (let r=0;r<SPR_MARKO.qblock.length;r++)
    for (let c=0;c<SPR_MARKO.qblock[r].length;c++) {
      const col=SPR_PAL[SPR_MARKO.qblock[r][c]];
      if (col) { mc.fillStyle=col; mc.fillRect(24+c*s,116+r*s,s,s); }
    }
}

function startGame() {
  initAudio();
  const inp = document.getElementById('player-name');
  playerName = inp.value.toUpperCase().trim()||'MARIO';
  document.getElementById('hud-player-name').textContent = playerName;
  resetGame();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('victory-overlay').classList.add('hidden');
  document.getElementById('pause-indicator').classList.add('hidden');
  gameState='playing'; lastTime=0; accumulator=0; updateHUD();
}

function showGameOver() {
  gameState='gameover';
  document.getElementById('go-score').textContent=score;
  document.getElementById('gameover-overlay').classList.remove('hidden');
}

function showVictory() {
  gameState='victory';
  document.getElementById('victory-name').textContent=playerName;
  document.getElementById('victory-score').textContent=String(score).padStart(6,'0');
  document.getElementById('victory-overlay').classList.remove('hidden');
  if (fireworksActive) return;
  fireworksActive=true;
  let fwCount=0;
  fireworksInterval = setInterval(()=>{
    if (fwCount>20||gameState!=='victory') { clearInterval(fireworksInterval); fireworksInterval=null; fireworksActive=false; return; }
    fwCount++;
    const fx=50+Math.random()*(CANVAS_W-100);
    const fy=40+Math.random()*(CANVAS_H-160);
    const colors=['#F04040','#40F040','#4040F8','#F8F840','#F840F8','#40F8F8'];
    const col=colors[Math.floor(Math.random()*colors.length)];
    for (let i=0;i<8;i++) {
      const ang=(i/8)*Math.PI*2; const sp=1.5+Math.random()*2;
      particles.push({x:fx,y:fy,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:50+Math.random()*20,type:'firework',color:col});
    }
  },250);
}

// ─── Input ──────────────────────────────────────────────────
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.code]=true;
  if (e.code==='KeyP'||e.code==='Escape') {
    if (gameState==='playing') { gameState='paused'; document.getElementById('pause-indicator').classList.remove('hidden'); }
    else if (gameState==='paused') { gameState='playing'; document.getElementById('pause-indicator').classList.add('hidden'); lastTime=0; }
  }
  if (e.code==='Enter'&&gameState==='menu') startGame();
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  keys[e.code]=false;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('controls-btn').addEventListener('click', ()=>document.getElementById('controls-modal').classList.remove('hidden'));
document.getElementById('close-controls').addEventListener('click', ()=>document.getElementById('controls-modal').classList.add('hidden'));
document.getElementById('controls-modal').addEventListener('click', (e)=>{if(e.target===e.currentTarget)document.getElementById('controls-modal').classList.add('hidden');});
document.getElementById('continue-btn').addEventListener('click', ()=>{
  if (fireworksInterval) { clearInterval(fireworksInterval); fireworksInterval=null; fireworksActive=false; }
  resetGame();document.getElementById('gameover-overlay').classList.add('hidden');gameState='playing';lastTime=0;
});
document.getElementById('playagain-btn').addEventListener('click', ()=>{
  if (fireworksInterval) { clearInterval(fireworksInterval); fireworksInterval=null; fireworksActive=false; }
  resetGame();document.getElementById('victory-overlay').classList.add('hidden');gameState='playing';lastTime=0;
});
document.getElementById('player-name').addEventListener('input', (e)=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g,''));

// ─── Init ───────────────────────────────────────────────────
canvas = document.getElementById('game-canvas');
ctx = canvas.getContext('2d');
canvas.width = CANVAS_W; canvas.height = CANVAS_H;
showMenu();
setInterval(drawMenuMario, 300);
animFrameId = requestAnimationFrame(gameLoop);

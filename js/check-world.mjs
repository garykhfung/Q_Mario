import { createWorld } from './world.js';
import { TILE } from './config.js';
import { createCourse } from './course.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const idle = { left: false, right: false, jump: false, run: false, duck: false, fire: false };
const world = createWorld();
world.setName('TEST');
world.reset();

let snap = world.snapshot();
assert(snap.layout.kinds[13][0] === 'ground', 'course ground');
assert(snap.player.x === 3 * TILE, 'spawn x');
assert(snap.session === 'playing', 'session');

for (let i = 0; i < 90; i++) snap = world.step(idle);
assert(snap.player.y + snap.player.h <= 13 * TILE + 0.5, 'landed on ground row');
const groundedY = snap.player.y;
for (let i = 0; i < 8; i++) snap = world.step({ ...idle, jump: true });
assert(snap.player.y < groundedY, 'jump lifts player');

const course = createCourse();
const coin = course.bump(16, 9, false);
assert(coin.outcome === 'coin', 'qblock coin bump');
assert(course.kindAt(16, 9) === 'used', 'qblock becomes used');
const brick = course.bump(18, 9, true);
assert(brick.outcome === 'brick-break', 'big brick break');
assert(course.kindAt(18, 9) === 'air', 'brick gone');

console.log('ok');

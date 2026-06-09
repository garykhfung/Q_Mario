# AGENTS.md

Browser-based Super Mario Bros. clone using Canvas 2D + Web Audio API. No external dependencies.

## Quick start
Open `index.html` in a browser — no build step or server needed.

## Project structure
```
index.html        Menu / game screen / overlays
css/style.css     Pixel-font styling, layout, HUD
js/game.js        Complete game engine (~1200 lines)
```

## Known quirks & conventions

- All pixel-art sprites are defined as string grids in `SPR_MARKO` and drawn at 2x scale (`fillRect` per cell). Edit sprite data directly in JS.
- Level map is built in `buildLevel()` at ~210×15 tiles (32px). Tile types: 0=air, 1=ground, 3=brick, 4=qblock(coin), 5=qblock(powerup), 6=used, 7-10=pipe pieces, 20=hard block, etc.
- Collision uses a two-pass swept approach: horizontal then vertical. The vertical pass compares the entity's *previous* position to determine landing vs. ceiling hits (see `updatePlayer`).
- Physics constants at top of `game.js`: `GRAVITY=0.52`, `JUMP_VEL=-11.0`, `WALK_SPD=2.4`, `RUN_SPD=4.0`.
- Game state is a flat string (`'menu'|'playing'|'paused'|'gameover'|'victory'`).
- Sound effects synthesised via `OscillatorNode` + `GainNode` — no audio files.
- Enemies (`entities[]`), items (`items[]`), fireballs, particles each update independently. No ECS.

## Commands
None (no build system). Open `index.html` via file:// or any static server.

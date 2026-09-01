# AGENTS.md

Browser-based Super Mario Bros. clone. The World is 2D (tiles + swept collision). Presentation is Canvas 2D or Three.js. HUD is HTML. Three.js loads from a CDN import map.

## Quick start
Serve the folder (ES modules + import map need `http://`, not `file://`):

```
python3 -m http.server 8765
```

Open `http://localhost:8765`. Default view is Three.js. HUD button **2D PIXELS** switches to the Canvas adapter (`?view=canvas` also works).

## Project structure
```
index.html                 Menu, HUD, overlays, import map
css/style.css              Layout, HUD
js/config.js               Tile size, physics numbers
js/course.js               Course grid, solidity, bump
js/world.js                World.step / snapshot
js/audio.js                Web Audio from World events
js/main.js                 Session, input, loop
js/present/canvas2d.js     Canvas 2D adapter (sprites stay here)
js/present/three-adapter.js Three.js adapter
js/present/headless.js     Test adapter
js/check-world.mjs         One runnable World check
CONTEXT.md                 Domain glossary
docs/adr/0001-*.md         2D World, 3D Presentation
```

## Known quirks & conventions

- Course tiles are numbers inside Course; Snapshot exposes kinds (`ground`, `qblock`, …).
- Collision is two-pass swept: horizontal then vertical. Vertical uses previous Y for land vs ceiling (see `world.js`).
- Physics: `GRAVITY=0.52`, `JUMP_VEL=-13`, `WALK_SPD=2.4`, `RUN_SPD=4.0`.
- Session: `playing` | `paused` (shell) | `gameover` | `victory`. Pause does not step the World.
- Sprite grids (`SPR_MARKO`) are private to the Canvas adapter. Three.js never imports them.
- Camera lives in Presentation, not the World.

## Commands
```
node js/check-world.mjs
python3 -m http.server 8765
```

## Agent skills

### Issue tracker

GitHub Issues at [garykhfung/Q_Mario](https://github.com/garykhfung/Q_Mario) (canonical) plus local markdown scratchpad under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

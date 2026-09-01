# Q-Mario

A side-scrolling course where a named player stomps enemies, bumps blocks, and clears the flagpole.

## Language

**Course**:
The tile grid of World 1-1: solids, pipes, blocks, flagpole, and castle. Not the pictures of those tiles.
_Avoid_: level map, tilemap, stage

**World**:
The running game: player, enemies, items, and the Course they occupy. Steps in 2D. Does not draw.
_Avoid_: engine, scene, simulation (when you mean this whole thing)

**Snapshot**:
A read-only pose of the World for one frame: positions, kinds, HUD numbers, session. No pixels, no meshes.
_Avoid_: render state, frame data

**Presentation**:
Whatever turns a Snapshot into pictures. Canvas 2D and Three.js are two presentations of the same World.
_Avoid_: renderer, view layer, graphics engine

**Session**:
Whether the player is on the menu, playing, paused, out of lives, or has cleared the Course.
_Avoid_: gameState, screen

**Bump**:
Hitting a block from below: coin, power-up, or brick break. A Course change, not a draw call.
_Avoid_: block hit, tile interaction

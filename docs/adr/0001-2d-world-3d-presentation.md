# 2D World, 3D Presentation

The Course and World stay a 2D tile grid with swept collision. Three.js is a Presentation adapter that maps Snapshot poses onto meshes. Gravity never lives on a Mesh.

We considered simulating in Three.js (raycasts, mesh AABBs). That would throw away the existing landing-vs-ceiling test and couple Mario rules to a GPU library. Canvas 2D remains a second adapter on the same Snapshot seam so Presentation can vary without rewriting the World.

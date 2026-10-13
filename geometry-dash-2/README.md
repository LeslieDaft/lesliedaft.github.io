# Geometry Dash 2.0

An original 15-level rhythm platformer on Daft Arcade. Normal movement is 330 world pixels per second with a lower, quicker cube jump. Difficulty progresses to Nightclub Nexus, an 88-second Clubstep-style Easy Demon course.

Space, click, or tap to jump. Hold for repeated cube jumps or ship thrust; tap to flip ball gravity. P pauses, R retries, M toggles music, and C places a practice checkpoint. Best progress and coins save on this browser. Old records are preserved; old ghost trajectories are cleared after the physics update.

Open **Level Editor** from the menu, pause screen, or completion screen. Place spikes, gates, beams, portals, and coins; drag selections; adjust properties; pan and zoom; undo and redo. Save custom levels locally or export/import JSON to move them between devices. Playtests preserve the open draft. Tests from the cursor use practice mode.

Run the independent logic and canvas checks with Node 24 or newer:

```sh
node geometry-dash-2/tests/qa.mjs
```

The checks exercise all 15 level trajectories and checkpoints at multiple simulation rates, input handling, saved records, editor CRUD, dragging, undo, import validation, and isolated custom progress. They use a small DOM substitute and do not replace a browser playtest.

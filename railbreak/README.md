# Railbreak

A browser-local 3D skateboarding game for Daft Arcade. Uses the arcade's vendored Three.js module (`../after-bell/vendor/three.module.js`); no CDN requests or extra services.

## Play

- W / up: push; S / down: brake; A D / arrows: carve. Coasting keeps about 98% of speed over ten seconds on level ground; carving preserves momentum. Slopes still accelerate or slow the board naturally.
- Space: ollie; J / K while airborne: kickflip / heelflip.
- Q / E while airborne: spin. Finish rotations to land cleanly.
- Hold Shift close and parallel to a rail: grind. Space jumps off the rail.
- Hold C while rolling: manual and extend the line.
- R: recover to the plaza or restart the current sprint; Esc: pause.
- Drag the scene to look around. All gameplay actions have touch buttons on touch devices.

## Features

- An approximately 1.8 km square, freely explorable city: detailed building blocks, freight yards, a dry drainage canal, eastern hillside, roads, and Civic skate plaza.
- Analytic ramp / canal / hillside collision surfaces; physical rail catches and obstacle collision recovery.
- A sculpted skater with contoured anatomy and clothing, shaped facial features, hair, ears, individual fingers, jacket seams / pockets / collar, and layered shoes / soles / laces. Legs use two-bone foot IK during push / coast / crouch / tricks; the concave deck has raised nose / tail, trucks, hubs, and spinning wheels.
- 24 cars / vans follow right-hand street routes and intersection yielding. 32 walkers use sidewalks and the plaza perimeter, slowing and stepping aside for the skater. Genuine close collisions can cause bails; airborne clearance and collision cooldown prevent unfair repeat impacts.
- Capped nearby detail pools: at most 8 detailed vehicles and 5 detailed pedestrians, reduced to 4 / 2 in School mode. Distant people use a single contoured silhouette mesh; distant cars use cheap body / window / wheel shapes. All actors obey render-distance culling.
- Three timed city sprints, 19 collectible tapes, trick combinations and banking, four milestone contracts, four purchasable cosmetic decks.
- Browser-local saving of cash, equipped decks, unlocked decks, records, tapes, contracts, and graphics preferences. A missing storage permission does not block play.
- Independent **Render Distance** (400–2400 m, default 1600 m) and **High-detail Distance** (80–700 m, default 300 m, clamped to render distance). Building chunks switch between cheap silhouettes and detailed textured models. A resolution slider, shadows toggle, School mode, and Quality mode provide additional control.
- No generated bitmap models or spherical humanoid parts. The game uses procedural material textures, angular jointed character geometry, textured metal / glass / masonry, directional shadows, atmospheric fog, and capped instanced scrape / dust particles.

## Validation

`node --input-type=module --check < game.js`

`node --check physics.mjs`

`node --test physics.test.mjs traffic.test.mjs model.test.mjs`

Thirteen deterministic physics tests cover coasting / carving speed retention, strong braking, gravity, long rail momentum, clean and failed tricks, collisions, and finite movement. Five traffic tests cover bounded street lanes, long-running loops, yielding, pedestrian avoidance, and actual collision / airborne clearance. Character geometry tests check proportion bounds, foot / pose transforms, and finite contoured geometry. Browser visual / GPU performance testing is not available in the current build environment. Runtime diagnostics can be read with `window.railbreak.getState()`.

## Scope

Single-player arcade physics. Deck purchases change appearance, not skating performance. A warehouse rooftop has a long rideable access bank and grind rails; other building roofs are scenery. The rideable world emphasizes streets, canal banks, ramps, rails, and hills. Traffic and walkers run fixed capped simulations; there are no networked players.

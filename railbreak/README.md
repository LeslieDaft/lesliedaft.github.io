# Railbreak

A browser-local 3D skateboarding game for Daft Arcade. Uses the arcade's vendored Three.js module (`../after-bell/vendor/three.module.js`); no CDN requests or extra services.

## Play

- W / up: push; S / down: brake; A D / arrows: carve.
- Space: ollie; J / K while airborne: kickflip / heelflip.
- Q / E while airborne: spin. Finish rotations to land cleanly.
- Hold Shift close and parallel to a rail: grind. Space jumps off the rail.
- Hold C while rolling: manual and extend the line.
- R: recover to the plaza or restart the current sprint; Esc: pause.
- Drag the scene to look around. All gameplay actions have touch buttons on touch devices.

## Features

- An approximately 1.8 km square, freely explorable city: detailed building blocks, freight yards, a dry drainage canal, eastern hillside, roads, and Civic skate plaza.
- Analytic ramp / canal / hillside collision surfaces; physical rail catches and obstacle collision recovery.
- A proportioned articulated skater, shaped deck with trucks and wheels, kickflip / spin / push / grind / manual / bail animation states.
- Three timed city sprints, 19 collectible tapes, trick combinations and banking, four milestone contracts, four purchasable cosmetic decks.
- Browser-local saving of cash, equipped decks, unlocked decks, records, tapes, contracts, and graphics preferences. A missing storage permission does not block play.
- Independent **Render Distance** (400–2400 m, default 1600 m) and **High-detail Distance** (80–700 m, default 300 m, clamped to render distance). Building chunks switch between cheap silhouettes and detailed textured models. A resolution slider, shadows toggle, School mode, and Quality mode provide additional control.
- No generated bitmap models or spherical humanoid parts. The game uses procedural material textures, angular jointed character geometry, textured metal / glass / masonry, directional shadows, atmospheric fog, and capped instanced scrape / dust particles.

## Validation

`node --input-type=module --check < game.js`

`node --check physics.mjs`

`node --test physics.test.mjs`

Six deterministic physics tests exercise pushing and braking, clean ollie / flip landings, physical rail catches and exits, obstacle impacts, long finite movement with clamped frame spikes, and partial-flip failed landings. Browser visual / GPU performance testing is not available in the current build environment. Runtime diagnostics can be read with `window.railbreak.getState()`.

## Scope

Single-player arcade physics. Deck purchases change appearance, not skating performance. A warehouse rooftop has a long rideable access bank and grind rails; other building roofs are scenery. The rideable world emphasizes streets, canal banks, ramps, rails, and hills. Vehicles and pedestrians are not simulated.

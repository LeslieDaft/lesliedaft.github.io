# Storm Chaser: Regional Outbreak

Free-roam 3D storm research for Daft Arcade. Uses the existing local Three.js r170 module and shared procedural audio at `../game-audio/cinematic.mjs`. No paid services, external asset requests, or build step.

## Regional world

A 12 × 12 km world combines a dense eastern city, central rural farm country, and elevated western/northern mountain country. Main roads follow the mountain terrain rather than disappearing below it. The city has a connected local street grid. Four lime-marked weather outposts provide repairs/refits; six businesses place optional research calls. Twenty-four vehicles follow road lanes, slow for traffic/player obstruction, yield by deterministic priority at crossings, and collide with the truck.

Six simultaneous moving tornadoes cover EF0–EF5. All initially spawn in rural country. EF rating changes width, influence radius, wind force, lift, damage, and payouts. Each tornado is one continuous ground-to-cloud tapered mesh, a flat dust annulus, and a share of the bounded debris field. All use one broad shared storm-cloud canopy. There are no stacked funnel shells or point-shaped ground-dust cones.

## Play and contracts

- WASD / arrows: accelerate, brake/reverse, steer.
- Space: handbrake / drift. Pavement, dirt, grass, mud and gravel handle differently.
- E: deploy a probe within the target storm's influence. Completed telemetry pays automatically.
- F: photograph the target funnel outside its core. Better optics increase range, rewards and processing speed.
- Q: deploy/release purchased anchors below 15 km/h. Cannot deploy in flight.
- G: motor pool while stopped near any lime outpost.
- R: recover and repair at the nearest outpost for up to $150.
- C: close/wide camera; drag to orbit, scroll to zoom.
- M: regional map / local radar. P / Escape: pause.
- Touch devices have directional, pedal, handbrake, and action buttons.

Business calls are simulated in-game UI. Accept or decline each offer. Contracts request photos, sustained data collection, or probe readings from a specific marked EF-rated tornado, with a four-minute completion limit. Every available EF rating can receive every job type. Accepted targets appear cyan on radar. No actual calls or messages are sent.

Tornado wind can pick up the truck, launch it hundreds of meters, and tumble it. Altitude and falling speed appear on the HUD. Ground impact damages the hull and can explode/wreck the truck. Anchors and ballast resist lift; strong EF4/5 cores can overcome basic anchors. Cage and suspension upgrades reduce landing damage. Ground driving stays grounded outside strong lift.

## Branching upgrade tree

Each of the 12 nodes has three levels and transactional prerequisite/cost checks:

- Power: Diesel → Twin turbo / Rally transmission.
- Survival: Armor → Survival cage / Long-travel suspension / Hydraulic anchors → Ballast.
- Research: Doppler radar → Telemetry → Probe laboratory; radar also unlocks Stabilized optics.

Engine/turbo alter torque and top speed; transmission/suspension improve rough-surface speed; armor reduces storm damage; cage/suspension reduce landing damage; anchors/ballast alter wind/lift response; radar extends the map and storm projections; telemetry accelerates income/probes; optics improve photos; probe laboratory increases probe payouts. Armor, anchors and radar visibly update the truck.

## Performance and saving

The exact graphics sliders match Railbreak:

- Render Distance: 400–2400 m, 100 m steps, default 1600 m. Controls camera/fog range and world-object visibility.
- High-detail Distance: 80–700 m, 20 m steps, default 300 m. Nearby windows, layered trees and utility wires switch to cheaper distant models. Clamped to render range.

School mode caps pixel ratio at 1, disables shadows, and reduces rain/debris. Shared geometry/materials, instanced road markings/debris/dust, and fixed-size telemetry/particle pools bound recurring allocations. City detail is hidden outside the selected high-detail range.

Funds, probes, all upgrade levels, lifetime records and settings save on this browser. Version 1 saves migrate to the expanded tree without discarding earned money or existing upgrades. Active weather/run/phone jobs restart per visit.

## Validation

`node --test physics.test.mjs` runs 13 tests covering driving/grip/braking, elevated roads, every EF rating's actual spawn and scale, high lift/tumble/landing wreck, armor/cage/suspension/anchor effects, purchase prerequisites and transactions, actual power/transmission effects, all EF-specific phone targets, corruption-safe migration, and multi-cell force sampling.

Syntax checks and the root CPU-only initialization/input/menu/graphics smoke passed. CPU smoke uses real Three geometry/math and mocked DOM/renderer. Browser visuals, GPU rendering and frame rate remain unverified because the managed environment does not provide the required browser-control skill.

## Limits

Arcade weather and vehicle physics. Tornadoes uproot trees/poles; buildings remain solid. Traffic follows the regional roads rather than using full urban navigation. Photographs award research funds rather than downloading image files. The world is generated once and culled by distance, rather than streamed from disk.

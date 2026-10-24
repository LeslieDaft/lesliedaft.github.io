# Delivery Until Death

Browser driving career for Daft Arcade. Open index.html through an HTTP server; play.html is the full-screen game. Three.js is reused from the arcade's existing local vendor folder.

## Implemented

- Procedural 3D city, shared building geometry, facade textures, street signals, traffic, rain, lighting cycle, car lights, cockpit/chase/overhead cameras.
- Lateral tire grip with wet-road and handbrake behavior, traction assist, braking, skids, collision/food damage.
- Pickup and delivery jobs, two-order stacking, tips, late penalties, review-based offer counts, reputation recovery.
- Patrol detection with building occlusion, speeding/red-light/collision violations, stops, fines, pursuits, surrender, arrest/impound, lost-sight searches.
- Ages 20–80 over 10 hours, 2 hours or 15 minutes; net-worth score; fuel, repairs, insurance overhead, emergency towing, vehicle purchases, upgrades.
- Three browser-local save slots, autosave, settings, remappable core driving controls, gamepad and multi-touch controls, 20-second player-path replay with scrub and orbit.
- Local procedural audio, separate effects/music volume, school-computer graphics preset, automatic 2D compatibility view if WebGL cannot initialize.
- Existing arcade page chrome and ad placements retained.

## Validation

Run `node delivery-until-death/sim.test.mjs`. Covers acceleration, braking, wet grip, drifting, tips/late delivery, rating recovery, age-80 completion and JSON save roundtrip. Browser-checked start/tutorial, dispatch/acceptance, acceleration, pause, reload/continue, settings and upgrade purchase in compatibility rendering. The test browser cannot initialize WebGL; 3D appearance and GPU performance remain unverified. A full 10-hour playthrough has not been performed.

## Current limits

Stylized procedural graphics, simplified suspension and collision response, grid-road traffic and simplified police steering; not a licensed vehicle simulator. Replay records the player path, not every traffic vehicle. No pedestrians, terrain elevation, deformable bodywork, spoken radio, or network multiplayer. Fuel/repair/insurance economy and career duration need player balancing. Browser saves are per device and can be lost if site data is cleared.

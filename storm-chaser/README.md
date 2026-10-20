# Storm Chaser

A free-roam 3D storm-research game for Daft Arcade. Uses the site's existing local Three.js r170 module at `../after-bell/vendor/three.module.js`; no paid services, network APIs, downloaded assets, or runtime build step.

## Play

- WASD / arrows: accelerate, brake/reverse, steer.
- Space: handbrake / drift. Road, dirt, grass, and mud have different traction and speed.
- E: deploy a probe within 650 m of the tornado. Data uploads after 20 seconds in range.
- F: photograph the funnel between 220–1200 m, with an eight-second processing cooldown.
- Q: deploy/release purchased hydraulic anchors below 15 km/h.
- G: open the motor pool while stopped near the lime weather-outpost marker.
- R: emergency recovery and full repair at the outpost, charging up to $150.
- C: switch close/wide chase camera. Drag to orbit; scroll to zoom.
- M: enlarge radar. P / Escape: pause and settings.
- Touch devices get steering, accelerator, brake, handbrake and action buttons.

## Game systems

- A six-by-six-kilometer countryside with rolling terrain, four north/south and four east/west roads, three towns, farms, fields, trees, power lines, barns, and an outpost.
- Shaped research truck with body panels, windows, bumpers, roof lights, weather sensors, steering/rolling wheels, suspension, and visible armor/anchors upgrades.
- Continuous, tapered multi-layer funnel geometry, cloud shelves, rotating airborne debris, local rain, lightning, and synthesized engine/wind sounds.
- Wind pulls and rotates the truck's momentum. Trees and utility poles fall when hit by the storm. Buildings and rocks collide with the truck.
- Passive research income from 210–600 m, paid photos, paid probe telemetry, and repeating contracts for scan time, probes, and photography.
- Engine, armor, Doppler radar, and hydraulic-anchor purchases. Radar upgrades expand the map and predict storm travel; speed probe collection. Armor reduces wind damage.
- Funds, probes, upgrades, graphics/audio choices and lifetime records save on this browser. Active run, weather time and vehicle condition restart per visit.

## Graphics and performance

Two independent sliders match Railbreak:
- **Render Distance:** 400–2400 m, 100 m steps, default 1600 m. Sets camera/fog range and world-object culling.
- **High-detail Distance:** 80–700 m, 20 m steps, default 300 m. Detailed nearby buildings, windows, layered trees, utility wires switch to simple far models. Clamped to render range.

School computer mode caps device pixel ratio at 1, disables shadows, and reduces rain/debris. Shared geometry/materials, instanced road markings/debris/dust, fixed probe-telemetry channels, coarse LOD updates, and bounded particles prevent per-frame object growth.

## Validation

`node physics.test.mjs` exercises acceleration, braking, steering, mud speed limits, handbrake slip, anchor wind resistance, damage reduction, flat roads, purchase affordability/max levels, and corrupt-save normalization.

`node --input-type=module --check < game.js` and `node --check physics.mjs` check syntax. No browser visual/performance claim: the managed environment does not have the required browser-control skill. Root performs integration smoke checks and publication.

## Intentional limits

Arcade driving and storm behavior, not a weather or vehicle simulator. Storm damage topples trees and poles; buildings remain solid. Photos award research funds rather than generating image files. The countryside is generated at load and uses view-distance culling rather than streamed disk chunks.

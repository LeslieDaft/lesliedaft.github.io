# Deep Signal

A standalone Three.js underwater hunting and mining game for Daft Arcade. Imports the site's locally bundled Three r170 from `../after-bell/vendor/three.module.js`; no paid API, accounts or server required.

## Play
- **1 / Helm**: WASD or arrows thrust and steer; Q descends, E ascends, Shift boosts. Space can fire the hydro guns.
- **2 / Hydro guns**: mouse aim and hold left click or Space to fire hydrophobic rounds.
- **3 / Torpedoes**: mouse aim and click / Space to fire. Buy and mount a tube first.
- **4 / Drill**: approach a glowing ore seam within 36 world units and hold click / Space. Engineer mines at a slower rate while on another station.
- AI pilot holds position outside the helm. AI gunner fights nearby creatures; AI torpedo crew engages larger threats when a tube is installed.
- **B** opens the refit yard near the cyan Anchor Station sonar beacon. Sell mineral cargo, repair, select a mount, buy a compatible component or research the upgrade tree.
- **H** help, **Esc** pause, **R** emergency recovery after disabling (loses cargo and 15% credits).
- Touch controls, station buttons, on-canvas aiming and firing are included; toggle touch display in Settings.

## Systems
- Broad 450 × 1730 world-unit trench with depth regions, faceted terrain, rocky walls, shipwrecks, glowing deposits and roaming creatures. Depth telemetry is four meters per world unit.
- Detailed multi-part submarine with plate sections, conning tower, windows, searchlights, propellers and visibly fitted components. Angular shark / leviathan models with swimming tails, fins and eyes. No bubble-character models.
- 15 components, 10 compatible mounting points, 11 prerequisite research nodes across weapons, mining, hull, power and crew.
- Bars, ribs and armor plates actually increase hull and crush-depth tolerance while adding mass. Reactor, weight, weapon, mining and cargo stats affect play.
- Crews, hunting bounties, mining cargo, pressure damage, repair, optional emergency recovery, regenerating encounters, sonar and guarded browser-local autosave.
- Independent render distance, detail distance and resolution settings. Instanced terrain/kelp, near-only coral details, capped particles, shared projectiles, distance culling and time-step caps limit load.

## Validation
`node --check game.js` and `node --test model.test.mjs` (8 progression / transaction / persistence tests). Root integration performs a CPU Three/DOM smoke test. Browser visual/performance QA is unavailable in the managed environment and must not be claimed.

## Deliberate scope
Arcade submarine simulation; no walkable interior, multiplayer or photorealistic fluid simulation. Pilot station uses an exterior chase camera. Purchased modules use compatible mounts rather than arbitrary unconstrained hull construction. Station crew have names and functional AI roles, rather than separately rendered interior characters.

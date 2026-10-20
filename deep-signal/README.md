# Deep Signal — Inside Nautilus

A first-person submarine exploration, hunting and mining game. The player is physically inside a detailed pressure cabin, looking through a transparent curved glass dome into the actual 3D ocean. Angular metal machinery, ribbed hulls, plate floors, pipes and consoles replace bubble-style graphics.

## Direct controls inside the world
- **Right mouse drag** looks around the cabin. On touch, drag to look and tap to click.
- **Left click actual physical screens and buttons** to operate them. No interaction key, separate interaction mode or refit overlay is needed.
- Click **SIT AT HELM** on the front dashboard. Click thrust, turn, ascend, dive, level, boost and hold buttons. WASD / arrows, Q/E and Shift also drive while seated.
- Click **STAND / WALK** on the helm or station screens. WASD / arrows now walk through the cabin, with floor and table collision. Look around and click another station to sit there.
- Left console: hydrophobic guns. Right console: torpedoes. Port-side rear console: mining rig. Their direct buttons fire weapons / toggle the drill; seated operators can also aim through the dome and hold click or Space.
- AI crew cover unoccupied stations. The pilot holds position while the player walks or operates a weapon. Guns track nearby creatures; installed torpedoes attack larger contacts; the engineer mines nearby seams.
- The small **fabrication table behind the helm on the right** has an actual top-mounted touchscreen. Cycle mounting points, cycle compatible components, BUY & PLACE; cycle technologies and RESEARCH. Purchases and research work **anywhere**. Cargo sale and hull repairs require Anchor Station.
- **Esc** pauses, **H** opens help. **R** or the recovery button recovers a disabled ship, losing mineral cargo and 15% credits.

## Real live exterior feeds
Three dashboard monitors show actual port, starboard and aft ocean views using `WebGLRenderTarget` textures. Cameras are 256 × 144 and update round-robin at a total of ~9.5 updates/sec (~3.2 fps each), rather than rendering three full scenes per game frame. Cabin geometry and monitor surfaces are hidden during offscreen rendering, then the previous target and visibility are restored, preventing render-target feedback.

## Progression and environment
- A 450 × 1730 world-unit trench with pressure regions, faceted terrain, rock walls, wrecks, glowing mineral deposits, swimming creatures and leviathans. Depth uses four meters per world unit.
- 15 physically fitted components, 10 mounting points, 11 prerequisite research nodes across weapons, mining, hull, power and crew.
- Bars, ribs and plates actually increase maximum hull and crush-depth tolerance while adding mass. Reactor power, engine thrust, gun damage, mining rate, crew skill and cargo capacity affect play.
- Bounty hunting, mining cargo, pressure damage, repair, emergency recovery, regenerating encounters and guarded browser-local saves. Existing saves remain compatible.
- Dark water beyond searchlights, deep silhouettes and actual incoming creature attacks produce tension. Quiet procedural cinematic music, muffled machinery, sonar, gunfire, torpedoes and impacts use the shared `../game-audio/cinematic.mjs` helper; audio starts only after a user action and can be muted.
- Independent render distance, near-detail distance and resolution settings, instanced terrain, capped particles and shared projectile geometries limit load.

## Validation
- `node --check game.js` / `node --check interior.mjs`
- `node --test model.test.mjs interior.test.mjs`: 10 tests cover transactional purchases, compatibility, power caps, prerequisites, hull pressure, save sanitation, cargo sale and direct touchscreen UV-coordinate mapping.
- Root integration runs real Three geometry/math with a mocked renderer and DOM. This can check runtime flow and direct screen actions but does not establish browser visual quality or actual GPU performance. Browser visual QA is unavailable in the managed environment.

`window.deepSignal.getState()` exposes seat/walk state, camera coordinates, feed update count and physical panel hit regions for diagnostics. `runScreenAction(action,data)` supports deterministic CPU interaction checks.

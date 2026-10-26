# Scrap Titan

A buildless Three.js 3D mech action game for Daft Arcade. Uses the arcade's existing MIT-licensed Three.js r170 module at `../after-bell/vendor/three.module.js`; no CDN, backend, accounts, paid services, or external assets.

## Play

- WASD / arrows: move relative to the camera. Mouse: aim independently from your legs. Hold left mouse: fire all installed weapons.
- Hold right mouse and drag: orbit horizontally and change camera elevation without firing or moving your weapon aim. The chase camera stays behind the mech by default and smoothly returns after you release the drag.
- Shift / Space: dash with a recharge and short invulnerability window. Mouse wheel: change camera distance.
- E: recover nearby wrecks or enter the central workshop. Hold E beside a cleared reactor to extract its core.
- Tab: open the workshop when near it. P / Escape: pause. Settings control render distance, high-detail distance, resolution, and shadows.
- Touch: left stick moves; drag on the battlefield to orbit the chase camera; FIRE auto-aims at the nearest hostile in range independently of the camera gesture. DASH, USE, BUILD buttons cover other actions. Hold USE to extract cores.

## World and progression

The 2,400 × 2,400 metre wasteland contains factories, roads, an elevated highway, wrecks, explosive barrels and six guarded reactors. Each reactor grants 600 scrap and a different rare component. Patrols arrive repeatedly; every fifth patrol includes a titan hunter. Destroy machines and drive over their salvage (or use E within 36m). Destroyed vehicles and barrels also drop scrap. The garage repairs for free and is protected from enemy fire.

The assembly menu has six real mount slots. Buy a part, select a compatible mount and click PLACE. Ten components include four weapons, two armor options, two leg assemblies, thrusters and a repair reactor. Installed parts visibly alter the mech and change mass, speed, health, dash or repair. Spare parts stay in inventory. A part cannot be fitted to two mounts unless two copies are owned.

Credits, owned/installed parts, six reactor completion flags, best patrol, total kills and display preferences save locally. Death recovers the mech and parts at the garage for 20% of credits; manual return costs 15%. Combat state resets on page reload, while progression remains.

## Rendering

Mechanically shaped angular models and moving leg assemblies, recoil, muzzle flashes, impact debris, angular mountains, fog, procedural ground texture, directional shadows and a detailed central workshop. Building detail children and props cull at the detail slider; base building silhouettes cull at render distance. Rubble and pylons use instanced meshes. Bullets and impact debris use object pools with bounded particle counts.

## Validation

`node --test model.test.mjs` checks unique part placement, compatibility, purchases, armor/mobility tradeoffs, corrupted saves and fast projectile collision. `node --check game.js` validates runtime syntax. Browser rendering and actual device frame rate require manual play verification.

## Chase camera

A lower, forward-looking third-person camera follows the mech heading with angular and positional damping. Right-button or touch drags temporarily override automatic following. The camera shortens its boom near factory walls. Held movement directions retain a stable movement reference while the camera catches up, preventing held sideways movement from feeding back into a circle. A fresh directional input or active orbit uses the current camera frame.

`node --test camera.test.mjs model.test.mjs` also checks camera-side movement, stable held-input heading, heading wraparound, behind-the-mech poses, wall avoidance and the left-button firing boundary. Actual WebGL visuals and pointer interaction need manual browser play verification.

## Online co-op

Open **Online Co-op** from the intro or **Multiplayer** in the header. One pilot selects **Host a Room** and shares the six-character code; up to three friends select **Join**. Every client runs the same game version. The host tab must stay open and visible.

The host simulates shared enemies, destructible props, hostile damage, reactor extraction, and salvage. Other pilots send poses, loadouts, weapon requests and interactions. Weapon requests are checked against the pilot's mounted weapon, firing cadence and muzzle distance. Teammates do not damage each other. Salvage and captured core rewards go to the entire connected squad; each device keeps its own saved mech, inventory and credits. Joining follows the host's current reactor battlefield. Leaving returns to solo play. Recovery only rebuilds the individual pilot and does not reset a live squad battle. Pausing stops that pilot's controls while the host simulation continues.

The bundled PeerJS library uses its public signaling service and direct WebRTC. No paid service is provisioned. Some restrictive NAT, school, or corporate networks may prevent joining because no TURN relay is configured. UI reports connection failures and timeouts.

Run `node --test scrap-titan/*.test.mjs` for mechanics plus multiplayer packet validation, cadence checks, room capacity, handshakes, bidirectional transport and disconnection tests. The transport integration test uses in-memory peers; live public signaling/WebRTC still requires a browser check. `window.scrapTitanDebug()` exposes read-only state for browser QA.

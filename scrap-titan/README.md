# Scrap Titan

A buildless Three.js 3D mech action game for Daft Arcade. Uses the arcade's existing MIT-licensed Three.js r170 module at `../after-bell/vendor/three.module.js`; no CDN, backend, accounts, paid services, or external assets.

## Play

- WASD / arrows: move. Mouse: aim independently from your legs. Hold left mouse: fire all installed weapons.
- Shift / Space: dash with a recharge and short invulnerability window. Mouse wheel: change camera distance.
- E: recover nearby wrecks or enter the central workshop. Hold E beside a cleared reactor to extract its core.
- Tab: open the workshop when near it. P / Escape: pause. Settings control render distance, high-detail distance, resolution, and shadows.
- Touch: left stick moves; FIRE auto-aims at the nearest hostile in range; DASH, USE, BUILD buttons cover other actions. Hold USE to extract cores.

## World and progression

The 2,400 × 2,400 metre wasteland contains factories, roads, an elevated highway, wrecks, explosive barrels and six guarded reactors. Each reactor grants 600 scrap and a different rare component. Patrols arrive repeatedly; every fifth patrol includes a titan hunter. Destroy machines and drive over their salvage (or use E within 36m). Destroyed vehicles and barrels also drop scrap. The garage repairs for free and is protected from enemy fire.

The assembly menu has six real mount slots. Buy a part, select a compatible mount and click PLACE. Ten components include four weapons, two armor options, two leg assemblies, thrusters and a repair reactor. Installed parts visibly alter the mech and change mass, speed, health, dash or repair. Spare parts stay in inventory. A part cannot be fitted to two mounts unless two copies are owned.

Credits, owned/installed parts, six reactor completion flags, best patrol, total kills and display preferences save locally. Death recovers the mech and parts at the garage for 20% of credits; manual return costs 15%. Combat state resets on page reload, while progression remains.

## Rendering

Mechanically shaped angular models and moving leg assemblies, recoil, muzzle flashes, impact debris, angular mountains, fog, procedural ground texture, directional shadows and a detailed central workshop. Building detail children and props cull at the detail slider; base building silhouettes cull at render distance. Rubble and pylons use instanced meshes. Bullets and impact debris use object pools with bounded particle counts.

## Validation

`node --test model.test.mjs` checks unique part placement, compatibility, purchases, armor/mobility tradeoffs, corrupted saves and fast projectile collision. `node --check game.js` validates runtime syntax. Browser rendering and actual device frame rate require manual play verification.

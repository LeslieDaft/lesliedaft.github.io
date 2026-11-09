# Slap Circuit

A static, original pixel-art slap-fighting career for Daft Arcade. Open `index.html` through a static web server. No runtime dependencies, external assets, analytics, or API keys.

## Play

- Select a rival from the ladder. Beat ten distinct opponents to take the belt.
- Pick one of three equipped slaps with **1 / 2 / 3**, then stop the timing cursor with **Space** (or tap Strike). Gold is a clean hit; its inner strip is perfect.
- Read the final shoulder tell: rival's right shoulder = **Left / A**, left shoulder = **Right / D**, both hands overhead = **Down / S** to brace. Commit when the ring border flashes gold. The first input is locked; early moves fail.
- Each slap is usable once per **three-turn round**, not once per bout. Recovering with **R** consumes a turn. Three turns refresh the kit and restore some stamina.
- **P** pauses. Hiding the tab automatically pauses without advancing combat. Help pauses an active bout; press Resume afterward.
- Touch buttons mirror all combat inputs. Sound is opt-in.

## Strategy and progression

High guards block hooks and are vulnerable to palms/rising slaps. Low guards block rising slaps and are vulnerable to hooks. Snap slaps interrupt counter stances; heavy slaps into counters cause retaliation. Feint taps open the next guard; backhands ignore guard modifiers. Perfect defenses increase the next slap's damage. Matching the correct read is safer than generic bracing, which trades half damage and stamina against side swings. Later rivals feint by reversing their shoulder tell before the defense window.

Career contains ten authored rivals and four capped permanent upgrade tracks. Each new win unlocks the next rival. Feint, backhand, and rising slap unlock as kit sidegrades; selecting a new slap replaces the oldest equipped slot. Rematches pay 40% of the original purse; losses pay 22%; forfeits pay nothing.

## Saving

Career autosaves in `localStorage` under `daft-slap-circuit-v1` after bouts, upgrades, kit changes, and sound changes. Active bouts are not saved. Export/Import transfers a validated JSON backup between browsers or devices. Storage failures are shown in the career status. Reset and import require an explicit confirmation.

## Files

- `data.js`: rival, slap, and upgrade definitions.
- `game.js`: career, combat state machine, procedural pixel portraits, sound and controls.
- `style.css`: responsive interface.
- `thumbnail.svg`: original local cover art.

## Checks

JavaScript can be syntax checked with `node --check data.js` and `node --check game.js`. Run `node test.cjs` for headless behavioral checks through the shipped UI handlers: perfect play beats all ten rivals without upgrades, pause freezes combat, one defense input is locked, stamina is spent correctly, kit refreshes after three turns, and career upgrades/kit changes persist. `window.SlapCircuit.getState()` returns a snapshot for integration diagnostics; `validateSave()` validates exported saves. These helpers do not mutate progression.

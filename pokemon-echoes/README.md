# Pokémon: Echoes of the Meridian

Unofficial, dependency-free fan adventure for Daft Arcade. Open `index.html` through a static web server. No API, remote sprites, build step, or account is needed. Pixel artwork is drawn locally.

The campaign has eight named regions, 40 authored trainer battles with 126 opponent Pokémon, six Gym badges, Team Relay's Beacon story, a champion finale, and eight optional field reports. There are 30 Pokémon species, capture, evolution, six-member teams and a reserve box, shared XP, type matchups, move PP, poison/burn/paralysis, healing, shops, and post-story exploration.

Designed for approximately a two-hour adventure; full human completion time has not been measured. Reading, team choices, capture, optional exploration, and battle decisions change the duration. There are no artificial waiting gates or mandatory wild grinding requirements.

## Controls

- WASD or arrow keys: move. E / Space / Enter: interact from an adjacent tile.
- B: bag. M: travel map. Escape: close a dialog or open menu.
- Click battle choices. Switching and items use a turn. Wild battles allow fleeing/catching; trainer battles do not.
- Touchscreens have a D-pad and Talk / Enter button. Battles use touch buttons.

## Progress and saves

Autosave writes to `localStorage` under `daft-pokemon-echoes-v1` during exploration and after battle turns, purchases, catches, and story transitions. Manual Save is in the top bar. Continue restores the team, exact chapter and position, completed encounters, inventory, and any in-progress battle.

Browser saves belong to this browser/device and disappear if browser data is cleared. Menu → Export save downloads a JSON backup. Menu or title → Import save restores a backup, with a replacement prompt when an adventure is already active. An unavailable storage warning asks the player to export. JSON imports are size-limited and validated.

Centers are free and fully restore HP, PP and status. Losing a battle returns the player to the Center, heals the team, preserves victories and story progress, and loses at most ₽60. Leaders require the four local trainer victories. East exits and fast travel enforce sequential chapter progression.

## Files

- `index.html`, `style.css`: responsive game shell and overlays.
- `data.js`: authored Pokémon, moves, campaign, dialog and opponent teams.
- `game.js`: world rendering, progression, combat, storage and controls.
- `thumbnail.svg`: original pixel-inspired arcade cover.

## Verification

Syntax checked with Node. A VM harness checked reachable interaction positions for every service/NPC/trainer and both exits in all eight maps, progression gating, valid/invalid saves, all 40 actual battle completion transitions, six badges and the ending. Struggle is typeless to avoid immunity/PP softlocks. A second balance simulation starts with six level-5 Pokémon available in the opening meadow and reaches the ending with no wild XP and one battle retry in the deterministic test, using free Center visits. These simulations verify progression and do not measure real playtime. Run `node test.cjs` to reproduce. Browser testing is handled by the site integration pass.

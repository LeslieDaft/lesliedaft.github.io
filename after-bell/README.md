# After Bell

A browser-based 3D school horror game for Daft Arcade. A friend dares you to stay inside school from Monday to the following Monday.

The opening is a 21.5-second in-world cutscene: you leave homeroom while Jamie walks beside you and makes the dare. Dialogue uses readable subtitles, and the cutscene can be skipped or paused. Play begins just outside homeroom with that class checked off. Resuming a checkpoint goes directly into play.

Each school day lasts 25 seconds. Check in at two classrooms, then hide when the main lights switch off. Each night has a different piece of evidence to collect. Secure the evidence and reach a locker to finish the night. The map shows the objective and hiding spots.

Mr. Reed, the band teacher, investigates noise. Ms. Vale searches by sight. GoGuardian scans the halls. All three have matching generated jumpscare art. Weekday captures use a three-second shaking whiteout followed by two seconds of darkness, then detention lights turn on. Find the key and fuse, restore door power, unlock the door, and walk back to the halls. Detention is supervised: the teacher patrols, sees the flashlight, hears movement and repairs, and chases students away from their seats. Filing cabinets provide cover. Getting caught again repeats the matching jumpscare and resets the detention puzzle, while keeping the night's evidence and remaining time.

Saturday and Sunday have no teachers and no detention. A weekend capture ends the run and deletes the morning checkpoint. Collect all seven pieces of evidence and leave through the front doors on the final Monday.

## Controls

| Action | Key |
| --- | --- |
| Move | W A S D |
| Look | Mouse or arrows; Q/R turn left/right |
| Interact / hide / leave locker | E |
| Toggle flashlight | F |
| Sprint | Shift |
| Crouch | Ctrl or C |
| Wind-up distraction | G |
| School map | M |
| Pause | Esc |

School-laptop graphics are the default. The menu includes difficulty, sound, and reduced shake/brightness controls. Checkpoints save locally at each morning; a weekend death clears them.

`index.html` is the arcade page with the existing banner slots. `play.html` runs the game inside its viewport. The renderer, game art, and code are bundled locally. No external game engine CDN is needed.

Run navigation, line-of-sight, locked-door, and campaign-rule checks with `node engine.test.mjs`. Image generation provenance and the final prompts are in `ASSETS.md`; Three.js uses the MIT license in `vendor/THREE-LICENSE.txt`.

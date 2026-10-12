# After Bell

A browser-based 3D school horror game for Daft Arcade. A friend dares you to stay inside school from Monday to the following Monday.

The opening is a 21.5-second in-world cutscene: you leave homeroom while Jamie walks beside you and makes the dare. Dialogue uses readable subtitles, and the cutscene can be skipped or paused. Play begins just outside homeroom with that class checked off. Resuming a checkpoint goes directly into play.

Each school day lasts 25 seconds outside of tests. Take a five-question math/science paper with Ms. Vale in the Lab and a music theory paper with Mr. Reed in the Band Room. The bell pauses while answering and reviewing a test. Each teacher allows one attempt per day, with rotating questions from a 60-question collection.

Nights end automatically at dawn, even outside a locker or during weekday detention or rescue. Missing that night's proof earns a morning message from Jamie and an additional day inside school. Calendar days continue through later weeks, including repeated lethal weekends. Seven valid nightly proofs are required to leave, after at least seven nights. The map shows the night's objective and hiding spots.

An A (at least 90%; 5/5 on a five-question paper) earns that teacher's protection for the current night. Direct catches use the teacher's friendly portrait, a gentle fade, and release. If another watcher catches the student within 10 meters of a visible, reachable A-grade teacher, a nine-second third-person conversation shows the teacher intervene and release the student. Protection can be used repeatedly that night and expires at dawn.

A score below 70% sends the student to Principal Mercer's office, with the supervised key/fuse escape puzzle. The next school day has no A-grade protection; grades are still awarded. A Friday penalty applies to Monday. This penalty survives checkpoint saves.

Mr. Reed, the band teacher, investigates noise. Ms. Vale searches by sight. GoGuardian scans the halls. Unprotected weekday captures use a three-second shaking whiteout followed by two seconds of darkness, then detention lights turn on. Find the key and fuse, restore door power, unlock the door, and walk back to the halls. Supervisors patrol, see the flashlight, hear movement and repairs, and chase students away from their seats. Filing cabinets provide cover. Recapture resets the office puzzle and preserves evidence. Night time continues through detention. The principal has a matching generated portrait and cannot be spared by teacher favors.

Saturday and Sunday have no teachers, tests, or detention. A weekend capture ends the run and immediately deletes the morning checkpoint; dawn cannot undo a fatal capture. Collect seven nightly proofs and leave through the front doors on the final morning.

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

Run navigation and campaign-rule checks with `node engine.test.mjs`, and exam correctness/UI checks with `node exams.test.mjs`. Image provenance and final prompts are in `ASSETS.md` and `ASSETS_UPDATE.md`; Three.js uses the MIT license in `vendor/THREE-LICENSE.txt`. Existing version 3 morning saves migrate to version 4 and remain usable.

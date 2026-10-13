# After Bell

A browser-based 3D school horror game for Daft Arcade. You suspect that GoGuardian is concealing a cult inside North Hollow School. Investigate from Monday onward and uncover seven ordered pieces of evidence. GoGuardian and the cult are fictional story characters; the game does not interact with monitoring software.

The opening is an in-world cutscene: you leave homeroom while Jamie walks beside you and discusses your suspicion about GoGuardian. Dialogue uses readable subtitles, and the cutscene can be skipped or paused. Play begins just outside homeroom with that class checked off. Resuming a checkpoint goes directly into play.

Each school day lasts 25 seconds outside of tests. Take a five-question math/science paper with Ms. Vale in the Lab and a music theory paper with Mr. Reed in the Band Room. The bell pauses while answering and reviewing a test. Each teacher allows one attempt per day, with rotating questions from a 60-question collection.

Nights end automatically at dawn, even outside a locker or during weekday detention or rescue. Missing that night's evidence earns a morning message from Jamie and an additional night of investigating. Calendar days continue through later weeks, including repeated lethal weekends. Seven evidence entries are collected in narrative order, one per night. An extra day targets the next missing entry instead of skipping the story; the journal gradually reveals the cult GoGuardian leads. The journal pauses time and watchers while the player reads, and unknown entries hide later revelations.

A persistent objective shows the exact next step, destination, and control during play, tests, cutscenes, captures, and escape puzzles. A direction arrow follows walkable routes, distance shows how far away the target is, and the map marks the same current target. After both tests, guidance switches to the flashlight, staff key, and hiding spot. Detention and the principal's office each show five separate escape steps, including installing a fuse already in your inventory and walking fully through the unlocked door.

An A (at least 90%; 5/5 on a five-question paper) earns that teacher's protection for the current night. Direct catches use the teacher's friendly portrait, a gentle fade, and release. If another watcher catches the student within 10 meters of a visible, reachable A-grade teacher, a nine-second third-person conversation shows the teacher intervene and release the student. Protection can be used repeatedly that night and expires at dawn.

A score below 70% sends the student to Principal Mercer's office, with the supervised key/fuse escape puzzle. The next school day has no A-grade protection; grades are still awarded. A Friday penalty applies to Monday. This penalty survives checkpoint saves.

Mr. Reed, the band teacher, investigates running, dropped items, and noisy repairs. Ms. Vale notices flashlight beams and open doors. GoGuardian scans the halls and hiding places, and temporarily seals hallway doors with a warning. Teachers learn repeated locker choices: footsteps, a whispered name, and a turning handle warn of an inspection before the near-catch sequence.

Evidence tasks require holding E nearby. Recording requires staying still, photographs emit a bright flash, and printing creates noise that draws a watcher. Teachers become more uncanny at night, with lingering smiles and heads turning before their bodies; footsteps, vanishing hallway figures, and sounds from the empty band room build tension. Monday introduces the rules, Tuesday adds searches, Wednesday brings power outages, Thursday teachers share sightings, and Friday includes a false all-clear. Weekends escalate GoGuardian scans and seals with no detention or teacher rescue. A-grade teachers still release or rescue you, then warn that they cannot help on Saturday.

Detention and principal escape locations are randomized. The guard patrols and inspects desks; installing the fuse takes a noisy hold-E repair while the student watches the hall. Recapture resets the escape puzzle. Unprotected weekday captures use a three-second shaking whiteout followed by two seconds of darkness, then detention lights turn on. Find the key and fuse, restore door power, unlock the door, and walk back to the halls. Supervisors patrol, see the flashlight, hear movement and repairs, and chase students away from their seats. Filing cabinets provide cover. Recapture resets the office puzzle and preserves evidence. Night time continues through detention. The principal has a matching generated portrait and cannot be spared by teacher favors.

Saturday and Sunday have no teachers, tests, or detention. A weekend capture ends the run and immediately deletes the morning checkpoint; dawn cannot undo a fatal capture. Collect all seven evidence entries and leave through the front doors on the final morning.

## Controls

| Action | Key |
| --- | --- |
| Move | W A S D |
| Look | Mouse or arrows; Q/R turn left/right |
| Interact / hide / leave locker | E |
| Collect evidence / install fuse | Hold E |
| Toggle flashlight | F |
| Sprint | Shift |
| Crouch | Ctrl or C |
| Wind-up distraction | G |
| School map | M |
| Evidence journal | J |
| Pause | Esc |

High-quality graphics are always enabled; there is no school-laptop graphics setting. The menu includes difficulty, sound, and reduced shake/brightness controls. Checkpoints save locally at each morning; a weekend death clears them.

`index.html` is the arcade page with the existing banner slots. `play.html` runs the game inside its viewport. The renderer, game art, and code are bundled locally. No external game engine CDN is needed.

Run navigation and campaign-rule checks with `node engine.test.mjs`, and exam correctness/UI checks with `node exams.test.mjs`. Image provenance and final prompts are in `ASSETS.md` and `ASSETS_UPDATE.md`; Three.js uses the MIT license in `vendor/THREE-LICENSE.txt`. Existing version 3 and 4 morning saves migrate to version 5 and remain usable; locker memory persists in new saves.

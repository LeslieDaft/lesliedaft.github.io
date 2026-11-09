# Crossword Forge

Buildless, offline-capable after load: serve this directory from any static host. No API key, remote fonts, libraries, tracking, or network services.

## Play

Click a cell or clue and type. Click an intersection twice or press Space to switch Across/Down. Arrows move, Tab/Enter advances through clues, Backspace erases. Touch keyboards and clue tabs are provided. Check word/puzzle only checks entered letters. Reveal supplies one letter and marks it. There is no time limit or hint penalty.

The first puzzle is 5×5, using short common words and direct clues. Solving a puzzle advances the climb. Skipping does not. Ten steps reach a 15×15 board with largely indirect, original wordplay clues. Further puzzles remain expert. Difficulty is an approximation, not a claim of New York Times editorial equivalence.

## Generation

A seeded placement pass grows a **connected interlocking pattern**, enforcing matching crossings, word-boundary clearance and no adjacent accidental letter runs. The generated pattern is extracted into numbered slots. A bounded constraint solver then fills the slots from a curated answer bank. The constructive seed fill guarantees a valid fallback if the solver reaches its search budget. The final grid is validated independently before display: every multi-letter run has exactly its matching answer and clue, answers are unique within a grid, every entry is at least three letters, every entry crosses another, and all letters belong to one connected component.

These are freeform interlocking crosswords: not every letter is checked in both directions, and patterns are not constrained to newspaper rotational symmetry. Advanced boards are larger and have harder clues; they are not standard fully checked newspaper grids. The finite word/clue bank means answers and clues can recur between seeds. Identical seed + difficulty + bank version yields the same puzzle.

## Saves

Every edit and completion saves to `localStorage` key `daft-crossword-forge-v1`. The clock pauses when the page is hidden. Saves belong to this browser/origin/device and can be removed by clearing browsing data. “Puzzle details & saves” exposes a portable JSON backup; copy it to a note and paste/import on another device. Invalid backups are rejected before replacing progress. If browser storage fails, the status tells the player to export.

## Verify

Run `node verify.cjs`. The batch check generates all ten levels across multiple seeds and independently checks words, clues, numbering, contiguous runs, connectivity, minimum lengths, uniqueness, repeatability, and pattern variety. It reports board occupancy and checked-letter ratios so sparse/freeform grids are not confused with fully checked grids.

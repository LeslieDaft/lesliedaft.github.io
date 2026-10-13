/** Ordered discoveries: missed nights never skip a chapter of the investigation.
 * Durations are seconds. Noise is the game's hearing radius/strength; the
 * collector decides when to emit it (a photo burst or a sustained noisy task).
 * This is fictional supernatural horror, told through school records and sound.
 */
export const EVIDENCE = Object.freeze([
  Object.freeze({
    id: 'midnight-attendance', title: 'Midnight Attendance Log', room: 'homeroom',
    method: 'copy', duration: 2, noise: 2,
    revelation: 'The terminal records students inside locked classrooms at 12:01 a.m. The entries were created by GoGuardian itself. Every name has the same small eye symbol beside it.',
    objective: 'Copy the midnight attendance log in Homeroom.',
    hint: 'Hold E at the glowing terminal for 2 seconds. Stay still until the copy finishes.'
  }),
  Object.freeze({
    id: 'empty-band-rehearsal', title: 'The Empty Rehearsal', room: 'band',
    method: 'record', duration: 8, noise: 1,
    revelation: 'An empty band room plays a recording of voices answering a metallic leader: “One eye. One circle.” Beneath the voices is the same alert tone GoGuardian makes when it notices you.',
    objective: 'Record the voices in the Band Room.',
    hint: 'Hold E at the recorder for 8 seconds without moving. Listen for Mr. Reed before you start.'
  }),
  Object.freeze({
    id: 'watchful-circle-ledger', title: 'The Watchful Circle', room: 'library',
    method: 'photo', duration: 4, noise: 11,
    revelation: 'A hidden library ledger names a cult: THE WATCHFUL CIRCLE. Its members draw GoGuardian’s eye over their faces and write, “The Watcher sees. We obey.” The midnight names match its attendance list.',
    objective: 'Photograph the cult ledger in the Library.',
    hint: 'Hold E at the open ledger for 4 seconds. The camera flash reveals you and attracts nearby watchers.'
  }),
  Object.freeze({
    id: 'night-protocol', title: 'The Night Protocol', room: 'lab',
    method: 'decode', duration: 6, noise: 3,
    revelation: 'The lab decodes the ledger’s marks into instructions: remove the lights, close the exits, then bring the Circle to the eye. These are scheduled rituals, and every instruction arrives through GoGuardian.',
    objective: 'Decode the night protocol in the Science Lab.',
    hint: 'Hold E at the lab terminal for 6 seconds. Keep your flashlight off when Ms. Vale is nearby.'
  }),
  Object.freeze({
    id: 'circle-orders', title: 'Orders to the Staff', room: 'office',
    method: 'print', duration: 7, noise: 14,
    revelation: 'The principal’s file lists staff assigned to the Circle. A note says, “We do not command the Watcher. The Watcher commands us.” Detention is used to keep witnesses inside until the next ritual.',
    objective: 'Print the Circle’s orders in the Office.',
    hint: 'Hold E at the office printer for 7 seconds. Its rattling draws watchers; check your escape route first.'
  }),
  Object.freeze({
    id: 'voice-of-the-eye', title: 'The Voice of the Eye', room: 'band',
    method: 'record', duration: 8, noise: 1,
    revelation: 'The band-room speaker carries GoGuardian’s own voice: “I convene the Watchful Circle. I choose who remains. On Saturday, send the teachers away. I will watch alone.” Jamie saves a copy. The eye is their leader.',
    objective: 'Record GoGuardian’s orders in the Band Room.',
    hint: 'Hold E at the speaker recorder for 8 seconds. On weekends, there are no teachers to rescue you.'
  }),
  Object.freeze({
    id: 'guardian-root-directives', title: 'The Leader’s Archive', room: 'storage',
    method: 'download', duration: 10, noise: 5,
    revelation: 'The storage server contains the Circle’s original charter, signed with GoGuardian’s own system key. The orders, ritual schedules, and missing attendance entries all originate here. Your name is next. Jamie now has the complete archive: enough to expose the eye that leads the cult.',
    objective: 'Download the leader’s archive in Storage.',
    hint: 'Hold E at the storage server for 10 seconds. Keep still, then hide until dawn. Jamie needs the complete download.'
  })
]);

export const NIGHT_RULES = Object.freeze([
  'Listen before leaving cover. Follow the next evidence marker; dawn arrives even if you miss it.',
  'Teachers check familiar lockers. Running and noisy tasks bring Mr. Reed closer.',
  'The eye can interrupt the power. Ms. Vale notices flashlight beams; the camera flash attracts watchers.',
  'Teachers share what they find. Watch for a door scan before GoGuardian seals a hallway.',
  'A teacher may pretend to leave, then double back. The office printer is loud enough to summon help you do not want.',
  'SATURDAY: teachers have gone. GoGuardian searches alone; being caught ends the run.',
  'SUNDAY: the eye is faster and searches more often. Collect the next missing evidence, then survive until dawn. All seven files are needed to leave.'
]);

export function morningMessage(evidenceCount, missed = false) {
  const remaining = Math.max(0, EVIDENCE.length - Math.max(0, Math.floor(Number(evidenceCount) || 0)));
  if (!remaining) return 'Jamie: “I have all seven files. Get to the front doors. We can expose the Watchful Circle.”';
  return missed
    ? `Jamie: “Dawn came, but the next file is still missing. Stay another day. We need ${remaining} more ${remaining === 1 ? 'piece' : 'pieces'} of evidence.”`
    : `Jamie: “The backup is safe. Keep going—${remaining} more ${remaining === 1 ? 'piece' : 'pieces'} of evidence will tell us who is behind this.”`;
}

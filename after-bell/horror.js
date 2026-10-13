import { ROOMS, gridToWorld, lineOfSight } from './engine.js';

/**
 * Bounded, nonlethal atmosphere. update() returns {lightFlicker: 0..1,
 * apparition: boolean}; multiply the normal flashlight intensity by lightFlicker.
 * onSound(kind, details) emits short `phantom-step`, `band-echo`, or `light-click`
 * cues. Details contain volume, and music cues contain frequency/duration.
 * The caller owns sound synthesis, captions, damage, and actual watcher AI.
 */
export function createHorrorAtmosphere({ world, player, camera, onSound = () => {}, onMessage = () => {} }) {
  const ghost = world.apparition;
  const spots = [7, 10, 13, 16, 19, 22].flatMap(z => [16, 15, 17].map(x => gridToWorld(x, z)));
  const melody = [220, 261.63, 246.94, 207.65, 220, 164.81];
  let phaseKey = '', clock = 0, nextApparition = 10, ghostTime = 0, ghostSeen = false, flicker = 0;
  let stepTime = 0, stepCount = 0, movingBefore = false, stoppedMessage = false;
  let noteTime = 0, noteIndex = 0, bandMessage = false, eventIndex = 0, active = false;
  const hideGhost = () => { if (ghost) ghost.visible = false; ghostTime = 0; ghostSeen = false; };
  const result = multiplier => ({ lightFlicker: multiplier, apparition: !!ghost?.visible });

  function reset() {
    phaseKey = ''; clock = 0; nextApparition = 10; flicker = 0;
    stepTime = 0; stepCount = 0; movingBefore = false; stoppedMessage = false;
    noteTime = 0; noteIndex = 0; bandMessage = false; eventIndex = 0; active = false;
    hideGhost(); world.setLockerInspection?.(null, false);
    return result(1);
  }
  function cancel() { return reset(); }

  function inView(point) {
    const dx = point.x - player.x, dz = point.z - player.z, length = Math.hypot(dx, dz);
    if (length < 0.01) return true;
    const yaw = Number.isFinite(player.yaw) ? player.yaw : camera?.rotation?.y || 0;
    return ((-Math.sin(yaw) * dx - Math.cos(yaw) * dz) / length) > 0.79;
  }
  function chooseSpot(day) {
    const acceptable = spots.filter(point => {
      const d = Math.hypot(point.x - player.x, point.z - player.z);
      return d > 8.3 && d < 24 && lineOfSight(player, point) && inView(point);
    });
    if (!acceptable.length) return null;
    return acceptable[((day * 3 + eventIndex) % acceptable.length + acceptable.length) % acceptable.length];
  }

  function update(dt, { phase, day = 0, elapsed = 0, lightOn = false, moving = false, hidden = false, reduced = false } = {}) {
    // Captures, exams, dawn, and cutscenes must not inherit an apparition/flicker.
    if (phase !== 'night') {
      if (active || phaseKey) reset();
      return result(1);
    }
    const key = `night:${day}`;
    if (phaseKey !== key) {
      reset(); phaseKey = key; active = true;
      nextApparition = 9 + (Math.abs(day) % 3) * 1.5;
      noteTime = 3.5;
    }
    dt = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, 0.25));
    clock += dt;
    if (dt === 0) return result(1);
    flicker = Math.max(0, flicker - dt);

    // These sounds are produced only while the player is actually walking.
    if (moving && !hidden) {
      stepTime -= dt;
      if (stepTime <= 0 && clock > 4) {
        stepTime = 0.68 + ((day + stepCount) % 3) * 0.065;
        stepCount++;
        onSound('phantom-step', { volume: reduced ? 0.035 : 0.06, duration: 0.075, distance: 3.5, behind: true });
      }
    } else {
      stepTime = 0.28;
      if (movingBefore && stepCount >= 3 && !stoppedMessage && !hidden) {
        stoppedMessage = true;
        onMessage('You stop walking. The second pair of footsteps stops with you.');
      }
    }
    movingBefore = !!moving && !hidden;

    // An empty music room still plays a sparse, imperfect phrase.
    const bandDistance = Math.hypot(player.x - ROOMS.band.door.x, player.z - ROOMS.band.door.z);
    const bandTeacher = world.teachers?.band;
    const emptyBand = !bandTeacher?.visible || Math.hypot(bandTeacher.position.x - ROOMS.band.center.x, bandTeacher.position.z - ROOMS.band.center.z) > 5.5;
    if (bandDistance < 13.5 && emptyBand) {
      noteTime -= dt;
      if (noteTime <= 0) {
        const frequency = melody[(noteIndex + Math.abs(day)) % melody.length];
        onSound('band-echo', { frequency, duration: 0.82, volume: Math.max(0.012, 0.04 * (1 - bandDistance / 18)), room: 'band' });
        noteIndex++; noteTime = noteIndex % melody.length ? 1.45 : 6.2;
        if (!bandMessage) { bandMessage = true; onMessage('A few wrong notes drift out of the empty band room.'); }
      }
    }

    if (ghost?.visible) {
      ghostTime += dt;
      const viewing = inView(ghost.position) && lineOfSight(player, ghost.position);
      if (viewing) ghostSeen = true;
      if (!viewing && ghostSeen || hidden) {
        hideGhost(); nextApparition = clock + 17;
      } else if (ghostTime > 1.5 && lightOn) {
        // One brief dimming, then the same figure is gone when the light returns.
        flicker = reduced ? 0.07 : 0.16;
        onSound('light-click', { volume: 0.04, duration: 0.045 });
        hideGhost(); nextApparition = clock + 18;
      } else if (ghostTime > 4.2) {
        hideGhost(); nextApparition = clock + 17;
      }
    } else if (clock >= nextApparition && !hidden) {
      const point = chooseSpot(day);
      eventIndex++;
      nextApparition = clock + (point ? 19 : 3);
      if (point && ghost) {
        ghost.position.set(point.x, 0, point.z);
        // Teacher geometry faces local +z. Its head is already held unnaturally.
        ghost.rotation.y = Math.atan2(player.x - point.x, player.z - point.z);
        ghost.userData.head.rotation.y = 0.15;
        ghost.userData.head.rotation.z = 0.16;
        ghost.visible = true; ghostTime = 0; ghostSeen = true;
        onMessage('Someone is standing at the far end of the hall.');
      }
    }
    // No rapid repeating flashes or full whiteout; the capture system owns those.
    const multiplier = flicker > 0 && lightOn ? (reduced ? 0.64 : 0.18) : 1;
    return result(multiplier);
  }
  return { update, reset, cancel };
}

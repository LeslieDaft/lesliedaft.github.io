import * as THREE from './vendor/three.module.js';
import { MAP, WIDTH, HEIGHT, ROOMS, cellKey, findPath, gridToWorld, isWalkable, lineOfSight, worldToGrid } from './engine.js';

export const RESCUE_DURATION = 9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const turn = (from, to, alpha) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * alpha;
const modelFor = (world, id) => id === 'guardian' ? world.guardian : id === 'principal' ? world.principal : world.teachers[id];

/** Circle-vs-furniture collision, shared by actor travel and the pulled-back camera. */
export function rescueCanOccupy(world, point, radius = 0.3, blocked) {
  if (!isWalkable(point.x, point.z, radius, blocked)) return false;
  return !(world.colliders || []).some(c => {
    const nearX = clamp(point.x, c.minX, c.maxX), nearZ = clamp(point.z, c.minZ, c.maxZ);
    return (nearX - point.x) ** 2 + (nearZ - point.z) ** 2 < radius ** 2;
  });
}

function segmentClear(world, from, to, blocked, radius = 0.3) {
  if (!lineOfSight(from, to, blocked)) return false;
  const count = Math.max(1, Math.ceil(distance(from, to) / 0.09));
  for (let i = 0; i <= count; i++) {
    const p = { x: from.x + (to.x - from.x) * i / count, z: from.z + (to.z - from.z) * i / count };
    if (!rescueCanOccupy(world, p, radius, blocked)) return false;
  }
  return true;
}

function navigationBlocks(world) {
  const blocked = new Set();
  for (let z = 0; z < HEIGHT; z++) for (let x = 0; x < WIDTH; x++) {
    if (MAP[z][x] === '.' && !rescueCanOccupy(world, gridToWorld(x, z))) blocked.add(cellKey(x, z));
  }
  if (world.detentionDoor?.visible) blocked.add(cellKey(ROOMS.detention.doorCell.x, ROOMS.detention.doorCell.z));
  return blocked;
}

/** Grid routes are checked against actual furniture, including the final off-grid step. */
export function rescueRoute(world, start, end, sourceBlocked) {
  const blocked = new Set(sourceBlocked || navigationBlocks(world));
  const first = worldToGrid(start), last = worldToGrid(end);
  blocked.delete(cellKey(first.x, first.z)); blocked.delete(cellKey(last.x, last.z));
  if (!rescueCanOccupy(world, start, 0.3, blocked) || !rescueCanOccupy(world, end, 0.3, blocked)) return [];
  if (segmentClear(world, start, end, blocked)) return [{ ...start }, { ...end }];
  for (let attempt = 0; attempt < 8; attempt++) {
    const path = findPath(start, end, blocked);
    if (!path.length) return [];
    const points = [{ ...start }, ...path];
    // A cell-center detour may be unnecessary when the exact actor position already sees the next waypoint.
    if (points.length > 2 && segmentClear(world, points[0], points[2], blocked)) points.splice(1, 1);
    let failure = null;
    for (let i = 1; i < points.length && !failure; i++) {
      const a = points[i - 1], b = points[i], samples = Math.max(1, Math.ceil(distance(a, b) / 0.09));
      for (let sample = 0; sample <= samples; sample++) {
        const p = { x: a.x + (b.x - a.x) * sample / samples, z: a.z + (b.z - a.z) * sample / samples };
        if (!rescueCanOccupy(world, p, 0.3, blocked)) { failure = worldToGrid(p); break; }
      }
    }
    if (!failure) return points;
    const key = cellKey(failure.x, failure.z);
    if (key === cellKey(first.x, first.z) || key === cellKey(last.x, last.z) || blocked.has(key)) return [];
    blocked.add(key);
  }
  return [];
}

function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

function pointOnRoute(points, progress) {
  let remaining = pathLength(points) * clamp(progress, 0, 1);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = distance(a, b);
    if (remaining <= length || i === points.length - 1) {
      const amount = length ? clamp(remaining / length, 0, 1) : 1;
      return { x: a.x + (b.x - a.x) * amount, z: a.z + (b.z - a.z) * amount,
        yaw: Math.atan2(b.x - a.x, b.z - a.z) };
    }
    remaining -= length;
  }
  return { ...points[0], yaw: 0 };
}

function savePose(model) {
  const limbs = model.userData.limbs;
  const parts = [...(limbs?.arms || []), ...(limbs?.legs || []), ...(limbs?.lowerArms || []), ...(limbs?.lowerLegs || []), model.userData.head].filter(Boolean);
  return { model, position: model.position.clone(), rotation: model.rotation.clone(), visible: model.visible,
    parts: parts.map(part => ({ part, rotation: part.rotation.clone() })) };
}

function restorePose(saved) {
  saved.model.position.copy(saved.position); saved.model.rotation.copy(saved.rotation); saved.model.visible = saved.visible;
  for (const { part, rotation } of saved.parts) part.rotation.copy(rotation);
}

/** A quiet nine-second, in-world intervention. The player keeps their original location.
 * Call update AFTER first-person camera positioning; normal movement/enemy AI must be paused.
 * start returns false if the actors cannot reach valid conversation positions.
 * finish restores every actor before invoking onComplete once; cancel never invokes it.
 */
export function createRescueScene({ world, player, camera, enemies = [], onComplete, onLine }) {
  let active = false, elapsed = 0, lineIndex = -1, actors = [], savedPlayer = null, cameraFrom = null, cameraTo = null;
  let avatarPose = null, lines = [];
  const lookTarget = new THREE.Vector3();

  function choosePlace(origin, from, preferAngle, blocked, excluded = null) {
    let best = null, bestScore = Infinity;
    for (const radius of [1.6, 2.1, 2.6]) for (let step = 0; step < 16; step++) {
      const angle = preferAngle + step * Math.PI / 8;
      const point = { x: origin.x + Math.sin(angle) * radius, z: origin.z + Math.cos(angle) * radius };
      if (!rescueCanOccupy(world, point, 0.3, blocked) || !lineOfSight(origin, point, blocked) || excluded && distance(point, excluded) < 1.05) continue;
      const route = rescueRoute(world, from, point, blocked);
      if (!route.length) continue;
      const length = pathLength(route), score = length + radius * 0.2 + step * 0.025;
      if (score < bestScore) { bestScore = score; best = { point, route, length }; }
    }
    return best;
  }

  function chooseCamera(origin, conversation, blocked) {
    const behind = player.yaw || 0;
    let best = null, bestScore = -Infinity;
    for (const radius of [4.0, 3.1, 2.3, 1.65]) for (let step = 0; step < 12; step++) {
      const angle = behind + Math.PI / 8 + step * Math.PI / 6;
      const point = { x: origin.x + Math.sin(angle) * radius, z: origin.z + Math.cos(angle) * radius };
      if (!rescueCanOccupy(world, point, 0.15, blocked) || !segmentClear(world, origin, point, blocked, 0.12)) continue;
      if (!lineOfSight(point, conversation, blocked)) continue;
      // At eye height, tall cabinets also block a shot even though they aren't map walls.
      const cabinet = (world.sightBlockers || []).some(c => {
        if (c.height < 1.65) return false;
        const samples = Math.max(1, Math.ceil(distance(point, conversation) / 0.12));
        for (let i = 0; i <= samples; i++) {
          const x = point.x + (conversation.x - point.x) * i / samples, z = point.z + (conversation.z - point.z) * i / samples;
          if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
        }
        return false;
      });
      if (cabinet) continue;
      const score = radius - step * 0.018;
      if (score > bestScore) { bestScore = score; best = point; }
    }
    return new THREE.Vector3(best?.x ?? origin.x, best ? 2.2 : player.height, best?.z ?? origin.z);
  }

  function animateActor(actor, dt, speaking) {
    const model = actor.model, limbs = model.userData.limbs, head = model.userData.head;
    const progress = smooth((elapsed - actor.delay) / actor.travel), walking = progress > 0 && progress < 1;
    const p = pointOnRoute(actor.route, progress);
    model.position.x = p.x; model.position.z = p.z;
    if (actor.id === 'guardian') model.position.y = 1.6 + Math.sin(elapsed * 2) * 0.045;
    const other = actor.savior ? actors[0] : actors[1];
    const facing = walking ? p.yaw : Math.atan2(other.model.position.x - p.x, other.model.position.z - p.z);
    model.rotation.y = turn(model.rotation.y, facing, 1 - Math.exp(-dt * 8));
    if (limbs) {
      const stride = walking ? Math.sin(elapsed * 8.0) * 0.28 : 0;
      for (let i = 0; i < 2; i++) {
        const side = i ? -1 : 1;
        limbs.legs[i].rotation.x = stride * side;
        limbs.lowerLegs[i].rotation.x = Math.max(0, -stride * side) * 0.4;
        limbs.arms[i].rotation.x = -stride * side * 0.72;
        limbs.arms[i].rotation.z = !walking && speaking ? side * 0.14 : 0;
        limbs.lowerArms[i].rotation.x = !walking && speaking ? -0.48 + Math.sin(elapsed * 2.3) * 0.06 : 0;
      }
    }
    if (head) {
      head.rotation.x = speaking ? Math.sin(elapsed * 3.2) * 0.033 : 0;
      head.rotation.y = 0;
      head.rotation.z = actor.savior ? -0.015 : 0.025;
    }
  }

  function cleanUp() {
    active = false;
    for (const actor of actors) restorePose(actor.pose);
    if (avatarPose) restorePose(avatarPose);
    if (world.playerAvatar) world.playerAvatar.visible = false;
    if (savedPlayer) Object.assign(player, savedPlayer, { moving: false, sprinting: false });
    camera.position.set(player.x, player.height, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  }

  function finish() {
    if (!active) return;
    cleanUp(); onComplete?.();
  }

  return {
    start({ captorId, saviorId }) {
      if (active) cleanUp();
      const captor = enemies.find(e => e.id === captorId), savior = enemies.find(e => e.id === saviorId);
      const captorModel = captor?.model || modelFor(world, captorId), saviorModel = savior?.model || modelFor(world, saviorId);
      if (!captorModel || !saviorModel || captorId === saviorId || !world.playerAvatar) return false;
      const origin = { x: player.x, z: player.z }, blocked = navigationBlocks(world);
      const centerCell = worldToGrid(origin); blocked.delete(cellKey(centerCell.x, centerCell.z));
      const captorStart = { x: captor?.x ?? captorModel.position.x, z: captor?.z ?? captorModel.position.z };
      const saviorStart = { x: savior?.x ?? saviorModel.position.x, z: savior?.z ?? saviorModel.position.z };
      const captorPlace = choosePlace(origin, captorStart, Math.atan2(captorStart.x - origin.x, captorStart.z - origin.z), blocked);
      if (!captorPlace) return false;
      const saviorPlace = choosePlace(origin, saviorStart, Math.atan2(saviorStart.x - origin.x, saviorStart.z - origin.z), blocked, captorPlace.point);
      if (!saviorPlace || saviorPlace.length > 16 || captorPlace.length > 18) return false;
      savedPlayer = { x: player.x, z: player.z, yaw: player.yaw, pitch: player.pitch, height: player.height, hidden: player.hidden,
        moving: false, sprinting: false, crouching: player.crouching };
      cameraFrom = camera.position.clone();
      cameraTo = chooseCamera(origin, { x: (captorPlace.point.x + saviorPlace.point.x) / 2, z: (captorPlace.point.z + saviorPlace.point.z) / 2 }, blocked);
      avatarPose = savePose(world.playerAvatar);
      actors = [
        { id: captorId, model: captorModel, pose: savePose(captorModel), route: captorPlace.route, delay: 0.15, travel: 2.6, savior: false },
        { id: saviorId, model: saviorModel, pose: savePose(saviorModel), route: saviorPlace.route, delay: 0.25, travel: 3.5, savior: true }
      ];
      for (const actor of actors) actor.model.visible = true;
      const name = savior?.name || saviorModel.name || (saviorId === 'band' ? 'Mr. Reed' : 'Ms. Vale');
      const captorName = captor?.name || captorModel.name || 'GoGuardian';
      lines = [
        { at: 0, speaker: saviorId, text: `${name}: Wait. This student earned an A in my class.` },
        { at: 3.9, speaker: saviorId, text: `${name}: I'll handle this. You can let them go.` },
        { at: 5.9, speaker: captorId, text: captorId === 'guardian' ? 'GoGuardian: Grade verified. Student released.' : `${captorName}: Fine. Don't let me catch you again.` },
        { at: 7.7, speaker: saviorId, text: `${name}: Stay quiet. Off you go.` }
      ];
      world.playerAvatar.position.set(origin.x, 0, origin.z);
      world.playerAvatar.rotation.set(0, Math.atan2(captorPlace.point.x - origin.x, captorPlace.point.z - origin.z), 0);
      player.hidden = null; player.moving = false; player.sprinting = false;
      elapsed = 0; lineIndex = -1; active = true;
      this.update(0);
      return true;
    },
    update(dt) {
      if (!active) return;
      dt = Math.max(0, Number.isFinite(dt) ? dt : 0); elapsed = Math.min(RESCUE_DURATION, elapsed + dt);
      let nextLine = 0;
      for (let i = 1; i < lines.length; i++) if (elapsed >= lines[i].at) nextLine = i;
      if (nextLine !== lineIndex) { lineIndex = nextLine; onLine?.(lines[lineIndex].text); }
      for (const actor of actors) animateActor(actor, dt, lines[lineIndex].speaker === actor.id);
      // The camera first eases out of the student's eyes, then holds an unobstructed school-space shot.
      camera.position.copy(cameraFrom).lerp(cameraTo, smooth(elapsed / 1.35));
      const pullback = smooth(elapsed / 1.35);
      const conversationX = (actors[0].model.position.x + actors[1].model.position.x + player.x * 2) / 4;
      const conversationZ = (actors[0].model.position.z + actors[1].model.position.z + player.z * 2) / 4;
      lookTarget.set(player.x + (conversationX - player.x) * pullback, 1.35, player.z + (conversationZ - player.z) * pullback);
      camera.lookAt(lookTarget);
      world.playerAvatar.visible = elapsed > 0.4;
      if (elapsed >= RESCUE_DURATION) finish();
    },
    finish,
    cancel() { if (active) cleanUp(); },
    get active() { return active; },
    get elapsed() { return elapsed; },
    get endPosition() { return savedPlayer ? { x: savedPlayer.x, z: savedPlayer.z, yaw: savedPlayer.yaw, pitch: savedPlayer.pitch } : null; }
  };
}

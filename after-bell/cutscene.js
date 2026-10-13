import * as THREE from './vendor/three.module.js';
import { findPath, gridToWorld } from './engine.js';

export const DARE_DURATION = 21.5;
const DIALOGUE = Object.freeze([
  { at: 0, speaker: 'YOU', text: "GoGuardian logged me here at midnight. I was home.", beat: 'MONDAY · LEAVING HOMEROOM' },
  { at: 3.0, speaker: 'JAMIE', text: "Alex, that's the third name it's marked after closing.", beat: 'The attendance log is wrong.' },
  { at: 5.8, speaker: 'YOU', text: "I'm staying tonight. Something's watching the empty classrooms.", beat: 'A suspicion' },
  { at: 8.7, speaker: 'JAMIE', text: "Get evidence. I'll keep a backup outside the school.", beat: 'Jamie is your ally.' },
  { at: 11.6, speaker: 'YOU', text: "I'll check a new room each night. Monday to Monday.", beat: 'Seven pieces of evidence.' },
  { at: 14.2, speaker: 'JAMIE', text: "Earn A's. Some teachers will still help you.", beat: 'Not everyone follows the eye.' },
  { at: 16.6, speaker: 'JAMIE', text: 'Weekends mean no teachers, no detention. Just GoGuardian.', beat: 'No one to save you.' },
  { at: 19.6, speaker: 'YOU', text: "Let's find out what it's hiding.", beat: 'INVESTIGATE · COLLECT · SURVIVE' }
]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const angleToward = (from, to, alpha) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * alpha;

/** Walk real school paths; the doorway never gets bypassed by a camera teleport. */
function route(start, end) {
  const points = findPath(start, end);
  if (!points.length) throw new Error('The homeroom cinematic path is blocked.');
  const segments = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.z - points[i].z));
  const total = segments.reduce((sum, length) => sum + length, 0);
  return progress => {
    let distance = clamp(progress, 0, 1) * total;
    for (let i = 0; i < segments.length; i++) {
      if (distance <= segments[i] || i === segments.length - 1) {
        const f = segments[i] ? clamp(distance / segments[i], 0, 1) : 1;
        return { x: lerp(points[i].x, points[i + 1].x, f), z: lerp(points[i].z, points[i + 1].z, f),
          yaw: Math.atan2(points[i + 1].x - points[i].x, points[i + 1].z - points[i].z) };
      }
      distance -= segments[i];
    }
    return { ...end, yaw: 0 };
  };
}

/** Opening in-world conversation. Call update after the normal camera positioning. */
export function createDareCutscene({ world, player, camera, onComplete }) {
  const overlay = document.getElementById('intro');
  const speakerLabel = document.getElementById('cutsceneSpeaker');
  const subtitle = document.getElementById('cutsceneText');
  const beatLabel = document.getElementById('cutsceneBeat');
  const friend = world.friend;
  const end = gridToWorld(14, 6);
  const playerRoute = route(gridToWorld(8, 5), end);
  const friendRoute = route(gridToWorld(10, 5), gridToWorld(15, 7));
  const target = new THREE.Vector3();
  let active = false, elapsed = 0, lineIndex = -1;

  function showDialogue(index) {
    if (index === lineIndex) return;
    lineIndex = index;
    const line = DIALOGUE[index];
    speakerLabel.textContent = line.speaker;
    subtitle.textContent = line.text;
    beatLabel.textContent = line.beat;
    overlay.dataset.speaker = line.speaker.toLowerCase();
  }
  function animateFriend(dt, moving) {
    const limbs = friend.userData.limbs;
    const stride = moving ? Math.sin(elapsed * 7.5) * 0.34 : 0;
    const damping = 1 - Math.exp(-dt * 14);
    for (let i = 0; i < 2; i++) {
      limbs.legs[i].rotation.x = lerp(limbs.legs[i].rotation.x, (i ? -1 : 1) * stride, damping);
      limbs.lowerLegs[i].rotation.x = lerp(limbs.lowerLegs[i].rotation.x, Math.max(0, (i ? 1 : -1) * stride) * 0.45, damping);
      limbs.arms[i].rotation.x = lerp(limbs.arms[i].rotation.x, (i ? 1 : -1) * stride * 0.75, damping);
      limbs.arms[i].rotation.z = lerp(limbs.arms[i].rotation.z, 0, damping);
      limbs.lowerArms[i].rotation.x = lerp(limbs.lowerArms[i].rotation.x, 0, damping);
    }
    const speaking = DIALOGUE[lineIndex]?.speaker === 'JAMIE';
    // A small hand gesture keeps the whispered hallway exchange human.
    if (!moving && speaking) {
      const gesture = elapsed < 15.9 ? 0.22 : 0.12;
      limbs.arms[1].rotation.z = -gesture;
      limbs.lowerArms[1].rotation.x = -0.30 - Math.sin(elapsed * 2.1) * 0.07;
    }
    const head = friend.userData.head;
    const towardPlayer = Math.atan2(player.x - friend.position.x, player.z - friend.position.z);
    const relativeYaw = Math.atan2(Math.sin(towardPlayer - friend.rotation.y), Math.cos(towardPlayer - friend.rotation.y));
    head.rotation.y = lerp(head.rotation.y, clamp(relativeYaw, -0.6, 0.6), damping);
    head.rotation.x = speaking ? Math.sin(elapsed * 3.2) * 0.026 : 0;
    head.rotation.z = Math.sin(elapsed * 0.7) * 0.014;
  }
  function pose(dt = 0.05) {
    const pProgress = smooth(elapsed / 8.5), fProgress = smooth((elapsed - 0.75) / 8.25);
    const p = playerRoute(pProgress), f = friendRoute(fProgress);
    player.x = p.x; player.z = p.z; player.height = 1.65;
    player.moving = false; player.sprinting = false; player.crouching = false; player.hidden = null;
    friend.position.set(f.x, 0, f.z);
    const walking = fProgress > 0 && fProgress < 1;
    const friendYaw = walking ? f.yaw : Math.atan2(player.x - f.x, player.z - f.z);
    friend.rotation.y = angleToward(friend.rotation.y, friendYaw, 1 - Math.exp(-dt * 9));
    let index = 0;
    for (let i = 1; i < DIALOGUE.length; i++) if (elapsed >= DIALOGUE[i].at) index = i;
    showDialogue(index); animateFriend(dt, walking);

    // Medium view of Jamie for his lines; our replies glance toward the empty hall.
    const theirLine = DIALOGUE[index].speaker === 'JAMIE';
    target.set(friend.position.x, 1.47, friend.position.z);
    if (!theirLine && elapsed > 9) target.set(0, 1.62, friend.position.z + 5.5);
    const dx = target.x - player.x, dz = target.z - player.z;
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(target.y - player.height, Math.hypot(dx, dz));
    const damping = elapsed === 0 ? 1 : 1 - Math.exp(-dt * 4.5);
    player.yaw = angleToward(player.yaw, yaw, damping); player.pitch = lerp(player.pitch, pitch, damping);
    const bob = pProgress < 1 ? Math.sin(elapsed * 7.5) * 0.012 : 0;
    camera.position.set(player.x, player.height + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  }
  function hide() {
    active = false; overlay.hidden = true; friend.visible = false; player.moving = false;
  }
  return {
    start() {
      elapsed = 0; lineIndex = -1; active = true; overlay.hidden = false;
      world.setMood(true, 0); world.guardian.visible = false;
      for (const student of world.students) student.visible = true;
      for (const teacher of Object.values(world.teachers)) teacher.visible = true;
      friend.visible = true; friend.rotation.set(0, -Math.PI / 2, 0);
      pose();
    },
    update(dt) {
      if (!active) return;
      elapsed = Math.min(DARE_DURATION, elapsed + Math.max(0, dt));
      pose(Math.max(0, dt));
      if (elapsed >= DARE_DURATION) this.finish();
    },
    finish() {
      if (!active) return;
      player.x = end.x; player.z = end.z; player.yaw = 0; player.pitch = 0;
      hide(); onComplete?.();
    },
    cancel() { hide(); },
    get active() { return active; },
    get elapsed() { return elapsed; },
    get endPosition() { return { ...end, yaw: 0, pitch: 0 }; }
  };
}

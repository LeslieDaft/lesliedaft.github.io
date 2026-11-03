const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = value => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export const GET_UP_DURATION = 1.72;

// A low hip and a deep chest hinge keep the planted palm within the actual
// .54 m arm reach. The hand leaves the ground before the shoulders rise.
const POSES = [
  { time: 0, height: .30, lean: 1.36, twist: .18, shift: .065, lead: .27, trail: -.31, lift: 0, handY: .11, handZ: .46, width: .29 },
  { time: .25, height: .34, lean: 1.32, twist: .12, shift: .045, lead: .29, trail: -.31, lift: 0, handY: .13, handZ: .46, width: .29 },
  { time: .65, height: .48, lean: .92, twist: .06, shift: .015, lead: .33, trail: -.27, lift: 0, handY: .51, handZ: .43, width: .30 },
  { time: 1.02, height: .63, lean: .46, twist: -.025, shift: 0, lead: .26, trail: -.18, lift: .12, handY: .78, handZ: .31, width: .32 },
  { time: 1.37, height: .80, lean: .12, twist: -.035, shift: -.015, lead: .10, trail: -.035, lift: .025, handY: .96, handZ: .16, width: .31 },
  { time: GET_UP_DURATION, height: .82, lean: .055, twist: 0, shift: 0, lead: .035, trail: -.035, lift: 0, handY: .99, handZ: .08, width: .30 }
];

/**
 * Continuous world-space IK targets for a tackled player's recovery.
 * The caller can blend its fallen snapshot into the low first pose, then use
 * the returned descriptor with the same actor poser as special teams.
 * `side` chooses the planted lead leg; a carrier keeps the right arm tucked
 * around the football while the free left palm pushes off the turf.
 */
export function sampleGetUp(age, { x = 0, z = 0, yaw = 0, side = 1, ballCarrier = false, delay = 0 } = {}) {
  const direction = side < 0 ? -1 : 1;
  const rawElapsed = Number.isFinite(age) ? age - Math.max(0, delay) : 0;
  const elapsed = rawElapsed >= GET_UP_DURATION - 1e-10 ? GET_UP_DURATION : clamp(rawElapsed, 0, GET_UP_DURATION);
  let lower = POSES[0], upper = POSES[1];
  for (let i = 1; i < POSES.length; i++) {
    upper = POSES[i];
    lower = POSES[i - 1];
    if (elapsed <= upper.time) break;
  }
  const t = smooth((elapsed - lower.time) / (upper.time - lower.time));
  const value = key => lerp(lower[key], upper[key], t);
  const cosine = Math.cos(yaw), sine = Math.sin(yaw);
  const world = (localX, y, localZ) => ({ x: x + localX * cosine + localZ * sine, y, z: z - localX * sine + localZ * cosine });
  const shift = value('shift') * direction;
  const height = value('height');
  const root = world(shift, 0, 0);
  const leadIndex = direction < 0 ? 0 : 1;
  const feet = [0, 1].map(index => world(index === 0 ? -.18 : .18, .10 + (index === leadIndex ? 0 : value('lift')), index === leadIndex ? value('lead') : value('trail')));
  const handY = value('handY'), handZ = value('handZ'), width = value('width');
  const hands = [world(shift - width, handY, handZ), world(shift + width, handY, handZ)];
  // The ball stays under the right forearm through the push and the rise.
  const tuck = world(shift - .18, height + .36, lerp(.32, .24, smooth(elapsed / GET_UP_DURATION)));
  if (ballCarrier) hands[0] = tuck;
  const phase = elapsed < .25 ? 'roll' : elapsed < .65 ? 'plant' : elapsed < 1.02 ? 'half-kneel' : elapsed < 1.37 ? 'rise' : elapsed < GET_UP_DURATION ? 'stand' : 'ready';
  return {
    visible: true,
    x: root.x,
    z: root.z,
    yaw,
    pelvisHeight: height,
    pelvisLean: 0,
    lean: value('lean'),
    torsoTwist: -value('twist') * direction,
    headLean: -.30 * value('lean'),
    feet,
    hands,
    ballHoldPoint: ballCarrier ? { x: tuck.x, y: tuck.y + .035, z: tuck.z + .075 } : null,
    ballCarrier,
    kneel: 1 - smooth((elapsed - .45) / .77),
    stride: 0,
    kick: 0,
    phase,
    progress: elapsed / GET_UP_DURATION,
    done: elapsed >= GET_UP_DURATION
  };
}

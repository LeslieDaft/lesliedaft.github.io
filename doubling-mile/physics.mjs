export function speedAt(mode, setting, seconds) {
  switch (mode) {
    case 'constant': return setting;
    case 'accel': return 2 + setting * seconds;
    case 'exp': return 2 ** (1 + seconds / setting);
    case 'super': return 2 ** (2 ** (seconds / setting));
    default: throw new RangeError('Unknown speed mode');
  }
}

// First overlapping fraction of a simulation step, using swept bounds
// for both the lane change and the relative longitudinal movement.
export function impactFraction(x, nextX, lane, z, nextZ) {
  let entry = 0;
  let exit = 1;
  for (const [from, to, radius] of [[x - lane, nextX - lane, 0.53], [z, nextZ, 4.6]]) {
    if (from === to) {
      if (Math.abs(from) > radius) return null;
      continue;
    }
    const a = (-radius - from) / (to - from);
    const b = (radius - from) / (to - from);
    entry = Math.max(entry, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
  }
  return entry <= exit ? entry : null;
}

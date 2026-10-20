// Pure skateboard movement: metres, seconds, Y up, heading zero faces -Z.
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const groundAt = (world, x, z) => {
  const y = world.heightAt ? world.heightAt(x, z) : 0;
  return Number.isFinite(y) ? y : 0;
};
export function createSkater(x = 0, z = 0) {
  return { x, z, y: 0, vx: 0, vz: 0, vy: 0, heading: 0,
    grounded: true, airTime: 0, spin: 0, flip: 0, manual: false,
    grind: null, bail: 0, speed: 0, grindDistance: 0, lastLanding: null,
    _flipActive: false, _flipComplete: false, _railCooldown: 0, _lastGround: 0,
    _lastSafeX: x, _lastSafeZ: z };
}
function closestRail(s, rails) {
  let best = null;
  for (let i = 0; i < rails.length; i++) {
    const rail = rails[i], dx = rail.bx - rail.ax, dz = rail.bz - rail.az;
    const length = Math.hypot(dx, dz);
    if (length < .01) continue;
    const t = clamp(((s.x - rail.ax) * dx + (s.z - rail.az) * dz) / (length * length), 0, 1);
    const px = rail.ax + dx * t, pz = rail.az + dz * t;
    const d = Math.hypot(s.x - px, s.z - pz);
    if (d > .95 || Math.abs(s.y - rail.y) > .9) continue;
    if (!best || d < best.distance) best = { rail, index: i, t, dx: dx / length, dz: dz / length, length, distance: d };
  }
  return best;
}
function leaveGrind(s, events, jump) {
  if (!s.grind) return;
  s.grind = null;
  s.grounded = false;
  s.vy = jump ? 6.6 : 1.3;
  s.airTime = 0;
  s._railCooldown = .42;
  s.spin = 0;
  s.flip = 0;
  s._flipActive = false;
  s._flipComplete = false;
  events.push('grind-end');
  if (jump) events.push('ollie');
}
export function stepSkater(s, input = {}, dt = 1 / 60, world = {}) {
  const events = [];
  if (!Number.isFinite(dt) || dt <= 0) return events;
  dt = Math.min(dt, .05);
  const rails = world.rails || [], obstacles = world.obstacles || [];
  s._railCooldown = Math.max(0, (s._railCooldown || 0) - dt);
  if (s.bail > 0) {
    s.bail = Math.max(0, s.bail - dt);
    s.vx *= Math.exp(-5 * dt); s.vz *= Math.exp(-5 * dt);
    s.speed = Math.hypot(s.vx, s.vz);
    s.y = groundAt(world, s.x, s.z);
    s.grounded = true; s.vy = 0; s.manual = false;
    return events;
  }
  if (s.grind) {
    if (input.jumpPressed || !input.grind) leaveGrind(s, events, !!input.jumpPressed);
    else {
      const g = s.grind;
      // Grinding keeps momentum too; only the brake deliberately scrubs speed.
      const speed = Math.hypot(s.vx, s.vz) * Math.exp(-(input.brake ? 3.8 : .002) * dt);
      g.t += speed * dt * g.direction / g.length;
      if (g.t < 0 || g.t > 1) {
        g.t = clamp(g.t, 0, 1);
        s.x = g.rail.ax + (g.rail.bx - g.rail.ax) * g.t;
        s.z = g.rail.az + (g.rail.bz - g.rail.az) * g.t;
        leaveGrind(s, events, false);
      } else {
        s.x = g.rail.ax + (g.rail.bx - g.rail.ax) * g.t;
        s.z = g.rail.az + (g.rail.bz - g.rail.az) * g.t;
        s.y = g.rail.y;
        s.vx = g.dx * g.direction * speed; s.vz = g.dz * g.direction * speed;
        s.heading = Math.atan2(s.vx, -s.vz);
        s.vy = 0; s.speed = speed; s.manual = false;
        s.grindDistance += speed * dt;
        return events;
      }
    }
  }
  let speed = Math.hypot(s.vx, s.vz);
  const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const oldHeading = s.heading;
  // Carves become broader at speed and deliberately slow down sharply on the brake.
  s.heading -= turn * (s.grounded ? 1.95 / (1 + speed * .028) : .58) * dt;
  const fx = Math.sin(s.heading), fz = -Math.cos(s.heading);
  const oldX = s.x, oldZ = s.z;
  if (s.grounded) {
    // Trucks steer the existing momentum rather than repeatedly projecting it away.
    // Rotating the velocity with the carve preserves speed around a flat corner.
    const turnDelta = s.heading - oldHeading;
    const carveCos = Math.cos(turnDelta), carveSin = Math.sin(turnDelta);
    const previousVx = s.vx;
    s.vx = previousVx * carveCos - s.vz * carveSin;
    s.vz = previousVx * carveSin + s.vz * carveCos;
    const forward = s.vx * fx + s.vz * fz;
    const lateralX = s.vx - fx * forward, lateralZ = s.vz - fz * forward;
    const grip = Math.exp(-(input.brake ? 4 : 10) * dt);
    s.vx = fx * forward + lateralX * grip;
    s.vz = fz * forward + lateralZ * grip;
    const grippedSpeed = Math.hypot(s.vx, s.vz);
    if (grippedSpeed > 1e-9 && speed > 0) {
      s.vx *= speed / grippedSpeed; s.vz *= speed / grippedSpeed;
    }
    if (input.push) {
      const acceleration = Math.max(1.2, 7.5 * (1 - speed / 24));
      s.vx += fx * acceleration * dt; s.vz += fz * acceleration * dt;
    }
    // Very light rolling resistance: about 2% momentum loss over ten seconds.
    const drag = Math.exp(-(input.brake ? 3.8 : .002) * dt);
    s.vx *= drag; s.vz *= drag;
    // Gravity along a local grade gives real downhill speed without artificial acceleration.
    const ahead = groundAt(world, s.x + fx * .65, s.z + fz * .65);
    const behind = groundAt(world, s.x - fx * .65, s.z - fz * .65);
    const slope = (ahead - behind) / 1.3;
    s.vx -= fx * clamp(slope * 10.5, -8, 8) * dt;
    s.vz -= fz * clamp(slope * 10.5, -8, 8) * dt;
    s.manual = !!input.manual && speed > 1.5;
    if (input.jumpPressed) {
      s.grounded = false; s.vy = 6.7 + Math.min(1.1, speed * .035);
      s.airTime = 0; s.spin = 0; s.flip = 0;
      s._flipActive = false; s._flipComplete = false; s.grindDistance = 0;
      s.manual = false; events.push('ollie');
    }
  } else {
    // Gentle air steering: enough to aim for a rail, without midair vehicle steering.
    const delta = s.heading - oldHeading;
    const c = Math.cos(delta * .28), sin = Math.sin(delta * .28);
    const vx = s.vx;
    s.vx = vx * c - s.vz * sin; s.vz = vx * sin + s.vz * c;
    s.airTime += dt;
    const spinDirection = (input.spinLeft ? 1 : 0) - (input.spinRight ? 1 : 0);
    s.spin += spinDirection * 5.8 * dt;
    if (input.flipPressed && !s._flipActive && !s._flipComplete) {
      s._flipActive = true; s.flip = 0;
    }
    if (s._flipActive) {
      s.flip = Math.min(TAU, s.flip + dt * 11.7);
      if (s.flip >= TAU) { s._flipActive = false; s._flipComplete = true; }
    }
    s.vy -= 18.5 * dt;
  }
  speed = Math.hypot(s.vx, s.vz);
  if (speed > 32) { s.vx *= 32 / speed; s.vz *= 32 / speed; speed = 32; }
  s.x += s.vx * dt; s.z += s.vz * dt;
  if (!s.grounded) s.y += s.vy * dt;
  const floor = groundAt(world, s.x, s.z);
  if (s.grounded) {
    const drop = s.y - floor;
    const previousFloor = groundAt(world, oldX, oldZ);
    if (drop > .48 && speed > 3) {
      s.grounded = false; s.vy = Math.min(4, (s.y - s._lastGround) / dt);
      s.airTime = 0; s.spin = 0; s.flip = 0;
      s._flipActive = false; s._flipComplete = false;
      events.push('ollie');
    } else if (floor - previousFloor > .7) {
      s.x = oldX; s.z = oldZ; s.vx *= -.15; s.vz *= -.15;
    } else {
      s._lastGround = s.y; s.y = floor; s.vy = 0;
    }
  } else if (s.y <= floor && s.vy <= 0) {
    s.y = floor; s.vy = 0; s.grounded = true;
    const spinTurns = Math.round(s.spin / Math.PI);
    const spinError = Math.abs(s.spin - spinTurns * Math.PI);
    const clean = (!s._flipActive || s.flip < .15 || s.flip > TAU - .35) && spinError < 1.15;
    s.lastLanding = { clean, kickflip: !!s._flipComplete, spinDegrees: Math.abs(spinTurns) * 180,
      airTime: s.airTime, grindDistance: s.grindDistance };
    events.push('land');
    if (!clean) { s.bail = 1.05; s.vx *= .22; s.vz *= .22; events.push('bail'); }
    else {
      if (s._flipComplete) events.push('kickflip');
      if (Math.abs(spinTurns)) events.push('spin');
    }
    s.spin = 0; s.flip = 0; s._flipActive = false;
  }
  // Holding grind while airborne catches actual rail geometry, never imaginary lines.
  if (!s.grounded && !s.grind && input.grind && !s._railCooldown && speed >= 2.3) {
    const g = closestRail(s, rails);
    if (g) {
      g.direction = s.vx * g.dx + s.vz * g.dz >= 0 ? 1 : -1;
      s.grind = g; s.y = g.rail.y; s.vy = 0; s.spin = 0; s.flip = 0;
      s._flipActive = false; s._flipComplete = false;
      s.vx = g.dx * g.direction * speed; s.vz = g.dz * g.direction * speed;
      s.heading = Math.atan2(s.vx, -s.vz); s.grindDistance = 0;
      events.push('grind-start');
    }
  }
  for (const o of obstacles) {
    const hw = o.w / 2 + .28, hd = o.d / 2 + .28;
    if (Math.abs(s.x - o.x) >= hw || Math.abs(s.z - o.z) >= hd) continue;
    const base = o.y || 0, top = base + (o.h || 3);
    if (s.y + 1.5 < base || s.y > top + .08) continue;
    // Resolve outside the blocking footprint, so recovery never leaves a skater trapped.
    const dx = s.x - o.x, dz = s.z - o.z;
    if (hw - Math.abs(dx) < hd - Math.abs(dz)) s.x = o.x + (dx >= 0 ? 1 : -1) * (hw + .06);
    else s.z = o.z + (dz >= 0 ? 1 : -1) * (hd + .06);
    s.y = groundAt(world, s.x, s.z); s.grounded = true; s.grind = null; s.vy = 0;
    s.vx *= -.12; s.vz *= -.12; s.manual = false;
    if (speed > 3.5) { s.bail = 1.05; events.push('bail'); }
    break;
  }
  s.speed = Math.hypot(s.vx, s.vz);
  if (s.grounded && !s.bail) { s._lastSafeX = s.x; s._lastSafeZ = s.z; }
  return events;
}

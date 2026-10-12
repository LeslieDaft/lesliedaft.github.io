/** Pure navigation and campaign rules for After Bell. No browser dependencies. */
export const CELL_SIZE = 1.5;
export const WIDTH = 33;
export const HEIGHT = 25;
export const ORIGIN_X = -WIDTH * CELL_SIZE / 2;
export const ORIGIN_Z = -HEIGHT * CELL_SIZE / 2;

export const DAYS = Object.freeze([
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'
]);
export const PHASES = Object.freeze({
  INTRO: 'intro', DAY: 'day', NIGHT: 'night', CAPTURE: 'capture',
  BLACKOUT: 'blackout', DETENTION: 'detention', DEAD: 'dead', WON: 'won', PAUSED: 'paused'
});
export const dayName = dayIndex => DAYS[((dayIndex % 7) + 7) % 7];
export const isWeekend = dayIndex => dayIndex % 7 === 5 || dayIndex % 7 === 6;
export function nextSchoolDay(dayIndex) { let next=dayIndex+1; while(isWeekend(next))next++; return next; }
export const captureDestination = dayIndex => isWeekend(dayIndex) ? 'dead' : 'detention';
export const cellKey = (x, z) => `${x},${z}`;

export function gridToWorld(x, z) {
  if (typeof x === 'object') ({ x, z } = x);
  return { x: ORIGIN_X + (x + 0.5) * CELL_SIZE, z: ORIGIN_Z + (z + 0.5) * CELL_SIZE };
}

export function worldToGrid(x, z) {
  if (typeof x === 'object') ({ x, z } = x);
  return { x: Math.floor((x - ORIGIN_X) / CELL_SIZE), z: Math.floor((z - ORIGIN_Z) / CELL_SIZE) };
}

const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('#'));
function carve(minX, minZ, maxX, maxZ) {
  for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) grid[z][x] = '.';
}
// A broad central hall and six classrooms. All connector doorways are one cell wide.
carve(14, 6, 18, 23);
const specs = {
  homeroom: { label: 'Homeroom', cells: [2, 2, 11, 7], door: [12, 6] },
  band: { label: 'Band room', cells: [2, 10, 11, 15], door: [12, 13] },
  library: { label: 'Library', cells: [2, 18, 11, 23], door: [12, 21] },
  lab: { label: 'Science lab', cells: [21, 2, 30, 7], door: [20, 6] },
  office: { label: 'Office', cells: [21, 10, 30, 15], door: [20, 13] },
  storage: { label: 'Supply room', cells: [21, 18, 30, 23], door: [20, 21] },
  detention: { label: 'Detention', cells: [13, 1, 19, 4], door: [16, 5] }
};

export const ROOMS = Object.freeze(Object.fromEntries(Object.entries(specs).map(([id, spec]) => {
  const [minX, minZ, maxX, maxZ] = spec.cells;
  carve(minX, minZ, maxX, maxZ);
  const [doorX, doorZ] = spec.door;
  carve(doorX, doorZ, doorX, doorZ);
  if (id !== 'detention') carve(doorX < 14 ? 13 : 19, doorZ, doorX < 14 ? 13 : 19, doorZ);
  return [id, Object.freeze({
    id, label: spec.label,
    cells: Object.freeze({ minX, minZ, maxX, maxZ }),
    bounds: Object.freeze({
      minX: ORIGIN_X + minX * CELL_SIZE, minZ: ORIGIN_Z + minZ * CELL_SIZE,
      maxX: ORIGIN_X + (maxX + 1) * CELL_SIZE, maxZ: ORIGIN_Z + (maxZ + 1) * CELL_SIZE
    }),
    center: Object.freeze(gridToWorld((minX + maxX) / 2, (minZ + maxZ) / 2)),
    door: Object.freeze(gridToWorld(doorX, doorZ)),
    doorCell: Object.freeze({ x: doorX, z: doorZ })
  })];
})));

export const MAP = Object.freeze(grid.map(row => row.join('')));
export const SPAWN = Object.freeze(gridToWorld(16, 22));
export const EXIT = Object.freeze(gridToWorld(16, 23));
export const DETENTION_SPAWN = Object.freeze(gridToWorld(16, 3));
export const PATROL_POINTS = Object.freeze([
  [16, 7], [16, 13], [16, 21], [7, 6], [7, 13], [7, 21], [26, 6], [26, 13], [26, 21]
].map(([x, z]) => Object.freeze(gridToWorld(x, z))));
export const CORRIDOR = Object.freeze({
  cells: Object.freeze({ minX: 14, minZ: 6, maxX: 18, maxZ: 23 }),
  bounds: Object.freeze({ minX: ORIGIN_X + 14 * CELL_SIZE, minZ: ORIGIN_Z + 6 * CELL_SIZE,
    maxX: ORIGIN_X + 19 * CELL_SIZE, maxZ: ORIGIN_Z + 24 * CELL_SIZE })
});

export function roomBounds(room) {
  return (typeof room === 'string' ? ROOMS[room] : room)?.bounds ?? null;
}

/** blocked is an optional Set of cellKey(col,row) strings, used for locked doors. */
export function cellWalkable(x, z, blocked) {
  return Number.isInteger(x) && Number.isInteger(z) && x >= 0 && z >= 0 && x < WIDTH && z < HEIGHT &&
    MAP[z][x] === '.' && !blocked?.has(cellKey(x, z));
}

/** Circle-vs-solid-cell collision. Touching a wall is allowed; penetration is not. */
export function isWalkable(x, z, radius = 0.25, blocked) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(radius) || radius < 0) return false;
  const center = worldToGrid(x, z);
  if (!cellWalkable(center.x, center.z, blocked)) return false;
  if (radius === 0) return true;
  const lo = worldToGrid(x - radius, z - radius);
  const hi = worldToGrid(x + radius, z + radius);
  for (let gz = lo.z; gz <= hi.z; gz++) for (let gx = lo.x; gx <= hi.x; gx++) {
    if (cellWalkable(gx, gz, blocked)) continue;
    const left = ORIGIN_X + gx * CELL_SIZE, top = ORIGIN_Z + gz * CELL_SIZE;
    const nearX = Math.max(left, Math.min(x, left + CELL_SIZE));
    const nearZ = Math.max(top, Math.min(z, top + CELL_SIZE));
    if ((nearX - x) ** 2 + (nearZ - z) ** 2 < radius ** 2 - 1e-10) return false;
  }
  return true;
}

/** Four-neighbor breadth-first path. Returns world waypoints, or [] if unreachable.
 * Includes the starting cell center and finishes at the exact requested destination.
 */
export function findPath(start, end, blocked) {
  if (!start || !end || !isWalkable(start.x, start.z, 0, blocked) || !isWalkable(end.x, end.z, 0, blocked)) return [];
  const from = worldToGrid(start), to = worldToGrid(end);
  const first = from.z * WIDTH + from.x, last = to.z * WIDTH + to.x;
  if (first === last) return [{ x: end.x, z: end.z }];
  const parent = new Int32Array(WIDTH * HEIGHT).fill(-1);
  const queue = new Int32Array(WIDTH * HEIGHT);
  let head = 0, tail = 1;
  queue[0] = first;
  parent[first] = first;
  while (head < tail && parent[last] < 0) {
    const current = queue[head++], gx = current % WIDTH, gz = Math.floor(current / WIDTH);
    for (const [nx, nz] of [[gx + 1, gz], [gx - 1, gz], [gx, gz + 1], [gx, gz - 1]]) {
      if (!cellWalkable(nx, nz, blocked)) continue;
      const next = nz * WIDTH + nx;
      if (parent[next] >= 0) continue;
      parent[next] = current;
      queue[tail++] = next;
    }
  }
  if (parent[last] < 0) return [];
  const path = [];
  for (let id = last; ; id = parent[id]) {
    path.push(gridToWorld(id % WIDTH, Math.floor(id / WIDTH)));
    if (id === first) break;
  }
  path.reverse();
  path[path.length - 1] = { x: end.x, z: end.z };
  return path;
}

/** Supercover grid ray: walls and locked door cells occlude sight, including corners. */
export function lineOfSight(start, end, blocked) {
  if (!start || !end || !isWalkable(start.x, start.z, 0, blocked) || !isWalkable(end.x, end.z, 0, blocked)) return false;
  const from = worldToGrid(start), to = worldToGrid(end);
  let gx = from.x, gz = from.z;
  const dx = end.x - start.x, dz = end.z - start.z;
  const stepX = Math.sign(dx), stepZ = Math.sign(dz);
  const deltaX = dx === 0 ? Infinity : CELL_SIZE / Math.abs(dx);
  const deltaZ = dz === 0 ? Infinity : CELL_SIZE / Math.abs(dz);
  const nextX = ORIGIN_X + (gx + (stepX > 0 ? 1 : 0)) * CELL_SIZE;
  const nextZ = ORIGIN_Z + (gz + (stepZ > 0 ? 1 : 0)) * CELL_SIZE;
  let maxX = dx === 0 ? Infinity : (nextX - start.x) / dx;
  let maxZ = dz === 0 ? Infinity : (nextZ - start.z) / dz;
  for (let count = 0; count < WIDTH + HEIGHT + 2; count++) {
    if (!cellWalkable(gx, gz, blocked)) return false;
    if (gx === to.x && gz === to.z) return true;
    // The endpoint may lie exactly on a cell edge; do not step past the segment.
    if (Math.min(maxX, maxZ) >= 1 - 1e-10) return true;
    if (Math.abs(maxX - maxZ) < 1e-10) {
      // A ray exactly on a tile corner must not see through the touching walls.
      if (!cellWalkable(gx + stepX, gz, blocked) || !cellWalkable(gx, gz + stepZ, blocked)) return false;
      gx += stepX; gz += stepZ; maxX += deltaX; maxZ += deltaZ;
    } else if (maxX < maxZ) {
      gx += stepX; maxX += deltaX;
    } else {
      gz += stepZ; maxZ += deltaZ;
    }
  }
  return false;
}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Works whether the surrounding site's package.json uses CommonJS or ES modules.
const source = await readFile(new URL('./engine.js', import.meta.url), 'utf8');
const engine = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { MAP, WIDTH, HEIGHT, CELL_SIZE, ROOMS, SPAWN, EXIT, gridToWorld, worldToGrid,
  isWalkable, cellWalkable, cellKey, findPath, lineOfSight, DAYS, captureDestination, isWeekend, dayName, nextSchoolDay } = engine;

assert.equal(MAP.length, HEIGHT);
for (const row of MAP) assert.equal(row.length, WIDTH);
assert.equal(DAYS.length, 8);
assert.equal(DAYS[0], 'Monday');
assert.equal(DAYS[7], 'Monday');
for (let day = 0; day < 8; day++) {
  assert.equal(isWeekend(day), day === 5 || day === 6);
  assert.equal(captureDestination(day), day === 5 || day === 6 ? 'dead' : 'detention');
}
for (const [day, name, weekend] of [[7,'Monday',false],[11,'Friday',false],[12,'Saturday',true],[13,'Sunday',true],[14,'Monday',false],[30,'Wednesday',false]]) {
  assert.equal(dayName(day),name);
  assert.equal(isWeekend(day),weekend);
  assert.equal(captureDestination(day),weekend?'dead':'detention');
}
assert.equal(nextSchoolDay(4),7,'Friday failure blocks the following Monday');
assert.equal(nextSchoolDay(11),14,'Principal consequences survive an extended-week weekend');
assert.equal(nextSchoolDay(0),1);

for (let z = 0; z < HEIGHT; z++) for (let x = 0; x < WIDTH; x++) {
  assert.deepEqual(worldToGrid(gridToWorld(x, z)), { x, z });
  assert.equal(isWalkable(...Object.values(gridToWorld(x, z)), 0.25), MAP[z][x] === '.');
}
assert.equal(cellWalkable(-1, 5), false);
assert.equal(isWalkable(-100, 0), false);
assert.equal(isWalkable(NaN, 0), false);
assert.equal(isWalkable(SPAWN.x, SPAWN.z, -1), false);
assert.ok(findPath(SPAWN, EXIT).length);

for (const room of Object.values(ROOMS)) {
  const route = findPath(SPAWN, room.center);
  assert.ok(route.length, `${room.id} must be connected to the school`);
  for (let i = 0; i < route.length; i++) {
    assert.equal(isWalkable(route[i].x, route[i].z), true);
    if (i) {
      assert.ok(lineOfSight(route[i - 1], route[i]));
      const a = worldToGrid(route[i - 1]), b = worldToGrid(route[i]);
      assert.ok(Math.abs(a.x - b.x) + Math.abs(a.z - b.z) <= 1, 'paths use adjacent cells');
    }
  }
  const blocked = new Set([cellKey(room.doorCell.x, room.doorCell.z)]);
  assert.equal(findPath(SPAWN, room.center, blocked).length, 0, `${room.id} locked door blocks its route`);
  assert.equal(isWalkable(room.door.x, room.door.z, 0.25, blocked), false);
}
const detentionLocked = new Set([cellKey(16, 5)]);
assert.equal(lineOfSight(gridToWorld(16, 3), gridToWorld(16, 8)), true);
assert.equal(lineOfSight(gridToWorld(16, 3), gridToWorld(16, 8), detentionLocked), false);
assert.equal(lineOfSight(ROOMS.homeroom.center, ROOMS.band.center), false);
assert.equal(lineOfSight(gridToWorld(16, 7), gridToWorld(16, 22)), true);
assert.equal(lineOfSight(gridToWorld(0, 0), SPAWN), false);
// Radius detects a wall before the player's center enters the wall's tile.
const edge = gridToWorld(14, 10);
assert.equal(isWalkable(edge.x - CELL_SIZE / 2 + 0.10, edge.z, 0.25), false);
assert.equal(isWalkable(edge.x - CELL_SIZE / 2 + 0.30, edge.z, 0.25), true);
// No isolated walkable tiles: flood from SPAWN reaches all floor when doors are open.
const start = worldToGrid(SPAWN), reached = new Set([cellKey(start.x, start.z)]), queue = [start];
for (let i = 0; i < queue.length; i++) {
  const { x, z } = queue[i];
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    const key = cellKey(nx, nz);
    if (cellWalkable(nx, nz) && !reached.has(key)) { reached.add(key); queue.push({ x: nx, z: nz }); }
  }
}
assert.equal(reached.size, MAP.join('').split('.').length - 1);
console.log(`After Bell engine: navigation, collision, line of sight, locked doors, campaign rules passed (${reached.size} floor cells).`);

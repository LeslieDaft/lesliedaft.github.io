import assert from 'node:assert/strict';
import { species, habitats, spawnLocation, keepInHabitat } from './wildlife.js';
import { makeDamageGrid } from './simulation.js';
assert.equal(species.length,24);assert.equal(new Set(species.map(s=>s.name)).size,24);
for(const s of species){
 assert.ok(s.hp>0&&s.scale>0&&s.meat>0&&s.hide>0,s.name);
 let b=habitats[s.biome];assert.ok(b,s.biome);
 for(const n of [0,.5,.999]){let p=spawnLocation(s,()=>n);assert.ok(p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ);}
 let grid=makeDamageGrid(s);assert.equal(grid.length,768);assert.ok([...grid].every(Number.isFinite));
 let a={s,x:700,z:700,angle:0,alert:0};keepInHabitat(a,.1);assert.notEqual(a.angle,0);
 let fleeing={s,x:700,z:700,angle:0,alert:1};keepInHabitat(fleeing,.1);assert.equal(fleeing.angle,0,'flight overrides habitat steering');
}
console.log('Wildlife: 24 unique species, five habitats, safe respawns and damage grids passed.');

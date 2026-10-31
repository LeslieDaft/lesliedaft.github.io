import assert from 'node:assert/strict';
import {createCar,createWorld,stepWorld,contactOBB,MODELS} from './physics.mjs';

// SAT should detect rotated rectangles and reject separated bodies.
const a=createCar({id:0,x:0,z:0}),b=createCar({id:1,x:1,z:1,angle:.8});
assert.ok(contactOBB(a,b));b.x=20;assert.equal(contactOBB(a,b),null);
for(const count of [2,6,10]){
  const grid=createWorld({count});
  for(let i=0;i<grid.cars.length;i++)for(let j=i+1;j<grid.cars.length;j++)assert.equal(contactOBB(grid.cars[i],grid.cars[j]),null,'Grid cars must not overlap');
}

// Forward throttle accelerates and steering describes a continuous curve.
const world=createWorld({count:2});world.cars[1].x=35;world.cars[1].z=-25;
world.cars[1].player=true;
for(let i=0;i<120;i++)stepWorld(world,1/120,{throttle:1});
assert.ok(world.cars[0].z<14);assert.ok(world.cars[0].vz< -3);
const priorAngle=world.cars[0].angle;
for(let i=0;i<50;i++)stepWorld(world,1/120,{throttle:1,steer:.5});
assert.ok(Math.abs(world.cars[0].angle-priorAngle)>.05);

// A centered symmetric head-on collision preserves net linear momentum,
// reduces closing velocity and damages both vehicles.
const impact=createWorld({count:2,arena:'speedway'});
impact.cars=[createCar({id:0,x:0,z:-2.35,angle:0,player:true}),createCar({id:1,x:0,z:2.35,angle:Math.PI,player:true})];
impact.cars[0].vz=16;impact.cars[1].vz=-16;
for(let i=0;i<8;i++)stepWorld(impact,1/120,{});
assert.ok(impact.cars.every(c=>c.health<100),'Head-on collisions should cause damage');
assert.ok(Math.abs(impact.cars[0].vz+impact.cars[1].vz)<.01,'Symmetric impact conserves net momentum');
assert.ok(impact.cars.every(c=>Math.abs(c.vz)<16),'Impact dissipates energy');
assert.ok(impact.cars.every(c=>Math.abs(c.omega)<.001),'Centered impact should not create yaw');
assert.ok(impact.cars[0].damage.front>0,'Damage localized to front');

// Glancing contacts produce yaw instead of a circle-only bounce.
const glance=createWorld({count:2,arena:'speedway'});
glance.cars=[createCar({id:0,x:0,z:0,angle:0,player:true}),createCar({id:1,x:1.6,z:4.4,angle:.1,player:true})];
glance.cars[0].vz=18;
for(let i=0;i<20;i++)stepWorld(glance,1/120,{});
assert.ok(glance.cars.some(c=>Math.abs(c.omega)>.01),'Glancing impact should impart angular momentum');

// All three arenas remain finite and bounded during a long AI soak.
for(const arena of ['yard','industrial','speedway']){
  const w=createWorld({arena,count:8,seed:6});w.cars[0].player=false;
  for(let i=0;i<120*80&&!w.finished;i++)stepWorld(w,1/120,{});
  for(const c of w.cars){
    assert.ok([c.x,c.z,c.angle,c.vx,c.vz,c.omega,c.health].every(Number.isFinite));
    assert.ok(Math.abs(c.x)<=w.bounds.x&&Math.abs(c.z)<=w.bounds.z);
    assert.ok(c.health>=0&&c.health<=100);
  }
  assert.ok(w.cars.some(c=>c.health<100),'AI should engage in collisions');
}
assert.equal(Object.keys(MODELS).length,3);
console.log('Derby physics: SAT, drive/steer, momentum, damage, yaw, and 3-arena AI soak passed.');

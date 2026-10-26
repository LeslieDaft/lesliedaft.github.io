import test from 'node:test';
import assert from 'node:assert/strict';
import {OCEANS,cruiseSpeed,routesFor,routeInfo,reachedRoute} from './oceans.js';
import {TYPES,SWIMMERS} from './species.js';
import {statsFor,mouthHit,takeChunk} from './combat.js';
test('four oceans retain the juvenile choices and ordered titan sizes',()=>{
 assert.equal(OCEANS.length,4);assert.equal(SWIMMERS.length,21);
 assert.equal(TYPES[OCEANS[1].titans[0]].name,'Megalodon');
 assert.equal(TYPES[OCEANS[2].titans[0]].name,'Giant squid');
 assert.equal(TYPES[OCEANS[3].titans[0]].name,'Giant sea serpent');
 assert.equal(TYPES[OCEANS[3].titans.at(-1)].name,'Moby Dick');
 assert.ok(TYPES[32].size>=TYPES[28].size*4);
 for(const ocean of OCEANS)for(const type of ocean.titans){const st=statsFor(type,TYPES[type].size,TYPES[type].size);assert.ok(Number.isFinite(st.maxHp)&&st.maxHp>0)}
});
test('forward crossings take about 45 seconds for small and grown species',()=>{
 for(const size of [.65,3,30,200])for(const modifier of [.8,1,1.35]){
  const speed=cruiseSpeed(size,modifier),origin={x:12,y:40,z:-8};
  for(let i=0;i<4;i++)for(const route of routesFor(i,origin,speed)){
   const info=routeInfo(route,origin,0,speed);assert.ok(Math.abs(info.seconds-45)<.05);
   assert.ok(!reachedRoute(route,origin,size));
   assert.ok(reachedRoute(route,{x:route.x,z:route.z},size));
  }
 }
});
test('navigation bearings follow the camera and show progress through water',()=>{
 const r={x:225,z:0},p={x:0,z:0};
 assert.ok(Math.abs(routeInfo(r,p,0,5).angle)<1e-12);
 assert.equal(routeInfo(r,{x:100,z:0},0,5).distance,125);
 assert.ok(Math.abs(routeInfo(r,p,Math.PI/2,5).angle+Math.PI/2)<1e-12);
});
test('titan flank damage still rewards only a completed kill',()=>{
 const st=statsFor(32,3000,3000),target={type:32,size:3000,p:{x:0,y:0,z:0},angle:0,...st,hp:st.maxHp,mass:st.mass,remainingMass:st.mass};
 const hit=mouthHit({x:0,y:0,z:749},{x:0,y:0,z:749},0,0,1,target,true);assert.ok(hit);
 assert.equal(takeChunk(target,100,1).xp,0);
 assert.ok(takeChunk(target,st.maxHp,1).xp>0);
 assert.equal(takeChunk(target,st.maxHp,1).xp,0);
});

test('all new titan models have finite animated geometry and distinct silhouettes',async()=>{
 const {createFish,animateFish,releaseFish}=await import('./fish-models.js');
 const counts=new Set();
 for(let type=22;type<TYPES.length;type++){
  const g=createFish(type,TYPES[type].size);animateFish(g,5,1,.2,.5);
  const geo=g.children[0].geometry;geo.computeBoundingBox();
  assert.ok(Number.isFinite(geo.boundingBox.min.x)&&Number.isFinite(geo.boundingBox.max.z));
  assert.ok(geo.boundingBox.max.x-geo.boundingBox.min.x>1);
  counts.add(geo.attributes.position.count);releaseFish(g);
 }
 assert.ok(counts.size>=4);
});

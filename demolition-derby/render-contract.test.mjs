import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from './vendor/three.module.js';
import {MODELS,createWorld,stepWorld} from './physics.mjs';
import {normalizeSave} from './garage-save.mjs';
import {deformPoint} from './deformation.mjs';
for(const bad of [null,[],{},42,'bad',{credits:NaN,wins:Infinity,owned:['bogus','truck','truck'],model:'muscle',arena:'missing',armor:Infinity,engine:-4,low:'false',sound:0}]){
  const s=normalizeSave(bad);assert.ok(Number.isFinite(s.credits)&&s.credits>=0);assert.ok(Number.isFinite(s.wins));assert.ok(s.owned.includes(s.model));assert.ok(s.owned.includes('sedan'));assert.ok(['yard','industrial','speedway'].includes(s.arena));assert.ok(s.armor>=0&&s.armor<=3);assert.ok(s.engine>=0&&s.engine<=3);assert.equal(typeof s.low,'boolean');assert.equal(typeof s.sound,'boolean');
}
const valid=normalizeSave({credits:820,wins:4,owned:['sedan','truck'],model:'truck',arena:'industrial',armor:2,engine:1,low:true,sound:false});assert.equal(valid.model,'truck');assert.equal(valid.credits,820);assert.equal(valid.arena,'industrial');assert.equal(valid.low,true);
let html;try{html=await readFile(new URL('./play.html',import.meta.url),'utf8');}catch{html=await readFile(new URL('./index.html',import.meta.url),'utf8');}for(const [model,spec] of Object.entries(MODELS)){assert.ok(html.includes(`data-car="${model}"`));assert.ok(html.includes(spec.name.toUpperCase()),`Model name ${spec.name} must match garage`);}
for(const spec of Object.values(MODELS)){
  const geo=new THREE.BoxGeometry(spec.halfWidth*2,.64,spec.halfLength*2,8,3,14);const orig=geo.attributes.position.array.slice();const a=geo.attributes.position;
  for(const damage of [{front:0,rear:0,left:0,right:0},{front:1,rear:0,left:0,right:0},{front:0,rear:1,left:0,right:0},{front:0,rear:0,left:1,right:0},{front:0,rear:0,left:0,right:1},{front:1,rear:1,left:1,right:1}]){
    for(let i=0;i<a.count;i++){const x=orig[i*3],y=orig[i*3+1],z=orig[i*3+2];const p=deformPoint(x,y,z,{x:0,z:0},spec.halfWidth,spec.halfLength,damage,i);assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[0]-x)<.82);assert.ok(Math.abs(p[1]-y)<.79);assert.ok(Math.abs(p[2]-z)<1.6);a.setXYZ(i,...p);if(Object.values(damage).every(d=>d===0))assert.ok(p.every((v,j)=>v===[x,y,z][j]));}
    geo.computeVertexNormals();geo.computeBoundingSphere();assert.ok(Number.isFinite(geo.boundingSphere.radius));assert.ok(geo.boundingSphere.radius<5);assert.ok([...geo.attributes.normal.array].every(Number.isFinite));
  }geo.dispose();
}
// Run physics until genuine damage occurs, then feed the exact renderer fields.
const world=createWorld({count:6});let hits=0;for(let i=0;i<60*120&&!world.finished;i++){stepWorld(world,1/120,{throttle:1,steer:Math.sin(i/500)});for(const e of world.events)if(e.type==='impact'){hits++;assert.ok(Number.isFinite(e.force));assert.ok(e.force>0&&e.force<100);}}
assert.ok(hits>0);for(const c of world.cars){assert.ok(MODELS[c.model]);assert.deepEqual(Object.keys(c.damage).sort(),['front','left','rear','right']);assert.ok(Object.values(c.damage).every(d=>d>=0&&d<=1));assert.ok(Number.isFinite(c.damageVersion));}
console.log('Derby renderer contracts: garage recovery, model labels, bounded real geometry deformation and physics event compatibility passed.');

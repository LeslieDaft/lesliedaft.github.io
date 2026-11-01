import assert from 'node:assert/strict';
import {MODELS,createCar,createWorld,stepWorld,damageMultiplier} from './physics.mjs';
import {normalizeSave} from './garage-save.mjs';
import {TOURS,recordTour} from './career.mjs';
assert.equal(Object.keys(MODELS).length,9);assert.equal(TOURS.length,12);
for(const model of Object.keys(MODELS))for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const c=createCar({model,angle}),at=(x,z)=>damageMultiplier(c,Math.cos(angle)*x+Math.sin(angle)*z,-Math.sin(angle)*x+Math.cos(angle)*z);
 const engineSide=at(c.halfWidth,c.halfLength*.8),grille=at(0,c.halfLength),rear=at(0,-c.halfLength);
 assert(engineSide.multiplier>grille.multiplier);assert(grille.multiplier>rear.multiplier);assert.equal(engineSide.label,'ENGINE SIDE');
 let prev=0;for(let z=-1;z<=1;z+=.1){const m=at(c.halfWidth,c.halfLength*z).multiplier;assert(m>=prev-1e-10);prev=m;}
 c.grilleLevel=3;assert(at(0,c.halfLength).multiplier<grille.multiplier);
}
const w=createWorld({count:9});let numbers=0;for(let i=0;i<120*60&&!w.finished;i++){stepWorld(w,1/120,{throttle:1,steer:Math.sin(i/300)});for(const e of w.events)if(e.type==='damage'){assert(e.amount>0&&e.amount<=100);assert(e.multiplier>=.45&&e.multiplier<=2.4);assert(Number.isFinite(e.x)&&Number.isFinite(e.z));numbers++;}}assert(numbers>0);
for(const tour of TOURS){const save=normalizeSave({credits:100,activeTour:{id:tour.id,event:0,points:0}});for(let i=0;i<tour.events;i++){const r=recordTour(save,true,true,2);assert.equal(r.complete,i===tour.events-1);}assert.equal(save.activeTour,null);assert.equal(save.credits,100+tour.reward);assert(save.tourResults[tour.id]>=8*tour.events);}
const legacy=normalizeSave({credits:8400,owned:['sedan','truck'],model:'truck',armor:2,engine:1});assert.equal(legacy.credits,8400);assert.equal(legacy.model,'truck');assert.equal(legacy.handling,0);
console.log('PASS: nine cars; engine-side > grille > rear at all headings; graded side vulnerability; real damage events; twelve complete tours and rewards; legacy garage saves.');

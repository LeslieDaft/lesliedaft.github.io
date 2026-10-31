import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createWorld,stepWorld} from './physics.mjs';
import {readDriveInput} from './controls.mjs';

const sources=[
  {label:'WASD right',keys:new Set(['KeyW','KeyD']),touch:{},sign:1},
  {label:'arrow right',keys:new Set(['ArrowUp','ArrowRight']),touch:{},sign:1},
  {label:'touch right',keys:new Set(),touch:{gas:true,right:true},sign:1},
  {label:'WASD left',keys:new Set(['KeyW','KeyA']),touch:{},sign:-1},
  {label:'arrow left',keys:new Set(['ArrowUp','ArrowLeft']),touch:{},sign:-1},
  {label:'touch left',keys:new Set(),touch:{gas:true,left:true},sign:-1}
];

function simulate(angle,input,reverse=false){
  const w=createWorld({arena:'speedway',count:2});
  w.bounds={x:10000,z:10000};w.obstacles=[];
  const c=w.cars[0];Object.assign(c,{x:0,z:0,angle,vx:Math.sin(angle)*(reverse?-8:8),vz:Math.cos(angle)*(reverse?-8:8)});
  Object.assign(w.cars[1],{x:1000,z:1000});
  const camera=new THREE.PerspectiveCamera(56,16/9,.1,500);
  camera.position.set(-Math.sin(angle)*12,5,-Math.cos(angle)*12);
  camera.lookAt(Math.sin(angle)*3,1.1,Math.cos(angle)*3);camera.updateMatrixWorld();
  for(let i=0;i<45;i++)stepWorld(w,1/120,input);
  const nose=new THREE.Vector3(c.x+Math.sin(c.angle)*2,1.1,c.z+Math.cos(c.angle)*2).project(camera);
  return {car:c,screenX:nose.x,yaw:Math.atan2(Math.sin(c.angle-angle),Math.cos(c.angle-angle))};
}

// Project the real physics nose into the actual +Z chase-camera convention.
// This fails with the old mapping even though its generic steering test passed.
for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const s of sources){
  const input=readDriveInput(s.keys,s.touch),result=simulate(angle,input);
  assert.ok(result.screenX*s.sign>.01,`${s.label} must move the nose toward screen-${s.sign>0?'right':'left'} at heading ${angle}`);
  assert.equal(Math.sign(result.car.steer),-s.sign,'front wheel yaw agrees with the car turn');
}

// Keeping the wheel to the right while reversing swings the nose the other way,
// as a real car does; controls must not introduce a second reversal in reverse.
for(const [key,touch]of[['KeyD',{}],['ArrowRight',{}],[null,{right:true}]]){
  const input=readDriveInput(new Set(key?['KeyS',key]:[]),key?touch:{...touch,brake:true});
  const forward=simulate(0,{...input,throttle:1}),reverse=simulate(0,input,true);
  assert.ok(forward.yaw<0&&reverse.yaw>0,'reverse yaw follows the signed driving velocity');
  assert.ok(reverse.car.steer<0,'right wheel yaw remains right while reversing');
}
const cancelled=readDriveInput(new Set(['KeyW','KeyS','KeyA','KeyD','Space']));
assert.equal(cancelled.throttle,0);assert.equal(cancelled.steer,0);assert.equal(cancelled.handbrake,true);
console.log('Derby steering: WASD, arrow and touch turns match screen direction at four headings; reverse steering and opposing inputs pass.');

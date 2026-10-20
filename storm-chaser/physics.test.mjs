import assert from 'node:assert/strict';
import {freshProgress,validateProgress,buyUpgrade,stepVehicle,terrainHeight,surfaceAt,windAt,stormDamage} from './physics.mjs';
const clean=()=>({x:0,z:0,yaw:0,vx:0,vz:0,speed:0}),u=freshProgress().upgrades;
const input=(v={})=>({throttle:false,brake:false,steer:0,handbrake:false,...v});
function drive(v,i,s='pavement',n=600){for(let j=0;j<n;j++)stepVehicle(v,i,1/60,u,s);return v;}
const highway=drive(clean(),input({throttle:true}));assert.ok(highway.z<-300,'The truck must move freely through world coordinates.');assert.ok(highway.speed>50,'Highway driving reaches useful travel speed.');
const mud=drive(clean(),input({throttle:true}),'mud');assert.ok(mud.speed<highway.speed*.7,'Mud must meaningfully slow the truck.');
const braking={...highway};drive(braking,input({brake:true}),'pavement',80);assert.ok(braking.speed<highway.speed*.3,'Brakes must stop the truck.');
const turn=drive(clean(),input({throttle:true,steer:1}),'dirt',150);assert.ok(turn.yaw>.5&&turn.x<-10,'Steering changes orientation and trajectory.');
const v=drive(clean(),input({throttle:true}),'dirt',200),normal={...v},drift={...v};drive(normal,input({steer:1}),'dirt',60);drive(drift,input({steer:1,handbrake:true}),'dirt',60);const lateral=q=>Math.abs(q.vx*Math.cos(q.yaw)-q.vz*Math.sin(q.yaw));assert.ok(lateral(drift)>lateral(normal),'Handbrake reduces grip and creates a measurable slide.');
const wind=windAt(20,20,{x:0,z:0}),loose=clean(),fixed=clean();stepVehicle(loose,input(),.04,u,'dirt',wind,false);stepVehicle(fixed,input(),.04,u,'dirt',wind,true);assert.ok(Math.hypot(fixed.vx,fixed.vz)<Math.hypot(loose.vx,loose.vz)*.1,'Anchors resist tornado wind.');
assert.ok(Math.abs(terrainHeight(-900,1400))<.0001,'Main roads stay flat.');assert.equal(surfaceAt(-900,1400),'pavement');assert.ok(stormDamage(80,3,true)<stormDamage(80,0,false));assert.equal(stormDamage(400,0,false),0);
const p=freshProgress();assert.equal(buyUpgrade(p,'engine'),false,'Cannot purchase unaffordable upgrades.');p.money=1000;assert.equal(buyUpgrade(p,'engine'),true);assert.equal(p.money,550);assert.equal(p.upgrades.engine,1);p.upgrades.engine=3;assert.equal(buyUpgrade(p,'engine'),false,'Maxed upgrades cannot spend money.');assert.equal(buyUpgrade(p,'bad'),false);
const validated=validateProgress({version:1,money:-100,probes:999,upgrades:{engine:999},settings:{render:400,detail:700}});assert.equal(validated.money,0);assert.equal(validated.probes,99);assert.equal(validated.upgrades.engine,3);assert.equal(validated.settings.detail,400);assert.deepEqual(validateProgress(null),freshProgress());
console.log('Storm Chaser: 20 driving, grip, wind, storm damage, upgrade, terrain, and save assertions passed.');

import assert from 'node:assert/strict';
import {createCar,createWorld,contactBuild,contactOBB,stepWorld} from './physics.mjs';
import {applyBuild,PARTS} from './workshop.mjs';
const part=(type,x=0,z=0,y=1)=>({type,x,z,y,rotation:0});
const c=createCar();applyBuild(c,[part('engine'),part('plate'),part('tire')]);assert.equal(c.mass,1420+140+70+45);assert.ok(c.power>8500);assert.ok(c.handling>1);assert.equal(c.build[1].hp,65);
const a=createCar({x:0,z:0,player:true}),b=createCar({id:1,x:3.5,z:0});applyBuild(a,[part('ram',2.7,0)]);assert.equal(contactOBB(a,b),null);assert.ok(contactBuild(a,b),'Outboard parts contact before chassis');a.build[0].hp=0;assert.equal(contactBuild(a,b),null,'Destroyed parts stop colliding');applyBuild(a,[part('ram',2.7,0,2.5)]);assert.equal(contactBuild(a,b),null,'Roof parts clear side impacts');
function collision(parts){const w=createWorld({count:2,arena:'speedway'});w.cars=[createCar({id:0,z:-2.35,player:true}),createCar({id:1,z:2.35,angle:Math.PI,player:true})];applyBuild(w.cars[0],parts);w.cars[0].vz=16;w.cars[1].vz=-16;for(let i=0;i<8;i++)stepWorld(w,1/120,{});return w;}
const bare=collision([]),armored=collision([part('plate',0,2)]);assert.ok(armored.cars[0].health>bare.cars[0].health,'Local armor reduces damage');const wrong=collision([part('plate',0,-2)]);assert.ok(armored.cars[0].health>wrong.cars[0].health,'Armor placement matters');
console.log('Scrap Siege: part mass, engines, traction, outboard contact, mount height, destruction and local armor PASS');

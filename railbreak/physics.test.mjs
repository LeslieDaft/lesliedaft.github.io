import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkater,stepSkater} from './physics.mjs';
const flat={heightAt:()=>0,rails:[],obstacles:[]};
function advance(s,input,seconds,world=flat){const events=[];for(let i=0;i<seconds*60;i++)events.push(...stepSkater(s,input,1/60,world));return events;}
test('push builds useful speed and brake stops a moving skateboard',()=>{const s=createSkater();advance(s,{push:true},3);assert.ok(s.speed>10);assert.ok(s.z < -15);const speed=s.speed;advance(s,{brake:true},1);assert.ok(s.speed<speed*.1);});
test('ollie rises, completed kickflip lands cleanly, and events fire only once',()=>{const s=createSkater();s.vz=-10;const start=stepSkater(s,{jumpPressed:true},1/60,flat);assert.ok(start.includes('ollie'));stepSkater(s,{flipPressed:true},1/60,flat);assert.ok(s.y>0);const events=advance(s,{},2);assert.equal(events.filter(x=>x==='land').length,1);assert.ok(events.includes('kickflip'));assert.equal(s.lastLanding.clean,true);assert.equal(s.y,0);assert.equal(s.grounded,true);});
test('airborne skater catches a physical rail and can jump out',()=>{const s=createSkater(0,1);s.y=.8;s.grounded=false;s.vz=-8;const world={...flat,rails:[{ax:0,az:2,bx:0,bz:-12,y:1}]};const events=stepSkater(s,{grind:true},1/60,world);assert.ok(events.includes('grind-start'));advance(s,{grind:true},.4,world);assert.ok(s.grindDistance>2);const jump=stepSkater(s,{grind:true,jumpPressed:true},1/60,world);assert.ok(jump.includes('grind-end'));assert.equal(s.grind,null);assert.ok(s.vy>0);});
test('building impact bails and resolves the blocking footprint',()=>{const s=createSkater(0,1);s.vz=-12;const world={...flat,obstacles:[{x:0,z:0,w:4,d:1,h:5}]};const e=advance(s,{},.2,world);assert.ok(e.includes('bail'));assert.ok(s.z>.78);assert.ok(s.bail>0);advance(s,{},2,world);assert.equal(s.bail,0);});
test('long varied simulation stays finite and clamps frame spikes',()=>{const s=createSkater();for(let i=0;i<12000;i++){stepSkater(s,{push:i%100<70,left:i%240<120,jumpPressed:i%150===0,flipPressed:i%150===2,spinLeft:i%150<10},i%100===0?3:1/60,flat);for(const k of ['x','z','y','vx','vz','vy','heading','speed'])assert.ok(Number.isFinite(s[k]),k);}assert.ok(s.speed<=32.001);});
test('partial kickflip bails rather than scoring an incomplete trick',()=>{const s=createSkater();s.y=.1;s.grounded=false;s.vy=-2;stepSkater(s,{flipPressed:true},1/60,flat);const e=advance(s,{},.2);assert.ok(e.includes('bail'));assert.equal(s.lastLanding.clean,false);});

for (const initialSpeed of [18, 30]) {
  test(`coasting at ${initialSpeed} m/s retains at least 97% after ten seconds`,()=>{
    const s=createSkater();s.vz=-initialSpeed;
    advance(s,{},10);
    assert.ok(s.speed>=initialSpeed*.97,`coast ended at ${s.speed}`);
    assert.ok(s.speed<=initialSpeed+.001,'coasting does not add energy');
  });
  test(`broad continuous carving at ${initialSpeed} m/s preserves momentum`,()=>{
    const s=createSkater();s.vz=-initialSpeed;
    advance(s,{left:true},8);
    assert.ok(Math.abs(s.heading)>2,'the board actually carved');
    assert.ok(s.speed>=initialSpeed*.95,`carve ended at ${s.speed}`);
    assert.ok(s.speed<=initialSpeed+.001,'carving does not add energy');
  });
}
test('hills change momentum through gravity with no forced cruising speed',()=>{
  const down=createSkater(),up=createSkater();down.vz=up.vz=-18;
  advance(down,{},5,{...flat,heightAt:(x,z)=>z*.1});
  advance(up,{},5,{...flat,heightAt:(x,z)=>-z*.1});
  assert.ok(down.speed>22,`downhill ended at ${down.speed}`);
  assert.ok(up.speed<14,`uphill ended at ${up.speed}`);
  assert.ok(up.speed>10,'gentle uphill loses speed progressively');
});
test('brake remains decisive at high speed and has no minimum cruising floor',()=>{
  const s=createSkater();s.vz=-30;advance(s,{brake:true},2);
  assert.ok(s.speed<.1,`brake ended at ${s.speed}`);
});
test('a long rail preserves momentum until the rider brakes',()=>{
  const s=createSkater(0,1);s.y=.8;s.grounded=false;s.vz=-18;
  const world={...flat,rails:[{ax:0,az:2,bx:0,bz:-1000,y:1}]};
  stepSkater(s,{grind:true},1/60,world);
  assert.ok(s.grind,'skater catches the rail');
  advance(s,{grind:true},10,world);
  assert.ok(s.speed>=18*.97,`grind ended at ${s.speed}`);
  advance(s,{grind:true,brake:true},2,world);
  assert.ok(s.speed<.1,'brake stops movement along the rail');
});

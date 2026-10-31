'use strict';
const assert=require('node:assert/strict');
const {World,levels}=require('./engine.js');
const dt=1/120;
function tick(w,n,input){for(let i=0;i<n;i++)w.update(dt,typeof input==='function'?input(w,i):input||{});}
// Fixed step produces identical gameplay regardless of render frame grouping.
function runGrouped(group){const w=new World(0);for(let t=0;t<600;t+=group)for(let i=0;i<group&&t+i<600;i++)w.update(dt,{right:true,jump:(t+i>=110&&t+i<170)});return w.snapshot();}
assert.deepEqual(runGrouped(1),runGrouped(2));assert.deepEqual(runGrouped(1),runGrouped(4));
let w=new World(0);tick(w,10);assert.equal(w.p.grounded,true);const startX=w.p.x;tick(w,60,{right:true});assert(w.p.x>startX+130);assert(w.p.vx>330);
w.p.x=550;w.p.y=600;w.p.grounded=true;w.p.groundId=0;w.p.vx=340;tick(w,10,{right:true});assert(!w.p.grounded);assert(w.p.coyote>0);tick(w,1,{right:true,jump:true});assert(w.p.vy<0,'coyote jump fires');
w=new World(0);tick(w,1);tick(w,1,{jump:true});tick(w,120,{jump:true});assert.equal(w.p.grounded,true,'holding jump does not repeat');
w=new World(0);w.p.x=1140;w.p.y=600;w.p.grounded=true;w.p.groundId=1;tick(w,2,{down:true,right:true});assert.equal(w.p.h,27);tick(w,2,{right:true});assert.equal(w.p.h,27,'cannot stand inside slide beam');
w=new World(0);w.p.x=100;w.p.y=540;w.p.vy=400;tick(w,10,{jump:false});tick(w,1,{jump:true});tick(w,10,{jump:false});assert(w.p.vy<0,'jump buffer fires on landing');
w=new World(3);const platform=w.level.platforms.find(s=>s.move);w.p.x=platform.x+75;w.p.y=platform.y;w.p.groundId=platform.id;w.p.grounded=true;const relative=w.p.x-platform.x;tick(w,12,{});assert(Math.abs(w.p.x-platform.x-relative)<.1,'moving platform carries runner');
w=new World(4);const cracked=w.level.platforms.find(s=>s.type==='crumble');w.p.x=cracked.x+80;w.p.y=cracked.y;w.p.grounded=true;w.p.groundId=cracked.id;tick(w,120);assert(!cracked.active,'crumble expires');w.saved={x:100,y:600};w.spawn();assert(cracked.active,'respawn restores collapsed route');
// Ledge catches and wall kicks work without teleporting or bypassing collision.
w=new World(0);w.p.x=1750;w.p.y=555;w.p.vx=340;w.p.vy=100;tick(w,10,{right:true});assert(w.p.hang,'ledge can be caught');tick(w,1,{jump:true});assert(w.p.climb,'jump starts a ledge vault');tick(w,35,{right:true});assert(w.p.y<=520.01&&w.p.x>1780,'vault ends on the actual raised platform');
w=new World(0);w.p.x=180;w.p.y=420;w.p.wall=1;w.p.vy=100;tick(w,1,{jump:true});assert(w.p.vx<0&&w.p.vy<0,'wall kick pushes away and upward');
const highJump=new World(0),lowJump=new World(0);tick(highJump,2);tick(lowJump,2);tick(highJump,25,{jump:true});tick(lowJump,3,{jump:true});tick(lowJump,22,{jump:false});assert(highJump.p.y<lowJump.p.y-20,'release gives a shorter controllable jump');
w=new World(0);w.p.x=1140;w.p.y=600;w.p.h=27;w.p.grounded=true;w.p.groundId=1;tick(w,1,{jump:true});assert(w.p.vy>=0,'cannot jump into the slide beam');
w=new World(0);w.p.x=1530;w.p.y=490;w.p.vx=340;tick(w,5,{right:true});assert.equal(w.checkpoint,1,'airborne route crossing captures checkpoint');w.die();tick(w,60);assert.equal(w.deaths,1);assert(w.p.x>=1535&&w.p.y<=560.1,'death respawns at the real safe checkpoint');
function solve(index){const w=new World(index);let hold=0,lastJump=-10;const log=[];for(let frame=0;frame<120*100&&!w.finished;frame++){
 const p=w.p;let jump=false,down=false;
 if(hold>0){jump=true;hold--;}
 if(p.hang){jump=true;}
 if(p.grounded){
  const ground=w.level.platforms[p.groundId],edge=ground?ground.x+ground.w:Infinity;
  const underBeam=w.level.platforms.some(s=>s.type==='bar'&&s.x<p.x+70&&s.x+s.w>p.x-25&&Math.abs(s.y+s.h-(p.y-32))<5);
  const lowSaw=w.level.hazards.some(h=>h.type==='saw'&&h.x<p.x+100&&h.x+h.w>p.x-25&&h.y+h.h>=p.y-48&&h.y+h.h<=p.y-27);
  down=underBeam||lowSaw;if(down)jump=false;
  const spike=w.level.hazards.find(h=>h.type==='spikes'&&h.x-p.x>0&&h.x-p.x<112&&Math.abs(h.y+h.h-p.y)<5);
  const hazard=w.level.hazards.find(h=>h.type==='saw'&&h.x-p.x>0&&h.x-p.x<120&&Math.abs(h.y+h.h-p.y)<100&&!lowSaw);
  const hurdle=w.level.platforms.find(s=>s.type==='hurdle'&&s.x-p.x>0&&s.x-p.x<90&&s.y<p.y);
  if(!down&&frame-lastJump>45&&((edge-p.x<30&&edge<w.level.width-50)||spike||hurdle||hazard)){jump=true;hold=70;lastJump=frame;}
 }
 w.update(dt,{right:true,jump,down});
 if(w.dying>.44&&log.length<12)log.push([Math.round(p.x),Math.round(p.y),Math.round(w.time*10)/10]);
 }
 return {index,finished:w.finished,time:w.time.toFixed(2),deaths:w.deaths,x:Math.round(w.p.x),firstFalls:log};
}
const results=levels.map((_,i)=>solve(i));console.log(JSON.stringify({physics:'passed',routes:results},null,2));assert(results.every(r=>r.finished),'all 100 routes must be playable with normal movement');

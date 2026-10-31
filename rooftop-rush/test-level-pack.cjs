'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const packPath=require.resolve('./level-pack.js'),raw=require(packPath),fingerprint=JSON.stringify(raw);
delete require.cache[packPath];assert.equal(JSON.stringify(require(packPath)),fingerprint,'fixed seeds generate identical courses on every load');
const {World,levels}=require('./engine.js');
assert.equal(raw.length,94);assert.equal(levels.length,100);assert.equal(new Set(levels.map(l=>l.name)).size,100);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(levels.slice(0,6))).digest('hex'),'49a458d829904b4b5a53bb383da819537fceb30bf7a5eb77641348b93ebaff6e','original six routes and IDs stay unchanged');
const geometries=new Set(),features={};let checkpoints=0;
for(let index=6;index<100;index++){
 const l=levels[index];assert.equal(l.id,index);assert.equal(l.district,Math.floor(index/10)+1);assert.equal(l.stage,index%10+1);
 assert(l.width>3000&&l.width<25000);assert(l.gold>0&&l.silver>l.gold);assert(l.tokens.length>5);assert(l.checkpoints.length>0);
 geometries.add(JSON.stringify([l.width,l.platforms,l.hazards]));for(const f of l.features)features[f]=(features[f]||0)+1;
 const final=l.platforms.find(p=>p.type==='roof'&&l.finish.x>p.x+20&&l.finish.x<p.x+p.w-20&&p.y===l.finish.y);assert(final,'finish beacon has a safe landing');
 for(const c of l.checkpoints){checkpoints++;assert(l.platforms.some(p=>p.type==='roof'&&!p.move&&c.x>p.x+20&&c.x<p.x+p.w-20&&c.y===p.y),'checkpoint is on stable solid roof');assert(!l.hazards.some(h=>h.x<c.x+20&&h.x+h.w>c.x-20&&h.y+h.h>c.y-50&&h.y<c.y),'checkpoint is clear of hazards');}
}
assert.equal(geometries.size,94,'all added routes have different layouts');assert.equal(Object.keys(features).length,10);for(const count of Object.values(features))assert(count>=10,'each challenge family gets substantial representation');
// This controller uses the same four inputs as a player. It never changes player
// coordinates, removes hazards, changes collision, or alters the timer.
function complete(index){const w=new World(index);let hold=0,lastJump=-1000;for(let frame=0;frame<120*95&&!w.finished;frame++){
 const p=w.p;let jump=hold>0,down=false;if(hold>0)hold--;if(p.hang)jump=true;
 if(p.grounded){const ground=w.level.platforms[p.groundId],edge=ground?ground.x+ground.w:Infinity;
  const beam=w.level.platforms.some(s=>s.type==='bar'&&s.x<p.x+70&&s.x+s.w>p.x-25&&Math.abs(s.y+s.h-(p.y-32))<5);
  const overhead=w.level.hazards.some(h=>h.type==='saw'&&h.x<p.x+100&&h.x+h.w>p.x-25&&h.y+h.h>=p.y-48&&h.y+h.h<=p.y-27);down=beam||overhead;if(down)jump=false;
  const spike=w.level.hazards.some(h=>h.type==='spikes'&&h.x-p.x>0&&h.x-p.x<112&&Math.abs(h.y+h.h-p.y)<5);
  const saw=w.level.hazards.some(h=>h.type==='saw'&&h.x-p.x>0&&h.x-p.x<120&&Math.abs(h.y+h.h-p.y)<100&&!overhead);
  const hurdle=w.level.platforms.some(s=>s.type==='hurdle'&&s.x-p.x>0&&s.x-p.x<90&&s.y<p.y);
  if(!down&&frame-lastJump>45&&((edge-p.x<30&&edge<w.level.width-50)||spike||saw||hurdle)){jump=true;hold=70;lastJump=frame;}
 }
 w.update(1/120,{right:true,jump,down});
 }
 assert(w.finished,'route '+(index+1)+' can be completed with normal controls');assert.equal(w.deaths,0,'route '+(index+1)+' has a clean playable line');assert(w.time<=w.level.gold,'gold medal is attainable');return w.time;
}
const times=levels.map((_,i)=>complete(i));
console.log(JSON.stringify({levels:levels.length,added:94,distinctLayouts:geometries.size,checkpointCount:checkpoints,challengeCoverage:features,normalControlCompletion:'100/100, zero falls',addedTimeRange:[+Math.min(...times.slice(6)).toFixed(2),+Math.max(...times.slice(6)).toFixed(2)],finaleSeconds:+times[99].toFixed(2)},null,2));

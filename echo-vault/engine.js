/* Echo Vault deterministic, turn-based simulation shared by browser and solution verifier. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.EchoEngine=api;})(globalThis,function(){
'use strict';
const DIRS=[[0,-1],[1,0],[0,1],[-1,0],[0,0]],same=(a,b)=>a.x===b.x&&a.y===b.y,copy=v=>JSON.parse(JSON.stringify(v));
function initial(level){return {x:level.start.x,y:level.start.y,t:0,keys:0,latches:0,boxes:copy(level.boxes),won:false};}
function echoFrame(tape,t){if(tape.reverse)return tape.frames[Math.max(0,tape.frames.length-1-t)];return tape.frames[Math.min(t,tape.frames.length-1)];}
function actors(tapes,t){return tapes.map(v=>echoFrame(v,t));}
function isOpen(level,state,tapes,gate,t=state.t){
 const echoes=actors(tapes,t),occupants=[state,...echoes,...state.boxes];
 if(gate.type==='key')return !!(state.keys&(1<<gate.id));
 if(gate.type==='latch')return !!(state.latches&(1<<gate.id));
 if(gate.type==='pulse')return (t+gate.phase)%gate.period>=gate.on;
 if(gate.type==='weight')return state.boxes.some(v=>same(v,gate.plate));
 if(gate.type==='echo')return echoes.some(v=>same(v,gate.plate));
 return occupants.some(v=>same(v,gate.plate));
}
function transition(level,old,tapes,action){
 if(old.won)return old;
 const s={...old,t:old.t+1,boxes:old.boxes.map(v=>({...v}))};
 // Echoes replay the box pushes as well as their path. This makes recordings reproducible.
 for(const tape of tapes){if(tape.reverse||s.t>=tape.frames.length)continue;const f=echoFrame(tape,s.t);if(f.push){const b=s.boxes.find(v=>same(v,f.push.from));if(b&&!s.boxes.some(v=>same(v,f.push.to)))Object.assign(b,f.push.to);}}
 const [dx,dy]=DIRS[action],target={x:s.x+dx,y:s.y+dy};
 const floor=v=>v.x>=0&&v.y>=0&&v.y<level.grid.length&&v.x<level.grid[0].length&&level.grid[v.y][v.x]!== '#';
 const pass=v=>floor(v)&&!level.gates.some(g=>same(g,v)&&!isOpen(level,s,tapes,g));
 let push;
 if((dx||dy)&&pass(target)){
  const b=s.boxes.find(v=>same(v,target));let ok=true;
  if(b){const to={x:b.x+dx,y:b.y+dy};ok=pass(to)&&!s.boxes.some(v=>same(v,to));if(ok){push={from:{...b},to};Object.assign(b,to);}}
  if(ok){s.x=target.x;s.y=target.y;}
 }
 for(const g of level.gates){if(g.type==='key'&&same(s,g.key))s.keys|=1<<g.id;if(g.type==='latch'&&same(s,g.plate))s.latches|=1<<g.id;}
 s.won=same(s,level.goal)&&level.gates.every(g=>g.type!=='key'||(s.keys&(1<<g.id)));
 if(push)s.push=push;else delete s.push;
 return s;
}
class World{
 constructor(level){this.level=level;this.tapes=[];this.reset();}
 reset(){this.state=initial(this.level);this.actions=[];this.frames=[{x:this.state.x,y:this.state.y}];}
 step(action){if(this.state.won)return false;if(this.actions.length>=this.level.memory)return false;this.state=transition(this.level,this.state,this.tapes,action);this.actions.push(action);this.frames.push({x:this.state.x,y:this.state.y,...(this.state.push?{push:copy(this.state.push)}:{})});return true;}
 commit(reverse=false){if(this.tapes.length>=3||!this.actions.length)return false;this.tapes.push({frames:copy(this.frames),reverse});this.reset();return true;}
 seek(t){const actions=this.actions.slice(0,t);this.reset();actions.forEach(a=>this.step(a));}
 undo(){this.seek(Math.max(0,this.actions.length-1));}
 remove(){this.tapes.pop();this.reset();}
}
function stateKey(s,maxTape){return [s.x,s.y,Math.min(s.t,maxTape),s.t%12,s.keys,s.latches,...s.boxes.flatMap(b=>[b.x,b.y])].join(',');}
function findPath(level,tapes,start,test,limit=180000){
 const maxTape=Math.max(0,...tapes.map(v=>v.frames.length)),queue=[{s:copy(start),p:-1,a:-1}],seen=new Set([stateKey(start,maxTape)]);let at=0;
 while(at<queue.length&&queue.length<limit){const node=queue[at];if(test(node.s)){const path=[];let i=at;while(queue[i].p>=0){path.push(queue[i].a);i=queue[i].p;}return path.reverse();}for(let a=0;a<5;a++){const s=transition(level,node.s,tapes,a);if(s.t>level.memory)continue;const k=stateKey(s,maxTape);if(seen.has(k))continue;seen.add(k);queue.push({s,p:at,a});}at++;}
 return null;
}
function solve(level){const world=new World(level),recordings=[];for(const gate of level.gates){if(!['hold','echo','weight'].includes(gate.type))continue;const path=findPath(level,world.tapes,world.state,s=>gate.type==='weight'?s.boxes.some(b=>same(b,gate.plate)):same(s,gate.plate));if(!path)return {ok:false,stage:gate.id};path.forEach(a=>world.step(a));recordings.push([...path]);world.commit();}
 const path=findPath(level,world.tapes,world.state,s=>s.won);if(!path)return {ok:false,stage:'exit'};path.forEach(a=>world.step(a));return {ok:world.state.won,recordings,path,turns:world.state.t};}
return {World,DIRS,initial,transition,actors,isOpen,findPath,solve,same};
});

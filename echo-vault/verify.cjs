const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./engine.js'),levels=require('./levels.js');
assert.equal(levels.length,100);const hashes=new Set(),topology=new Set(),solutions=[];let pushes=0;
for(const level of levels){
 const signature=JSON.stringify([level.grid,level.goal,level.gates,level.boxes]);assert(!hashes.has(signature),'duplicate puzzle '+level.id);hashes.add(signature);topology.add(JSON.stringify(level.grid));
 const solution=E.solve(level);assert(solution.ok,'unsolved chamber '+level.id);const w=new E.World(level);
 for(const rec of solution.recordings){rec.forEach(a=>w.step(a));assert(w.commit());}
 solution.path.forEach(a=>w.step(a));assert(w.state.won,'replayed solution fails '+level.id);assert(w.state.t<=level.memory);
 if(level.gates.some(g=>g.type==='hold'||g.type==='echo')){const path=E.findPath(level,[],E.initial(level),s=>s.won,30000);assert.equal(path,null,'echo puzzle can be bypassed '+level.id);}
 for(const tape of w.tapes)pushes+=tape.frames.filter(f=>f.push).length;
 solutions.push({id:level.id,recordings:solution.recordings,path:solution.path});
}
assert.equal(topology.size,100,'unique spatial topologies, not just relocated switches');assert(pushes>0,'recorded crate push coverage');
let w=new E.World(levels[0]);const path=solutions[0].recordings[0];path.forEach(a=>w.step(a));const end={...w.state};w.undo();assert.equal(w.actions.length,path.length-1);w.step(path.at(-1));assert.deepEqual(w.state,end);w.seek(2);assert.equal(w.actions.length,2);w.reset();path.forEach(a=>w.step(a));assert(w.commit());const tape=w.tapes[0];assert.deepEqual(E.actors([tape],999)[0],tape.frames.at(-1));tape.reverse=true;assert.deepEqual(E.actors([tape],0)[0],tape.frames.at(-1));assert.deepEqual(E.actors([tape],999)[0],tape.frames[0]);w.remove();assert.equal(w.tapes.length,0);
for(const l of levels)for(const g of l.gates.filter(g=>g.type==='pulse')){let s=E.initial(l);const states=Array.from({length:4},(_,t)=>E.isOpen(l,{...s,t},[],g));assert.equal(states.filter(Boolean).length,2);}
fs.writeFileSync(__dirname+'/solutions.json',JSON.stringify(solutions));console.log(JSON.stringify({chambers:levels.length,uniqueTopologies:topology.size,solutionsReplayed:solutions.length,recordedPushes:pushes,checks:'no echo bypasses; undo; scrub; reverse; pulse cycles'},null,2));

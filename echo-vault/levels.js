/* One hundred deterministic rooms. Topology, branch placement, objectives and circuits vary. */
(function(r,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else r.EchoLevels=a;})(globalThis,function(){
const wings=['Awakening','Parallel Paths','The Locksmith','Pulse Foundry','Heavy Memories','Ghost Receivers','Switchboard','Short Term','Crossed Circuits','The Core'];
const titles=['First Impression','Side Channel','Dogleg','The Long Way Back','Split Decision','Quiet Corner','Interchange','Forked Memory','Hidden Spur','The Other Side'];
const levels=[];
for(let index=0;index<100;index++){
 const wing=Math.floor(index/10),stage=index%10;let seed=(index+129)*2654435761;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},shuffle=a=>{for(let j=a.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[a[j],a[k]]=[a[k],a[j]];}return a;};
 const w=4+(stage%3),h=4+(wing>4?1:0)+(stage===9?1:0),N=w*h,adj=Array.from({length:N},()=>[]),visited=new Set([0]),stack=[0];
 while(stack.length){const n=stack[stack.length-1],x=n%w,y=Math.floor(n/w),choices=shuffle([[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<w&&b<h).map(([a,b])=>b*w+a).filter(v=>!visited.has(v)));if(!choices.length){stack.pop();continue;}const v=choices[0];adj[n].push(v);adj[v].push(n);visited.add(v);stack.push(v);}
 const parent=Array(N).fill(-1),dist=Array(N).fill(-1),q=[0];dist[0]=0;for(let j=0;j<q.length;j++)for(const v of adj[q[j]])if(dist[v]<0){dist[v]=dist[q[j]]+1;parent[v]=q[j];q.push(v);}
 let goal=dist.indexOf(Math.max(...dist)),main=[];for(let n=goal;n>=0;n=parent[n])main.push(n);main.reverse();
 const grid=Array.from({length:h*2+1},()=>Array(w*2+1).fill('#')),pt=n=>({x:(n%w)*2+1,y:Math.floor(n/w)*2+1});
 for(let n=0;n<N;n++){const p=pt(n);grid[p.y][p.x]='.';for(const v of adj[n]){const b=pt(v);grid[(p.y+b.y)/2][(p.x+b.x)/2]='.';}}
 // Mildly open some dead-end alcoves without introducing bypasses around any main-path lock.
 const mainSet=new Set(main);let side=0;const branchGroup=Array(N).fill(-1);for(let i=0;i<main.length;i++){const todo=[main[i]];branchGroup[main[i]]=i;while(todo.length){const n=todo.pop();for(const v of adj[n])if(!mainSet.has(v)&&branchGroup[v]<0){branchGroup[v]=i;todo.push(v);}}}
 if(stage%2){for(let n=0;n<N;n++){const v=n+1;if(n%w<w-1&&branchGroup[n]===branchGroup[v]&&!mainSet.has(n)&&!mainSet.has(v)&&!adj[n].includes(v)&&random()<.55){const a=pt(n),b=pt(v);grid[a.y][a.x+1]='.';side++;}}}
 const count=wing===0?1:wing===1?2:wing>=8?3:2, gates=[],boxes=[],used=new Set(), positions=[];
 for(let j=0;j<count;j++){const cut=Math.max(2,Math.min(main.length-1,Math.floor((j+1)*main.length/(count+1))));positions.push(cut);}
 let types=wing===0?['hold']:wing===1?['hold','hold']:wing===2?['key','echo']:wing===3?['hold','pulse']:wing===4?['weight','hold']:wing===5?['echo','echo']:wing===6?['latch','echo']:wing===7?['echo','pulse']:wing===8?['key','hold','pulse']:['echo',stage%2?'weight':'latch','hold'];
 if(wing>0&&stage%3===1)types=[...types].reverse();if(wing>=8&&stage%3===2)types=[...types.slice(1),types[0]];
 for(let j=0;j<count;j++){
 const cut=positions[j],a=pt(main[cut-1]),b=pt(main[cut]),pos={x:(a.x+b.x)/2,y:(a.y+b.y)/2},lo=j?positions[j-1]:0;
 let candidates=Array.from({length:N},(_,n)=>n).filter(n=>branchGroup[n]>=lo&&branchGroup[n]<cut&&!used.has(n)&&n!==0&&n!==main[cut-1]);
 // Prefer off-route dead ends; if the tree has no branch here, use a remote point behind the lock.
 candidates.sort((a,b)=>(+mainSet.has(a)-+mainSet.has(b))||adj[a].length-adj[b].length||dist[b]-dist[a]);
 let node=(types[j]==='weight'?candidates.find(n=>adj[n].length===1&&!mainSet.has(n)):undefined)??candidates[stage%Math.min(candidates.length,2)]??main[Math.max(lo,cut-2)];used.add(node);let type=types[j];
 if(type==='weight'&&(adj[node].length!==1||mainSet.has(node)))type='echo';
 const g={...pos,id:j,type,plate:pt(node),key:pt(node),period:4,on:2,phase:(stage+j)%4};
 if(type==='weight'){const v=pt(adj[node][0]),p=pt(node);boxes.push({x:(p.x+v.x)/2,y:(p.y+v.y)/2});}
 gates.push(g);
 }
 const memory=wing===7?60:240;
 levels.push({id:index,name:(wing===0?titles[stage]:wings[wing]+' · '+titles[stage]),wing:wing+1,wingName:wings[wing],grid:grid.map(a=>a.join('')),start:pt(0),goal:pt(goal),gates,boxes,memory,seed:index+129,brief:wing===0?'Record a walk to the amber plate, then commit your echo. It repeats your route and stays on the plate.':wing===1?'Two remote plates. Give each one an echo, then cross both doors.':wing===2?'Keys belong to the live robot. An echo cannot pick one up for you.':wing===3?'Pulse doors alternate every two turns. Wait safely beside them.':wing===4?'Push the striped crate into its socket. Your echo repeats the push after rewinding.':wing===5?'Blue receivers respond only to echoes. Standing on one yourself will not open its door.':wing===6?'Purple switches latch for this run. Rewinding resets them; echoes do not operate them.':wing===7?'A shorter recording budget. Choose your route before you spend your turns.':wing===8?'Combine a key detour, a remote echo and a pulsing barrier.': 'Three circuits. Plan your recordings so the earlier ones help you reach the later controls.'});
}
return levels;
});

/* Seeded connected-pattern constructor and constraint-based fill solver. No network. */
(function(root){
'use strict';
const LEVELS=[
 {size:5,words:4,tier:1,max:3,label:'First letters'},
 {size:7,words:8,tier:1,max:5,label:'Little connections'},
 {size:9,words:12,tier:1,max:7,label:'A wider world'},
 {size:9,words:15,tier:2,max:8,label:'Getting warmer'},
 {size:11,words:18,tier:2,max:9,label:'Read between lines'},
 {size:11,words:21,tier:2,max:10,label:'Twists & turns'},
 {size:13,words:28,tier:3,max:11,label:'Double meanings'},
 {size:13,words:32,tier:3,max:11,label:'The long game'},
 {size:15,words:37,tier:3,max:12,label:'Weekend workout'},
 {size:15,words:44,tier:3,max:13,label:'Expert territory'}
];
function hash(s){let a=2166136261;for(const c of String(s)){a^=c.charCodeAt(0);a=Math.imul(a,16777619);}return a>>>0;}
function rng(seed){let a=hash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function config(level){return LEVELS[Math.min(9,Math.max(0,level))];}
function carve(bank,cfg,random){
 const n=cfg.size,g=Array.from({length:n},()=>Array(n).fill('')),mask=Array.from({length:n},()=>Array(n).fill(0)),placed=[],used=new Set();
 const words=shuffled(bank.filter(w=>w.tier<=cfg.tier&&w.answer.length<=Math.min(cfg.max,n-2)&&w.answer.length>=3),random);
 const seed=words.find(w=>w.answer.length>=Math.min(5,cfg.max))||words[0];
 function set(w,row,col,dir){for(let k=0;k<w.answer.length;k++){let y=row+(dir==='down'?k:0),x=col+(dir==='across'?k:0);g[y][x]=w.answer[k];mask[y][x]|=dir==='across'?1:2;}placed.push({row,col,dir,answer:w.answer});used.add(w.answer);}
 set(seed,Math.floor(n/2),Math.floor((n-seed.answer.length)/2),'across');
 function fit(w,row,col,dir){let dr=dir==='down'?1:0,dc=1-dr,len=w.answer.length;if(row<0||col<0||row+dr*(len-1)>=n||col+dc*(len-1)>=n)return null;
 let br=row-dr,bc=col-dc,ar=row+dr*len,ac=col+dc*len;if((g[br]&&g[br][bc])||(g[ar]&&g[ar][ac]))return null;
 let hits=0;for(let k=0;k<len;k++){let y=row+dr*k,x=col+dc*k;if(g[y][x]){if(g[y][x]!==w.answer[k]||(mask[y][x]&(dir==='across'?1:2)))return null;hits++;}else if(dir==='across'){if((g[y-1]&&g[y-1][x])||(g[y+1]&&g[y+1][x]))return null;}else if(g[y][x-1]||g[y][x+1])return null;}
 if(!hits)return null;return hits;
 }
 let rounds=0;
 while(placed.length<cfg.words&&rounds++<cfg.words*2){
 let options=[];
 for(const w of words){if(used.has(w.answer))continue;for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(!g[y][x])continue;for(let k=0;k<w.answer.length;k++){if(w.answer[k]!==g[y][x])continue;for(const dir of ['across','down']){let row=y-(dir==='down'?k:0),col=x-(dir==='across'?k:0),hits=fit(w,row,col,dir);if(hits!==null){const cy=row+(dir==='down'?(w.answer.length-1)/2:0),cx=col+(dir==='across'?(w.answer.length-1)/2:0);options.push({w,row,col,dir,score:hits*4+(hits/w.answer.length)*4+w.answer.length*.08-Math.abs(cy-n/2)*.07-Math.abs(cx-n/2)*.07+random()*2});}}}}}
 if(!options.length)break;options.sort((a,b)=>b.score-a.score);let o=options[Math.floor(random()*Math.min(5,options.length))];set(o.w,o.row,o.col,o.dir);
 }
 return {grid:g,placed};
}
function extract(g){let n=g.length,slots=[],numbers={};let num=0;for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(!g[y][x])continue;let a=(x===0||!g[y][x-1])&&x+1<n&&g[y][x+1],d=(y===0||!g[y-1][x])&&y+1<n&&g[y+1][x];if(!a&&!d)continue;numbers[y+','+x]=++num;for(const dir of ['across','down']){if(!(dir==='across'?a:d))continue;let cells=[],answer='',yy=y,xx=x;while(yy<n&&xx<n&&g[yy][xx]){cells.push([yy,xx]);answer+=g[yy][xx];yy+=dir==='down'?1:0;xx+=dir==='across'?1:0;}slots.push({id:num+'-'+dir,number:num,dir,row:y,col:x,length:cells.length,cells,answer});}}return {slots,numbers};}
function fill(pattern,bank,random){
 const slots=extract(pattern).slots,n=pattern.length,g=Array.from({length:n},()=>Array(n).fill('')),used=new Set(),chosen=new Map(),byLength={};let nodes=0;const maxNodes=1800;
 for(const w of bank)(byLength[w.answer.length]||(byLength[w.answer.length]=[])).push(w.answer);
 const pools=slots.map(s=>{let p=shuffled(byLength[s.length]||[],random);let i=p.indexOf(s.answer);if(i>=0)p.splice(i,1);p.splice(Math.min(1,p.length),0,s.answer);return p;});
 function possible(s,w){if(used.has(w))return false;return s.cells.every(([y,x],k)=>!g[y][x]||g[y][x]===w[k]);}
 function search(){if(++nodes>maxNodes)return false;if(chosen.size===slots.length)return true;let best=-1,opts=null;for(let i=0;i<slots.length;i++){if(chosen.has(i))continue;let p=pools[i].filter(w=>possible(slots[i],w));if(!p.length)return false;if(!opts||p.length<opts.length){best=i;opts=p;if(p.length===1)break;}}
 const s=slots[best];for(const w of opts){let before=s.cells.map(([y,x])=>g[y][x]);s.cells.forEach(([y,x],k)=>g[y][x]=w[k]);chosen.set(best,w);used.add(w);if(search())return true;chosen.delete(best);used.delete(w);s.cells.forEach(([y,x],k)=>g[y][x]=before[k]);if(nodes>maxNodes)break;}return false;}
 if(search())return {grid:g,nodes,refilled:true};return {grid:pattern.map(r=>r.slice()),nodes,refilled:false};
}
function validate(puzzle,bank){
 const errors=[],lookup=new Set(bank.map(w=>w.answer)),{grid,slots}=puzzle,n=grid.length;const seen=new Set();let count=0;
 for(const row of grid)for(const c of row)if(c)count++;
 for(const s of slots){if(s.length<3)errors.push('Short entry');if(!lookup.has(s.answer))errors.push('Unknown answer '+s.answer);if(seen.has(s.answer))errors.push('Duplicate '+s.answer);seen.add(s.answer);if(s.cells.map(([y,x])=>grid[y][x]).join('')!==s.answer)errors.push('Fill mismatch');if(!s.clue)errors.push('Missing clue');}
 const ext=extract(grid).slots;if(ext.length!==slots.length)errors.push('Unclued run');for(const s of ext)if(!slots.some(t=>t.row===s.row&&t.col===s.col&&t.dir===s.dir&&t.answer===s.answer))errors.push('Run differs');
 let first=null;for(let y=0;y<n&&!first;y++)for(let x=0;x<n;x++)if(grid[y][x]){first=[y,x];break;}
 const visited=new Set(),queue=first?[first]:[];while(queue.length){let[y,x]=queue.shift(),key=y+','+x;if(visited.has(key))continue;visited.add(key);for(const[dy,dx]of[[0,1],[0,-1],[1,0],[-1,0]])if(grid[y+dy]&&grid[y+dy][x+dx])queue.push([y+dy,x+dx]);}if(visited.size!==count)errors.push('Disconnected pattern');
 const coverage={};for(const s of slots)for(const[y,x]of s.cells)coverage[y+','+x]=(coverage[y+','+x]||0)+1;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(grid[y][x]&&!coverage[y+','+x])errors.push('Orphan letter');for(const s of slots)if(slots.length>1&&!s.cells.some(([y,x])=>coverage[y+','+x]>1))errors.push('Uncrossed word');
 const checkedLetters=Object.values(coverage).filter(v=>v>1).length;return {valid:!errors.length,errors,letters:count,words:slots.length,checkedLetters,checkedRatio:count?checkedLetters/count:0};
}
function generate(bank,level=0,seed=String(Date.now())){
 const cfg=config(level),random=rng(seed+'|'+level);let best=null;
 for(let attempt=0;attempt<5;attempt++){const p=carve(bank,cfg,random);if(!best||p.placed.length>best.placed.length)best=p;if(p.placed.length>=cfg.words)break;}
 const allowed=bank.filter(w=>w.tier<=cfg.tier&&w.answer.length<=cfg.max);const solved=fill(best.grid,allowed,random),e=extract(solved.grid),lookup=new Map(bank.map(w=>[w.answer,w]));const hardChance=Math.min(.98,level/8.5);
 const slots=e.slots.map(s=>{const w=lookup.get(s.answer),hard=level>1&&random()<hardChance;return{...s,clue:hard?w.hard:w.easy,clueStyle:hard?'wordplay':'straight'};});
 const puzzle={version:1,seed:String(seed),level,size:cfg.size,grid:solved.grid,slots,numbers:e.numbers,title:cfg.label,solverNodes:solved.nodes};const check=validate(puzzle,bank);if(!check.valid)throw Error(check.errors.join('; '));return puzzle;
}
const api={generate,validate,config,LEVELS,extract};root.CrosswordGenerator=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

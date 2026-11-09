/* Headless behavioral checks using the shipped UI event handlers and animation loop.
   Run: node test.cjs. No browser packages required. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const sourceDir=__dirname;
let now=0,nextFrame;
const classes=()=>({values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)},toggle(v,on){on===undefined?this.values.has(v)?this.values.delete(v):this.values.add(v):on?this.values.add(v):this.values.delete(v)}});
const noop=()=>{};
const canvasCtx=new Proxy({},{get:(target,key)=>target[key]||noop,set:(target,key,value)=>(target[key]=value,true)});
const nodes=new Map(),dynamic=new Map(),events={};
class Element{
 constructor(id=''){this.id=id;this.style={};this.classList=classes();this.dataset={};this.open=false;this.hidden=false;this._html='';this.children=[];this.handlers={};}
 getContext(){return canvasCtx}
 addEventListener(type,fn){this.handlers[type]=fn}
 showModal(){this.open=true}
 close(){this.open=false}
 click(){if(this.onclick)this.onclick({target:this})}
 set innerHTML(value){this._html=value;this.children=[];const tags=/<(button|canvas)\b([^>]+)>/g;let match;while((match=tags.exec(value))){const child=new Element(),attrs=match[2];child.disabled=/\bdisabled\b/.test(attrs);for(const attr of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))child.dataset[attr[1].replace(/-([a-z])/g,(_,v)=>v.toUpperCase())]=attr[2];this.children.push(child);}dynamic.set(this.id,this.children);}
 get innerHTML(){return this._html}
}
const html=fs.readFileSync(path.join(sourceDir,'index.html'),'utf8');
for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],new Element(match[1]));
const defenses=['left','brace','right'].map(action=>{const n=new Element();n.dataset.defense=action;return n;});
const arenaWrap=new Element();
const document={hidden:false,getElementById:id=>nodes.get(id),addEventListener:(type,fn)=>{events[type]=fn},querySelector:s=>s==='.arena-wrap'?arenaWrap:null,querySelectorAll:s=>{if(s==='[data-defense]')return defenses;const match=/\[data-([\w-]+)\]/.exec(s);if(!match)return [];return [...dynamic.values()].flat().filter(n=>Object.hasOwn(n.dataset,match[1]));},createElement:()=>new Element()};
const storage=new Map();
const context={document,window:{scrollTo:noop},performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:fn=>{nextFrame=fn},setTimeout:noop,Blob,URL,console,Math};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(sourceDir,'data.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(sourceDir,'game.js'),'utf8'),context);
const state=()=>context.window.SlapCircuit.getState();
const frame=()=>{now+=16;const fn=nextFrame;fn(now)};
const until=(predicate,max=3000)=>{let count=0;while(!predicate()){assert.ok(count++<max,'State did not converge: '+JSON.stringify(state()));frame();}};
const key=k=>events.keydown({key:k,preventDefault:noop,repeat:false});
const clickData=(name,value)=>{const node=document.querySelectorAll('[data-'+name+']').find(n=>n.dataset[name]===String(value));assert.ok(node,'Missing UI action '+name+'='+value);assert.ok(!node.disabled,'Action is disabled '+name+'='+value);node.click();};
function perfectAttack(){until(()=>Math.abs(state().meterPosition-state().target)<state().width*.13);key(' ');assert.equal(state().phase,'attackResult');}
function perfectDefense(){until(()=>state().phase==='windup'||state().phase==='over');if(state().phase==='over')return;until(()=>state().age>=state().windup-16);const attack=state().enemyAttack;key({left:'ArrowLeft',right:'ArrowRight',brace:'ArrowDown'}[attack]);const first=state().defense;key(attack==='left'?'ArrowRight':'ArrowLeft');assert.equal(state().defense.action,first.action,'Defense must lock the first input');until(()=>state().phase==='defenseResult');assert.equal(state().hp,state().maxHp,'Perfect reads should avoid damage');until(()=>state().phase==='choose'||state().phase==='over');}
const data=context.window.SLAP_DATA;
// Validation rejects malformed or impossible kit input.
assert.equal(context.window.SlapCircuit.validateSave({}),false);
// Misses spend the equipped move, and an early locked defense is punished.
clickData('fight',0);
clickData('slap','snap');
key(' ');
assert.equal(state().enemyHp,state().r.hp,'A mistimed slap should miss');
assert.deepEqual(Array.from(state().used),['snap'],'A miss still consumes the move');
until(()=>state().phase==='windup');
key('ArrowLeft');key('ArrowRight');
assert.equal(state().defense.action,'left','Repeated input must not replace the first commitment');
until(()=>state().phase==='defenseResult');
assert.ok(state().hp<state().maxHp,'Early defense must take damage');
until(()=>state().phase==='choose');
const hpAfterEarlyRead=state().hp;
nodes.get('restBtn').click();
until(()=>state().phase==='windup');
until(()=>state().age>=state().windup-16);
key({left:'ArrowLeft',right:'ArrowRight',brace:'ArrowDown'}[state().enemyAttack]);
until(()=>state().phase==='choose');
assert.equal(state().turn,2,'Recovery must consume a fixed turn');
assert.deepEqual(Array.from(state().used),['snap'],'Recovery cannot immediately refresh the kit');
assert.equal(state().hp,hpAfterEarlyRead,'A later correct defense must avoid damage');
nodes.get('leaveBtn').click();nodes.get('acceptConfirm').click();nodes.get('resultClose').click();
assert.equal(JSON.parse(storage.get('daft-slap-circuit-v1')).losses,1,'Forfeit must persist a loss');
nodes.get('resetBtn').click();nodes.get('acceptConfirm').click();
clickData('fight',0);
const pausedAt=state().age;nodes.get('pauseBtn').click();for(let i=0;i<50;i++)frame();assert.equal(state().age,pausedAt,'Pause must stop combat time');nodes.get('pauseBtn').click();
document.hidden=true;events.visibilitychange();assert.equal(state().paused,true,'Hiding tab must pause');document.hidden=false;nodes.get('pauseBtn').click();
let roundsChecked=0,turns=0;
for(let rival=0;rival<10;rival++){
 if(rival>0)clickData('fight',rival);
 let safety=0;
 while(state().phase!=='over'){
  assert.ok(safety++<200,'Bout failed to finish');
  const before=state();
  if(before.phase==='choose'){
   if(before.turn===0&&before.round>1){assert.equal(before.used.length,0,'Kit must refresh on round boundary');roundsChecked++;}
   const options=data.slaps.filter(s=>['snap','hook','palm'].includes(s.id)&&!before.used.includes(s.id)&&s.cost<=before.stamina);
   const score=s=>{let modifier=1;if(before.guard==='high')modifier=s.id==='palm'?1.4:s.id==='hook'?.25:1;if(before.guard==='low')modifier=s.id==='hook'?1.4:1;if(before.guard==='counter')modifier=s.id==='snap'?1.4:s.id==='palm'?.05:1;return s.power*modifier;};
   options.sort((a,b)=>score(b)-score(a));
   if(options.length){clickData('slap',options[0].id);const after=state();assert.equal(after.used.length,before.used.length+1);assert.equal(after.stamina,before.stamina-options[0].cost);perfectAttack();}
   else nodes.get('restBtn').click();
   turns++;
  }
  perfectDefense();
 }
 assert.equal(nodes.get('resultTitle').textContent,'VICTORY!','A perfect-read player should beat every rival');
 nodes.get('resultClose').click();
 const save=JSON.parse(storage.get('daft-slap-circuit-v1'));assert.equal(save.unlocked,rival+1);assert.equal(save.wins,rival+1);assert.equal(save.losses,0);assert.ok(context.window.SlapCircuit.validateSave(save));
}
const finalSave=JSON.parse(storage.get('daft-slap-circuit-v1'));
assert.equal(finalSave.beaten.length,10);assert.ok(roundsChecked>0);
// Career upgrades are affordable with normal first-win purses, not mandatory grinding.
clickData('upgrade','power');
const upgraded=JSON.parse(storage.get('daft-slap-circuit-v1'));assert.equal(upgraded.stats.power,1);assert.equal(upgraded.cash,finalSave.cash-70);
clickData('kit','feint');assert.ok(JSON.parse(storage.get('daft-slap-circuit-v1')).kit.includes('feint'));
console.log(JSON.stringify({result:'PASS',rivalsBeaten:10,turns,roundRefreshChecks:roundsChecked,perfectDefenseDamage:0,firstWinPurse:finalSave.cash,checks:['valid saves','miss consumes move','early defense takes damage','recovery consumes a turn','forfeit persists loss','confirmed career reset','pause and visibility pause','one locked defense','timing damage','stamina costs','round kit refresh','10-rival ending','upgrade purchase','move kit change']},null,2));

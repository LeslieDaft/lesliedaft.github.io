const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {lanternDim,capturePose,pressEdge}=require('./horror.js');
assert.equal(lanternDim(8,2),0);
assert.ok(lanternDim(1,2)>0);
for(let t=0;t<20;t+=.02)assert.ok(lanternDim(0,t)>=0&&lanternDim(0,t)<=.56);
assert.equal(pressEdge(true,false),false);assert.equal(pressEdge(false,true),false);assert.equal(pressEdge(false,false),true);
assert.equal(capturePose(.5).pull,0);assert.ok(capturePose(2).pull>.8);assert.equal(capturePose(3.4).close,1);assert.equal(capturePose(3.8).done,true);
const events={},docEvents={},storage=new Map(),elements=new Map();
const gradient={addColorStop(){}};
const draw=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(t,k)=>t[k]||(()=>{})});
function el(id){if(!elements.has(id))elements.set(id,{id,value:id==='quality'?'low':id==='difficulty'?'normal':'',style:{},dataset:{},classList:{toggle(){},remove(){}},getContext:()=>draw,getBoundingClientRect:()=>({width:500,height:500}),addEventListener(){},setPointerCapture(){}});return elements.get(id)}
const touch=[{...el('touchE'),dataset:{key:'e'}}];
const sandbox={console,URLSearchParams,location:{search:'?qa'},innerWidth:1000,innerHeight:800,devicePixelRatio:1,Math,Date,Int32Array,Float32Array,Uint8ClampedArray,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 addEventListener:(type,fn)=>{events[type]=fn},requestAnimationFrame(){},
 document:{body:{classList:{toggle(){},remove(){}}},getElementById:el,createElement:()=>({width:128,height:128,getContext:()=>draw}),addEventListener:(type,fn)=>{docEvents[type]=fn},querySelectorAll:s=>s==='[data-key]'?touch:[],exitPointerLock(){this.pointerLockElement=null;docEvents.pointerlockchange?.()},pointerLockElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/horror.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox),key=(repeat=false)=>events.keydown({key:'e',repeat,preventDefault(){}});
sandbox.labyrinthQA.hideScenario();key();sandbox.labyrinthQA.step(.016);assert.equal(sandbox.labyrinthQA.snapshot().hidden,true,'one tap enters');
key(true);sandbox.labyrinthQA.step(.016);assert.equal(sandbox.labyrinthQA.snapshot().hidden,true,'held/repeated E stays hidden even after pointer lock clears keys');
events.keyup({key:'e'});key();sandbox.labyrinthQA.step(.016);assert.equal(sandbox.labyrinthQA.snapshot().hidden,false,'next tap exits');
sandbox.labyrinthQA.hideScenario();touch[0].onpointerdown({preventDefault(){},pointerId:1});sandbox.labyrinthQA.step(.016);assert.equal(sandbox.labyrinthQA.snapshot().hidden,true,'touch tap enters');sandbox.labyrinthQA.step(.2);assert.equal(sandbox.labyrinthQA.snapshot().hidden,true,'holding touch does not exit');touch[0].onpointerup();touch[0].onpointerdown({preventDefault(){},pointerId:1});sandbox.labyrinthQA.step(.016);assert.equal(sandbox.labyrinthQA.snapshot().hidden,false,'next touch tap exits');touch[0].onpointerup();
// Preserve original three-hit survival: only the lethal contact starts the sequence.
run('start();guardian={...p};time=13;health=100;invuln=0;update(.001)');assert.equal(sandbox.labyrinthQA.snapshot().capture,false);assert.equal(sandbox.labyrinthQA.snapshot().health,65);
run('invuln=0;update(.001)');assert.equal(sandbox.labyrinthQA.snapshot().health,30);assert.equal(sandbox.labyrinthQA.snapshot().capture,false);
run('invuln=0;update(.001)');assert.equal(sandbox.labyrinthQA.snapshot().capture,true);assert.equal(sandbox.labyrinthQA.snapshot().playing,true);
for(const t of [.1,1.2,2.8,3.5])run(`renderCapture(${t})`);
sandbox.labyrinthQA.step(3.9);assert.equal(sandbox.labyrinthQA.snapshot().playing,false,'death menu follows teeth animation');
// New presentation retains usable saves and the original paper maze flow.
run("mode='book';start()");assert.equal(run('validSave(readSave(),mode)'),true);assert.equal(sandbox.labyrinthQA.snapshot().mode,'book');
console.log('Labyrinth: flicker, capture timing, three-hit survival, keyboard/touch hide toggles, and book saves passed.');

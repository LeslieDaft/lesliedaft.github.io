import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createDOM} from './qa-minidom.mjs';

export function loadGame(file = new URL('../play.html', import.meta.url).pathname, { storageThrows = false, storageSeed = {}, width = 1280, height = 720, canvasContext = null, canvasFactory = null } = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const events = new Map();
  const gradient = { addColorStop() {} };
  const canvas = canvasContext ?? new Proxy({ measureText: text => ({ width: String(text).length * 8 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient }, { get: (target, key) => key in target ? target[key] : () => {} });
  const {document,elements,docListeners,parseHTML}=createDOM({width,height,canvas,canvasFactory});
  parseHTML(html);
  const element=id=>document.getElementById(id);
  const saved = new Map(Object.entries(storageSeed));
  const localStorage = { getItem(k) { if (storageThrows) throw Error('Storage blocked'); return saved.get(k) ?? null; }, setItem(k, v) { if (storageThrows) throw Error('Storage blocked'); saved.set(k, String(v)); }, removeItem(k) { if (storageThrows) throw Error('Storage blocked'); saved.delete(k); } };
  let now = 0;
  const raf = [];
  const timers = new Map();
  let timerId = 0;
  function audioNode() { return { connect() {}, disconnect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} }, Q: { value: 0 } }; }
  class AudioContext { constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; this.sampleRate = 44100; } resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); } createOscillator() { return audioNode(); } createGain() { return audioNode(); } createBiquadFilter() { return audioNode(); } createBufferSource() { return audioNode(); } createBuffer(_, size) { return { getChannelData: () => new Float32Array(size) }; } }
  const ctx = { console, document, localStorage, navigator: { maxTouchPoints: 1 }, location: { search: '', href: 'http://localhost/' }, performance: { now: () => now }, innerWidth: width, innerHeight: height, devicePixelRatio: 1, AudioContext, webkitAudioContext: AudioContext, URLSearchParams, setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => ++timerId, clearInterval() {}, requestAnimationFrame: fn => { raf.push(fn); return raf.length; }, cancelAnimationFrame() {}, addEventListener: (name, fn, capture=false) => events.set(name, capture?[fn,...(events.get(name)||[])]:[...(events.get(name)||[]),fn]), removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), screen: { orientation: { lock: () => Promise.resolve() } }, HTMLElement: class {}, Element: class {}, Blob, URL, TextDecoder, FileReader: class {} , crypto: { randomUUID: () => 'qa-'+(++timerId) }, structuredClone: value=>JSON.parse(JSON.stringify(value)), confirm: () => true, alert() {}, prompt: () => null };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  const sandbox = vm.createContext(ctx);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < scripts.length; i++) {
    const src=scripts[i][1].match(/src=[\"']([^\"']+)[\"']/i)?.[1];
    if(src && !/^https?:/.test(src)){const filename=path.resolve(path.dirname(file),src.replace(/\?.*$/,'')); if(fs.existsSync(filename))vm.runInContext(fs.readFileSync(filename,'utf8'),sandbox,{filename,timeout:5000});}
    else if(!src && scripts[i][2].trim()) vm.runInContext(scripts[i][2], sandbox, { filename: `geometry-inline-${i}.js`, timeout: 5000 });
  }
  return { sandbox, elements, saved, raf, timers, events, docListeners, advance(ms = 1000 / 60) { now += ms; const fn = raf.shift(); if (fn) fn(now); }, fire(target, name, props = {}) { let stopped=false; const event = { preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() { stopped=true; }, key: '', code: '', target: element('body'), pointerId: 1, ...props }; const listeners = target === 'window' ? events : target === 'document' ? docListeners : element(target).listeners; for (const fn of listeners.get(name) || []) {if(stopped)break;fn(event);} } };
}

const clone = x => JSON.parse(JSON.stringify(x));
export function runPhysicsQA(game) {
  const t=game.sandbox.GD2_TEST;
  assert.ok(t, 'Game exports actual simulation hooks');
  assert.equal(t.levels.length,15,'15 built-in levels');
  assert.equal(new Set(t.levels.map(l=>l.id)).size,15,'Unique campaign IDs');
  assert.equal(t.DT,1/240);
  const referenceDt=1/240;
  let metrics=[];
  for(const bpm of [80,112,140,180,240]) {
    const level={...clone(t.levels[0]), bpm,end:20000,hazards:[],portals:[],coins:[]};
    const s=t.makeState(level);
    const initialY=s.y;
    let minY=s.y, landingX=null, elapsed=0;
    for(let n=0;n<240;n++){
      t.stepState(s,{held:n===0,tap:n===0},referenceDt,level);
      minY=Math.min(minY,s.y);elapsed+=referenceDt;
      if(landingX===null && n>1 && s.onSurface)landingX=s.x;
    }
    assert.equal(s.dead,false,`BPM ${bpm}: harmless level`);
    assert.ok(Math.abs(s.x-330)<1e-6,`BPM ${bpm}: 330 px/sec, observed ${s.x}`);
    assert.ok(initialY-minY>68&&initialY-minY<73,`BPM ${bpm}: ~71 px apex, observed ${initialY-minY}`);
    assert.ok(landingX>145&&landingX<152,`BPM ${bpm}: ~149px jump range, observed ${landingX}`);
    assert.ok(Math.abs(t.pixelsPerBeat(level)-330*60/bpm)<1e-6,'Beat grid derives from real speed');
    metrics.push({bpm,speed:s.x,apex:initialY-minY,range:landingX});
  }
  for(let i=1;i<metrics.length;i++)assert.deepEqual({...metrics[i],bpm:0},{...metrics[0],bpm:0},'BPM changes audio spacing but not physics');
  console.log('PASS real-time physics: 330px/s,',Math.round(metrics[0].apex*10)/10+'px apex,',Math.round(metrics[0].range*10)/10+'px range at five BPMs.');
  let checkpoints=0,trajectoryCount=0,coinTotal=0;
  const trajectories=[];
  for(const hz of [30,60,120,240]) for(let i=0;i<t.levels.length;i++) {
    const level=t.levels[i];
    const s=t.makeState(i);
    let saved=null,frames=0;
    while(!s.dead&&!s.complete&&frames<hz*180){
      t.stepState(s,t.autoInput(s,i),1/hz,i);
      if(!saved&&s.x>=level.end*.45)saved=t.snapshot(s);
      frames++;
    }
    assert.equal(s.dead,false,`${level.id} reference dies at ${hz}Hz x=${s.x.toFixed(1)} y=${s.y.toFixed(1)} mode=${s.mode}`);
    assert.equal(s.complete,true,`${level.id} reference completes at ${hz}Hz`);
    assert.ok(s.elapsed<180,'Full run completes before timeout');
    assert.equal(s.coins.length,level.coins.length,`${level.id} reachable coins at ${hz}Hz`);
    if(hz===240)trajectories.push({level:level.name,seconds:Math.round(s.elapsed*10)/10,hazards:level.hazards.length,portals:level.portals.length,minGateGap:Math.min(...level.hazards.filter(h=>h.type==='gate').map(h=>h.gap),Infinity),coins:s.coins.length});
    coinTotal+=s.coins.length;trajectoryCount++;
    assert.ok(saved,`${level.id} creates mid-run snapshot`);
    const restored=t.restore(saved),hazards=JSON.stringify(level.hazards);
    assert.equal(restored.dead,false);assert.equal(restored.complete,false);
    for(let n=0;!restored.dead&&!restored.complete&&n<hz*180;n++)t.stepState(restored,t.autoInput(restored,i),1/hz,i);
    assert.equal(restored.dead,false,`${level.id} checkpoint dies at ${hz}Hz x=${restored.x.toFixed(1)} y=${restored.y.toFixed(1)} mode=${restored.mode}`);
    assert.equal(restored.complete,true,`${level.id} checkpoint completes at ${hz}Hz`);
    assert.equal(JSON.stringify(level.hazards),hazards,'Checkpoint keeps collision hazards');checkpoints++;
  }
  console.log(`PASS ${trajectoryCount} normal reference trajectories, ${checkpoints} restored trajectories, ${coinTotal} reachable coins (30/60/120/240Hz).`);
  const blocked=t.makeState(0);for(let n=0;!blocked.dead&&!blocked.complete&&n<240*180;n++)t.stepState(blocked,false,referenceDt,0);
  assert.equal(blocked.dead,true,'Normal run dies when input is omitted');
  const collisionLevel={...clone(t.levels[0]),end:2000,hazards:[{type:'gate',x:70,w:40,center:180,gap:100}],portals:[{x:70,mode:'ship',gravity:1}],coins:[]};
  const atPortal=t.makeState(collisionLevel);for(let n=0;!atPortal.dead&&!atPortal.complete&&n<1000;n++)t.stepState(atPortal,false,referenceDt,collisionLevel);
  assert.equal(atPortal.dead,true,'Portal never bypasses collision hazards');
  const difficulty=[];
  for(const i of [0,4,9,14]){
    const level=t.levels[i];
    const delayed=[];
    for(const ms of [0,16.7,33.3,50,66.7,83.3,100]){
      // Record the actual reference commands and then replay with only timing displaced.
      const ref=t.makeState(i), commands=[];
      while(!ref.dead&&!ref.complete&&commands.length<240*180){const input=clone(t.autoInput(ref,i));commands.push(input);t.stepState(ref,input,referenceDt,i);}
      const s=t.makeState(i),lag=Math.round(ms/1000/referenceDt);
      for(let n=0;!s.dead&&!s.complete&&n<commands.length+lag+10;n++)t.stepState(s,n<lag?{held:false,tap:false}:commands[n-lag]||false,referenceDt,i);
      delayed.push({ms,clear:!!s.complete,percent:Math.round(s.x/level.end*100)});
    }
    difficulty.push({id:level.id,delayed});
  }
  console.log('Difficulty timing evidence:',JSON.stringify(difficulty));
  console.log('Level design evidence:',JSON.stringify(trajectories));
  const first=t.levels[0],last=t.levels.at(-1),finalGaps=last.hazards.filter(h=>h.type==='gate').map(h=>h.gap);
  assert.ok(finalGaps.length>=5,'Final has sustained flight hazards');
  assert.ok(Math.min(...finalGaps)<100,'Final flight gaps demand tighter control');
  assert.ok(last.hazards.length/last.end>first.hazards.length/first.end,'Final obstacle density higher than tutorial');
  return {metrics,trajectories,difficulty};
}

export function runUIQA(game){
  const evalGame=text=>vm.runInContext(text,game.sandbox),t=game.sandbox.GD2_TEST;
  for(let i=0;i<t.levels.length;i++){
    evalGame(`start(${i},false);state.complete=true;state.x=levels[selected].end;finish()`);
    const title=game.elements.get('complete-title').textContent;
    assert.ok(typeof title==='string'&&title.trim(),'Every completion has a title');
    assert.ok(!title.includes('undefined'),'No undefined campaign completion');
    assert.equal(evalGame('recordFor(selected).best'),100,'Normal completion writes 100%');
    game.elements.get('next-btn').click();
    if(i===t.levels.length-1)assert.equal(evalGame('phase'),'menu','Final next returns to level menu');
    else{assert.equal(evalGame('selected'),i+1,'Next starts exactly the following level');assert.equal(evalGame('phase'),'playing');}
  }
  evalGame('start(1,true)');
  game.fire('window','keydown',{code:'Space'});assert.equal(evalGame('heldInputs.size'),1);
  game.fire('window','keydown',{code:'Space',repeat:true});assert.equal(evalGame('heldInputs.size'),1);
  game.fire('window','keyup',{code:'Space'});assert.equal(evalGame('heldInputs.size'),0);
  game.fire('action-btn','pointerdown',{pointerId:21});game.fire('canvas','pointerdown',{pointerId:22});assert.equal(evalGame('heldInputs.size'),2);
  game.fire('action-btn','pointercancel',{pointerId:21});assert.equal(evalGame('heldInputs.size'),1);
  game.fire('canvas','lostpointercapture',{pointerId:22});assert.equal(evalGame('heldInputs.size'),0);
  game.fire('window','keydown',{code:'Space'});game.fire('window','keydown',{code:'Escape'});assert.equal(evalGame('phase'),'paused');assert.equal(evalGame('heldInputs.size'),0);assert.equal(evalGame('pendingTap'),false);
  const x=evalGame('state.x');for(let i=0;i<60;i++)game.advance();assert.equal(evalGame('state.x'),x,'Pause freezes physical time');
  game.fire('window','keydown',{code:'Escape'});assert.equal(evalGame('phase'),'playing');assert.equal(evalGame('heldInputs.size'),0);game.advance();assert.ok(evalGame('state.x')>x);
  game.fire('action-btn','pointerdown',{pointerId:4});game.fire('window','blur');assert.equal(evalGame('phase'),'paused');assert.equal(evalGame('heldInputs.size'),0);
  evalGame('resume()');game.sandbox.document.hidden=true;game.fire('document','visibilitychange');assert.equal(evalGame('phase'),'paused');
  evalGame('resume()');game.sandbox.document.hidden=false;
  evalGame('placeCheckpoint();state.dead=true;phase="dead"');const cx=evalGame('checkpoint.x');evalGame('pause();resume()');assert.equal(evalGame('phase'),'playing');assert.equal(evalGame('state.dead'),false);assert.equal(evalGame('state.x'),cx);assert.equal(evalGame('heldInputs.size'),0);
  evalGame('retry();goMenu()');assert.equal(evalGame('phase'),'menu');
  const custom={...clone(t.levels[0]),id:'neon',name:'QA Custom',coins:Array.from({length:5},(_,i)=>({x:200+i*100,y:344})),hazards:[],portals:[]};
  game.sandbox.GD2_EDITOR_API.play(custom,false,0);
  evalGame('state.complete=true;state.x=levels[selected].end;state.coins=[0,1,2,3,4];finish()');
  assert.equal(evalGame('levels[selected].id'),'custom:neon');
  assert.equal(evalGame('save.levels["custom:neon"].best'),100);
  assert.equal(game.elements.get('result-coins').textContent,'5/5','Custom coin denominator uses actual count');
  assert.equal(evalGame('recordFor(selected).coins.length'),5,'Custom coins beyond index2 persist');
  game.sandbox.GD2_EDITOR_API.play({...custom,id:'tiny',end:100},false,1);
  assert.equal(evalGame('state.x'),0,'Short custom cursor never starts before zero');
  assert.equal(evalGame('state.elapsed'),0);
  assert.equal(evalGame('checkpoint.x'),0);
  game.sandbox.GD2_EDITOR_API.play({...custom,id:'cursor',end:6000},false,3);
  assert.equal(evalGame('practice'),true,'Cursor testing is practice');
  assert.ok(evalGame('state.x')>0);
  assert.equal(evalGame('checkpoint.x'),evalGame('state.x'),'Practice cursor checkpoint starts at selected beat');
  evalGame('goMenu()');
  console.log('PASS 15 completion titles/next actions, keyboard/touch/multitouch, frozen pause, released resume, blur/visibility, practice restart.');
}

export function runStorageResponsiveQA(file){
  for(const seed of ['{','null','[]','{"levels": []}','{"levels":{"neon":{"best":"90","coins":[0,3,"1"],"ghost":[[1,2,3,"bad",1]]}}}']){
    const g=loadGame(file,{storageSeed:{daftGeometry20_v1:seed}});
    vm.runInContext('start(0,false);state.x=1400;saveRun();goMenu()',g.sandbox);
    const saved=JSON.parse(g.saved.get('daftGeometry20_v1'));
    assert.equal(saved.levels.neon.attempts,1);assert.ok(saved.levels.neon.best>0);
  }
  const blocked=loadGame(file,{storageThrows:true});vm.runInContext('start(0,false);pause();resume();retry();goMenu()',blocked.sandbox);
  for(const [width,height] of [[1920,1080],[1280,720],[390,844],[844,390],[320,568]]){
    const g=loadGame(file,{width,height}),v=vm.runInContext('view',g.sandbox),t=g.sandbox.GD2_TEST;
    assert.ok(v.scale>0&&Number.isFinite(v.scale));assert.ok((v.offsetY+t.FLOOR)*v.scale<=height,'Floor fits canvas');assert.ok(v.offsetY*v.scale>=0,'Ceiling fits canvas');assert.ok(v.playerX*v.scale>0&&v.playerX*v.scale<width,'Player visible');
    for(const i of [0,4,9,14])vm.runInContext(`start(${i},false);render()`,g.sandbox);
  }
  console.log('PASS malformed/disabled campaign persistence and five mobile/desktop rendering viewports.');
}

if(process.argv[1]===new URL(import.meta.url).pathname){
  const file=process.argv[2]||new URL('../play.html',import.meta.url).pathname;
  const game=loadGame(file);
  const report=runPhysicsQA(game);
  runUIQA(game);
  runStorageResponsiveQA(file);
  if(game.sandbox.GD2_EDITOR)await runEditorQA(file);
  else console.log('SKIP editor not yet integrated.');
  fs.writeFileSync(new URL('./qa-v2-report.json',import.meta.url),JSON.stringify(report,null,2));
  console.log('ALL V2 QA CHECKS PASSED.');
}

export async function runEditorQA(file){
  const game=loadGame(file),e=game.sandbox.GD2_EDITOR;
  assert.ok(e,'Editor script loaded');
  const a=e._test,evalGame=text=>vm.runInContext(text,game.sandbox);
  game.elements.get('editor-btn').click();
  assert.equal(e.isOpen(),true,'Menu button opens workshop');
  assert.equal(evalGame('phase'),'menu','Workshop freezes main game');
  game.fire('window','keydown',{code:'Space'});assert.equal(evalGame('phase'),'menu','Editor captures space before game starts');
  game.fire('window','keyup',{code:'Space'});
  const nameInput=game.elements.get('gde-name');game.fire('window','keydown',{code:'Enter',target:nameInput});assert.equal(e.isOpen(),true,'Typing fields never trigger level test');

  a.newDraft(false);const empty=clone(e.getDraft());
  assert.ok(empty.id.startsWith('custom-'));assert.equal(empty.hazards.length,0);
  for(const [i,kind]of ['spike','double','triple','ceiling','ceiling-double','gate','beam','cube','ship','ball','coin'].entries())a.addAt(kind,2+i*2,kind==='coin'?200:180);
  assert.equal(e.getDraft().hazards.length,7);assert.equal(e.getDraft().portals.length,3);assert.equal(e.getDraft().coins.length,1);
  assert.ok(!JSON.stringify(e.getDraft()).includes('_eid'),'Export schema strips internal selection identities');
  let before=clone(e.getDraft());a.updateSelected({beat:23,y:220});let after=clone(e.getDraft());assert.notDeepEqual(before,after);assert.equal(a.undo(),true);assert.deepEqual(clone(e.getDraft()),before);assert.equal(a.redo(),true);assert.deepEqual(clone(e.getDraft()),after);
  assert.throws(()=>a.updateSelected({y:999}),/height|number/);assert.deepEqual(clone(e.getDraft()),after,'Invalid property leaves draft unchanged');
  const refs=a.getInternal(),gate=refs.hazards.find(h=>h.type==='gate');a.selectIds([gate._eid]);a.updateSelected({gap:100,center:180,w:60});
  const gateBefore=clone(e.getDraft());assert.throws(()=>a.updateSelected({gap:400}),/gap/);assert.deepEqual(clone(e.getDraft()),gateBefore);
  a.selectIds([refs.hazards[0]._eid,refs.hazards[1]._eid]);const count=e.getDraft().hazards.length;
  a.duplicateSelection();assert.equal(e.getDraft().hazards.length,count+2);a.moveSelection(100,0);a.deleteSelection();assert.equal(e.getDraft().hazards.length,count);a.undo();assert.equal(e.getDraft().hazards.length,count+2);
  a.wheel({ctrlKey:true,deltaY:-1,offsetX:300,preventDefault(){}});assert.ok(a.getState().zoom>1);
  a.newDraft(false);assert.equal(a.getState().zoom,1,'New draft resets drawing scale');const item=a.addAt('coin',2,180);const placed=clone(e.getDraft());
  a.setTool('select');const scale=(720-70)/360;
  const ev=(x,y,extra={})=>({clientX:x,clientY:y,pointerId:8,button:0,preventDefault(){},stopImmediatePropagation(){},target:game.elements.get('gde-canvas'),...extra});
  a.pointerDown(ev(item.x*scale,40+item.y*scale));
  a.pointerMove(ev((item.x+330*60/128*.5)*scale,40+(item.y+24)*scale));a.pointerUp(ev((item.x+330*60/128*.5)*scale,40+(item.y+24)*scale));
  assert.ok(Math.abs(e.getDraft().coins[0].x-item.x-330*60/128*.5)<1e-4,'Pointer drag moves to snapped half-beat');
  assert.equal(e.getDraft().coins[0].y,204);
  const dragged=clone(e.getDraft());a.undo();assert.deepEqual(clone(e.getDraft()),placed);a.redo();assert.deepEqual(clone(e.getDraft()),dragged);
  a.pointerDown(ev(dragged.coins[0].x*scale,40+dragged.coins[0].y*scale));a.pointerMove(ev((dragged.coins[0].x+200)*scale,40+(dragged.coins[0].y+100)*scale));a.pointerCancel();assert.deepEqual(clone(e.getDraft()),dragged,'Cancelled touch drag rolls back draft');
  const beat=dragged.coins[0].x/(330*60/128);a.editMetadata('bpm',160);assert.ok(Math.abs(e.getDraft().coins[0].x/(330*60/160)-beat)<1e-5,'BPM edit retains beat positions');
  const good=clone(e.getDraft());assert.throws(()=>a.editMetadata('bpm',0),/BPM/);assert.deepEqual(clone(e.getDraft()),good);
  a.editMetadata('name','QA Workshop');const saved=a.saveDraft();assert.equal(a.getState().dirty,false);assert.equal(e.getSaved().length,1);assert.ok(game.saved.get(a.storageKey));
  a.editMetadata('name','Changed');assert.equal(a.getState().dirty,true);a.loadSaved(saved.id,false);assert.equal(e.getDraft().name,'QA Workshop');assert.equal(a.getState().dirty,false,'Loaded saved draft has clean baseline');
  const exported=a.exportText();assert.equal(JSON.parse(exported).format,'daft-geometry-level');const oldId=e.getDraft().id;a.importText(exported,false);assert.notEqual(e.getDraft().id,oldId,'Import creates new isolated identity');assert.equal(e.getDraft().name,saved.name);a.saveDraft();assert.equal(e.getSaved().length,2);
  a.deleteSaved(saved.id,false);assert.equal(e.getSaved().length,1);assert.throws(()=>a.loadSaved(saved.id,false),/no longer exists/);
  for(let i=0;i<15;i++){
    const builtinBefore=JSON.stringify(game.sandbox.GD2_TEST.levels[i]);a.duplicateBuiltin(i,false);const remix=e.getDraft();assert.ok(remix.id.startsWith('custom-'));assert.equal(remix.hazards.length,game.sandbox.GD2_TEST.levels[i].hazards.length);assert.equal(JSON.stringify(game.sandbox.GD2_TEST.levels[i]),builtinBefore,'Remix never edits campaign');
  }
  a.newDraft(false);a.addAt('coin',2,344);const playable=clone(e.getDraft()),history=a.getState().history;
  a.testLevel(false);assert.equal(e.isOpen(),false);assert.equal(e.isTesting(),true);assert.equal(evalGame('phase'),'playing');assert.ok(evalGame('levels[selected].id').startsWith('custom:'));assert.equal(evalGame('practice'),false);
  evalGame('while(!state.dead&&!state.complete){stepState(state,false,DT,selected);} finish()');assert.equal(evalGame('state.complete'),true);assert.equal(game.elements.get('result-coins').textContent,'1/1');
  e.returnFromTest();assert.equal(e.isOpen(),true);assert.equal(e.isTesting(),false);assert.deepEqual(clone(e.getDraft()),playable);assert.equal(a.getState().history,history,'Return preserves undo history');
  a.setCursor(6);a.testLevel(true);assert.equal(evalGame('practice'),true);assert.ok(Math.abs(evalGame('state.x')-6*(330*60/128))<1e-4);assert.equal(evalGame('checkpoint.x'),evalGame('state.x'));e.returnFromTest();
  assert.equal(evalGame('save.levels.neon.best'),0,'Custom clear does not award campaign progress');
  const stable=clone(e.getDraft());
  const badValues=[null,[],{}, {...stable,bpm:'128'},{...stable,bpm:NaN},{...stable,bpm:Infinity},{...stable,end:-1},{...stable,end:1e9},{...stable,name:''},{...stable,name:'a'.repeat(49)},{...stable,color:'red'},{...stable,theme:'unknown'},{...stable,hazards:[{type:'spike',x:-1,w:30,h:30,side:'floor'}]},{...stable,hazards:[{type:'gate',x:200,w:30,gap:20,center:180}]},{...stable,hazards:[{type:'gate',x:200,w:30,gap:100,center:10}]},{...stable,hazards:[{type:'beam',x:200,w:30,h:300,y:100}]},{...stable,portals:[{x:200,mode:'wave',gravity:1}]},{...stable,portals:[{x:200,mode:'cube',gravity:0}]},{...stable,coins:[{x:stable.end+1,y:100}]},{...stable,coins:[{x:200,y:-1}]},{...stable,cues:[{beat:999,text:'Bad cue',mode:'cube'}]},{...stable,cues:[{beat:0,text:'Bad cue',mode:'bad'}]},{format:'other',version:1,level:stable},{format:'daft-geometry-level',version:2,level:stable}];
  for(const value of badValues)assert.throws(()=>e.validate(value),'Malformed/out-of-bounds data rejects');
  for(const text of ['{','null','[]',JSON.stringify({...stable,hazards:Array(2501).fill({type:'spike',x:200,w:30,h:30,side:'floor'})}),JSON.stringify({...stable,coins:Array(257).fill({x:200,y:180})}),' '.repeat(2*1024*1024+1)]){
    assert.throws(()=>a.importText(text,false));assert.deepEqual(clone(e.getDraft()),stable,'Rejected import never replaces draft');
  }
  console.log('PASS editor palette/inspector, group duplicate/move/delete, undo/redo, actual pointer drag/cancel, BPM beat preservation, CRUD persistence,15remixes, import/export, normal/cursor test and return, isolated progress,30malformed/bounds cases.');
  const blocked=loadGame(file,{storageThrows:true}),be=blocked.sandbox.GD2_EDITOR;be.open();be._test.addAt('spike',4,300);const memorySave=be._test.saveDraft();assert.equal(be._test.getState().storageWritable,false);assert.equal(be.getSaved().length,1);be._test.newDraft(false);be._test.loadSaved(memorySave.id,false);assert.equal(be.getDraft().hazards.length,1);assert.ok(be._test.exportText().length>0);
  const corrupt=loadGame(file,{storageSeed:{[a.storageKey]:'{'}});corrupt.sandbox.GD2_EDITOR.open();corrupt.sandbox.GD2_EDITOR._test.saveDraft();assert.equal(corrupt.saved.get(a.storageKey),'{','Corrupt saved data is preserved until explicit recovery');
  const reloaded=loadGame(file,{storageSeed:Object.fromEntries(game.saved)});reloaded.sandbox.GD2_EDITOR.open();assert.equal(reloaded.sandbox.GD2_EDITOR.getSaved().length,1,'Saved library reloads on next visit');
  const full=loadGame(file),fe=full.sandbox.GD2_EDITOR;fe.open();for(let i=0;i<50;i++){fe._test.newDraft(false);fe._test.saveDraft();}fe._test.newDraft(false);assert.throws(()=>fe._test.saveDraft(),/50 levels/);assert.equal(fe.getSaved().length,50);
  console.log('PASS editor blocked/corrupt storage fallback, device reload and50level capacity limit.');
  for(const [width,height]of[[1280,720],[390,844],[844,390]]){
    const g=loadGame(file,{width,height});g.sandbox.GD2_EDITOR.open();g.sandbox.GD2_EDITOR._test.duplicateBuiltin(14,false);g.advance();g.advance();assert.equal(g.elements.get('gde-canvas').width,width);assert.equal(g.elements.get('gde-canvas').height,height);
  }
  console.log('PASS workshop canvas draw at desktop/portrait/landscape sizes.');
}

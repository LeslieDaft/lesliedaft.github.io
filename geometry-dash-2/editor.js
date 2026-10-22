/* Geometry 2.0 workshop, wave portals and portable published level links. */
(()=>{
'use strict';
const STORAGE_KEY='daftGeometry20_editor_v1',MAX_BYTES=2*1024*1024,MAX_LEVELS=50;
const MODES=['cube','ship','ball','wave'],THEMES=['city','factory','cloud','glitch','core'];
const clone=value=>JSON.parse(JSON.stringify(value));
const sizeOf=text=>typeof TextEncoder==='function'?new TextEncoder().encode(text).length:encodeURIComponent(text).replace(/%[A-F\d]{2}/gi,'x').length;
const round=n=>Math.round(n*1e6)/1e6;
const bridge=()=>window.GD2_EDITOR_API;
const constants=()=>({TOP:0,FLOOR:360,HALF:16,...(bridge()?.constants||{})});
const ppb=level=>typeof bridge()?.pixelsPerBeat==='function'?bridge().pixelsPerBeat(level):330*60/level.bpm;
const cleanText=(value,max,label)=>{
 if(typeof value!=='string')throw new Error(label+' must be text.');
 const text=value.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
 if(!text||text.length>max)throw new Error(label+' must contain 1–'+max+' characters.');
 return text;
};
const num=(value,min,max,label)=>{
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(label+' must be a number from '+round(min)+' to '+round(max)+'.');
 return round(value);
};
const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(label+' must be an object.');return value;};
const list=(value,limit,label)=>{if(!Array.isArray(value)||value.length>limit)throw new Error(label+' must be a list with at most '+limit+' objects.');return value;};
const hex=(value,fallback,label)=>{if(value===undefined)return fallback;if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw new Error(label+' must be a six-digit hex color.');return value.toLowerCase();};
function validate(source){
 object(source,'Level');
 if(source.format!==undefined){
  if(source.format!=='daft-geometry-level'||source.version!==1)throw new Error('This is not a supported Geometry 2.0 level file.');
  source=object(source.level,'Level');
 }
 const {TOP,FLOOR}=constants(),bpm=num(source.bpm,60,220,'BPM');
 const level={id:typeof source.id==='string'&&/^[a-z0-9][a-z0-9_.-]{0,89}$/i.test(source.id)?source.id:makeId(),name:cleanText(source.name,48,'Level name'),bpm,end:num(source.end,ppb({bpm})*8,ppb({bpm})*512,'Level length'),difficulty:'CUSTOM • WORKSHOP',color:hex(source.color,'#79f5dc','Level color'),accent:hex(source.accent,'#a58bff','Accent color'),theme:source.theme===undefined?'city':source.theme,scale:[0,3,7,10],portals:[],hazards:[],coins:[],cues:[]};
 if(!THEMES.includes(level.theme))throw new Error('Unknown background theme.');
 if(source.scale!==undefined)level.scale=list(source.scale,8,'Music scale').map((n,i)=>num(n,0,12,'Music note '+(i+1)));
 if(!level.scale.length)throw new Error('The music scale needs at least one note.');
 const xAt=(x,width,label)=>num(x,width/2+4,level.end-width/2-4,label+' position');
 level.hazards=list(source.hazards===undefined?[]:source.hazards,2500,'Hazards').map((raw,i)=>{
  object(raw,'Hazard '+(i+1));const label='Hazard '+(i+1);
  if(!['spike','double','triple','gate','beam'].includes(raw.type))throw new Error(label+' has an unknown obstacle type.');
  const w=num(raw.w,12,240,label+' width'),h={type:raw.type,x:xAt(raw.x,w,label),w};
  if(raw.type==='gate'){
   h.gap=num(raw.gap,48,FLOOR-TOP-20,label+' gap');
   h.center=num(raw.center,TOP+h.gap/2,FLOOR-h.gap/2,label+' gap center');
  }else if(raw.type==='beam'){
   if(raw.y!==undefined&&raw.y!==TOP)throw new Error(label+' beam must start at the ceiling.');
   h.h=num(raw.h,8,FLOOR-TOP-8,label+' height');h.y=TOP;
   h.side='ceiling';h.warning=num(raw.warning===undefined?2:raw.warning,0,8,label+' warning');
  }else{
   if(!['floor','ceiling'].includes(raw.side))throw new Error(label+' needs a floor or ceiling side.');
   h.side=raw.side;h.h=num(raw.h,8,180,label+' height');
   if(raw.y!==undefined)num(raw.y,TOP,FLOOR-h.h,label+' top');
   h.y=raw.side==='floor'?FLOOR-h.h:TOP;
  }
  return h;
 }).sort((a,b)=>a.x-b.x);
 level.portals=list(source.portals===undefined?[]:source.portals,256,'Portals').map((raw,i)=>{
  object(raw,'Portal '+(i+1));if(!MODES.includes(raw.mode))throw new Error('Portal '+(i+1)+' has an unknown transformation.');
  const gravity=raw.gravity===undefined?1:raw.gravity;if(gravity!==1&&gravity!==-1)throw new Error('Portal gravity must be 1 or −1.');
  return{x:xAt(raw.x,32,'Portal '+(i+1)),mode:raw.mode,gravity};
 }).sort((a,b)=>a.x-b.x);
 level.coins=list(source.coins===undefined?[]:source.coins,256,'Coins').map((raw,i)=>{
  object(raw,'Coin '+(i+1));return{x:xAt(raw.x,24,'Coin '+(i+1)),y:num(raw.y,TOP+14,FLOOR-14,'Coin '+(i+1)+' height')};
 }).sort((a,b)=>a.x-b.x);
 const totalBeats=level.end/ppb(level);
 level.cues=list(source.cues===undefined?[]:source.cues,256,'Cues').map((raw,i)=>{
  object(raw,'Cue '+(i+1));const mode=raw.mode===undefined?'cube':raw.mode;if(!MODES.includes(mode))throw new Error('Cue '+(i+1)+' has an unknown mode.');
  return{beat:num(raw.beat,0,totalBeats,'Cue '+(i+1)+' beat'),text:cleanText(raw.text,100,'Cue '+(i+1)+' text'),mode};
 }).sort((a,b)=>a.beat-b.beat);
 if(!level.cues.some(c=>c.beat===0)){
  if(level.cues.length>=256)throw new Error('A level with 256 cues must include a cue at beat 0.');
  level.cues.unshift({beat:0,text:'YOUR LEVEL · TAP TO JUMP',mode:'cube'});
 }
 if(sizeOf(JSON.stringify(level))>MAX_BYTES)throw new Error('This level is too large. The limit is 2 MB.');
 return level;
}
let sequence=0;
function makeId(){return'custom-'+Date.now().toString(36)+'-'+(typeof crypto!=='undefined'&&crypto.getRandomValues?Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36)).join('-'):Math.random().toString(36).slice(2,12))+'-'+(++sequence).toString(36);}
const tools=[['select','↖ Select'],['erase','⌫ Erase'],['pan','✥ Pan'],['spike','▲ Spike'],['double','▲▲ Double'],['triple','▲▲▲ Triple'],['ceiling','▼ Ceiling'],['ceiling-double','▼▼ Double'],['gate','▥ Ship gate'],['beam','│ Beam'],['cube','◈ Cube'],['ship','▷ Ship'],['wave','⌁ Wave'],['ball','● Ball'],['coin','◉ Coin']];
let root,ui={},draft=null,saved=[],baseline=null,dirty=false,visible=false,testing=false,blankDraft=false;
let history=[],future=[],selection=new Set(),tool='select',snapValue=.25,cursorBeat=0,storageWritable=true,storageWarning='';
let panX=0,panY=0,zoom=1,view={w:800,h:400,scale:1,originY:48},gesture=null,spaceHeld=false,drawRequested=false;
let internalId=0;
const refs=()=>draft?[...draft.hazards.map(v=>({kind:'hazards',value:v})),...draft.portals.map(v=>({kind:'portals',value:v})),...draft.coins.map(v=>({kind:'coins',value:v}))]:[];
const selectedRefs=()=>refs().filter(r=>selection.has(r.value._eid));
const serialized=()=>draft?validate(draft):null;
function assignIds(level){for(const r of [...level.hazards,...level.portals,...level.coins])r._eid='item-'+(++internalId);return level;}
function snapshot(){return{draft:clone(draft),selection:[...selection]};}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function commit(before){
 if(!before||same(before.draft,draft))return false;
 history.push(before);if(history.length>80)history.shift();future=[];refresh();return true;
}
function undo(){if(!history.length)return false;future.push(snapshot());const old=history.pop();draft=old.draft;selection=new Set(old.selection);refresh();notice('Undid last edit.');return true;}
function redo(){if(!future.length)return false;history.push(snapshot());const next=future.pop();draft=next.draft;selection=new Set(next.selection);refresh();notice('Redid last edit.');return true;}
function notice(message,kind='info'){if(ui.status){ui.status.textContent=message;ui.status.dataset.kind=kind;}return message;}
function loadStorage(){
 try{
  const text=localStorage.getItem(STORAGE_KEY);if(text===null)return;
  if(sizeOf(text)>MAX_BYTES)throw new Error('Saved library is too large.');
  const parsed=JSON.parse(text);if(!parsed||parsed.version!==1||!Array.isArray(parsed.levels)||parsed.levels.length>MAX_LEVELS)throw new Error('Saved library format is damaged.');
  const seen=new Set();saved=parsed.levels.map(level=>{const clean=validate(level);if(!clean.id.startsWith('custom-')||seen.has(clean.id))throw new Error('Saved level IDs are invalid.');seen.add(clean.id);return clean;});
 }catch(error){saved=[];storageWritable=false;storageWarning='Saved storage could not be read. The workshop works in this tab; export your levels to keep them.';}
}
function persist(next){
 const text=JSON.stringify({version:1,levels:next});
 if(next.length>MAX_LEVELS)throw new Error('Your library holds 50 levels. Export or delete one before saving a new level.');
 if(sizeOf(text)>MAX_BYTES)throw new Error('Your saved library is full (2 MB). Export or delete a level to make room.');
 saved=next;
 if(storageWritable)try{localStorage.setItem(STORAGE_KEY,text);}catch(error){storageWritable=false;storageWarning='This browser cannot save levels to device storage. Saves stay in this tab; export a file to keep them.';}
 renderLibrary();
}
function saveDraft(){
 ensure();const clean=serialized();if(!clean.id.startsWith('custom-'))clean.id=makeId();draft.id=clean.id;
 const next=saved.filter(level=>level.id!==clean.id);next.push(clean);persist(next);baseline=JSON.stringify(clean);refresh();
 notice(storageWritable?'Saved “'+clean.name+'” on this device.':'Saved for this tab. Export a JSON file to keep your level.','success');return clone(clean);
}
function deleteSaved(id,ask=true){
 ensure();const level=saved.find(l=>l.id===id);if(!level)return false;
 if(ask&&!window.confirm('Delete saved level “'+level.name+'”? Export it first if you want to keep a copy.'))return false;
 persist(saved.filter(l=>l.id!==id));if(draft.id===id)baseline=null;refresh();notice('Deleted saved level. Your open draft is still editable.');return true;
}
function permitReplace(){return!dirty||(blankDraft&&!history.length)||window.confirm('Discard unsaved changes to this draft?');}
function setDraft(level,options={}){
 ensure();const clean=validate(level);if(options.newId!==false)clean.id=makeId();
 baseline=options.saved?JSON.stringify(clean):null;blankDraft=!!options.blank;draft=assignIds(clean);selection.clear();history=[];future=[];cursorBeat=0;panX=0;panY=0;zoom=1;resize();refresh();return serialized();
}
function newDraft(ask=true){
 ensure();if(ask&&!permitReplace())return false;
 return setDraft({id:makeId(),name:'Untitled Run',bpm:128,end:32*ppb({bpm:128}),theme:'city',color:'#79f5dc',accent:'#a58bff',scale:[0,3,7,10],hazards:[],portals:[],coins:[],cues:[{beat:0,text:'YOUR LEVEL · TAP TO JUMP',mode:'cube'}]},{newId:false,blank:true});
}
function loadSaved(id,ask=true){ensure();if(ask&&!permitReplace())return false;const level=saved.find(l=>l.id===id);if(!level)throw new Error('That saved level no longer exists.');setDraft(level,{newId:false,saved:true});notice('Opened “'+level.name+'”.');return serialized();}
function duplicateBuiltin(index,ask=true){
 ensure();if(ask&&!permitReplace())return false;const source=bridge()?.getLevels?.()[index];if(!source)throw new Error('That built-in level is not available.');
 const level=clone(source);level.name=(level.name+' Remix').slice(0,48);const result=setDraft(level);notice('Built-in copied to a new custom level. Edit and save your remix.');return result;
}
function importText(text,ask=true){
 ensure();if(typeof text!=='string'||sizeOf(text)>MAX_BYTES)throw new Error('Choose a level JSON file smaller than 2 MB.');
 let raw;try{raw=JSON.parse(text);}catch(error){throw new Error('This file is not valid JSON. Export a level from this workshop, then import that file.');}
 const level=validate(raw);if(ask&&!permitReplace())return false;const result=setDraft(level);notice('Imported “'+level.name+'” as a new draft. Save it to add it to this device.','success');return result;
}
function exportText(){ensure();return JSON.stringify({format:'daft-geometry-level',version:1,level:serialized()},null,2);}
function exportFile(){
 try{const text=exportText(),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=draft.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,60)+'.gd2.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);notice('Exported your level. Import this JSON file on another device.','success');}catch(error){notice(error.message,'error');}
}
function testLevel(fromCursor=false){
 ensure();try{const level=serialized();if(typeof bridge()?.play!=='function')throw new Error('The game is still loading. Try again in a moment.');
  const start=fromCursor?Math.min(cursorBeat,level.end/ppb(level)-.25):0;
  testing=true;visible=false;root.hidden=true;spaceHeld=false;bridge().play(level,fromCursor,start);return clone(level);
 }catch(error){visible=true;root.hidden=false;testing=false;notice(error.message,'error');return false;}
}
function open(level){
 ensure();bridge()?.openMenu?.();if(level)setDraft(level);if(!draft)newDraft(false);visible=true;testing=false;root.hidden=false;spaceHeld=false;resize();refresh();
 notice(dirty?'Draft ready. Save to keep it on this device; test any time.':'Choose a tool, then click or tap the track to build.');
}
function close(){if(!visible)return;visible=false;spaceHeld=false;gesture=null;root.hidden=true;bridge()?.openMenu?.();}
function returnFromTest(){open();notice('Back in the workshop. Your draft and undo history are preserved.');}
function ensure(){if(!root)build();}
function build(){
 root=document.createElement('section');root.id='gd2-editor';root.hidden=true;root.setAttribute('aria-label','Geometry 2.0 level editor');
 root.innerHTML=`
 <header class="gde-head"><div class="gde-brand">◈ LEVEL WORKSHOP</div><div class="gde-heading"><strong id="gde-title">Untitled Run</strong><br><span id="gde-summary">Local custom levels</span></div><div class="gde-head-actions"><button id="gde-undo" title="Undo (Ctrl/⌘ Z)">↶ Undo</button><button id="gde-redo" title="Redo (Ctrl/⌘ Shift Z)">↷ Redo</button><button id="gde-save" class="gde-primary">Save</button><button id="gde-test" class="gde-primary">▶ Test</button><button id="gde-close">Levels ✕</button></div></header>
 <nav class="gde-mobile-tabs" aria-label="Editor panels"><button data-panel="library">Library</button><button data-panel="track" aria-pressed="true">Track</button><button data-panel="inspector">Settings / selection</button></nav>
 <div class="gde-layout" data-panel="track">
 <aside class="gde-panel gde-library"><h2>MY LEVELS</h2><div class="gde-row"><button id="gde-new">＋ New level</button></div><div id="gde-saved" class="gde-saved"></div><div class="gde-row"><button id="gde-delete-saved" class="gde-danger">Delete saved</button></div><h3>REMIX A BUILT-IN</h3><label for="gde-builtin">Copy a level into your workshop</label><select id="gde-builtin"></select><div class="gde-row"><button id="gde-duplicate-builtin">Duplicate & edit</button></div><h3>MOVE BETWEEN DEVICES</h3><div class="gde-row"><button id="gde-publish">Publish / share link</button><button id="gde-export">Export JSON</button><button id="gde-import">Import JSON</button></div><input id="gde-file" class="gde-hidden" type="file" accept=".json,application/json"><p>Publish creates a playable link you can send to anyone. Saved drafts stay on this device. Export JSON for backups or very large levels.</p><div id="gde-storage" class="gde-storage-warning gde-hidden"></div><div class="gde-help"><b>SHORTCUTS</b><br>V select · E erase · H pan<br>Delete remove · Ctrl/⌘ D duplicate<br>Ctrl/⌘ Z undo · Shift Z redo<br>Ctrl/⌘ S save · Enter test<br>Hold Space to pan · wheel scroll<br>Ctrl/⌘ + wheel zoom<br>Shift-click adds to selection</div></aside>
 <div class="gde-main"><div id="gde-tools" class="gde-tools" role="toolbar" aria-label="Level building tools"></div><div class="gde-surface"><canvas id="gde-canvas" tabindex="0" aria-label="Editable level track. Select a palette tool, then click or tap to place an element."></canvas><div id="gde-canvas-tip" class="gde-canvas-tip">Select an object to edit it; drag empty space to select a group.</div></div><div class="gde-view-controls"><label>Snap <select id="gde-snap"><option value="0.125">⅛ beat</option><option value="0.25" selected>¼ beat</option><option value="0.5">½ beat</option><option value="1">1 beat</option><option value="0">Off</option></select></label><label>Zoom <input id="gde-zoom" type="range" min="0.35" max="2.5" step="0.05" value="1" style="max-width:115px"><span id="gde-zoom-label">100%</span></label><button id="gde-fit" title="Reset the view to the start">View start</button><div class="gde-scroll"><span>Timeline</span><input id="gde-scroll" type="range" min="0" max="1" step="1" value="0" aria-label="Scroll through level"><span id="gde-cursor">0.00 b</span></div></div></div>
 <aside class="gde-panel gde-inspector"><h2>LEVEL SETTINGS</h2><label for="gde-name">Name</label><input id="gde-name" maxlength="48"><div class="gde-fields"><div><label for="gde-bpm">Music BPM</label><input id="gde-bpm" type="number" min="60" max="220" step="1"></div><div><label for="gde-length">Length (beats)</label><input id="gde-length" type="number" min="8" max="512" step="0.25"></div><div><label for="gde-color">Main color</label><input id="gde-color" type="color"></div><div><label for="gde-accent">Accent color</label><input id="gde-accent" type="color"></div></div><label for="gde-theme">Background</label><select id="gde-theme"><option value="city">Neon city</option><option value="factory">Factory</option><option value="cloud">Cloud circuit</option><option value="glitch">Glitch storm</option><option value="core">Core chamber</option></select><p>Player speed stays fixed. Changing BPM keeps objects on their current beats.</p><hr style="border:0;border-top:1px solid #ffffff17;margin:17px 0"><h2>SELECTION</h2><div id="gde-selection"></div><button id="gde-test-cursor" class="gde-test-cursor">⚑ Practice from cursor</button><p>Move the cursor by tapping empty track with Select. Start-point tests always use practice.</p></aside>
 </div><div id="gde-status" class="gde-status" role="status" aria-live="polite">Ready to build.</div>`;
 document.body.append(root);
 for(const id of ['title','summary','undo','redo','save','test','close','new','saved','delete-saved','builtin','duplicate-builtin','export','import','file','storage','tools','canvas','canvas-tip','snap','zoom','zoom-label','fit','scroll','cursor','name','bpm','length','color','accent','theme','selection','test-cursor','status'])ui[id]=root.querySelector('#gde-'+id);
 for(const [id,label]of tools){const button=document.createElement('button');button.textContent=label;button.dataset.tool=id;button.setAttribute('aria-pressed',String(id===tool));button.onclick=()=>setTool(id);ui.tools.append(button);}
 for(const button of root.querySelectorAll('[data-panel]'))if(button.tagName==='BUTTON')button.onclick=()=>setPanel(button.dataset.panel);
 ui.new.onclick=()=>safe(()=>newDraft());ui.save.onclick=()=>safe(saveDraft);ui.undo.onclick=undo;ui.redo.onclick=redo;ui.test.onclick=()=>testLevel(false);ui['test-cursor'].onclick=()=>testLevel(true);ui.close.onclick=close;
 ui['delete-saved'].onclick=()=>safe(()=>deleteSaved(draft.id));ui['duplicate-builtin'].onclick=()=>safe(()=>duplicateBuiltin(Number(ui.builtin.value)));
 root.querySelector('#gde-publish').onclick=async()=>{try{const clean=validate(serialized());const bytes=new TextEncoder().encode(JSON.stringify({format:'daft-geometry-level',version:1,level:clean}));const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));const packed=new Uint8Array(await new Response(stream).arrayBuffer());let binary='';for(const b of packed)binary+=String.fromCharCode(b);const url=new URL(location.href);url.hash='level='+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');if(url.href.length>60000)throw Error('This level is too large for a share link. Use Export JSON.');const box=document.createElement('textarea');box.readOnly=true;box.value=url.href;box.setAttribute('aria-label','Playable level link');box.style.cssText='width:100%;min-height:80px';ui.status.replaceChildren(document.createTextNode('Published as a playable link — send this to anyone: '),box);box.select();try{await navigator.clipboard.writeText(url.href);}catch{} }catch(e){notice(e.message,'error');}};
 ui.export.onclick=exportFile;ui.import.onclick=()=>{ui.file.value='';ui.file.click();};
 ui.file.onchange=async()=>{const file=ui.file.files?.[0];if(!file)return;try{if(file.size>MAX_BYTES)throw new Error('This file is larger than 2 MB. Choose a smaller level file.');importText(await file.text());}catch(error){notice(error.message,'error');}};
 ui.snap.onchange=()=>{snapValue=Number(ui.snap.value);notice(snapValue?'Placement snaps every '+snapValue+' beat.':'Grid snapping off.');requestDraw();};
 ui.zoom.oninput=()=>setZoom(Number(ui.zoom.value));ui.scroll.oninput=()=>{panX=Number(ui.scroll.value);clampPan();requestDraw();};ui.fit.onclick=()=>{panX=0;panY=0;zoom=1;resize();refreshView();requestDraw();notice('View returned to the beginning.');};
 for(const key of ['name','bpm','length','color','accent','theme'])ui[key].onchange=()=>safe(()=>editMetadata(key,ui[key].value));
 ui.canvas.addEventListener('pointerdown',pointerDown);ui.canvas.addEventListener('pointermove',pointerMove);ui.canvas.addEventListener('pointerup',pointerUp);ui.canvas.addEventListener('pointercancel',pointerCancel);ui.canvas.addEventListener('lostpointercapture',pointerCancel);ui.canvas.addEventListener('contextmenu',e=>e.preventDefault());
 ui.canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',keydown,true);window.addEventListener('keyup',keyup,true);window.addEventListener('blur',()=>{spaceHeld=false;if(gesture)pointerCancel();});
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(visible)resize();}).observe(ui.canvas);else window.addEventListener('resize',()=>{if(visible)resize();});
 loadStorage();renderBuiltins();renderLibrary();
}
function safe(action){try{return action();}catch(error){notice(error.message,'error');if(draft)refresh();return false;}}
function setPanel(panel){root.querySelector('.gde-layout').dataset.panel=panel;for(const b of root.querySelectorAll('.gde-mobile-tabs button'))b.setAttribute('aria-pressed',String(b.dataset.panel===panel));if(panel==='track')resize();}
function renderBuiltins(){
 if(!ui.builtin)return;ui.builtin.textContent='';const levels=bridge()?.getLevels?.()||[];
 levels.forEach((level,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+level.name;ui.builtin.append(option);});ui['duplicate-builtin'].disabled=!levels.length;
}
function renderLibrary(){
 if(!ui.saved)return;ui.saved.textContent='';
 if(!saved.length){const p=document.createElement('p');p.textContent='Your saved custom levels appear here. Start a new level or remix a built-in.';ui.saved.append(p);}
 for(const level of saved){const button=document.createElement('button');button.dataset.id=level.id;button.classList.toggle('gde-active',draft?.id===level.id);const name=document.createElement('strong');name.textContent=level.name;const detail=document.createElement('span');detail.textContent=round(level.end/ppb(level))+' beats · '+level.bpm+' BPM · '+level.hazards.length+' hazards';button.append(name,detail);button.onclick=()=>safe(()=>loadSaved(level.id));ui.saved.append(button);}
 ui.storage.textContent=storageWarning;ui.storage.classList.toggle('gde-hidden',!storageWarning);if(draft)ui['delete-saved'].disabled=!saved.some(l=>l.id===draft.id);
}
function refresh(){
 if(!draft||!root)return;
 try{dirty=baseline!==JSON.stringify(serialized());}catch(error){dirty=true;}
 ui.title.textContent=draft.name+(dirty?' • unsaved':'');
 ui.summary.textContent=round(draft.end/ppb(draft))+' beats · '+Math.round(draft.end/330)+' seconds · '+draft.hazards.length+' hazards / '+draft.portals.length+' portals / '+draft.coins.length+' coins';
 ui.name.value=draft.name;ui.bpm.value=draft.bpm;ui.length.value=round(draft.end/ppb(draft));ui.color.value=draft.color;ui.accent.value=draft.accent;ui.theme.value=draft.theme;
 ui.undo.disabled=!history.length;ui.redo.disabled=!future.length;ui['delete-saved'].disabled=!saved.some(l=>l.id===draft.id);
 renderInspector();renderLibrary();refreshView();requestDraw();
}
function editMetadata(key,value){
 const before=snapshot(),next=clone(draft);
 if(key==='name')next.name=cleanText(value,48,'Level name');
 else if(key==='bpm'){
  const old=ppb(next);next.bpm=num(Number(value),60,220,'BPM');const ratio=ppb(next)/old;next.end=round(next.end*ratio);
  for(const v of [...next.hazards,...next.portals,...next.coins])v.x=round(v.x*ratio);
 }else if(key==='length'){
  next.end=round(num(Number(value),8,512,'Length in beats')*ppb(next));
  if(refs().some(r=>r.value.x+itemWidth(r)/2+4>next.end))throw new Error('That length cuts off an object. Move or delete the objects near the end first.');
  next.cues=next.cues.filter(c=>c.beat<=next.end/ppb(next));
 }else next[key]=value;
 validate(next);draft=next;cursorBeat=Math.min(cursorBeat,draft.end/ppb(draft));clampPan();commit(before);notice('Updated '+(key==='bpm'?'BPM; beat positions are preserved.':key+'.'));return serialized();
}
function itemWidth(ref){return ref.kind==='hazards'?ref.value.w:ref.kind==='portals'?34:26;}
function itemRect(ref){
 const v=ref.value,w=itemWidth(ref);
 if(ref.kind==='coins')return{x:v.x-w/2,y:v.y-14,w,h:28};
 if(ref.kind==='portals')return{x:v.x-17,y:22,w:34,h:316};
 if(v.type==='gate')return{x:v.x-w/2,y:0,w,h:360};
 return{x:v.x-w/2,y:v.y,w,h:v.h};
}
function itemCenter(ref){const box=itemRect(ref);return{x:ref.value.x,y:ref.kind==='hazards'&&ref.value.type==='gate'?ref.value.center:box.y+box.h/2};}
function snapX(x){return snapValue?Math.round(x/(ppb(draft)*snapValue))*ppb(draft)*snapValue:x;}
function snapY(y){return snapValue?Math.round(y/12)*12:y;}
function constrainX(x,w=34){return Math.max(w/2+4,Math.min(draft.end-w/2-4,x));}
function createElement(kind,x,y){
 const {FLOOR}=constants(),beatWidth=ppb(draft);let group,value;
 x=snapX(x);y=snapY(y);
 if(['spike','double','triple','ceiling','ceiling-double'].includes(kind)){
  const type=kind==='ceiling'?'spike':kind==='ceiling-double'?'double':kind,side=kind.startsWith('ceiling')?'ceiling':'floor',count=type==='triple'?3:type==='double'?2:1;
  const w=count*30,h=30;group='hazards';value={type,x:constrainX(x,w),w,h,side,y:side==='floor'?FLOOR-h:0};
 }else if(kind==='gate'){
  const gap=170,center=Math.max(gap/2,Math.min(FLOOR-gap/2,y));group='hazards';value={type:'gate',x:constrainX(x,46),w:46,center,gap};
 }else if(kind==='beam'){group='hazards';value={type:'beam',x:constrainX(x,42),y:0,w:42,h:Math.max(48,Math.min(FLOOR-60,y)),side:'ceiling',warning:2};}
 else if(MODES.includes(kind)){group='portals';value={x:constrainX(x),mode:kind,gravity:1};}
 else if(kind==='coin'){group='coins';value={x:constrainX(x,26),y:Math.max(14,Math.min(FLOOR-14,y))};}
 else throw new Error('Choose an obstacle from the palette.');
 const limit=group==='hazards'?2500:256;if(draft[group].length>=limit)throw new Error('This level has reached the '+group+' limit ('+limit+').');
 value._eid='item-'+(++internalId);return{group,value};
}
function addAt(kind,beat,y=300){
 ensure();if(!draft)newDraft(false);const before=snapshot(),item=createElement(kind,beat*ppb(draft),y);draft[item.group].push(item.value);selection=new Set([item.value._eid]);commit(before);notice('Placed '+kind+' at beat '+round(item.value.x/ppb(draft))+'.');return clone(item.value);
}
function updateSelected(patch){
 const targets=selectedRefs();if(targets.length!==1)throw new Error('Select one object to edit its properties.');
 const before=snapshot(),r=targets[0],v=r.value;
 const allowed=r.kind==='coins'?['beat','y']:r.kind==='portals'?['beat','mode','gravity']:v.type==='gate'?['beat','w','center','gap']:v.type==='beam'?['beat','w','h']:['beat','w','h','side'];
 for(const [key,val]of Object.entries(patch)){if(!allowed.includes(key))throw new Error('That property is not editable.');if(key==='beat')v.x=round(num(Number(val),0,512,'Beat')*ppb(draft));else if(['mode','side'].includes(key))v[key]=val;else v[key]=Number(val);}
 if(r.kind==='hazards'&&['spike','double','triple'].includes(v.type))v.y=v.side==='floor'?constants().FLOOR-v.h:0;
 try{validate(draft);}catch(error){draft=before.draft;selection=new Set(before.selection);refresh();throw error;}
 commit(before);notice('Updated selected object.');return clone(v);
}
function renderInspector(){
 ui.selection.textContent='';const targets=selectedRefs(),title=document.createElement('div');title.className='gde-selection-title';
 title.textContent=targets.length===1?objectTitle(targets[0]):targets.length?targets.length+' objects selected':'Nothing selected';ui.selection.append(title);
 if(!targets.length){const p=document.createElement('p');p.textContent='Choose Select, then tap an object. Drag it to move it, or drag empty space to select a group.';ui.selection.append(p);return;}
 if(targets.length===1){
  const ref=targets[0],v=ref.value;
  addField('Beat',round(v.x/ppb(draft)),'beat','number',{min:0,max:512,step:.125});
  if(ref.kind==='coins')addField('Height from ceiling',v.y,'y','number',{min:14,max:346,step:1});
  else if(ref.kind==='portals'){
   addField('Transformation',v.mode,'mode','select',{},MODES.map(m=>[m,m.toUpperCase()]));
   addField('Gravity after portal',v.gravity,'gravity','select',{},[['1','Normal / floor'],['-1','Inverted / ceiling']]);
  }else{
   addField('Width (world pixels)',v.w,'w','number',{min:12,max:240,step:1});
   if(v.type==='gate'){addField('Opening center',v.center,'center','number',{min:0,max:360,step:1});addField('Opening size',v.gap,'gap','number',{min:48,max:340,step:1});}
   else{addField('Height (world pixels)',v.h,'h','number',{min:8,max:v.type==='beam'?352:180,step:1});if(v.type!=='beam')addField('Side',v.side,'side','select',{},[['floor','Floor'],['ceiling','Ceiling']]);}
  }
 }else{const p=document.createElement('p');p.textContent='Drag a selected object to move the group. Arrow keys nudge the selection; Shift nudges a full beat.';ui.selection.append(p);}
 const buttons=document.createElement('div');buttons.className='gde-edit-buttons';const duplicate=document.createElement('button');duplicate.textContent='Duplicate';duplicate.onclick=()=>safe(duplicateSelection);const del=document.createElement('button');del.className='gde-danger';del.textContent='Delete';del.onclick=()=>safe(deleteSelection);buttons.append(duplicate,del);ui.selection.append(buttons);
 function addField(label,value,key,type,attrs={},options=[]){
  const wrap=document.createElement('label');wrap.textContent=label;const field=document.createElement(type==='select'?'select':'input');
  if(type==='select')for(const [id,text]of options){const option=document.createElement('option');option.value=id;option.textContent=text;field.append(option);}else field.type=type;
  for(const [name,val]of Object.entries(attrs))field.setAttribute(name,String(val));field.value=String(value);field.dataset.property=key;field.onchange=()=>safe(()=>updateSelected({[key]:field.value}));wrap.append(field);ui.selection.append(wrap);
 }
}
function objectTitle(ref){if(ref.kind==='coins')return'◉ Coin';if(ref.kind==='portals')return ref.value.mode.toUpperCase()+' portal';const v=ref.value;return v.type==='gate'?'Ship gate':v.type==='beam'?'Ceiling beam':(v.side==='ceiling'?'Ceiling ':'Floor ')+(v.type==='double'?'double spike':v.type==='triple'?'triple spike':'spike');}
function deleteSelection(){
 if(!selection.size)return false;const before=snapshot(),count=selectedRefs().length;for(const key of ['hazards','portals','coins'])draft[key]=draft[key].filter(v=>!selection.has(v._eid));selection.clear();commit(before);notice('Deleted '+count+' object'+(count===1?'':'s')+'.');return true;
}
function duplicateSelection(){
 const targets=selectedRefs();if(!targets.length)return false;const before=snapshot();let copies=[];
 for(const r of targets){const limit=r.kind==='hazards'?2500:256;if(draft[r.kind].length+targets.filter(t=>t.kind===r.kind).length>limit)throw new Error('Duplicating would exceed the '+r.kind+' limit.');}
 const maxDx=Math.min(...targets.map(r=>draft.end-r.value.x-itemWidth(r)/2-4)),desired=ppb(draft)*(snapValue||.25),dx=Math.max(0,Math.min(maxDx,desired));
 for(const r of targets){const copy=clone(r.value);copy._eid='item-'+(++internalId);copy.x=round(copy.x+dx);draft[r.kind].push(copy);copies.push(copy._eid);}
 selection=new Set(copies);commit(before);notice('Duplicated selection. Drag the copy into position.');return true;
}
function moveSelection(dx,dy=0,record=true,source=null){
 const before=source||snapshot(),targets=selectedRefs();if(!targets.length)return false;
 const original=new Map([...before.draft.hazards,...before.draft.portals,...before.draft.coins].map(v=>[v._eid,v]));
 let minDx=-Infinity,maxDx=Infinity;
 for(const r of targets){const v=original.get(r.value._eid);if(!v)continue;minDx=Math.max(minDx,itemWidth(r)/2+4-v.x);maxDx=Math.min(maxDx,draft.end-itemWidth(r)/2-4-v.x);}
 dx=Math.max(minDx,Math.min(maxDx,dx));
 for(const r of targets){const old=original.get(r.value._eid);if(!old)continue;r.value.x=round(old.x+dx);
  if(r.kind==='coins')r.value.y=Math.max(14,Math.min(346,round(old.y+dy)));
  else if(r.kind==='hazards'&&r.value.type==='gate')r.value.center=Math.max(old.gap/2,Math.min(360-old.gap/2,round(old.center+dy)));
 }
 if(record)commit(before);else{dirty=true;renderInspector();requestDraw();}return true;
}
function selectIds(ids){selection=new Set(ids);renderInspector();requestDraw();return[...selection];}
function setTool(next){tool=next;for(const b of ui.tools.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));ui.canvas.style.cursor=tool==='pan'?'grab':tool==='select'?'default':'crosshair';ui['canvas-tip'].textContent=tool==='select'?'Tap an object to select; drag empty space to select a group.':tool==='erase'?'Tap an object to erase it. Undo brings it back.':tool==='pan'?'Drag the track to look around. Use Timeline to jump farther.':'Tap to place '+tools.find(t=>t[0]===tool)?.[1].replace(/^[^a-z]+/i,'')+'. Select it to adjust dimensions.';notice('Tool: '+tool);}
function resize(){
 if(!ui.canvas)return;const rect=ui.canvas.getBoundingClientRect();view.w=Math.max(1,rect.width||800);view.h=Math.max(1,rect.height||400);const dpr=Math.min(2,window.devicePixelRatio||1);ui.canvas.width=Math.round(view.w*dpr);ui.canvas.height=Math.round(view.h*dpr);
 view.scale=Math.max(.15,(view.h-70)/360)*zoom;view.originY=40+Math.max(0,(view.h-70-360*view.scale)/2);clampPan();refreshView();requestDraw();
}
function clampPan(){
 if(!draft)return;panX=Math.max(-30,Math.min(Math.max(0,draft.end-view.w/view.scale+60),panX));
 const maxY=Math.max(0,360-(view.h-70)/view.scale);panY=Math.max(0,Math.min(maxY,panY));
}
function refreshView(){if(!draft||!ui.scroll)return;ui.zoom.value=zoom;ui['zoom-label'].textContent=Math.round(zoom*100)+'%';ui.scroll.max=Math.max(0,draft.end-view.w/view.scale+60);ui.scroll.value=Math.max(0,panX);ui.cursor.textContent=cursorBeat.toFixed(2)+' b';}
function setZoom(value,anchorX=view.w/2){
 const old=view.scale,world=panX+anchorX/old;zoom=Math.max(.35,Math.min(2.5,value));resize();panX=world-anchorX/view.scale;clampPan();refreshView();requestDraw();
}
function position(event){const r=ui.canvas.getBoundingClientRect(),sx=event.clientX-r.left,sy=event.clientY-r.top;return{sx,sy,x:panX+sx/view.scale,y:panY+(sy-view.originY)/view.scale};}
function hitAt(point){
 const candidates=refs().reverse(),margin=Math.max(6,7/view.scale);
 for(const r of candidates){const box=itemRect(r);if(point.x>=box.x-margin&&point.x<=box.x+box.w+margin&&point.y>=box.y-margin&&point.y<=box.y+box.h+margin)return r;}
 return null;
}
function pointerDown(event){
 if(!visible||event.button>1||gesture)return;event.preventDefault();ui.canvas.focus({preventScroll:true});const p=position(event);cursorBeat=Math.max(0,Math.min(draft.end/ppb(draft),p.x/ppb(draft)));refreshView();
 try{ui.canvas.setPointerCapture(event.pointerId);}catch(error){}
 if(tool==='pan'||spaceHeld||event.button===1){gesture={type:'pan',id:event.pointerId,start:p,panX,panY};ui.canvas.style.cursor='grabbing';return;}
 if(tool==='erase'){const hit=hitAt(p);if(hit){selection=new Set([hit.value._eid]);deleteSelection();}else notice('No object here to erase.');return;}
 if(tool!=='select'){
  const before=snapshot();try{const item=createElement(tool,p.x,p.y);draft[item.group].push(item.value);selection=new Set([item.value._eid]);commit(before);notice('Placed '+objectTitle({kind:item.group,value:item.value})+'.');}catch(error){notice(error.message,'error');}return;
 }
 const hit=hitAt(p);
 if(hit){
  if(event.shiftKey){if(selection.has(hit.value._eid))selection.delete(hit.value._eid);else selection.add(hit.value._eid);renderInspector();requestDraw();return;}
  if(!selection.has(hit.value._eid))selection=new Set([hit.value._eid]);
  gesture={type:'drag',id:event.pointerId,start:p,before:snapshot(),anchor:hit.value.x};renderInspector();requestDraw();
 }else{
  const prior=event.shiftKey?[...selection]:[];if(!event.shiftKey)selection.clear();gesture={type:'box',id:event.pointerId,start:p,end:p,prior};renderInspector();requestDraw();
 }
}
function pointerMove(event){
 if(!visible)return;const p=position(event);
 if(!gesture){if(tool==='select')ui.canvas.style.cursor=hitAt(p)?'move':'default';return;}
 if(event.pointerId!==gesture.id)return;event.preventDefault();
 if(gesture.type==='pan'){
  panX=gesture.panX-(p.sx-gesture.start.sx)/view.scale;panY=gesture.panY-(p.sy-gesture.start.sy)/view.scale;clampPan();refreshView();requestDraw();
 }else if(gesture.type==='drag'){
  const dx=snapX(gesture.anchor+p.x-gesture.start.x)-gesture.anchor,dy=snapY(p.y-gesture.start.y);moveSelection(dx,dy,false,gesture.before);
 }else{gesture.end=p;const x1=Math.min(p.x,gesture.start.x),x2=Math.max(p.x,gesture.start.x),y1=Math.min(p.y,gesture.start.y),y2=Math.max(p.y,gesture.start.y);selection=new Set(gesture.prior);for(const r of refs()){const c=itemCenter(r);if(c.x>=x1&&c.x<=x2&&c.y>=y1&&c.y<=y2)selection.add(r.value._eid);}renderInspector();requestDraw();}
}
function pointerUp(event){
 if(!gesture||event.pointerId!==gesture.id)return;event.preventDefault();const active=gesture;gesture=null;
 if(active.type==='drag'){if(commit(active.before))notice('Moved '+selection.size+' object'+(selection.size===1?'':'s')+'.');}
 else if(active.type==='box'){notice(selection.size?selection.size+' object'+(selection.size===1?'':'s')+' selected.':'Cursor set to beat '+cursorBeat.toFixed(2)+'.');}
 ui.canvas.style.cursor=tool==='pan'?'grab':tool==='select'?'default':'crosshair';requestDraw();
}
function pointerCancel(){if(!gesture)return;const active=gesture;gesture=null;if(active.type==='drag'){draft=active.before.draft;selection=new Set(active.before.selection);refresh();}requestDraw();}
function wheel(event){
 if(!visible)return;event.preventDefault();if(event.ctrlKey||event.metaKey)setZoom(zoom*(event.deltaY>0?.9:1.1),event.offsetX);
 else{panX+=(event.deltaX||event.deltaY)/view.scale;clampPan();refreshView();requestDraw();}
}
function keydown(event){
 if(!visible)return;const typing=event.target?.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName||'');
 if(typing)return;const mod=event.ctrlKey||event.metaKey;
 const relevant=['Space','Delete','Backspace','Escape','Enter','KeyV','KeyE','KeyH','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)||(mod&&['KeyZ','KeyY','KeyS','KeyD','KeyA'].includes(event.code));
 if(!relevant)return;event.preventDefault();event.stopImmediatePropagation();
 if(event.code==='Space'){spaceHeld=true;ui.canvas.style.cursor='grab';return;}
 if(mod){if(event.code==='KeyZ')event.shiftKey?redo():undo();else if(event.code==='KeyY')redo();else if(event.code==='KeyS')safe(saveDraft);else if(event.code==='KeyD')safe(duplicateSelection);else if(event.code==='KeyA'){selection=new Set(refs().map(r=>r.value._eid));renderInspector();requestDraw();}return;}
 if(event.repeat&&!event.code.startsWith('Arrow'))return;
 if(event.code==='Escape'){if(gesture)pointerCancel();else if(selection.size){selection.clear();renderInspector();requestDraw();}else close();}
 else if(event.code==='Delete'||event.code==='Backspace')deleteSelection();
 else if(event.code==='Enter')testLevel(false);
 else if(event.code==='KeyV')setTool('select');else if(event.code==='KeyE')setTool('erase');else if(event.code==='KeyH')setTool('pan');
 else if(event.code.startsWith('Arrow')){
  const dx=ppb(draft)*(event.shiftKey?1:(snapValue||.125));
  if(selection.size){safe(()=>moveSelection(event.code==='ArrowLeft'?-dx:event.code==='ArrowRight'?dx:0,event.code==='ArrowUp'?-12:event.code==='ArrowDown'?12:0));}
  else{panX+=event.code==='ArrowLeft'?-dx:event.code==='ArrowRight'?dx:0;panY+=event.code==='ArrowUp'?-30:event.code==='ArrowDown'?30:0;clampPan();refreshView();requestDraw();}
 }
}
function keyup(event){if(event.code==='Space'){spaceHeld=false;if(visible){event.preventDefault();event.stopImmediatePropagation();ui.canvas.style.cursor=tool==='pan'?'grab':'default';}}}
function requestDraw(){if(drawRequested||!visible||!draft)return;drawRequested=true;requestAnimationFrame(()=>{drawRequested=false;if(visible&&draft)draw();});}
function draw(){
 const ctx=ui.canvas.getContext('2d');if(!ctx)return;const {TOP,FLOOR}=constants(),dpr=ui.canvas.width/view.w,s=view.scale,worldX=x=>(x-panX)*s,worldY=y=>(y-panY)*s+view.originY;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,view.w,view.h);ctx.fillStyle='#081321';ctx.fillRect(0,0,view.w,view.h);
 ctx.save();ctx.beginPath();ctx.rect(0,30,view.w,view.h-30);ctx.clip();
 const floor=worldY(FLOOR),ceil=worldY(TOP);ctx.fillStyle=draft.color+'06';ctx.fillRect(worldX(0),ceil,draft.end*s,(FLOOR-TOP)*s);
 const beatWidth=ppb(draft),gridStep=beatWidth*(snapValue||.25),start=Math.max(0,Math.floor(panX/gridStep)*gridStep),end=Math.min(draft.end,panX+view.w/s+gridStep);
 if(gridStep*s>7){ctx.lineWidth=1;for(let x=start;x<=end;x+=gridStep){const b=x/beatWidth,whole=Math.abs(b-Math.round(b))<.001;ctx.strokeStyle=whole?'#89bac522':'#89bac50c';ctx.beginPath();ctx.moveTo(worldX(x),Math.max(ceil,30));ctx.lineTo(worldX(x),floor);ctx.stroke();}}
 for(let y=0;y<=FLOOR;y+=60){ctx.strokeStyle='#99b9d011';ctx.beginPath();ctx.moveTo(0,worldY(y));ctx.lineTo(view.w,worldY(y));ctx.stroke();}
 ctx.strokeStyle=draft.color+'99';ctx.lineWidth=2;for(const y of [TOP,FLOOR]){ctx.beginPath();ctx.moveTo(Math.max(0,worldX(0)),worldY(y));ctx.lineTo(Math.min(view.w,worldX(draft.end)),worldY(y));ctx.stroke();}
 ctx.fillStyle='#0d2434';ctx.fillRect(Math.max(0,worldX(0)),floor+1,Math.min(view.w,worldX(draft.end)),20);
 for(const r of refs()){
  const v=r.value,x=worldX(v.x),w=itemWidth(r)*s;if(x+w<-20||x-w>view.w+20)continue;
  const active=selection.has(v._eid);ctx.lineWidth=active?2.5:1.4;
  if(r.kind==='coins'){
   const y=worldY(v.y);ctx.fillStyle='#f6d16d';ctx.strokeStyle='#fff0b8';ctx.beginPath();ctx.ellipse(x,y,11*s,13*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else if(r.kind==='portals'){
   const colors={cube:'#79f5dc',ship:'#87bfff',ball:'#ffc479',wave:'#ec87ff'},color=colors[v.mode];ctx.strokeStyle=color;ctx.fillStyle=color+'13';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,worldY(180),15*s,145*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.font='bold '+Math.max(8,10*s)+'px system-ui';ctx.textAlign='center';ctx.fillText(v.mode.toUpperCase()+(v.gravity===-1?' ↓':''),x,worldY(30));
  }else if(v.type==='gate'){
   const upper=v.center-v.gap/2,lower=v.center+v.gap/2;ctx.fillStyle='#253c50';ctx.strokeStyle=draft.color;ctx.fillRect(x-w/2,ceil,w,upper*s);ctx.strokeRect(x-w/2,ceil,w,upper*s);ctx.fillRect(x-w/2,worldY(lower),w,(FLOOR-lower)*s);ctx.strokeRect(x-w/2,worldY(lower),w,(FLOOR-lower)*s);
   ctx.strokeStyle='#83f9da77';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(x,worldY(upper));ctx.lineTo(x,worldY(lower));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#83f9da';ctx.fillRect(x-3,worldY(v.center)-3,6,6);
  }else if(v.type==='beam'){
   ctx.fillStyle='#ff728540';ctx.strokeStyle='#ff9baa';ctx.fillRect(x-w/2,worldY(v.y),w,v.h*s);ctx.strokeRect(x-w/2,worldY(v.y),w,v.h*s);ctx.fillStyle='#ffcf91';ctx.fillRect(x-2,worldY(v.y),4,v.h*s);
  }else{
   const count=v.type==='triple'?3:v.type==='double'?2:1,pw=w/count;ctx.fillStyle='#ff778f';ctx.strokeStyle='#ffd0d8';
   for(let i=0;i<count;i++){const left=x-w/2+pw*i;ctx.beginPath();if(v.side==='floor'){ctx.moveTo(left,floor);ctx.lineTo(left+pw/2,worldY(FLOOR-v.h));ctx.lineTo(left+pw,floor);}else{ctx.moveTo(left,ceil);ctx.lineTo(left+pw/2,worldY(TOP+v.h));ctx.lineTo(left+pw,ceil);}ctx.closePath();ctx.fill();ctx.stroke();}
  }
  if(active){const b=itemRect(r);ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(worldX(b.x)-5,worldY(b.y)-5,b.w*s+10,b.h*s+10);ctx.setLineDash([]);const c=itemCenter(r);ctx.fillStyle='#ffffff';ctx.fillRect(worldX(c.x)-3,worldY(c.y)-3,6,6);}
 }
 const finishX=worldX(draft.end);ctx.strokeStyle='#adffe1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(finishX,Math.max(30,ceil));ctx.lineTo(finishX,floor);ctx.stroke();ctx.fillStyle='#adffe1';ctx.font='bold 11px system-ui';ctx.textAlign='right';ctx.fillText('FINISH',finishX-6,Math.max(50,ceil+19));
 const spawnX=worldX(0);if(spawnX>-35&&spawnX<view.w){ctx.fillStyle=draft.color;ctx.fillRect(spawnX-16*s,worldY(FLOOR-32),32*s,32*s);ctx.fillStyle='#102c35';ctx.fillRect(spawnX-10*s,worldY(FLOOR-26),20*s,20*s);}
 const cursorX=worldX(cursorBeat*beatWidth);ctx.strokeStyle='#a995ff99';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(cursorX,30);ctx.lineTo(cursorX,view.h);ctx.stroke();ctx.setLineDash([]);
 if(gesture?.type==='box'){const a=gesture.start,b=gesture.end;ctx.fillStyle='#76ffe416';ctx.strokeStyle='#a4ffe9';ctx.lineWidth=1;ctx.fillRect(worldX(a.x),worldY(a.y),(b.x-a.x)*s,(b.y-a.y)*s);ctx.strokeRect(worldX(a.x),worldY(a.y),(b.x-a.x)*s,(b.y-a.y)*s);}
 ctx.restore();
 ctx.fillStyle='#14243a';ctx.fillRect(0,0,view.w,30);ctx.fillStyle='#bdd6ec';ctx.font='10px system-ui';ctx.textAlign='center';const labelEvery=Math.max(1,Math.ceil(55/(beatWidth*s))),first=Math.max(0,Math.floor(panX/beatWidth/labelEvery)*labelEvery),last=Math.ceil((panX+view.w/s)/beatWidth);
 for(let beat=first;beat<=last;beat+=labelEvery){const x=worldX(beat*beatWidth);ctx.fillText(beat+' b',x,18);ctx.strokeStyle='#7ca1be55';ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x,30);ctx.stroke();}
 ctx.fillStyle='#b8a7ff';ctx.beginPath();ctx.moveTo(cursorX,30);ctx.lineTo(cursorX-5,23);ctx.lineTo(cursorX+5,23);ctx.closePath();ctx.fill();
}
window.GD2_EDITOR={open,close,returnFromTest,isOpen:()=>visible,isTesting:()=>testing,validate,getDraft:()=>draft?serialized():null,getSaved:()=>clone(saved),
 _test:{newDraft:(ask=false)=>newDraft(ask),setDraft:(l,o)=>setDraft(l,o),saveDraft,loadSaved:(id,ask=false)=>loadSaved(id,ask),deleteSaved:(id,ask=false)=>deleteSaved(id,ask),duplicateBuiltin:(i,ask=false)=>duplicateBuiltin(i,ask),importText:(t,ask=false)=>importText(t,ask),exportText,addAt,updateSelected,deleteSelection,duplicateSelection,moveSelection,selectIds,undo,redo,editMetadata,testLevel,getInternal:()=>clone(draft),getState:()=>({dirty,visible,testing,storageWritable,storageWarning,history:history.length,future:future.length,selection:[...selection],cursorBeat,panX,panY,zoom}),setCursor:beat=>{cursorBeat=Math.max(0,Math.min(draft.end/ppb(draft),beat));refreshView();requestDraw();},setTool,pointerDown,pointerMove,pointerUp,pointerCancel,keydown,wheel,constants:()=>constants(),storageKey:STORAGE_KEY}
};
})();

(async()=>{if(!(location.hash||'').startsWith('#level='))return;try{let encoded=location.hash.slice(7);if(encoded.length>60000)throw Error('Shared level is too large.');const binary=atob(encoded.replaceAll('-','+').replaceAll('_','/'));const packed=Uint8Array.from(binary,c=>c.charCodeAt(0));const reader=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let parts=[],total=0;while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>2*1024*1024){await reader.cancel();throw Error('Shared level is too large.');}parts.push(value);}const level=window.GD2_EDITOR.validate(JSON.parse(await new Blob(parts).text()));window.GD2_EDITOR.open();window.GD2_EDITOR._test.setDraft(level,{newId:true});window.GD2_EDITOR._test.testLevel(false);}catch(e){alert('Cannot open shared level: '+e.message);}})();

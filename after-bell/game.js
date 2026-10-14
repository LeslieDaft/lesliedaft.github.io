import * as THREE from './vendor/three.module.js';
import { MAP, WIDTH, HEIGHT, CELL_SIZE, ROOMS, SPAWN, EXIT, DETENTION_SPAWN, PATROL_POINTS, DAYS,
  ORIGIN_X, ORIGIN_Z, gridToWorld, worldToGrid, cellKey, isWalkable, findPath, lineOfSight, isWeekend, captureDestination, dayName, nextSchoolDay } from './engine.js?v=3';
import { buildSchool } from './scene.js?v=6';
import { createDareCutscene } from './cutscene.js?v=6';
import { makeExam, createExamUI } from './exams.js?v=3';
import { createRescueScene } from './rescue.js?v=6';
import { EVIDENCE, NIGHT_RULES, morningMessage } from './story.js?v=6';
import { createHorrorAtmosphere } from './horror.js?v=6';

const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const SAVE_KEY = 'after-bell-week-v3';
const PREF_KEY = 'after-bell-settings-v1';
const STUDENT_NAME = 'Alex';
const DIFFICULTY = {
  easy:{night:85,speed:.79,sight:.82,noise:.85,drain:.42},
  normal:{night:75,speed:1,sight:1,noise:1,drain:.55},
  hard:{night:68,speed:1.17,sight:1.2,noise:1.25,drain:.7}
};
// Keep the old proof-day save field so existing checkpoints retain their evidence.
const currentEvidence = () => EVIDENCE[Math.min(state?.proofs.length||0, EVIDENCE.length-1)];
const SCHEDULE = [['homeroom','band'],['library','lab'],['homeroom','lab'],['band','library'],['lab','homeroom']];
const keyDown = new Set();
const touchEnabled=!!window.DaftTouch?.available;
if(touchEnabled)document.body.classList.add('game-touch');
function touchText(text){
  if(!touchEnabled)return text;
  return String(text).replace(/\bhold E\b/gi,'Hold Use').replace(/\breleasing E\b/gi,'releasing Use').replace(/\brelease E\b/gi,'release Use').replace(/\bpress E\b/gi,'Tap Use').replace(/\bpress J\b/gi,'Tap Journal').replace(/\bpress F\b/gi,'Tap Light').replace(/\bpress G\b/gi,'Tap Decoy').replace(/\bM map\b/g,'Map').replace(/\bClick Resume\b/g,'Tap Resume').replace(/\bmovement keys\b/g,'the movement stick');
}
const settings = {difficulty:'normal',reduced:false,sound:true};
try { Object.assign(settings, JSON.parse(localStorage.getItem(PREF_KEY)||'{}')); } catch {}
delete settings.quality;
for (const field of ['difficulty']) $(field).value=settings[field];
$('reduced').checked=!!settings.reduced; $('sound').checked=!!settings.sound;
function saveSettings(){
  settings.difficulty=$('difficulty').value;
  settings.reduced=$('reduced').checked;settings.sound=$('sound').checked;
  try{localStorage.setItem(PREF_KEY,JSON.stringify(settings))}catch{}
}
for(const field of ['difficulty','reduced','sound']) $(field).addEventListener('change',saveSettings);

let renderer, scene, camera, world, flashlight, flashTarget, hand, dareCutscene, rescueScene, examUI;
let state = null, mode='menu', paused=false, frameTime=performance.now(), hudTime=0, mapOpen=false;
let transitionTime=0, noticeTime=0, walkingTime=0, nearby=null, noiseEvent=null, noiseTime=0, objectiveTime=0;
let captureTime=0, captureEnemy='guardian', detLampTime=0, detentionGuard=null, principalGuard=null, captureKind='detention', friendlyTime=0;
let task=null, journalOpen=false, journalWasPaused=false, horror=null, atmosphereFlicker=1;
const player={...SPAWN,yaw:0,pitch:0,height:1.65,hidden:null,bob:0,moving:false,sprinting:false,crouching:false};
const blocked=new Set([cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z)]);
const furnitureNav=new Set();
const enemies=[];
let audioContext=null, masterGain=null, droneGain=null, droneOsc=null;
const soundAssets={};
for(const who of ['guardian','band','teacher','principal','band-friendly','teacher-friendly']){
  const image=new Image();image.src=`./assets/${who}.webp`;soundAssets[who]=image;
}

function startAudio(){
  try{
    if(!audioContext){
      audioContext=new(window.AudioContext||window.webkitAudioContext)();
      masterGain=audioContext.createGain();masterGain.gain.value=settings.sound?.26:0;masterGain.connect(audioContext.destination);
      droneGain=audioContext.createGain();droneGain.gain.value=.012;droneGain.connect(masterGain);
      droneOsc=audioContext.createOscillator();droneOsc.type='sine';droneOsc.frequency.value=54;droneOsc.connect(droneGain);droneOsc.start();
    }
    audioContext.resume();masterGain.gain.setTargetAtTime(settings.sound?.26:0,audioContext.currentTime,.1);
  }catch{}
}
function tone(frequency=300,duration=.18,type='sine',volume=.15,delay=0,endFreq=null){
  if(!audioContext||!settings.sound)return;
  const now=audioContext.currentTime+delay,o=audioContext.createOscillator(),g=audioContext.createGain();
  o.type=type;o.frequency.setValueAtTime(frequency,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,now+duration);
  g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(volume,now+.012);g.gain.exponentialRampToValueAtTime(.001,now+duration);
  o.connect(g);g.connect(masterGain);o.start(now);o.stop(now+duration+.03);
}
function bell(){tone(740,.5,'sine',.17);tone(590,.7,'sine',.13,.12);tone(980,.8,'sine',.08,.22)}
function noiseSound(duration=.1,volume=.2){
  if(!audioContext||!settings.sound)return;
  const length=Math.floor(audioContext.sampleRate*duration),buffer=audioContext.createBuffer(1,length,audioContext.sampleRate);
  const data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const source=audioContext.createBufferSource(),gain=audioContext.createGain();gain.gain.value=volume;source.buffer=buffer;source.connect(gain);gain.connect(masterGain);source.start();
}
function say(text,time=4){$('statusMessage').textContent=touchText(text);noticeTime=time;$('statusMessage').style.opacity=1}
function showTransition(small,title,note,time=3){
  $('transitionSmall').textContent=small;$('transitionTitle').textContent=title;$('transitionNote').textContent=note;
  $('transition').hidden=false;transitionTime=time;
}
function showError(error){$('error').hidden=false;$('errorText').textContent=error?.message||'This game needs WebGL and local game files. Try a current browser with hardware acceleration enabled.'}

try{
  renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.08,110);camera.rotation.order='YXZ';
  world=buildSchool(scene);
  for(let z=0;z<HEIGHT;z++)for(let x=0;x<WIDTH;x++){
    if(MAP[z][x]!=='.')continue;
    const p=gridToWorld(x,z);
    if(world.colliders.some(c=>p.x>c.minX-.27&&p.x<c.maxX+.27&&p.z>c.minZ-.27&&p.z<c.maxZ+.27))furnitureNav.add(cellKey(x,z));
  }
  flashlight=new THREE.SpotLight(0xedf5cd,0,25,Math.PI/6,.63,1.3);flashlight.position.set(0,1.5,0);scene.add(flashlight);
  flashTarget=new THREE.Object3D();scene.add(flashTarget);flashlight.target=flashTarget;
  hand=new THREE.Group();
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.048,.06,.26,8),new THREE.MeshStandardMaterial({color:0x26373d,roughness:.5}));
  barrel.rotation.x=Math.PI/2;barrel.position.set(.28,-.26,-.48);hand.add(barrel);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.056,.056,.025,8),new THREE.MeshStandardMaterial({color:0xdde9c5,emissive:0x9fac72,emissiveIntensity:.4}));
  rim.rotation.x=Math.PI/2;rim.position.set(.28,-.26,-.63);hand.add(rim);camera.add(hand);scene.add(camera);
  resize();
  world.setMood(false,0);
  createEnemies();
  principalGuard={id:'principal',name:'Principal Mercer',model:world.principal,speed:2.35};
  for(const [teacherId,room] of [['teacher','lab'],['band','band']])world.interactables.push({id:`exam-${teacherId}`,type:'exam',teacherId,room,...ROOMS[room].center,mesh:null,label:teacherId==='band'?'Take Mr. Reed’s music test':'Take Ms. Vale’s math and science test'});
  examUI=createExamUI({onComplete:completeExam});
  rescueScene=createRescueScene({world,player,camera,enemies,onComplete:releaseStudent,onLine:showRescueLine});
  dareCutscene=createDareCutscene({world,player,camera,onComplete:()=>startGame(null,true)});
  horror=createHorrorAtmosphere({world,player,camera,onSound:atmosphereSound,onMessage:text=>say(text,4)});
  positionCamera(0);
}catch(error){showError(error)}

function resize(){
  if(!renderer)return;
  const ratio=Math.min(devicePixelRatio,1.6);
  renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
$('sound').addEventListener('change',()=>{if(masterGain)masterGain.gain.setTargetAtTime(settings.sound?.26:0,audioContext.currentTime,.1)});

function createEnemies(){
  const specs=[
    {id:'teacher',name:'Ms. Vale',model:world.teachers.teacher,pos:ROOMS.lab.center,patrol:[6,0,7,1,8,2],speed:2.25},
    {id:'band',name:'Mr. Reed',model:world.teachers.band,pos:ROOMS.band.center,patrol:[4,1,3,0,5,2],speed:2.4},
    {id:'guardian',name:'GoGuardian',model:world.guardian,pos:gridToWorld(16,8),patrol:[0,1,2,1],speed:2.05}
  ];
  for(const e of specs)enemies.push({...e,x:e.pos.x,z:e.pos.z,yaw:0,path:[],pathIndex:0,patrolIndex:0,think:0,alert:0,seen:0,blinded:0,lastSeen:null,inspect:false});
}
function resetEnemies(){
  for(const e of enemies){Object.assign(e,{x:e.pos.x,z:e.pos.z,path:[],pathIndex:0,patrolIndex:0,think:0,alert:0,seen:0,blinded:0,lastSeen:null,inspect:false,searchingId:null,searchTime:0,searchKnown:false,searchCooldown:14+e.id.length,stareTime:0,stareCooldown:6,surge:0,fakeLeave:false,moving:false});e.model.visible=e.id==='guardian'||!isWeekend(state.day);}
}
function validSave(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!s||![3,4,5].includes(s.version)||!Number.isInteger(s.day)||s.day<0||s.day>1000000||!Array.isArray(s.proofs)||!DIFFICULTY[s.difficulty])return null;
    s.proofs=[...new Set(s.proofs.filter(n=>Number.isInteger(n)&&n>=0&&n<=s.day))].slice(0,7);
    s.blockedPerkDays=Array.isArray(s.blockedPerkDays)?s.blockedPerkDays.filter(n=>Number.isInteger(n)&&n>=s.day):[];
    s.missedProofs=Number.isInteger(s.missedProofs)?Math.max(0,s.missedProofs):Math.max(0,s.day-s.proofs.length);
    s.lockerUses=Object.fromEntries(Object.entries(s.lockerUses||{}).filter(([id,n])=>/^locker-[1-6]$/.test(id)&&Number.isInteger(n)&&n>=0).map(([id,n])=>[id,Math.min(50,n)]));
    return {...s,version:5};
  }catch{return null}
}

function updateResume(){$('resume').hidden=!validSave()}
updateResume();
function saveMorning(){
  if(!state)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:5,day:state.day,proofs:state.proofs,hasLight:state.hasLight,hasKey:state.hasKey,
    battery:state.battery,decoys:state.decoys,captures:state.captures,elapsed:state.elapsed,difficulty:state.difficulty,
    missedProofs:state.missedProofs,blockedPerkDays:state.blockedPerkDays,lockerUses:state.lockerUses}))}catch{}
  updateResume();
}

function newState(save=null){
  const s={day:0,proofs:[],hasLight:false,lightOn:false,hasKey:false,battery:100,decoys:0,captures:0,elapsed:0,difficulty:settings.difficulty,
    phase:'day',phaseTime:25,nightRemaining:75,nightElapsed:0,nightActive:false,fatalCapture:false,classes:[],trouble:0,troubleWarned:false,
    grace:0,detKey:false,detFuse:false,detPower:false,detOpen:false,moveNoise:0,decoyCooldown:0,
    missedProofs:0,blockedPerkDays:[],testResults:{},aTeachers:[],favorDay:-1,disciplineReturn:'night',schoolRemaining:25,lockerUses:{},lockerSearch:null,
    scan:null,scanCooldown:16,gate:null,gateCooldown:24,outage:0,outageNext:23,cameraFlash:0,doorTrail:null,fakeAllClear:0};
  if(save)Object.assign(s,save,{phase:'day',nightActive:false,fatalCapture:false,lightOn:false,classes:[],trouble:0,testResults:{},aTeachers:[]});return s;
}

function acceptDare(){
  if(!renderer||!world||!dareCutscene)return;
  closeJournal(false);resetNightHazards();
  examUI?.close();rescueScene?.cancel();
  $('begin').hidden=false;$('cinemaHeading').textContent='MONDAY · LEAVING HOMEROOM';
  saveSettings();resize();state=null;mode='intro';paused=false;mapOpen=false;keyDown.clear();
  for(const id of ['menu','hud','pause','ending','mapPanel','scare','blackout','transition'])$(id).hidden=true;
  dareCutscene.start();startAudio();requestLook();
}
$('start').onclick=acceptDare;
$('begin').onclick=()=>dareCutscene?.finish();
$('resume').onclick=()=>{const save=validSave();if(!save)return;settings.difficulty=save.difficulty;$('difficulty').value=save.difficulty;startGame(save)};
function startGame(save=null,fromCutscene=false){
  if(!renderer||!world)return;
  closeJournal(false);resetNightHazards();
  dareCutscene?.cancel();rescueScene?.cancel();examUI?.close();keyDown.clear();detentionGuard=null;
  state=newState(save);mode='playing';paused=false;mapOpen=false;
  for(const id of ['menu','intro','pause','ending','mapPanel','scare','blackout'])$(id).hidden=true;
  $('hud').hidden=false;startAudio();startDay(false);
  if(fromCutscene&&!save){
    Object.assign(player,dareCutscene.endPosition);state.classes=['homeroom'];
    showTransition('MONDAY · LEAVING HOMEROOM','Something is watching.','Investigate the midnight attendance log after lights out. An A earns teacher protection tonight.',3.8);updateHud();
  }
  requestLook();
}
function toMenu(){
  closeJournal(false);resetNightHazards();
  dareCutscene?.cancel();rescueScene?.cancel();examUI?.close();detentionGuard=null;world.principal.visible=false;
  mode='menu';paused=false;state=null;keyDown.clear();document.exitPointerLock?.();
  for(const id of ['hud','pause','ending','intro','scare','blackout','mapPanel','transition'])$(id).hidden=true;
  $('menu').hidden=false;player.x=SPAWN.x;player.z=SPAWN.z;player.yaw=0;player.pitch=0;player.hidden=null;
  resetInteractionMeshes();world.setMood(false,0);for(const e of enemies)e.model.visible=true;updateResume();
}
$('mainMenu').onclick=toMenu;$('endingMenu').onclick=toMenu;
$('restartPause').onclick=acceptDare;$('playAgain').onclick=acceptDare;
function requestLook(){
  if(touchEnabled||!['playing','intro'].includes(mode)||paused)return;
  try{const p=$('view').requestPointerLock?.();if(p?.catch)p.catch(()=>{})}catch{}
}
$('view').addEventListener('click',requestLook);
function setPaused(value){
  if(value)clearTask();
  if(mode==='intro'&&dareCutscene?.active){
    paused=value;$('pause').hidden=!value;keyDown.clear();
    if(value)document.exitPointerLock?.();else{startAudio();requestLook();}
    return;
  }
  if(mode!=='playing'||!state||['capture','blackout','forgiven','rescue'].includes(state.phase))return;
  paused=value;$('pause').hidden=!value;keyDown.clear();
  if(value){document.exitPointerLock?.();$('mapPanel').hidden=true;mapOpen=false;}else{startAudio();requestLook();}
}
$('pauseBtn').onclick=()=>setPaused(true);$('unpause').onclick=()=>setPaused(false);
document.addEventListener('pointerlockchange',()=>{
  if(touchEnabled||examUI?.active)return;
  if(document.pointerLockElement!==$('view')&&mode==='intro'&&dareCutscene?.active&&!paused)setPaused(true);
  if(document.pointerLockElement!==$('view')&&mode==='playing'&&!paused&&state&&['day','night','detention','principal','finale'].includes(state.phase))setPaused(true);
});
addEventListener('blur',()=>setPaused(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true)});

function resetInteractionMeshes(){
  for(const o of world.interactables){if(o.mesh)o.mesh.visible=true;o.taken=false;}
  for(const o of world.interactables){if(o.type==='proof'&&o.mesh)o.mesh.visible=false;}
  if(world.detentionDoor)world.detentionDoor.visible=true;
}

function atmosphereSound(kind, detail={}){
  if(kind==='band-echo')tone(detail.frequency,detail.duration,'triangle',detail.volume);
  else if(kind==='phantom-step')noiseSound(detail.duration,detail.volume);
  else tone(130,.06,'square',.035);
}
function clearTask(){task=null;$('taskPanel').hidden=true;}
function clearLockerSearch(){
  if(state)state.lockerSearch=null;
  $('lockerSearch').hidden=true;world?.setLockerInspection?.(null,false);
}
function resetNightHazards(){
  clearTask();clearLockerSearch();horror?.reset();atmosphereFlicker=1;
  for(const door of world?.hallDoors||[]){blocked.delete(cellKey(door.cell.x,door.cell.z));world.setHallDoor(door.id,false);}
  if(state){state.scan=null;state.gate=null;state.outage=0;state.cameraFlash=0;state.doorTrail=null;}
  for(const e of enemies){e.searchingId=null;e.inspect=false;e.fakeLeave=false;e.stareTime=0;if(e.id==='guardian')e.model.scale.setScalar(1);}
  $('watcherWarning').hidden=true;
  if(renderer)renderer.toneMappingExposure=1.08;
}
function closeJournal(resume=true){
  if(!journalOpen)return;
  journalOpen=false;$('journalPanel').hidden=true;
  if(resume&&!journalWasPaused)setPaused(false);
}
function openJournal(){
  if(journalOpen){closeJournal();return;}
  if(!state||mode!=='playing'||examUI?.active||!['day','night','detention','principal','finale'].includes(state.phase))return;
  const safe=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  $('journalEntries').innerHTML=EVIDENCE.map((entry,i)=>i<state.proofs.length?
    `<article class="journal-entry"><small>EVIDENCE ${String(i+1).padStart(2,'0')}</small><h3>${safe(entry.title)}</h3><p>${safe(entry.revelation)}</p></article>`:
    `<article class="journal-entry locked"><small>FILE ${String(i+1).padStart(2,'0')} · NOT COLLECTED</small><h3>Unknown evidence</h3><p>Keep investigating to uncover this entry.</p></article>`).join('');
  $('journalTitle').textContent=`${state.proofs.length>=3?'The Watchful Circle':'Evidence journal'} · ${state.proofs.length}/7 evidence files`;
  journalWasPaused=paused;setPaused(true);journalOpen=true;clearTask();$('journalPanel').hidden=false;renderObjective();
}
$('journalBtn').onclick=openJournal;$('journalClose').onclick=()=>closeJournal();

function beginTask(o,kind){
  const evidence=currentEvidence();
  task={kind,item:o,elapsed:0,duration:kind==='evidence'?evidence.duration:4,phase:state.phase,stage:state.proofs.length,pulse:0};
  $('taskPanel').hidden=false;
  $('taskLabel').textContent=kind==='evidence'?evidence.title:'Repairing the electric lock';
  $('taskHint').textContent=touchText('Hold E and stay still. Release E or move to cancel.');
  $('taskProgress').style.width='0%';
  if(kind==='repair'||['print','decode','download'].includes(evidence.method))emitNoise(kind==='repair'?6:evidence.noise,o);
}
function updateTask(dt){
  if(!task)return;
  const t=task;
  if(!keyDown.has('KeyE')||state.phase!==t.phase||player.hidden||player.moving||distance(player,t.item)>2.25||!lineOfSight(player,t.item,blocked)){
    clearTask();say('Stopped. Hold E and stay still at the marker to restart.',2);return;
  }
  t.elapsed+=dt;t.pulse-=dt;
  if(t.pulse<=0){
    t.pulse=.9;const evidence=EVIDENCE[t.stage];
    if(t.kind==='repair'){emitNoise(6,t.item);tone(85,.16,'sawtooth',.045);}
    else if(evidence.method!=='photo'){emitNoise(evidence.noise,t.item);if(['print','download'].includes(evidence.method))noiseSound(.1,.06);}
  }
  $('taskProgress').style.width=`${Math.min(100,t.elapsed/t.duration*100)}%`;
  $('taskHint').textContent=touchText(`Hold E · ${Math.max(0,t.duration-t.elapsed).toFixed(1)} seconds left · Stay still`);
  if(t.elapsed<t.duration)return;
  clearTask();
  if(t.kind==='repair'){
    state.detFuse=false;state.detPower=true;emitNoise(10,t.item);tone(80,.7,'sawtooth',.1,0,160);
    say('Door power restored. Use the key at the door. The supervisor heard the repair.',4);
  }else if(t.stage===state.proofs.length&&!state.proofs.includes(state.day)){
    const evidence=EVIDENCE[t.stage];
    if(evidence.method==='photo'){
      state.cameraFlash=.22;emitNoise(evidence.noise,t.item);tone(800,.08,'square',.10);
      for(const e of enemies)if(e.model.visible&&distance(e,player)<13&&lineOfSight(e,player,blocked)){e.lastSeen={x:player.x,z:player.z};e.alert=8;e.think=0;}
    }
    state.proofs.push(state.day);t.item.available=false;
    showTransition(`EVIDENCE ${state.proofs.length}/7 · ${evidence.title.toUpperCase()}`,'Jamie received the backup.',evidence.revelation,7);
    say('Evidence saved. Press J to read the discovery. Hide until dawn—watchers remember familiar lockers.',6);
    tone(780,.12);tone(1040,.16,'sine',.1,.1);
  }
  updateItems();updateHud();
}

function chooseLocker(){
  const spots=world.hideSpots;
  return [...spots].sort((a,b)=>(state.lockerUses[a.id]||0)-(state.lockerUses[b.id]||0)||distance(player,a)-distance(player,b))[0];
}
function startLockerInspection(e,locker,known=false){
  e.searchingId=locker.id;e.searchTime=0;e.searchKnown=known;e.inspect=true;e.lastSeen={x:locker.x,z:locker.z};e.alert=9;e.think=0;
}
function updateLockerInspection(e,dt){
  const locker=world.hideSpots.find(h=>h.id===e.searchingId);
  if(!locker)return false;
  if(distance(e,locker)>1.65){moveEnemy(e,dt);return true;}
  e.yaw=angleLerp(e.yaw,Math.atan2(locker.x-e.x,locker.z-e.z),Math.min(1,dt*3));
  e.moving=false;
  const inside=player.hidden?.id===locker.id;
  if(inside&&!state.lockerSearch){
    state.lockerSearch={enemyId:e.id,lockerId:locker.id,time:0,duration:5,dangerous:e.searchKnown||(state.lockerUses[locker.id]||0)>1};
    tone(e.id==='guardian'?95:150,.4,'sine',.07);noiseSound(.12,.06);
    say(`${e.name} stops outside and whispers: “${STUDENT_NAME}… ${state.lockerSearch.dangerous?'I know you’re in here.':'are you in there?'}”`,4);
  }
  const search=state.lockerSearch;
  if(inside&&search?.enemyId===e.id){
    if(!search.dangerous&&['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].some(k=>keyDown.has(k))){
      search.dangerous=true;search.time=0;e.searchTime=0;say('They heard you move. Press E to leave before the handle turns!',4);
    }
    search.time+=dt;$('lockerSearch').hidden=false;
    $('searchTitle').textContent=search.dangerous?'They know this locker.':'An eye moves toward the slots.';
    $('searchHint').textContent=touchText(search.dangerous?`Press E to leave NOW · ${Math.ceil(search.duration-search.time)}s before it opens`:'Stay still. Release movement keys and wait for the footsteps to leave.');
    $('searchProgress').style.width=`${Math.min(100,search.time/search.duration*100)}%`;
    world.setLockerInspection?.(locker,true);
    if(search.time>=search.duration){
      if(search.dangerous){clearLockerSearch();capture(e.id);return true;}
      state.lockerUses[locker.id]=Math.min(50,(state.lockerUses[locker.id]||0)+1);
      clearLockerSearch();say('The eye pulls away. Change lockers next time—they remember this one.',4);e.searchTime=5;
    }
  }else if(search?.enemyId===e.id)clearLockerSearch();
  e.searchTime+=dt;
  if(e.searchTime>=5&&!state.lockerSearch){e.searchingId=null;e.inspect=false;e.alert=0;e.searchCooldown=14+Math.random()*7;e.patrolIndex++;e.think=0;}
  return true;
}

function updateNightHazards(dt){
  if(state.phase!=='night')return;
  const level=Math.min(6,state.day),weekday=state.day%7,guardian=enemies.find(e=>e.id==='guardian');
  state.cameraFlash=Math.max(0,state.cameraFlash-dt);state.outage=Math.max(0,state.outage-dt);
  if(level>=2&&state.nightElapsed>=state.outageNext){state.outage=4;state.outageNext+=24;tone(70,.6,'sawtooth',.07);say('Power failure. The halls are darker for four seconds. Keep your bearings.',4);}
  if(weekday===4&&state.fakeAllClear===0&&state.nightElapsed>=12){
    state.fakeAllClear=1;say('INTERCOM: “All staff have left. You may come out.” Footsteps continue. Do not trust it.',7);tone(620,.4,'triangle',.065);
    if(state.lockerSearch?.enemyId!=='guardian')clearLockerSearch();
    for(const e of enemies)if(e.id!=='guardian'){e.fakeLeave=true;e.inspect=false;e.searchingId=null;e.lastSeen={...EXIT};e.alert=10;e.think=0;}
  }
  if(state.fakeAllClear===1&&state.nightElapsed>=22){state.fakeAllClear=2;for(const e of enemies){e.fakeLeave=false;e.alert=0;e.think=0;}say('The teachers double back from the front doors. The all-clear was a lie.',4);}
  if(state.grace>0)return;
  state.scanCooldown-=dt;state.gateCooldown-=dt;
  if(!state.scan&&state.scanCooldown<=0){state.scan={time:0};state.scanCooldown=isWeekend(state.day)?13:20;tone(310,.25,'triangle',.07);}
  if(state.scan){
    state.scan.time+=dt;
    if(state.scan.time>=3&&!state.scan.fired){
      state.scan.fired=true;tone(120,.6,'sawtooth',.09,0,360);
      if(guardian&&distance(guardian,player)<(isWeekend(state.day)?15:12)&&lineOfSight(guardian,player,blocked)){
        if(player.hidden)startLockerInspection(guardian,player.hidden,true);
        else{guardian.lastSeen={x:player.x,z:player.z};guardian.alert=8;guardian.seen=Math.max(guardian.seen,.6);guardian.think=0;}
      }
    }
    if(state.scan.time>=5)state.scan=null;
  }
  if(level>=3&&!state.gate&&state.gateCooldown<=0){
    const doors=world.hallDoors||[],preferred=doors.find(d=>d.room===currentEvidence().room);
    const door=preferred||doors[Math.floor(Math.random()*doors.length)];
    if(door){state.gate={door,time:0,closed:false};state.gateCooldown=isWeekend(state.day)?20:30;}
  }
  if(state.gate){
    const gate=state.gate;gate.time+=dt;
    if(!gate.closed&&gate.time>=3){
      // Never materialize a shutter on the player or a watcher in its doorway.
      if(distance(player,gate.door)<1.3||enemies.some(e=>e.model.visible&&distance(e,gate.door)<1.1))gate.time=2.8;
      else{gate.closed=true;gate.time=3;blocked.add(cellKey(gate.door.cell.x,gate.door.cell.z));world.setHallDoor(gate.door.id,true);for(const e of enemies){e.think=0;e.path=[];}tone(70,.3,'sawtooth',.12);}
    }
    if(gate.closed&&gate.time>=9){blocked.delete(cellKey(gate.door.cell.x,gate.door.cell.z));world.setHallDoor(gate.door.id,false);state.gate=null;for(const e of enemies)e.think=0;}
  }
  const warnings=[];
  if(state.scan)warnings.push(state.scan.time<3?`RED SCAN IN ${Math.ceil(3-state.scan.time)}s · Get behind a wall; lockers may be checked`:'RED SCAN ACTIVE · Keep cover');
  if(state.gate)warnings.push(state.gate.closed?`${ROOMS[state.gate.door.room].label} sealed · opens in ${Math.ceil(9-state.gate.time)}s · Find cover`:`GoGuardian will seal ${ROOMS[state.gate.door.room].label} in ${Math.max(1,Math.ceil(3-state.gate.time))}s · Clear the doorway`);
  if(state.outage>0)warnings.push(`POWER FAILURE · ${Math.ceil(state.outage)}s · Follow your objective`);
  const warning=warnings.join(' / ');
  $('watcherWarning').hidden=!warning;$('watcherWarning').textContent=warning;
}
function startDay(advance=true){
  closeJournal(false);resetNightHazards();
  dareCutscene?.cancel();rescueScene?.cancel();examUI?.close();detentionGuard=null;world.friend.visible=false;world.principal.visible=false;
  if(advance)state.day++;
  state.nightActive=false;state.fatalCapture=false;state.testResults={};state.aTeachers=[];state.favorDay=state.day;
  state.blockedPerkDays=state.blockedPerkDays.filter(d=>d>=state.day);
  player.hidden=null;player.x=SPAWN.x;player.z=SPAWN.z;player.yaw=0;player.pitch=0;state.lightOn=false;state.classes=[];state.trouble=0;
  state.detOpen=false;state.detKey=false;state.detFuse=false;state.detPower=false;blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));
  noiseEvent=null;noiseTime=0;state.moveNoise=0;state.troubleWarned=false;keyDown.clear();
  state.phase=state.day>=7&&state.proofs.length>=7?'finale':'day';state.phaseTime=isWeekend(state.day)?10:25;
  state.battery=Math.max(80,state.battery);state.decoys=Math.max(1,state.decoys);state.grace=10;
  for(const id of ['scare','blackout','mapPanel','hiddenBanner','interact'])$(id).hidden=true;
  $('begin').hidden=false;$('cinemaHeading').textContent='MONDAY · LEAVING HOMEROOM';
  $('scare').classList.remove('friendly');$('friendlyMessage').hidden=true;$('threat').style.boxShadow='none';mapOpen=false;
  resetEnemies();resetInteractionMeshes();updateItems();world.setDetentionKind?.('detention');world.setMood(true,0);
  for(const student of world.students)student.visible=!isWeekend(state.day)&&state.phase!=='finale';
  saveMorning();bell();
  if(state.phase==='finale')showTransition(`${dayName(state.day).toUpperCase()} · 7:30 AM`,'The last bell.',morningMessage(state.proofs.length),4);
  else if(isWeekend(state.day))showTransition(`${dayName(state.day).toUpperCase()} · NO CLASSES`,'No one is coming.','The teachers have gone home. GoGuardian has not.',3.2);
  else showTransition(`${dayName(state.day).toUpperCase()} · 8:00 AM`,'Tests today.','Math and science with Ms. Vale. Music theory with Mr. Reed. An A earns protection tonight.',3.7);
  updateHud();
}

function endNight(){
  const missed=!state.proofs.includes(state.day),oldDay=dayName(state.day);
  if(missed)state.missedProofs++;
  startDay(true);
  if(missed){
    showTransition('JAMIE · MORNING MESSAGE','“The next file is missing.”',morningMessage(state.proofs.length,true),5.5);
    say(`You missed ${oldDay}’s evidence. The same discovery is still waiting. Stay another day.`,7);
  }else if(state.phase!=='finale')showTransition('JAMIE · ENCRYPTED MESSAGE','“The backup is safe.”',morningMessage(state.proofs.length),4.5);
}

function startNight(){
  resetNightHazards();state.scanCooldown=isWeekend(state.day)?11:16;state.gateCooldown=23;state.outageNext=23;state.fakeAllClear=0;
  examUI?.close();state.phase='night';state.nightActive=true;state.fatalCapture=false;
  state.nightRemaining=DIFFICULTY[state.difficulty].night;state.nightElapsed=0;state.phaseTime=state.nightRemaining;state.grace=10;
  if(!isWeekend(state.day)&&Object.keys(state.testResults).length<2){state.trouble+=12;say('You skipped a test. The teachers noticed.',4);}
  if(!player.hidden){state.trouble+=12;say('Lights out. Find cover. Patrols begin in ten seconds.',5);}
  state.lightOn=false;world.setMood(false,0);updateItems();bell();world.principal.visible=false;
  for(const student of world.students)student.visible=false;
  showTransition(`NIGHT ${state.day+1} · ${state.proofs.length}/7 EVIDENCE FILES`,isWeekend(state.day)?'No teachers to save you.':'Lights out.',NIGHT_RULES[state.day%7],4.5);
  updateHud();
}

function updateItems(){
  for(const o of world.interactables){
    let visible=true;
    if(o.type==='proof'){
      visible=state?.phase==='night'&&o.room===currentEvidence().room&&!state.proofs.includes(state.day);
      o.label='Hold E · '+currentEvidence().title;
    }
    else if(o.type==='flashlight')visible=!state?.hasLight;
    else if(o.id==='staffKey')visible=!state?.hasKey;
    else if(o.type==='battery')visible=!o.taken;
    else if(o.type==='decoy')visible=!o.taken;
    else if(o.type==='detKey')visible=['detention','principal'].includes(state?.phase)&&!state.detKey;
    else if(o.type==='detFuse')visible=['detention','principal'].includes(state?.phase)&&!state.detFuse&&!state.detPower;
    else if(o.type==='detDoor')visible=!state?.detOpen;
    else if(o.type==='class')visible=false;
    if(o.mesh)o.mesh.visible=visible;o.available=visible;
  }
}
function emitNoise(strength=5,pos=player){noiseEvent={x:pos.x,z:pos.z,strength};noiseTime=1.4;state.moveNoise=Math.max(state.moveNoise,strength)}
function toggleLight(){
  if(!state.hasLight){say('Your flashlight is on a desk in Homeroom. Check the map.',3);return;}
  if(state.battery<=0){say('Battery empty. Find a spare battery in the library or science lab.',3);return;}
  if(player.hidden){say('Keep the flashlight off while hiding.',2);return;}
  state.lightOn=!state.lightOn;tone(state.lightOn?580:340,.06,'square',.04);
}
function throwDecoy(){
  if(state.phase!=='night')return;
  if(state.decoys<=0){say('No wind-up toys left. Look in the band room.',3);return;}
  if(state.decoyCooldown>0)return;
  let pos={x:player.x-Math.sin(player.yaw)*5,z:player.z-Math.cos(player.yaw)*5};
  if(!isWalkable(pos.x,pos.z,.2,blocked)||!lineOfSight(player,pos,blocked))pos={x:player.x,z:player.z};
  state.decoys--;state.decoyCooldown=1;noiseEvent={...pos,strength:18,decoy:true};noiseTime=7;
  for(const e of enemies){e.lastSeen={...pos};e.alert=6;e.think=0;e.inspect=false;}
  tone(760,.15,'triangle',.08);tone(530,.15,'triangle',.07,.2);tone(900,.15,'triangle',.06,.4);say('The wind-up toy rattles down the hall.',3);updateHud();
}
function candidateInteraction(){
  if(player.hidden)return{type:'leaveHide',label:'Leave hiding spot'};
  let best=null,bestDistance=2.25;
  const forward={x:-Math.sin(player.yaw),z:-Math.cos(player.yaw)};
  const candidates=[...world.interactables,...world.hideSpots.map(h=>({...h,type:'hide',label:`Hide in ${h.label||'locker'}`}))];
  for(const o of candidates){
    if(o.type==='proof'&&!o.available)continue;
    if(['flashlight','key','battery','decoy','detKey','detFuse'].includes(o.type)&&!o.available)continue;
    if(o.type==='class')continue;
    if(o.type==='exam'&&(state.phase!=='day'||isWeekend(state.day)||state.testResults[o.teacherId]))continue;
    if(o.type.startsWith('det')&&!['detention','principal'].includes(state.phase))continue;
    if(['detention','principal'].includes(state.phase)&&!o.type.startsWith('det'))continue;
    if(o.type==='exit'&&state.phase!=='finale')continue;
    if(o.type==='hide'&&!['night','day'].includes(state.phase))continue;
    const d=distance(player,o);if(d>bestDistance)continue;
    if(d>.75&&((o.x-player.x)*forward.x+(o.z-player.z)*forward.z)/d<.18)continue;
    if(!lineOfSight(player,o,blocked)&&o.type!=='detDoor')continue;
    best=o;bestDistance=d;
  }
  return best;
}
function interact(){
  if(!state||paused||!['day','night','detention','principal','finale'].includes(state.phase))return;
  const o=candidateInteraction();if(!o)return;
  switch(o.type){
    case 'leaveHide':player.hidden=null;clearLockerSearch();$('hiddenBanner').hidden=true;say('You leave the locker. Move quietly to different cover.',2);break;
    case 'hide':{
      const observed=enemies.some(e=>e.seen>.2&&lineOfSight(e,player,blocked)&&distance(e,player)<12);
      player.hidden=o;player.x=o.x;player.z=o.z;player.yaw=o.angle??player.yaw;state.lightOn=false;$('hiddenBanner').hidden=false;
      state.lockerUses[o.id]=Math.min(50,(state.lockerUses[o.id]||0)+1);clearTask();
      if(observed){say('They saw you hide. Move before they check this locker!',3);for(const e of enemies)if(e.seen>.2)startLockerInspection(e,o,true);}
      else say((state.lockerUses[o.id]||0)>1?'A familiar locker. They may remember it. Change cover if a watcher stops here.':'You pull the locker door almost closed. Keep still if someone checks it.',3);tone(110,.18,'triangle',.07);break;
    }
    case 'flashlight':state.hasLight=true;state.lightOn=state.phase!=='day';say('Flashlight found. F toggles it. Its beam can give you away.',4);o.available=false;break;
    case 'key':state.hasKey=true;say('Staff key found. It opens the locked evidence cabinets.',3);o.available=false;emitNoise(3);break;
    case 'battery':state.battery=Math.min(100,state.battery+45);o.taken=true;say('Fresh battery. +45% charge.',2);tone(660,.1);break;
    case 'decoy':state.decoys+=2;o.taken=true;say('Two wind-up toys. Press G to draw patrols away.',3);break;
    case 'proof':
      if(state.proofs.length>0&&!state.hasKey){say('The evidence cabinet is locked. Find the staff key in the Office.',4);emitNoise(3);break;}
      if(!task&&!state.proofs.includes(state.day))beginTask(o,'evidence');break;
    case 'exam':beginExam(o.teacherId);break;
    case 'class':state.classes.push(o.room);emitNoise(2);tone(520,.1);say(`${ROOMS[o.room].label}: present. ${state.classes.length}/2 classes done.`,3);break;
    case 'detKey':state.detKey=true;emitNoise(2);say('Detention key. One lock down.',3);tone(760,.1);break;
    case 'detFuse':state.detFuse=true;emitNoise(2);say('A spare fuse. Put it in the panel beside the door.',4);break;
    case 'detPanel':
      if(state.detPower){say('The door has power. Use the key on the detention door.',3);break;}
      if(!state.detFuse){say('The panel needs a fuse. Search the supply shelf.',3);break;}
      if(!task)beginTask(o,'repair');break;
    case 'detDoor':
      if(!state.detKey){say('Locked. Search the teacher’s desk for the key.',3);break;}
      if(!state.detPower){say('The electric lock has no power. Fix the fuse panel first.',3);break;}
      state.detOpen=true;emitNoise(4);blocked.delete(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));if(world.detentionDoor)world.detentionDoor.visible=false;
      say('Unlocked. Step through the door and return to the halls.',4);tone(180,.2);break;
    case 'exit':if(state.proofs.length>=7)finish(true);else say('Collect all seven evidence files to expose the Watchful Circle.',3);break;
  }
  updateItems();updateHud();
}

addEventListener('keydown',event=>{
  if(journalOpen){if(['KeyJ','Escape'].includes(event.code)){event.preventDefault();closeJournal();}return;}
  if(examUI?.active&&event.code!=='Escape')return;
  if(mode==='intro'&&!paused&&['Space','Enter'].includes(event.code)){
    event.preventDefault();dareCutscene?.finish();return;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(event.code)&&mode==='playing')event.preventDefault();
  if(event.repeat){keyDown.add(event.code);return;}
  if(event.code==='Escape'){setPaused(true);return;}
  if(event.code==='KeyJ'){openJournal();return;}
  if(mode!=='playing'||paused||!state)return;
  keyDown.add(event.code);
  if(['capture','blackout','forgiven','rescue'].includes(state.phase))return;
  if(event.code==='KeyE')interact();if(event.code==='KeyF')toggleLight();if(event.code==='KeyG')throwDecoy();
  if(event.code==='KeyM'){mapOpen=!mapOpen;$('mapPanel').hidden=!mapOpen;if(mapOpen)drawMap();}
});
addEventListener('keyup',event=>{keyDown.delete(event.code);if(event.code==='KeyE'&&task)clearTask();});
addEventListener('mousemove',event=>{
  if(examUI?.active||document.pointerLockElement!==$('view')||paused||mode!=='playing'||!state||['capture','blackout','forgiven','rescue'].includes(state.phase))return;
  player.yaw-=event.movementX*.0022;player.pitch=clamp(player.pitch-event.movementY*.0022,-1.25,1.25);
});
$('closeMap').onclick=()=>{mapOpen=false;$('mapPanel').hidden=true};
function touchGameplayActive(){
  return mode==='playing'&&!paused&&!examUI?.active&&!journalOpen&&!mapOpen&&!!state&&['day','night','detention','principal','finale'].includes(state.phase);
}
const touchControls=touchEnabled?window.DaftTouch.create({
  id:'after-bell',title:'Left stick moves · Drag the school view to look',
  joysticks:[{id:'move',label:'Move',keys:{up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'}}],
  buttons:[
    {id:'use',label:'Use / Hide',ariaLabel:'Interact, hide or hold to collect evidence and repair',keys:['KeyE']},
    {id:'sprint',label:'Run',keys:['ShiftLeft']},
    {id:'crouch',label:'Crouch',keys:['KeyC']},
    {id:'light',label:'Light',ariaLabel:'Toggle flashlight',keys:['KeyF']},
    {id:'decoy',label:'Decoy',keys:['KeyG']},
    {id:'map',label:'Map',keys:['KeyM']},
    {id:'journal',label:'Journal',ariaLabel:'Open evidence journal',keys:['KeyJ']},
    {id:'pause',label:'Pause',onPress:()=>setPaused(true)}
  ],
  lookElement:$('view'),isActive:touchGameplayActive,
  onLook(dx,dy){player.yaw-=dx*.004;player.pitch=clamp(player.pitch-dy*.004,-1.25,1.25);}
}):null;
if(touchEnabled){
  $('pause').querySelector('.hint').innerHTML='Left stick moves · Drag the view to look · Use / Hide interacts or leaves a locker<br>Hold Use / Hide and stay still to collect evidence or repair<br>Hold Run to sprint · Hold Crouch to sneak<br>Light toggles the flashlight · Decoy throws a toy · Map shows the school · Journal shows collected evidence';
  $('pause').querySelector('.dialog>p:not(.eyebrow)').textContent='Tap Resume to return to the school.';
  $('hiddenBanner').querySelector('small').textContent='Use / Hide to leave · Flashlight off';
  $('mapPanel').querySelector('small').textContent='Tap × to close · The map does not stop time.';
  $('journalPanel').querySelector('.journal-footer').textContent='Tap × to close · The investigation pauses while you read.';
  $('journalBtn').querySelector('kbd').textContent='▤';
  $('taskPanel').querySelector('small').textContent='KEEP HOLDING USE';
  $('interact').querySelector('kbd').textContent='USE';
  $('begin').innerHTML='Skip <span>→</span>';
}


function movePlayer(dt){
  const lookRate=1.7;
  if(keyDown.has('ArrowLeft')||keyDown.has('KeyQ'))player.yaw+=dt*lookRate;
  if(keyDown.has('ArrowRight')||keyDown.has('KeyR'))player.yaw-=dt*lookRate;
  if(keyDown.has('ArrowUp'))player.pitch=clamp(player.pitch+dt*lookRate,-1.25,1.25);
  if(keyDown.has('ArrowDown'))player.pitch=clamp(player.pitch-dt*lookRate,-1.25,1.25);
  player.crouching=keyDown.has('ControlLeft')||keyDown.has('ControlRight')||keyDown.has('KeyC');
  player.height=THREE.MathUtils.lerp(player.height,player.crouching?1.05:1.65,1-Math.exp(-dt*12));
  player.moving=false;player.sprinting=false;
  if(player.hidden)return;
  let f=(keyDown.has('KeyW')?1:0)-(keyDown.has('KeyS')?1:0),s=(keyDown.has('KeyD')?1:0)-(keyDown.has('KeyA')?1:0);
  const n=Math.hypot(f,s);if(n===0)return;f/=n;s/=n;player.moving=true;
  player.sprinting=(keyDown.has('ShiftLeft')||keyDown.has('ShiftRight'))&&!player.crouching;
  const speed=player.crouching?1.8:player.sprinting?5.2:3.3;
  const dx=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)*speed*dt,dz=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)*speed*dt;
  // Axis-separated small steps prevent tunneling and allow sliding past wall corners.
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.12));
  for(let i=0;i<steps;i++){
    const nx=player.x+dx/steps,nz=player.z+dz/steps;
    if(canOccupy(nx,player.z))player.x=nx;if(canOccupy(player.x,nz))player.z=nz;
  }
  for(const room of Object.values(ROOMS))if(room.id!=='detention'&&distance(player,room.door)<.8){state.doorTrail={...room.door,room:room.id,time:state.elapsed};break;}
  walkingTime+=dt;player.bob+=dt*(player.sprinting?13:8);
  if(walkingTime>(player.sprinting?.3:player.crouching?.75:.48)){
    walkingTime=0;noiseSound(.045,player.sprinting?.12:player.crouching?.018:.04);
    if(['night','detention','principal'].includes(state.phase))emitNoise(player.sprinting?10:player.crouching?1:3);
  }
  if(player.sprinting&&state.phase==='night')state.trouble=clamp(state.trouble+dt*.8,0,100);
}
function canOccupy(x,z){
  if(!isWalkable(x,z,.27,blocked))return false;
  for(const c of world.colliders||[])if(x>c.minX-.25&&x<c.maxX+.25&&z>c.minZ-.25&&z<c.maxZ+.25)return false;
  return true;
}
function navBlocks(){return new Set([...furnitureNav,...blocked]);}
function navTarget(pos,nav){
  const cell=worldToGrid(pos);
  if(!nav.has(cellKey(cell.x,cell.z))&&isWalkable(pos.x,pos.z,.1,nav))return pos;
  let best=null,d=Infinity;
  for(let z=cell.z-2;z<=cell.z+2;z++)for(let x=cell.x-2;x<=cell.x+2;x++){
    const p=gridToWorld(x,z);if(!isWalkable(p.x,p.z,.27,nav))continue;
    const next=distance(p,pos);if(next<d){best=p;d=next;}
  }
  return best;
}
function positionCamera(dt){
  if(!camera)return;
  const bob=player.moving&&!player.hidden?Math.sin(player.bob)*.022:0;
  camera.position.set(player.x,player.height+bob,player.z);camera.rotation.set(player.pitch,player.yaw,0);
  flashlight.position.copy(camera.position);flashlight.position.y-=.16;
  const direction=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  flashTarget.position.copy(camera.position).addScaledVector(direction,14);
  flashlight.intensity=state?.lightOn?19*atmosphereFlicker*(state.outage>0?.35:1):0;
  renderer.toneMappingExposure=state?.cameraFlash>0?(settings.reduced?1.2:2.2):state?.outage>0?.48:1.08;
  hand.visible=!!state?.hasLight&&!player.hidden&&!['capture','blackout','forgiven','rescue'].includes(state.phase);
  hand.position.y=bob*.5;
}
function moveEnemy(e,dt){
  e.moving=false;e.surge=Math.max(0,(e.surge||0)-dt);
  e.think-=dt;e.alert=Math.max(0,e.alert-dt);e.blinded=Math.max(0,e.blinded-dt);
  if(e.think<=0){
    let target;
    if(e.searchingId)target=world.hideSpots.find(h=>h.id===e.searchingId)||e.lastSeen;
    else if(e.alert>0&&e.lastSeen)target=e.lastSeen;
    else{target=PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]];if(distance(e,target)<1.15){e.patrolIndex++;target=PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]];}}
    const nav=navBlocks(),goal=navTarget(target,nav);
    e.path=goal?findPath(e,goal,nav):[];e.pathIndex=e.path.length>1?1:0;e.think=.7;
  }
  if(e.blinded>0)return;
  const target=e.path[e.pathIndex];if(!target)return;
  const d=distance(e,target);if(d<.1){e.pathIndex++;return;}
  const speed=e.speed*DIFFICULTY[state.difficulty].speed*(1+Math.min(6,state.day)*.035)*(e.alert>0?1.24:1)*(isWeekend(state.day)&&e.id==='guardian'?1.18:1)*(e.surge>0?1.15:1);
  const step=Math.min(d,speed*dt),nx=e.x+(target.x-e.x)/d*step,nz=e.z+(target.z-e.z)/d*step;
  if(canOccupy(nx,nz)){e.x=nx;e.z=nz;e.moving=true;}else{e.path=[];e.think=0;}
  const wanted=Math.atan2(target.x-e.x,target.z-e.z);e.wantedYaw=wanted;e.yaw=angleLerp(e.yaw,wanted,Math.min(1,dt*(e.id==='guardian'?8:3.5)));
}
function angleLerp(a,b,t){let d=(b-a+Math.PI)%(Math.PI*2);if(d<0)d+=Math.PI*2;return a+(d-Math.PI)*t;}
function updateEnemies(dt){
  let threat=0;
  for(const e of enemies){
    e.model.visible=e.id==='guardian'||!isWeekend(state.day);
    if(!e.model.visible)continue;
    if(state.phase==='night'&&state.grace<=0){
      e.searchCooldown=Math.max(0,e.searchCooldown-dt);e.stareCooldown=Math.max(0,e.stareCooldown-dt);
      if(e.fakeLeave){moveEnemy(e,dt);poseWatcher(e,dt);continue;}
      if(e.searchingId){updateLockerInspection(e,dt);poseWatcher(e,dt);if(state.phase!=='night')break;continue;}
      const d=distance(e,player),los=lineOfSight(e,player,blocked);
      const facing={x:Math.sin(e.yaw),z:Math.cos(e.yaw)};
      const dot=d>.01?((player.x-e.x)*facing.x+(player.z-e.z)*facing.z)/d:1;
      let detected=false;
      // The sight teacher also notices doors that were just disturbed.
      if(e.id==='teacher'&&state.doorTrail&&state.elapsed-state.doorTrail.time<7&&distance(e,state.doorTrail)<13&&lineOfSight(e,state.doorTrail,blocked)&&e.alert<=0){e.lastSeen={x:state.doorTrail.x,z:state.doorTrail.z};e.alert=4;e.think=0;}
      if(!player.hidden){
        if(e.id==='band'){
          if(noiseEvent&&noiseTime>0){const nd=distance(e,noiseEvent),range=noiseEvent.strength*DIFFICULTY[state.difficulty].noise*(1+state.trouble*.002+Math.min(6,state.day)*.045);
            if(nd<range*(lineOfSight(e,noiseEvent,blocked)?1:.48)){e.lastSeen={x:noiseEvent.x,z:noiseEvent.z};e.alert=7;e.think=Math.min(e.think,.1);detected=nd<4&&!noiseEvent.decoy;}}
          detected=detected||(d<3.8&&los&&dot>.2);
        }else{
          const range=(e.id==='guardian'?11:9)*DIFFICULTY[state.difficulty].sight*(1+state.trouble*.002+Math.min(6,state.day)*.035)*(player.crouching?.72:1)*(state.lightOn?1.2:1);
          detected=los&&d<range&&(dot>.38||d<2.2);
        }
      }
      if(detected){
        e.lastSeen={x:player.x,z:player.z};e.alert=7;e.think=Math.min(e.think,.2);e.seen=Math.min(2,e.seen+dt);
        state.trouble=clamp(state.trouble+dt*3,0,100);
        if(state.day>=3)for(const other of enemies)if(other!==e&&other.model.visible){other.lastSeen={x:player.x,z:player.z};other.alert=Math.max(other.alert,5);other.think=Math.min(other.think,.2);}
        if(e.seen<dt*1.5){tone(e.id==='band'?220:460,.25,'triangle',.07);say(e.id==='band'?'Mr. Reed heard you. Stop running.':e.id==='teacher'?'Ms. Vale spotted you. Break her line of sight.':'GoGuardian is watching. Get behind a wall.',2.4);}
      }else e.seen=Math.max(0,e.seen-dt*1.5);
      if(e.alert>0&&d<9)threat=Math.max(threat,clamp((9-d)/8,0,1));
      if(detected&&los&&d<1.25&&e.blinded<=0){capture(e.id);break;}
      // Guardian can also catch a student who stands directly in its scan for too long.
      if(e.id==='guardian'&&detected&&e.seen>=1.85){capture(e.id);break;}
      // Reused lockers draw deliberate searches. Brand-new cover can pass a
      // five-second stillness inspection; known cover must be abandoned.
      if(e.searchCooldown<=0&&e.alert<=0&&state.day>=1){
        const used=world.hideSpots.filter(h=>(state.lockerUses[h.id]||0)>0);
        const locker=[...(used.length?used:world.hideSpots)].sort((a,b)=>(state.lockerUses[b.id]||0)-(state.lockerUses[a.id]||0)||distance(e,a)-distance(e,b))[0];
        if(locker)startLockerInspection(e,locker,false);
      }
      const playerLooking=los&&d>5&&((-Math.sin(player.yaw)*(e.x-player.x)-Math.cos(player.yaw)*(e.z-player.z))/d)>.8;
      if(e.id!=='guardian'&&e.alert<=0&&state.day>=1&&playerLooking&&(e.stareTime>0||e.stareCooldown<=0)){
        e.stareTime+=dt;e.moving=false;
        if(e.stareTime>3){e.stareTime=0;e.stareCooldown=10;}
      }else{
        if(e.stareTime>0){e.stareTime=0;e.stareCooldown=10;e.surge=2;}
        moveEnemy(e,dt);
      }
    }else if(state.phase==='day'||state.phase==='finale'){
      e.moving=false;
      e.think-=dt;if(e.think<=0){const nav=navBlocks(),goal=navTarget(PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]],nav);e.path=goal?findPath(e,goal,nav):[];e.pathIndex=e.path.length>1?1:0;e.think=1;}
      const point=e.path[e.pathIndex];if(point){const d=distance(e,point);if(d<.15)e.pathIndex++;else{const step=Math.min(d,dt*.85),nx=e.x+(point.x-e.x)/d*step,nz=e.z+(point.z-e.z)/d*step;if(canOccupy(nx,nz)){e.x=nx;e.z=nz;e.moving=true;}else{e.path=[];e.think=0;}e.yaw=angleLerp(e.yaw,Math.atan2(point.x-e.x,point.z-e.z),dt*3);}}
      if(e.pathIndex>=e.path.length)e.patrolIndex++;
    }
    poseWatcher(e,dt);
  }
  $('threat').style.boxShadow=threat>.08?`inset 0 0 ${50+threat*80}px rgba(183,48,47,${threat*.35})`:'inset 0 0 100px transparent';
  if(droneGain&&audioContext)droneGain.gain.setTargetAtTime(state.phase==='night'?.02+threat*.06:.006,audioContext.currentTime,.3);
}
function poseWatcher(e,dt){
  e.model.position.x=e.x;e.model.position.z=e.z;e.model.rotation.y=e.yaw;
  if(e.id==='guardian'){
    e.model.position.y=1.6+Math.sin(state.elapsed*2)*.11;
    const scan=state.scan;const scale=scan?1.06+Math.sin(state.elapsed*5)*.025:1;
    e.model.scale.setScalar(scale);
  }else animateTeacher(e,state.elapsed,dt);
}
function animateTeacher(e,t,dt){
  const limbs=e.model.userData.limbs;
  if(limbs){const stride=e.moving||['detention','principal'].includes(state.phase)?Math.sin(t*(e.alert>0?10:5))*.27:0;
    if(limbs.leftLeg)limbs.leftLeg.rotation.x=stride;if(limbs.rightLeg)limbs.rightLeg.rotation.x=-stride;
    if(limbs.leftArm)limbs.leftArm.rotation.x=-stride*.7;if(limbs.rightArm)limbs.rightArm.rotation.x=stride*.7;
  }
  const head=e.model.userData.head;if(head){
    const night=state.phase==='night',wanted=night&&(e.alert>0||e.stareTime>0||e.searchingId)?Math.atan2(player.x-e.x,player.z-e.z):(e.wantedYaw??e.yaw);
    const lead=Math.atan2(Math.sin(wanted-e.yaw),Math.cos(wanted-e.yaw));
    head.rotation.z=Math.sin(t*.45+e.id.length)*(night?.065:.025);
    head.rotation.y=THREE.MathUtils.lerp(head.rotation.y,night?clamp(lead,-.8,.8):Math.sin(t*.5)*.08,Math.min(1,dt*12));
  }
}
function beginExam(teacherId){
  if(!state||state.phase!=='day'||isWeekend(state.day)||state.testResults[teacherId]||examUI.active)return;
  examUI.open(makeExam(teacherId,state.day),{perkBlocked:state.blockedPerkDays.includes(state.day)});
  keyDown.clear();mapOpen=false;$('mapPanel').hidden=true;$('interact').hidden=true;document.exitPointerLock?.();
}
function completeExam(result){
  if(!state||state.phase!=='day')return;
  state.testResults[result.teacherId]=result;
  state.classes.push(result.teacherId==='band'?'band':'lab');
  const teacher=enemies.find(e=>e.id===result.teacherId);
  if(result.isA&&!state.blockedPerkDays.includes(state.day)){
    if(!state.aTeachers.includes(result.teacherId))state.aTeachers.push(result.teacherId);
    state.favorDay=state.day;say(`${teacher.name}: “Excellent work. I’ll look out for you tonight.” A protection earned.`,6);tone(660,.3,'sine',.10);
  }else if(result.isBad){
    const banned=nextSchoolDay(state.day);if(!state.blockedPerkDays.includes(banned))state.blockedPerkDays.push(banned);
    state.schoolRemaining=state.phaseTime;state.disciplineReturn='day';saveMorning();enterDetention('principal');
    say(`${result.letter}: sent to Principal Mercer. No A-grade protection on ${dayName(banned)}.`,7);
  }else if(result.isA)say('A recorded, but the principal has blocked protection for this school day.',6);
  else say(`${teacher.name}: ${result.letter} (${result.score}%). No protection tonight.`,4);
  updateHud();requestLook();
}
function hasTeacherFavor(id){return !isWeekend(state.day)&&state.favorDay===state.day&&state.aTeachers.includes(id)&&!state.blockedPerkDays.includes(state.day);}
function showRescueLine(text){
  $('intro').hidden=false;$('intro').dataset.speaker='you';$('begin').hidden=true;
  $('cinemaHeading').textContent='AFTER HOURS · A-GRADE RESCUE';$('cutsceneSpeaker').textContent='TEACHER PROTECTION';
  $('cutsceneText').textContent=text;$('cutsceneBeat').textContent='Your A grade earned this protection.';$('transition').hidden=true;
}
function releaseStudent(){
  if(!state||state.phase!=='rescue'&&state.phase!=='forgiven')return;
  $('scare').hidden=true;$('scare').style.opacity=1;$('scare').classList.remove('friendly');$('friendlyMessage').hidden=true;$('transition').hidden=true;
  $('intro').hidden=true;$('begin').hidden=false;
  state.phase='night';state.grace=7;player.hidden=null;state.lightOn=false;noiseEvent=null;noiseTime=0;keyDown.clear();
  for(const e of enemies){e.alert=0;e.seen=0;e.inspect=false;e.searchingId=null;e.lastSeen=null;e.blinded=7;}
  say('Released. Your A-grade teacher is protecting you tonight. Keep searching for evidence. “I can’t help you on Saturday.”',6);updateHud();requestLook();
}
function friendlyRelease(teacherId){
  state.phase='forgiven';friendlyTime=0;captureEnemy=teacherId;state.lightOn=false;player.hidden=null;keyDown.clear();
  $('mapPanel').hidden=true;mapOpen=false;$('hiddenBanner').hidden=true;$('transition').hidden=true;
  const image=$('scareImage');image.src=`./assets/${teacherId}-friendly.webp`;image.alt='Your teacher smiles kindly';image.hidden=false;image.onerror=()=>{image.hidden=true;};
  $('scareFallback').hidden=true;$('scare').hidden=false;$('scare').style.opacity=0;$('scare').classList.add('friendly');$('scareWhite').style.opacity=0;
  image.style.transform='none';image.style.filter='brightness(1)';$('friendlyMessage').hidden=false;
  const teacher=enemies.find(e=>e.id===teacherId);$('friendlyMessage').textContent=`${teacher.name}: “An A? Nicely done. You can go.”`;
  tone(520,.35,'sine',.07);document.exitPointerLock?.();
}
function updateFriendly(dt){
  $('scare').style.opacity=Math.min(1,(friendlyTime+dt)/.45);
  friendlyTime+=dt;$('scareImage').style.filter=`brightness(${1+Math.min(1,friendlyTime/1.8)*.10})`;
  if(friendlyTime>=1.8)releaseStudent();
}

function capture(enemy){
  if(!['night','detention','principal'].includes(state.phase))return;
  resetNightHazards();
  captureKind=state.phase==='principal'?'principal':'detention';
  if(state.phase==='night'&&enemy!=='principal'&&!isWeekend(state.day)){
    if(hasTeacherFavor(enemy)){friendlyRelease(enemy);return;}
    const savior=enemies.find(e=>e.id!=='guardian'&&hasTeacherFavor(e.id)&&e.model.visible&&distance(e,player)<10&&lineOfSight(e,player,blocked)&&findPath(e,navTarget(player,navBlocks())||player,navBlocks()).length);
    if(savior){
      state.phase='rescue';state.lightOn=false;player.hidden=null;keyDown.clear();$('hiddenBanner').hidden=true;$('mapPanel').hidden=true;mapOpen=false;
      if(rescueScene.start({captorId:enemy,saviorId:savior.id})){document.exitPointerLock?.();updateHud();return;}
      friendlyRelease(savior.id);return;
    }
  }
  if(['detention','principal'].includes(state.phase))state.detRecatches=(state.detRecatches||0)+1;
  state.phase='capture';captureTime=0;captureEnemy=enemy;state.lightOn=false;state.captures++;player.hidden=null;
  $('scare').style.opacity=1;$('scare').classList.remove('friendly');$('friendlyMessage').hidden=true;
  $('hiddenBanner').hidden=true;$('scare').hidden=false;$('blackout').hidden=true;$('mapPanel').hidden=true;mapOpen=false;$('transition').hidden=true;
  const image=$('scareImage');image.src=`./assets/${enemy}.webp`;image.alt=enemy==='band'?'Mr. Reed, the uncanny band teacher':enemy==='teacher'?'Ms. Vale, the uncanny teacher':enemy==='principal'?'Principal Mercer, the uncanny principal':'The watchful GoGuardian eye';
  image.hidden=false;$('scareFallback').hidden=true;image.onerror=()=>{image.hidden=true;$('scareFallback').hidden=false;};
  $('scareWhite').style.opacity=0;document.exitPointerLock?.();keyDown.clear();
  noiseSound(.9,.65);tone(enemy==='band'?145:95,2.5,'sawtooth',.16,0,enemy==='guardian'?560:380);
  // A fatal weekend capture invalidates the morning checkpoint immediately.
  if(captureDestination(state.day)==='dead'){state.fatalCapture=true;try{localStorage.removeItem(SAVE_KEY)}catch{}updateResume();}
}
function updateCapture(dt){
  captureTime+=dt;
  if(captureTime<3){
    const p=captureTime/3,shake=settings.reduced?0:2+p*18;
    const x=(Math.random()-.5)*shake,y=(Math.random()-.5)*shake;
    $('scareImage').style.transform=`translate(${x}px,${y}px) scale(${1.04+p*.16})`;
    $('scareFallback').style.transform=`translate(${x}px,${y}px) scale(${1.04+p*.16})`;
    $('scareImage').style.filter=`brightness(${.7+Math.pow(p,2)*(settings.reduced?1:12)})`;
    $('scareWhite').style.opacity=settings.reduced?Math.pow(p,3)*.25:Math.pow(p,3);
  }else{
    state.phase='blackout';$('scare').hidden=true;$('blackout').hidden=false;
    if(captureTime>=5){
      $('blackout').hidden=true;
      if(captureDestination(state.day)==='dead')finish(false);
      else enterDetention(captureKind);
    }
  }
}
function enterDetention(kind='detention'){
  resetNightHazards();
  world.setDetentionKind?.(kind);state.disciplineKind=kind;
  if(kind!=='principal')state.disciplineReturn='night';
  state.phase=kind==='principal'?'principal':'detention';state.detKey=false;state.detFuse=false;state.detPower=false;state.detOpen=false;state.phaseTime=0;detLampTime=0;
  state.detSuspicion=0;noiseEvent=null;noiseTime=0;keyDown.clear();
  blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));world.detentionDoor.visible=true;
  player.x=DETENTION_SPAWN.x;player.z=DETENTION_SPAWN.z;player.yaw=Math.PI;player.pitch=0;state.lightOn=false;
  world.randomizeDiscipline?.(state.day*101+state.captures*17+(state.detRecatches||0)*7+(kind==='principal'?43:0));
  state.battery=Math.max(35,state.battery);world.setMood(false,0);
  for(const e of enemies)e.model.visible=false;world.principal.visible=false;
  // The same teacher supervises this escape and can send you back to your seat.
  const teacher=kind==='principal'?principalGuard:enemies.find(e=>e.id===captureEnemy&&e.id!=='guardian')||enemies.find(e=>e.id==='teacher');
  detentionGuard=teacher;
  Object.assign(teacher,{x:ROOMS.detention.center.x,z:ROOMS.detention.bounds.minZ+.75,yaw:Math.PI,path:[],pathIndex:0,patrolIndex:0,think:0,alert:0,seen:0,blinded:0,lastSeen:null,inspect:false,detWait:0});
  teacher.model.visible=true;teacher.model.position.set(teacher.x,0,teacher.z);teacher.model.rotation.y=teacher.yaw;
  updateItems();showTransition('DISCIPLINARY RECORD UPDATED',kind==='principal'?'Principal’s office.':state.detRecatches?'Back in detention.':'Detention.','The teacher is watching. Find cover, stay quiet, and unlock the door.',3);
  say('The teacher checks the room. Crouch behind the filing cabinets. Running gives you away.',6);
  requestLook();updateHud();
}

// Walls and the tall filing cabinets block the teacher's view. Desks stay low.
function detentionSight(from,to){
  if(!lineOfSight(from,to,blocked))return false;
  for(const c of world.sightBlockers||[]){
    let lo=0,hi=1;
    for(const axis of ['x','z']){
      const delta=to[axis]-from[axis],minimum=c[axis==='x'?'minX':'minZ'],maximum=c[axis==='x'?'maxX':'maxZ'];
      if(Math.abs(delta)<1e-8){if(from[axis]<minimum||from[axis]>maximum){lo=2;break;}}
      else{const a=(minimum-from[axis])/delta,b=(maximum-from[axis])/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
    }
    if(lo<=hi&&hi>0&&lo<1)return false;
  }
  return true;
}

function updateDetentionGuard(dt){
  const e=detentionGuard;if(!e||!['detention','principal'].includes(state.phase))return;
  if(state.phaseTime<3.2){if(e.model.userData.head)e.model.userData.head.rotation.x=.26;return;}
  const difficulty=DIFFICULTY[state.difficulty],d=distance(e,player),los=detentionSight(e,player);
  const facing={x:Math.sin(e.yaw),z:Math.cos(e.yaw)},dot=d>.01?((player.x-e.x)*facing.x+(player.z-e.z)*facing.z)/d:1;
  const range=(player.crouching?4.4:6.8)*difficulty.sight*(state.lightOn?1.25:1),sees=los&&d<range&&(dot>.58||d<1.35);
  if(noiseEvent&&noiseTime>0&&!noiseEvent.decoy&&distance(e,noiseEvent)<noiseEvent.strength*(e.id==='band'?1.05:.78)*difficulty.noise){
    e.lastSeen={x:noiseEvent.x,z:noiseEvent.z};e.alert=Math.max(e.alert,4);e.think=Math.min(e.think,.15);
  }
  if(sees){
    e.seen=Math.min(1.5,e.seen+dt*(player.crouching?.85:1.4));e.lastSeen={x:player.x,z:player.z};e.alert=4;e.think=Math.min(e.think,.18);
    if(e.seen<=dt*1.5){say(`${e.name}: “Back to your seat!” Break line of sight.`,3);tone(220,.22,'triangle',.10);}
  }else e.seen=Math.max(0,e.seen-dt*.65);
  state.detSuspicion=clamp(Math.max(e.seen/1.5,e.alert>0?.35:0),0,1);
  $('threat').style.boxShadow=state.detSuspicion>.02?`inset 0 0 100px rgba(183,48,47,${state.detSuspicion*.32})`:'none';
  if(sees&&d<1.25&&e.seen>.18){capture(e.id);return;}
  e.alert=Math.max(0,e.alert-dt);e.think-=dt;e.detWait=Math.max(0,e.detWait-dt);
  const patrol=[gridToWorld(16,1),world.interactables.find(o=>o.id==='detKey'),gridToWorld(16,3),world.interactables.find(o=>o.id==='detFuse'),gridToWorld(15,4),gridToWorld(17,4)],chasing=e.alert>0&&e.lastSeen;
  if(e.think<=0){
    const destination=chasing?e.lastSeen:patrol[e.patrolIndex%patrol.length],nav=navBlocks(),goal=navTarget(destination,nav);
    e.path=goal?findPath(e,goal,nav):[];e.pathIndex=e.path.length>1?1:0;e.think=.55;
  }
  let moving=false;
  if(e.detWait<=0||chasing){
    const target=e.path[e.pathIndex];
    if(target){
      const length=distance(e,target);
      if(length<.09){e.pathIndex++;if(!chasing&&e.pathIndex>=e.path.length){e.patrolIndex++;e.detWait=1.8;e.think=0;}}
      else{
        const step=Math.min(length,dt*(chasing?2.55:1.5)*difficulty.speed),nx=e.x+(target.x-e.x)/length*step,nz=e.z+(target.z-e.z)/length*step;
        if(canOccupy(nx,nz)){e.x=nx;e.z=nz;moving=true;}else{e.path=[];e.think=0;}
        e.yaw=angleLerp(e.yaw,Math.atan2(target.x-e.x,target.z-e.z),Math.min(1,dt*5));
      }
    }
  }
  if(sees)e.yaw=angleLerp(e.yaw,Math.atan2(player.x-e.x,player.z-e.z),Math.min(1,dt*6));
  e.model.position.set(e.x,0,e.z);e.model.rotation.y=e.yaw;
  e.moving=moving;
  if(moving)animateTeacher(e,state.elapsed,dt);
  else if(e.model.userData.limbs){for(const limb of ['leftLeg','rightLeg','leftArm','rightArm'])e.model.userData.limbs[limb].rotation.x*=Math.exp(-dt*8);}
  if(e.model.userData.head)e.model.userData.head.rotation.x=.03;
  if(droneGain&&audioContext)droneGain.gain.setTargetAtTime(.01+state.detSuspicion*.035,audioContext.currentTime,.3);
}

function escapeDetention(){
  resetNightHazards();
  const wasPrincipal=state.disciplineKind==='principal',back=wasPrincipal?state.disciplineReturn:'night';
  detentionGuard=null;world.principal.visible=false;$('threat').style.boxShadow='none';noiseEvent=null;noiseTime=0;
  state.phase=back;state.trouble=Math.min(45,state.trouble);state.grace=10;player.hidden=null;state.detOpen=false;
  state.phaseTime=back==='day'?state.schoolRemaining:state.nightRemaining;
  blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));world.detentionDoor.visible=true;
  world.setDetentionKind?.('detention');world.setMood(back==='day',0);resetEnemies();updateItems();
  showTransition('BACK IN THE HALLS',wasPrincipal?'A mark on your record.':'Not over yet.',wasPrincipal?'The next school day has no A-grade protection. You can still finish today’s tests.':'Your evidence is safe. Dawn still arrives on time.',4);
  updateHud();
}

function finish(won){
  closeJournal(false);resetNightHazards();
  mode='ending';state.phase=won?'won':'dead';paused=false;keyDown.clear();document.exitPointerLock?.();
  for(const id of ['hud','scare','blackout','pause','transition','mapPanel'])$(id).hidden=true;$('ending').hidden=false;
  $('endingEyebrow').textContent=won?`${dayName(state.day).toUpperCase()} · 7:31 AM`:`${dayName(state.day).toUpperCase()} · NO ONE CAME`;
  $('endingTitle').textContent=won?'You exposed the Watchful Circle.':'You didn’t make it.';
  $('endingBody').textContent=won?'The front doors open. Jamie has all seven backups: the ledger, recordings, orders, and GoGuardian’s signed archive. Together you expose the eye that leads the Watchful Circle. Then your phone lights up: “THE WATCHER REMEMBERS.”':
    'GoGuardian caught you on the weekend. There were no teachers to send you to detention. No one came to save you. You died. Your week is over.';
  $('endingStats').innerHTML=`<div><b>${state.proofs.length}/7</b>EVIDENCE FILES</div><div><b>${state.captures}</b>TIMES CAUGHT</div><div><b>${Math.floor(state.elapsed/60)}:${String(Math.floor(state.elapsed%60)).padStart(2,'0')}</b>TIME INSIDE</div>`;
  try{localStorage.removeItem(SAVE_KEY)}catch{}updateResume();if(won){bell();tone(440,.7,'sine',.1,.7);tone(660,1,'sine',.1,1)}
}

function getObjective(){
  const item=id=>world?.interactables.find(o=>o.id===id),closest=list=>[...list].sort((a,b)=>distance(player,a)-distance(player,b))[0];
  const goal=(title,hint,target=null,action='E',kicker='NEXT STEP')=>({title,hint,target,action,kicker});
  let next;
  if(mode==='intro')next=goal('Find out what GoGuardian is hiding.','Watch the conversation as you leave Homeroom, or press Space to skip.',null,'WAIT','THE SUSPICION');
  else if(!state)return goal('Investigate GoGuardian.','Click Investigate GoGuardian to begin.',null,'CLICK','START HERE');
  else if(journalOpen)next=goal('Read your collected evidence.','Close the journal with J, Esc, or Close journal to continue. Time and watchers are paused.',null,'CLICK','THE INVESTIGATION');
  else if(state.phase==='won')next=goal('The Watchful Circle is exposed.','Click Investigate again to play again.',null,'CLICK','YOU ESCAPED');
  else if(state.phase==='dead')next=goal('Your run ended.','Click Investigate again to start a new run.',null,'CLICK','GAME OVER');
  else if(examUI?.active){
    const button=$('examNext').textContent||'Next question',review=/return|principal|finish|continue/i.test(button)&&! /question/i.test(button);
    next=goal(review?'Review your grade.':`Complete ${$('examSubject').textContent||'the test'}.`,review?`Read the results, then click “${button}”.`:`Choose one answer, then click “${button}”. The school bell is paused.`,null,'CLICK','TEST IN PROGRESS');
  }else if(['capture','blackout'].includes(state.phase)){
    next=state.fatalCapture?goal('Your run has ended.','Wait for the game-over screen, then click Investigate again.',null,'WAIT','WEEKEND CAPTURE'):
      goal(captureKind==='principal'?'Return to the principal’s office.':'You were caught.','Wait for the lights to return. Then follow the key-and-fuse escape steps.',null,'WAIT','CAUGHT');
  }else if(state.phase==='forgiven')next=goal('Your teacher is letting you go.','Wait a moment. Your A grade protects you; then continue tonight’s search.',null,'WAIT','A-GRADE PROTECTION');
  else if(state.phase==='rescue')next=goal('Wait for your teacher to release you.','Watch your teacher speak to the watcher. You will regain control after the conversation.',null,'WAIT','YOUR A EARNED THIS');
  else if(state.lockerSearch&&player.hidden){
    const search=state.lockerSearch,seconds=Math.max(0,Math.ceil(search.duration-search.time));
    next=search.dangerous?goal('Leave this locker NOW.','Press E, then move quietly to different cover. They open this locker in '+seconds+' seconds.',null,'E','LOCKER SEARCH'):
      goal('Stay completely still during the search.','Release movement keys. Wait '+seconds+' seconds for the eye to leave. Moving will give you away.',null,'WAIT','LOCKER SEARCH');
  }else if(task)next=goal(task.kind==='repair'?'Keep holding E to repair the panel.':'Keep holding E to collect the evidence.',`${Math.max(0,task.duration-task.elapsed).toFixed(1)}s left. Stay still; releasing E or moving cancels the task.`,task.item,'HOLD E','TASK IN PROGRESS');
  else if(['detention','principal'].includes(state.phase)){
    const place=state.phase==='principal'?'PRINCIPAL’S OFFICE':'DETENTION';
    if(!state.detKey)next=goal('Find the key at the marked shelf.','Follow the marker and press E. Locations change each escape; use cabinets as cover.',item('detKey'),'E',place+' · STEP 1/5');
    else if(!state.detPower&&!state.detFuse)next=goal('Collect the replacement fuse.','Follow the fuse marker and press E. Watch the supervisor inspecting the shelves.',item('detFuse'),'E',place+' · STEP 2/5');
    else if(!state.detPower)next=goal('Install the fuse in the door panel.','Hold E beside the door for 4 seconds. Stay still; the repair makes noise.',item('detPanel'),'HOLD E',place+' · STEP 3/5');
    else if(!state.detOpen)next=goal('Unlock the door with your key.','Face the door and press E to unlock it.',item('detDoor'),'E',place+' · STEP 4/5');
    else next=goal('Walk through the door into the hall.','Keep walking until you are fully outside. Avoid the supervisor.',{id:'discipline-exit',x:ROOMS.detention.door.x,z:ROOMS.detention.bounds.maxZ+CELL_SIZE+.4},'WASD',place+' · STEP 5/5');
  }else if(state.phase==='finale')next=goal('Open the front doors and expose the cult.','Jamie has all seven evidence files. Press E at the front doors.',item('exit'),'E','FINAL OBJECTIVE');
  else if(state.phase==='day'){
    const remaining=['teacher','band'].find(id=>!state.testResults[id]);
    if(!isWeekend(state.day)&&remaining){
      const teacher=remaining==='band'?'Mr. Reed':'Ms. Vale',room=remaining==='band'?'Band Room':'Science Lab';
      next=goal(`Go to the ${room} for ${teacher}’s test.`,`Press E at the test spot. Answer five questions. ${state.blockedPerkDays.includes(state.day)?'Protection is blocked today; grades still count.':'5/5 earns protection tonight.'}`,item('exam-'+remaining),'E','SCHOOL DAY · TEST '+(Object.keys(state.testResults).length+1)+'/2');
    }else if(!state.hasLight)next=goal('Pick up the flashlight in Homeroom.','Press E at the flashlight on a desk. You’ll need it when the lights go out.',item('flashlight'),'E','PREPARE FOR TONIGHT');
    else if(!state.hasKey)next=goal('Get the staff key from the Office.','Press E at the gold key on the office desk. It unlocks evidence cabinets.',item('staffKey'),'E','PREPARE FOR TONIGHT');
    else if(player.hidden)next=goal('Stay hidden until the lights go out.','Wait for the bell. Your next evidence objective appears after lights out.',null,'WAIT','READY FOR TONIGHT');
    else next=goal('Hide in a hallway locker before lights out.','Follow the marker, then press E at the locker. Less-used lockers draw fewer searches.',chooseLocker(),'E','PREPARE FOR TONIGHT');
  }else if(state.phase==='night'){
    const secured=state.proofs.includes(state.day),seconds=Math.ceil(state.nightRemaining);
    if(secured&&player.hidden)next=goal('Stay hidden and watch for locker searches.','Evidence is backed up. Dawn is in '+seconds+'s. Stay still during a fresh-locker search; leave if warned they know your hiding spot.',null,'WAIT','EVIDENCE SECURED');
    else if(secured)next=goal('Hide in a different locker until dawn.','Press E at the marked locker. Evidence is safe; survive '+seconds+' more seconds. Prefer less-used cover.',chooseLocker(),'E','EVIDENCE SECURED');
    else if(!state.hasLight)next=goal('Get the flashlight from Homeroom.','Go to the marked desk and press E. Then collect the next evidence file.',item('flashlight'),'E','NIGHT · FIND YOUR TOOLS');
    else if(state.battery<=0&&world.interactables.some(o=>o.type==='battery'&&!o.taken))next=goal('Pick up a replacement battery.','Press E at the marked battery, then press F to turn on your flashlight.',closest(world.interactables.filter(o=>o.type==='battery'&&!o.taken)),'E','FLASHLIGHT EMPTY');
    else if(state.proofs.length>0&&!state.hasKey)next=goal('Get the staff key from the Office.','Press E at the gold key on the office desk. Then unlock the evidence cabinet.',item('staffKey'),'E','NIGHT · UNLOCK THE EVIDENCE');
    else{
      const evidence=currentEvidence();next=goal(evidence.objective,`${evidence.hint} Dawn is in ${seconds}s; missing evidence adds another day.`,item('proof-'+evidence.room),'HOLD E','EVIDENCE '+(state.proofs.length+1)+'/7');
      const gate=state.gate;
      if(gate?.closed&&gate.door.room===evidence.room&&!findPath(player,navTarget(next.target,navBlocks())||next.target,navBlocks()).length)next=goal(`Wait for the ${ROOMS[evidence.room].label} shutter to reopen.`,`Find cover. It opens in ${Math.ceil(9-gate.time)}s; then follow the evidence marker.`,null,'WAIT','TEMPORARY DOOR SEAL');
    }
  }else next=goal('Follow the next step.','Wait for the current scene to finish.',null,'WAIT');
  if(player.hidden&&next.target)next.hint='Press E to leave your locker. '+next.hint;
  if(paused&&!journalOpen)next={...next,kicker:'PAUSED · NEXT OBJECTIVE',hint:'Click Resume to continue. '+next.hint};
  return next;
}

function objectiveCompass(target){
  const dx=target.x-player.x,dz=target.z-player.z,desired=Math.atan2(-dx,-dz);
  let angle=player.yaw-desired;angle=Math.atan2(Math.sin(angle),Math.cos(angle));
  const degrees=angle*180/Math.PI,label=Math.abs(degrees)<25?'Ahead':Math.abs(degrees)>145?'Turn around':degrees>0?'Turn right':'Turn left';
  return {angle:degrees,label};
}

function renderObjective(){
  const panel=$('objectivePanel');panel.hidden=mode==='menu'||!world||!camera;
  if(document.body)document.body.dataset.objectiveMode=journalOpen?'journal':paused||mode==='ending'?'overlay':examUI?.active?'exam':'play';
  if(panel.hidden)return;
  const objective=getObjective(),write=(id,value)=>{value=touchText(value);if($(id).textContent!==value)$(id).textContent=value;};
  write('objectiveKicker',objective.kicker);write('objectiveText',objective.title);write('objectiveHint',objective.hint);
  write('objectiveProgress',state?`${state.proofs.length}/7 evidence files · Day ${state.day+1}${state.missedProofs?' · '+state.missedProofs+' missed collections':''}`:'Seven evidence files. Missing evidence adds another day.');
  $('objectiveNav').hidden=paused||!objective.target;
  if(paused||!objective.target)return;
  const target=objective.target,metres=Math.round(distance(player,target));
  const candidate=state&&!examUI.active?candidateInteraction():null;
  if(candidate&&(candidate.id===target.id||candidate.type==='hide'&&target.id===candidate.id)){
    $('objectiveArrow').style.transform='none';write('objectiveArrow',touchEnabled?'●':'E');write('objectiveDirection',(objective.action==='HOLD E'?'Hold E · ':'Press E now · ')+(candidate.label||interactionLabel(candidate)).replace(/^Hold E · /,''));return;
  }
  const nav=navBlocks(),goal=navTarget(target,nav),path=goal?findPath(player,goal,nav):[];
  const waypoint=path.find(p=>distance(player,p)>.85)||target,direction=objectiveCompass(waypoint);
  write('objectiveArrow','↑');$('objectiveArrow').style.transform=`rotate(${direction.angle}deg)`;
  write('objectiveDirection',`${direction.label} · ${metres}m to objective · M map`);
}

function updateHud(){
  if(!state)return;
  $('dayLabel').textContent=`${dayName(state.day).toUpperCase()} · DAY ${state.day+1}${state.day>=7?' · EXTENDED STAY':''}`;
  $('phaseLabel').textContent=state.phase==='principal'?'PRINCIPAL’S OFFICE':state.phase==='detention'?'DETENTION':state.phase==='rescue'?'TEACHER RESCUE':state.phase==='forgiven'?'A-GRADE PROTECTION':state.nightActive?'AFTER HOURS':state.phase==='finale'?'TIME TO LEAVE':isWeekend(state.day)?'NO CLASSES':'SCHOOL DAY';
  if(state.phase==='day'){
    const progress=1-state.phaseTime/(isWeekend(state.day)?10:25),minutes=Math.floor(480+progress*420);
    $('clock').textContent=`${String(Math.floor(minutes/60)%12||12).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')} ${minutes>=720?'PM':'AM'}`;
  }else $('clock').textContent=state.nightActive?`DAWN IN ${Math.max(0,Math.ceil(state.nightRemaining))}s`:state.phase==='finale'?'7:30 AM':'SCHOOL DAY · DISCIPLINE';
  renderObjective();
  const first=Math.floor(state.day/7)*7;
  $('weekDots').innerHTML=Array.from({length:7},(_,i)=>{const d=first+i;return `<div class="${d<state.day?'done ':''}${d===state.day?'current ':''}${isWeekend(d)?'weekend':''}">${d<state.day?'✓':dayName(d).slice(0,1)}</div>`}).join('');
  $('batteryText').textContent=`${Math.ceil(state.battery)}%${state.lightOn?' ON':''}`;$('batteryBar').style.width=`${state.battery}%`;
  $('troubleText').textContent=`${Math.ceil(state.trouble)}%`;$('troubleBar').style.width=`${state.trouble}%`;
  const noise=player.hidden?'Hidden':player.sprinting?'LOUD':player.crouching?'Quiet / crouching':player.moving?'Footsteps':'Quiet';
  $('noise').querySelector('span').textContent=noise;$('noise').querySelector('i').style.background=player.sprinting?'#f38b7b':'#a9edc8';
  const items=[];if(state.hasLight)items.push('F · Flashlight');if(state.hasKey)items.push('Staff key');if(state.decoys)items.push(`G · Toys ×${state.decoys}`);if(state.detKey)items.push('Office key');if(state.detFuse)items.push('Fuse');items.push(`Evidence ${state.proofs.length}/7`);
  $('inventory').innerHTML=items.map(i=>`<span>${i}</span>`).join('');
  const grades=Object.entries(state.testResults).map(([id,r])=>`${id==='band'?'Reed':'Vale'}: ${r.letter}${hasTeacherFavor(id)?' · protects tonight':''}`);
  $('gradeStatus').textContent=isWeekend(state.day)?'Weekend: no teacher protection':state.blockedPerkDays.includes(state.day)?'Principal’s penalty: A protection blocked today':grades.join(' | ')||'Earn an A in today’s tests to gain teacher protection.';
}

function drawMap(){
  const canvas=$('mapCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=Math.min((w-32)/WIDTH,(h-32)/HEIGHT),ox=(w-WIDTH*s)/2,oz=(h-HEIGHT*s)/2;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#101c2b';ctx.fillRect(0,0,w,h);
  for(let z=0;z<HEIGHT;z++)for(let x=0;x<WIDTH;x++)if(MAP[z][x]==='.'){
    ctx.fillStyle='#345160';ctx.fillRect(ox+x*s,oz+z*s,s+.5,s+.5);
  }
  ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillStyle='#bed6dd';
  for(const room of Object.values(ROOMS)){const c=worldToGrid(room.center);ctx.fillText(room.label,ox+(c.x+.5)*s,oz+(c.z+.5)*s-6);}
  for(const locker of world.hideSpots){const c=worldToGrid(locker);ctx.fillStyle='#7ba9df';ctx.fillRect(ox+(c.x+.2)*s,oz+(c.z+.2)*s,s*.5,s*.5);}
  const target=getObjective().target;
  if(target){const c=worldToGrid(target);ctx.strokeStyle='#ffd683';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox+(c.x+.5)*s,oz+(c.z+.5)*s,s*.65,0,Math.PI*2);ctx.stroke();}
  const p=worldToGrid(player);ctx.fillStyle='#a4f5cc';ctx.beginPath();ctx.arc(ox+(p.x+.5)*s,oz+(p.z+.5)*s,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a4f5cc';ctx.beginPath();ctx.moveTo(ox+(p.x+.5)*s,oz+(p.z+.5)*s);ctx.lineTo(ox+(p.x+.5)*s-Math.sin(player.yaw)*13,oz+(p.z+.5)*s-Math.cos(player.yaw)*13);ctx.stroke();
}
function activeTick(dt){
  if(examUI?.active)return;
  state.elapsed+=dt;state.grace=Math.max(0,state.grace-dt);state.decoyCooldown=Math.max(0,state.decoyCooldown-dt);state.moveNoise=Math.max(0,state.moveNoise-dt*3);
  if(noiseTime>0)noiseTime-=dt;
  if(state.nightActive){
    state.nightElapsed+=dt;state.nightRemaining=Math.max(0,state.nightRemaining-dt);
    if(state.nightRemaining<=0&&!state.fatalCapture){endNight();return;}
  }
  if(state.trouble>=60&&!state.troubleWarned){state.troubleWarned=true;say('Your trouble record is high. Patrols are watching more closely.',5);}
  if(state.phase==='capture'||state.phase==='blackout'){updateCapture(dt);return;}
  if(state.phase==='forgiven'){updateFriendly(dt);return;}
  if(state.phase==='rescue')return;
  movePlayer(dt);
  updateTask(dt);
  if(state.lightOn){state.battery=Math.max(0,state.battery-dt*DIFFICULTY[state.difficulty].drain);if(state.battery===0){state.lightOn=false;say('Your flashlight battery is empty.',3);}}
  if(state.phase==='day'){
    state.phaseTime=Math.max(0,state.phaseTime-dt);if(state.phaseTime<=0)startNight();
  }else if(state.phase==='night'){
    state.phaseTime=state.nightRemaining;if(state.grace<=0)state.trouble=Math.max(0,state.trouble-dt*.18);
    updateNightHazards(dt);
  }else if(['detention','principal'].includes(state.phase)){
    state.phaseTime+=dt;const prior=Math.floor(detLampTime/.65);detLampTime+=dt;const now=Math.floor(detLampTime/.65);
    if(now!==prior&&now<=3){world.setMood(false,now);tone(70,.16,'sawtooth',.1);noiseSound(.08,.08);}
    if(detLampTime<.65)world.setMood(false,0);
    if(state.detOpen&&player.z>ROOMS.detention.bounds.maxZ+CELL_SIZE+.30)escapeDetention();else updateDetentionGuard(dt);
  }
  if(!['detention','principal','capture','blackout','forgiven','rescue'].includes(state.phase))updateEnemies(dt);
  nearby=candidateInteraction();$('interact').hidden=!nearby;if(nearby)$('interact').querySelector('span').textContent=touchText(nearby.label||interactionLabel(nearby));
  hudTime-=dt;if(hudTime<=0){updateHud();if(mapOpen)drawMap();hudTime=.2;}
}

function interactionLabel(o){
  return {flashlight:'Pick up flashlight',key:'Take staff key',battery:'Pick up battery',decoy:'Take wind-up toys',proof:'Hold E to collect evidence',class:`Attend ${ROOMS[o.room]?.label||'class'}`,detKey:'Take detention key',detFuse:'Take fuse',detPanel:'Hold E to repair fuse panel',detDoor:'Unlock detention door',exit:'Open the front doors'}[o.type]||o.label||'Interact';
}
function frame(now){
  requestAnimationFrame(frame);if(!renderer||!world)return;
  const dt=Math.min(.05,Math.max(0,(now-frameTime)/1000));frameTime=now;
  if(mode==='playing'&&!paused){
    activeTick(dt);
    if(noticeTime>0){noticeTime-=dt;if(noticeTime<=0)$('statusMessage').style.opacity=0;}
    if(transitionTime>0){transitionTime-=dt;if(transitionTime<=0)$('transition').hidden=true;}
  }else if(mode==='menu'){
    player.yaw=Math.sin(now*.00008)*.12;player.pitch=-.04;
    world.guardian.position.set(.4,1.6+Math.sin(now*.002)*.12,-5);world.guardian.rotation.y=Math.PI;
    for(const model of Object.values(world.teachers))model.visible=false;
    for(const student of world.students)student.visible=false;
  }
  objectiveTime-=dt;if(objectiveTime<=0){renderObjective();objectiveTime=.15;}
  if(mode==='playing'&&!paused)atmosphereFlicker=horror?.update(dt,{phase:state?.phase,day:state?.day,elapsed:state?.elapsed,lightOn:state?.lightOn,moving:player.moving,hidden:!!player.hidden,reduced:settings.reduced})?.lightFlicker??1;
  positionCamera(dt);
  if(mode==='intro'&&!paused)dareCutscene?.update(dt);
  if(mode==='playing'&&!paused&&state?.phase==='rescue')rescueScene?.update(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);

// Read-only state supports deployment verification without changing gameplay.
window.afterBellInfo=()=>state?({day:dayName(state.day),dayIndex:state.day,phase:state.phase,evidence:state.proofs.length,proofs:state.proofs.length,paused,
  nightRemaining:state.nightRemaining,enemyIds:enemies.map(e=>e.id),weekend:isWeekend(state.day),aTeachers:[...state.aTeachers],missedProofs:state.missedProofs,perkBlocked:state.blockedPerkDays.includes(state.day),objective:getObjective().title}):({phase:mode});

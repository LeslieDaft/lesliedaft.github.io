import * as THREE from './vendor/three.module.js';
import { MAP, WIDTH, HEIGHT, CELL_SIZE, ROOMS, SPAWN, EXIT, DETENTION_SPAWN, PATROL_POINTS, DAYS,
  ORIGIN_X, ORIGIN_Z, gridToWorld, worldToGrid, cellKey, isWalkable, findPath, lineOfSight, isWeekend, captureDestination } from './engine.js';
import { buildSchool } from './scene.js';

const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const SAVE_KEY = 'after-bell-week-v3';
const PREF_KEY = 'after-bell-settings-v1';
const DIFFICULTY = {
  easy:{night:85,speed:.79,sight:.82,noise:.85,drain:.42},
  normal:{night:75,speed:1,sight:1,noise:1,drain:.55},
  hard:{night:68,speed:1.17,sight:1.2,noise:1.25,drain:.7}
};
const NIGHT_ROOMS = ['homeroom','band','library','lab','office','band','storage'];
const NIGHT_PROOFS = ['the message left on your desk','a recording of the silent band room','a photograph of the empty library',
  'the impossible clock in the lab','the after-hours attendance sheet','a recording of the weekend intercom','the final security log'];
const SCHEDULE = [['homeroom','band'],['library','lab'],['homeroom','lab'],['band','library'],['lab','homeroom']];
const keyDown = new Set();
const settings = {difficulty:'normal',quality:'school',reduced:false,sound:true};
try { Object.assign(settings, JSON.parse(localStorage.getItem(PREF_KEY)||'{}')); } catch {}
for (const field of ['difficulty','quality']) $(field).value=settings[field];
$('reduced').checked=!!settings.reduced; $('sound').checked=!!settings.sound;
function saveSettings(){
  settings.difficulty=$('difficulty').value;settings.quality=$('quality').value;
  settings.reduced=$('reduced').checked;settings.sound=$('sound').checked;
  try{localStorage.setItem(PREF_KEY,JSON.stringify(settings))}catch{}
}
for(const field of ['difficulty','quality','reduced','sound']) $(field).addEventListener('change',saveSettings);

let renderer, scene, camera, world, flashlight, flashTarget, hand;
let state = null, mode='menu', paused=false, frameTime=performance.now(), hudTime=0, mapOpen=false;
let transitionTime=0, noticeTime=0, walkingTime=0, nearby=null, noiseEvent=null, noiseTime=0;
let captureTime=0, captureEnemy='guardian', detLampTime=0;
const player={...SPAWN,yaw:0,pitch:0,height:1.65,hidden:null,bob:0,moving:false,sprinting:false,crouching:false};
const blocked=new Set([cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z)]);
const furnitureNav=new Set();
const enemies=[];
let audioContext=null, masterGain=null, droneGain=null, droneOsc=null;
const soundAssets={};
for(const who of ['guardian','band','teacher']){
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
function say(text,time=4){$('statusMessage').textContent=text;noticeTime=time;$('statusMessage').style.opacity=1}
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
  positionCamera(0);
}catch(error){showError(error)}

function resize(){
  if(!renderer)return;
  const ratio=settings.quality==='high'?Math.min(devicePixelRatio,1.6):Math.min(devicePixelRatio,1);
  renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
$('quality').addEventListener('change',resize);
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
  for(const e of enemies){Object.assign(e,{x:e.pos.x,z:e.pos.z,path:[],pathIndex:0,patrolIndex:0,think:0,alert:0,seen:0,blinded:0,lastSeen:null,inspect:false});e.model.visible=e.id==='guardian'||!isWeekend(state.day);}
}
function validSave(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return s&&s.version===3&&Number.isInteger(s.day)&&s.day>=0&&s.day<=7&&Array.isArray(s.proofs)&&DIFFICULTY[s.difficulty]?s:null}catch{return null}
}
function updateResume(){$('resume').hidden=!validSave()}
updateResume();
function saveMorning(){
  if(!state)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:3,day:state.day,proofs:state.proofs,hasLight:state.hasLight,hasKey:state.hasKey,
    battery:state.battery,decoys:state.decoys,captures:state.captures,elapsed:state.elapsed,difficulty:state.difficulty}))}catch{}
  updateResume();
}
function newState(save=null){
  const s={day:0,proofs:[],hasLight:false,lightOn:false,hasKey:false,battery:100,decoys:0,captures:0,elapsed:0,difficulty:settings.difficulty,
    phase:'day',phaseTime:25,nightRemaining:75,nightElapsed:0,classes:[],trouble:0,troubleWarned:false,grace:0,detKey:false,detFuse:false,detPower:false,detOpen:false,moveNoise:0,decoyCooldown:0};
  if(save)Object.assign(s,save,{phase:'day',lightOn:false,classes:[],trouble:0});return s;
}
function acceptDare(){
  saveSettings();resize();$('menu').hidden=true;$('intro').hidden=false;mode='intro';startAudio();
}
$('start').onclick=acceptDare;
$('begin').onclick=()=>startGame();
$('resume').onclick=()=>{const save=validSave();if(!save)return;settings.difficulty=save.difficulty;$('difficulty').value=save.difficulty;startGame(save)};
function startGame(save=null){
  if(!renderer||!world)return;
  state=newState(save);mode='playing';paused=false;mapOpen=false;
  for(const id of ['menu','intro','pause','ending','mapPanel','scare','blackout'])$(id).hidden=true;
  $('hud').hidden=false;startAudio();startDay(false);requestLook();
}
function toMenu(){
  mode='menu';paused=false;state=null;keyDown.clear();document.exitPointerLock?.();
  for(const id of ['hud','pause','ending','intro','scare','blackout','mapPanel','transition'])$(id).hidden=true;
  $('menu').hidden=false;player.x=SPAWN.x;player.z=SPAWN.z;player.yaw=0;player.pitch=0;player.hidden=null;
  resetInteractionMeshes();world.setMood(false,0);for(const e of enemies)e.model.visible=true;updateResume();
}
$('mainMenu').onclick=toMenu;$('endingMenu').onclick=toMenu;
$('restartPause').onclick=()=>startGame();$('playAgain').onclick=()=>startGame();
function requestLook(){
  if(mode!=='playing'||paused)return;
  try{const p=$('view').requestPointerLock?.();if(p?.catch)p.catch(()=>{})}catch{}
}
$('view').addEventListener('click',requestLook);
function setPaused(value){
  if(mode!=='playing'||!state||['capture','blackout'].includes(state.phase))return;
  paused=value;$('pause').hidden=!value;keyDown.clear();
  if(value){document.exitPointerLock?.();$('mapPanel').hidden=true;mapOpen=false;}else{startAudio();requestLook();}
}
$('pauseBtn').onclick=()=>setPaused(true);$('unpause').onclick=()=>setPaused(false);
document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement!==$('view')&&mode==='playing'&&!paused&&state&&['day','night','detention','finale'].includes(state.phase))setPaused(true);
});
addEventListener('blur',()=>setPaused(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true)});

function resetInteractionMeshes(){
  for(const o of world.interactables){if(o.mesh)o.mesh.visible=true;o.taken=false;}
  for(const o of world.interactables){if(o.type==='proof'&&o.mesh)o.mesh.visible=false;}
  if(world.detentionDoor)world.detentionDoor.visible=true;
}
function startDay(advance=true){
  if(advance)state.day++;
  player.hidden=null;player.x=SPAWN.x;player.z=SPAWN.z;player.yaw=0;player.pitch=0;state.lightOn=false;state.classes=[];state.trouble=0;
  state.detOpen=false;blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));
  noiseEvent=null;noiseTime=0;state.moveNoise=0;state.troubleWarned=false;
  state.phase=state.day===7?'finale':'day';state.phaseTime=isWeekend(state.day)?10:25;
  state.battery=Math.max(80,state.battery);state.decoys=Math.max(1,state.decoys);state.grace=10;
  resetEnemies();resetInteractionMeshes();updateItems();world.setMood(true,0);$('hiddenBanner').hidden=true;
  for(const student of world.students)student.visible=!isWeekend(state.day)&&state.day!==7;
  saveMorning();bell();
  if(state.day===7)showTransition('NEXT MONDAY · 7:30 AM','The last bell.','Seven nights of proof. Get to the front doors.',3.2);
  else if(isWeekend(state.day))showTransition(`${DAYS[state.day].toUpperCase()} · NO CLASSES`,'No one is coming.','The teachers have gone home. GoGuardian has not.',3.2);
  else showTransition(`${DAYS[state.day].toUpperCase()} · 8:00 AM`,'Keep your head down.','Attend two quick classes. Then hide before the last bell.',2.7);
  updateHud();
}
function startNight(){
  state.phase='night';state.nightRemaining=DIFFICULTY[state.difficulty].night;state.nightElapsed=0;state.phaseTime=state.nightRemaining;state.grace=10;
  if(!isWeekend(state.day)&&state.classes.length<2){state.trouble+=18;say('You missed a class. Your name is on the trouble list.',4);}
  if(!player.hidden){state.trouble+=12;say('Lights out. Find a locker. You have ten seconds before patrols begin.',5);}
  state.lightOn=false;world.setMood(false,0);updateItems();bell();
  for(const student of world.students)student.visible=false;
  showTransition(`NIGHT ${state.day+1} / 7`,isWeekend(state.day)?'No detention tonight.':'Lights out.',isWeekend(state.day)?'If GoGuardian catches you, your run ends.':'Find tonight\'s proof, then hide until morning.',3);
  updateHud();
}
function updateItems(){
  for(const o of world.interactables){
    let visible=true;
    if(o.type==='proof')visible=state?.phase==='night'&&o.room===NIGHT_ROOMS[state.day]&&!state.proofs.includes(state.day);
    else if(o.type==='flashlight')visible=!state?.hasLight;
    else if(o.id==='staffKey')visible=!state?.hasKey;
    else if(o.type==='battery')visible=!o.taken;
    else if(o.type==='decoy')visible=!o.taken;
    else if(o.type==='detKey')visible=state?.phase==='detention'&&!state.detKey;
    else if(o.type==='detFuse')visible=state?.phase==='detention'&&!state.detFuse&&!state.detPower;
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
    if(o.type==='class'&&(state.phase!=='day'||isWeekend(state.day)||!SCHEDULE[state.day]?.includes(o.room)||state.classes.includes(o.room)))continue;
    if(o.type.startsWith('det')&&state.phase!=='detention')continue;
    if(state.phase==='detention'&&!o.type.startsWith('det'))continue;
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
  if(!state||paused||!['day','night','detention','finale'].includes(state.phase))return;
  const o=candidateInteraction();if(!o)return;
  switch(o.type){
    case 'leaveHide':player.hidden=null;$('hiddenBanner').hidden=true;say('You leave the locker.',1.5);break;
    case 'hide':{
      const observed=enemies.some(e=>e.seen>.2&&lineOfSight(e,player,blocked)&&distance(e,player)<12);
      player.hidden=o;player.x=o.x;player.z=o.z;player.yaw=o.angle??player.yaw;state.lightOn=false;$('hiddenBanner').hidden=false;
      if(observed){say('They saw you hide. Move before they check this locker!',3);for(const e of enemies)if(e.seen>.2){e.inspect=true;e.lastSeen={x:o.x,z:o.z};e.alert=8;}}
      else say('You pull the locker door almost closed.',2);tone(110,.18,'triangle',.07);break;
    }
    case 'flashlight':state.hasLight=true;state.lightOn=state.phase!=='day';say('Flashlight found. F toggles it. Its beam can give you away.',4);o.available=false;break;
    case 'key':state.hasKey=true;say('Staff key found. It opens the locked proof cabinets.',3);o.available=false;emitNoise(3);break;
    case 'battery':state.battery=Math.min(100,state.battery+45);o.taken=true;say('Fresh battery. +45% charge.',2);tone(660,.1);break;
    case 'decoy':state.decoys+=2;o.taken=true;say('Two wind-up toys. Press G to draw patrols away.',3);break;
    case 'proof':
      if(state.day>0&&!state.hasKey){say('The proof cabinet is locked. Find the staff key in the Office.',4);emitNoise(3);break;}
      if(!state.proofs.includes(state.day))state.proofs.push(state.day);o.available=false;emitNoise(4);tone(780,.12);tone(1040,.16,'sine',.1,.1);
      say(`Night ${state.day+1} proof secured. Now hide until morning.`,4);break;
    case 'class':state.classes.push(o.room);emitNoise(2);tone(520,.1);say(`${ROOMS[o.room].label}: present. ${state.classes.length}/2 classes done.`,3);break;
    case 'detKey':state.detKey=true;say('Detention key. One lock down.',3);tone(760,.1);break;
    case 'detFuse':state.detFuse=true;say('A spare fuse. Put it in the panel beside the door.',4);break;
    case 'detPanel':
      if(state.detPower){say('The door has power. Use the key on the detention door.',3);break;}
      if(!state.detFuse){say('The panel needs a fuse. Search the supply shelf.',3);break;}
      state.detFuse=false;state.detPower=true;tone(80,.7,'sawtooth',.1,0,160);say('Power restored. Unlock the door with the detention key.',3);break;
    case 'detDoor':
      if(!state.detKey){say('Locked. Search the teacher’s desk for the key.',3);break;}
      if(!state.detPower){say('The electric lock has no power. Fix the fuse panel first.',3);break;}
      state.detOpen=true;blocked.delete(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));if(world.detentionDoor)world.detentionDoor.visible=false;
      say('Unlocked. Step through the door and return to the halls.',4);tone(180,.2);break;
    case 'exit':if(state.proofs.length>=7)finish(true);else say('Seven nights of proof are required.',3);break;
  }
  updateItems();updateHud();
}

addEventListener('keydown',event=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(event.code)&&mode==='playing')event.preventDefault();
  if(event.repeat){keyDown.add(event.code);return;}
  if(event.code==='Escape'){setPaused(true);return;}
  if(mode!=='playing'||paused||!state)return;
  keyDown.add(event.code);
  if(['capture','blackout'].includes(state.phase))return;
  if(event.code==='KeyE')interact();if(event.code==='KeyF')toggleLight();if(event.code==='KeyG')throwDecoy();
  if(event.code==='KeyM'){mapOpen=!mapOpen;$('mapPanel').hidden=!mapOpen;if(mapOpen)drawMap();}
});
addEventListener('keyup',event=>keyDown.delete(event.code));
addEventListener('mousemove',event=>{
  if(document.pointerLockElement!==$('view')||paused||mode!=='playing'||!state||['capture','blackout'].includes(state.phase))return;
  player.yaw-=event.movementX*.0022;player.pitch=clamp(player.pitch-event.movementY*.0022,-1.25,1.25);
});
$('closeMap').onclick=()=>{mapOpen=false;$('mapPanel').hidden=true};

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
  walkingTime+=dt;player.bob+=dt*(player.sprinting?13:8);
  if(walkingTime>(player.sprinting?.3:player.crouching?.75:.48)){
    walkingTime=0;noiseSound(.045,player.sprinting?.12:player.crouching?.018:.04);
    if(state.phase==='night')emitNoise(player.sprinting?10:player.crouching?1:3);
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
  flashlight.intensity=state?.lightOn?19:0;hand.visible=!!state?.hasLight&&!player.hidden&&state.phase!=='capture'&&state.phase!=='blackout';
  hand.position.y=bob*.5;
}
function moveEnemy(e,dt){
  e.think-=dt;e.alert=Math.max(0,e.alert-dt);e.blinded=Math.max(0,e.blinded-dt);
  if(e.think<=0){
    let target;
    if(e.alert>0&&e.lastSeen)target=e.lastSeen;
    else{target=PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]];if(distance(e,target)<1.15){e.patrolIndex++;target=PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]];}}
    const nav=navBlocks(),goal=navTarget(target,nav);
    e.path=goal?findPath(e,goal,nav):[];e.pathIndex=e.path.length>1?1:0;e.think=.7;
  }
  if(e.blinded>0)return;
  const target=e.path[e.pathIndex];if(!target)return;
  const d=distance(e,target);if(d<.1){e.pathIndex++;return;}
  const speed=e.speed*DIFFICULTY[state.difficulty].speed*(e.alert>0?1.24:1)*(isWeekend(state.day)&&e.id==='guardian'?1.1:1);
  const step=Math.min(d,speed*dt),nx=e.x+(target.x-e.x)/d*step,nz=e.z+(target.z-e.z)/d*step;
  if(canOccupy(nx,nz)){e.x=nx;e.z=nz;}else{e.path=[];e.think=0;}
  const wanted=Math.atan2(target.x-e.x,target.z-e.z);e.yaw=angleLerp(e.yaw,wanted,Math.min(1,dt*8));
}
function angleLerp(a,b,t){let d=(b-a+Math.PI)%(Math.PI*2);if(d<0)d+=Math.PI*2;return a+(d-Math.PI)*t;}
function updateEnemies(dt){
  let threat=0;
  for(const e of enemies){
    e.model.visible=e.id==='guardian'||!isWeekend(state.day);
    if(!e.model.visible)continue;
    if(state.phase==='night'&&state.grace<=0){
      const d=distance(e,player),los=lineOfSight(e,player,blocked);
      const facing={x:Math.sin(e.yaw),z:Math.cos(e.yaw)};
      const dot=d>.01?((player.x-e.x)*facing.x+(player.z-e.z)*facing.z)/d:1;
      let detected=false;
      if(!player.hidden){
        if(e.id==='band'){
          if(noiseEvent&&noiseTime>0){const nd=distance(e,noiseEvent),range=noiseEvent.strength*DIFFICULTY[state.difficulty].noise*(1+state.trouble*.002);
            if(nd<range*(lineOfSight(e,noiseEvent,blocked)?1:.48)){e.lastSeen={x:noiseEvent.x,z:noiseEvent.z};e.alert=7;e.think=Math.min(e.think,.1);detected=nd<4&&!noiseEvent.decoy;}}
          detected=detected||(d<3.8&&los&&dot>.2);
        }else{
          const range=(e.id==='guardian'?11:9)*DIFFICULTY[state.difficulty].sight*(1+state.trouble*.002)*(player.crouching?.72:1)*(state.lightOn?1.2:1);
          detected=los&&d<range&&(dot>.38||d<2.2);
        }
      }else if(e.inspect&&e.lastSeen&&distance(e.lastSeen,player)<.9&&los&&d<2)detected=true;
      if(detected){
        e.lastSeen={x:player.x,z:player.z};e.alert=7;e.think=Math.min(e.think,.2);e.seen=Math.min(2,e.seen+dt);
        state.trouble=clamp(state.trouble+dt*3,0,100);
        if(e.seen<dt*1.5){tone(e.id==='band'?220:460,.25,'triangle',.07);say(e.id==='band'?'Mr. Reed heard you. Stop running.':e.id==='teacher'?'Ms. Vale spotted you. Break her line of sight.':'GoGuardian is watching. Get behind a wall.',2.4);}
      }else e.seen=Math.max(0,e.seen-dt*1.5);
      if(e.alert>0&&d<9)threat=Math.max(threat,clamp((9-d)/8,0,1));
      if((detected||e.inspect)&&los&&d<1.25&&e.blinded<=0){capture(e.id);break;}
      // Guardian can also catch a student who stands directly in its scan for too long.
      if(e.id==='guardian'&&detected&&e.seen>=1.85){capture(e.id);break;}
      moveEnemy(e,dt);
    }else if(state.phase==='day'||state.phase==='finale'){
      e.think-=dt;if(e.think<=0){const nav=navBlocks(),goal=navTarget(PATROL_POINTS[e.patrol[e.patrolIndex%e.patrol.length]],nav);e.path=goal?findPath(e,goal,nav):[];e.pathIndex=e.path.length>1?1:0;e.think=1;}
      const point=e.path[e.pathIndex];if(point){const d=distance(e,point);if(d<.15)e.pathIndex++;else{const step=Math.min(d,dt*.85),nx=e.x+(point.x-e.x)/d*step,nz=e.z+(point.z-e.z)/d*step;if(canOccupy(nx,nz)){e.x=nx;e.z=nz;}else{e.path=[];e.think=0;}e.yaw=angleLerp(e.yaw,Math.atan2(point.x-e.x,point.z-e.z),dt*3);}}
      if(e.pathIndex>=e.path.length)e.patrolIndex++;
    }
    e.model.position.x=e.x;e.model.position.z=e.z;e.model.rotation.y=e.yaw;
    if(e.id==='guardian')e.model.position.y=1.6+Math.sin(state.elapsed*2)*.11;
    else animateTeacher(e,state.elapsed,dt);
  }
  $('threat').style.boxShadow=threat>.08?`inset 0 0 ${50+threat*80}px rgba(183,48,47,${threat*.35})`:'inset 0 0 100px transparent';
  if(droneGain&&audioContext)droneGain.gain.setTargetAtTime(state.phase==='night'?.02+threat*.06:.006,audioContext.currentTime,.3);
}
function animateTeacher(e,t,dt){
  const limbs=e.model.userData.limbs;
  if(limbs){const stride=Math.sin(t*(e.alert>0?10:5))*.27;
    if(limbs.leftLeg)limbs.leftLeg.rotation.x=stride;if(limbs.rightLeg)limbs.rightLeg.rotation.x=-stride;
    if(limbs.leftArm)limbs.leftArm.rotation.x=-stride*.7;if(limbs.rightArm)limbs.rightArm.rotation.x=stride*.7;
  }
  const head=e.model.userData.head;if(head){head.rotation.z=Math.sin(t*.45+e.id.length)*.04;head.rotation.y=e.alert>0?.08:Math.sin(t*.5)*.1;}
}
function capture(enemy){
  if(state.phase!=='night')return;
  state.phase='capture';captureTime=0;captureEnemy=enemy;state.lightOn=false;state.captures++;player.hidden=null;
  $('hiddenBanner').hidden=true;$('scare').hidden=false;$('blackout').hidden=true;$('mapPanel').hidden=true;mapOpen=false;$('transition').hidden=true;
  const image=$('scareImage');image.src=`./assets/${enemy}.webp`;image.alt=enemy==='band'?'Mr. Reed, the uncanny band teacher':enemy==='teacher'?'Ms. Vale, the uncanny teacher':'The watchful GoGuardian eye';
  image.hidden=false;$('scareFallback').hidden=true;image.onerror=()=>{image.hidden=true;$('scareFallback').hidden=false;};
  $('scareWhite').style.opacity=0;document.exitPointerLock?.();keyDown.clear();
  noiseSound(.9,.65);tone(enemy==='band'?145:95,2.5,'sawtooth',.16,0,enemy==='guardian'?560:380);
  // A fatal weekend capture invalidates the morning checkpoint immediately.
  if(captureDestination(state.day)==='dead'){try{localStorage.removeItem(SAVE_KEY)}catch{}updateResume();}
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
      else enterDetention();
    }
  }
}
function enterDetention(){
  state.phase='detention';state.detKey=false;state.detFuse=false;state.detPower=false;state.detOpen=false;state.phaseTime=0;detLampTime=0;
  blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));world.detentionDoor.visible=true;
  player.x=DETENTION_SPAWN.x;player.z=DETENTION_SPAWN.z;player.yaw=Math.PI;player.pitch=0;state.lightOn=false;
  state.battery=Math.max(35,state.battery);world.setMood(false,0);
  for(const e of enemies)e.model.visible=false;
  // The teacher is present at the front desk, looking at papers rather than pursuing.
  const teacher=enemies.find(e=>e.id===captureEnemy&&e.id!=='guardian')||enemies.find(e=>e.id==='teacher');
  if(teacher.id!=='guardian'){teacher.model.visible=true;teacher.model.position.set(ROOMS.detention.center.x+2.7,0,ROOMS.detention.center.z-1.1);teacher.model.rotation.y=-.3;}
  updateItems();showTransition('DISCIPLINARY RECORD UPDATED','Detention.','Find the key, replace the fuse, unlock the door.',3);say('Industrial lights hum overhead. You are still inside the school.',5);
  requestLook();updateHud();
}
function escapeDetention(){
  state.phase='night';state.trouble=Math.min(45,state.trouble);state.grace=10;player.hidden=null;state.detOpen=false;
  blocked.add(cellKey(ROOMS.detention.doorCell.x,ROOMS.detention.doorCell.z));world.detentionDoor.visible=true;world.setMood(false,0);resetEnemies();updateItems();
  showTransition('BACK IN THE HALLS','Not over yet.','Your proof is safe. Find a locker before patrols return.',3);say('Escaped detention. Ten seconds of cover.',4);updateHud();
}
function finish(won){
  mode='ending';state.phase=won?'won':'dead';paused=false;keyDown.clear();document.exitPointerLock?.();
  for(const id of ['hud','scare','blackout','pause','transition','mapPanel'])$(id).hidden=true;$('ending').hidden=false;
  $('endingEyebrow').textContent=won?'NEXT MONDAY · 7:31 AM':`${DAYS[state.day].toUpperCase()} · NO ONE CAME`;
  $('endingTitle').textContent=won?'You won the dare.':'You didn’t make it.';
  $('endingBody').textContent=won?'The front doors open. Morning air. Seven nights of proof on your phone. Jamie is waiting outside: “You actually did it?”':
    'GoGuardian caught you on the weekend. There were no teachers to send you to detention. No one came to save you. You died. Your week is over.';
  $('endingStats').innerHTML=`<div><b>${state.proofs.length}/7</b>NIGHTS OF PROOF</div><div><b>${state.captures}</b>TIMES CAUGHT</div><div><b>${Math.floor(state.elapsed/60)}:${String(Math.floor(state.elapsed%60)).padStart(2,'0')}</b>TIME INSIDE</div>`;
  try{localStorage.removeItem(SAVE_KEY)}catch{}updateResume();if(won){bell();tone(440,.7,'sine',.1,.7);tone(660,1,'sine',.1,1)}
}

function updateHud(){
  if(!state)return;
  $('dayLabel').textContent=`${DAYS[state.day].toUpperCase()} · ${state.day===7?'NEXT WEEK':`DAY ${state.day+1}/7`}`;
  $('phaseLabel').textContent=state.phase==='detention'?'DETENTION':state.phase==='night'?'AFTER HOURS':state.phase==='finale'?'FINAL MONDAY':isWeekend(state.day)?'NO CLASSES':'SCHOOL DAY';
  if(state.phase==='day'){
    const progress=1-state.phaseTime/(isWeekend(state.day)?10:25),minutes=Math.floor((8*60)+progress*(7*60));
    $('clock').textContent=`${String(Math.floor(minutes/60)%12||12).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')} ${minutes>=720?'PM':'AM'}`;
  }else if(state.phase==='night')$('clock').textContent=`DAWN IN ${Math.max(0,Math.ceil(state.nightRemaining))}s`;
  else $('clock').textContent=state.phase==='finale'?'7:30 AM':'AFTER HOURS';
  const scheduled=SCHEDULE[state.day]||[];
  if(state.phase==='day'){
    $('objectiveKicker').textContent=isWeekend(state.day)?'THE EMPTY SCHOOL':'YOUR TIMETABLE';
    if(isWeekend(state.day)){$('objectiveText').textContent='The teachers have gone home.';$('objectiveHint').textContent='Find a locker before darkness. Weekend captures end the run.';}
    else{
      const remaining=scheduled.filter(r=>!state.classes.includes(r));
      $('objectiveText').textContent=remaining.length?`Check in: ${remaining.map(r=>ROOMS[r].label).join(' → ')}`:'Classes done. Hide before lights out.';
      $('objectiveHint').textContent=remaining.length?'Walk into each room and press E near the teacher’s desk. M shows your map.':'Use E at a hallway locker. F switches off the flashlight.';
    }
  }else if(state.phase==='night'){
    const secured=state.proofs.includes(state.day);$('objectiveKicker').textContent=isWeekend(state.day)?'NO TEACHERS · NO SECOND CHANCE':`NIGHT ${state.day+1} OF SEVEN`;
    $('objectiveText').textContent=secured?'Proof secured. Hide until morning.':`Find proof in the ${ROOMS[NIGHT_ROOMS[state.day]].label}.`;
    $('objectiveHint').textContent=secured?(state.nightRemaining<=0?'The sun is rising. Enter a locker to finish the night.':'Stay out of sight. Running attracts the band teacher.'):
      state.day>0&&!state.hasKey?'First find the staff key in the Office. M shows the route.':`Collect ${NIGHT_PROOFS[state.day]}. Look for the gold glow.`;
  }else if(state.phase==='detention'){
    $('objectiveKicker').textContent='ESCAPE DETENTION';$('objectiveText').textContent=!state.detKey?'Search the teacher’s desk for a key.':!state.detPower?'Find a fuse and repair the door panel.':!state.detOpen?'Unlock the detention door.':'Walk out into the hall.';
    $('objectiveHint').textContent='Your night timer pauses here. E interacts. Your proof stays safe.';
  }else if(state.phase==='finale'){$('objectiveKicker').textContent='SEVEN NIGHTS COMPLETE';$('objectiveText').textContent='Get to the front doors.';$('objectiveHint').textContent='Press E at the glowing exit. Jamie is waiting outside.';}
  $('weekDots').innerHTML=DAYS.map((d,i)=>`<div class="${i<state.day?'done ':''}${i===state.day?'current ':''}${isWeekend(i)?'weekend':''}">${i<state.day?'✓':d.slice(0,1)}</div>`).join('');
  $('batteryText').textContent=`${Math.ceil(state.battery)}%${state.lightOn?' ON':''}`;$('batteryBar').style.width=`${state.battery}%`;
  $('troubleText').textContent=`${Math.ceil(state.trouble)}%`;$('troubleBar').style.width=`${state.trouble}%`;
  const noise=player.hidden?'Hidden':player.sprinting?'LOUD':player.crouching?'Quiet / crouching':player.moving?'Footsteps':'Quiet';
  $('noise').querySelector('span').textContent=noise;$('noise').querySelector('i').style.background=player.sprinting?'#f38b7b':'#a9edc8';
  const items=[];if(state.hasLight)items.push('F · Flashlight');if(state.hasKey)items.push('Staff key');if(state.decoys)items.push(`G · Toys ×${state.decoys}`);if(state.detKey)items.push('Detention key');if(state.detFuse)items.push('Fuse');items.push(`Proof ${state.proofs.length}/7`);
  $('inventory').innerHTML=items.map(i=>`<span>${i}</span>`).join('');
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
  const target=state.phase==='night'?ROOMS[NIGHT_ROOMS[state.day]]:state.phase==='day'&&!isWeekend(state.day)?ROOMS[SCHEDULE[state.day].find(r=>!state.classes.includes(r))]:state.phase==='finale'?{center:EXIT}:null;
  if(target&&!(state.phase==='night'&&state.proofs.includes(state.day))){const c=worldToGrid(target.center);ctx.strokeStyle='#f6cb7a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox+(c.x+.5)*s,oz+(c.z+.5)*s,s*.65,0,Math.PI*2);ctx.stroke();}
  const p=worldToGrid(player);ctx.fillStyle='#a4f5cc';ctx.beginPath();ctx.arc(ox+(p.x+.5)*s,oz+(p.z+.5)*s,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a4f5cc';ctx.beginPath();ctx.moveTo(ox+(p.x+.5)*s,oz+(p.z+.5)*s);ctx.lineTo(ox+(p.x+.5)*s-Math.sin(player.yaw)*13,oz+(p.z+.5)*s-Math.cos(player.yaw)*13);ctx.stroke();
}
function activeTick(dt){
  state.elapsed+=dt;state.grace=Math.max(0,state.grace-dt);state.decoyCooldown=Math.max(0,state.decoyCooldown-dt);state.moveNoise=Math.max(0,state.moveNoise-dt*3);
  if(noiseTime>0)noiseTime-=dt;
  if(state.trouble>=60&&!state.troubleWarned){state.troubleWarned=true;say('Your trouble record is high. Patrols are watching and listening more closely.',5);tone(380,.4,'triangle',.09);}
  if(state.phase==='capture'||state.phase==='blackout'){updateCapture(dt);return;}
  movePlayer(dt);
  if(state.lightOn){state.battery=Math.max(0,state.battery-dt*DIFFICULTY[state.difficulty].drain);if(state.battery===0){state.lightOn=false;say('Your flashlight battery is empty.',3);}}
  if(state.phase==='day'){
    state.phaseTime=Math.max(0,state.phaseTime-dt);if(state.phaseTime<=0)startNight();
  }else if(state.phase==='night'){
    state.nightElapsed+=dt;state.nightRemaining=Math.max(0,state.nightRemaining-dt);state.phaseTime=state.nightRemaining;
    if(state.nightRemaining<=0&&state.proofs.includes(state.day)&&player.hidden){startDay(true);return;}
    if(state.grace<=0)state.trouble=Math.max(0,state.trouble-dt*.18);
  }else if(state.phase==='detention'){
    state.phaseTime+=dt;const prior=Math.floor(detLampTime/.65);detLampTime+=dt;const now=Math.floor(detLampTime/.65);
    if(now!==prior&&now<=3){world.setMood(false,now);tone(70,.16,'sawtooth',.1);noiseSound(.08,.08);}
    if(detLampTime<.65)world.setMood(false,0);
    if(state.detOpen&&player.z>ROOMS.detention.bounds.maxZ+CELL_SIZE+.30){escapeDetention();}
    if(state.phaseTime>30&&Math.floor(state.phaseTime)%12===0&&noticeTime<=0)say('Key: teacher’s desk. Fuse: supply shelf. Panel: beside the door.',5);
  }
  if(state.phase!=='detention')updateEnemies(dt);
  nearby=candidateInteraction();$('interact').hidden=!nearby;if(nearby)$('interact').querySelector('span').textContent=nearby.label||interactionLabel(nearby);
  hudTime-=dt;if(hudTime<=0){updateHud();if(mapOpen)drawMap();hudTime=.2;}
}
function interactionLabel(o){
  return {flashlight:'Pick up flashlight',key:'Take staff key',battery:'Pick up battery',decoy:'Take wind-up toys',proof:'Collect tonight’s proof',class:`Attend ${ROOMS[o.room]?.label||'class'}`,detKey:'Take detention key',detFuse:'Take fuse',detPanel:'Repair fuse panel',detDoor:'Unlock detention door',exit:'Open the front doors'}[o.type]||o.label||'Interact';
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
  positionCamera(dt);renderer.render(scene,camera);
}
requestAnimationFrame(frame);

// Read-only state supports deployment verification without changing gameplay.
window.afterBellInfo=()=>state?({day:DAYS[state.day],dayIndex:state.day,phase:state.phase,proofs:state.proofs.length,paused,
  nightRemaining:state.nightRemaining,enemyIds:enemies.map(e=>e.id),weekend:isWeekend(state.day)}):({phase:mode});

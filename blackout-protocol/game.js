(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d'), mapCanvas=$('map'), mx=mapCanvas.getContext('2d');
const T=32,W=214,H=93,SAVE='daft-blackout-v1',OPT='daft-blackout-options-v1',PI=Math.PI,TAU=PI*2;
function storageGet(key){try{return localStorage.getItem(key);}catch{return null;}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let seed=7107;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const tiles=new Uint8Array(W*H).fill(1),sectors=[],rooms=[],gates=[],controls=[],caches=[],pods=[],lamps=[],vents=[],walkways=[],guards=[],particles=[],bullets=[],keys=new Set(),tentacles=[];
let options={difficulty:'normal',low:false,sound:true},state='menu',beforeHelp='menu',last=0,acc=0,time=0,shake=0,toastTime=0,bannerTime=0,autosave=0,lastHud=0,lastInteract=null,activeSector=-1,checkpoint=null,consumed=new Set(),taken=new Set(),flags={},elapsed=0,captures=0,slams=0,visited=new Set(),codeStep=0,pulse=0,winShown=false,opening=0;
const player={x:17*T,y:23*T,vx:0,vy:0,mass:50,hp:100,aimX:1,aimY:0,invuln:0},camera={x:player.x,y:player.y,zoom:1,look:0,facing:1};
const sectorDefs=[['CONTAINMENT','−86 / BIOLOGICAL RESEARCH',6,6,'#355c6e'],['POWER WORKS','−89 / REACTOR CONTROL',74,6,'#7b6b35'],['SECURITY COMMAND','−92 / TACTICAL RESPONSE',142,6,'#80485c'],['THERMAL FOUNDRY','−108 / COOLANT ENGINEERING',142,48,'#986548'],['DEEP ARCHIVE','−111 / SIGNAL INTELLIGENCE',74,48,'#4c4e8d'],['LAUNCH COMPLEX','−114 / EMERGENCY EGRESS',6,48,'#3a776b']];
function carve(x,y,w,h){for(let j=Math.max(1,y);j<Math.min(H-1,y+h);j++)for(let i=Math.max(1,x);i<Math.min(W-1,x+w);i++)tiles[j*W+i]=0;}
function corridor(a,b,width=6){const half=Math.floor(width/2);carve(Math.min(a.x,b.x)-half,a.y-half,Math.abs(a.x-b.x)+width,width);carve(b.x-half,Math.min(a.y,b.y)-half,width,Math.abs(a.y-b.y)+width);}
function room(x,y,w,h,sector,type){carve(x,y,w,h);const r={x,y,w,h,sector,type,cx:x+w/2,cy:y+h/2};rooms.push(r);return r;}
function worldPoint(x,y){return{x:x*T,y:y*T};}
function addControl(id,label,x,y,sector,type='lever',desc=''){controls.push({id,label,x:x*T,y:y*T,sector,type,desc});}
function makeWorld(){
 for(let s=0;s<sectorDefs.length;s++){
  const [name,sub,x,y,color]=sectorDefs[s],sec={name,sub,x,y,w:64,h:38,color,index:s};sectors.push(sec);
  const a=room(x+3,y+9,17,16,s,'lab'),b=room(x+25,y+4,17,14,s,'control'),c=room(x+45,y+12,17,16,s,'barracks'),d=room(x+22,y+27,22,10,s,'storage');
  for(const r of[a,c])walkways.push({x:(r.x+2)*T,y:(r.y+9)*T,w:(r.w-4)*T,h:8});
  const p=r=>({x:Math.floor(r.cx),y:Math.floor(r.cy)});sec.a=p(a);sec.b=p(b);sec.c=p(c);sec.d=p(d);
  corridor(sec.a,sec.b);corridor(sec.b,sec.c);corridor(sec.b,sec.d,5);corridor(sec.d,sec.c,5);corridor(sec.a,sec.d,5);
  // Secondary galleries make every sector a traversable loop rather than a single hallway.
  carve(x+5,y+30,11,5);corridor({x:x+10,y:y+32},sec.a,4);corridor({x:x+10,y:y+32},sec.d,4);
  pods.push({id:s,x:(s<3?sec.a.x:sec.c.x)*T,y:(s<3?sec.a.y:sec.c.y)*T,sector:s});
  for(const r of[a,b,c,d])for(let l=3;l<r.w-2;l+=7)lamps.push({x:(r.x+l)*T,y:r.y*T+4,sector:s,flicker:rand()});
  for(let i=0;i<14;i++){
   const r=[a,b,c,d][i%4],gx=(r.x+2+rand()*(r.w-4))*T,gy=(r.y+2+rand()*(r.h-4))*T;
   guards.push({id:guards.length,x:gx,y:gy,sx:gx,sy:gy,vx:0,vy:0,alive:true,held:-1,stun:0,alert:0,face:rand()<.5?-1:1,patrol:rand()*TAU,shot:1+rand()*2,mass:s>2?60:50,sector:s,elite:s>1&&i%4===0,absorb:0});
  }
  for(let i=0;i<5;i++){const r=[b,d,c,d,a][i];caches.push({id:caches.length,x:(r.x+3+rand()*(r.w-6))*T,y:(r.y+3+rand()*(r.h-6))*T,mass:25,sector:s});}
  vents.push({x:(x+15)*T,y:(y+11)*T,w:90,h:18,sector:s});
 }
 corridor(sectors[0].c,sectors[1].a,7);corridor(sectors[1].c,sectors[2].a,7);
 corridor(sectors[2].c,sectors[3].c,7);
 corridor(sectors[3].a,sectors[4].c,7);corridor(sectors[4].a,sectors[5].c,7);
 corridor(sectors[5].a,sectors[0].a,6);corridor(sectors[0].a,{x:17,y:2},6);carve(11,1,13,5);
 function gate(id,x,y,w,h,mass,requires,label,floor=false){gates.push({id,x:x*T,y:y*T,w:w*T,h:h*T,mass,requires,label,floor,open:false,broken:false});}
 gate('containment',70,23,1,7,100,['release'],'CONTAINMENT GRATE');
 gate('reactor',138,23,1,7,0,['reactorA','reactorB'],'REACTOR BULKHEAD');
 gate('descent',192,45,7,1,400,['security'],'DEEP-SHAFT FLOOR GRATE',true);
 gate('cooling',138,62,1,7,700,['coolantA','coolantB'],'FOUNDRY PRESSURE SEAL');
 gate('archive',70,62,1,7,0,['archive'],'ARCHIVE SEAL');
 gate('return',14,44,7,1,1250,['egress'],'HEAVY MAINTENANCE GRATE',true);
 gate('surface',14,7,7,1,1250,['egress'],'SURFACE CONTAINMENT HATCH',true);
 // Optional weight-sensitive floor over a useful biomass cache gallery.
 gate('cache0',37,30,5,1,200,[],'LIGHT FLOOR GRATE',true);
 addControl('release','Containment release',39,17,0,'lever','Release containment, then reach 100 lb to rupture the east grate.');
 addControl('reactorA','Reactor relay A',107,17,1,'lever','Power route A is ready.');
 addControl('reactorB','Reactor relay B',107,38,1,'lever','Power route B is ready.');
 addControl('security','Deep access authorization',175,17,2,'console','Authorization acquired. The deep-shaft floor fails at 400 lb.');
 addControl('coolantA','Coolant intake valve',175,59,3,'valve','Intake isolated.');
 addControl('coolantB','Coolant return valve',175,80,3,'valve','Return isolated.');
 addControl('codeBlue','BLUE signal',107,59,4,'code','SIGNAL KEY: BLUE → WHITE → AMBER');
 addControl('codeWhite','WHITE signal',85,65,4,'code','SIGNAL KEY: BLUE → WHITE → AMBER');
 addControl('codeAmber','AMBER signal',107,80,4,'code','SIGNAL KEY: BLUE → WHITE → AMBER');
 addControl('egress','Emergency egress release',39,59,5,'console','Surface release enabled. Break the 1,250 lb maintenance grate and ascend the original containment shaft.');
}
makeWorld();
guards[0].x=guards[0].sx=22*T;guards[0].y=guards[0].sy=23*T;
const limbCount=m=>m<100?3:m<=1000?3+Math.floor(m/100):13+Math.floor((m-1000)/250);
const nextGrowth=m=>m<100?100:m<1000?(Math.floor(m/100)+1)*100:1000+(Math.floor((m-1000)/250)+1)*250;
const radius=()=>17+Math.pow(player.mass,.43)*.72;
function tileSolid(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T);return tx<0||ty<0||tx>=W||ty>=H||tiles[ty*W+tx]===1;}
function blocked(x,y,r=2){if(tileSolid(x-r,y-r)||tileSolid(x+r,y-r)||tileSolid(x-r,y+r)||tileSolid(x+r,y+r))return true;return gates.some(g=>!g.open&&x+r>g.x&&x-r<g.x+g.w&&y+r>g.y&&y-r<g.y+g.h);}
// Guards use side-view feet, headroom and one-way research catwalks.
function guardBlocked(x,y){return [[-9,-27],[9,-27],[-9,-5],[9,-5],[-9,19],[9,19]].some(([dx,dy])=>blocked(x+dx,y+dy,0));}
function supported(g){return blocked(g.x-7,g.y+21,0)||blocked(g.x+7,g.y+21,0)||walkways.some(p=>g.x+8>p.x&&g.x-8<p.x+p.w&&Math.abs(g.y+20-p.y)<1.5);}
function settleGuards(){for(const g of guards){let floor=H*T-32;for(let y=Math.ceil((g.y+20)/T)*T;y<H*T;y+=T){if(blocked(g.x-7,y+1,0)||blocked(g.x+7,y+1,0)){floor=y;break;}}for(const p of walkways)if(p.y>=g.y+20&&p.y<floor&&g.x+8>p.x&&g.x-8<p.x+p.w)floor=p.y;g.y=g.sy=floor-20;g.sx=g.x;g.grounded=true;g.hit=0;g.scuffs=0;}}
function moveGuard(g,dx,dt){
 const nextX=g.x+dx;if(!guardBlocked(nextX,g.y))g.x=nextX;else{g.vx=0;g.face=-g.face;g.patrol+=PI;}
 g.grounded=supported(g);g.vy=g.grounded&&g.vy>=0?0:Math.min(560,g.vy+950*dt);
 const n=Math.max(1,Math.ceil(Math.abs(g.vy*dt)/4)),dy=g.vy*dt/n;
 for(let i=0;i<n;i++){let ny=g.y+dy;const ledge=dy>=0?walkways.filter(p=>g.x+8>p.x&&g.x-8<p.x+p.w&&g.y+20<=p.y+.5&&ny+20>=p.y).sort((a,b)=>a.y-b.y)[0]:null;
  if(ledge){g.y=ledge.y-20;g.vy=0;g.grounded=true;break;}
  if(guardBlocked(g.x,ny)){if(dy>0){let lo=g.y,hi=ny;for(let k=0;k<9;k++){const mid=(lo+hi)/2;if(guardBlocked(g.x,mid))hi=mid;else lo=mid;}g.y=lo;g.grounded=true;}g.vy=0;break;}g.y=ny;
 }
}
settleGuards();
function los(ax,ay,bx,by){const n=Math.ceil(Math.hypot(bx-ax,by-ay)/16);for(let i=1;i<n;i++)if(blocked(lerp(ax,bx,i/n),lerp(ay,by,i/n)))return false;return true;}
function sectorAt(x,y){let best=0,bd=Infinity;for(const s of sectors){const d=Math.hypot(x-(s.x+32)*T,y-(s.y+20)*T);if(d<bd){bd=d;best=s.index;}}return best;}
function objectives(){
 if(!flags.release)return['Break containment.','Pull the release lever in the upper control room. Capture guards with ARROWS; release ARROWS to absorb.'];
 if(player.mass<100)return['Grow to 100 lb.','Capture a guard or collect a glowing biomass canister. The east containment grate will yield.'];
 if(!flags.reactorA||!flags.reactorB)return['Restore both reactor relays.','Travel east into Power Works. Relay A is upstairs; relay B is in the lower storage gallery.'];
 if(!flags.security)return['Authorize the deep shaft.','Travel east to Security Command. Use the upstairs command console.'];
 if(player.mass<400)return['Reach 400 lb.','The deep-shaft floor grate needs 400 lb. Explore labs and storage rooms for guards and biomass.'];
 if(!flags.coolantA||!flags.coolantB)return['Isolate the foundry coolant.','Descend the eastern shaft. Turn both valves in the Thermal Foundry, then travel west.'];
 if(player.mass<700)return['Build 700 lb of biomass.','The western foundry seal needs 700 lb plus both coolant valves.'];
 if(!flags.archive)return['Solve the archive signal lock.','Deep Archive terminals: BLUE → WHITE → AMBER. Wrong order resets the signal sequence.'];
 if(!flags.egress)return['Enable emergency egress.','Travel west into Launch Complex and operate its upstairs console.'];
 if(player.mass<1250)return['Reach 1,250 lb.','Break the heavy maintenance grate above the western regeneration pod. Keep exploring for biomass.'];
 return['Return to the surface.','Ascend the western maintenance shaft, through the original containment lab, and break the surface hatch.'];
}
function toast(message,duration=4){$('toast').textContent=message;$('toast').classList.remove('hidden');toastTime=duration;}
let audio;
function tone(freq=120,duration=.1,type='sine',vol=.04){if(!options.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*.5),audio.currentTime+duration);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function puff(x,y,color,count=10,speed=65){for(let i=0;i<count;i++){const a=rand()*TAU,s=rand()*speed;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+rand()*.5,max:1,color,size:2+rand()*3});}if(particles.length>600)particles.splice(0,particles.length-600);}
function snapshot(){return{version:1,x:player.x,y:player.y,mass:player.mass,hp:player.hp,consumed:[...consumed],taken:[...taken],flags:{...flags},visited:[...visited],codeStep,elapsed,captures,slams,winShown};}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({current:snapshot(),checkpoint}));}catch{}}
function validateSnapshot(s){
 if(!s||typeof s!=='object'||s.version!==1)throw Error('Invalid save version');
 for(const k of['x','y','mass','hp'])if(typeof s[k]!=='number'||!Number.isFinite(s[k]))throw Error('Invalid saved '+k);
 if(s.mass<50||s.mass>20000||s.hp<=0||s.hp>100||s.x<16||s.y<16||s.x>W*T-16||s.y>H*T-16)throw Error('Saved values out of bounds');
 if(tileSolid(s.x-12,s.y-12)||tileSolid(s.x+12,s.y-12)||tileSolid(s.x-12,s.y+12)||tileSolid(s.x+12,s.y+12))throw Error('Saved location inside wall');
 const copy={...s,flags:{}};for(const id of['release','reactorA','reactorB','security','coolantA','coolantB','archive','egress'])if(s.flags&&typeof s.flags[id]==='boolean')copy.flags[id]=s.flags[id];
 for(const [key,max]of[['consumed',guards.length],['taken',caches.length],['visited',sectors.length]]){if(s[key]!==undefined&&(!Array.isArray(s[key])||s[key].length>max))throw Error('Invalid saved IDs');copy[key]=[...new Set((s[key]||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<max))];}
 copy.codeStep=Number.isInteger(s.codeStep)&&s.codeStep>=0&&s.codeStep<=3?s.codeStep:0;
 for(const k of['elapsed','captures','slams'])copy[k]=typeof s[k]==='number'&&Number.isFinite(s[k])&&s[k]>=0?s[k]:0;
 if(gates.some(g=>!(s.mass>=g.mass&&g.requires.every(f=>copy.flags[f]))&&s.x+12>g.x&&s.x-12<g.x+g.w&&s.y+12>g.y&&s.y-12<g.y+g.h))throw Error('Saved location inside locked gate');
 return copy;
}
function validCheckpoint(s){try{return validateSnapshot(s);}catch{return snapshot();}}
function loadSnapshot(s){s=validateSnapshot(s);player.x=s.x;player.y=s.y;player.vx=0;player.vy=0;player.mass=clamp(s.mass||50,50,20000);player.hp=clamp(s.hp||100,1,100);consumed=new Set(s.consumed||[]);taken=new Set(s.taken||[]);flags={...s.flags};visited=new Set(s.visited||[]);codeStep=s.codeStep||0;elapsed=s.elapsed||0;captures=s.captures||0;slams=s.slams||0;winShown=!!s.winShown;for(const g of guards){g.alive=!consumed.has(g.id);g.x=g.sx;g.y=g.sy;g.vx=g.vy=0;g.held=-1;g.alert=0;g.stun=0;g.absorb=0;g.hit=0;g.scuffs=0;g.grounded=true;}tentacles.length=0;particles.length=0;bullets.length=0;activeSector=-1;pulse=0;camera.x=player.x;camera.y=player.y;updateGates(false);}
function reset(){flags={};consumed.clear();taken.clear();visited.clear();codeStep=elapsed=captures=slams=0;winShown=false;loadSnapshot({version:1,x:17*T,y:23*T,mass:50,hp:100});checkpoint=snapshot();save();}
function recover(){if(checkpoint)loadSnapshot(checkpoint);else reset();player.hp=100;player.invuln=3;state='playing';hideScreens();$('hud').classList.remove('hidden');toast('NEURAL LINK RESTORED · recovery checkpoint',4);save();}
function setCheckpoint(s){visited.add(s);player.hp=100;checkpoint=snapshot();save();puff(player.x,player.y,'#72ddcf',25,90);tone(360,.25,'sine',.05);toast('REGENERATION LINKED · checkpoint saved',3);}
function updateGates(effect=true){for(const g of gates){const open=player.mass>=g.mass&&g.requires.every(f=>flags[f]);if(open&&!g.open&&effect){if(Math.hypot(player.x-g.x,player.y-g.y)<650){puff(g.x+g.w/2,g.y+g.h/2,'#94adbd',30,130);shake=5;tone(75,.3,'sawtooth',.035);toast(g.label+' · BREACHED',3);}g.broken=true;}g.open=open;}}
function gainMass(amount){const old=limbCount(player.mass);player.mass+=amount;player.hp=Math.min(100,player.hp+4);puff(player.x,player.y,'#ffd9a1',14,75);tone(200,.14,'triangle',.05);if(limbCount(player.mass)>old){toast('BIOMASS '+Math.round(player.mass)+' LB · NEW TENTACLE',4);shake=4;tone(310,.35,'triangle',.04);}updateGates();}
function interact(){if(state!=='playing')return;const near=[...controls,...pods.map(p=>({...p,pod:true}))].filter(c=>Math.hypot(c.x-player.x,c.y-player.y)<90).sort((a,b)=>dist(a,player)-dist(b,player))[0];if(!near){toast('No control in reach. Look for a glowing panel or blue pod.',2);return;}if(near.pod){setCheckpoint(near.sector);return;}if(near.type==='code'){
 const order=['codeBlue','codeWhite','codeAmber'];if(flags.archive){toast('Archive lock already released.',2);return;}if(near.id===order[codeStep]){codeStep++;tone(300+codeStep*100,.15,'sine');toast('SIGNAL '+codeStep+'/3 CONFIRMED'+(codeStep===3?' · ARCHIVE RELEASED':''),3);if(codeStep===3)flags.archive=true;}else{codeStep=0;tone(90,.3,'square',.03);toast('SIGNAL RESET · blue → white → amber',4);}
 }else if(flags[near.id])toast(near.label+' · already engaged',2);else{flags[near.id]=true;tone(320,.2,'triangle');puff(near.x,near.y,'#65dac7',16,60);toast(near.desc,5);}
 updateGates();save();}
function neuralPulse(){if(state!=='playing'||pulse>0)return;pulse=9;for(const g of guards)if(g.alive&&dist(g,player)<230){g.stun=4;g.alert=0;}puff(player.x,player.y,'#65dac7',45,210);tone(65,.5,'sine',.1);shake=3;}
function resize(){let scale=options.low?2.1:1.4;canvas.width=Math.max(400,Math.floor(innerWidth/scale));canvas.height=Math.max(250,Math.floor(innerHeight/scale));ctx.imageSmoothingEnabled=false;mapCanvas.width=1000;mapCanvas.height=450;}
function hideScreens(){for(const id of['menu','pause','help','mapScreen','win'])$(id).classList.add('hidden');}
function start(continueRun=false){if(continueRun){try{const s=JSON.parse(storageGet(SAVE));try{loadSnapshot(s.current);}catch{loadSnapshot(s.checkpoint);}checkpoint=validCheckpoint(s.checkpoint);}catch{reset();}}else reset();state='playing';hideScreens();$('hud').classList.remove('hidden');opening=1;last=performance.now();tone(180,.3,'triangle');toast('WASD moves your body · ARROWS reach · release ARROWS to absorb',6);}
function pause(){if(state==='playing'){$('pauseTitle').textContent='The facility can wait.';$('resumeBtn').innerHTML='RESUME <span>→</span>';state='paused';$('pause').classList.remove('hidden');keys.clear();save();}else if(state==='paused'){state='playing';$('pause').classList.add('hidden');}}
function showHelp(){beforeHelp=state;state='help';$('help').classList.remove('hidden');keys.clear();}
function closeHelp(){$('help').classList.add('hidden');state=beforeHelp;}
function mapToggle(){if(state==='playing'){state='map';keys.clear();$('mapScreen').classList.remove('hidden');$('mapObjective').textContent=objectives().join(' ');drawMap();}else if(state==='map'){state='playing';$('mapScreen').classList.add('hidden');}}
function menu(){state='menu';hideScreens();$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('continueBtn').classList.toggle('hidden',!storageGet(SAVE));keys.clear();}
function win(){if(winShown)return;winShown=true;state='won';save();$('win').classList.remove('hidden');$('winStats').innerHTML='<span><b>'+Math.round(player.mass)+'</b>pounds of biomass</span><span><b>'+limbCount(player.mass)+'</b>tentacles</span><span><b>'+captures+'</b>guards absorbed</span><span><b>'+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0')+'</b>escape time</span>';tone(420,.8,'triangle',.05);}
function moveEntity(e,dx,dy,r){if(!blocked(e.x+dx,e.y,r))e.x+=dx;else e.vx=0;if(!blocked(e.x,e.y+dy,r))e.y+=dy;else e.vy=0;}
function updateCreature(dt){const r=Math.min(radius()*.72,27),boost=keys.has('Shift')?1.14:1;let ix=(keys.has('d')?1:0)-(keys.has('a')?1:0),iy=(keys.has('s')?1:0)-(keys.has('w')?1:0);const il=Math.hypot(ix,iy)||1;ix/=il;iy/=il;const speed=(options.difficulty==='story'?200:180)*boost*(1-Math.min(.2,(player.mass-50)/16000));player.vx=lerp(player.vx,ix*speed,1-Math.exp(-dt*9));player.vy=lerp(player.vy,iy*speed,1-Math.exp(-dt*9));moveEntity(player,player.vx*dt,player.vy*dt,r);
 const ax=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),ay=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0),aiming=!!(ax||ay),al=Math.hypot(ax,ay)||1;if(aiming){player.aimX=lerp(player.aimX,ax/al,1-Math.exp(-dt*16));player.aimY=lerp(player.aimY,ay/al,1-Math.exp(-dt*16));}
 const count=limbCount(player.mass);while(tentacles.length<count){const i=tentacles.length;tentacles.push({x:player.x,y:player.y,vx:0,vy:0,held:-1,phase:i*2.399,born:time,points:Array.from({length:12},()=>({x:player.x,y:player.y}))});}
 const reach=185+Math.sqrt(player.mass)*2.2,bodyR=radius();
 for(let i=0;i<tentacles.length;i++){
  const t=tentacles[i],baseAngle=t.phase+time*.23,spread=(i-(count-1)/2)*Math.min(.22,1.6/count),aimAng=Math.atan2(player.aimY,player.aimX)+spread;
  const direction=aiming?aimAng:baseAngle,rest=t.held>=0?bodyR*.45:bodyR+38+Math.sin(time*1.8+i)*18;
  const length=aiming?reach*(.85+.12*Math.sin(i*3)):rest,tx=player.x+Math.cos(direction)*length,ty=player.y+Math.sin(direction)*length;
  const retract=t.held>=0&&!aiming;const ox=t.x,oy=t.y;t.vx+=(tx-t.x)*dt*31;t.vy+=(ty-t.y)*dt*31;t.vx*=Math.exp(-dt*9);t.vy*=Math.exp(-dt*9);
  let nx=retract?lerp(t.x,tx,1-Math.exp(-dt*17)):t.x+t.vx*dt,ny=retract?lerp(t.y,ty,1-Math.exp(-dt*17)):t.y+t.vy*dt,collision=blocked(nx,ny,3);
  if(collision){const a=Math.atan2(ny-player.y,nx-player.x),l=Math.hypot(nx-player.x,ny-player.y);for(let k=l;k>bodyR;k-=9){const qx=player.x+Math.cos(a)*k,qy=player.y+Math.sin(a)*k;if(!blocked(qx,qy,3)){nx=qx;ny=qy;break;}}if(t.held>=0&&Math.hypot(t.vx,t.vy)>90){const g=guards[t.held];if(g.stun<1){slams++;g.stun=3;g.hit=.18;g.scuffs=Math.min(3,(g.scuffs||0)+1);shake=3;puff(t.x,t.y,'#ffe5a6',12,100);tone(65,.12,'triangle',.03);}}t.vx*=.15;t.vy*=.15;}
  if(!blocked(nx,ny,2)){t.x=nx;t.y=ny;}else{t.x=lerp(t.x,player.x,.12);t.y=lerp(t.y,player.y,.12);}
  // Continuous curved limbs with a trailing wave and damped segment motion.
  const dx=t.x-player.x,dy=t.y-player.y,ll=Math.hypot(dx,dy)||1,px=-dy/ll,py=dx/ll;
  for(let j=0;j<t.points.length;j++){const f=j/(t.points.length-1),wave=Math.sin(f*5-time*4+i)*Math.sin(f*PI)*(aiming?14:19),curl=Math.sin(f*PI)*(Math.sin(t.phase)*16);const q=t.points[j];q.x=lerp(q.x,player.x+dx*f+px*(wave+curl),Math.min(1,dt*(j===0?100:30)));q.y=lerp(q.y,player.y+dy*f+py*(wave+curl),Math.min(1,dt*(j===0?100:30)));}t.points[0].x=player.x;t.points[0].y=player.y;t.points.at(-1).x=t.x;t.points.at(-1).y=t.y;
  if(t.held<0&&aiming){for(const g of guards){if(g.alive&&g.held<0&&t.points.some(q=>Math.hypot(g.x-q.x,g.y-q.y)<24)&&los(player.x,player.y,g.x,g.y)){t.x=g.x;t.y=g.y;t.held=g.id;g.held=i;g.stun=2;g.absorb=0;g.hit=.12;g.scuffs=Math.min(3,(g.scuffs||0)+1);puff(g.x,g.y,'#ffdf9d',8,55);tone(160,.1,'triangle',.03);break;}}}
  if(t.held>=0){const g=guards[t.held];g.x=t.x;g.y=t.y;g.vx=(t.x-ox)/dt;g.vy=(t.y-oy)/dt;if(!aiming&&Math.hypot(g.x-player.x,g.y-player.y)<bodyR+23){g.absorb+=dt;if(g.absorb>.07){g.alive=false;g.held=-1;t.held=-1;consumed.add(g.id);captures++;gainMass(g.mass);puff(g.x,g.y,'#ffe7b8',14,95);}}else g.absorb=0;}
 }
 for(const c of caches)if(!taken.has(c.id)&&Math.hypot(c.x-player.x,c.y-player.y)<bodyR+20){taken.add(c.id);gainMass(c.mass);toast('RESEARCH BIOMASS +25 LB',2);}
 player.invuln=Math.max(0,player.invuln-dt);pulse=Math.max(0,pulse-dt);
 if(player.hp<=0){tone(65,.5,'sawtooth',.04);recover();}
 if(player.y<5*T&&player.x>11*T&&player.x<24*T&&flags.egress&&player.mass>=1250)win();
}
function updateGuards(dt){const threat=options.difficulty==='story'?.42:options.difficulty==='hard'?1.5:1;
 for(const g of guards){g.hit=Math.max(0,(g.hit||0)-dt);if(!g.alive||g.held>=0)continue;
  g.stun=Math.max(0,g.stun-dt);g.shot-=dt;const active=Math.abs(g.x-player.x)<1100&&Math.abs(g.y-player.y)<850;
  const d=dist(g,player),sees=active&&d<430&&los(g.x,g.y-10,player.x,player.y),panic=player.mass>650&&!g.elite;
  if(sees){g.alert=Math.min(5,g.alert+dt*3);if(d<230)for(const ally of guards)if(ally.alive&&ally.held<0&&ally.sector===g.sector&&dist(ally,g)<250)ally.alert=Math.max(ally.alert,2);}else g.alert=Math.max(0,g.alert-dt*.5);
  let direction=0,speed=29;
  if(active&&g.stun<=0){if(g.alert>1){direction=Math.sign(player.x-g.x)*(panic||d<140?-1:1);speed=panic?68:46;if(d>165&&d<265&&!panic)direction=0;}else{direction=g.face;if(Math.abs(g.x-g.sx)>135)direction=Math.sign(g.sx-g.x);const ahead=g.x+direction*22;if(g.grounded&&!blocked(ahead,g.y+24,0)&&!walkways.some(p=>ahead>p.x&&ahead<p.x+p.w&&Math.abs(g.y+20-p.y)<2))direction=-direction;}}
  if(direction)g.face=direction;g.vx=direction*speed;moveGuard(g,g.vx*dt,dt);
  if(sees&&g.alert>1&&g.shot<=0&&!panic&&g.stun<=0){g.shot=(g.elite?1.2:1.9)/threat+rand()*.7;const a=Math.atan2(player.y-(g.y-9),player.x-g.x)+(rand()-.5)*.18;bullets.push({x:g.x,y:g.y-9,vx:Math.cos(a)*410,vy:Math.sin(a)*410,life:1.2,damage:(g.elite?7:5)*threat});puff(g.x+Math.cos(a)*20,g.y-9,'#f5d7a1',2,30);tone(280,.04,'square',.008);}
 }
}
function update(dt){time+=dt;elapsed+=dt;updateCreature(dt);if(state!=='playing')return;updateGuards(dt);for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(blocked(b.x,b.y)){puff(b.x,b.y,'#a5b3c7',3,35);bullets.splice(i,1);continue;}if(Math.hypot(b.x-player.x,b.y-player.y)<radius()&&player.invuln<=0){player.hp-=b.damage;player.invuln=.35;shake=3;puff(b.x,b.y,'#ffb86d',7,65);bullets.splice(i,1);continue;}if(b.life<=0)bullets.splice(i,1);}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*2);p.vy*=Math.exp(-dt*2);if(p.life<=0)particles.splice(i,1);}
 const sec=sectorAt(player.x,player.y);if(sec!==activeSector){activeSector=sec;const s=sectors[sec];$('sectorBanner').innerHTML='<small>'+s.sub+'</small>'+s.name;$('sectorBanner').classList.remove('hidden');bannerTime=3.5;if(!visited.has(sec)){visited.add(sec);setCheckpoint(sec);}}
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.add('hidden');}if(bannerTime>0){bannerTime-=dt;$('sectorBanner').style.opacity=Math.min(1,bannerTime);if(bannerTime<=0)$('sectorBanner').classList.add('hidden');}
 opening=Math.max(0,opening-dt);shake=Math.max(0,shake-dt*12);autosave+=dt;if(autosave>3){autosave=0;save();}lastHud+=dt;if(lastHud>.13){lastHud=0;updateHud();}
}
function updateHud(){const mass=Math.floor(player.mass),next=nextGrowth(mass),prev=next-(mass<100?50:mass<1000?100:250);$('mass').innerHTML=mass.toLocaleString()+' <em>LB</em>';$('growth').textContent='NEXT LIMB · '+next.toLocaleString()+' LB';$('growthbar').style.width=clamp((mass-prev)/(next-prev)*100,0,100)+'%';$('healthbar').style.width=player.hp+'%';$('limbs').textContent=limbCount(mass)+' TENTACLES · '+(pulse>0?Math.ceil(pulse)+'s':'PULSE READY');const o=objectives();$('objective').textContent=o[0];$('subobjective').textContent=o[1];$('sector').textContent=String(activeSector+1).padStart(2,'0')+' / '+sectors[Math.max(0,activeSector)].name;
 lastInteract=[...controls,...pods.map(p=>({...p,pod:true}))].filter(c=>dist(c,player)<90).sort((a,b)=>dist(a,player)-dist(b,player))[0];const gate=gates.find(g=>!g.open&&Math.hypot(player.x-g.x-g.w/2,player.y-g.y-g.h/2)<110);
 if(lastInteract){$('interact').textContent='[ E ] '+(lastInteract.pod?'Regenerate & save checkpoint':lastInteract.label+(flags[lastInteract.id]?' · ENGAGED':''));$('interact').classList.remove('hidden');}else if(gate){const needs=[];if(player.mass<gate.mass)needs.push(gate.mass.toLocaleString()+' lb');for(const f of gate.requires)if(!flags[f])needs.push(f==='archive'?'signal sequence':f==='egress'?'egress release':f.replace(/([A-Z])/g,' $1')+' control');$('interact').textContent=gate.label+' · REQUIRES '+needs.join(' + ');$('interact').classList.remove('hidden');}else $('interact').classList.add('hidden');}
// Pixel art is drawn entirely in code: a fixed palette, hard-edged materials and layered light.
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function text(str,x,y,color='#95aebe',size=8){ctx.fillStyle=color;ctx.font=size+'px ui-monospace,monospace';ctx.fillText(str,Math.round(x),Math.round(y));}
function drawBackground(bounds){ctx.fillStyle='#06101a';ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);for(const s of sectors){if(s.x*T>bounds.x+bounds.w||s.y*T>bounds.y+bounds.h||(s.x+s.w)*T<bounds.x||(s.y+s.h)*T<bounds.y)continue;
 for(const r of rooms.filter(r=>r.sector===s.index)){rect(r.x*T,r.y*T,r.w*T,r.h*T,'#101e2a');for(let x=r.x*T;x<(r.x+r.w)*T;x+=64){rect(x,r.y*T,2,r.h*T,'#152633');rect(x+5,r.y*T,1,r.h*T,'#0c1822');}for(let y=r.y*T;y<(r.y+r.h)*T;y+=64){rect(r.x*T,y,r.w*T,2,'#152733');}rect(r.x*T+5,r.y*T+28,r.w*T-10,5,'#263c47');rect(r.x*T+5,r.y*T+34,r.w*T-10,2,'#080f16');
 // Cabinets, cable runs, stairs and research vessels give rooms depth without creating invisible obstacles.
 const floor=(r.y+r.h)*T;for(let j=0;j<r.w-4;j+=5){const x=(r.x+j+2)*T;if(r.type==='lab'){rect(x,floor-84,44,70,'#182b39');rect(x+4,floor-79,36,52,'#153c47');rect(x+7,floor-74,30,41,'#1e5860');rect(x+13,floor-64,17,26,'#275f67');rect(x-4,floor-15,52,10,'#243643');rect(x+10,floor-70,4,4,'#8bd9cb');}else if(r.type==='control'){rect(x,floor-70,55,56,'#21313e');rect(x+5,floor-65,45,27,'#081c28');rect(x+8,floor-61,28,3,s.color);rect(x+8,floor-54,37,2,'#39778a');rect(x+8,floor-48,17,3,'#2a646a');rect(x+4,floor-30,47,3,'#3a4e5d');for(let a=0;a<4;a++)rect(x+7+a*10,floor-23,5,3,a%2?'#8e7956':'#497f80');}else if(r.type==='barracks'){rect(x,floor-53,65,35,'#27333d');rect(x+4,floor-57,56,8,'#55616b');rect(x+3,floor-20,5,20,'#41505b');rect(x+56,floor-20,5,20,'#41505b');rect(x+43,floor-64,18,7,'#829194');}else{rect(x,floor-57,44,46,'#28343c');rect(x+3,floor-54,38,40,'#39444b');rect(x+20,floor-54,3,40,'#202d38');rect(x+4,floor-35,37,3,'#59616b');text('HDS',x+7,floor-20,'#83938b',8);}}
 text('HELIX // '+s.name,r.x*T+18,r.y*T+60,s.color,10);if(r.type==='control'){text('AUTHORIZED PERSONNEL ONLY',r.x*T+18,r.y*T+77,'#536a7b',7);}
 }
 }
 const tx0=clamp(Math.floor(bounds.x/T)-1,0,W-1),tx1=clamp(Math.ceil((bounds.x+bounds.w)/T)+1,0,W-1),ty0=clamp(Math.floor(bounds.y/T)-1,0,H-1),ty1=clamp(Math.ceil((bounds.y+bounds.h)/T)+1,0,H-1);
 for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){if(!tiles[y*W+x])continue;const above=y>0&&!tiles[(y-1)*W+x],below=y<H-1&&!tiles[(y+1)*W+x],left=x>0&&!tiles[y*W+x-1],right=x<W-1&&!tiles[y*W+x+1],noise=((x*17+y*31)%7);rect(x*T,y*T,T,T,noise<2?'#101c27':'#14212b');if(above||below||left||right){rect(x*T+2,y*T+2,T-4,T-4,'#263a45');rect(x*T+4,y*T+4,T-8,T-8,'#20313c');if(above){rect(x*T,y*T,T,4,'#5c7078');rect(x*T,y*T+4,T,3,'#304653');}if(below)rect(x*T,(y+1)*T-4,T,4,'#48616b');if(left)rect(x*T,y*T,4,T,'#405762');if(right)rect((x+1)*T-4,y*T,4,T,'#405762');rect(x*T+7,y*T+8,3,3,'#536774');rect(x*T+T-10,y*T+T-11,3,3,'#101d28');}else if(noise===0){rect(x*T+4,y*T+8,14,3,'#192a34');rect(x*T+20,y*T+22,7,2,'#0c1721');}}
}
function drawGate(g){if(g.open){if(g.broken){rect(g.x,g.y,g.w,4,'#394c57');rect(g.x,g.y+g.h-4,g.w,4,'#283d49');}return;}rect(g.x,g.y,g.w,g.h,'#283b47');const hor=g.w>g.h;if(hor){for(let x=g.x;x<g.x+g.w;x+=13){rect(x,g.y+4,7,g.h-8,'#10202c');rect(x,g.y+4,4,3,'#c2a169');}}else for(let y=g.y;y<g.y+g.h;y+=13){rect(g.x+4,y,g.w-8,7,'#10202c');rect(g.x+4,y,3,4,'#c2a169');}const cx=g.x+g.w/2,cy=g.y+g.h/2;rect(cx-4,cy-4,8,8,'#e19c6e');if(g.mass)text(g.mass+' LB',g.x+(hor?7:35),g.y+(hor?-9:20),'#e0b985',9);}
function drawControls(){for(const c of controls){const on=flags[c.id]||(c.type==='code'&&(flags.archive||['codeBlue','codeWhite','codeAmber'].indexOf(c.id)<codeStep));rect(c.x-16,c.y-25,32,43,'#273c48');rect(c.x-12,c.y-21,24,18,on?'#185545':'#4f462c');rect(c.x-8,c.y-17,16,10,on?'#7ce2bd':c.id==='codeBlue'?'#709de3':c.id==='codeWhite'?'#d4dbe2':c.id==='codeAmber'?'#e5b966':'#d3ac6e');if(c.type==='valve'){ctx.strokeStyle=on?'#66c3ad':'#c49a72';ctx.lineWidth=4;ctx.beginPath();ctx.arc(c.x,c.y+5,12,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(c.x-9,c.y+5);ctx.lineTo(c.x+9,c.y+5);ctx.moveTo(c.x,c.y-4);ctx.lineTo(c.x,c.y+14);ctx.stroke();}else{rect(c.x-2,c.y+1,4,18,'#17242f');ctx.strokeStyle=on?'#72c9b5':'#cf9d73';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y+17);ctx.lineTo(c.x+(on?9:-9),c.y+2);ctx.stroke();}text(c.label.toUpperCase(),c.x-44,c.y-37,on?'#6da998':'#b3a17e',7);if(c.type==='code')text('BLUE > WHITE > AMBER',c.x-47,c.y+39,'#6d7e9d',7);}
 for(const p of pods){rect(p.x-27,p.y-39,54,76,'#253d4a');rect(p.x-22,p.y-34,44,64,'#0d333f');rect(p.x-17,p.y-28,34,52,'#175060');rect(p.x-13,p.y-23,26,42,'#226e76');rect(p.x-6,p.y-17,12,31,'#5ca9a4');rect(p.x-30,p.y+34,60,7,'#405360');rect(p.x-25,p.y-39,50,3,'#8be2cf');text('REGEN / '+String(p.id+1).padStart(2,'0'),p.x-26,p.y-49,'#80d4c6',8);}
 for(const c of caches){if(taken.has(c.id))continue;const bob=Math.sin(time*2+c.id)*3;rect(c.x-10,c.y-14+bob,20,28,'#34424c');rect(c.x-6,c.y-10+bob,12,20,'#9888c9');rect(c.x-4,c.y-7+bob,4,15,'#c6b3f1');rect(c.x-7,c.y-17+bob,14,4,'#5f7780');if(!options.low){ctx.globalAlpha=.12;ctx.fillStyle='#b99fe9';ctx.beginPath();ctx.arc(c.x,c.y+bob,30,0,TAU);ctx.fill();ctx.globalAlpha=1;}}
}
function drawWalkways(bounds){for(const p of walkways){if(p.x>bounds.x+bounds.w||p.x+p.w<bounds.x||p.y<bounds.y||p.y>bounds.y+bounds.h)continue;rect(p.x,p.y,p.w,5,'#72818a');rect(p.x,p.y+5,p.w,8,'#253842');for(let x=p.x+8;x<p.x+p.w-8;x+=30){rect(x,p.y+2,12,2,'#d6a953');rect(x,p.y+7,2,15,'#3b505c');}ctx.strokeStyle='#253c48';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x+14,p.y+19);ctx.lineTo(p.x+42,p.y+7);ctx.moveTo(p.x+p.w-14,p.y+19);ctx.lineTo(p.x+p.w-42,p.y+7);ctx.stroke();}}
function drawGuard(g){if(!g.alive)return;ctx.save();ctx.translate(Math.round(g.x),Math.round(g.y));if(g.held>=0){ctx.rotate(Math.atan2(g.vy,g.vx)+PI/2);const shrink=1-clamp(g.absorb/.09,0,.9);ctx.scale(shrink,shrink);}else if(g.grounded){ctx.fillStyle='#03091188';ctx.beginPath();ctx.ellipse(0,20,17,3,0,0,TAU);ctx.fill();}
 ctx.scale(g.face,1);const walk=g.stun>0||!g.grounded?0:Math.sin(time*(g.alert>1?10:5)+g.patrol)*Math.min(5,Math.abs(g.vx)*.15),col=g.hit>0?'#ffdfa1':g.elite?'#60717d':'#6d7867';
 rect(-8,3,6,14+walk/2,'#344650');rect(2,3,6,14-walk/2,'#344650');rect(-10,16+walk/2,9,4,'#151e28');rect(1,16-walk/2,9,4,'#151e28');rect(-10,-14,20,20,col);rect(-7,-10,14,14,g.hit>0?'#f8e3b6':'#3b5260');rect(-4,-8,3,3,'#b5baa2');rect(-7,-27,15,15,'#929b92');rect(-10,-29,22,7,g.elite?'#798797':'#566b69');rect(-10,-25,20,5,'#314755');rect(4,-20,7,4,'#5e9cb1');rect(7,-10,17,6,'#2a3944');rect(21,-12,9,4,'#82939a');rect(-12,-11,6,17,col);rect(10,-8,6,10,col);for(let i=0;i<(g.scuffs||0);i++)rect(-6+i*4,-6+i*3,4,1,'#aeb9bc');if(g.alert>1&&g.held<0)text(g.stun>0?'✧':'!',-2,-39,g.stun>0?'#8bdfda':'#e2b183',11);ctx.restore();}
function drawCreature(){const r=radius(),motion=Math.hypot(player.vx,player.vy)/200;for(let i=tentacles.length-1;i>=0;i--){const t=tentacles[i],born=clamp((time-t.born)*1.4,.1,1);for(let j=0;j<t.points.length-1;j++){const a=t.points[j],b=t.points[j+1],w=(13+(r-22)*.17)*(1-j/t.points.length*.75)*born;ctx.strokeStyle='#2d101b';ctx.lineWidth=w+4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=j%3===0?'#b83947':'#922b3b';ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle='#ed7978';ctx.lineWidth=Math.max(1,w*.18);ctx.beginPath();ctx.moveTo(a.x,a.y-2);ctx.lineTo(b.x,b.y-2);ctx.stroke();if(j%3===0)rect(a.x-2,a.y-3,3,2,'#ffb2a0');}}
 ctx.save();ctx.translate(Math.round(player.x),Math.round(player.y));ctx.rotate(clamp(player.vy*.00065,-.18,.18)*Math.sign(player.vx||1)+Math.sin(time*1.7)*.045);ctx.scale(1.12+motion*.12,.87-motion*.045);
 ctx.beginPath();for(let i=0;i<48;i++){const a=i/48*TAU,flow=Math.sin(a*3+time*4)*.095+Math.sin(a*7-time*3.2)*.055+Math.sin(a*11+time*2)*.025,rr=r*(1+flow),x=Math.cos(a)*rr+Math.sin(time*2.5+a*2)*r*.035,y=Math.sin(a)*rr*.86+(Math.max(0,Math.sin(a))*.07*r);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fillStyle=player.invuln>0&&Math.floor(time*15)%2?'#ed827c':'#a92f40';ctx.fill();ctx.strokeStyle='#e7686a';ctx.lineWidth=3;ctx.stroke();
 for(let i=0;i<29;i++){const a=i*2.399+Math.sin(time*1.5+i)*.14,rr=r*Math.sqrt((i+.5)/30)*.78,x=Math.cos(a)*rr+Math.sin(time*3+i)*1.5,y=Math.sin(a)*rr*.79,w=4+(i%4)*1.5;ctx.fillStyle=['#d64b56','#c13c4b','#7c2235','#ee7a77'][i%4];ctx.beginPath();ctx.ellipse(x,y,w,Math.max(2,w*.55),Math.sin(time*2+i)*.3,0,TAU);ctx.fill();}
 ctx.strokeStyle='#ffa697';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-r*.22,-r*.36,r*.28,r*.08,-.3,PI,TAU);ctx.stroke();const ex=player.aimX*r*.36,ey=player.aimY*r*.36;ctx.fillStyle='#c7ead7';ctx.beginPath();ctx.ellipse(ex,ey,6,5,0,0,TAU);ctx.fill();rect(ex-1,ey-2,3,4,'#263843');ctx.restore();
 if(pulse>8.45){ctx.strokeStyle='#74d9c7';ctx.lineWidth=3;ctx.globalAlpha=(pulse-8.45)/.55;ctx.beginPath();ctx.arc(player.x,player.y,(9-pulse)*420+r,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
}
function followCamera(dt=1/60){dt=clamp(dt,0,.05);const smooth=k=>1-Math.exp(-k*dt),desired=clamp(1.13-Math.log2(player.mass/50)*.085,.55,1.13);camera.zoom=lerp(camera.zoom,desired,smooth(3));if(Math.abs(player.vx)>18)camera.facing=Math.sign(player.vx);else if(Math.abs(player.aimX)>.35)camera.facing=Math.sign(player.aimX);camera.look=lerp(camera.look,camera.facing*.15,smooth(2.5));const viewW=canvas.width/camera.zoom,viewH=canvas.height/camera.zoom;camera.x=lerp(camera.x,player.x+camera.look*viewW,smooth(5));const targetY=player.y-viewH*.13,dy=targetY-camera.y,dead=viewH*.065;if(Math.abs(dy)>dead)camera.y+=(dy-Math.sign(dy)*dead)*smooth(6);camera.x=clamp(camera.x,viewW*.5,W*T-viewW*.5);camera.y=clamp(camera.y,viewH*.5,H*T-viewH*.5);}

function drawLights(bounds){if(options.low)return;for(const l of lamps){if(l.x<bounds.x-200||l.x>bounds.x+bounds.w+200||l.y<bounds.y-200||l.y>bounds.y+bounds.h+200)continue;const flicker=Math.sin(time*13+l.flicker*23)>.97?.3:1,gr=ctx.createRadialGradient(l.x,l.y+20,2,l.x,l.y+20,150);gr.addColorStop(0,'rgba(105,165,177,'+(.16*flicker)+')');gr.addColorStop(1,'rgba(30,70,90,0)');ctx.fillStyle=gr;ctx.fillRect(l.x-150,l.y-130,300,300);rect(l.x-19,l.y,38,6,'#789fa7');rect(l.x-15,l.y+2,30,3,'#b2d4d2');}
 for(const g of guards){if(!g.alive||g.held>=0||dist(g,player)>900)continue;ctx.save();ctx.translate(g.x,g.y-8);ctx.scale(g.face,1);const gr=ctx.createLinearGradient(10,0,240,0);gr.addColorStop(0,'rgba(190,207,175,.10)');gr.addColorStop(1,'rgba(170,195,160,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(240,-70);ctx.lineTo(240,70);ctx.closePath();ctx.fill();ctx.restore();}
}
function drawRadar(){const w=136,h=64,x=canvas.width-w-14,y=canvas.height-h-34;ctx.fillStyle='#07111de0';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#28394a';ctx.strokeRect(x,y,w,h);const scale=w/(W*T);ctx.fillStyle='#263b4b';for(const s of sectors)ctx.fillRect(x+s.x*T*scale,y+s.y*T*scale,s.w*T*scale,s.h*T*scale);ctx.fillStyle='#ef7c78';ctx.fillRect(x+player.x*scale-2,y+player.y*scale-2,4,4);text('LEVEL '+(activeSector<3?'−86':'−108'),x+5,y+10,'#658391',6);}
function render(dt=1/60){const vw=canvas.width,vh=canvas.height;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#060b11';ctx.fillRect(0,0,vw,vh);followCamera(dt);if(state==='menu'){camera.x=17*T;camera.y=23*T;camera.zoom=.7;time+=.009;if(!tentacles.length){for(let i=0;i<3;i++){tentacles.push({x:player.x+Math.cos(i*2)*90,y:player.y+Math.sin(i*2)*90,vx:0,vy:0,held:-1,phase:i*2.399,born:-2,points:Array.from({length:12},(_,j)=>({x:player.x+Math.cos(i*2+j*.1)*j*9,y:player.y+Math.sin(i*2+j*.1)*j*9}))});}}}
 const z=camera.zoom,ox=vw/2-camera.x*z+(shake?(rand()-.5)*shake:0),oy=vh/2-camera.y*z+(shake?(rand()-.5)*shake:0);ctx.setTransform(z,0,0,z,Math.round(ox),Math.round(oy));const bounds={x:-ox/z-10,y:-oy/z-10,w:vw/z+20,h:vh/z+20};drawBackground(bounds);drawWalkways(bounds);for(const g of gates)drawGate(g);drawControls();for(const g of guards)if(g.alive&&g.x>bounds.x-40&&g.x<bounds.x+bounds.w+40&&g.y>bounds.y-50&&g.y<bounds.y+bounds.h+50)drawGuard(g);drawCreature();for(const b of bullets){ctx.strokeStyle='#f6dfaf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.018,b.y-b.vy*.018);ctx.stroke();}for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);rect(p.x,p.y,p.size,p.size,p.color);}ctx.globalAlpha=1;drawLights(bounds);ctx.setTransform(1,0,0,1,0,0);
 // Restrained vignetting retains readable geometry and the old-console atmosphere.
 const vignette=ctx.createRadialGradient(vw/2,vh/2,vh*.25,vw/2,vh/2,vw*.75);vignette.addColorStop(0,'rgba(0,4,10,0)');vignette.addColorStop(1,'rgba(0,3,10,.6)');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);if(player.hp<30){ctx.strokeStyle='#b85c8160';ctx.lineWidth=12;ctx.strokeRect(0,0,vw,vh);}if(state==='playing')drawRadar();if(opening>0){ctx.fillStyle='rgba(2,5,10,'+opening+')';ctx.fillRect(0,0,vw,vh);}}
function drawMap(){const c=mx,w=mapCanvas.width,h=mapCanvas.height,sc=Math.min((w-30)/(W*T),(h-30)/(H*T)),ox=(w-W*T*sc)/2,oy=(h-H*T*sc)/2;c.fillStyle='#050d16';c.fillRect(0,0,w,h);c.save();c.translate(ox,oy);c.scale(sc,sc);c.fillStyle='#1d3342';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!tiles[y*W+x])c.fillRect(x*T,y*T,T,T);for(const s of sectors){c.fillStyle=visited.has(s.index)?'#568c91':'#334f65';c.font='bold 64px ui-monospace,monospace';c.fillText((s.index+1)+'. '+s.name,(s.x+2)*T,(s.y+2)*T);}
 for(const g of gates){c.fillStyle=g.open?'#32685c':'#f0848a';c.fillRect(g.x-14,g.y-14,Math.max(g.w,30)+28,Math.max(g.h,30)+28);}for(const c0 of controls){c.fillStyle=flags[c0.id]?'#72d5b7':'#e9ba72';c.fillRect(c0.x-20,c0.y-20,40,40);}for(const p of pods){c.fillStyle='#50c7c3';c.fillRect(p.x-24,p.y-24,48,48);}c.fillStyle='#f47d77';c.beginPath();c.arc(player.x,player.y,48,0,TAU);c.fill();c.strokeStyle='#ffd6b6';c.lineWidth=12;c.beginPath();c.arc(player.x,player.y,75,0,TAU);c.stroke();c.fillStyle='#a8dfbc';c.font='55px ui-monospace,monospace';c.fillText('SURFACE',5*T,3*T);c.restore();}
function frame(now){const delta=Math.min((now-last)/1000,.05)||0;last=now;if(state==='playing'){acc+=delta;let steps=0;while(acc>=1/60&&steps<4){update(1/60);acc-=1/60;steps++;}}else acc=0;render(delta||1/60);requestAnimationFrame(frame);}
try{options={...options,...JSON.parse(storageGet(OPT)||'{}')};}catch{}
$('difficulty').value=options.difficulty;$('low').checked=options.low;$('sound').checked=options.sound;
function optionChange(){options={difficulty:$('difficulty').value,low:$('low').checked,sound:$('sound').checked};try{localStorage.setItem(OPT,JSON.stringify(options));}catch{}resize();}for(const id of['difficulty','low','sound'])$(id).addEventListener('change',optionChange);
$('newBtn').onclick=()=>{if(storageGet(SAVE)){state='newPrompt';$('pauseTitle').textContent='Start a new specimen?';$('pause').classList.remove('hidden');$('resumeBtn').innerHTML='START NEW ESCAPE <span>→</span>';}else start(false);};
$('continueBtn').onclick=()=>start(true);$('howBtn').onclick=showHelp;$('pauseBtn').onclick=pause;$('resumeBtn').onclick=()=>{if(state==='newPrompt')start(false);else pause();};$('helpPause').onclick=showHelp;$('closeHelp').onclick=closeHelp;$('checkpointBtn').onclick=recover;$('menuBtn').onclick=menu;$('mapBtn').onclick=mapToggle;$('closeMap').onclick=mapToggle;$('exploreBtn').onclick=()=>{state='playing';$('win').classList.add('hidden');player.y=11*T;save();};$('winNew').onclick=()=>start(false);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))e.preventDefault();const key=e.key.length===1?e.key.toLowerCase():e.key;if(e.repeat){keys.add(key);return;}if(key==='Escape'||key==='p'){if(state==='help')closeHelp();else if(state==='map')mapToggle();else if(state==='newPrompt')menu();else pause();return;}if(key==='m'){mapToggle();return;}if(state!=='playing')return;if(key==='e'||key==='Enter')interact();if(key==='f')neuralPulse();keys.add(key);});addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{keys.clear();if(state==='playing')pause();});addEventListener('resize',resize);
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);b.classList.add('pressed');});const up=()=>{keys.delete(b.dataset.key);b.classList.remove('pressed');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);}
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('pointerdown',e=>{e.preventDefault();b.dataset.action==='interact'?interact():neuralPulse();});
if(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)$('touch').classList.remove('hidden');
$('continueBtn').classList.toggle('hidden',!storageGet(SAVE));resize();last=performance.now();requestAnimationFrame(frame);
// A bounded QA surface for state inspection and deterministic validation; unused by gameplay.
window.__gameTest={get state(){return{mode:state,player:{...player},camera:{...camera},tentacles:limbCount(player.mass),flags:{...flags},codeStep,visited:[...visited],guardsAlive:guards.filter(g=>g.alive).length,captures,slams,checkpoint:checkpoint?{x:checkpoint.x,y:checkpoint.y,mass:checkpoint.mass}:null,gates:gates.map(g=>({id:g.id,open:g.open,mass:g.mass,requires:g.requires})),objective:objectives(),elapsed};},growth:limbCount,nextGrowth,world:{width:W,height:H,tile:T,tiles,sectors,controls,pods,gates,guards,caches,walkways},start:()=>start(false),resume:()=>{state='playing';hideScreens();$('hud').classList.remove('hidden');},step:(n=1)=>{for(let i=0;i<n;i++)update(1/60);updateHud();},keys,interact,pulse:neuralPulse,setPlayer:v=>{Object.assign(player,v);updateGates(false);camera.x=player.x;camera.y=player.y;},setFlags:v=>{Object.assign(flags,v);updateGates(false);},gainMass,save,load:()=>{const s=JSON.parse(storageGet(SAVE));try{loadSnapshot(s.current);}catch{loadSnapshot(s.checkpoint);}checkpoint=validCheckpoint(s.checkpoint);},recover,snapshot,blocked,los,render,drawMap,followCamera,supported};
})();

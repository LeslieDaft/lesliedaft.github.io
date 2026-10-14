'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
const W=1200,H=560,FLOOR=470,G=1000,COLORS=['#58c5ff','#ff985d'],DARK=['#16669d','#b64526'],keys=new Set();
let players=[],receivers=[],ball,score=[0,0],mode='two',phase='menu',resumePhase='live',timer=0,last=0,accum=0,elapsed=0,particles=[],notice='',noticeTime=0,sound=false,audio,serve=0,aiTimer=0;
function entity(x,team,receiver=false){return{x,y:0,vx:0,vy:0,team,receiver,face:(team===0?1:-1)*(receiver?-1:1),cool:0,reach:0,protect:0,anim:0};}
function setup(owner=0){players=[entity(420,0),entity(780,1)];receivers=[entity(1100,0,true),entity(100,1,true)];ball={state:'held',owner,x:players[owner].x,y:55,vx:0,vy:0,team:owner,age:0,spin:0,trail:[]};players[owner].protect=.7;aiTimer=.8;updateHUD();}
function updateHUD(){ $('s0').textContent=score[0];$('s1').textContent=score[1];$('status').textContent=phase==='menu'?'Ready for kickoff':phase==='paused'?'Paused':phase==='over'?'Final score':noticeTime>0?notice:'Find your receiver';$('possession').textContent=ball.state==='held'?(ball.owner===0?'BLUE':'ORANGE')+' BALL':ball.state==='flight'?'PASS IN THE AIR':'NEXT POSSESSION';}
function start(m){if(!['solo','two'].includes(m))throw Error('Choose solo or two');mode=m;score=[0,0];serve=0;phase='live';notice='Kickoff! Blue ball';noticeTime=1.7;particles=[];setup(0);$('overlay').classList.add('hidden');$('pause').textContent='Pause · Esc';clearInput();syncTouch();tone(440,.12);}
function tone(f,t=.09){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+t);o.start();o.stop(audio.currentTime+t);}catch{}}
function flash(s,t=1.4){notice=s;noticeTime=t;updateHUD();}
function jump(p){if(p.y<.1){p.vy=p.receiver?490:540;p.anim=.25;tone(230,.06);}}
function take(team,label){ball.state='held';ball.owner=team;ball.team=team;ball.trail=[];players[team].protect=.65;players[team].cool=Math.max(players[team].cool,.2);if(label){flash(label);tone(310,.14);}updateHUD();}
function steal(p){if(p.cool>0)return;p.cool=.75;p.reach=.23;const other=players[1-p.team];if(ball.state==='held'&&ball.owner!==p.team&&other.protect<=0&&Math.abs(p.x-other.x)<74&&Math.abs(p.y-other.y)<63){take(p.team,(p.team===0?'Blue':'Orange')+' steals it!');burst(p.x,FLOOR-p.y-48,COLORS[p.team],12);}else tone(130,.04);}
function throwBall(p,lob){
if(ball.state!=='held'||ball.owner!==p.team||p.cool>0)return;
const r=receivers[p.team],distance=Math.abs(r.x-p.x);
// Both passes use the same flight time and curvature above the release-to-target line.
const flight=.67+distance/1800,moving=Math.abs(p.vx)>20;
const scatter=(Math.random()+Math.random()-1)*120+(moving?(Math.random()-.5)*90:0);
const vertical=(Math.random()+Math.random()-1)*(moving?85:60);
const sy=p.y+57,tx=r.x+scatter,ty=(lob?490*490/(2*G)+78:48)+vertical;
p.face=Math.sign(tx-p.x);
ball={state:'flight',owner:null,x:p.x+p.face*27,y:sy,vx:(tx-(p.x+p.face*27))/flight,vy:(ty-sy+.5*G*flight*flight)/flight,team:p.team,jumpBall:lob,receiverJumped:false,targetX:tx,age:0,spin:0,trail:[]};
const catchX=Math.max(p.team===0?1053:42,Math.min(p.team===0?1158:147,tx));
ball.receiverJumpAt=Math.max(0,(catchX-ball.x)/ball.vx-490/G);
p.anim=.3;p.cool=.3;flash(lob?'Jump ball!':'Pass away',.65);tone(lob?590:420,.09);
}
function incomplete(){ball.state='dead';phase='between';timer=1.1;serve=1-ball.team;flash('Incomplete · turnover',1.1);tone(120,.16);}
function touchdown(team){score[team]++;ball.state='dead';phase='between';timer=2;serve=1-team;flash((team===0?'Blue':'Orange')+' touchdown!',2);burst(receivers[team].x,FLOOR-receivers[team].y-60,COLORS[team],65);tone(660,.2);if(score[team]>=5){phase='over';$('overlayTitle').textContent=(team===0?'BLUE':'ORANGE')+' WINS!';$('overlayText').textContent=score[0]+' – '+score[1]+' · Run it back?';$('overlay').classList.remove('hidden');syncTouch();}updateHUD();}
function pause(){if(phase==='menu'||phase==='over')return;if(phase==='paused'){phase=resumePhase;$('overlay').classList.add('hidden');$('pause').textContent='Pause · Esc';}else{resumePhase=phase;phase='paused';$('pause').textContent='Resume · Esc';}clearInput();syncTouch();updateHUD();}
function action(code){if(code==='Escape'){pause();return;}if(phase!=='live')return;const p=players[0],q=players[1];if(code==='KeyW')jump(p);if(code==='KeyQ')throwBall(p,false);if(code==='KeyE')throwBall(p,true);if(code==='KeyS')steal(p);if(mode==='two'){if(code==='ArrowUp')jump(q);if(code==='KeyK')throwBall(q,false);if(code==='KeyL')throwBall(q,true);if(code==='ArrowDown')steal(q);}}
const gameKeys=['KeyA','KeyD','KeyW','KeyQ','KeyE','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyK','KeyL','Escape'];
const keyboardKeys=new Set(),touchPointers=new Map();
function clearInput(){keys.clear();keyboardKeys.clear();touchPointers.clear();for(const b of document.querySelectorAll('[data-key]')){b.classList.remove('pressed');b.setAttribute('aria-pressed','false');}}
window.addEventListener('keydown',e=>{if(gameKeys.includes(e.code)){e.preventDefault();if(!e.repeat)action(e.code);keyboardKeys.add(e.code);keys.add(e.code);}});
window.addEventListener('keyup',e=>{keyboardKeys.delete(e.code);if(![...touchPointers.values()].some(v=>v.code===e.code))keys.delete(e.code);});
window.addEventListener('blur',()=>{clearInput();if(phase==='live'||phase==='between')pause();});
window.addEventListener('orientationchange',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(phase==='live'||phase==='between')pause();}});
for(const b of document.querySelectorAll('[data-key]')){
 b.setAttribute('aria-pressed','false');
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(phase!=='live')return;try{b.setPointerCapture(e.pointerId);}catch{}touchPointers.set(e.pointerId,{code:b.dataset.key,button:b});keys.add(b.dataset.key);b.classList.add('pressed');b.setAttribute('aria-pressed','true');action(b.dataset.key);});
 const release=e=>{const held=touchPointers.get(e.pointerId);if(!held)return;touchPointers.delete(e.pointerId);if(![...touchPointers.values()].some(v=>v.code===held.code)){if(!keyboardKeys.has(held.code))keys.delete(held.code);held.button.classList.remove('pressed');held.button.setAttribute('aria-pressed','false');}};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,release);
 b.addEventListener('click',e=>{if(e.detail===0)action(b.dataset.key);});
}
let touchVisible=true;
function syncTouch(){if(!window.DaftTouch?.available)return;$('touchControls').hidden=!touchVisible;$('touchNewMatch').hidden=phase!=='paused';$('touchControls').querySelector('[data-team="1"]').hidden=mode!=='two';document.body.classList.toggle('football-touch-live',phase!=='menu'&&phase!=='over');}
if(window.DaftTouch?.available){document.body.classList.add('football-touch');$('two').querySelector('span').textContent='Shared touch screen';const touchHUD=window.DaftTouch.create({id:'endzone-duel-touch',title:'Football controls',onVisibilityChange:visible=>{touchVisible=visible;if(!visible)clearInput();syncTouch();}});touchHUD.element?.querySelector('.dt-toolbar')?.append($('pause'));syncTouch();}
$('two').onclick=()=>start('two');$('solo').onclick=()=>start('solo');$('pause').onclick=pause;$('restart').onclick=()=>{phase='menu';clearInput();syncTouch();$('overlayTitle').textContent='GO LONG.';$('overlayText').innerHTML='Your receiver is across the field.<br>Get a pass through. Keep theirs out.';$('overlay').classList.remove('hidden');updateHUD();};$('touchNewMatch').onclick=()=>$('restart').onclick();$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));tone(440);};
// Find a reachable point on the actual pass, including the time needed to jump.
function catchPlan(p,speed,lo,hi){
const impulse=p.receiver?490:540;
for(let t=.04;t<1.9;t+=.02){
const x=ball.x+ball.vx*t,y=ball.y+ball.vy*t-.5*G*t*t;
if(y<15)break;
if(x<lo-20||x>hi+20||Math.abs(x-p.x)>speed*t+20)continue;
const target=Math.max(lo,Math.min(hi,x));
if(p.y>0){const py=Math.max(0,p.y+p.vy*t-.5*G*t*t);if(y>py+23&&y<py+84)return{x:target,t,jump:false};continue;}
if(y>=23&&y<=76)return{x:target,t,jump:false};
const rise=y-70,disc=impulse*impulse-2*G*rise;
if(rise>0&&disc>=0){const airtime=(impulse-Math.sqrt(disc))/G;if(t>=airtime-.025)return{x:target,t,jump:t<=airtime+.035};}
}
return null;
}
function cpu(dt){
const p=players[1],q=players[0];aiTimer-=dt;let target=p.x;
if(ball.state==='held'&&ball.owner===1){
// Create space to throw instead of driving into the defender.
target=q.x<p.x?Math.min(1000,q.x+185):Math.max(250,q.x-185);
if(Math.abs(p.x-q.x)<95&&p.y===0)jump(p);
if(aiTimer<=0){throwBall(p,Math.random()<.5);aiTimer=.8+Math.random()*.8;}
}else if(ball.state==='held'){
// Sit in the passing lane, mixing in short pressure windows.
const pressure=Math.sin(elapsed*1.7)>.88;
target=Math.min(990,q.x+(pressure?48:190));
if(Math.abs(p.x-q.x)<70)steal(p);
}else if(ball.state==='flight'){
const plan=catchPlan(p,255,155,1045);
if(plan){target=plan.x;if(plan.jump)jump(p);if(plan.t<.2)p.reach=.15;}
else target=Math.max(155,Math.min(1045,ball.x+ball.vx*.4));
}
p.vx=Math.abs(target-p.x)>7?Math.sign(target-p.x)*255:0;
}
function receiverAI(r,dt){
r.vx=0;if(ball.state!=='flight')return;
const lo=r.team===0?1053:42,hi=r.team===0?1158:147;
// A jump-ball command commits the intended receiver to one timed leap,
// including inaccurate passes that end up outside catching range.
if(ball.jumpBall&&ball.team===r.team){
const target=Math.max(lo,Math.min(hi,ball.targetX));
if(Math.abs(target-r.x)>4)r.vx=Math.sign(target-r.x)*140;
if(!ball.receiverJumped&&ball.age>=ball.receiverJumpAt&&r.y===0){jump(r);ball.receiverJumped=true;}
if(r.y>0||ball.receiverJumped)r.reach=.15;
return;
}
const plan=catchPlan(r,140,lo,hi);
if(plan){if(Math.abs(plan.x-r.x)>4)r.vx=Math.sign(plan.x-r.x)*140;if(plan.jump)jump(r);r.reach=plan.t<.22?.15:0;}
else{const t=Math.max(0,(ball.vy+Math.sqrt(ball.vy*ball.vy+2*G*Math.max(0,ball.y-60)))/G),target=Math.max(lo,Math.min(hi,ball.x+ball.vx*t));if(Math.abs(target-r.x)>5)r.vx=Math.sign(target-r.x)*140;}
}
function physics(p,dt){p.x+=p.vx*dt;p.x=Math.max(p.receiver?(p.team===0?1053:42):155,Math.min(p.receiver?(p.team===0?1158:147):1045,p.x));p.y+=p.vy*dt;p.vy-=G*dt;if(p.y<=0){p.y=0;p.vy=0;}p.cool=Math.max(0,p.cool-dt);p.protect=Math.max(0,p.protect-dt);p.reach=Math.max(0,p.reach-dt);p.anim=Math.max(0,p.anim-dt);if(p.receiver)p.face=p.team===0?-1:1;else if(p.vx)p.face=Math.sign(p.vx);}
function update(dt){if(phase==='paused'||phase==='menu'||phase==='over')return;elapsed+=dt;noticeTime=Math.max(0,noticeTime-dt);for(const a of particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=500*dt;a.life-=dt;}particles=particles.filter(p=>p.life>0);if(phase==='between'){timer-=dt;if(timer<=0){phase='live';setup(serve);flash((serve===0?'Blue':'Orange')+' ball',1);}updateHUD();return;}
players[0].vx=((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0))*270;if(mode==='two')players[1].vx=((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*270;else cpu(dt);
for(const r of receivers)receiverAI(r,dt);for(const p of [...players,...receivers])physics(p,dt);
if(ball.state==='held'){const p=players[ball.owner];ball.x=p.x+p.face*24;ball.y=p.y+48;}
if(ball.state==='flight'){ball.age+=dt;ball.vy-=G*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.spin+=dt*16;ball.trail.unshift({x:ball.x,y:ball.y});if(ball.trail.length>16)ball.trail.pop();
// Defender gets first chance at every contested catch; release grace is thrower-only.
for(const p of [players[1-ball.team],players[ball.team]]){if(p.team===ball.team&&ball.age<.4)continue;if(Math.abs(ball.x-p.x)<28&&ball.y>p.y+15&&ball.y<p.y+88){const intercepted=p.team!==ball.team;take(p.team,intercepted?'INTERCEPTION! '+(p.team===0?'Blue':'Orange')+' ball':'Caught the rebound!');burst(p.x,FLOOR-p.y-55,COLORS[p.team],16);break;}}
if(ball.state==='flight')for(const r of receivers){if((!ball.jumpBall||ball.team!==r.team||ball.receiverJumped&&r.y>0)&&Math.abs(ball.x-r.x)<31&&ball.y>r.y+18&&ball.y<r.y+(r.reach>0?98:83)){if(r.team===ball.team)touchdown(r.team);else{take(r.team,'End-zone interception!');}break;}}
if(ball.state==='flight'&&(ball.y<9||ball.x<15||ball.x>1185||ball.age>5))incomplete();}updateHUD();}
function burst(x,y,c,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*380,vy:-Math.random()*310-70,life:.5+Math.random(),c});}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}function line(x,y,a,b,c,width=1){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}function text(s,x,y,size,c,align='center',font='Barlow, system-ui'){ctx.font=`800 ${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=c;ctx.fillText(s,x,y);}
function drawField(){let grad=ctx.createLinearGradient(0,0,0,400);grad.addColorStop(0,'#0b182b');grad.addColorStop(1,'#315066');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);ellipse(920,65,27,27,'#b8d3d631');
// Geometric stadium seating forms part of the field environment.
for(let row=0;row<6;row++){rect(0,198+row*20,W,16,row%2?'#203448':'#192e42');for(let i=0;i<83;i++){const v=(i*17+row*13)%11;rect(i*15+(row%2)*5,201+row*20,4,5,['#718595','#42647d','#be8269','#9cac86'][v%4]);}}
rect(0,324,W,29,'#0c1b29');text('ENDZONE DUEL',600,344,15,'#94acb9');for(const x of [70,1130]){rect(x-3,68,6,250,'#526776');rect(x-53,60,106,21,'#bacbd2');for(let i=0;i<8;i++){rect(x-47+i*13,64,8,12,'#fff7d5');}const g=ctx.createRadialGradient(x,84,3,x,84,200);g.addColorStop(0,'#e5f9ff19');g.addColorStop(1,'#e5f9ff00');ctx.fillStyle=g;ctx.fillRect(x-200,0,400,280);}
rect(0,354,W,206,'#25665b');for(let i=0;i<12;i++)rect(i*100,354,50,206,'#2a7060');rect(0,354,155,206,'#884b39');rect(1045,354,155,206,'#1e6785');for(let x=160;x<1045;x+=88.5){line(x,365,x,548,'#cee7c046',2);for(let y=382;y<455;y+=20)line(x-5,y,x+5,y,'#d5edd77a',2);}line(155,354,155,560,'#ecf1df',4);line(1045,354,1045,560,'#ecf1df',4);line(0,FLOOR+3,W,FLOOR+3,'#d7eace',3);line(0,551,W,551,'#d7eace66',2);
for(let i=1;i<10;i++)text(String(i<=5?i*10:(10-i)*10),155+i*89,535,26,'#d1e6d057');ctx.save();ctx.translate(75,518);ctx.rotate(-Math.PI/2);text('ORANGE',0,0,25,'#ffdfc57a');ctx.restore();ctx.save();ctx.translate(1128,518);ctx.rotate(-Math.PI/2);text('BLUE',0,0,25,'#c6eeff80');ctx.restore();
}
function drawPlayer(p){const x=p.x,y=FLOOR-p.y,t=elapsed*12,walk=p.y>0?-.5:p.vx?Math.sin(t):0,c=COLORS[p.team],dark=DARK[p.team];ellipse(x,FLOOR+7,25-p.y*.03,6,'#061a2580');ctx.save();ctx.translate(x,y);ctx.scale(p.face,1);ctx.lineCap='round';line(-9,-21,-13-walk*9,-3,'#d9e5e9',11);line(8,-21,12+walk*9,-3,'#d9e5e9',11);line(-13-walk*9,-3,-5-walk*9,-3,'#13202a',7);line(12+walk*9,-3,20+walk*9,-3,'#13202a',7);ctx.fillStyle=dark;ctx.beginPath();ctx.roundRect(-19,-56,38,36,9);ctx.fill();rect(-17,-29,34,6,c);text(p.receiver?'88':p.team===0?'1':'2',0,-32,20,'white');const high=p.reach>0||p.y>0&&ball.state==='flight',armY=high?-88:p.anim>0?-73:-40;line(-14,-51,-24,high?-75:-35,c,10);line(14,-51,29,armY,c,10);ellipse(29,armY,5,5,'#e7bd99');ellipse(-24,high?-75:-35,5,5,'#e7bd99');ellipse(0,-72,21,21,c);rect(-18,-78,32,5,dark);rect(6,-75,17,12,'#152736');line(16,-61,27,-62,'#d7e5e9',3);line(27,-62,27,-74,'#d7e5e9',3);line(15,-68,29,-68,'#d7e5e9',2);ctx.restore();
if(p.receiver){text('RECEIVER',x,y-106,11,c);}else{const selected=ball.state==='held'&&ball.owner===p.team;text(mode==='solo'&&p.team===1?'CPU':'P'+(p.team+1),x,y-107,13,c);if(selected){ctx.fillStyle='#dfef7e';ctx.beginPath();ctx.moveTo(x-6,y-126);ctx.lineTo(x+6,y-126);ctx.lineTo(x,y-119);ctx.fill();}if(p.cool>0){rect(x-18,y+14,36,3,'#101e29');rect(x-18,y+14,36*(1-Math.min(1,p.cool/.75)),3,c);}if(p.reach>0){ctx.strokeStyle=c+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-46,53,-1,1);ctx.stroke();}}
}
function render(){ctx.clearRect(0,0,W,H);drawField();if(ball.state==='flight'){ball.trail.forEach((p,i)=>ellipse(p.x,FLOOR-p.y,Math.max(1,5-i*.3),Math.max(1,5-i*.3),COLORS[ball.team]+Math.round((1-i/16)*90).toString(16).padStart(2,'0')));}for(const r of receivers)drawPlayer(r);for(const p of players)drawPlayer(p);if(ball.state!=='dead'){ctx.save();ctx.translate(ball.x,FLOOR-ball.y);// The long axis follows velocity; rotating seams show roll around that axis.
ctx.rotate(ball.state==='flight'?Math.atan2(-ball.vy,ball.vx):-.4);
ellipse(0,0,14,7,'#b7753e');ellipse(0,-1,11,4,'#d49354');
line(-8,-4,-8,4,'#f7e5ce',2);line(8,-4,8,4,'#f7e5ce',2);
const roll=ball.state==='flight'?ball.spin:0;
for(let seam=0;seam<2;seam++){const angle=roll+seam*Math.PI;if(Math.cos(angle)>0){const yy=Math.sin(angle)*5;line(-6,yy,6,yy,'#613c27',1);}}
if(Math.cos(roll)>0){const yy=Math.sin(roll)*5,scale=Math.max(.2,Math.cos(roll));line(-5,yy,5,yy,'#fff4e5',1.5);for(let x=-3;x<=3;x+=3)line(x,yy-2*scale,x,yy+2*scale,'#fff4e5',1);}
ctx.restore();}for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,5,5,p.c);}ctx.globalAlpha=1;if(phase==='between'){text(notice,600,150,45,'#e6f490','center','Barlow Condensed, Impact');}if(phase==='paused'){rect(0,0,W,H,'#081321aa');text('PAUSED',600,245,64,'#e9f3f8','center','Barlow Condensed, Impact');text('Press Esc or Resume to continue',600,284,18,'#b3c7d5');}}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;accum+=dt;while(accum>=1/120){update(1/120);accum-=1/120;}render();requestAnimationFrame(frame);}setup();requestAnimationFrame(frame);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'get_match_state',description:'Read the current Endzone Duel score, mode, phase and possession.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode,phase,score:[...score],possession:ball.owner})})).catch(()=>{});}catch{}}

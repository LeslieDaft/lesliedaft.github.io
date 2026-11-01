/* Rooftop Rush: fixed-step movement, course data and deterministic collision. */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.ParkourEngine = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
const box=(p)=>({x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h});
const overlaps=(a,b)=>a.x < b.x+b.w-.01 && a.x+a.w > b.x+.01 && a.y < b.y+b.h-.01 && a.y+a.h > b.y+.01;
function course(name,subtitle,width,palette,gold,silver){return {name,subtitle,width,palette,gold,silver,start:{x:100,y:600},finish:{x:width-140,y:600},platforms:[],hazards:[],checkpoints:[],tokens:[],hints:[]};}
function roof(l,x,w,y=600,extra={}){l.platforms.push({x,y,w,h:1000,type:'roof',...extra});}
function slab(l,x,y,w,extra={}){l.platforms.push({x,y,w,h:20,type:'slab',...extra});}
function spikes(l,x,y,w=65){l.hazards.push({type:'spikes',x,y:y-17,w,h:17});}
function saw(l,x,y,r=21,move){l.hazards.push({type:'saw',x:x-r,y:y-r,w:r*2,h:r*2,r,move});}
function bar(l,x,y,w=105){l.platforms.push({x,y:y-86,w,h:54,type:'bar'});}
function cp(l,x,y){l.checkpoints.push({x,y,label:'CHECKPOINT '+(l.checkpoints.length+1)});}
function token(l,x,y){l.tokens.push({x,y,r:8});}
function hint(l,x,w,text){l.hints.push({x,w,text});}
const levels=[];
let l=course('FIRST LIGHT','Find your rhythm.',3240,'dawn',12,19);
roof(l,0,560);roof(l,700,620);roof(l,1470,540,560);roof(l,2160,420);roof(l,2730,510);
spikes(l,920,600,70);bar(l,1100,600,105);roof(l,1770,65,520,{type:'hurdle'});spikes(l,2350,600,65);cp(l,1535,560);cp(l,2790,600);token(l,633,490);token(l,1394,480);token(l,2078,464);token(l,2652,490);hint(l,0,650,'A / D or ← / → to run · SPACE, W or ↑ to jump');hint(l,730,300,'Jump over spikes. Release jump early for a shorter hop.');hint(l,1040,330,'Hold S or ↓ to slide under the orange beam.');hint(l,1510,510,'Jump near a ledge to grab it · jump again to climb.');hint(l,2150,1090,'Keep your speed. Yellow flags save your checkpoint.');levels.push(l);
l=course('STEEL & CONCRETE','Keep low. Keep moving.',3820,'sunset',15,23);
roof(l,0,440);roof(l,580,650);roof(l,1380,430,560);roof(l,1950,350,560);roof(l,2440,450);roof(l,3040,300,560);roof(l,3480,340);
bar(l,730,600,110);bar(l,1010,600,105);spikes(l,1470,560,70);roof(l,2060,70,515,{type:'hurdle'});roof(l,2180,60,510,{type:'hurdle'});spikes(l,2590,600,95);bar(l,3170,560,90);cp(l,1430,560);cp(l,3100,560);token(l,507,490);token(l,1300,475);token(l,2370,480);token(l,2965,470);token(l,3410,460);hint(l,0,650,'Stay low through construction. Slide retains your momentum.');hint(l,650,570,'Hold ↓ through both beams. Your runner stands when there is room.');hint(l,1940,400,'Short hurdles are perfect for quick vaulting jumps.');levels.push(l);
l=course('HIGHER GROUND','A different way up.',3570,'night',18,27);
roof(l,0,420);roof(l,550,350,540);roof(l,1030,350,480);roof(l,1510,310,420);roof(l,1940,330,480);roof(l,2410,420,540);roof(l,2970,600);
l.finish.y=600;slab(l,1150,390,135,{type:'shortcut'});roof(l,1660,75,350,{type:'hurdle'});bar(l,2540,540,100);cp(l,1090,480);cp(l,2470,540);token(l,484,430);token(l,963,375);token(l,1440,320);token(l,1875,300);token(l,2890,420);hint(l,0,900,'Climb the skyline. Wall contact slows your fall. Jump to push off.');hint(l,960,500,'Catch an edge while falling. Press jump to climb; ↓ lets go.');hint(l,1500,400,'Vault the raised block. Your momentum carries through the climb.');levels.push(l);
l=course('CROSSWINDS','Trust the moving skyline.',3890,'rain',18,28);
roof(l,0,410);slab(l,555,590,170,{move:{axis:'x',amp:28,period:4,phase:0}});slab(l,845,550,170,{move:{axis:'y',amp:24,period:4.5,phase:1}});roof(l,1150,500,560);slab(l,1790,555,165,{move:{axis:'x',amp:32,period:4.6,phase:2}});slab(l,2070,520,165,{move:{axis:'y',amp:28,period:5,phase:0}});roof(l,2360,420,540);slab(l,2910,545,170,{move:{axis:'x',amp:25,period:4,phase:1.5}});slab(l,3200,570,170,{move:{axis:'y',amp:20,period:3.5,phase:2}});roof(l,3500,390);
bar(l,1320,560,120);spikes(l,2540,540,80);cp(l,1200,560);cp(l,2410,540);token(l,1050,420);token(l,2250,390);token(l,3390,440);hint(l,0,1140,'Moving platforms carry you. Time the gaps and keep your feet light.');hint(l,1150,500,'A solid roof. A clean checkpoint. Take a breath.');hint(l,1660,700,'Land near the middle, then carry your speed into the next jump.');levels.push(l);
l=course('NO LOOKING BACK','The roof is giving way.',3840,'dusk',20,30);
roof(l,0,430);slab(l,560,570,230,{type:'crumble'});slab(l,930,540,230,{type:'crumble'});roof(l,1300,350,510);slab(l,1790,520,240,{type:'crumble'});slab(l,2170,550,240,{type:'crumble'});roof(l,2550,380,570);slab(l,3070,570,230,{type:'crumble'});roof(l,3440,400);
saw(l,2810,510,23,{axis:'x',amp:40,period:3.2,phase:1});spikes(l,1440,510,60);bar(l,2660,570,90);cp(l,1340,510);cp(l,2590,570);token(l,850,405);token(l,1720,380);token(l,2090,405);token(l,2980,430);token(l,3360,450);hint(l,0,1150,'Cracked platforms collapse after a moment. Keep moving.');hint(l,1290,400,'Solid checkpoint roofs remain safe. Broken platforms reset after a fall.');hint(l,1780,650,'Jump past the saws. Their paths are visible.');levels.push(l);
l=course('THE LAST ROOFTOP','Everything you learned. One clean run.',4640,'midnight',26,39);
roof(l,0,410);roof(l,550,360,550);roof(l,1050,460,510);slab(l,1650,500,170,{move:{axis:'y',amp:23,period:4,phase:0}});roof(l,1960,370,460);slab(l,2470,460,220,{type:'crumble'});slab(l,2825,500,210,{type:'crumble'});roof(l,3175,440,540);roof(l,3755,300,570);roof(l,4195,445);
spikes(l,675,550,65);bar(l,1170,510,120);roof(l,2100,70,390,{type:'hurdle'});saw(l,3550,485,20,{axis:'x',amp:25,period:3.6,phase:1});spikes(l,3370,540,75);bar(l,3860,570,100);cp(l,1100,510);cp(l,2010,460);cp(l,3240,540);token(l,480,440);token(l,975,395);token(l,1570,370);token(l,1880,335);token(l,2395,320);token(l,2755,350);token(l,3105,380);token(l,4125,440);hint(l,0,1510,'The final route. Keep your flow through jumps, slides and ledges.');hint(l,1960,400,'Jump at the block, catch its edge, then climb to carry on.');hint(l,2470,650,'Commit to the next platform. These roofs will not wait.');levels.push(l);
const expansion=typeof module==='object'&&module.exports?require('./level-pack.js'):globalThis.RooftopLevelPack;
if(!Array.isArray(expansion)||expansion.length!==94)throw new Error('Rooftop Rush level pack did not load.');
levels.push(...expansion);
levels.forEach((v,i)=>{v.id=i;v.platforms.forEach((p,j)=>{p.id=j;p.baseX=p.x;p.baseY=p.y;p.active=true;p.crack=-1;});v.hazards.forEach(h=>{h.baseX=h.x;h.baseY=h.y;});});
function clone(v){return JSON.parse(JSON.stringify(v));}
class World {
 constructor(index=0,onEvent=()=>{}) {this.onEvent=onEvent;this.load(index);}
 load(index){this.level=clone(levels[clamp(index,0,levels.length-1)]);this.index=this.level.id;this.time=0;this.deaths=0;this.flow=0;this.collected=new Set();this.checkpoint=0;this.saved={...this.level.start};this.finished=false;this.dying=0;this.previousJump=false;this.record=[];this.nextRecord=0;this.spawn();}
 spawn(){this.p={x:this.saved.x,y:this.saved.y,vx:0,vy:0,w:18,h:48,grounded:false,groundId:-1,wall:0,coyote:0,buffer:0,face:1,phase:0,land:0,hang:null,climb:null,jumpLock:0,slide:false,air:0,state:'idle'};this.level.platforms.forEach(p=>{p.active=true;p.crack=-1;});this.previousJump=false;this.dying=0;}
 emit(type,data={}){this.onEvent(type,data);}
 die(){if(this.dying||this.finished)return;this.deaths++;this.dying=.45;this.p.state='dead';this.emit('death');}
 activePlatforms(){return this.level.platforms.filter(p=>p.active);}
 update(dt,input={}){
  if(this.finished)return;
  this.time+=dt;const p=this.p;const jump=!!input.jump,pressed=!!input.jumpPressed||(jump&&!this.previousJump);this.previousJump=jump;
  for(const platform of this.level.platforms){platform.dx=0;platform.dy=0;if(platform.move){const m=platform.move;const v=Math.sin(this.time/m.period*Math.PI*2+(m.phase||0))*m.amp;const nx=platform.baseX+(m.axis==='x'?v:0),ny=platform.baseY+(m.axis==='y'?v:0);platform.dx=nx-platform.x;platform.dy=ny-platform.y;platform.x=nx;platform.y=ny;}if(platform.crack>=0){platform.crack+=dt;if(platform.crack>.85)platform.active=false;}}
  for(const hazard of this.level.hazards){if(hazard.move){const m=hazard.move;const v=Math.sin(this.time/m.period*Math.PI*2+(m.phase||0))*m.amp;hazard.x=hazard.baseX+(m.axis==='x'?v:0);hazard.y=hazard.baseY+(m.axis==='y'?v:0);}}
  if(this.dying){this.dying-=dt;if(this.dying<=0){this.spawn();this.emit('respawn');}this.capture();return;}
  p.land=Math.max(0,p.land-dt*5);p.jumpLock=Math.max(0,p.jumpLock-dt);p.buffer=pressed?.13:Math.max(0,p.buffer-dt);
  const move=(input.right?1:0)-(input.left?1:0);
  if(p.climb){const c=p.climb;c.t+=dt;const q=clamp(c.t/.27,0,1),s=q*q*(3-2*q);p.x=c.fromX+(c.toX-c.fromX)*s;p.y=c.fromY+(c.toY-c.fromY)*s-Math.sin(q*Math.PI)*14;p.state='climb';if(q===1){p.climb=null;p.vx=c.vx;p.vy=0;p.grounded=true;p.coyote=.1;p.buffer=0;this.emit('vault');}this.capture();return;}
  if(p.hang){p.state='hang';const h=p.hang;p.x=h.x;p.y=h.y;p.vx=0;p.vy=0;if(input.down){p.hang=null;p.x-=p.face*5;p.vy=100;p.jumpLock=.2;}else if(pressed||(move===p.face&&h.age>.12)){p.climb={fromX:p.x,fromY:p.y,toX:h.topX+p.face*24,toY:h.topY,t:0,vx:p.face*250};p.hang=null;p.buffer=0;}else h.age+=dt;this.capture();return;}
  const ground=this.level.platforms[p.groundId];if(p.grounded&&ground&&ground.active){p.x+=ground.dx||0;p.y+=ground.dy||0;}else if(p.grounded){p.grounded=false;}
  const wasGrounded=p.grounded,oldWall=p.wall;
  p.coyote=wasGrounded?.1:Math.max(0,p.coyote-dt);
  const solids=this.activePlatforms();const canStand=!solids.some(s=>overlaps({x:p.x-9,y:p.y-48,w:18,h:47},s));let targetH=input.down&&wasGrounded?27:48;
  if(targetH>p.h&&!canStand)targetH=27;
  p.h=targetH;p.slide=p.h<40;
  if(p.buffer>0&&p.coyote>0&&canStand){p.vy=-650;p.grounded=false;p.coyote=0;p.buffer=0;p.slide=false;p.h=48;p.air=0;this.emit('jump');}
  else if(p.buffer>0&&oldWall&&p.jumpLock<=0){p.vy=-605;p.vx=-oldWall*360;p.face=-oldWall;p.buffer=0;p.jumpLock=.17;p.wall=0;this.emit('walljump');}
  if(p.jumpLock<=0){if(p.slide&&wasGrounded){const target=move*90,braking=move&&p.vx*move<0;p.vx=approach(p.vx,target,(braking?900:240)*dt);}else{const max=340,acceleration=wasGrounded?2500:1300;p.vx=approach(p.vx,move*max,(!move&&wasGrounded?2100:acceleration)*dt);}}
  if(move)p.face=move;
  if(!jump&&p.vy<-260)p.vy+=1750*dt;
  p.vy=Math.min(850,p.vy+1800*dt);if(oldWall&&!wasGrounded&&p.vy>130&&move===oldWall)p.vy=130;
  const prevX=p.x,prevY=p.y;p.wall=0;p.x+=p.vx*dt;
  for(const s of solids){if(s.type==='slab'||s.type==='crumble'||s.type==='shortcut')continue;if(overlaps(box(p),s)){
    const dir=p.vx>0?1:p.vx<0?-1:Math.sign(p.x-(s.x+s.w/2))*-1;
    if(dir>0){p.x=s.x-p.w/2;p.wall=1;}else if(dir<0){p.x=s.x+s.w+p.w/2;p.wall=-1;}
    if(p.vx*dir>0)p.vx=0;
    // Ledge catch preserves momentum and leads into a short, blended vault.
    if(!wasGrounded&&!input.down&&p.jumpLock<=0&&p.vy>-180&&s.y>p.y-61&&s.y<p.y-17&&s.type!=='bar'){
      const topX=dir>0?s.x:s.x+s.w;p.face=dir;p.hang={x:topX-dir*11,y:s.y+42,topX,topY:s.y,age:0};p.buffer=0;this.emit('grab');break;
    }
  }}
  if(p.hang){this.capture();return;}
  p.y+=p.vy*dt;p.grounded=false;p.groundId=-1;
  for(const s of solids){if(p.x+p.w/2<=s.x+.01||p.x-p.w/2>=s.x+s.w-.01)continue;
    const oneWay=s.type==='slab'||s.type==='crumble'||s.type==='shortcut';
    if(p.vy>=0&&prevY<=s.y+(Math.max(0,s.dy||0))+3&&p.y>=s.y){p.y=s.y;p.vy=0;p.grounded=true;p.groundId=s.id;if(s.type==='crumble'&&s.crack<0){s.crack=0;this.emit('crumble');}}
    else if(!oneWay&&p.vy<0&&prevY-p.h>=s.y+s.h-.1&&p.y-p.h<=s.y+s.h){p.y=s.y+s.h+p.h;p.vy=0;}
  }
  if(p.grounded&&!wasGrounded){p.land=clamp(p.air*.8,.2,1);this.emit('land',{impact:p.land,speed:Math.abs(p.vx)});p.air=0;}else if(!p.grounded)p.air+=dt;
  p.phase+=Math.abs(p.x-prevX)/46;
  p.state=p.grounded?(p.slide?'slide':Math.abs(p.vx)>25?'run':'idle'):p.wall&&p.vy>0?'wall':p.vy<0?'jump':'fall';
  p.x=clamp(p.x,12,this.level.width-12);
  const pb=box(p);
  for(const h of this.level.hazards){if(h.type==='saw'){const cx=h.x+h.r,cy=h.y+h.r;const nx=clamp(cx,pb.x,pb.x+pb.w),ny=clamp(cy,pb.y,pb.y+pb.h);if(Math.hypot(cx-nx,cy-ny)<h.r-3){this.die();break;}}else if(overlaps({x:pb.x+3,y:pb.y+4,w:pb.w-6,h:pb.h-7},{x:h.x+3,y:h.y+5,w:h.w-6,h:h.h-5})){this.die();break;}}
  if(p.y>950)this.die();
  this.level.checkpoints.forEach((c,i)=>{if(i+1>this.checkpoint&&p.x>=c.x&&p.x<c.x+180&&p.y<=c.y+10&&p.y>c.y-185){this.checkpoint=i+1;this.saved={x:c.x,y:c.y};this.emit('checkpoint',{number:i+1});}});
  this.level.tokens.forEach((t,i)=>{if(!this.collected.has(i)&&Math.hypot(p.x-t.x,p.y-p.h*.55-t.y)<26){this.collected.add(i);this.flow++;this.emit('token');}});
  if(!this.dying&&p.x>=this.level.finish.x&&p.grounded){this.finished=true;this.emit('finish',{time:this.time,deaths:this.deaths});}
  this.capture();
 }
 capture(){if(this.time>=this.nextRecord){const p=this.p;this.record.push([+this.time.toFixed(3),+p.x.toFixed(1),+p.y.toFixed(1),+p.vx.toFixed(1),+p.vy.toFixed(1),+p.phase.toFixed(3),p.state,p.face,+p.land.toFixed(2),p.h]);this.nextRecord+=1/30;}}
 get hint(){const h=this.level.hints.find(v=>this.p.x>=v.x&&this.p.x<v.x+v.w);return h?h.text:'';}
 get medal(){return this.time<=this.level.gold?'GOLD':this.time<=this.level.silver?'SILVER':'BRONZE';}
 snapshot(){return {level:this.index,time:+this.time.toFixed(3),x:+this.p.x.toFixed(2),y:+this.p.y.toFixed(2),vx:+this.p.vx.toFixed(2),vy:+this.p.vy.toFixed(2),state:this.p.state,grounded:this.p.grounded,checkpoint:this.checkpoint,deaths:this.deaths,finished:this.finished,flow:this.flow};}
}
return {World,levels,clamp,overlaps,box};
});

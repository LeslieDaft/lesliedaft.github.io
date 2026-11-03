import {integrateDefender,inTackleReach} from './defender-movement.js';
// Fixed-step football contact simulation (metres, seconds, kg).
// Random ratings are drawn once per snap, so scrubbing a play remains reproducible.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const add=(a,b,k=1)=>({x:a.x+b.x*k,z:a.z+b.z*k});
const sub=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
const mul=(a,k)=>({x:a.x*k,z:a.z*k});
const length=a=>Math.hypot(a.x,a.z);
const unit=a=>mul(a,1/(length(a)||1));
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const randomSource=seed=>{let n=(Number(seed)>>>0)||1;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);n=(n^(n>>>16))>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}};
function steer(a,target,speed,accel,turn,dt){const desired=unit(sub(target,a.pos)),goal=Math.atan2(desired.x,desired.z);a.yaw+=clamp(wrap(goal-a.yaw),-turn*dt,turn*dt);const facing={x:Math.sin(a.yaw),z:Math.cos(a.yaw)},alignment=Math.max(.15,dot(facing,desired));const desiredV=mul(facing,Math.min(speed,length(sub(target,a.pos))*5)*alignment),dv=sub(desiredV,a.vel),n=length(dv);a.vel=add(a.vel,dv,n?Math.min(1,accel*dt/n):0);a.pos=add(a.pos,a.vel,dt)}
function matchVelocity(a,goal,feedForward,maxSpeed,accel,turn,dt){
 const correction=mul(sub(goal,a.pos),4.6),wanted=add(feedForward,correction),speed=length(wanted),desired=speed>maxSpeed?mul(wanted,maxSpeed/speed):wanted;
 if(speed>.12){const angle=Math.atan2(desired.x,desired.z),change=wrap(angle-a.yaw);a.yaw+=clamp(change,-turn*dt,turn*dt);const alignment=Math.max(.65,Math.cos(change));desired.x*=alignment;desired.z*=alignment;}
 const dv=sub(desired,a.vel),n=length(dv);a.vel=add(a.vel,dv,n?Math.min(1,accel*dt/n):0);a.pos=add(a.pos,a.vel,dt);
}
export function collisionMomentum(v1,v2,m1=90,m2=95){return mul(add(mul(v1,m1),mul(v2,m2)),1/(m1+m2))}
export class DefenseSimulation{
 constructor(sample){this.sample=sample;this.dt=1/120;this.enabled=true;this.fullGame=false;this.seed=1;this.playType='pass';this.runGap=0;this.qbTarget={x:0,z:-.95};this.selected=1;this.catchTime=Infinity;this.reset()}
 reset(){
  const random=randomSource(this.seed);this.time=0;this.tackle=null;this.blocks=[];
  this.db=Array.from({length:7},(_,i)=>{
   const r=this.sample((i%5)+1,0),roll=random(),tier=roll<.26?0:roll<.66?1:roll<.88?2:3,matchup=['locked','normal','beaten','bust'][tier],side=r.pos.x<0?1:-1,press=random()<(tier===0?.80:.58),shade=side*((press?.44:.34)+random()*.14),cushion=(press?.42:.65)+random()*.32+(tier===3?.12:0),gap=clamp(Number(this.runGap)||0,-3.6,3.6),right={x:r.forward.z,z:-r.forward.x},pos=this.playType==='run'&&i===2?{x:gap,z:4.5}:i<5?add(add(r.pos,r.forward,cushion),right,shade):{x:i===5?-2.4:2.4,z:5.0};
   const speed=tier===0?8.95+random()*.45:tier===1?8.80+random()*.50:8.55+random()*.60,accel=12+random()*2;
   return {id:i+1,pos,fit:{x:i===2?gap:clamp(pos.x*.68+gap*.32,-9,9),z:i===2?4.5:i>4?5.3:4.8},vel:{x:0,z:0},yaw:Math.atan2(r.forward.x,r.forward.z),readYaw:Math.atan2(r.forward.x,r.forward.z),readDirection:null,cutTime:-10,cutVelocity:{x:0,z:0},coverage:press?'press':'trail',matchup,mode:'backpedal',mass:88+i*3,rating:{speed,accel,reaction:(press?.035:.055)+random()*(tier<2?.055:.095),releaseDelay:random()*(tier===0?.05:tier===1?.12:tier===2?.26:.40),shade,trail:press?.08+random()*.14:-.16-random()*.22,phase:random()*Math.PI*2,turn:4.9+random()*1.9,cutDuration:.16+random()*.15+(tier===3?.18:0),cutError:.14+random()*.22+(tier>1?.18:0),cutReach:.04+random()*.045+(tier===3?.10:0),readAt:.35+random()*1.65,readDuration:tier===0?.18:tier===1?.25+random()*.2:tier===2?.40+random()*.22:.50+random()*.25,readStrength:tier===0?0:tier===1?.10+random()*.13:tier===2?.40+random()*.22:.55+random()*.22,readReach:tier===0?0:tier===1?.20+random()*.25:tier===2?.80+random()*.80:1.4+random()*1.2,readAngle:(random()<.5?-1:1)*(tier<2?.5+random()*.6:tier===2?.6+random()*.6:.90+random()*.55),recoveryTime:.85+random()*1.15,recoveryBurst:tier<2?.70+random()*.40:1.10+random()*.55}};
  });
  this.line=Array.from({length:5},(_,i)=>({id:i,pos:{x:(i-2)*.90,z:.35},vel:{x:0,z:0},yaw:0,mass:125+i*4,mode:'set',strength:910+random()*290,leverage:.90+random()*.22}));
  this.rush=Array.from({length:4},(_,i)=>({id:i,pos:{x:(i-1.5)*1.25,z:1.75+random()*.12},vel:{x:0,z:0},yaw:Math.PI,mass:108+i*5,mode:'rush',strength:920+random()*260,shedTime:2.4+random()*1.4,shedSide:random()<.5?-1:1}));
  this.blockStarts=[null,null,null,null];this.maxStepDistance=0;this.userControl=null;this.userIndex=-1;this.ballTarget=null;
 }
 configure(selected,catchTime,enabled=true,options={}){for(const key of ['seed','playType','runGap'])if(options[key]!==undefined)this[key]=options[key];this.selected=selected;this.catchTime=catchTime;this.enabled=enabled;this.reset()}
 setUserControl(control){this.userControl=control;if(!control)this.userIndex=-1;if(control&&control.index!==this.userIndex){this.userIndex=control.index;const actor=[...this.db,...this.rush][control.index];if(actor&&!actor.dive&&actor.userRunner)Object.assign(actor.userRunner,{x:actor.pos.x,z:actor.pos.z,yaw:actor.yaw,vx:actor.vel.x,vz:actor.vel.z,speed:Math.hypot(actor.vel.x,actor.vel.z)});}}
 moveUser(actor,dt,ready=false){const c=this.userControl?.index===[...this.db,...this.rush].indexOf(actor)?this.userControl:{steer:0,throttle:0};const runner=actor.userRunner||(actor.userRunner={x:actor.pos.x,z:actor.pos.z,yaw:ready?Math.atan2(-actor.pos.x,-.95-actor.pos.z):actor.yaw,speed:Math.hypot(actor.vel.x,actor.vel.z),vx:actor.vel.x,vz:actor.vel.z,distance:0,stop:true});const top=ready?6:actor.rating?Math.min(actor.rating.speed,c.sprint?9.4:8.7):6.6;integrateDefender(runner,c,dt,top,ready);actor.pos={x:runner.x,z:runner.z};actor.vel={x:runner.vx,z:runner.vz};actor.yaw=runner.yaw;actor.dive=runner.dive;actor.mode=runner.dive?'dive':'user';}
 seek(t){if(t<this.time-this.dt)this.reset();if(!this.enabled){this.time=t;return this}while(this.time+this.dt<=t+1e-9){this.step(this.dt);this.time+=this.dt}return this}
 step(dt){
  const t=this.time+dt,pursuing=t>this.catchTime&&Number.isFinite(this.catchTime),run=this.playType==='run',gap=clamp(Number(this.runGap)||0,-3.6,3.6);
  for(const d of this.db){
   if(this.tackle&&this.tackle.defender===d.id)continue;if(this.userControl?.index===d.id-1||d.dive){this.moveUser(d,dt);continue;}
   const id=pursuing?this.selected:((d.id-1)%5)+1,ratings=d.rating,releaseLag=!pursuing&&!run&&d.id<=5?ratings.releaseDelay*(1-ease((t-(ratings.releaseDelay+.12))/.28)):0,lag=pursuing?.075:ratings.reaction+releaseLag;
   const target=this.sample(id,Math.max(0,t-lag)),previous=this.sample(id,Math.max(0,t-lag-.035)),velocity=mul(sub(target.pos,previous.pos),1/.035);
   const recognition=!pursuing&&!run&&d.id<=5?ease((length(sub(d.pos,this.sample(id,t).pos))-2.9)/1.1):0;
   // Press and trail assignments share route velocity, with distinct shoulder
   // leverage. A cut can draw a short, seeded false step before the DB recovers.
   let goal=add(target.pos,velocity,pursuing?.12:lag*.74),feedForward=velocity,cutWeight=0,readWeight=0;
   if(!pursuing){
    const right={x:target.forward.z,z:-target.forward.x};goal=add(add(goal,target.forward,ratings.trail),right,ratings.shade+Math.sin(t*1.6+ratings.phase)*.035);
    const routeYaw=Math.atan2(target.forward.x,target.forward.z),change=wrap(routeYaw-d.readYaw),speed=length(velocity);
    if(!run&&d.id<=5&&Math.abs(change)>.28&&speed>3&&t-d.cutTime>.70){d.cutTime=t;d.cutVelocity={x:Math.sin(d.readYaw)*speed,z:Math.cos(d.readYaw)*speed};}
    d.readYaw+=clamp(change,-ratings.turn*.68*dt,ratings.turn*.68*dt);
    cutWeight=(1-ease((t-d.cutTime)/ratings.cutDuration))*ratings.cutError*(1-recognition);
    if(cutWeight>0){feedForward=add(mul(velocity,1-cutWeight),d.cutVelocity,cutWeight);goal=add(goal,d.cutVelocity,ratings.cutReach*cutWeight);}
    if(!run&&d.id<=5){
     // A matchup may hesitate or read the wrong release for a short window.
     // The envelope is smooth; positions still come from acceleration and momentum.
     const age=t-ratings.readAt,edge=Math.min(.18,ratings.readDuration*.3),envelope=ease(age/edge)*(1-ease((age-ratings.readDuration+edge)/edge));readWeight=envelope*ratings.readStrength*(1-.65*cutWeight)*(1-recognition);
     if(readWeight>0){if(!d.readDirection){const angle=routeYaw+ratings.readAngle;d.readDirection={x:Math.sin(angle),z:Math.cos(angle)};}let wrong=d.readDirection;const alignment=dot(wrong,target.forward);if(alignment<.12)wrong=unit(add(wrong,target.forward,.12-alignment));let readDelta=sub(wrong,target.forward);const backtrack=Math.min(0,dot(readDelta,target.forward));readDelta=add(readDelta,target.forward,-backtrack*.65);feedForward=add(mul(feedForward,1-readWeight),wrong,speed*readWeight);goal=add(goal,readDelta,ratings.readReach*readWeight);}
    }
   }
   if(this.tackle){goal=add(this.tackle.carrier,this.tackle.velocity,.12);feedForward=this.tackle.velocity;}
   d.mode=t<.28?'backpedal':pursuing?'pursuit':d.id>5?'zone':'man';
   if(d.id>5&&!pursuing){const zone={x:d.id===6?-2.4:2.4,z:d.id===6?3.5:8.5};let closest=zone,best=4.7;for(let n=1;n<=5;n++){const p=this.sample(n,t).pos,dist=length(sub(p,zone));if(dist<best){best=dist;closest=p}}goal=closest;feedForward={x:0,z:0};}
   if(run&&!pursuing){goal=d.fit;feedForward={x:0,z:0};d.mode='zone';}
   // Linebackers read a quarterback stepping up, then fill from both shoulders.
   const qbRun=pursuing&&this.selected===0,spy=this.fullGame&&!run&&!pursuing&&d.id>5&&(d.id===6||this.qbTarget.z>-.35);
   if(spy){goal={x:clamp(this.qbTarget.x,-4.5,4.5)+(d.id===6?-.5:.5),z:this.qbTarget.z>-.65?Math.max(.45,this.qbTarget.z+.7):3.0};feedForward={x:0,z:0};d.mode='pursuit';}
   if(this.ballTarget&&!pursuing){const b=this.ballTarget,delta=Math.hypot(b.x-d.pos.x,b.z-d.pos.z);if(delta<7&&b.age>.14){goal={x:b.x+b.vx*.10,z:b.z+b.vz*.10};feedForward={x:0,z:0};d.mode='ball';}}
   if(qbRun&&d.id>5){goal=add(target.pos,velocity,.25);d.mode='pursuit';}
   const afterRead=ease((t-ratings.readAt-ratings.readDuration)/ratings.recoveryTime),recovery=!pursuing&&!run&&d.id<=5?clamp((length(sub(goal,d.pos))-.9)*.70,0,ratings.recoveryBurst)*(d.matchup==='locked'||d.matchup==='normal'?1:.55+.45*afterRead):0;
   matchVelocity(d,goal,feedForward,pursuing?ratings.speed:Math.min(9.5,ratings.speed+recovery*.30+recognition*.15),pursuing||spy?Math.min(13,ratings.accel):Math.min(14,ratings.accel*(1-.22*cutWeight-.22*readWeight+.15*recognition)),ratings.turn,dt);
   if(!pursuing&&!run&&d.id<=5){const current=this.sample(id,t),delta=sub(d.pos,current.pos),distance=length(delta);if(distance<.44){const normal=distance>1e-6?unit(delta):{x:current.forward.z*Math.sign(ratings.shade),z:-current.forward.x*Math.sign(ratings.shade)},previous=this.sample(id,Math.max(0,t-dt)),currentVelocity=mul(sub(current.pos,previous.pos),1/dt),closing=dot(sub(d.vel,currentVelocity),normal);d.pos=add(d.pos,normal,.44-distance);if(closing<0)d.vel=add(d.vel,normal,-closing);}}
  }
  this.blocks=[];
  for(let i=0;i<4;i++){
   if(this.tackle?.rusher===i)continue;
   const lineIndex=i<2?i:i+1,b=this.line[lineIndex],r=this.rush[i],since=this.blockStarts[i],shed=since==null?0:ease((t-since-r.shedTime)/(run?.65:.60)),blockerVelocity={...b.vel},rusherVelocity={...r.vel};
   const rushGoal=pursuing?{...this.sample(this.selected,t+.08).pos}:{x:this.fullGame?this.qbTarget.x:0,z:this.fullGame?this.qbTarget.z:-.95};
   if(!pursuing&&shed>.08&&r.pos.z>.1&&this.qbTarget.z<-.8)rushGoal.x=r.shedSide*(1.05+.28*Math.sin(t+r.id));
   if(this.userControl?.index===7+i||r.dive)this.moveUser(r,dt);else steer(r,rushGoal,pursuing?6.5+r.id*.13:(run?2.6:2.35)+3.4*shed,pursuing?10.5:6.2,5.8,dt);
   const guard={x:clamp(r.pos.x+(run?(gap-b.pos.x)*.035:0),-3.2,3.2),z:run?r.pos.z+.10:Math.min(.55,r.pos.z-.45)};
   steer(b,guard,run?2.8:1.8,run?8.0:6.8,6.5,dt);b.yaw=Math.atan2(r.pos.x-b.pos.x,r.pos.z-b.pos.z);
   const delta=sub(r.pos,b.pos),distance=length(delta),normal=unit(delta);
   if(distance<.88&&shed<.97){
    if(since==null)this.blockStarts[i]=t;
    const relative=dot(sub(r.vel,b.vel),normal),totalMass=b.mass+r.mass;
    let shared=(dot(since==null?b.vel:blockerVelocity,normal)*b.mass+dot(since==null?r.vel:rusherVelocity,normal)*r.mass)/totalMass;
    const help=Math.abs(gap)<1.5&&i===(gap<=0?1:2)?90:0;
    const offense=b.strength*b.leverage*(run?1.08:1.00)+help,defense=r.strength*(1+Math.abs(delta.x)*.10),drive=clamp((offense-defense)/totalMass,-2.1,2.7);
    shared=clamp(shared+drive*dt,run?-1.05:-.36,run?1.45:.42);
    // Hands and shoulder pads remain in contact while both bodies keep moving.
    const blend=clamp((1-shed)*.92,0,1);
    b.vel=add(b.vel,normal,(shared-dot(b.vel,normal))*blend);r.vel=add(r.vel,normal,(shared-dot(r.vel,normal))*blend);
    const tangent={x:normal.z,z:-normal.x},sharedTangent=(dot(b.vel,tangent)*b.mass+dot(r.vel,tangent)*r.mass)/totalMass;
    b.vel=add(b.vel,tangent,(sharedTangent-dot(b.vel,tangent))*blend);r.vel=add(r.vel,tangent,(sharedTangent-dot(r.vel,tangent))*blend);
    const penetration=Math.max(0,.65-distance),correction=Math.min(.04,penetration*.45);
    b.pos=add(b.pos,normal,-correction*r.mass/totalMass);r.pos=add(r.pos,normal,correction*b.mass/totalMass);
    b.mode=run?'drive':'block';r.mode=shed>.08?'rip':'engaged';
    this.blocks.push({blocker:lineIndex,rusher:i,normal,distance,force:Math.abs(relative)*totalMass+Math.abs(offense-defense),shed,drive,run});
   }else{b.mode=shed>.5?'recover':run?'drive':'set';r.mode=pursuing?'pursuit':shed>.2?'shed':'rush';}
   if(this.userControl?.index===7+i&&r.userRunner){Object.assign(r.userRunner,{x:r.pos.x,z:r.pos.z,vx:r.vel.x,vz:r.vel.z,speed:Math.hypot(r.vel.x,r.vel.z)});}
   if(!this.fullGame&&r.pos.z<-1.25){r.pos.z=-1.25;r.vel.z=Math.max(0,r.vel.z)}
  }
  // The centre helps an interior guard, or climbs through the chosen run gap.
  const centre=this.line[2],inside=gap<=0?1:2,rusher=this.rush[inside];
  const centreGoal=run?{x:clamp(gap*.55,-1.25,1.25),z:Math.min(3.5,rusher.pos.z-.52)}:{x:rusher.pos.x+(inside===1?.44:-.44),z:Math.min(.50,rusher.pos.z-.59)};
  steer(centre,centreGoal,run?2.1:1.15,run?7:5,6,dt);centre.mode=run?'drive':'set';
  const centreDistance=length(sub(rusher.pos,centre.pos));
  if(centreDistance<.90){const normal=unit(sub(rusher.pos,centre.pos));centre.yaw=Math.atan2(normal.x,normal.z);centre.mode=run?'drive':'block';centre.vel=add(mul(centre.vel,.92),rusher.vel,.08);this.blocks.push({blocker:2,rusher:inside,normal,distance:centreDistance,force:120,shed:0,drive:run?.5:0,run,assist:true});}
  if(!this.tackle&&t>this.catchTime+.10){const carrier=this.sample(this.selected,t),previous=this.sample(this.selected,t-.01),runnerV=mul(sub(carrier.pos,previous.pos),100),candidates=[...this.db,...this.rush];for(let j=0;j<candidates.length;j++){const d=candidates[j],delta=sub(d.pos,carrier.pos);if(inTackleReach(d,carrier.pos)){const closing=length(sub(runnerV,d.vel)),alignment=dot(unit(runnerV),unit(d.vel)),kind=alignment>.5?'chase':alignment<-.35?'front':'side';const shared=collisionMomentum(runnerV,d.vel,90,d.mass);this.tackle={start:t,defender:j+1,...(j>=7?{rusher:j-7}:{}),kind,relativeSpeed:closing,carrier:{...carrier.pos},offset:mul(unit(delta),.43),velocity:shared,initialVelocity:{...shared},runnerVelocity:runnerV,defenderVelocity:{...d.vel},yaw:Math.atan2(runnerV.x,runnerV.z),duration:kind==='chase'?.83:kind==='front'?.48:.65,masses:[90,d.mass],fall:0,ground:0};break}}}
  if(this.tackle){const k=this.tackle,age=t-k.start,fall=ease((age-.22)/k.duration),ground=ease((age-(.22+k.duration))/.42),drag=age<.25?.65:age<.22+k.duration?1.7:4.4;const before={...k.carrier};k.velocity=mul(k.velocity,Math.exp(-drag*dt));k.carrier=add(k.carrier,k.velocity,dt);this.maxStepDistance=Math.max(this.maxStepDistance,length(sub(k.carrier,before)));k.fall=fall;k.ground=ground;k.age=age;const d=k.rusher===undefined?this.db[k.defender-1]:this.rush[k.rusher];d.pos=add(k.carrier,k.offset);d.vel={...k.velocity};d.mode=ground>.1?'ground':fall>.2?'finish':'wrap';}
 }
}

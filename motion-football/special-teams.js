const YARD=.9144,GRAVITY=9.81;
// At 36 degrees this caps a calm, centered crossbar-clearing kick near 70 yards.
const MAX_FIELD_GOAL_SPEED=26.55;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const point=(x,y,z)=>({x,y,z});
const blend=(a,b,t)=>point(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t));
const length=v=>Math.hypot(v.x,v.z);
const DURATIONS={snap:.72,settle:.31,approach:.76,kick:.30,return:8,tackle:1.25};
function runnerPose(state,elapsed,extra={}){
 const stride=elapsed*(2.8+state.speed*.28),s=Math.sin(stride)*clamp(Math.abs(state.speed)/8.7,0,1),c=Math.cos(state.yaw),f=Math.sin(state.yaw),speed=state.speed;
 const local=(x,y,z)=>point(state.x+x*c+z*f,y,state.z-x*f+z*c);
 return {visible:true,x:state.x,z:state.z,yaw:state.yaw,pelvisHeight:.82-Math.abs(s)*.035,lean:.08+speed*.018,torsoTwist:s*.07,stride,kick:0,kneel:0,
  hands:[local(-.32,1.20+s*.16,-s*.22),local(.32,1.20-s*.16,s*.22)],
  feet:[local(-.17,.07+Math.max(0,-s)*.29,s*.36),local(.17,.07+Math.max(0,s)*.29,-s*.36)],...extra};
}
/** Staged, local-LOS special-teams play. Meter keys are intentionally separate from simulation time. */
export class SpecialTeamsPlay{
 constructor({type='fieldgoal',purpose='fieldgoal',spot=25,rng=Math.random}={}){
  this.type=type==='punt'?'punt':'fieldgoal';this.purpose=this.type==='punt'?'punt':purpose==='extraPoint'?'extraPoint':'fieldgoal';this.spot=clamp(spot,.1,99.9);this.rng=rng;this.phase='ready';this.phaseTime=0;this.elapsed=0;this.power=.72;this.accuracy=0;this.meterValue=0;this.outcome=null;this.events=[];
  this.kickPoint=point(0,this.type==='punt'?.45:.13,this.type==='punt'?-9.2:-6.4);this.snapEnd=point(0,this.type==='punt'?1.24:.67,this.type==='punt'?-12:-6.4);this.ball=point(0,.69,.35);this.velocity=point(0,0,0);this.spin=0;this.flightTime=0;this.launch=null;this.crossedGoal=false;this.puntReleaseTime=DURATIONS.approach+.12-Math.sqrt(2*(1.14-this.kickPoint.y)/GRAVITY);
  this.kicker={x:this.type==='punt'?0:1.55,z:this.type==='punt'?-12:-8.95,yaw:0,speed:0};this.returner={x:0,z:(Math.max(50,spot+39)-spot)*YARD,yaw:Math.PI,vx:0,vz:0,speed:0};
  this.coverage=[-10.5,-5,5,10.5].map((x,i)=>({x,z:i%2?-.6:.1,yaw:0,vx:0,vz:0,speed:0,maxSpeed:8.25+this.rng()*.8}));this.catchPoint=null;this.returnStart=null;this.tackle=null;this.wind={x:(this.rng()-.5)*.28,z:(this.rng()-.5)*.16};this.precisionNoise=(this.rng()-.5)*.009;
 }
 _phase(phase){this.phase=phase;this.phaseTime=0;this.events.push(phase)}
 press(){
  if(this.phase==='ready'){this._phase('power');this.meterValue=0;return true}
  if(this.phase==='power'){this.power=clamp(this.meterValue,0,1);this._phase('accuracy');this.meterValue=-1;return true}
  if(this.phase==='accuracy'){this.accuracy=clamp(this.meterValue,-1,1);this._phase('snap');return true}
  return false;
 }
 _launch(){
  const power=this.power,angle=(this.type==='punt'?56-7*power:36+4*(1-power))*Math.PI/180,speed=this.type==='punt'?14+11.5*power:12+(MAX_FIELD_GOAL_SPEED-12)*power;
  const scatter=this.precisionNoise*(this.type==='punt'?1:1+power*.4+Math.abs(this.accuracy)*2),yaw=this.accuracy*(this.type==='punt'?.105:.19)+scatter,horizontal=speed*Math.cos(angle);
  this.velocity=point(Math.sin(yaw)*horizontal+this.wind.x,speed*Math.sin(angle),Math.cos(yaw)*horizontal+this.wind.z);this.launch={position:{...this.kickPoint},velocity:{...this.velocity}};this.ball={...this.kickPoint};this.flightTime=0;
  const groundTime=(this.velocity.y+Math.sqrt(this.velocity.y*this.velocity.y+2*GRAVITY*this.ball.y))/GRAVITY;
  this.landing=point(this.ball.x+this.velocity.x*groundTime,0,this.ball.z+this.velocity.z*groundTime);this._phase('flight');
 }
 _puntDrop(t){
  if(t<=this.puntReleaseTime){const u=smooth(t/DURATIONS.approach),held=blend(this.snapEnd,point(this.kicker.x-.04,1.14,this.kicker.z+.32),smooth(u/.30));this.ball=held;this.velocity=point(0,0,0);return}
  const u=smooth(this.puntReleaseTime/DURATIONS.approach),release=point(lerp(0,.15,u)-.04,1.14,lerp(-12,this.kickPoint.z-.42,u)+.32),duration=DURATIONS.approach+.12-this.puntReleaseTime,d=t-this.puntReleaseTime,vx=(this.kickPoint.x-release.x)/duration,vz=(this.kickPoint.z-release.z)/duration;
  this.ball=point(release.x+vx*d,release.y-.5*GRAVITY*d*d,release.z+vz*d);this.velocity=point(vx,-GRAVITY*d,vz);
 }
 _move(actor,target,dt,maxSpeed=8.7){
  const dx=target.x-actor.x,dz=target.z-actor.z,d=Math.hypot(dx,dz),speed=Math.min(maxSpeed,d*3),tx=d>.001?dx/d*speed:0,tz=d>.001?dz/d*speed:0,change=11.8*dt;
  const dvx=tx-actor.vx,dvz=tz-actor.vz,n=Math.hypot(dvx,dvz),ratio=n>change?change/n:1;actor.vx+=dvx*ratio;actor.vz+=dvz*ratio;actor.x+=actor.vx*dt;actor.z+=actor.vz*dt;actor.speed=length({x:actor.vx,z:actor.vz});
  if(actor.speed>.25){const targetYaw=Math.atan2(actor.vx,actor.vz),delta=Math.atan2(Math.sin(targetYaw-actor.yaw),Math.cos(targetYaw-actor.yaw));actor.yaw+=clamp(delta,-6*dt,6*dt)}
 }
 _end(outcome){this.outcome={type:this.type,purpose:this.purpose,...outcome};this._phase('done')}
 _finishPunt(extra={}){
  const fieldSpot=clamp(this.spot+this.returner.z/YARD,0,100),returnYards=this.returnStart?Math.max(0,(this.returnStart.z-this.returner.z)/YARD):0;
  this._end({opponentSpot:clamp(100-fieldSpot,1,99),returnYards,puntYards:(this.catchPoint?.z??this.landing.z)/YARD,opponentTouchdown:fieldSpot<=0,...extra});
 }
 _update(dt){
  this.elapsed+=dt;this.phaseTime+=dt;
  if(this.phase==='power'){this.meterValue=.5-.5*Math.cos(this.phaseTime*Math.PI*2/1.65);return}
  if(this.phase==='accuracy'){this.meterValue=-Math.cos(this.phaseTime*Math.PI*2/1.24);return}
  if(this.phase==='snap'){
   const load=clamp(this.phaseTime/.15,0,1),u=clamp((this.phaseTime-.15)/(DURATIONS.snap-.15),0,1),release=point(0,.50,.04);
   if(this.phaseTime<=.15){const verticalSpeed=(this.snapEnd.y-release.y+.11*Math.PI)/(DURATIONS.snap-.15),u=load,m=verticalSpeed*.15,exponent=(release.z-this.snapEnd.z)/(DURATIONS.snap-.15)*.15/(.35-.04);this.ball=point(0,(2*u*u*u-3*u*u+1)*.69+(-2*u*u*u+3*u*u)*release.y+(u*u*u-u*u)*m,.35+(.04-.35)*Math.pow(u,exponent));this.velocity=point(0,((6*u*u-6*u)*.69+(-6*u*u+6*u)*release.y+(3*u*u-2*u)*m)/.15,(.04-.35)*exponent*Math.pow(u,exponent-1)/.15);this.spin+=dt*6}else{this.ball=blend(release,this.snapEnd,u);this.ball.y+=Math.sin(u*Math.PI)*.11;this.velocity=point(0,(this.snapEnd.y-release.y+.11*Math.PI*Math.cos(u*Math.PI))/(DURATIONS.snap-.15),(this.snapEnd.z-release.z)/(DURATIONS.snap-.15));this.spin+=dt*22}
   if(this.phaseTime>=DURATIONS.snap)this._phase('settle');return;
  }
  if(this.phase==='settle'){
   const u=smooth(this.phaseTime/DURATIONS.settle);this.ball=this.type==='punt'?{...this.snapEnd}:blend(this.snapEnd,this.kickPoint,u);this.velocity=point(0,0,0);
   if(this.phaseTime>=DURATIONS.settle)this._phase('approach');return;
  }
  if(this.phase==='approach'){
   const u=smooth(this.phaseTime/DURATIONS.approach),start=this.type==='punt'?point(0,0,-12):point(1.55,0,-8.95),end=point(.15,0,this.kickPoint.z-.42);this.kicker.x=lerp(start.x,end.x,u);this.kicker.z=lerp(start.z,end.z,u);
   if(this.type==='punt')this._puntDrop(this.phaseTime);else{this.ball={...this.kickPoint};this.velocity=point(0,0,0)}
   if(this.phaseTime>=DURATIONS.approach)this._phase('kick');return;
  }
  if(this.phase==='kick'){if(this.type==='punt')this._puntDrop(DURATIONS.approach+this.phaseTime);else this.ball={...this.kickPoint};if(this.phaseTime>=.12)this._launch();return}
  if(this.phase==='flight'){
   const previous={...this.ball};this.flightTime+=dt;this.ball=point(this.launch.position.x+this.launch.velocity.x*this.flightTime,this.launch.position.y+this.launch.velocity.y*this.flightTime-.5*GRAVITY*this.flightTime*this.flightTime,this.launch.position.z+this.launch.velocity.z*this.flightTime);this.velocity=point(this.launch.velocity.x,this.launch.velocity.y-GRAVITY*this.flightTime,this.launch.velocity.z);this.spin+=dt*(this.type==='punt'?15:21);
   if(this.type==='fieldgoal'){
    const goalZ=(110-this.spot)*YARD;
    if(!this.crossedGoal&&previous.z<goalZ&&this.ball.z>=goalZ){this.crossedGoal=true;const u=(goalZ-previous.z)/(this.ball.z-previous.z),cross=blend(previous,this.ball,u);this.goalCrossing=cross;this.made=Math.abs(cross.x)<=2.8194&&cross.y>=3.048;this.goalCrossTime=this.flightTime}
    if(this.ball.y<=0||(this.crossedGoal&&this.flightTime-this.goalCrossTime>.40)){this.ball.y=Math.max(0,this.ball.y);this._end({made:!!this.made,distance:117-this.spot,opponentSpot:this.made?25:clamp(107-this.spot,1,99),crossing:this.goalCrossing??null,power:this.power,accuracy:this.accuracy})}return;
   }
   this._move(this.returner,{x:this.landing.x,z:this.landing.z-1.0},dt,8.9);
   for(const c of this.coverage)this._move(c,{x:this.landing.x+(c.x<0?-1.5:1.5),z:this.landing.z},dt,c.maxSpeed);
   if(this.spot+this.ball.z/YARD>=100&&this.ball.y<2&&this.velocity.y<0){this._end({opponentSpot:20,returnYards:0,puntYards:this.landing.z/YARD,touchback:true});return}
   if(Math.abs(this.ball.x)>24.384&&this.ball.y<2){this._end({opponentSpot:clamp(100-this.spot-this.ball.z/YARD,1,99),returnYards:0,puntYards:this.ball.z/YARD,outOfBounds:true});return}
   if(this.ball.y<=1.65&&this.velocity.y<0){const d=Math.hypot(this.ball.x-this.returner.x,this.ball.z-this.returner.z);if(d<1.7){this.catchPoint={...this.ball};this.returnStart={x:this.returner.x,z:this.returner.z};this.returner.vx*=.5;this.returner.vz*=.5;this._phase('return');return}}
   if(this.ball.y<=0){this.ball.y=.08;this.velocity.y=0;this._phase('recover')}return;
  }
  if(this.phase==='recover'){
   const drag=Math.exp(-2.5*dt);this.velocity.x*=drag;this.velocity.z*=drag;this.ball.x+=this.velocity.x*dt;this.ball.z+=this.velocity.z*dt;this.ball.y=.08+Math.abs(Math.sin(this.phaseTime*17))*.25*Math.exp(-this.phaseTime*3);
   this._move(this.returner,this.ball,dt,8.9);for(const c of this.coverage)this._move(c,this.ball,dt,c.maxSpeed);
   if(Math.hypot(this.ball.x-this.returner.x,this.ball.z-this.returner.z)<.72){this.catchPoint={...this.ball};this.returnStart={x:this.returner.x,z:this.returner.z};this._phase('return')}else if(this.coverage.some(c=>Math.hypot(c.x-this.ball.x,c.z-this.ball.z)<.7)||this.phaseTime>5){this._end({opponentSpot:clamp(100-this.spot-this.ball.z/YARD,1,99),returnYards:0,puntYards:this.ball.z/YARD,downed:true})}return;
  }
  if(this.phase==='return'){
   const closest=this.coverage.reduce((best,c)=>Math.hypot(c.x-this.returner.x,c.z-this.returner.z)<Math.hypot(best.x-this.returner.x,best.z-this.returner.z)?c:best,this.coverage[0]);
   const dodge=closest.z<this.returner.z&&this.returner.z-closest.z<7?(closest.x<this.returner.x?1:-1)*2.7:Math.sin(this.phaseTime*1.1)*.6;
   this._move(this.returner,{x:clamp(this.returner.x+dodge,-23.1,23.1),z:this.returner.z-12},dt,8.6);
   for(const c of this.coverage){this._move(c,{x:this.returner.x+this.returner.vx*.17,z:this.returner.z+this.returner.vz*.17},dt,c.maxSpeed);const d=Math.hypot(c.x-this.returner.x,c.z-this.returner.z);if(d<.79&&this.phaseTime>.25){const shared={x:(this.returner.vx*98+c.vx*110)/208,z:(this.returner.vz*98+c.vz*110)/208};this.tackle={defender:c,start:{x:this.returner.x,z:this.returner.z},velocity:shared};this._phase('tackle');break}}
   const tuck=point(this.returner.x-.17,1.17,this.returner.z-.23);this.ball=blend(this.catchPoint,tuck,smooth(this.phaseTime/.24));this.velocity=point(this.returner.vx,0,this.returner.vz);
   if(this.phase==='return'&&(this.phaseTime>DURATIONS.return||Math.abs(this.returner.x)>24.1||this.spot+this.returner.z/YARD<=0))this._finishPunt();return;
  }
  if(this.phase==='tackle'){
   const v=this.tackle.velocity,drag=Math.exp(-2.9*dt);v.x*=drag;v.z*=drag;this.returner.x+=v.x*dt;this.returner.z+=v.z*dt;this.tackle.defender.x+=v.x*dt;this.tackle.defender.z+=v.z*dt;this.returner.speed=Math.hypot(v.x,v.z);const fall=smooth((this.phaseTime-.22)/.68);this.ball=point(this.returner.x-.17,lerp(1.17,.24,fall),this.returner.z-.23);this.velocity=point(v.x,0,v.z);if(this.phaseTime>=DURATIONS.tackle)this._finishPunt();
  }
 }
 step(dt){if(!Number.isFinite(dt)||dt<=0||this.phase==='done'||this.phase==='ready')return this.sample();let remaining=Math.min(dt,.5);while(remaining>1e-7&&this.phase!=='done'){const slice=Math.min(1/120,remaining);this._update(slice);remaining-=slice}return this.sample()}
 sample(){
  const phase=this.phase,pt=this.phaseTime,afterSnap=!['ready','power','accuracy','snap'].includes(phase),fg=this.type==='fieldgoal';
  const load=phase==='snap'?smooth(clamp(pt/.15,0,1)):0,recovery=phase==='snap'?smooth(clamp((pt-.15)/(DURATIONS.snap-.15),0,1)):afterSnap?1:0;
  const snapper={visible:true,x:0,z:lerp(-.12,0,recovery),yaw:0,pelvisHeight:lerp(.56+.04*load,.89,recovery),pelvisLean:lerp(.43,.12,recovery),lean:lerp(.85,.17,recovery),torsoTwist:0,kneel:0,stride:0,kick:0,
   hands:[point(-.09,.69,.35),point(.09,.69,.35)],feet:[point(-.34,.06,.14),point(.34,.06,-.10)]};
  if(phase==='snap'){
   const release=point(0,.50,.04),handsPoint=pt<=.15?this.ball:blend(release,point(0,1.17,.28),recovery);
   snapper.hands=[point(handsPoint.x-.09,handsPoint.y,handsPoint.z),point(handsPoint.x+.09,handsPoint.y,handsPoint.z)];snapper.torsoTwist=-.035*Math.sin(load*Math.PI);
  }else if(afterSnap){snapper.hands=[point(-.12,1.17,.28),point(.12,1.17,.28)]}
  const holder={visible:fg,x:-.18,z:-6.67,yaw:0,pelvisHeight:.33,pelvisLean:.15,lean:1.05,torsoTwist:0,kneel:1,stride:0,kick:0,feet:[point(-.59,.07,-7.13),point(-.17,.07,-6.38)],hands:[point(-.13,.34,-6.41),point(.025,.16,-6.4)]};
  if(['ready','power','accuracy','snap'].includes(phase)){holder.hands=[point(-.16,.68,-6.4),point(.08,.68,-6.4)]}if(phase==='settle'){const u=smooth(pt/DURATIONS.settle);holder.hands=[blend(point(-.16,.68,-6.4),point(-.13,.34,-6.41),u),blend(point(.08,.68,-6.4),point(.025,.16,-6.4),u)]}
  const approach=phase==='approach'?clamp(pt/DURATIONS.approach,0,1):['kick','flight','return','tackle','done'].includes(phase)?1:0,stepCycle=approach*Math.PI*(fg?3:2),s=Math.sin(stepCycle),kicker={visible:true,x:this.kicker.x,z:this.kicker.z,yaw:fg?.06:0,pelvisHeight:.84-Math.abs(s)*.035,lean:.10+approach*.10,torsoTwist:s*.13,kneel:0,stride:stepCycle,kick:0,
   feet:[point(this.kicker.x-.17,.07+Math.max(0,-s)*.19,this.kicker.z+s*.32),point(this.kicker.x+.17,.07+Math.max(0,s)*.19,this.kicker.z-s*.32)],hands:[point(this.kicker.x-.33,1.17+s*.11,this.kicker.z-.05-s*.15),point(this.kicker.x+.33,1.17-s*.11,this.kicker.z-.05+s*.15)]};
  if(!fg&&['ready','power','accuracy','snap','settle','approach'].includes(phase)){kicker.hands=phase==='approach'&&pt>this.puntReleaseTime?[point(this.kicker.x-.26,1.16,this.kicker.z+.18),point(this.kicker.x+.26,1.16,this.kicker.z+.18)]:[point(this.ball.x-.09,this.ball.y+.01,this.ball.z-.025),point(this.ball.x+.09,this.ball.y+.01,this.ball.z-.025)];if(['ready','power','accuracy','snap'].includes(phase))kicker.hands=[point(-.10,1.24,-12),point(.10,1.24,-12)]}
  const kickTime=phase==='kick'?pt:phase==='flight'?this.flightTime+.12:['return','recover','tackle','done'].includes(phase)?1.2:0;
  if(kickTime>0){
   const backswing=smooth(kickTime/.07),toContact=smooth((kickTime-.07)/.05),follow=smooth((kickTime-.12)/.20),recovery=smooth((kickTime-.45)/.65);
   const startFoot=point(-.02,.07,this.kickPoint.z-.42),backFoot=point(-.075,.22,this.kickPoint.z-.77),contact={...this.kickPoint},through=point(.10,fg?.83:1.02,this.kickPoint.z+.55);
   let strikingFoot=kickTime<.07?blend(startFoot,backFoot,backswing):kickTime<.12?blend(backFoot,contact,toContact):blend(contact,through,follow);
   kicker.z=lerp(this.kicker.z,this.kickPoint.z-.12,follow);kicker.pelvisHeight=.84-.05*follow;kicker.kick=kickTime<.12?-.3*backswing:1.4*follow*(1-recovery);kicker.lean=lerp(-.12,.20,recovery);kicker.torsoTwist=kickTime<.12?.13*backswing:-.25*Math.sin(follow*Math.PI*.8);
   kicker.feet=[strikingFoot,point(.40,.065,this.kickPoint.z-.29)];kicker.hands=[point(-.53,1.26,kicker.z-.22),point(.62,1.45,kicker.z+.11)];
   if(recovery>0){const base=runnerPose({x:.15,z:this.kickPoint.z-.12,yaw:0,speed:0},0);kicker.feet=kicker.feet.map((p,i)=>blend(p,base.feet[i],recovery));kicker.hands=kicker.hands.map((p,i)=>blend(p,base.hands[i],recovery))}
  }
  const r=runnerPose(this.returner,this.elapsed,{visible:!fg});
  if((phase==='flight'&&this.ball.y<3.5&&this.velocity.y<0)||phase==='recover'){r.hands=[point(this.ball.x-.12,clamp(this.ball.y,.9,2.0),this.returner.z+.15),point(this.ball.x+.12,clamp(this.ball.y,.9,2.0),this.returner.z+.15)];r.lean=-.12}
  if(['return','tackle'].includes(phase)||(phase==='done'&&this.returnStart)){r.hands=[point(this.ball.x-.04,this.ball.y,this.ball.z),point(this.returner.x+.32,1.22,this.returner.z-.15)]}
  const coverage=this.coverage.map(c=>runnerPose(c,this.elapsed,{visible:!fg}));
  if(this.tackle&&['tackle','done'].includes(phase)){const fall=smooth(((phase==='done'?DURATIONS.tackle:pt)-.22)/.68);r.fall={progress:fall,velocity:{...this.tackle.velocity},yaw:this.returner.yaw};const i=this.coverage.indexOf(this.tackle.defender);coverage[i].fall={progress:fall,velocity:{...this.tackle.velocity},yaw:this.tackle.defender.yaw};coverage[i].hands=[point(this.returner.x-.29,lerp(1.15,.38,fall),this.returner.z),point(this.returner.x+.29,lerp(1.15,.38,fall),this.returner.z)]}
  return {type:this.type,purpose:this.purpose,phase,phaseTime:pt,elapsed:this.elapsed,meter:{active:phase==='power'?'power':phase==='accuracy'?'accuracy':null,value:this.meterValue,power:this.power,accuracy:this.accuracy},ball:{position:{...this.ball},velocity:{...this.velocity},spin:this.spin,attachedTo:phase==='ready'||phase==='power'||phase==='accuracy'||phase==='snap'&&pt<=.15?'snapper':phase==='settle'?(fg?'holder':'kicker'):phase==='approach'&&!fg&&pt<=this.puntReleaseTime?'kicker':phase==='return'||phase==='tackle'?'returner':null,axis:fg?'end-over-end':'end-over-end'},actors:{snapper,holder,kicker,returner:r,coverage},outcome:this.outcome,landing:this.landing??null};
 }
}

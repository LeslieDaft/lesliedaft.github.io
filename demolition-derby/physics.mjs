// Demolition Derby: planar rigid bodies, oriented contacts, tire traction and damage.
// Distances are metres, velocities metres/second; the renderer supplies the 3D suspension.
export const MODELS = Object.freeze({
  sedan: { name:'Interceptor', mass:1420, halfWidth:1.02, halfLength:2.28, power:8500, maxSpeed:28, armor:1.0, handling:1.0 },
  muscle: { name:'Hammerhead', mass:1730, halfWidth:1.10, halfLength:2.52, power:11200, maxSpeed:32, armor:1.12, handling:.91 },
  truck: { name:'Ironclad', mass:2320, halfWidth:1.18, halfLength:2.65, power:10600, maxSpeed:25, armor:1.38, handling:.77 }
});
export const MODEL = MODELS;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const yawTorque=(r,f)=>r.z*f.x-r.x*f.z;
const axisF=c=>({x:Math.sin(c.angle),z:Math.cos(c.angle)});
const axisR=c=>({x:Math.cos(c.angle),z:-Math.sin(c.angle)});
const speed=c=>Math.hypot(c.vx,c.vz);

export function createCar({id=0,x=0,z=0,angle=0,model='sedan',player=false,upgrades={}}={}) {
  const spec=MODELS[model]||MODELS.sedan;
  const mass=spec.mass;
  return { id,x,z,angle,vx:0,vz:0,omega:0,model:MODELS[model]?model:'sedan',player,
    ...spec,mass,invMass:1/mass,inertia:mass*(4*spec.halfWidth**2+4*spec.halfLength**2)/12,
    health:100,maxHealth:100,damage:{front:0,rear:0,left:0,right:0},hits:0,kills:0,
    armorLevel:clamp(Number(upgrades.armor)||0,0,5),engineLevel:clamp(Number(upgrades.engine)||0,0,5),
    handlingLevel:clamp(Number(upgrades.handling)||0,0,5),alive:true,steer:0,throttle:0,
    slip:0,wheelRotation:0,impact:0,lastHitBy:null,lastHitAt:-100,aiTarget:null,
    aiStuck:0,aiReverse:0,aiThink:0,aiOffset:0,damageVersion:0 };
}

export function createWorld({arena='yard',count=6,model='sedan',upgrades={},seed=1}={}) {
  let rnd=seed>>>0;
  const random=()=>{rnd=(rnd*1664525+1013904223)>>>0;return rnd/4294967296;};
  const bounds=arena==='speedway'?{x:53,z:37}:arena==='industrial'?{x:39,z:34}:{x:42,z:32};
  const obstacles=arena==='industrial'?[
    {x:-16,z:-5,halfWidth:2.3,halfLength:7,angle:0},
    {x:16,z:8,halfWidth:2.3,halfLength:7,angle:0}
  ]:arena==='yard'?[
    {x:-24,z:0,halfWidth:2.1,halfLength:3.1,angle:.25},
    {x:24,z:0,halfWidth:2.1,halfLength:3.1,angle:-.25}
  ]:[];
  const cars=[createCar({id:0,x:0,z:16,angle:Math.PI,model,player:true,upgrades})];
  const colors=['#a33227','#d1ac25','#3c6c8c','#698652','#c7c4b2','#74496c','#b2652f'];
  cars[0].color='#e4ae44';
  count=clamp(Math.round(count),2,10);
  for(let i=1;i<count;i++) {
    // Reserve the south grid slot for the player.
    const a=i/count*Math.PI*2;
    const x=Math.sin(a)*25,z=Math.cos(a)*20-4;
    const c=createCar({id:i,x,z,angle:Math.atan2(-x,-z),model:['sedan','muscle','truck'][Math.floor(random()*3)]});
    c.color=colors[(i-1)%colors.length];c.aiOffset=(random()-.5)*1.8;cars.push(c);
  }
  return {arena,bounds,obstacles,cars,events:[],t:0,timeLimit:180,finished:false,winner:null,
    random,collisionCooldown:new Map(),lastInput:{throttle:0,steer:0,handbrake:false}};
}

function support(c,n) {
  const f=axisF(c),r=axisR(c);
  const sf=dot(f,n)>=0?1:-1,sr=dot(r,n)>=0?1:-1;
  return {x:c.x+f.x*c.halfLength*sf+r.x*c.halfWidth*sr,z:c.z+f.z*c.halfLength*sf+r.z*c.halfWidth*sr};
}

// Four-axis separating-axis test. The normal always points from a towards b.
export function contactOBB(a,b) {
  const af=axisF(a),ar=axisR(a),bf=axisF(b),br=axisR(b);
  const d={x:b.x-a.x,z:b.z-a.z};
  let depth=Infinity,normal=null;
  for(const n of [af,ar,bf,br]) {
    const ra=Math.abs(dot(af,n))*a.halfLength+Math.abs(dot(ar,n))*a.halfWidth;
    const rb=Math.abs(dot(bf,n))*b.halfLength+Math.abs(dot(br,n))*b.halfWidth;
    const dist=dot(d,n),overlap=ra+rb-Math.abs(dist);
    if(overlap<=0)return null;
    if(overlap<depth){depth=overlap;normal={x:n.x*(dist<0?-1:1),z:n.z*(dist<0?-1:1)};}
  }
  // Average support points tangentially clamped to the actual overlap, avoiding
  // extreme corner torque during centered head-on impacts.
  const pa=support(a,normal),pb=support(b,{x:-normal.x,z:-normal.z});
  const tangent={x:-normal.z,z:normal.x};
  const projected=c=>{
    const f=axisF(c),r=axisR(c),mid=c.x*tangent.x+c.z*tangent.z;
    const half=Math.abs(dot(f,tangent))*c.halfLength+Math.abs(dot(r,tangent))*c.halfWidth;
    return [mid-half,mid+half];
  };
  const ta=projected(a),tb=projected(b);
  const t=(Math.max(ta[0],tb[0])+Math.min(ta[1],tb[1]))*.5;
  const n=((pa.x+pb.x)*normal.x+(pa.z+pb.z)*normal.z)*.5;
  return {normal,depth,x:normal.x*n+tangent.x*t,z:normal.z*n+tangent.z*t};
}

function applyImpulse(c,impulse,r) {
  if(!c.invMass)return;
  c.vx+=impulse.x*c.invMass;c.vz+=impulse.z*c.invMass;
  c.omega+=yawTorque(r,impulse)/c.inertia;
}
function contactVelocity(c,r){return {x:(c.vx||0)+(c.omega||0)*r.z,z:(c.vz||0)-(c.omega||0)*r.x};}

function zoneAt(c,x,z) {
  const f=axisF(c),r=axisR(c),delta={x:x-c.x,z:z-c.z};
  const ff=dot(f,delta)/c.halfLength,rr=dot(r,delta)/c.halfWidth;
  return Math.abs(ff)>Math.abs(rr)?(ff>0?'front':'rear'):(rr>0?'right':'left');
}

function damageCar(world,c,amount,x,z,attacker) {
  if(!c.alive||amount<=0)return;
  const zone=zoneAt(c,x,z),armor=c.armor*(1+c.armorLevel*.11);
  const multiplier=zone==='front'?1.2:zone==='rear'?.7:1;
  const dealt=amount*multiplier/armor;
  c.health=Math.max(0,c.health-dealt);c.damage[zone]=Math.min(1,c.damage[zone]+dealt/72);
  c.damageVersion++;c.impact=Math.min(1,c.impact+dealt/20);
  if(attacker!==null&&attacker!==undefined){c.lastHitBy=attacker;c.lastHitAt=world.t;}
  if(c.health<=0){
    c.alive=false;c.throttle=0;
    const killer=world.cars.find(v=>v.id===c.lastHitBy);
    if(killer&&world.t-c.lastHitAt<12)killer.kills++;
    world.events.push({type:'wreck',x:c.x,z:c.z,id:c.id,a:c.id,b:attacker,force:dealt});
  }
}

function solveContact(world,a,b,contact,withDamage=true) {
  const n=contact.normal;
  const ra={x:contact.x-a.x,z:contact.z-a.z},rb={x:contact.x-b.x,z:contact.z-b.z};
  const va=contactVelocity(a,ra),vb=contactVelocity(b,rb);
  const rv={x:vb.x-va.x,z:vb.z-va.z},normalSpeed=dot(rv,n);
  const invMass=a.invMass+b.invMass;
  if(invMass<=0)return;
  const correction=Math.max(0,contact.depth-.006)*.8/invMass;
  a.x-=n.x*correction*a.invMass;a.z-=n.z*correction*a.invMass;
  b.x+=n.x*correction*b.invMass;b.z+=n.z*correction*b.invMass;
  if(normalSpeed>=0)return;
  const angA=yawTorque(ra,n),angB=yawTorque(rb,n);
  const effective=invMass+angA*angA/(a.inertia||Infinity)+angB*angB/(b.inertia||Infinity);
  const j=-(1+.13)*normalSpeed/effective;
  const impulse={x:n.x*j,z:n.z*j};
  applyImpulse(a,{x:-impulse.x,z:-impulse.z},ra);applyImpulse(b,impulse,rb);
  // Coulomb friction at the impact point dissipates scraping energy.
  const tangent={x:-n.z,z:n.x};
  const vaf=contactVelocity(a,ra),vbf=contactVelocity(b,rb);
  const vt=(vbf.x-vaf.x)*tangent.x+(vbf.z-vaf.z)*tangent.z;
  const ta=yawTorque(ra,tangent),tb=yawTorque(rb,tangent);
  const denom=invMass+ta*ta/(a.inertia||Infinity)+tb*tb/(b.inertia||Infinity);
  const jt=clamp(-vt/denom,-j*.32,j*.32);
  applyImpulse(a,{x:-tangent.x*jt,z:-tangent.z*jt},ra);
  applyImpulse(b,{x:tangent.x*jt,z:tangent.z*jt},rb);
  if(!withDamage||normalSpeed> -2.1)return;
  const key=[a.id,b.id].sort().join(':');
  if(world.t-(world.collisionCooldown.get(key)||-10)<.16)return;
  world.collisionCooldown.set(key,world.t);
  const severity=Math.max(0,-normalSpeed-1.8);
  const amount=severity*severity*.065+severity*.36;
  if(a.invMass){damageCar(world,a,amount*(b.invMass?b.mass/(a.mass+b.mass)*1.8:.85),contact.x,contact.z,b.invMass?b.id:null);if(b.invMass)a.hits++;}
  if(b.invMass){damageCar(world,b,amount*a.mass/(a.mass+b.mass)*1.8,contact.x,contact.z,a.id);b.hits++;}
  world.events.push({type:'impact',x:contact.x,z:contact.z,force:severity,a:a.id,b:b.invMass?b.id:null,
    normal:{...n},amount});
}

function aiInput(world,c,dt) {
  const living=world.cars.filter(v=>v.alive&&v.id!==c.id);
  if(!living.length)return {throttle:0,steer:0,handbrake:false};
  c.aiThink-=dt;
  if(c.aiThink<=0||!world.cars.some(v=>v.id===c.aiTarget&&v.alive)) {
    // Favor the player without making all opponents a synchronized swarm.
    let best=null,bestScore=Infinity;
    for(const v of living){const dist=Math.hypot(v.x-c.x,v.z-c.z)*(v.player?.83:1);if(dist<bestScore){bestScore=dist;best=v;}}
    c.aiTarget=best.id;c.aiThink=.5+world.random()*.5;
  }
  const target=world.cars.find(v=>v.id===c.aiTarget)||living[0];
  const dist=Math.hypot(target.x-c.x,target.z-c.z);
  const lead=clamp(dist/35,0,.6);
  let tx=target.x+target.vx*lead,tz=target.z+target.vz*lead;
  // Recover from dead cars, walls and repeated bumper pushing.
  c.aiStuck=speed(c)<1.4?c.aiStuck+dt:Math.max(0,c.aiStuck-dt*2);
  if(c.aiStuck>1.7){c.aiReverse=1.0+world.random()*.55;c.aiStuck=0;}
  if(c.aiReverse>0){c.aiReverse-=dt;return {throttle:-.9,steer:Math.sin(c.id*8.3)>0?1:-1,handbrake:false};}
  const bx=world.bounds.x-7,bz=world.bounds.z-7;
  if(Math.abs(c.x)>bx||Math.abs(c.z)>bz){tx=0;tz=0;}
  for(const o of world.obstacles){
    const d=Math.hypot(c.x-o.x,c.z-o.z);
    if(d<11&&dot(axisF(c),{x:o.x-c.x,z:o.z-c.z})>0){
      tx+= (c.x-o.x)/Math.max(d,1)*12;tz+=(c.z-o.z)/Math.max(d,1)*12;
    }
  }
  const desired=Math.atan2(tx-c.x,tz-c.z)+c.aiOffset*.05;
  const error=wrap(desired-c.angle);
  const forwardSpeed=c.vx*Math.sin(c.angle)+c.vz*Math.cos(c.angle);
  const throttle=Math.abs(error)>2.3&&dist<9?-.7:Math.abs(error)>1.2?.53:1;
  return {throttle,steer:clamp(error*1.65,-1,1),handbrake:Math.abs(error)>1.6&&forwardSpeed>11};
}

function integrateCar(c,input,dt) {
  c.impact=Math.max(0,c.impact-dt*3);
  const f=axisF(c),r=axisR(c);
  const forward=c.vx*f.x+c.vz*f.z,lateral=c.vx*r.x+c.vz*r.z;
  let throttle=c.alive?clamp(Number(input.throttle)||0,-1,1):0;
  const targetSteer=c.alive?clamp(Number(input.steer)||0,-1,1):0;
  c.steer+=(targetSteer-c.steer)*(1-Math.exp(-dt*9));c.throttle=throttle;
  const damagedEngine=1-c.damage.front*.47;
  const engine=c.power*(1+c.engineLevel*.08)*damagedEngine;
  const maxSpeed=c.maxSpeed*(1+c.engineLevel*.025)*damagedEngine;
  const braking=throttle!==0&&Math.sign(throttle)!==Math.sign(forward)&&Math.abs(forward)>1.6;
  let longitudinalForce=throttle*engine*(braking?1.8:1);
  if(!braking&&Math.abs(forward)>maxSpeed*(throttle<0?.45:1))longitudinalForce=0;
  const rolling=forward*(c.alive?70:220)+forward*Math.abs(forward)*2.6;
  longitudinalForce-=rolling;
  // Tire side force is capped by the available grip; handbrake releases the rear.
  const wheelDamage=Math.max(c.damage.left,c.damage.right);
  const grip=(input.handbrake?.27:1)*(1-wheelDamage*.36)*(1+c.handlingLevel*.035);
  const desiredLateral=-lateral*c.mass*(c.alive?6.6:2.8)*grip;
  const lateralForce=clamp(desiredLateral,-c.mass*9*grip,c.mass*9*grip);
  c.vx+=(f.x*longitudinalForce+r.x*lateralForce)*c.invMass*dt;
  c.vz+=(f.z*longitudinalForce+r.z*lateralForce)*c.invMass*dt;
  // Bicycle steering target, softened at speed so the heavy vehicles resist snapping.
  const steeringAngle=c.steer*.55*c.handling/(1+Math.abs(forward)*.022);
  const desiredYaw=forward/(c.halfLength*1.35)*Math.tan(steeringAngle)*(input.handbrake?1.48:1);
  const steerGrip=c.alive?(1-Math.exp(-dt*(input.handbrake?2.5:5.0)*grip)):0;
  c.omega+=(desiredYaw-c.omega)*steerGrip;
  c.omega*=Math.exp(-dt*(c.alive?.65:2.6));
  c.omega=clamp(c.omega,-4.2,4.2);
  c.x+=c.vx*dt;c.z+=c.vz*dt;c.angle=wrap(c.angle+c.omega*dt);
  c.slip=Math.abs(lateral)+(input.handbrake?Math.abs(forward)*.25:0);
  c.wheelRotation+=forward*dt/.43;
}

function staticBody(o,id) {return {...o,id,invMass:0,mass:Infinity,inertia:Infinity,vx:0,vz:0,omega:0};}

export function stepWorld(world,dt,input={}) {
  world.events=[];
  if(world.finished)return world;
  dt=clamp(Number(dt)||0,0,.1);
  world.lastInput={...input};
  const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
  const bx=world.bounds.x,bz=world.bounds.z;
  const walls=[
    staticBody({x:-bx-1,z:0,halfWidth:1,halfLength:bz+3,angle:0},'wallL'),
    staticBody({x:bx+1,z:0,halfWidth:1,halfLength:bz+3,angle:0},'wallR'),
    staticBody({x:0,z:-bz-1,halfWidth:bx+3,halfLength:1,angle:0},'wallN'),
    staticBody({x:0,z:bz+1,halfWidth:bx+3,halfLength:1,angle:0},'wallS'),
    ...world.obstacles.map((o,i)=>staticBody(o,'obstacle'+i))
  ];
  for(let s=0;s<steps;s++){
    world.t+=h;
    for(const c of world.cars)integrateCar(c,c.player?input:aiInput(world,c,h),h);
    for(let pass=0;pass<2;pass++){
      for(let i=0;i<world.cars.length;i++){
        const a=world.cars[i];
        for(let j=i+1;j<world.cars.length;j++){
          const b=world.cars[j];
          if(Math.abs(a.x-b.x)>a.halfLength+b.halfLength||Math.abs(a.z-b.z)>a.halfLength+b.halfLength)continue;
          const contact=contactOBB(a,b);if(contact)solveContact(world,a,b,contact,pass===0);
        }
        for(const b of walls){const contact=contactOBB(a,b);if(contact)solveContact(world,a,b,contact,pass===0);}
        // A final numerical failsafe keeps wrecks inside the arena at extreme impacts.
        a.x=clamp(a.x,-bx+.15,bx-.15);a.z=clamp(a.z,-bz+.15,bz-.15);
      }
    }
    const alive=world.cars.filter(c=>c.alive);
    const player=world.cars.find(c=>c.player)||world.cars[0];
    if(!player.alive||alive.length<=1||world.t>=world.timeLimit){
      world.finished=true;
      world.winner=alive.length===1?alive[0].id:!player.alive?null:
        [...alive].sort((a,b)=>(b.health+b.kills*18)-(a.health+a.kills*18))[0]?.id??null;
      world.events.push({type:'finish',winner:world.winner});break;
    }
  }
  return world;
}

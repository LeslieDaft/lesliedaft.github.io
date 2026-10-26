export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const CARS=[{name:'1989 Courier',price:0,power:8.5,grip:5.8,max:41,value:900},{name:'Metro Hybrid',price:6500,power:11,grip:7,max:48,value:5200},{name:'Sport Wagon',price:18000,power:15,grip:8,max:63,value:14500}];
export function fresh(duration=10){return {cash:1200,age:20,rep:4.8,reviews:0,deliveries:0,late:0,earned:0,costs:0,fines:0,arrests:0,car:0,tires:0,brakes:0,foodUpgrade:0,fuel:100,condition:100,elapsed:0,duration,x:0,z:12,a:Math.PI/2,orders:[],history:[]};}
// The legal limit is separate from the vehicle's available top speed.
export const SPEED_LIMIT_MPH=45;
export const SPEEDING_TOLERANCE_MPH=8;
export function speedingMph(speed){return Math.max(0,Math.abs(speed)*2.237-SPEED_LIMIT_MPH);}
export function isSpeeding(speed){return speedingMph(speed)>SPEEDING_TOLERANCE_MPH;}
export function drive(p,input,dt,car,wet=false,tires=0,brakes=0,assist=true){
  let f={x:Math.sin(p.a),z:Math.cos(p.a)},r={x:Math.cos(p.a),z:-Math.sin(p.a)};
  let v=p.vx*f.x+p.vz*f.z,l=p.vx*r.x+p.vz*r.z;
  const grip=(car.grip+tires*.8)*(wet?.70:1)*(input.handbrake?.22:1);
  // Keyboard, gamepad and touch all move the same progressive steering rack.
  // Exponential response keeps the easing independent of frame/substep rate.
  const targetSteer=clamp(input.steer||0,-1,1);
  p.steer=(Number.isFinite(p.steer)?p.steer:0)+(targetSteer-(Number.isFinite(p.steer)?p.steer:0))*(1-Math.exp(-5.5*dt));
  const steer=p.steer*clamp(1-Math.abs(v)/95,.30,1);
  const rawYaw=steer*v/2.65*Math.tan(.38)*Math.min(1,grip/(Math.abs(v)*.16+.01));
  // Broader turns at road speed; low-speed parking still has useful lock.
  const maxYaw=(car.grip+tires*.8)*2.5/Math.max(3,Math.abs(v));
  const yawLimit=maxYaw*Math.abs(p.steer);
  const desiredYaw=clamp(rawYaw,-yawLimit,yawLimit);
  const yaw=(Number.isFinite(p.yaw)?p.yaw:0)+(desiredYaw-(Number.isFinite(p.yaw)?p.yaw:0))*(1-Math.exp(-9*dt));
  p.a+=yaw*dt;p.yaw=yaw;
  const accel=input.throttle*car.power*(1-Math.abs(v)/car.max)-Math.sign(v)*(.1+v*v*.0018);
  v+=accel*dt;
  const braking=(input.brake?13+brakes*2:0)+(input.handbrake?3:0);
  v=Math.sign(v)*Math.max(0,Math.abs(v)-braking*dt);
  if(Math.abs(v)<.1&&!input.throttle)v=0;
  l-=yaw*v*dt*.50;l*=Math.exp(-grip*(assist?1.25:1)*dt);
  f={x:Math.sin(p.a),z:Math.cos(p.a)};r={x:Math.cos(p.a),z:-Math.sin(p.a)};
  p.vx=f.x*v+r.x*l;p.vz=f.z*v+r.z*l;p.x+=p.vx*dt;p.z+=p.vz*dt;p.speed=v;p.slip=Math.abs(l);
  return p;
}
export function payout(order,rep){const late=order.remaining<0,quality=clamp(order.quality,0,100);return {base:order.pay,tip:late?0:Math.round(order.pay*(.25+rep*.08)*quality/100),stars:late?clamp(3+order.remaining/45,1,3):clamp(3+quality/50,3,5),late};}
export function review(state,stars){state.rep=clamp((state.rep*8+stars)/9,1,5);state.reviews++;}
export function advance(state,seconds){state.elapsed+=seconds;state.age=clamp(20+state.elapsed/(state.duration*3600)*60,20,80);return state.age>=80;}
export function settle(state,order){const p=payout(order,state.rep);state.cash+=p.base+p.tip;state.earned+=p.base+p.tip;state.deliveries++;if(p.late)state.late++;review(state,p.stars);return p;}

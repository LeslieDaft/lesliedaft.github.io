import assert from 'node:assert/strict';
import {drive,CARS,fresh,payout,settle,review,advance,SPEED_LIMIT_MPH,isSpeeding,speedingMph} from './sim.mjs';
const empty=()=>({x:0,z:0,a:0,vx:0,vz:0});
let p=empty();for(let i=0;i<600;i++)drive(p,{throttle:1,steer:0},1/60,CARS[0]);assert(p.speed>25&&p.speed<41);assert(Math.abs(p.x)<1e-8);
for(let i=0;i<240;i++)drive(p,{throttle:0,steer:0,brake:true},1/60,CARS[0]);assert(Math.abs(p.speed)<.1);
let dry={...empty(),vz:25},wet={...empty(),vz:25};for(let i=0;i<60;i++){drive(dry,{throttle:0,steer:1},1/60,CARS[0],false);drive(wet,{throttle:0,steer:1},1/60,CARS[0],true);}assert(wet.slip>dry.slip,'wet road should lose more lateral grip');
let drift={...empty(),vz:25};for(let i=0;i<60;i++)drive(drift,{throttle:.5,steer:1,handbrake:true},1/60,CARS[0]);assert(drift.slip>dry.slip);
const o={pay:60,remaining:1,quality:100};assert(payout(o,4.8).tip>0);assert.equal(payout({...o,remaining:-1},4.8).tip,0);assert(payout({...o,quality:30},4.8).tip<payout(o,4.8).tip);
const s=fresh();const initial=s.rep;settle(s,{...o,remaining:-80});assert(s.rep<initial);assert.equal(s.cash,1260);assert.equal(s.late,1);for(let i=0;i<30;i++)review(s,5);assert(s.rep>4.8,'reputation must recover');
const life=fresh(.25);assert.equal(advance(life,450),false);assert.equal(life.age,50);assert.equal(advance(life,450),true);assert.equal(life.age,80);
assert.deepEqual(JSON.parse(JSON.stringify(s)),s,'career and orders serialize cleanly');
console.log('PASS: acceleration, braking, wet grip, drifting, tips, late delivery, reputation recovery, career end, save roundtrip');

// Steering starts gently, builds through a held turn, then recentres progressively.
let eased={...empty(),vz:20};drive(eased,{throttle:0,steer:1},1/60,CARS[0]);
const initialYaw=eased.yaw;assert(initialYaw>0&&initialYaw<.1,'first frame must not snap to full cornering');
for(let i=0;i<30;i++)drive(eased,{throttle:0,steer:1},1/60,CARS[0]);
assert(eased.yaw>initialYaw*10,'held input builds a usable turn');
const heldSteer=eased.steer;drive(eased,{throttle:0,steer:0},1/60,CARS[0]);
assert(eased.steer>0&&eased.steer<heldSteer,'release eases toward centre');
for(let i=0;i<60;i++)drive(eased,{throttle:0,steer:-1},1/60,CARS[0]);
assert(eased.yaw<-.4,'counter-steering must reach the opposite direction');
const rack=[];for(const hz of [30,60,120]){const car={...empty(),vz:20};for(let i=0;i<hz/2;i++)drive(car,{throttle:0,steer:1},1/hz,CARS[0]);rack.push(car);}
assert(Math.max(...rack.map(p=>p.a))-Math.min(...rack.map(p=>p.a))<.025,'turn response must remain similar across frame rates');
assert.equal(SPEED_LIMIT_MPH,45);assert.equal(isSpeeding(45/2.237),false);assert.equal(isSpeeding(52/2.237),false);assert.equal(isSpeeding(54/2.237),true);assert.equal(isSpeeding(-54/2.237),true);assert(Math.abs(speedingMph(50/2.237)-5)<1e-10);
assert(p.speed<.1,'earlier braking still stopped the car');
console.log('PASS: progressive steering, release, counter-steering, frame rates, 45 mph legal limit and police tolerance');

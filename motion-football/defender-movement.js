import {integrateRunner} from './football-game.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Identical throttle and steering to offense. A dive commits existing momentum.
export function integrateDefender(state,input,dt,top,ready=false){
 const step=clamp(dt,0,.1),id=Number.isSafeInteger(input.diveId)?input.diveId:0;
 if(id>(state.diveId||0)){state.diveId=id;if(!ready&&!state.dive&&!(state.diveCooldown>0)){const x=Math.sin(state.yaw),z=Math.cos(state.yaw);state.dive={age:0,x,z};state.vx=(state.vx||0)*.7+x*3;state.vz=(state.vz||0)*.7+z*3;state.diveCooldown=1.6;}}
 state.diveCooldown=Math.max(0,(state.diveCooldown||0)-step);
 if(state.dive){const d=state.dive;d.age+=step;const drag=d.age<.32?.7:7;state.vx*=Math.exp(-drag*step);state.vz*=Math.exp(-drag*step);state.x+=state.vx*step;state.z+=state.vz*step;state.speed=Math.hypot(state.vx,state.vz);if(d.age>=1.1){state.dive=null;state.stop=true;}}
 else integrateRunner(state,input,step,top);
 state.x=clamp(state.x,-23.6,23.6);if(ready&&state.z<.65){state.z=.65;state.vz=Math.max(0,state.vz);state.speed=Math.hypot(state.vx,state.vz);}return state;
}
export function inTackleReach(actor,target){const dx=target.x-actor.pos.x,dz=target.z-actor.pos.z,distance=Math.hypot(dx,dz),d=actor.dive;if(d){if(d.age>.48)return false;return distance<1.5&&(dx*d.x+dz*d.z)>.1;}return distance<.68;}

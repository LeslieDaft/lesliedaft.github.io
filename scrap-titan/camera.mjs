// Camera and input math is independent of Three.js so heading transitions can be checked directly.
export const CHASE_PITCH = .42;
export function angleDelta(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
export function followAngle(current,target,rate,dt){return current+angleDelta(current,target)*(1-Math.exp(-rate*dt));}
export function screenDirection(x,z,yaw){return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw)};}
export function movementFrame(state,x,z,cameraYaw,orbiting){
 const length=Math.hypot(x,z);if(length<.08){state.active=false;return {x:0,z:0,length:0};}
 const heading=Math.atan2(x,-z);
 // Latch a movement gesture's reference. A chasing camera must not steer held A/D into a circle.
 if(!state.active||orbiting||Math.abs(angleDelta(state.inputHeading,heading))>.35){state.yaw=cameraYaw;state.inputHeading=heading;}
 state.active=true;const scale=Math.max(1,length),world=screenDirection(x/scale,z/scale,state.yaw);return {...world,length:Math.min(1,length)};
}
export function chasePose(x,z,yaw,pitch,distance=64,lookAhead=18){const horizontal=Math.cos(pitch)*distance;return {position:{x:x+Math.sin(yaw)*horizontal,y:7+Math.sin(pitch)*distance,z:z+Math.cos(yaw)*horizontal},target:{x:x-Math.sin(yaw)*lookAhead,y:6.5,z:z-Math.cos(yaw)*lookAhead}};}
export function primaryFire(event){return event.pointerType!=='touch'&&event.button===0;}
// A short camera boom avoids placing the chase camera inside factory walls.
export function clearCameraFraction(anchor,position,walls){let nearest=1;for(const wall of walls){let enter=0,exit=1;const bounds=[[wall.x-wall.hx-1.5,wall.x+wall.hx+1.5,'x'],[0,(wall.height||40)+1.5,'y'],[wall.z-wall.hz-1.5,wall.z+wall.hz+1.5,'z']];let intersects=true;for(const [lo,hi,key] of bounds){const origin=anchor[key],delta=position[key]-origin;if(Math.abs(delta)<1e-8){if(origin<lo||origin>hi){intersects=false;break;}}else{let a=(lo-origin)/delta,b=(hi-origin)/delta;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);exit=Math.min(exit,b);if(enter>exit){intersects=false;break;}}}if(intersects&&enter>0&&enter<nearest)nearest=enter;}return nearest;}

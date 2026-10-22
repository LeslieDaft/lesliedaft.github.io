// Mass is kg. The full kill reward is paid once, only on the killing bite.
import {TYPES} from './species.js';
export const SPECIES=TYPES;
export function statsFor(type,size,base){const s=SPECIES[type];const area=(size/base)**2;return {mass:s.mass*(size/base)**3,maxHp:s.hp*area,damage:s.damage*area,area};}
// Only a swept volume around the attacker's actual mouth can touch a body.
export function mouthHit(from,to,yaw,pitch,size,victim,active=true){
 const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const front=size*(size>=5?.59:.49),reach=active?Math.min(1.1,size*.5)+.35:0;
 const offset={x:c*cp*(front+reach),y:sp*(front+reach),z:-s*cp*(front+reach)};
 const a={x:from.x+offset.x,y:from.y+offset.y,z:from.z+offset.z},b={x:to.x+offset.x,y:to.y+offset.y,z:to.z+offset.z};
 const angle=victim.angle||0,vc=Math.cos(angle),vs=Math.sin(angle),radius=active?.23+size*.25:.06+size*.10;
 const shape=TYPES[victim.type]?.shape,shark=['shark','hammer'].includes(shape);const rx=victim.size*(shark?.65:.55)+radius,ry=victim.size*(shape==='star'?.1:shape==='ray'?.095:shape==='eel'?.13:shark?.17:['deep','angel','lion','horse'].includes(shape)?.34:shape==='puffer'?.36:.23)+radius,rz=victim.size*(shape==='ray'?.36:shape==='puffer'?.31:.18)+radius;
 function local(p){const dx=p.x-victim.p.x,dz=p.z-victim.p.z;return {x:dx*vc-dz*vs,y:p.y-victim.p.y,z:dx*vs+dz*vc}}
 const l=local(a),r=local(b),dx=(r.x-l.x)/rx,dy=(r.y-l.y)/ry,dz=(r.z-l.z)/rz;
 const ax=l.x/rx,ay=l.y/ry,az=l.z/rz,len=dx*dx+dy*dy+dz*dz;
 const t=len?Math.max(0,Math.min(1,-(ax*dx+ay*dy+az*dz)/len)):0;
 if((ax+t*dx)**2+(ay+t*dy)**2+(az+t*dz)**2>1)return null;
 const x=l.x+(r.x-l.x)*t,z=l.z+(r.z-l.z)*t;
 const region=x>victim.size*.28?'head':x<-victim.size*.32?'tail':Math.abs(z)>victim.size*.09?'flank':'back';
 return {point:{x:l.x+(r.x-l.x)*t,y:l.y+(r.y-l.y)*t,z:l.z+(r.z-l.z)*t},region,multiplier:region==='head'?1.5:region==='tail'?.5:region==='back'?.75:1};
}
export function takeChunk(target,damage,multiplier=1){const removed=Math.min(target.hp,Math.max(0,damage*multiplier));target.hp=Math.max(0,target.hp-removed);const mass=target.mass*removed/target.maxHp;target.remainingMass=Math.max(0,target.remainingMass-mass);const killed=target.hp<=.000001;const xp=killed&&!target.rewardClaimed?target.mass*8:0;if(killed)target.rewardClaimed=true;return {damage:removed,xp,mass,killed};}

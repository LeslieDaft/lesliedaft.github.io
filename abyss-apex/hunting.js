export function grownSize(stages,stage,food){const base=stages[stage][1];if(stage===stages.length-1)return base;const prev=stage?stages[stage-1][3]:0;const t=Math.max(0,Math.min(1,(food-prev)/(stages[stage][3]-prev)));return base+(stages[stage+1][1]-base)*t}
export function forwardVector(yaw,pitch){return {x:Math.cos(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.sin(yaw)*Math.cos(pitch)}}
export function biteGeometry(from,to,prey,size,preySize,direction,lunging){
 const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z,len=dx*dx+dy*dy+dz*dz;
 const t=len?Math.max(0,Math.min(1,((prey.x-from.x)*dx+(prey.y-from.y)*dy+(prey.z-from.z)*dz)/len)):1;
 const x=prey.x-(from.x+dx*t),y=prey.y-(from.y+dy*t),z=prey.z-(from.z+dz*t);
 const ahead=x*direction.x+y*direction.y+z*direction.z;
 const width=Math.sqrt(Math.max(0,x*x+y*y+z*z-ahead*ahead));
 const reach=size*(lunging?1.8:1.05)+(lunging?.9:.38)+preySize*.4;
 return ahead>=-size*.3&&ahead<=reach&&width<=size*(lunging?.68:.45)+(lunging?.5:.2)+preySize*.35;
}
export function escapePace(fatigue,time,seed){return (.98-.42*Math.min(1,fatigue))*(Math.sin(time*1.7+seed)>.86?.42:1)}

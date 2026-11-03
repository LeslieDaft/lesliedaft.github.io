// Time-sampled routes keep prediction, coverage, and planted feet on one path.
export function extendScramble(table, curve, length, profile, seed, endZone=90) {
 const top=Math.max(2,Math.min(90,endZone)), step=.02;
 let randomState=seed>>>0;
 const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
 let position=curve.getPointAt(0), velocity=curve.getTangentAt(0).setY(0).multiplyScalar(table[0].speed), distance=0, goal=null, nextChoice=0, scrambling=false, yaw=0;
 for(let i=0;i<table.length;i++) {
  const row=table[i], t=i*step, nominal=curve.getPointAt(Math.min(1,row.distance/length)), tangent=curve.getTangentAt(Math.min(1,row.distance/length)).setY(0).normalize();
  if(row.distance>length)nominal.addScaledVector(tangent,row.distance-length);
  // Start the turn with braking room, before either foot reaches the stripe.
  if(!scrambling&&(Math.abs(nominal.x)>19.8||nominal.z>top-2)) {scrambling=true;position=table[Math.max(0,i-1)].point.clone();velocity=table[Math.max(0,i-1)].forward.clone().multiplyScalar(row.speed);}
  if(scrambling){
   if(!goal||t>nextChoice||position.distanceTo(goal)<1.4){
    const across=random()<.62, side=position.x>=0?1:-1;
    const x=across?position.x-side*(6+random()*12):position.x+(random()-.5)*8;
    const z=position.z+(random()-.55)*13;
    goal=position.clone().set(Math.max(-18,Math.min(18,x)),0,Math.max(1,Math.min(top-3,z)));
    nextChoice=t+1.7+random()*1.6;
   }
   const delta=goal.clone().sub(position), desired=delta.normalize().multiplyScalar(Math.min(8.7*profile.pace,Math.sqrt(position.distanceTo(goal)*18)));
   // Boundary braking supplements, rather than teleports, the receiver.
   if(Math.abs(position.x)>20)desired.x=-Math.sign(position.x)*Math.max(Math.abs(desired.x),3);
   if(position.z>top-2)desired.z=-Math.max(Math.abs(desired.z),3);
   velocity.add(desired.sub(velocity).clampLength(0,11*step));
   position.addScaledVector(velocity,step);distance+=velocity.length()*step;
   row.speed=velocity.length();row.distance=distance;
   const heading=Math.atan2(velocity.x,velocity.z);row.turn=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw))/(step*Math.max(1,row.speed));yaw=heading;
   row.point=position.clone();row.forward=velocity.clone().normalize();
  }else{position=nominal;distance=row.distance;row.point=position.clone();row.forward=tangent;yaw=Math.atan2(tangent.x,tangent.z);}
  row.scrambling=scrambling;
 }
 return table;
}

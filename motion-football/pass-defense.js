const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Test the swept ball path, so a fast pass cannot tunnel between render frames.
export function contestPass(previous,ball,defenders,{time,release,random,attempted,manualIndex=-1,manualAction=false}){
 if(time-release<.12)return null;
 const vx=ball.x-previous.x,vy=ball.y-previous.y,vz=ball.z-previous.z,length=vx*vx+vy*vy+vz*vz;
 const candidates=[];
 for(let i=0;i<defenders.length;i++){
  const d=defenders[i];if(attempted.has(i))continue;
  const u=length?clamp(((d.pos.x-previous.x)*vx+(1.7-previous.y)*vy+(d.pos.z-previous.z)*vz)/length,0,1):1;
  const point={x:previous.x+vx*u,y:previous.y+vy*u,z:previous.z+vz*u},distance=Math.hypot(d.pos.x-point.x,d.pos.z-point.z),manual=i===manualIndex&&manualAction;
  if(point.y<.5||point.y>(manual?2.85:2.55)||distance>(manual?1.05:.83))continue;
  if(time-release<.12+(d.rating?.reaction||.06))continue;
  candidates.push({i,d,point,distance,manual});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 for(const c of candidates){attempted.add(c.i);const catchChance=(c.manual?.84:.62)-Math.max(0,c.distance-.25)*.45;if(c.distance<(c.manual?.67:.53)&&c.point.y<2.55&&random()<catchChance)return {...c,kind:'interception'};if(random()<(c.manual?.96:.83))return {...c,kind:'swat'};}
 return null;
}

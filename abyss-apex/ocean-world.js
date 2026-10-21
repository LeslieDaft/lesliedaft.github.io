// Ellipsoid volumes are shared by rendering, movement collision, and sight tests.
export const obstacles=[];
for(let i=0;i<26;i++){
 const a=i*2.39996,d=35+Math.sqrt(i)*42;
 obstacles.push({kind:'hill',x:Math.cos(a)*d,y:-2,z:Math.sin(a)*d,rx:16+(i%4)*6,ry:9+(i%5)*4,rz:15+(i%3)*8});
}
for(let i=0;i<40;i++){
 const a=i*2.1,d=20+Math.sqrt(i)*32,x=Math.cos(a)*d,z=Math.sin(a)*d;
 obstacles.push({kind:'reef',color:i%4,x,y:seabedHeight(x,z)-2,z,rx:4+(i%4)*2,ry:6+(i%5)*2,rz:4+(i%3)*2});
}
export function seabedHeight(x,z){let height=-2;for(const o of obstacles){const r=((x-o.x)/o.rx)**2+((z-o.z)/o.rz)**2;if(r<1)height=Math.max(height,o.y+o.ry*Math.sqrt(1-r))}return height}
export function clearSight(a,b){for(const o of obstacles){
 const ax=(a.x-o.x)/o.rx,ay=(a.y-o.y)/o.ry,az=(a.z-o.z)/o.rz;
 const dx=(b.x-a.x)/o.rx,dy=(b.y-a.y)/o.ry,dz=(b.z-a.z)/o.rz;
 const len=dx*dx+dy*dy+dz*dz;if(!len)continue;
 const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy+az*dz)/len));
 if((ax+dx*t)**2+(ay+dy*t)**2+(az+dz*t)**2<.998)return false;
 }return true}
export function resolveTerrain(p,radius=0){let hit=false;
 for(let pass=0;pass<3;pass++)for(const o of obstacles){
 const rx=o.rx+radius,ry=o.ry+radius,rz=o.rz+radius;
 let x=(p.x-o.x)/rx,y=(p.y-o.y)/ry,z=(p.z-o.z)/rz;
 const d=Math.sqrt(x*x+y*y+z*z);if(d>=1)continue;
 if(d<.001){x=0;y=1;z=0}else{x/=d;y/=d;z/=d}
 p.x=o.x+x*rx*1.002;p.y=o.y+y*ry*1.002;p.z=o.z+z*rz*1.002;hit=true;
 }return hit}

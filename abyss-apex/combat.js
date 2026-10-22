// Mass is kg. Total edible XP is 8 per kg, paid only as flesh is removed.
export const SPECIES=[
 {name:'Goldfish',mass:.1,hp:8,damage:2},
 {name:'Bluegill',mass:.5,hp:18,damage:3},
 {name:'Bass',mass:3,hp:40,damage:6},
 {name:'Barracuda',mass:12,hp:85,damage:12},
 {name:'Reef shark',mass:35,hp:300,damage:25},
 {name:'Tiger shark',mass:180,hp:650,damage:50},
 {name:'Great white',mass:500,hp:1300,damage:100},
 {name:'Megalodon',mass:5000,hp:4000,damage:300},
 {name:'Starfish',mass:.03,hp:1,damage:0}
];
export function statsFor(type,size,base){const s=SPECIES[type];const area=(size/base)**2;return {mass:s.mass*(size/base)**3,maxHp:s.hp*area,damage:s.damage*area,area};}
// Only a swept volume around the attacker's actual mouth can touch a body.
export function mouthHit(from,to,yaw,pitch,size,victim,active=true){
 const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const front=size*(size>=5?.59:.49),reach=active?Math.min(.65,size*.28)+.18:0;
 const offset={x:c*cp*(front+reach),y:sp*(front+reach),z:-s*cp*(front+reach)};
 const a={x:from.x+offset.x,y:from.y+offset.y,z:from.z+offset.z},b={x:to.x+offset.x,y:to.y+offset.y,z:to.z+offset.z};
 const angle=victim.angle||0,vc=Math.cos(angle),vs=Math.sin(angle),radius=active?.13+size*.18:.06+size*.10;
 const rx=victim.size*(victim.type>=4&&victim.type<8?.65:.52)+radius,ry=victim.size*(victim.type===8?.1:victim.type>=4?.17:.29)+radius,rz=victim.size*.18+radius;
 function local(p){const dx=p.x-victim.p.x,dz=p.z-victim.p.z;return {x:dx*vc-dz*vs,y:p.y-victim.p.y,z:dx*vs+dz*vc}}
 const l=local(a),r=local(b),dx=(r.x-l.x)/rx,dy=(r.y-l.y)/ry,dz=(r.z-l.z)/rz;
 const ax=l.x/rx,ay=l.y/ry,az=l.z/rz,len=dx*dx+dy*dy+dz*dz;
 const t=len?Math.max(0,Math.min(1,-(ax*dx+ay*dy+az*dz)/len)):0;
 if((ax+t*dx)**2+(ay+t*dy)**2+(az+t*dz)**2>1)return null;
 const x=l.x+(r.x-l.x)*t,z=l.z+(r.z-l.z)*t;
 const region=x>victim.size*.28?'head':x<-victim.size*.32?'tail':Math.abs(z)>victim.size*.09?'flank':'back';
 return {region,multiplier:region==='head'?1.5:region==='tail'?.5:region==='back'?.75:1};
}
export function takeChunk(target,damage,multiplier=1){const removed=Math.min(target.hp,Math.max(0,damage*multiplier));target.hp=Math.max(0,target.hp-removed);const mass=target.mass*removed/target.maxHp;target.remainingMass=Math.max(0,target.remainingMass-mass);return {damage:removed,xp:mass*8,mass,killed:target.hp<=.000001};}

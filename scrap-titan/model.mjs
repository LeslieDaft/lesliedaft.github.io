export const WORLD_HALF = 1200;
export const PARTS = Object.freeze({
 cannon:{name:'Bastion cannon',kind:'weapon',price:260,mass:14,damage:36,rate:.65,speed:240,range:290,color:0xffb650,desc:'Heavy shells. Strong impact, visible recoil.'},
 gatling:{name:'Mantis rotary gun',kind:'weapon',price:340,mass:9,damage:7,rate:.085,speed:330,range:240,color:0x9adfff,desc:'Six barrels. Fast fire, light recoil.'},
 rail:{name:'Arc railgun',kind:'weapon',price:680,mass:19,damage:100,rate:1.5,speed:550,range:410,color:0x73ffff,desc:'Long-range precision. Punches through armor.'},
 rocket:{name:'Hailstorm launcher',kind:'weapon',price:520,mass:16,damage:58,rate:1.1,speed:180,range:340,color:0xff8066,desc:'Explosive shells damage nearby enemies.'},
 plate:{name:'Layered armor',kind:'armor',price:240,mass:13,hp:90,color:0x566b75,desc:'+90 hull. Adds a plated torso jacket.'},
 reactive:{name:'Reactive armor',kind:'armor',price:560,mass:19,hp:180,color:0x6d705c,desc:'+180 hull. Heavy explosive-resistant panels.'},
 biped:{name:'Strider legs',kind:'legs',price:190,mass:8,speed:1.15,color:0x80959c,desc:'Fast articulated biped. +15% stride speed.'},
 quad:{name:'Crawler legs',kind:'legs',price:470,mass:23,speed:.92,hp:80,color:0x929a80,desc:'Four legs. +80 hull; stable under heavy guns.'},
 booster:{name:'Vector thrusters',kind:'back',price:400,mass:8,dash:1.55,color:0xffaa55,desc:'Longer dash, shorter recharge. Twin exhausts.'},
 reactor:{name:'Salvage reactor',kind:'back',price:650,mass:12,repair:1.3,color:0x6cffff,desc:'Repairs 1.3 hull/sec outside combat.'}
});
export const SLOTS = Object.freeze([{id:'left',name:'Left arm',kind:'weapon'},{id:'right',name:'Right arm',kind:'weapon'},{id:'shoulder',name:'Shoulder',kind:'weapon'},{id:'armor',name:'Torso armor',kind:'armor'},{id:'legs',name:'Leg assembly',kind:'legs'},{id:'back',name:'Backpack',kind:'back'}]);
export function fresh(){return {credits:650,inventory:{cannon:1,gatling:1,plate:1,biped:1},equipped:{left:'cannon',right:'gatling',shoulder:null,armor:'plate',legs:'biped',back:null},best:0,cores:[],totalKills:0};}
export function validateSave(raw){const d=fresh();if(!raw||typeof raw!=='object')return d;d.credits=Math.max(0,Math.min(1e7,Math.floor(Number(raw.credits)||0)));d.inventory={};for(const key of Object.keys(PARTS)){const n=Number(raw.inventory?.[key]);if(Number.isInteger(n)&&n>0)d.inventory[key]=Math.min(99,n);}d.equipped={};const used={};for(const s of SLOTS){const id=raw.equipped?.[s.id];if(PARTS[id]?.kind===s.kind&&(used[id]||0)<(d.inventory[id]||0)){d.equipped[s.id]=id;used[id]=(used[id]||0)+1;}else d.equipped[s.id]=null;}if(!d.equipped.legs){d.inventory.biped=Math.max(1,d.inventory.biped||0);d.equipped.legs='biped';}d.best=Math.max(0,Math.floor(Number(raw.best)||0));d.totalKills=Math.max(0,Math.floor(Number(raw.totalKills)||0));d.cores=Array.isArray(raw.cores)?raw.cores.filter(x=>Number.isInteger(x)&&x>=0&&x<6):[];return d;}
export function stats(equipped){let mass=0,hp=200,speed=1,dash=1,repair=0;for(const id of Object.values(equipped)){const p=PARTS[id];if(!p)continue;mass+=p.mass;hp+=p.hp||0;if(p.kind==='legs')speed=p.speed;if(p.dash)dash=p.dash;if(p.repair)repair=p.repair;}return {mass,hp,speed:43*speed/(1+Math.max(0,mass-45)*.009),dash,repair};}
export function available(data,id,excludingSlot){return (data.inventory[id]||0)-Object.entries(data.equipped).filter(([slot,v])=>v===id&&slot!==excludingSlot).length;}
export function equip(data,slotId,id){const slot=SLOTS.find(s=>s.id===slotId);if(!slot||!PARTS[id]||PARTS[id].kind!==slot.kind||available(data,id,slotId)<1)return false;data.equipped[slotId]=id;return true;}
export function buy(data,id){const p=PARTS[id];if(!p||data.credits<p.price||(data.inventory[id]||0)>=99)return false;data.credits-=p.price;data.inventory[id]=(data.inventory[id]||0)+1;return true;}
export function insideWorld(x,z){return Math.abs(x)<WORLD_HALF-18&&Math.abs(z)<WORLD_HALF-18;}
export function pointSegmentDistanceSquared(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;const t=l?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/l)):0;return (px-ax-t*dx)**2+(pz-az-t*dz)**2;}

// Every playable animal begins as a juvenile; adult dimensions belong to ocean NPCs.
const fish=(name,size,color,mass,hp,damage,shape,perk,mods={})=>({name,size,color,mass,hp,damage,shape,perk,speed:1,health:1,power:1,armor:1,regen:1,cooldown:1,...mods});
export const TYPES=[
 fish('Goldfish',.65,0xffb43e,.1,8,2,'fan','Hardy: +45% health and faster recovery',{health:1.45,regen:1.4}),
 fish('Bluegill',1.15,0x76a687,.5,18,3,'deep','Armored scales: 25% less incoming damage',{armor:.75}),
 fish('Bass',2.1,0x6a9274,3,40,6,'bass','Wide jaws: +25% bite damage',{power:1.25}),
 fish('Barracuda',3.8,0xa8c4c2,12,85,12,'needle','Pursuit: +25% swim speed',{speed:1.25}),
 fish('Reef shark',6.8,0x849caa,35,300,25,'shark','Serrated bite: +35% damage',{power:1.35}),
 fish('Tiger shark',11,0x7c9291,180,650,50,'shark','Heavy hunter: +30% health, +15% bite',{health:1.3,power:1.15,speed:.92}),
 fish('Great white',18,0x899da8,500,1300,100,'shark','Power jaws: +55% bite, 15% slower bites',{power:1.55,cooldown:1.15}),
 fish('Megalodon',30,0x718b98,5000,4000,300,'shark','Titan juvenile: +70% health, 15% slower swim',{health:1.7,speed:.85}),
 {name:'Starfish',size:.45,color:0xda965f,mass:.03,hp:1,damage:0,shape:'star'},
 fish('Clownfish',.6,0xf47c26,.08,7,2,'deep','Quick nips: 30% shorter bite cooldown',{cooldown:.7}),
 fish('Blue tang',.9,0x2672e9,.18,12,3,'deep','Reef runner: +20% swim and +15% health',{speed:1.2,health:1.15}),
 fish('Lionfish',1.2,0xa76f57,.7,24,4,'lion','Spiny armor: 40% less incoming damage',{armor:.6,speed:.88}),
 fish('Pufferfish',1,0xbeb57a,.9,30,3,'puffer','Thick hide: +60% health, 20% slower swim',{health:1.6,speed:.8}),
 fish('Angelfish',.8,0xe5c66b,.16,10,2,'angel','Agility: +25% swim, 15% faster bites',{speed:1.25,cooldown:.85}),
 fish('Bluefin tuna',4.2,0x527f9a,60,180,18,'tuna','Endurance: +30% swim and 40% faster burst recovery',{speed:1.3,burstRegen:1.4}),
 fish('Hammerhead',8,0x7d9b9c,110,450,35,'hammer','Broad head: +25% health and +20% damage',{health:1.25,power:1.2}),
 fish('Moray eel',3,0x758456,8,75,10,'eel','Flexible hunter: 35% faster bites, +15% damage',{cooldown:.65,power:1.15}),
 fish('Swordfish',6,0x729fa7,90,230,24,'sword','Ocean sprinter: +35% speed, +20% damage',{speed:1.35,power:1.2,health:.9}),
 fish('Manta ray',7,0x454e62,160,500,16,'ray','Gliding tank: +80% health, 25% less damage',{health:1.8,armor:.75,power:.8}),
 fish('Parrotfish',1.6,0x33c4aa,2,35,6,'bass','Crushing beak: +40% bite damage',{power:1.4}),
 fish('Catfish',2.5,0x8b8275,10,90,9,'cat','Bottom dweller: double health recovery',{regen:2,health:1.2}),
 fish('Seahorse',.7,0xd49c54,.05,12,2,'horse','Patient survivor: +50% health, 40% faster bites',{health:1.5,cooldown:.6,speed:.8}),
 fish('Titan shark',48,0x4c788a,18000,9000,650,'shark','Ocean titan'),
 fish('Sperm whale',72,0x707d8d,65000,24000,1100,'whale','Deep-water hunter'),
 fish('Giant squid',110,0xa66079,180000,45000,1800,'squid','Ten grasping arms'),
 fish('Colossal squid',210,0x875584,1000000,150000,4300,'squid','Abyss giant'),
 fish('Abyssal whale',380,0x314d70,6000000,480000,12000,'whale','Living mountain'),
 fish('Abyssal leviathan',620,0x386c70,25000000,1200000,28000,'serpent','Giant-ocean apex'),
 fish('Giant sea serpent',750,0x4b9290,40000000,2000000,40000,'serpent','Mythical hunter'),
 fish('Leviathan',1050,0x486f9c,120000000,5000000,85000,'serpent','Ancient deep'),
 fish('Kraken',1350,0x713d89,250000000,9000000,140000,'squid','Mythical kraken'),
 fish('World-eater',1800,0x3e375e,600000000,18000000,220000,'serpent','Titan of the dark'),
 fish('Moby Dick',3000,0xe5e8df,3000000000,60000000,600000,'whale','The immense white whale')
];
// Original 21 juvenile choices remain playable; ocean titans are NPC species.
export const SWIMMERS=TYPES.slice(0,22).map((s,i)=>i).filter(i=>i!==8);
export const levelFor=xp=>1+Math.floor(Math.pow(Math.max(0,xp)/6,2/3));
export const levelXP=level=>6*Math.pow(Math.max(0,level-1),1.5);
export function progression(type,xp){const s=TYPES[type],level=levelFor(xp),start=s.shape==='ray'?.85:s.shape==='eel'?.85:.65;
 const size=start*Math.pow(1+Math.max(0,xp)/10,.38),growth=size/start;
 return {level,size,maxHp:16*s.health*Math.pow(growth,1.6)*(1+.18*(level-1)),damage:2*s.power*growth*growth*(1+.12*(level-1)),mass:.1*growth**3,speed:s.speed,armor:s.armor,regen:s.regen,cooldown:.4*s.cooldown};
}

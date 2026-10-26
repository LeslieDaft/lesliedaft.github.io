// Each region maintains its own animals, including after harvesting and respawning.
export const species = [
 {name:'Whitetail deer',color:'#86654a',scale:1,hp:90,meat:18,hide:48,biome:'forest'},
 {name:'Elk',color:'#8f7956',scale:1.5,hp:155,meat:42,hide:105,biome:'forest'},
 {name:'Wild boar',color:'#51493e',scale:.85,hp:110,meat:24,hide:38,biome:'plains',aggression:32,speed:11},
 {name:'Mountain goat',color:'#ded7c1',scale:.9,hp:85,meat:16,hide:70,biome:'mountain',speed:12},
 {name:'Bison',color:'#493c2d',scale:1.85,hp:240,meat:70,hide:150,biome:'plains',aggression:45,speed:12},
 {name:'Black bear',kind:'bear',color:'#282720',scale:1.35,hp:210,meat:40,hide:140,biome:'forest',aggression:40,speed:11},
 {name:'Gray wolf',color:'#777c75',scale:.9,hp:95,meat:12,hide:85,biome:'forest',aggression:50,speed:13},
 {name:'Moose',color:'#514032',scale:1.8,hp:250,meat:65,hide:145,biome:'forest',aggression:28,speed:12},
 {name:'Pronghorn',color:'#b18d59',scale:.95,hp:85,meat:19,hide:60,biome:'plains',speed:15},
 {name:'Bighorn sheep',color:'#a08b71',scale:1,hp:125,meat:26,hide:85,biome:'mountain',aggression:14,speed:10},
 {name:'African elephant',kind:'elephant',color:'#878178',scale:2.3,hp:1400,meat:240,hide:700,biome:'savanna',aggression:55,speed:10,armor:.72,attackDamage:48},
 {name:'Lion',kind:'lion',color:'#b59057',scale:1.22,hp:250,meat:35,hide:250,biome:'savanna',aggression:65,speed:15,attackDamage:30},
 {name:'Grizzly bear',kind:'bear',color:'#6d5137',scale:1.75,hp:410,meat:75,hide:285,biome:'forest',aggression:55,speed:13,attackDamage:35},
 {name:'Polar bear',kind:'bear',color:'#e5e0c9',scale:1.9,hp:460,meat:85,hide:320,biome:'mountain',aggression:60,speed:12,attackDamage:38},
 {name:'White rhinoceros',kind:'rhino',color:'#918c7e',scale:2,hp:950,meat:170,hide:420,biome:'savanna',aggression:50,speed:12,armor:.7,attackDamage:42},
 {name:'Giraffe',kind:'giraffe',color:'#bc9759',scale:1.9,hp:420,meat:95,hide:280,biome:'savanna',aggression:17,speed:13},
 {name:'Plains zebra',kind:'zebra',color:'#d5d0ba',scale:1.25,hp:180,meat:38,hide:130,biome:'savanna',speed:14},
 {name:'Nile crocodile',kind:'crocodile',color:'#5b6545',scale:1.65,hp:350,meat:48,hide:260,biome:'wetlands',aggression:38,speed:8,armor:.78,attackDamage:30},
 {name:'Spotted hyena',kind:'hyena',color:'#a58e64',scale:.95,hp:155,meat:18,hide:120,biome:'savanna',aggression:48,speed:14},
 {name:'Cheetah',kind:'cheetah',color:'#c8a360',scale:1.02,hp:125,meat:17,hide:210,biome:'savanna',aggression:22,speed:20},
 {name:'Snowshoe hare',kind:'rabbit',color:'#d4cbbb',scale:.34,hp:25,meat:3,hide:20,biome:'forest',speed:12},
 {name:'Red fox',kind:'fox',color:'#b96331',scale:.65,hp:55,meat:6,hide:65,biome:'forest',speed:13},
 {name:'African buffalo',kind:'buffalo',color:'#353b30',scale:1.6,hp:430,meat:100,hide:230,biome:'savanna',aggression:55,speed:13,attackDamage:35},
 {name:'Hippopotamus',kind:'hippo',color:'#8d7c78',scale:2.1,hp:1050,meat:190,hide:450,biome:'wetlands',aggression:55,speed:10,armor:.8,attackDamage:45}
];
export const habitats = {
 forest:{minX:-580,maxX:-105,minZ:-100,maxZ:570},
 mountain:{minX:-560,maxX:570,minZ:-570,maxZ:-230},
 plains:{minX:25,maxX:290,minZ:-70,maxZ:570},
 savanna:{minX:310,maxX:595,minZ:-70,maxZ:285},
 wetlands:{minX:320,maxX:585,minZ:340,maxZ:580}
};
export function spawnLocation(s, random=Math.random) {
 const b=habitats[s.biome]||habitats.plains;
 return {x:b.minX+(b.maxX-b.minX)*random(),z:b.minZ+(b.maxZ-b.minZ)*random()};
}
export function keepInHabitat(a,dt) {
 if(a.alert>.55)return;
 const b=habitats[a.s.biome]||habitats.plains;
 if(a.x<b.minX||a.x>b.maxX||a.z<b.minZ||a.z>b.maxZ){
  const target=Math.atan2(a.x-(b.minX+b.maxX)/2,a.z-(b.minZ+b.maxZ)/2);
  const delta=Math.atan2(Math.sin(target-a.angle),Math.cos(target-a.angle));
  a.angle+=delta*Math.min(1,dt*2);
 }
}

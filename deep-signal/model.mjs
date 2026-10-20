/** Pure progression rules for Deep Signal. Currency and cargo are whole credits. */
const part = (id,name,kind,price,values,description,requires=[]) => ({id,name,kind,price,power:0,weight:0,depth:0,hull:0,damage:0,mining:0,speed:0,requires,description,...values});
export const PARTS = Object.freeze([
  part('hydrophobic-gun','Hydrophobic autocannon','gun',260,{power:6,weight:10,damage:18},'Crew-fired underwater rounds. A dependable hunting cannon.'),
  part('torpedo-tube','Torpedo tube','torpedo',420,{power:8,weight:17,damage:125},'Heavy guided torpedoes. Excellent against large predators.'),
  part('mining-drill','Carbide mining drill','drill',220,{power:5,weight:14,mining:24},'Extracts saleable ore from deposits in the trench walls.'),
  part('screw-engine','Twin-screw drive','engine',240,{power:4,weight:12,speed:9},'A reliable, efficient propulsion unit.'),
  part('reinforcing-bars','Hull reinforcing bars','armor',180,{weight:9,depth:100,hull:30},'Adds 100 m crush tolerance and 30 hull. No power required.'),
  part('structural-ribs','Structural pressure ribs','armor',320,{weight:15,depth:190,hull:40},'An internal brace cage: +190 m crush tolerance, +40 hull.'),
  part('pressure-plates','Pressure armor plates','armor',300,{weight:21,depth:140,hull:85},'Heavy exterior plating: +140 m crush tolerance, +85 hull.'),
  part('arc-gun','Cavitating rail cannon','gun',850,{power:14,weight:18,damage:42},'Dense hydrophobic projectiles for armored deep-sea prey.',['ballistics-1']),
  part('heavy-torpedo','Heavy torpedo rack','torpedo',1100,{power:16,weight:28,damage:260},'A reinforced rack carrying high-impact guided torpedoes.',['ballistics-2']),
  part('diamond-drill','Diamond cutter assembly','drill',780,{power:12,weight:22,mining:58},'Chews through high-value abyssal mineral seams.',['mining-1']),
  part('abyss-drill','Abyssal plasma drill','drill',1500,{power:22,weight:26,mining:110},'Extreme-depth excavation at a considerable power cost.',['mining-2']),
  part('vector-engine','Vectored turbine drive','engine',900,{power:11,weight:16,speed:20},'Strong thrust despite the drag of a reinforced hull.',['power-1']),
  part('titanium-ribs','Titanium pressure ribs','armor',900,{weight:12,depth:340,hull:70},'High-strength bracing: +340 m crush tolerance, +70 hull.',['hull-1']),
  part('abyss-plates','Abyssal laminate plates','armor',1600,{weight:25,depth:520,hull:140},'A deep-rated pressure shell: +520 m tolerance, +140 hull.',['hull-2']),
  part('aux-reactor','Auxiliary reactor','reactor',650,{power:-18,weight:24},'Supplies 18 additional power units for demanding equipment.',['power-1'])
]);
export const SLOTS = Object.freeze([
  {id:'bow',name:'Bow hardpoint',kinds:['gun','torpedo']},
  {id:'stern',name:'Stern engine mount',kinds:['engine']},
  {id:'port',name:'Port hardpoint',kinds:['gun','torpedo','drill']},
  {id:'starboard',name:'Starboard hardpoint',kinds:['gun','torpedo','drill']},
  {id:'dorsal',name:'Dorsal hardpoint',kinds:['gun','torpedo']},
  {id:'ventral',name:'Ventral drill mount',kinds:['drill']},
  {id:'frame1',name:'Forward hull frame',kinds:['armor']},
  {id:'frame2',name:'Central hull frame',kinds:['armor']},
  {id:'frame3',name:'Aft hull frame',kinds:['armor']},
  {id:'utility',name:'Reactor / reinforcement bay',kinds:['reactor','armor']}
]);
const upgrade=(id,name,branch,price,requires,description)=>({id,name,branch,price,requires,description,maxLevel:1});
export const UPGRADES = Object.freeze([
  upgrade('ballistics-1','Cavitation research','Weapons',450,[],'Unlocks rail cannons. All gun damage +20%.'),
  upgrade('ballistics-2','Torpedo warheads','Weapons',1000,['ballistics-1'],'Unlocks heavy torpedoes. Torpedo damage +25%.'),
  upgrade('mining-1','Diamond tooling','Mining',400,[],'Unlocks diamond drills. Mining output +20%.'),
  upgrade('mining-2','Plasma excavation','Mining',950,['mining-1'],'Unlocks abyssal drills. Mining output +30% again.'),
  upgrade('hull-1','Titanium engineering','Hull',500,[],'Unlocks titanium ribs. Base pressure tolerance +120 m.'),
  upgrade('hull-2','Abyssal laminates','Hull',1200,['hull-1'],'Unlocks abyss plates. Base pressure tolerance +220 m.'),
  upgrade('power-1','High-voltage bus','Power',450,[],'Reactor capacity +12. Unlocks turbines and auxiliary reactors.'),
  upgrade('power-2','Compact fusion plant','Power',1100,['power-1'],'Reactor capacity +24. Engine efficiency +15%.'),
  upgrade('crew-1','Station drills','Crew',350,[],'Crew response and automatic fire rate +25%.'),
  upgrade('crew-2','Veteran specialists','Crew',850,['crew-1'],'Crew response improves another 30%. Guns reload faster.'),
  upgrade('cargo-1','Expanded cargo racks','Mining',300,[],'Cargo capacity rises from 1500 to 3000 credits.')
]);
const partMap=new Map(PARTS.map(p=>[p.id,p]));
const upgradeMap=new Map(UPGRADES.map(p=>[p.id,p]));
const slotMap=new Map(SLOTS.map(s=>[s.id,s]));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const int=(v,fallback=0,max=999999999)=>Number.isFinite(v)&&v>=0?Math.min(max,Math.floor(v)):fallback;
const unlocked=(save,requirements)=>requirements.every(id=>save.upgrades?.[id]===1);
export function defaultSave(){return {version:1,money:650,cargo:0,parts:{bow:'hydrophobic-gun',stern:'screw-engine',ventral:'mining-drill',frame1:'structural-ribs'},upgrades:{},kills:0,mined:0,bestDepth:0,research:0};}
export function stats(save){
  const upgrades=record(save?.upgrades)?save.upgrades:{};
  const has=id=>upgrades[id]===1;
  const installed=Object.entries(record(save?.parts)?save.parts:{}).flatMap(([slot,id])=>{const p=partMap.get(id);return p&&slotMap.get(slot)?.kinds.includes(p.kind)?[p]:[];});
  const sum=key=>installed.reduce((n,p)=>n+p[key],0);
  const capacity=40+(has('power-1')?12:0)+(has('power-2')?24:0);
  const negativePower=installed.reduce((n,p)=>n+Math.min(0,p.power),0);
  const weight=sum('weight');
  return {
    maxHull:150+sum('hull'),
    crushDepth:240+sum('depth')+(has('hull-1')?120:0)+(has('hull-2')?220:0),
    powerUsed:installed.reduce((n,p)=>n+Math.max(0,p.power),0),
    powerCapacity:capacity-negativePower,
    weight,
    speed:Math.max(6,(22+sum('speed'))/(1+weight/200)*(has('power-2')?1.15:1)),
    gunDamage:sum('damage')===0?0:installed.filter(p=>p.kind==='gun').reduce((n,p)=>n+p.damage,0)*(has('ballistics-1')?1.2:1),
    gunInterval:0.65/(has('crew-2')?1.25:1),
    torpedoDamage:installed.filter(p=>p.kind==='torpedo').reduce((n,p)=>n+p.damage,0)*(has('ballistics-2')?1.25:1),
    drillRate:sum('mining')*(has('mining-1')?1.2:1)*(has('mining-2')?1.3:1),
    crewRate:(has('crew-1')?1.25:1)*(has('crew-2')?1.3:1),
    cargoCapacity:has('cargo-1')?3000:1500
  };
}
export function buyPart(save,partId,slotId){
  const p=partMap.get(partId),slot=slotMap.get(slotId);
  if(!p||!slot)return {ok:false,message:'Choose a valid component and mounting point.'};
  if(!slot.kinds.includes(p.kind))return {ok:false,message:'That component cannot fit this mounting point.'};
  if(!unlocked(save,p.requires))return {ok:false,message:'Research the required technology first.'};
  if(save.parts?.[slotId]===partId)return {ok:false,message:'That component is already fitted here.'};
  if(!Number.isFinite(save.money)||save.money<p.price)return {ok:false,message:`You need ${p.price} credits for this component.`};
  const candidate={...save,parts:{...save.parts,[slotId]:partId}};
  const s=stats(candidate);
  if(s.powerUsed>s.powerCapacity)return {ok:false,message:`Power budget exceeded (${s.powerUsed}/${s.powerCapacity}). Upgrade the reactor first.`};
  save.money-=p.price;save.parts=candidate.parts;
  return {ok:true,message:`${p.name} fitted to ${slot.name.toLowerCase()}.`};
}
export function purchaseUpgrade(save,id){
  const u=upgradeMap.get(id);
  if(!u)return {ok:false,message:'Choose a valid research upgrade.'};
  if(save.upgrades?.[id]===1)return {ok:false,message:'This technology is already researched.'};
  if(!unlocked(save,u.requires))return {ok:false,message:'Complete the preceding research first.'};
  if(!Number.isFinite(save.money)||save.money<u.price)return {ok:false,message:`Research requires ${u.price} credits.`};
  save.money-=u.price;save.upgrades={...save.upgrades,[id]:1};save.research=int(save.research)+1;
  return {ok:true,message:`${u.name} researched.`};
}
export function validateSave(raw){
  const fallback=defaultSave();
  if(!record(raw))return fallback;
  const result={...fallback,money:int(raw.money,fallback.money),cargo:int(raw.cargo),kills:int(raw.kills),mined:int(raw.mined),bestDepth:int(raw.bestDepth,0,10000),research:0,parts:{...fallback.parts},upgrades:{}};
  // Enforce prerequisites in catalog order, discarding injected or impossible unlocks.
  if(record(raw.upgrades))for(const u of UPGRADES)if(own(raw.upgrades,u.id)&&raw.upgrades[u.id]===1&&unlocked(result,u.requires))result.upgrades[u.id]=1;
  result.research=Object.keys(result.upgrades).length;
  if(record(raw.parts)){
    result.parts={};
    for(const slot of SLOTS){const id=own(raw.parts,slot.id)?raw.parts[slot.id]:fallback.parts[slot.id],p=partMap.get(id);if(p&&slot.kinds.includes(p.kind)&&unlocked(result,p.requires))result.parts[slot.id]=id;}
    // Corrupt equipment should not strand a save with no engine, gun or drill.
    for(const id of ['bow','stern','ventral'])if(!result.parts[id])result.parts[id]=fallback.parts[id];
    // Drop excess optional devices while preserving a usable starter hull.
    for(const slot of [...SLOTS].reverse()){if(stats(result).powerUsed<=stats(result).powerCapacity)break;if(!['bow','stern','ventral'].includes(slot.id))delete result.parts[slot.id];}
    if(stats(result).powerUsed>stats(result).powerCapacity)result.parts={...fallback.parts};
  }
  result.cargo=Math.min(result.cargo,stats(result).cargoCapacity);
  return result;
}
export function sellCargo(save){const amount=int(save.cargo);save.money=int(save.money)+amount;save.cargo=0;return amount;}

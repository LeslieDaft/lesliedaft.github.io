// Wildrange's shared social, faction, command and worker simulation.
// Rendering is injected so the same simulation can be checked without WebGL.
export const BOT_CATALOG = [
  {id:'scout',name:'Trail Scout',price:250,hp:85,speed:6.4,role:'scout',description:'Finds wildlife and marks threats; follows your squad.'},
  {id:'harvester',name:'Harvest Rover',price:550,hp:125,speed:4.8,role:'harvester',description:'Claims a downed animal, gathers meat/hides, then sells at the lodge.'},
  {id:'hauler',name:'Cargo Hauler',price:1100,hp:190,speed:5.2,role:'hauler',description:'Collects three harvests per trip before returning to sell.'},
  {id:'hunter',name:'Hunter Automaton',price:1800,hp:160,speed:5.8,role:'hunter',damage:48,range:145,description:'Tracks and shoots wildlife; defends workers from hostile squads.'},
  {id:'combat',name:'Sentinel Combat Bot',price:3600,hp:300,speed:5.2,role:'combat',damage:58,range:210,description:'Armored escort with leading aim, bursts, and flanking behavior.'}
];
export const RECRUIT_CATALOG = [
  {id:'ranger',name:'Ranger Companion',price:700,hp:145,speed:5.4,range:170,damage:34,description:'An all-round squad fighter with burst fire and cover movement.'},
  {id:'marksman',name:'Marksman',price:1800,hp:110,speed:4.8,range:270,damage:72,description:'Kneels for accurate long-range fire and keeps distance.'},
  {id:'vanguard',name:'Vanguard',price:2400,hp:230,speed:5.6,range:120,damage:42,description:'An armored front-line recruit who flanks, slides and rolls.'}
];
export const UPGRADE_TREE = [
  {id:'fieldwork',name:'Field Workshop',price:350,requires:[],branch:'Logistics',description:'Unlocks two more squad slots and the specialist branches.'},
  {id:'servos',name:'Fast Servos',price:900,requires:['fieldwork'],branch:'Logistics',description:'Worker bots move and harvest 30% faster.'},
  {id:'cargo',name:'Cargo Racks',price:1500,requires:['servos'],branch:'Logistics',description:'Harvesters carry two animals; haulers carry five per trip.'},
  {id:'market',name:'Trade Network',price:2400,requires:['cargo'],branch:'Logistics',description:'All automatic sales earn 25% more.'},
  {id:'optics',name:'Target Optics',price:1000,requires:['fieldwork'],branch:'Combat',description:'Squad and hunting bots gain aim accuracy and 20% more range.'},
  {id:'armor',name:'Composite Armor',price:2000,requires:['optics'],branch:'Combat',description:'Current and future allied units gain 35% maximum health.'},
  {id:'command',name:'Command Network',price:3800,requires:['armor'],branch:'Combat',description:'Raises the squad limit to 20 and speeds up coordinated attacks.'},
  {id:'diplomacy',name:'Field Diplomacy',price:800,requires:['fieldwork'],branch:'Social',description:'Better friendly rewards and a stronger chance of a quiet surrender.'},
  {id:'alliance',name:'Hunter Alliance',price:2600,requires:['diplomacy'],branch:'Social',description:'Friendly hunters can join for free; your squad can field 14 units.'}
];
const CAMP_DEFS = [
  {id:'cedar',name:'Baron Vale’s Cedar Compound',team:'baron-vale',x:-420,z:-80,reward:4200,color:'#b68452'},
  {id:'ridge',name:'Aurelia’s Ridge Army',team:'aurelia',x:460,z:-245,reward:8000,color:'#aa6670'}
];
const NAMES=['Mason Reed','Rowan Pike','Avery Stone','Riley Fox','Casey Brooks','Drew Vale','Quinn Finch','Alex Mercer'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const nearest=(items,point,filter=()=>true)=>items.filter(filter).sort((a,b)=>distance(a,point)-distance(b,point))[0];
const finite=(n,f=0)=>Number.isFinite(Number(n))?Number(n):f;

export class FrontierWorld {
 constructor(api,saved={}){
  this.botOrder=saved.botOrder||'harvest';this.squadOrder=saved.squadOrder||'follow';this.leaderId=saved.leaderId||null;this.disobedience=saved.disobedience||0;this.orderTimer=0;this.inviteTimer=12;this.invitation=null;this.groupBases=saved.groupBases||{};this.spawnClock=20;this.targetMark=null;this.assignments=saved.assignments||{};this.dynamicCamps=saved.dynamicCamps||[];this.api=api;this.units=[];this.time=0;this.wanted=clamp(finite(saved.wanted),0,100);this.lastCrime=-120;this.heatClock=0;this.waveClock=0;this.commandMode=['follow','hold','attack','harvest'].includes(saved.commandMode)?saved.commandMode:'follow';
  this.upgrades=new Set((saved.upgrades||[]).filter(id=>UPGRADE_TREE.some(u=>u.id===id)));this.hostileTeams=new Set(saved.hostileTeams||[]);this.nextId=finite(saved.nextId,100);this.soldValue=finite(saved.soldValue);this.harvests=finite(saved.harvests);this.kills=finite(saved.kills);this.attackCampId=saved.attackCampId||null;this.claims=new Map();this.dirty=false;this.saveClock=0;this.playerLast=null;
  this.camps=CAMP_DEFS.map(c=>({...c,captured:!!saved.camps?.find(s=>s.id===c.id)?.captured,assaulted:!!saved.camps?.find(s=>s.id===c.id)?.assaulted}));
  if(Array.isArray(saved.units)&&saved.units.length){for(const u of saved.units.slice(0,80))this._restore(u)}else this._populate();
  // Saved campaigns retain their roster, rewards, and individual surrendered inventories.
  for(const c of this.dynamicCamps)if(!this.camps.some(n=>n.id===c.id))this.camps.push({...c});this._drawCampStructures();
 }
 _height(x,z){return finite(this.api.height(x,z));}
 _random(){return this.api.random?this.api.random():Math.random()}
 _saveSoon(){this.dirty=true;}
 _syncSave(){if(this.api.save)this.api.save();this.dirty=false;this.saveClock=0;}
 get capacity(){return this.upgrades.has('command')?20:this.upgrades.has('alliance')?14:this.upgrades.has('fieldwork')?10:8;}
 get allies(){return this.units.filter(u=>u.team==='player'&&!u.dead);}
 _spawn(data){
  const kind=data.kind||'hunter',isBot=!!data.isBot,model=isBot?this.api.createBot(kind,data.team):this.api.createHuman({color:data.color||'#706e51',team:data.team,role:data.role||kind});
  const rawHp=finite(data.baseHp,data.maxHp||data.hp||120),armor=data.team==='player'&&this.upgrades.has('armor')?1.35:1;
  let u={id:data.id||'unit-'+this.nextId++,name:data.name||kind,kind,role:data.role||kind,isBot,team:data.team||'neutral',ownerId:data.ownerId||null,x:finite(data.x),z:finite(data.z),homeX:finite(data.homeX,data.x),homeZ:finite(data.homeZ,data.z),baseHp:rawHp,maxHp:finite(data.maxHp,rawHp*armor),hp:finite(data.hp,rawHp*armor),speed:finite(data.speed,5),damage:finite(data.damage,isBot?40:32),range:finite(data.range,160),dead:!!data.dead,looted:!!data.looted,loot:Math.max(0,finite(data.loot,80)),friendly:finite(data.friendly),gifted:!!data.gifted,surrendered:!!data.surrendered,grit:finite(data.grit,this._random()),seed:finite(data.seed,this._random()*10),state:data.state||'idle',timer:0,shotClock:0,burstLeft:0,reloadClock:0,evadeClock:0,hitClock:0,deathTime:finite(data.deathTime),facing:finite(data.facing),velocity:{x:0,z:0},cargo:Array.isArray(data.cargo)?data.cargo.filter(c=>Number.isFinite(c.value)):[],g:model.g,model,actionTime:0,travelTarget:null,workTimer:0,holdX:finite(data.holdX,data.x),holdZ:finite(data.holdZ,data.z),squadSlot:finite(data.squadSlot,this.allies.length),targetId:null,wealth:data.wealth||0,rank:data.rank||0,deadCause:data.deadCause||null};
  this.units.push(u);u.g.userData=u.g.userData||{};u.g.userData.unitId=u.id;u.g.userData.team=u.team;if(u.g.traverse)u.g.traverse(o=>{o.userData=o.userData||{};o.userData.unitId=u.id;});this.api.scene.add(u.g);this._place(u);return u;
 }
 _restore(data){if(!data||!data.id||!data.team)return;const def=BOT_CATALOG.find(b=>b.id===data.kind)||RECRUIT_CATALOG.find(b=>b.id===data.kind);this._spawn({...def,...data});}
 _populate(){
  const places=[[-29,119],[36,140],[-130,110],[155,35],[-205,310],[255,265],[120,-95],[-95,-175]];
  places.forEach(([x,z],i)=>{const owner=this._spawn({id:'hunter-'+i,name:NAMES[i],kind:'hunter',role:'hunter',team:'hunter-'+i,x,z,hp:115,baseHp:115,damage:36,range:190,speed:4.5,loot:100+i*45,grit:.22+i*.095,color:i%2?'#6a7360':'#94744e'});const escorts=i<2?0:i<5?1:2;for(let j=0;j<escorts;j++)this._spawn({name:NAMES[i]+"’s "+(j?'Sentinel':'Escort'),kind:j?'combat':'guard',role:'guard',isBot:j>0,ownerId:owner.id,team:owner.team,x:x+4+j*2,z:z+4,hp:j?220:130,baseHp:j?220:130,damage:j?44:30,speed:5,range:180,loot:70});});
  for(let ci=0;ci<this.camps.length;ci++){let camp=this.camps[ci];for(let i=0;i<(ci?7:5);i++)this._spawn({id:camp.id+'-guard-'+i,name:camp.name.split('’')[0]+' '+(i%3===0?'Sentinel':'Mercenary'),kind:i%3===0?'combat':i%3===1?'marksman':'vanguard',role:'soldier',isBot:i%3===0,team:camp.team,x:camp.x+Math.cos(i*1.3)*18,z:camp.z+Math.sin(i*1.3)*18,homeX:camp.x,homeZ:camp.z,hp:ci?210:155,baseHp:ci?210:155,speed:5,range:i%3===1?240:170,damage:i%3===1?58:34,loot:120+ci*100,color:camp.color});}
 }
 _drawCampStructures(){// Optional geometry factory is supplied by the view, so tests need no renderer.
  if(this.api.createCamp)for(const camp of this.camps)this.api.createCamp(camp);
 }
 _place(u){const y=this._height(u.x,u.z);if(u.g.position?.set)u.g.position.set(u.x,y,u.z);else Object.assign(u.g.position||{}, {x:u.x,y,z:u.z});if(u.g.rotation)u.g.rotation.y=u.facing;}
 _aliveTarget(t){return t&&t.hp>0&&!t.dead;}
 _isEnemy(a,b){if(!a||!b||a.id===b.id||b.dead||a.team===b.team)return false;if(a.team==='player')return this.hostileTeams.has(b.team);if(b.team==='player')return this.hostileTeams.has(a.team);return false;}
 _point(t,y=1.25){if(t.s){const b=t.g?.userData?.damageBounds,local=b?b.min.y+(b.max.y-b.min.y)*.42:1.2;return{x:t.x,y:this._height(t.x,t.z)+local*(t.g?.scale?.y||t.s.scale||1),z:t.z};}return{x:t.x,y:t.isPlayer?(t.y??this._height(t.x,t.z)+1.8)-.3:(t.y??this._height(t.x,t.z))+y,z:t.z};}
 _player(){let p=this.api.getPlayer();return {...p,id:'player',team:'player',hp:p.health??100,dead:(p.health??100)<=0,isPlayer:true,y:p.y??this._height(p.x,p.z)};}
 _blocked(from,to){let dx=to.x-from.x,dz=to.z-from.z,len=Math.hypot(dx,dz);if(len<1)return false;for(let step=1,n=Math.ceil(len/2);step<n;step++){let t=step/n;let x=from.x+dx*t,z=from.z+dz*t,y=from.y+(to.y-from.y)*t;if(this._height(x,z)>y-.1)return true;}for(const t of this.api.trunks||[]){let k=clamp(((t.x-from.x)*dx+(t.z-from.z)*dz)/(len*len),0,1);if(k>.015&&k<.985&&Math.hypot(from.x+dx*k-t.x,from.z+dz*k-t.z)<(t.r||.5)+.08&&from.y+(to.y-from.y)*k<this._height(t.x,t.z)+22)return true;}return false;}
 _canSee(a,b){return !this._blocked(this._point(a,a.isBot?.9:1.45),this._point(b,b.isBot?.8:1.1));}
 _move(u,x,z,speed,dt){let dx=x-u.x,dz=z-u.z,len=Math.hypot(dx,dz);if(len<.25||speed<=0){u.velocity.x=0;u.velocity.z=0;return 0;}let d=Math.min(len,speed*dt),sx=dx/len,sz=dz/len,nx=clamp(u.x+sx*d,-655,655),nz=clamp(u.z+sz*d,-655,655);
   if(this.api.isWater?.(nx,nz)){const a=Math.atan2(u.z-z,u.x-x)+1.2;nx=u.x+Math.cos(a)*d;nz=u.z+Math.sin(a)*d;if(this.api.isWater(nx,nz)){u.velocity.x=0;u.velocity.z=0;return 0;}}
   let obstruction=(this.api.trunks||[]).find(t=>Math.hypot(nx-t.x,nz-t.z)<(t.r||.5)+.55);if(obstruction){let side=Math.sin(u.seed)>0?1:-1;nx=clamp(u.x-sz*d*side,-655,655);nz=clamp(u.z+sx*d*side,-655,655);} // Tangential avoidance prevents units piling into trunks.
   // Do not walk through the lodge; skirt the front wall.
   if(Math.abs(nx)<10&&Math.abs(nz-70)<8){nx=(u.x>=0?1:-1)*10.5;nz=clamp(nz,53,86);}
   // Avoid sheer cliffs instead of teleporting vertically over them.
   if(Math.abs(this._height(nx,nz)-this._height(u.x,u.z))>Math.max(1.8,d*1.6)){nx=u.x-sz*d;nz=u.z+sx*d;}
   u.velocity.x=(nx-u.x)/Math.max(.001,dt);u.velocity.z=(nz-u.z)/Math.max(.001,dt);u.x=nx;u.z=nz;u.facing=Math.atan2(-dx,-dz);return d/Math.max(.001,dt);
 }
 _facingTarget(u,t){u.facing=Math.atan2(u.x-t.x,u.z-t.z);}
 _setAction(u,action){if(u.state!==action){u.state=action;u.actionTime=0;}}
 _provoke(team,violent=false){if(team==='player')return;this.hostileTeams.add(team);for(const u of this.units)if(u.team===team&&!u.dead){u.surrendered=false;u.targetId='player';u.evadeClock=Math.min(u.evadeClock,.2);this._setAction(u,'aim');}if(violent&&team.startsWith('hunter-'))this._raiseWanted(18);this._saveSoon();}
 _raiseWanted(amount){this.wanted=clamp(this.wanted+amount,0,100);this.lastCrime=this.time;this.heatClock=0;this._saveSoon();}
 _witnessCount(point,ignoreTeam){return this.units.filter(u=>!u.dead&&u.team!=='player'&&u.team!==ignoreTeam&&distance(u,point)<100&&this._canSee(u,point)).length;}
 nearbyPerson(maxDist=6){const player=this._player();return nearest(this.units,player,u=>!u.isBot&&u.team!=='player'&&distance(u,player)<maxDist&&(!u.dead||!u.looted))||null;}
 social(id,action){let u=this.units.find(n=>n.id===id);if(!u)return 'That hunter has moved on.';if(distance(this._player(),u)>8)return 'Get closer to talk or collect the gear.';
  if(action==='join'||action==='merge'){if(u.dead||this.hostileTeams.has(u.team))return 'This hunter cannot lead you.';this.leaderId=u.id;this.disobedience=0;this.orderTimer=0;this.invitation=null;this._syncSave();return 'Your crew now follows '+u.name+'. Their current orders appear on your HUD. You can leave with the squad controls.';}
  if(action==='accept'){if(this.invitation?.id!==u.id)return 'No invitation is pending.';if(this.invitation.kind==='join')return this.social(id,'join');u.friendly=2;const result=this.social(id,'recruit');this.invitation=null;return result;}
  if(action==='loot'){if(!u.dead&&!u.surrendered)return 'They have not surrendered their gear.';if(u.looted)return 'You already collected this inventory.';let amount=u.loot;u.looted=true;u.loot=0;this.api.addCash(amount);let supplies=this.api.lootSupplies?.(u)||'';this._saveSoon();this._syncSave();return `Collected $${amount} in gear and supplies.${supplies?' '+supplies:''}`;}
  if(u.dead)return 'Collect the dropped gear from the body.';
  if(action==='friendly'){
   if(this.hostileTeams.has(u.team))return 'They recognize the attack. Their squad refuses to talk.';
   if(u.surrendered)return 'They are keeping their distance. Their gear is on offer.';
   if(u.gifted)return u.friendly>=2?'“I still owe you. Recruit me if you need an ally.”':'“Thanks again. Try the marked wildlife trails.”';
   u.gifted=true;u.friendly+=this.upgrades.has('diplomacy')?2:1;let tip=65+(this.upgrades.has('diplomacy')?55:0);this.api.addCash(tip);u.favor='tip';this._setAction(u,'greet');this._saveSoon();this._syncSave();return `“Good to meet a friendly face.” +$${tip} fieldwork tip. ${u.ownerId?'This escort trusts you a little more.':'They point out wildlife trails and may join your squad.'}`;
  }
  if(action==='threaten'){
   if(u.surrendered)return 'They already surrendered. Collect their gear.';
   let guards=this.units.filter(g=>g.team===u.team&&!g.dead&&g.id!==u.id).length,allies=this.allies.filter(a=>distance(a,u)<35).length;let threshold=.55+(this.upgrades.has('diplomacy')?.2:0)+Math.min(.2,allies*.06)-guards*.12;
   this._raiseWanted(this._witnessCount(u,u.team)?12:7);u.friendly=-2;u.gifted=true;
   if(u.grit<threshold){u.surrendered=true;this._setAction(u,'surrender');if(guards){this._provoke(u.team);u.surrendered=true;this._setAction(u,'surrender');}this._saveSoon();return guards?'They surrender, but their escort raises weapons. Collect the gear and get clear.':'They surrender quietly. Their gear is yours to collect.';}
   this._provoke(u.team);return guards?'The hunter refuses. Their guards and bots attack!':'The hunter refuses and reaches for a weapon!';
  }
  if(action==='recruit'){
   if(this.hostileTeams.has(u.team)||u.surrendered||u.friendly<1)return 'Earn their trust with a friendly approach first.';
   if(this.allies.length>=this.capacity)return 'Your command network is full. Upgrade it first.';
   if(this.leaderId)return 'Your current leader controls recruitment. Leave their squad first.';let cost=0;if(cost&&!this.api.spendCash(cost))return `They need $${cost} for supplies before joining.`;
   let oldTeam=u.team;u.team='player';u.role='ranger';u.kind='ranger';u.maxHp=this.upgrades.has('armor')?u.baseHp*1.35:u.baseHp;u.hp=Math.max(u.hp,u.maxHp*.8);u.squadSlot=this.allies.length-1;u.g.userData.team='player';u.holdX=u.x;u.holdZ=u.z;this._setAction(u,'idle');this.hostileTeams.delete(oldTeam);this._saveSoon();this._syncSave();return `${u.name} joined your squad${cost?' for $'+cost:''}. Use the squad commands to give orders.`;
  }
  return 'Choose a friendly greeting, a threat, or recruitment.';
 }
 buyUnit(kind){const def=BOT_CATALOG.find(b=>b.id===kind);if(!def)return false;if(this.allies.length>=this.capacity){this.api.toast('Squad capacity reached — expand the command network');return false;}if(!this.api.spendCash(def.price)){this.api.toast('Not enough earned money');return false;}
  let p=this._player(),slot=this.allies.length;this._spawn({...def,isBot:true,team:'player',role:def.role,name:def.name,x:p.x+4+slot%3*1.4,z:p.z+4+Math.floor(slot/3)*1.5,baseHp:def.hp,hp:def.hp*(this.upgrades.has('armor')?1.35:1),squadSlot:slot,loot:0});this._saveSoon();this._syncSave();this.api.toast(def.name+' deployed');return true;}
 recruit(kind){this.api.toast('Ask a fellow hunter to join you with E. Companions are recruited in the world.');return false;}
 buyUpgrade(id){let up=UPGRADE_TREE.find(u=>u.id===id);if(!up||this.upgrades.has(id))return false;if(!up.requires.every(r=>this.upgrades.has(r))){this.api.toast('Unlock the preceding upgrade first');return false;}if(!this.api.spendCash(up.price)){this.api.toast('Not enough earned money');return false;}this.upgrades.add(id);if(id==='armor')for(const u of this.allies){let ratio=u.hp/u.maxHp;u.maxHp=u.baseHp*1.35;u.hp=Math.max(1,u.maxHp*ratio);}this._saveSoon();this._syncSave();this.api.toast(up.name+' unlocked');return true;}
 command(mode,group='squad',baseId=null){if(this.leaderId){this.api.toast('Your squad leader controls both crews. Leave their squad to give orders.');return false;}if(!['follow','hold','attack','harvest','hunt','bodyguard','focus','assignments'].includes(mode))return false;if(group==='bots')this.botOrder=mode;else this.squadOrder=mode;this.commandMode=mode;const p=this._player();for(const u of this.allies){u.holdX=u.x;u.holdZ=u.z;u.travelTarget=null;}
  if(mode==='attack'){const camp=this.camps.find(c=>c.id===baseId&&!c.captured)||nearest(this.camps,p,c=>!c.captured);if(camp){this.attackCampId=camp.id;this.groupBases[group]=camp.id;camp.assaulted=true;this._provoke(camp.team);this.api.toast('Squad assault ordered: '+camp.name);}else this.api.toast('All rival camps captured. Squad will defend you.');}
  else this.api.toast(mode==='hold'?'Squad holding position':mode==='harvest'?'Workers gathering; escorts defend the field operation':'Squad regrouping on you');this._saveSoon();return true;}
 hitTargets(){return this.units.filter(u=>!u.dead&&u.hp>0);}
 hit(unit,damage,point,source='player'){
  let u=typeof unit==='string'?this.units.find(v=>v.id===unit):unit;if(!u||u.dead||damage<=0)return false;let sourceId=typeof source==='object'?source.id||source.owner:source,sourceUnit=this.units.find(a=>a.id===sourceId),sourceTeam=typeof source==='object'?(source.team||sourceUnit?.team||'player'):(sourceUnit?.team||source);if(sourceTeam===u.team)return false;
  if(sourceTeam==='player'&&u.team!=='player'){this._provoke(u.team,false);if(u.team.startsWith('hunter-'))this._raiseWanted(18+Math.min(20,this._witnessCount(u,u.team)*5));}
  if(u.team==='player'&&sourceTeam!=='player')this.hostileTeams.add(sourceTeam);
  u.hp=Math.max(0,u.hp-damage);u.hitClock=.45;u.evadeClock=Math.max(u.evadeClock,.5);u.targetId=sourceUnit?.id||'player';if(this.api.emitImpact)this.api.emitImpact(point,{team:u.team,robot:u.isBot});
  if(u.hp<=0){u.dead=true;u.deathTime=0;u.deadCause=sourceTeam;u.deathSide=Math.sin(u.seed)>0?1:-1;u.state='dead';this.claims.delete(u.targetAnimal);this.kills+=sourceTeam==='player'?1:0;
   if(sourceTeam==='player'&&u.team.startsWith('hunter-'))this._raiseWanted(25+Math.min(20,this._witnessCount(u,u.team)*7));
   if(u.team==='player'&&u.cargo.length){for(const c of u.cargo)u.loot+=c.value;u.cargo=[];}
   if(sourceTeam==='player')this.api.toast(u.name+' down — gear guaranteed; E nearby to collect');this._saveSoon();}
  return true;
 }
 _fire(u,t,dt){if(u.reloadClock>0){u.reloadClock-=dt;return;}u.shotClock-=dt;if(u.shotClock>0)return;
  if(u.burstLeft<=0){u.burstLeft=u.kind==='marksman'?1:u.isBot?3:3;u.reloadClock=0;}
  let origin=this._point(u,u.isBot?.95:1.42),target=this._point(t,t.isBot?.85:1.05),d=distance(u,t),lead=d/720;target.x+=(t.velocity?.x||0)*lead;target.z+=(t.velocity?.z||0)*lead;
  let accuracy=(u.kind==='marksman'?.004:.012)*(this.upgrades.has('optics')&&u.team==='player'?.6:1)*(u.state==='kneel'?.6:1);let spread=accuracy*d;target.x+=(this._random()-.5)*spread*2;target.y+=(this._random()-.5)*spread;target.z+=(this._random()-.5)*spread*2;let dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z,len=Math.hypot(dx,dy,dz)||1;
  this.api.spawnProjectile({origin,direction:{x:dx/len,y:dy/len,z:dz/len},speed:u.kind==='marksman'?900:720,damage:u.damage,team:u.team,owner:u.id});u.shotClock=u.kind==='marksman'?1.35:.13;u.burstLeft--;if(!u.burstLeft)u.reloadClock=u.isBot?.8:1.2;u.muzzleFlash=.08;
 }
 _combat(u,target,dt){let dist=distance(u,target),range=u.range*(u.team==='player'&&this.upgrades.has('optics')?1.2:1),visible=this._canSee(u,target);u.targetId=target.id;u.evadeClock-=dt;let speed=0;
  if(u.evadeClock>0&&u.evadeClock<.7&&dist<65){this._setAction(u,u.isBot?'run':u.hp/u.maxHp<.45?'roll':'slide');let side=Math.sin(u.seed+Math.floor(this.time/3))>0?1:-1,dx=target.x-u.x,dz=target.z-u.z,len=Math.hypot(dx,dz)||1;speed=this._move(u,u.x-dz/len*side*6,u.z+dx/len*side*6,u.speed*1.45,dt);}
  else if(!visible||dist>range*.82){this._setAction(u,'run');let flank=Math.sin(u.seed)*12,dx=target.x-u.x,dz=target.z-u.z,len=Math.hypot(dx,dz)||1;let tx=target.x-dx/len*range*.45-dz/len*flank,tz=target.z-dz/len*range*.45+dx/len*flank;speed=this._move(u,tx,tz,u.speed*(this.upgrades.has('command')&&u.team==='player'?1.15:1),dt);}
  else if(dist<14&&u.kind==='marksman'){this._setAction(u,'run');speed=this._move(u,u.x+(u.x-target.x)*.5,u.z+(u.z-target.z)*.5,u.speed,dt);}
  else{this._setAction(u,!u.isBot&&(u.kind==='marksman'||Math.sin(u.seed)>.35)?'kneel':'aim');if(visible&&dist<range)this._fire(u,target,dt);if(u.evadeClock<-3-this._random()*3){u.evadeClock=.65;if(!u.isBot){let cover=(this.api.trunks||[]).filter(t=>Math.hypot(t.x-u.x,t.z-u.z)<12);if(cover.length){let t=cover[Math.floor(this._random()*cover.length)];u.cover={x:t.x+(t.x-target.x)/Math.max(1,distance(t,target))*1.5,z:t.z+(t.z-target.z)/Math.max(1,distance(t,target))*1.5};}}}
  }
  if(u.cover&&u.state!=='slide'&&u.state!=='roll'&&distance(u,u.cover)>1&&visible){speed=this._move(u,u.cover.x,u.cover.z,u.speed*.7,dt);this._setAction(u,'walk');if(distance(u,u.cover)<1)u.cover=null;}
  this._facingTarget(u,target);return speed;
 }
 _targetFor(u,player){let targets=this.units.filter(v=>this._isEnemy(u,v));if(u.team!=='player'&&this.hostileTeams.has(u.team)&&player.hp>0)targets.push(player);let target=nearest(targets,u,v=>distance(v,u)<Math.max(240,u.range+30));return target||null;}
 _worker(u,dt){const resources=[...this.api.animals,...this.units.filter(p=>p.dead&&!p.looted&&p.team!=='player').map(p=>p.salvageNode??=( {x:p.x,z:p.z,dead:true,harvested:false,person:p}))];let cargoLimit=u.kind==='hauler'?(this.upgrades.has('cargo')?5:3):(this.upgrades.has('cargo')?2:1),speed=u.speed*(this.upgrades.has('servos')?1.3:1),packValue=u.cargo.reduce((n,c)=>n+c.value,0);const lodge={x:0,z:87};
  if(u.cargo.length>=cargoLimit||u.cargo.length&&(!resources.some(a=>a.dead&&!a.harvested&&(!this.claims.has(a)||this.claims.get(a)===u.id))||distance(u,lodge)<12)){
   this._setAction(u,'haul');if(u.targetAnimal&&this.claims.get(u.targetAnimal)===u.id)this.claims.delete(u.targetAnimal);u.targetAnimal=null;if(distance(u,lodge)<12){let value=Math.round(packValue*(this.upgrades.has('market')?1.25:1));this.api.addCash(value);this.soldValue+=value;u.cargo=[];this._setAction(u,'idle');this.api.toast(u.name+' sold cargo for $'+value);this._saveSoon();return 0;}return this._move(u,lodge.x,lodge.z,speed,dt);
  }
  let target=u.targetAnimal;if(!target||!target.dead||target.harvested||this.claims.get(target)!==u.id){target=nearest(resources,u,a=>a.dead&&!a.harvested&&(!this.claims.has(a)||this.claims.get(a)===u.id));if(target){this.claims.set(target,u.id);u.targetAnimal=target;u.workTimer=0;}}
  if(target){if(distance(u,target)>3){this._setAction(u,'walk');return this._move(u,target.x,target.z,speed,dt);}this._setAction(u,'harvest');u.workTimer+=dt*(this.upgrades.has('servos')?1.3:1);if(u.workTimer>=2.2){const cargo=this.api.harvestAnimal(target);this.claims.delete(target);u.targetAnimal=null;u.workTimer=0;if(cargo){u.cargo.push(cargo);this.harvests++;this._saveSoon();}}return 0;}
  if(u.cargo.length){this._setAction(u,'haul');return this._move(u,lodge.x,lodge.z,speed,dt);}this._setAction(u,'idle');return 0;
 }
 _hunter(u,dt){let a=u.targetAnimal;if(!a||a.dead||a.harvested||distance(u,a)>240)a=nearest(this.api.animals,u,v=>!v.dead&&!v.harvested&&distance(u,v)<200);if(!a){this._setAction(u,'idle');return 0;}u.targetAnimal=a;let target={...a,id:'animal',team:'wildlife',y:this._height(a.x,a.z),velocity:{x:-Math.sin(a.angle||0)*(a.moveSpeed||0),z:-Math.cos(a.angle||0)*(a.moveSpeed||0)}};let dist=distance(u,a),range=u.range*(this.upgrades.has('optics')?1.2:1);if(dist>range*.7||!this._canSee(u,target)){this._setAction(u,'walk');return this._move(u,a.x,a.z,u.speed*.85,dt);}this._setAction(u,'aim');this._facingTarget(u,target);this._fire(u,target,dt);return 0;}
 _follow(u,player,dt){if(this.commandMode==='hold'){this._setAction(u,'idle');return distance(u,{x:u.holdX,z:u.holdZ})>1?this._move(u,u.holdX,u.holdZ,u.speed,dt):0;}
  let camp=this.camps.find(c=>c.id===this.attackCampId&&!c.captured),target=this.commandMode==='attack'&&camp?camp:player,slot=u.squadSlot||0,angle=slot*2.399,rad=5+Math.floor(slot/6)*3,tx=target.x+Math.cos(angle)*rad,tz=target.z+Math.sin(angle)*rad;
  if(distance(u,{x:tx,z:tz})>2){this._setAction(u,distance(u,player)>30?'run':'walk');return this._move(u,tx,tz,u.speed*(distance(u,player)>45?1.3:1),dt);}this._setAction(u,'idle');return 0;}
 _neutral(u,dt){if(u.surrendered){this._setAction(u,'surrender');return 0;}if(u.state==='greet'&&u.actionTime<1.8)return 0;const owner=this.units.find(a=>a.id===u.ownerId&&!a.dead),camp=this.camps.find(c=>c.team===u.team),anchor=owner||camp||{x:u.homeX,z:u.homeZ};let phase=this.time*.075+u.seed,target={x:anchor.x+Math.sin(phase)*(camp?22:8),z:anchor.z+Math.cos(phase*.8)*(camp?22:8)};if(distance(u,target)>1){this._setAction(u,'walk');return this._move(u,target.x,target.z,u.speed*.5,dt);}this._setAction(u,'idle');return 0;}
 _law(player,dt){if(this.time-this.lastCrime>22){let visible=this.units.some(u=>!u.dead&&u.team==='law'&&distance(u,player)<120&&this._canSee(u,player));if(!visible)this.wanted=Math.max(0,this.wanted-dt*.55);}
  this.waveClock-=dt;if(this.wanted<22){if(this.wanted<6){this.hostileTeams.delete('law');for(let u of this.units.filter(u=>u.team==='law'&&!u.dead)){u.hp=0;u.dead=true;u.looted=true;u.g.visible=false;}}return;}
  this.hostileTeams.add('law');let lawCount=this.units.filter(u=>u.team==='law'&&!u.dead).length;if(this.waveClock<=0&&lawCount<3+Math.floor(this.wanted/30)){this.waveClock=28;let a=this._random()*6.28;this._spawn({name:'Reserve Ranger',kind:'ranger',role:'law',team:'law',x:clamp(player.x+Math.cos(a)*95,-640,640),z:clamp(player.z+Math.sin(a)*95,-640,640),baseHp:145,hp:145,speed:5.6,range:170,damage:28,loot:70,color:'#466c58'});this.api.toast('Rangers are searching the area. Break line of sight to lose the heat.');}
 }
 caught(){let fine=Math.ceil(this.wanted*10);if(this.api.getCash)fine=Math.min(fine,Math.max(0,this.api.getCash()));if(fine&&this.api.spendCash)this.api.spendCash(fine);this.wanted=0;this.hostileTeams.delete('law');for(let u of this.units)if(u.team==='law'){u.dead=true;u.looted=true;u.g.visible=false;}this.api.toast('Rangers caught you. Heat cleared'+(fine?' · fine up to $'+fine:''));this._saveSoon();return fine;}
 _checkCamps(player){for(const c of this.camps){if(c.captured||!c.assaulted)continue;let guards=this.units.filter(u=>u.team===c.team&&!u.dead);if(!guards.length&&(distance(player,c)<140||this.allies.some(u=>distance(u,c)<80))){c.captured=true;this.api.addCash(c.reward);this.api.toast(c.name+' captured! +$'+c.reward+' salvage bounty');this.hostileTeams.delete(c.team);if(this.attackCampId===c.id)this.attackCampId=null;this._saveSoon();}}
 }
 update(dt){dt=clamp(dt,0,.1);if(!dt)return;this.time+=dt;this.saveClock+=dt;let player=this._player();if(this.playerLast){player.velocity={x:(player.x-this.playerLast.x)/dt,z:(player.z-this.playerLast.z)/dt};}this.playerLast={x:player.x,z:player.z};this._law(player,dt);this._economy(dt);this._squadPolitics(player,dt);
  // Claims are released on death/respawn so additional workers can always make progress.
  for(let [animal,id] of this.claims){let u=this.units.find(u=>u.id===id);if(animal.harvested||!animal.dead||!u||u.dead)this.claims.delete(animal);}
  for(const u of this.units){u.timer+=dt;u.actionTime+=dt;u.hitClock=Math.max(0,u.hitClock-dt);u.muzzleFlash=Math.max(0,(u.muzzleFlash||0)-dt);let move=0;
   if(u.dead){u.deathTime+=dt;this.api.animateHuman(u.model,{action:'dead',deathTime:u.deathTime,deathSide:u.deathSide||1,speed:0,hit:0,isBot:u.isBot},dt);this._place(u);continue;}
   let drop=this.api.getDeathDrop?.();if(drop&&!drop.looted&&u.team!=='player'&&this.hostileTeams.has(u.team)){this._setAction(u,'run');move=this._move(u,drop.x,drop.z,u.speed,dt);this._place(u);this.api.animateHuman(u.model,{action:'run',speed:move},dt);continue;}let mark=this.targetMark&&this.time-this.targetMark.time<20?this.targetMark.target:null;let requested=u.isBot?this.botOrder:this.squadOrder;const individual=requested==='assignments';if(requested==='assignments')requested=this.assignments[u.id]?.task||'bodyguard';let target=u.team==='player'&&requested==='focus'&&mark&&!mark.dead?mark:this._targetFor(u,player);if(target){move=this._combat(u,target,dt);}else if(u.team==='player'){
    this.commandMode=requested;if(!individual&&this.commandMode==='attack')this.attackCampId=this.groupBases[u.isBot?'bots':'squad']||this.attackCampId;if(individual&&this.commandMode==='attack'&&this.assignments[u.id]?.baseId){this.attackCampId=this.assignments[u.id].baseId;}let anchor=this.leaderId?this.units.find(n=>n.id===this.leaderId&&!n.dead):player;anchor=anchor||player;if(this.commandMode==='hold'){move=this._follow(u,anchor,dt);}else if(this.commandMode==='harvest'){move=this._worker(u,dt);}else if(this.commandMode==='hunt'||u.role==='hunter'&&!['hold','attack','bodyguard','focus'].includes(this.commandMode)){move=this._hunter(u,dt);if(!move&&u.state==='idle')move=this._follow(u,player,dt);}else move=this._follow(u,anchor,dt);
    if(distance(u,{x:0,z:87})<20)u.hp=Math.min(u.maxHp,u.hp+dt*4);
   }else if(u.kind==='hunter'&&!u.ownerId&&!u.surrendered){move=this._hunter(u,dt);if(u.state==='idle')move=this._neutral(u,dt);}else move=this._neutral(u,dt);
   this._place(u);u.g.visible=distance(u,player)<310;this.api.animateHuman(u.model,{action:u.state,speed:move,time:this.time,actionTime:u.actionTime,hit:u.hitClock/.45,aimYaw:u.facing,aimPitch:target?Math.atan2((target.y??this._height(target.x,target.z))-this._height(u.x,u.z),Math.max(1,distance(u,target))):0,muzzleFlash:u.muzzleFlash>0,isBot:u.isBot},dt);
  }
  for(let i=this.units.length-1;i>=0;i--){let u=this.units[i];if(u.team==='law'&&u.dead&&u.deathTime>30){this.api.scene.remove?.(u.g);this.units.splice(i,1);}}this._checkCamps(player);if(this.dirty&&this.saveClock>6)this._syncSave();
 }
 assign(id,task,baseId=null){if(this.leaderId){this.api.toast('Your leader controls assignments.');return false;}let u=this.allies.find(n=>n.id===id);if(!u||!['hunt','harvest','bodyguard','focus','attack','hold'].includes(task))return false;this.assignments[id]={task,baseId};if(task==='attack'){let c=this.camps.find(c=>c.id===baseId);if(c){c.assaulted=true;this._provoke(c.team);}}this._saveSoon();return true;}
 markTarget(target){if(target&&!target.dead)this.targetMark={target,time:this.time};}
 _economy(dt){this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnClock=50;if(this.units.filter(u=>!u.dead).length<65){let a=this._random()*6.28,x=Math.cos(a)*570,z=Math.sin(a)*570;if(!this.api.isWater?.(x,z))this._spawn({name:'Frontier hunter '+this.nextId,kind:'hunter',role:'hunter',team:'hunter-'+this.nextId,x,z,hp:115,baseHp:115,loot:180,wealth:100,speed:4.5,range:180});}}
 for(const u of [...this.units])if(!u.dead&&u.kind==='hunter'&&!u.ownerId&&u.team!=='player'&&!this.hostileTeams.has(u.team)){u.wealth=(u.wealth||0)+dt*2;const carcass=this.api.animals.find(a=>a.dead&&!a.harvested&&distance(a,u)<8);if(carcass){let cargo=this.api.harvestAnimal(carcass);if(cargo)u.wealth+=cargo.value;}if(u.wealth>250&&(u.rank||0)<3){u.wealth-=250;u.rank=(u.rank||0)+1;u.damage+=10;u.range+=15;u.maxHp+=30;u.hp+=30;u.loot+=100;if(this.units.filter(n=>!n.dead).length<75)this._spawn({name:u.name+' escort',kind:u.rank>1?'combat':'guard',isBot:u.rank>1,role:'guard',team:u.team,ownerId:u.id,x:u.x+3,z:u.z+3,hp:140,baseHp:140,damage:38,range:180,speed:5,loot:100});}if(u.rank>=3&&!this.camps.some(c=>c.team===u.team)&&this.camps.length<10){let c={id:'base-'+u.id,name:u.name+' outpost',team:u.team,x:u.x,z:u.z,reward:3000,color:'#84714e',captured:false};this.camps.push(c);this.dynamicCamps.push(c);this.api.createCamp?.(c);this.api.toast(u.name+' established a new outpost.');}}}
 leaveSquad(){this.leaderId=null;this.disobedience=0;this.squadOrder='follow';this.botOrder='harvest';this._syncSave();this.api.toast('You lead your own crew again.');}
 _squadPolitics(player,dt){let leader=this.units.find(u=>u.id===this.leaderId&&!u.dead);if(this.leaderId&&!leader){this.leaveSquad();return;}if(leader){this.orderTimer-=dt;if(this.orderTimer<=0){this.orderTimer=40;const orders=['follow','hunt','harvest','bodyguard','focus'];this.leaderOrder=orders[Math.floor(this.time/40)%orders.length];this.squadOrder=this.botOrder=this.leaderOrder;this.api.toast(leader.name+': '+(({harvest:'Collect downed animals and equipment.',hunt:'Hunt animals with us.',bodyguard:'Guard the squad leader.',focus:'Shoot the targets our crew engages.',follow:'Regroup on me.'})[this.leaderOrder]));}const near=distance(player,leader)<45,worked=this.harvests>(this.lastWork||0);if(this.leaderOrder==='harvest'?(near&&(worked||!this.api.animals.some(a=>a.dead&&!a.harvested&&distance(a,leader)<60))):near)this.disobedience=Math.max(0,this.disobedience-dt*2);else this.disobedience+=dt;this.lastWork=this.harvests;if(this.disobedience>18&&!this.warned){this.warned=true;this.api.toast(leader.name+': Return to the squad or you are out.');}if(this.disobedience>35){this.leaveSquad();this.api.toast(leader.name+' kicked you for ignoring orders.');}if(this.disobedience<5)this.warned=false;}else{this.inviteTimer-=dt;if(this.inviteTimer<=0){this.inviteTimer=45;let hunter=nearest(this.units,player,u=>u.kind==='hunter'&&!u.isBot&&!u.dead&&u.team!=='player'&&!this.hostileTeams.has(u.team)&&distance(u,player)<90);if(hunter){this.invitation={id:hunter.id,kind:this._random()<.5?'join':'recruit'};this.api.toast(hunter.name+(this.invitation.kind==='join'?' invites your crew to join their squad.':' asks to join your squad.')+' Approach and press E to accept.');}}}}
 hud(){let active=this.allies.length,workers=this.allies.filter(u=>['harvester','hauler'].includes(u.role)).length,captured=this.camps.filter(c=>c.captured).length;return `${this.leaderId?'LEADER '+(this.units.find(u=>u.id===this.leaderId)?.name||'Hunter')+' · ORDER '+this.leaderOrder+' · warning '+Math.round(this.disobedience)+'/35 · ':''}Bots ${this.botOrder.toUpperCase()} · People ${this.squadOrder.toUpperCase()} · Squad ${active}/${this.capacity} · ${workers} workers · ${this.commandMode.toUpperCase()} · Heat ${Math.ceil(this.wanted)}/100 · Camps ${captured}/${this.camps.length}`;}
 markers(){let scouts=this.allies.filter(u=>u.role==='scout'),scanned=this.api.animals.filter(a=>!a.dead&&!a.harvested&&scouts.some(s=>distance(s,a)<220));return [...this.camps.map(c=>({x:c.x,z:c.z,color:c.captured?'#85d995':'#ed8f79',label:c.captured?'Captured '+c.name:c.name})),...this.units.filter(u=>!u.dead&&u.team==='player').map(u=>({x:u.x,z:u.z,color:u.isBot?'#72d9ee':'#9fdfa0',label:u.name})),...scanned.map(a=>({x:a.x,z:a.z,color:'#c2f08c',label:'Scouted '+(a.s?.name||'wildlife')})),...this.units.filter(u=>!u.dead&&u.team!=='player'&&distance(u,this._player())<140).map(u=>({x:u.x,z:u.z,color:this.hostileTeams.has(u.team)?'#ff7568':'#e9d48b',label:u.name}))];}
 getState(){let keep=['id','name','kind','role','isBot','team','ownerId','x','z','homeX','homeZ','baseHp','maxHp','hp','speed','damage','range','dead','looted','loot','friendly','gifted','surrendered','grit','seed','state','facing','deathTime','deathSide','deadCause','wealth','rank','holdX','holdZ','squadSlot','cargo'];return{version:3,groupBases:this.groupBases,assignments:this.assignments,dynamicCamps:this.dynamicCamps,botOrder:this.botOrder,squadOrder:this.squadOrder,leaderId:this.leaderId,disobedience:this.disobedience,wanted:this.wanted,nextId:this.nextId,commandMode:this.commandMode,upgrades:[...this.upgrades],hostileTeams:[...this.hostileTeams],soldValue:this.soldValue,harvests:this.harvests,kills:this.kills,attackCampId:this.attackCampId,camps:this.camps.map(c=>({id:c.id,captured:c.captured,assaulted:c.assaulted})),units:this.units.map(u=>Object.fromEntries(keep.map(k=>[k,u[k]])))};}
}



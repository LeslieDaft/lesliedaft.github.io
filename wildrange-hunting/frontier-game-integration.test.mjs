// CPU integration check for root game + real Three.js scene/models. WebGL is the
// only substituted boundary; the actual social/worker/projectile code is run.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const methods=['fillRect','clearRect','strokeRect','beginPath','moveTo','lineTo','stroke','fill','ellipse','arc','save','restore','translate','rotate','fillText','drawImage','setTransform','closePath','quadraticCurveTo','bezierCurveTo'];
function context(){const c={measureText:t=>({width:String(t).length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})};for(let m of methods)c[m]=()=>{};return c;}
const elements=new Map(),windowHandlers=new Map(),documentHandlers=new Map(),store=new Map();
function element(id=''){return{id,style:{},dataset:{},hidden:true,innerHTML:'',textContent:'',children:[],append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},remove(){},addEventListener(){},removeEventListener(){},setAttribute(){},getAttribute(){return null},getContext:context,requestPointerLock(){document.pointerLockElement=this;return Promise.resolve()},setPointerCapture(){},querySelectorAll(){return[]}}}
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},createElement:element,querySelector:()=>element(),querySelectorAll:()=>[],addEventListener(n,f){documentHandlers.set(n,f)},exitPointerLock(){this.pointerLockElement=null}};
globalThis.window={addEventListener(n,f){windowHandlers.set(n,f)},removeEventListener(){}};globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};globalThis.matchMedia=()=>({matches:false});globalThis.requestAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};globalThis.__testAssert=assert;
const source=fs.readFileSync(path.join(root,'game.js'),'utf8').replace(/from '\.\/(.*?)'/g,(_,n)=>`from '${new URL(n,pathToFileURL(root+path.sep)).href}'`).replace('renderer=createRenderer()',`renderer={shadowMap:{},domElement:document.createElement('canvas'),setSize(){},setPixelRatio(){},getPixelRatio(){return 1},render(){}}`);
const assertions=`
const assert=globalThis.__testAssert;
assert.ok(frontier.units.length>20);assert.ok(frontier.camps.length===2);assert.ok(animals.length>=120);
// Root's harvest hook does not credit automated cargo early.
let corpse=animals[0];corpse.dead=true;corpse.harvested=false;let cashBefore=cash;const cargo=api.harvestAnimal(corpse);assert.ok(cargo.value>0);assert.equal(cash,cashBefore);assert.equal(corpse.harvested,true);
// Root's serializable save includes the new crew and preserves the existing bag.
cash=5000;assert.equal(frontier.buyUnit('harvester'),true);let bot=frontier.allies.at(-1);bot.cargo=[{value:300,meat:10,hides:1}];bot.x=0;bot.z=87;cashBefore=cash;frontier.update(.1);assert.equal(cash,cashBefore+300);assert.equal(bot.cargo.length,0);persist();let savedGame=JSON.parse(localStorage.getItem('wildrange-save'));assert.ok(savedGame.frontier.units.some(u=>u.id===bot.id));assert.ok(savedGame.expedition);assert.ok(savedGame.owned.includes(0));
// Physical projectiles identify the player as the source and provoke the owner team.
playing=true;trunks.length=0;for(let a of animals){a.harvested=true;a.g.visible=false;}for(let u of frontier.units){u.x=600;u.z=600;u.g.position.set(600,height(600,600),600);}let target=frontier.units.find(u=>u.team.startsWith('hunter-'));target.dead=false;target.hp=target.maxHp;target.x=100;target.z=-20;target.g.position.set(100,height(100,-20),-20);target.g.rotation.y=0;scene.updateMatrixWorld(true);const y=height(100,-20)+1.22,origin=new T.Vector3(100,y,-10),dir=new T.Vector3(0,0,-1);let hp=target.hp;spawnProjectile({origin,direction:dir,speed:820,damage:20,team:'player',owner:'player',maxRange:100});for(let i=0;i<8;i++)updateProjectiles(.01);assert.ok(target.hp<hp,'physical actor impact must damage its target');assert.ok(frontier.hostileTeams.has(target.team));assert.ok(frontier.wanted>0);
// Killing that same protected hunter retains a lootable inventory exactly once.
player.x=target.x;player.z=target.z;const inventory=target.loot;frontier.hit(target,10000,target.g.position,'player');assert.equal(target.dead,true);cashBefore=cash;frontier.social(target.id,'loot');assert.equal(cash,cashBefore+inventory);frontier.social(target.id,'loot');assert.equal(cash,cashBefore+inventory);
// A fired arrow is a physical object and restores exactly one arrow on retrieval.
for(const u of frontier.units){u.x=600;u.z=600;u.g.position.set(600,height(600,600),600);}player.x=80;player.z=90;camera.position.set(80,height(80,90)+2,90);camera.rotation.set(-.3,0,0);camera.updateMatrixWorld(true);gun=3;cooldown=0;reloading=0;arrowStock=12;const reserveBefore=reserve,arrowsBefore=arrowStock,dropsBefore=arrowDrops.length;shoot();assert.equal(arrowStock,arrowsBefore-1);for(let i=0;i<400&&projectiles.length;i++)updateProjectiles(.02);assert.equal(arrowDrops.length,dropsBefore+1);const dropped=arrowDrops.at(-1);player.x=dropped.g.position.x;player.z=dropped.g.position.z;interact();assert.equal(arrowStock,arrowsBefore);assert.equal(reserve,reserveBefore);
// Vehicle exit/rescue does not leave the avatar attached to a recovered aircraft.
cash=100000;assert.equal(expedition.buy('helicopter'),true);const heli=expedition.vehicles.find(v=>v.id==='helicopter');player.x=heli.x;player.z=heli.z;camera.position.set(heli.x,heli.y+1,heli.z);assert.equal(expedition.interact(),true);for(let i=0;i<100;i++)expedition.update(.01,{up:true,yaw:player.yaw,pitch:0});assert.ok(heli.y>height(heli.x,heli.z)+3);damagePlayer(1000);assert.equal(expedition.active,null);assert.ok(health>0);
for(const tab of ['overview','gear','bots','squad','upgrades','garage'])workshop(tab);playing=true;
clock.getDelta=()=>1/60;for(let i=0;i<90;i++)loop();assert.ok(Number.isFinite(camera.position.x)&&Number.isFinite(camera.position.y));workshop('bots');workshop('upgrades');menu();console.log('PASS root integration: real model roster, automated harvest/sale separation, crew save, physical actor hit/source retaliation, guaranteed single-use loot, 90 complete game frames and workshop/menu rendering');
`;
const temp=path.join(os.tmpdir(),'wildrange-frontier-integration-'+process.pid+'.mjs');fs.writeFileSync(temp,source+'\n'+assertions);try{await import(pathToFileURL(temp).href)}finally{fs.rmSync(temp,{force:true})}

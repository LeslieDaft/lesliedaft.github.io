export const WORLD={minX:-650,maxX:650,minZ:-1520,maxZ:240};
export const sites=[
{id:'wreck',name:'Crash site',at:[0,70],chapter:0},
{id:'hut',name:'Maintenance shelter',at:[-160,-240],chapter:1,shelter:true},
{id:'bridge',name:'Broken creek bridge',at:[80,-512],chapter:2},
{id:'ranger',name:'Ranger on the north trail',at:[-144,-736],chapter:3},
{id:'lookout',name:'Fire lookout',at:[200,-960],chapter:4,shelter:true},
{id:'tracks',name:'Ridge junction',at:[-64,-1160],chapter:5},
{id:'gate',name:'Repeater release door',at:[128,-1360],chapter:6},
{id:'camp',name:'Abandoned logging camp',at:[-365,-470],shelter:true},
{id:'cache',name:'Emergency supply cabinet',at:[-285,-325]},
{id:'relay',name:'South relay fuse box',at:[190,-395]},
{id:'power',name:'North repeater generator',at:[320,-1120]},
{id:'rescue',name:'West service gate',at:[-410,-1260],shelter:true}
];
export const routes=[[[0,150],[0,70],[-80,-110],[-160,-240],[-285,-325],[-365,-470],[-270,-560],[-144,-736],[35,-800],[200,-960],[320,-1120],[128,-1360]],[[0,70],[130,-140],[190,-395],[80,-512],[210,-600],[-144,-736]],[[-144,-736],[-260,-850],[-365,-1030],[-410,-1260]],[[-365,-470],[-365,-1030]],[[200,-960],[-64,-1160],[-410,-1260]],[[128,-1360],[-64,-1160]]];
export function height(x,z){return 6*Math.sin(x/130)+9*Math.sin(z/220)+3*Math.sin((x+z)/80);}
export function movement(keys){let f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));let r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));const n=Math.max(1,Math.hypot(f,r));return {f:f/n,r:r/n};}
export function nearest(x,z){return sites.reduce((a,b)=>Math.hypot(x-b.at[0],z-b.at[1])<Math.hypot(x-a.at[0],z-a.at[1])?b:a);}
export function newExpedition(){return {visited:[],repairs:[],position:[0,85],stamina:100,warmth:100,health:100,radio:true,channel:'ellis',map:false,time:0,encounters:0};}
export function repaired(exp,id){return {...exp,repairs:[...new Set([...exp.repairs,id])]};}
export function canRelease(exp){return exp.repairs.includes('relay')&&exp.repairs.includes('power');}
export function stormAt(time){return time>80&&Math.sin(time/68)>.68;}
export function onCrossing(x,z){return Math.abs(z+512)>9||Math.abs(x+270)<16||Math.abs(x-210)<7;}

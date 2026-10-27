export const WEAPONS=[
{id:'ranger',name:'Ranger .243',price:0,damage:100,mag:5,scope:45,range:220,speed:820,cycle:1.05,reload:1.7,type:'rifle',desc:'Starter bolt-action · reliable at medium range'},
{id:'timber',name:'Timber .308',price:480,damage:175,mag:5,scope:28,range:360,speed:860,cycle:.95,reload:1.8,type:'rifle',desc:'Heavy hunting rifle · strong body hits'},
{id:'magnum',name:'Ridge Magnum',price:1250,damage:280,mag:4,scope:18,range:520,speed:970,cycle:1.25,reload:2.1,type:'rifle',desc:'Long-range optic · maximum stopping power'},
{id:'bow',name:'Silent Bow',price:750,damage:140,mag:1,scope:55,range:100,speed:85,cycle:.85,reload:.1,type:'bow',desc:'Quiet · recover every arrow from targets or terrain'},
{id:'pistol',name:'Trail Pistol',price:350,damage:54,mag:12,scope:60,range:130,speed:350,cycle:.22,reload:1.3,type:'pistol',desc:'Fast sidearm · light and inexpensive'},
{id:'shotgun',name:'Brush Shotgun',price:900,damage:34,mag:6,scope:58,range:95,speed:420,cycle:.7,reload:2.2,type:'shotgun',pellets:7,desc:'Seven physical pellets · broad close-range spread'},
{id:'carbine',name:'Frontier Carbine',price:2100,damage:70,mag:30,scope:42,range:300,speed:830,cycle:.105,reload:2,type:'carbine',automatic:true,desc:'Full auto · controllable bursts and a 30-round magazine'},
{id:'marksman',name:'Sentinel DMR',price:4200,damage:155,mag:12,scope:24,range:500,speed:910,cycle:.34,reload:2.2,type:'rifle',desc:'Semi-auto precision · long-range squad support'},
{id:'crossbow',name:'Field Crossbow',price:2400,damage:240,mag:1,scope:35,range:160,speed:120,cycle:1.25,reload:.1,type:'bow',desc:'Recoverable bolts · heavier, flatter shots'},
{id:'lmg',name:'Expedition LMG',price:8500,damage:90,mag:80,scope:40,range:380,speed:850,cycle:.08,reload:4,type:'lmg',automatic:true,desc:'Sustained fire · 80 rounds · slow belt reload'}
];
export const isArrow=g=>g?.type==='bow';
// Fractional mouse motion is retained; ADS scales angular sensitivity by field of view.
export function aimStep(state,dx,dy,{sensitivity=.00125,ads=false,fov=45}={}){const factor=sensitivity*(ads?Math.max(.2,fov/72):1);state.targetYaw=(state.targetYaw??state.yaw)-dx*factor;state.targetPitch=Math.max(-1.43,Math.min(1.43,(state.targetPitch??state.pitch)-dy*factor));}
export function smoothAim(state,dt,smoothing=22){const a=1-Math.exp(-smoothing*Math.max(0,dt));state.yaw+=(state.targetYaw-state.yaw)*a;state.pitch+=(state.targetPitch-state.pitch)*a;}

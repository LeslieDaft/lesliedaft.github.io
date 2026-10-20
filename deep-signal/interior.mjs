import * as THREE from '../after-bell/vendor/three.module.js';
import {PARTS,SLOTS,UPGRADES,stats as shipStats} from './model.mjs?v=2';

export function hitRegionUV(uv,width,height,regions){const x=uv.x*width,y=(1-uv.y)*height;return regions.find(r=>x>=r.x-1e-6&&x<=r.x+r.w+1e-6&&y>=r.y-1e-6&&y<=r.y+r.h+1e-6)||null;}

/** Real geometry and texture-mapped, directly clickable control surfaces. */
export function createInterior({onAction}){
 const group=new THREE.Group();group.name='Walkable pressure cabin';
 const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,10),interactive=[],panels=[],feeds=[],stationFeeds=[];
 const mat=(color,metalness=.4,roughness=.6,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
 const steel=mat(0x253b43,.7),dark=mat(0x101c23,.6),edge=mat(0x6c7267,.7),brass=mat(0x99824d,.65),rubber=mat(0x151c20,.1,.9),red=mat(0x6a2f27,.2),glow=mat(0x83e6bc,.1,.3,{emissive:0x46a889,emissiveIntensity:1.2});
 function box(x,y,z,w,h,d,m=steel,parent=group){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
 function cylinder(x,y,z,r,h,m=steel,parent=group){const o=new THREE.Mesh(cylGeo,m);o.position.set(x,y,z);o.scale.set(r,h,r);parent.add(o);return o;}
 function pipe(points,r=.055,m=brass){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,20,r,6,false),m);group.add(o);return o;}
 // Plate floor, anti-slip seams, low cable conduits, pressure ribs and ceiling machinery.
 box(0,-2.22,0,4.45,.22,15.3,dark);
 for(let z=-7;z<=7;z+=1){box(0,-2.08,z,4.35,.06,.92,steel);for(let x of [-1.5,-.5,.5,1.5]){let m=box(x,-2.04,z,.55,.025,.035,edge);m.rotation.y=.55;}}
 for(let z of [-7.8,-4.8,-1.5,2,5.5,7.7]){const rib=new THREE.Mesh(new THREE.TorusGeometry(2.93,.09,5,16),brass);rib.position.z=z;group.add(rib);for(let side of [-1,1])box(side*2.55,-.4,z,.18,3.4,.2,edge);}
 for(let side of [-1,1]){pipe([[side*2.55,-1.6,-7.5],[side*2.65,-1.6,0],[side*2.55,-1.6,7.4]],.12,steel);pipe([[side*1.6,2.3,-6],[side*1.8,2.5,-1],[side*1.65,2.3,7]],.065,brass);for(let z=-6;z<8;z+=2){box(side*2.68,.1,z,.16,.5,.55,dark);box(side*2.57,.15,z,.08,.06,.32,glow);}}
 for(let z=-5;z<=6;z+=3){box(0,2.55,z,1.5,.18,.7,dark);box(0,2.43,z,1.1,.06,.25,glow);const l=new THREE.PointLight(0x85d9bb,5,7,2);l.position.set(0,2,z);group.add(l);}
 box(0,0,7.95,4.3,4.1,.15,dark);const aftDoor=new THREE.Mesh(new THREE.CircleGeometry(1.5,12),steel);aftDoor.position.set(0,-.1,7.82);aftDoor.rotation.y=Math.PI;group.add(aftDoor);const wheel=new THREE.Mesh(new THREE.TorusGeometry(.62,.065,5,10),brass);wheel.position.set(0,-.1,7.65);group.add(wheel);for(let angle=0;angle<Math.PI*2;angle+=Math.PI/3){const spoke=box(0,-.1,7.65,.06,1.15,.07,brass);spoke.rotation.z=angle;}
 // Distant rear machinery, no spherical crew models.
 box(1.65,-.9,6.4,1.1,2.3,1.5,steel);for(let j=0;j<5;j++)box(1.66,-1.55+j*.35,5.62,.8,.07,.06,brass);box(-1.7,-.7,6.5,.9,2.6,1.4,dark);for(let j=0;j<3;j++)box(-1.7,-1.2+j*.6,5.78,.6,.35,.04,j===1?glow:edge);
 pipe([[-2.2,-1,5],[-2.3,1,5],[-1,2.2,5],[1.7,2.2,5]],.085,red);
 const scratch=document.createElement('canvas');scratch.width=256;scratch.height=128;const sctx=scratch.getContext('2d');sctx.fillStyle='#28393d';sctx.fillRect(0,0,256,128);sctx.strokeStyle='#4a5a57';for(let i=0;i<10;i++){sctx.beginPath();sctx.moveTo(i*30,0);sctx.lineTo(i*30-80,128);sctx.stroke();}const floorTex=new THREE.CanvasTexture(scratch);floorTex.colorSpace=THREE.SRGBColorSpace;floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(2,8);group.children[0].material=new THREE.MeshStandardMaterial({map:floorTex,metalness:.55,roughness:.8});
 function seat(x,z,station){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);box(0,-1.28,0,.88,.24,.85,rubber,g);box(0,-.75,.36,.92,1.1,.18,rubber,g);cylinder(0,-1.75,0,.12,.7,steel,g);for(let side of [-1,1])box(side*.53,-.84,0,.12,.12,.8,steel,g);const button=box(0,-.3,.47,.7,.25,.07,brass,g);interactive.push({mesh:button,action:()=>onAction('seat',{station})});return g;}
 seat(0,-3.7,'pilot');seat(-1.55,-2.15,'gunner');seat(1.55,-2.15,'torpedo');seat(-1.5,2.0,'drill');
 // Four angular, proportioned crew figures actually occupy the unclaimed stations.
 const crewFigures=[];
 function crewFigure(x,z,station,color){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);const uniform=mat(color,.05,.88),skin=mat(0xb49a7e,0,.9),trim=mat(0x18282c,.2,.8);const shape=new THREE.Shape();shape.moveTo(-.25,-.4);shape.lineTo(.25,-.4);shape.lineTo(.34,.3);shape.lineTo(-.34,.3);shape.closePath();const torso=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,steps:1}),uniform);torso.position.set(0,-.62,-.15);g.add(torso);box(0,-.65,-.185,.3,.47,.045,trim,g);for(let side of [-1,1]){box(side*.17,-.55,-.222,.08,.28,.025,brass,g);const upper=box(side*.39,-.64,-.12,.16,.47,.18,uniform,g);upper.rotation.z=side*.12;const fore=box(side*.4,-.84,-.4,.15,.16,.55,uniform,g);box(side*.4,-.81,-.71,.16,.1,.18,skin,g);box(side*.18,-1.35,-.31,.22,.25,.7,uniform,g);box(side*.18,-1.65,-.6,.2,.5,.22,uniform,g);box(side*.18,-1.93,-.72,.24,.18,.42,trim,g);}
 cylinder(0,-.16,0,.12,.16,skin,g);const head=cylinder(0,.095,0,.215,.43,skin,g);head.rotation.y=Math.PI/6;box(0,.22,.02,.43,.17,.38,trim,g);for(let side of [-1,1]){box(side*.14,.13,-.205,.065,.045,.025,dark,g);box(side*.245,.14,0,.08,.2,.22,trim,g);}box(0,.02,-.22,.09,.1,.06,skin,g);pipe([[x+.27,.03,z-.02],[x+.34,-.02,z-.15],[x+.12,-.06,z-.25]],.018,steel);crewFigures.push({g,station,head});}
 crewFigure(0,-3.7,'pilot',0x52615a);crewFigure(-1.55,-2.15,'gunner',0x5d6453);crewFigure(1.55,-2.15,'torpedo',0x5d5550);crewFigure(-1.5,2,'drill',0x6a6044);
 function panel(name,pos,w,h,rotation={x:0,y:0,z:0},resolution=[900,550]){const canvas=document.createElement('canvas');[canvas.width,canvas.height]=resolution;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));mesh.position.set(...pos);mesh.rotation.set(rotation.x||0,rotation.y||0,rotation.z||0);group.add(mesh);const frame=new THREE.Mesh(new THREE.BoxGeometry(w+.14,h+.14,.12),dark);frame.position.copy(mesh.position);frame.rotation.copy(mesh.rotation);frame.position.add(new THREE.Vector3(0,0,-.07).applyEuler(mesh.rotation));group.add(frame);const p={name,canvas,ctx,texture,mesh,regions:[]};panels.push(p);interactive.push({mesh,panel:p});return p;}
 const helm=panel('HELM',[0,-1.02,-6.55],2.25,.76,{x:-.27},[1000,570]);box(0,-1.78,-6.5,3.5,.5,.9,dark);for(let side of [-1,1]){cylinder(side*1.02,-.8,-5.55,.09,.65,brass);box(side*1.02,-.48,-5.55,.26,.12,.12,rubber);}
 // Three actual live render-target cameras on physical dashboard monitors.
 for(let i=0;i<3;i++){const x=i===0?-2.15:2.15,y=i===2?.38:-.52,monitor=new THREE.Mesh(new THREE.PlaneGeometry(.9,.5),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));monitor.position.set(x,y,-6.8);group.add(monitor);box(x,y,-6.88,1.02,.62,.12,dark);feeds.push(monitor);const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=70;const lc=labelCanvas.getContext('2d');lc.fillStyle='#0a171b';lc.fillRect(0,0,512,70);lc.fillStyle='#a5d5be';lc.font='bold 34px monospace';lc.fillText(['PORT CAM','STARBOARD','AFT CAM'][i],25,47);const lt=new THREE.CanvasTexture(labelCanvas);lt.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(.9,.12),new THREE.MeshBasicMaterial({map:lt,toneMapped:false}));label.position.set(x,y+.34,-6.79);group.add(label);}
 const gun=panel('GUN',[-1.45,-.85,-4.65],2.0,.76,{x:-.18,y:.1},[800,650]);const torp=panel('TORPEDO',[1.45,-.85,-4.65],2.0,.76,{x:-.18,y:-.1},[800,650]);
 const drill=panel('DRILL',[-2.45,-.92,1.3],2.0,.76,{y:Math.PI/2},[850,570]);box(-2.61,-1.28,1.3,.65,1.4,1.9,dark);

 // Actual camera images at each working station; the image itself is the aim/fire surface.
 for(const spec of [{station:'gunner',pos:[-1.45,.28,-4.8],ry:.1},{station:'torpedo',pos:[1.45,.28,-4.8],ry:-.1},{station:'drill',pos:[-2.45,.28,1.3],ry:Math.PI/2}]){
  const video=new THREE.Mesh(new THREE.PlaneGeometry(2.05,1.15),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));video.position.set(...spec.pos);video.rotation.y=spec.ry;group.add(video);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(2.18,1.28,.1),dark);frame.position.copy(video.position).add(new THREE.Vector3(0,0,-.07).applyEuler(video.rotation));frame.rotation.copy(video.rotation);group.add(frame);
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const hud=new THREE.Mesh(video.geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false}));hud.position.copy(video.position).add(new THREE.Vector3(0,0,.012).applyEuler(video.rotation));hud.rotation.copy(video.rotation);group.add(hud);
  const feed={station:spec.station,mesh:video,canvas,texture,u:.5,v:.5};stationFeeds.push(feed);interactive.push({mesh:video,video:feed});
 }
 // A small fabrication table with an actual screen on its top, reachable while walking.
 box(1.15,-1.03,2.6,2.5,.24,2.35,steel);for(let x of [.2,2.1])for(let z of [1.7,3.5])box(x,-1.58,z,.13,1,.13,brass);
 const shop=panel('SHOP',[1.15,-.882,2.6],2.24,1.96,{x:-Math.PI/2},[1600,1100]);
 // Physical labels, directly clickable, on the pressure bulkheads.
 const aisle=panel('AISLE',[0,.55,7.69],2.3,.7,{y:Math.PI},[900,270]);
 const topLabel=panel('LABEL',[1.82,1.25,2.55],1.25,.6,{y:-Math.PI/2},[700,300]);
 const nav=panel('STAND',[0,1.86,-6.7],2.4,.35,{},[1000,150]);
 const statusColors={cyan:'#91e3c4',gold:'#d9bd83',muted:'#8baaaa',red:'#e89d82',white:'#d7e7dd'};
 function base(p,title,subtitle=''){const {ctx:c,canvas:v}=p;p.regions=[];c.fillStyle='#081c20';c.fillRect(0,0,v.width,v.height);c.strokeStyle='#396156';c.lineWidth=3;c.strokeRect(3,3,v.width-6,v.height-6);c.font='bold 32px monospace';c.fillStyle=statusColors.cyan;c.fillText(title,26,46);if(subtitle){c.font='18px monospace';c.fillStyle=statusColors.muted;c.fillText(subtitle,26,75);}return c;}
 function text(c,txt,x,y,size=23,color=statusColors.white,max){c.font=`${size}px monospace`;c.fillStyle=color;if(max)c.fillText(txt,x,y,max);else c.fillText(txt,x,y);}
 function btn(p,label,x,y,w,h,action,enabled=true){const c=p.ctx;c.fillStyle=enabled?'#254a40':'#152f2c';c.fillRect(x,y,w,h);c.strokeStyle=enabled?'#82b89a':'#365149';c.lineWidth=2;c.strokeRect(x,y,w,h);c.font=`bold ${Math.min(23,h*.36)}px monospace`;c.fillStyle=enabled?'#d6e9c9':'#66887c';c.textAlign='center';c.fillText(label,x+w/2,y+h*.62);c.textAlign='left';if(enabled)p.regions.push({x,y,w,h,action});}
 let mountIndex=0,partIndex=0,selectedResearch='ballistics-1',shopTab='tree',last=-10,lastState=null;
 function update(state){lastState=state;for(const crew of crewFigures){crew.g.visible=!(state.seated&&state.station===crew.station);crew.head.rotation.y=Math.sin(state.time*.32+crew.g.position.x)*.08;}if(state.time-last<.18)return;last=state.time;const {save,stats:s,hull,depth,station,seated,nearDock}=state;
 let c=base(helm,'NAUTILUS / HELM','PORT              STARBOARD              AFT');text(c,`${Math.floor(depth)} m / ${s.crushDepth} m`,25,123,35);text(c,`HULL ${Math.round(hull/s.maxHull*100)}%   ${Math.round(Math.abs(state.speed)*1.94)} KNOTS`,25,165,28);text(c,seated&&station==='pilot'?'YOU HAVE THE HELM':'VALE / HOLDING POSITION',25,205,22,statusColors.gold);
 btn(helm,'SIT AT HELM',25,230,440,65,()=>onAction('seat',{station:'pilot'}));btn(helm,'STAND / WALK',490,230,480,65,()=>onAction('stand'));
 [['THRUST +','forward',25,320],['THRUST −','reverse',345,320],['HOLD / STOP','stop',665,320],['TURN LEFT','left',25,405],['TURN RIGHT','right',345,405],['BOOST','boost',665,405],['DIVE','descend',25,490],['ASCEND','ascend',345,490],['LEVEL','level',665,490]].forEach(([l,cmd,x,y])=>btn(helm,l,x,y,300,58,()=>onAction('helm',{command:cmd})));helm.texture.needsUpdate=true;
 for(const [p,id,name] of [[gun,'gunner','HYDROPHOBIC GUNS'],[torp,'torpedo','TORPEDO CONTROL'],[drill,'drill','MINING STATION']]){c=base(p,name,id==='gunner'?'REYES / UNDERWATER BALLISTICS':id==='torpedo'?'CHEN / HEAVY WEAPONS':'MOSS / EXCAVATION');text(c,id==='torpedo'?(s.torpedoDamage?`WARHEAD ${s.torpedoDamage} / ${state.torpTimer.toFixed(1)}s`:'NO TUBE INSTALLED'):id==='drill'?`DRILL ${s.drillRate.toFixed(0)} / CARGO ${Math.floor(save.cargo)}`:`DAMAGE ${s.gunDamage.toFixed(0)} / CREW ONLINE`,25,125,26,statusColors.gold,p.canvas.width-50);text(c,seated&&station===id?'MANUAL STATION':'AI CREW ACTIVE',25,174,25);if(id==='drill')text(c,state.nearestOre?'ORE SEAM IN RANGE':'APPROACH A GLOWING WALL SEAM',25,217,21,statusColors.muted,p.canvas.width-50);btn(p,'SIT / TAKE CONTROL',25,265,p.canvas.width-50,90,()=>onAction('seat',{station:id}));btn(p,id==='drill'?'START / STOP DRILL':id==='torpedo'?'LAUNCH TORPEDO':'FIRE BURST',25,id==='drill'?370:385,p.canvas.width-50,id==='drill'?75:95,()=>onAction('fire',{station:id}));btn(p,'STAND / WALK',25,p.canvas.height-100,p.canvas.width-50,68,()=>onAction('stand'));p.texture.needsUpdate=true;}

 for(const f of stationFeeds){const c=f.canvas.getContext('2d'),w=f.canvas.width,h=f.canvas.height;c.clearRect(0,0,w,h);c.strokeStyle='#9ce9c6';c.lineWidth=2;const x=f.u*w,y=(1-f.v)*h;c.beginPath();c.moveTo(x-19,y);c.lineTo(x-6,y);c.moveTo(x+6,y);c.lineTo(x+19,y);c.moveTo(x,y-19);c.lineTo(x,y-6);c.moveTo(x,y+6);c.lineTo(x,y+19);c.stroke();c.fillStyle='#091d21cc';c.fillRect(0,0,w,46);c.font='bold 22px monospace';c.fillStyle='#c9f5da';c.fillText(f.station==='drill'?'DRILL CAM / TAP ORE TO MINE':f.station==='torpedo'?'TORPEDO CAM / CLICK TARGET TO LAUNCH':'GUN CAM / CLICK TARGET TO FIRE',15,30);f.texture.needsUpdate=true;}
 const selected=SLOTS[mountIndex%SLOTS.length],compatible=PARTS.filter(p=>selected.kinds.includes(p.kind)),part=compatible[partIndex%compatible.length];
 c=base(shop,'ONBOARD FABRICATOR','SELECT A NODE OR MOUNT DIRECTLY');
 text(c,`${Math.floor(save.money)} CR / ${s.crushDepth}m RATED / POWER ${s.powerUsed}/${s.powerCapacity}`,30,110,26,statusColors.gold);
 btn(shop,'RESEARCH TREE',30,135,470,70,()=>{shopTab='tree';last=-10;});btn(shop,'PARTS & MOUNTS',530,135,470,70,()=>{shopTab='parts';last=-10;});
 btn(shop,'SELL CARGO',1050,30,240,55,()=>onAction('sell'),nearDock);btn(shop,'REPAIR / DOCK',1310,30,260,55,()=>onAction('repair'),nearDock);
 if(shopTab==='tree'){
  const branches=['Weapons','Mining','Hull','Power','Crew'],nodes=new Map();
  for(let col=0;col<branches.length;col++){const branch=branches[col],list=UPGRADES.filter(u=>u.branch===branch);text(c,branch.toUpperCase(),30+col*312,250,27,statusColors.cyan);list.forEach((u,row)=>nodes.set(u.id,{u,x:30+col*312,y:280+row*205,w:285,h:160}));}
  for(const n of nodes.values())for(const id of n.u.requires){const parent=nodes.get(id);if(!parent)continue;c.strokeStyle=save.upgrades[id]?'#9bcc94':'#38504c';c.lineWidth=6;c.beginPath();c.moveTo(parent.x+parent.w/2,parent.y+parent.h);c.lineTo(n.x+n.w/2,n.y);c.stroke();}
  for(const n of nodes.values()){
   const owned=!!save.upgrades[n.u.id],ready=n.u.requires.every(id=>save.upgrades[id]),chosen=selectedResearch===n.u.id;
   c.fillStyle=owned?'#425335':ready?'#204d43':'#1c2b30';c.fillRect(n.x,n.y,n.w,n.h);c.strokeStyle=chosen?'#fff2ad':owned?'#a4ce82':ready?'#72c9ae':'#52615f';c.lineWidth=chosen?5:2;c.strokeRect(n.x,n.y,n.w,n.h);
   const words=n.u.name.split(' ');let line='',yy=n.y+37;for(const word of words){if((line+' '+word).length>18){text(c,line,n.x+14,yy,23);line=word;yy+=28;}else line+=(line?' ':'')+word;}text(c,line,n.x+14,yy,23);
   text(c,owned?'RESEARCHED':ready?n.u.price+' CR':'LOCKED / PREVIOUS NODE',n.x+14,n.y+136,18,owned?statusColors.gold:statusColors.muted);
   shop.regions.push({...n,action:()=>{selectedResearch=n.u.id;last=-10;}});
  }
  const up=UPGRADES.find(u=>u.id===selectedResearch),owned=!!save.upgrades[up.id],missing=up.requires.filter(id=>!save.upgrades[id]);
  text(c,up.name.toUpperCase(),30,950,30,statusColors.gold);text(c,up.description,30,990,23,statusColors.white,1500);
  text(c,missing.length?'REQUIRES: '+missing.map(id=>UPGRADES.find(u=>u.id===id).name).join(', '):owned?'INSTALLED / BENEFITS ACTIVE':'UNLOCKED / SELECT RESEARCH TO PURCHASE',30,1038,20,statusColors.muted,1040);
  btn(shop,owned?'RESEARCHED':missing.length?'LOCKED':`RESEARCH / ${up.price} CR`,1110,1010,460,62,()=>onAction('research',{id:up.id}),!owned&&!missing.length&&save.money>=up.price);
 }else{
  text(c,'1 / SELECT MOUNT',30,250,28,statusColors.cyan);
  SLOTS.forEach((slot,i)=>{const x=30+(i%5)*312,y=275+Math.floor(i/5)*110,fitted=PARTS.find(p=>p.id===save.parts[slot.id]);btn(shop,slot.name,x,y,285,92,()=>{mountIndex=i;partIndex=0;last=-10;});if(i===mountIndex){c.strokeStyle='#fff2ad';c.lineWidth=5;c.strokeRect(x,y,285,92);}text(c,fitted?fitted.name:'EMPTY',x+9,y+81,15,statusColors.gold,265);});
  text(c,'2 / SELECT COMPATIBLE COMPONENT',30,520,28,statusColors.cyan);
  compatible.forEach((p,i)=>{const x=30+(i%4)*390,y=545+Math.floor(i/4)*150;btn(shop,p.name,x,y,365,125,()=>{partIndex=i;last=-10;});if(part.id===p.id){c.strokeStyle='#fff2ad';c.lineWidth=5;c.strokeRect(x,y,365,125);}text(c,`${p.price} CR / ${p.weight}t`,x+13,y+105,21,statusColors.gold);});
  const preview=shipStats({...save,parts:{...save.parts,[selected.id]:part.id}}),locked=part.requires.some(id=>!save.upgrades[id]),over=preview.powerUsed>preview.powerCapacity,fitted=save.parts[selected.id]===part.id;
  text(c,part.description,30,900,24,statusColors.white,1510);text(c,`AFTER FITTING: ${preview.crushDepth}m RATED / ${preview.maxHull} HULL / ${preview.speed.toFixed(1)} SPEED / POWER ${preview.powerUsed}/${preview.powerCapacity}`,30,946,25,statusColors.gold,1510);
  text(c,locked?'RESEARCH REQUIRED: '+part.requires.map(id=>UPGRADES.find(u=>u.id===id).name).join(', '):over?'POWER BUDGET EXCEEDED / RESEARCH POWER OR FIT REACTOR':fitted?'ALREADY FITTED':save.money<part.price?'INSUFFICIENT CREDITS':'COMPATIBLE / READY TO INSTALL',30,1002,20,statusColors.muted,1050);
  btn(shop,fitted?'INSTALLED':`BUY & PLACE / ${part.price} CR`,1110,1000,460,72,()=>onAction('buy',{partId:part.id,slotId:selected.id}),!locked&&!over&&!fitted&&save.money>=part.price);
 }
 shop.texture.needsUpdate=true;
 c=base(nav,'CLICK: STAND & WALK  /  RIGHT-DRAG: LOOK');nav.regions.push({x:0,y:0,w:1000,h:150,action:()=>onAction('stand')});nav.texture.needsUpdate=true;
 c=base(aisle,'PRESSURE BULKHEAD / ENGINEERING');text(c,'CLICK TO RETURN TO HELM',28,125,28);btn(aisle,'SIT AT HELM',28,165,840,70,()=>onAction('seat',{station:'pilot'}));aisle.texture.needsUpdate=true;
 c=base(topLabel,'FABRICATOR');text(c,'PARTS / PRESSURE',25,105,28);text(c,'RESEARCH TABLE ↓',25,155,28);topLabel.texture.needsUpdate=true;
 }
 function interact(raycaster){group.updateWorldMatrix(true,true);const hits=raycaster.intersectObjects(interactive.map(i=>i.mesh),false);for(const hit of hits){if(hit.distance>8)return false;const item=interactive.find(i=>i.mesh===hit.object);if(item.video&&hit.uv){item.video.u=hit.uv.x;item.video.v=hit.uv.y;onAction('aim',{station:item.video.station,u:hit.uv.x,v:hit.uv.y});return true;}if(item.panel&&hit.uv){const p=item.panel;const region=hitRegionUV(hit.uv,p.canvas.width,p.canvas.height,p.regions);if(region)region.action();return true;}if(item.action){item.action();return true;}}return false;}
 return {group,interact,update,setFeedTextures(textures){feeds.forEach((m,i)=>{m.material.map=textures[i];m.material.needsUpdate=true;});stationFeeds.forEach((f,i)=>{f.mesh.material.map=textures[i+3];f.mesh.material.needsUpdate=true;});},seatPositions:{pilot:new THREE.Vector3(0,.95,-4.5),gunner:new THREE.Vector3(-1.3,.35,-2.8),torpedo:new THREE.Vector3(1.3,.35,-2.8),drill:new THREE.Vector3(-.7,.4,1.35)},get cameraScreens(){return stationFeeds.map(f=>({station:f.station,position:f.mesh.position.toArray()}));},get meshes(){return interactive.map(i=>i.mesh);},get panelInfo(){return panels.map(p=>({name:p.name,width:p.canvas.width,height:p.canvas.height,position:p.mesh.position.toArray(),regions:p.regions.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h}))}));}};
}

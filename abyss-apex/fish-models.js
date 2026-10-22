import * as T from '../northline/assets/three.module.js';
import {TYPES} from './species.js';
const skins=new Map(),neutral=new Map();
function material(color){if(!neutral.has(color))neutral.set(color,new T.MeshStandardMaterial({color,roughness:.52,metalness:.1}));return neutral.get(color)}
function skin(type){if(skins.has(type))return skins.get(type);const s=TYPES[type],w=256,h=128,bytes=new Uint8Array(w*h*4),c=new T.Color(s.color).convertLinearToSRGB();for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const v=y/h,u=x/w,belly=Math.max(0,-Math.cos(v*Math.PI*2)),scale=.92+.10*Math.cos(x*.6+Math.floor(y/5)*3)*Math.cos(y*.9),noise=((x*37+y*19)%31)/310;
 let dark=1;if(type===9&&((u>.24&&u<.31)||(u>.49&&u<.57)||(u>.79&&u<.85)))dark=2.2;
 else if([1,5,11,13].includes(type)&&Math.sin(u*52+Math.sin(v*9)*.7)>.38)dark=.5;
 else if([12,16,20].includes(type)&&Math.sin(u*113)*Math.sin(v*77)>.57)dark=.42;
 else if(type===10&&u>.45&&v<.7)dark=.4;
 for(let k=0;k<3;k++){const value=[c.r,c.g,c.b][k];bytes[(y*w+x)*4+k]=Math.min(255,255*((value*scale+noise)*(1-belly*.42)+belly*.38)*dark)}bytes[(y*w+x)*4+3]=255;
 }const tex=new T.DataTexture(bytes,w,h);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.needsUpdate=true;const m=new T.MeshStandardMaterial({map:tex,roughness:.5,metalness:.12});skins.set(type,m);return m}
const sphere=new T.SphereGeometry(1,16,10);
function merged(parts){const pos=[],norm=[],uv=[],flap=[],groups=[];let offset=0;for(const p of [...parts].sort((a,b)=>a.material-b.material)){let g=p.geo.index?p.geo.toNonIndexed():p.geo.clone();g.scale(...(p.scale||[1,1,1]));if(p.rot){g.rotateX(p.rot[0]);g.rotateY(p.rot[1]);g.rotateZ(p.rot[2])}g.translate(...(p.at||[0,0,0]));const a=g.attributes.position,n=g.attributes.normal,t=g.attributes.uv;for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n?.getX(i)||0,n?.getY(i)||1,n?.getZ(i)||0);uv.push(t?.getX(i)||0,t?.getY(i)||0);flap.push(p.flap||0)}const last=groups[groups.length-1];if(last&&last[2]===p.material)last[1]+=a.count;else groups.push([offset,a.count,p.material]);offset+=a.count;g.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('swimFin',new T.Float32BufferAttribute(flap,1));groups.forEach(x=>g.addGroup(...x));return g}
function bodyGeometry(shape){const eel=shape==='eel',deep=['deep','angel','lion','horse'].includes(shape),puff=shape==='puffer',ray=shape==='ray',shark=['shark','hammer'].includes(shape);const rings=40,sides=28,p=[],uv=[],idx=[];
 for(let i=0;i<=rings;i++){const t=i/rings,x=.58-t*1.14,envelope=Math.pow(Math.sin(Math.PI*t),eel?.35:.68),taper=.85+.15*Math.sin(t*4);let ry=(puff?.36:ray?.095:deep?.34:eel?.13:shark?.18:.23)*envelope,rz=(puff?.31:ray?.36:deep?.14:eel?.12:.18)*envelope;
 for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2,y=Math.cos(angle)*ry,z=Math.sin(angle)*rz;p.push(x,y+(shape==='horse'?Math.sin(t*4)*.12:0),z*taper);uv.push(t,j/sides)}}
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
function fin(points){const shape=new T.Shape();points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();return new T.ShapeGeometry(shape)}
export function createFish(type,size){const spec=TYPES[type],shape=spec.shape,shark=['shark','hammer'].includes(shape),eel=shape==='eel',ray=shape==='ray',parts=[];
 const mats=[skin(type).clone(),material(0x293f48).clone(),material(0xe2e7c9).clone(),material(0x060f15).clone(),material(0xc5aa57).clone()];mats.forEach(m=>{m.side=T.DoubleSide});
 const add=(geo,at,scale,material=0,rot=[0,0,0],flap=0)=>parts.push({geo,at,scale,material,rot,flap});
 add(bodyGeometry(shape),[0,0,0],[1,1,1]);
 // Separate anatomical silhouettes: winged rays, long eels, hammer heads, tall reef fish.
 if(shape==='hammer')add(sphere,[.46,.025,0],[.17,.105,.43]);
 if(shape==='sword')add(new T.ConeGeometry(.035,.65,10),[.80,.025,0],[1,1,1],0,[0,0,-Math.PI/2]);
 if(shape==='cat')for(const side of [-1,1])for(let i=0;i<3;i++)add(new T.CylinderGeometry(.004,.002,.3,4),[.47,-.05-i*.02,side*(.15+i*.025)],[1,1,1],2,[side*.8,0,-.8]);
 if(shape==='horse'){add(sphere,[.27,.27,0],[.15,.17,.12]);add(new T.CylinderGeometry(.035,.055,.27,10),[.45,.30,0],[1,1,1],0,[0,0,Math.PI/2]);for(let i=0;i<12;i++){const a=i*.30;add(sphere,[-.38-Math.sin(a)*.13,-.22-Math.cos(a)*.13,0],[.033,.035,.035])}}
 const tail=eel?[[0,0],[-.2,.14],[-.27,0],[-.2,-.14]]:shape==='fan'?[[0,0],[-.3,.37],[-.38,.23],[-.25,0],[-.38,-.23],[-.3,-.37]]:[[0,0],[-.29,.32],[-.23,.13],[-.12,0],[-.23,-.13],[-.29,-.30]];
 add(fin(tail),[-.49,0,0],[1,1,1],0,[0,0,0],1);
 if(ray){for(const side of [-1,1]){add(fin([[.32,0],[-.3,0],[-.18,.95],[.1,.75]]),[0,0,0],[1,1,1],0,[side*Math.PI/2,0,0],2)}add(new T.ConeGeometry(.018,.8,8),[-.94,0,0],[1,1,1],1,[0,0,Math.PI/2])}
 else{add(fin([[-.30,.13],[-.12,shape==='angel'?.66:shark?.5:eel?.23:.38],[.16,.17]]),[0,0,0],[1,1,1],0,[0,0,0],.3);for(const side of [-1,1]){add(fin([[-.12,0],[.12,-.30],[.30,0]]),[.10,-.07,side*.12],[1,1,1],0,[side*1.05,0,0],side*.8);add(fin([[-.25,0],[-.35,-.19],[-.05,0]]),[-.04,-.10,side*.05],[1,1,1],0,[side*.7,0,0],.6)}}
 if(shape==='lion'||shape==='puffer'){for(let i=0;i<(shape==='lion'?16:32);i++){const a=i*2.4,x=-.3+(i%7)*.09;add(new T.ConeGeometry(.009,shape==='lion'?.4:.12,4),[x,Math.cos(a)*.29,Math.sin(a)*.18],[1,1,1],2,[a,0,(i%3-.8)*.35],.3)}}
 for(const side of [-1,1]){const eyeX=shape==='hammer'?.47:shape==='horse'?.29:.38,eyeY=shape==='horse'?.33:.085,eyeZ=shape==='hammer'?.40:.135;add(sphere,[eyeX,eyeY,side*eyeZ],[.043,.047,.026],4);add(sphere,[eyeX+.009,eyeY,side*(eyeZ+.021)],[.023,.029,.011],3);add(sphere,[eyeX+.015,eyeY+.013,side*(eyeZ+.03)],[.007,.008,.004],2);
 for(let j=0;j<(shark?5:2);j++)add(sphere,[.19-j*.029,0,side*.166],[.006,.07,.003],1,[0,0,-.2]);
 // Thin fin rays and lateral lines make close fish readable without dozens of extra draw calls.
 for(let j=0;j<8;j++)add(new T.CylinderGeometry(.0018,.001,.22,3),[-.59-j*.02,(j-3.5)*.024,side*.004],[1,1,1],2,[0,0,-.7-j*.08]);
 add(sphere,[-.06,.025,side*.175],[.32,.004,.003],1);
 }
 const geometry=merged(parts),u={time:{value:0},amplitude:{value:1},turn:{value:0},frequency:{value:5},wounds:{value:Array.from({length:20},()=>new T.Vector4(0,0,0,0))},wing:{value:ray?1:0}};
 for(const m of mats){m.onBeforeCompile=shader=>{shader.uniforms.biteWounds=u.wounds;shader.fragmentShader='varying vec3 bitePosition; uniform vec4 biteWounds[20];\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfor(int wi=0;wi<20;wi++){if(biteWounds[wi].w>0.0 && distance(bitePosition,biteWounds[wi].xyz)<biteWounds[wi].w) discard;}');Object.assign(shader.uniforms,{swimTime:u.time,swimAmplitude:u.amplitude,swimTurn:u.turn,swimFrequency:u.frequency,swimWing:u.wing});shader.vertexShader='varying vec3 bitePosition; attribute float swimFin; uniform float swimTime,swimAmplitude,swimTurn,swimFrequency,swimWing;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 bitePosition=position;
 float rear=clamp((0.52-position.x)/1.1,0.0,1.0);
 float wave=swimTime*swimFrequency+position.x*7.0;
 float flex=(0.018+rear*rear*${eel?'0.23':'0.10'})*swimAmplitude;
 transformed.z+=sin(wave)*flex+swimTurn*rear*rear*0.10;
 transformed.y+=sin(wave*0.65)*0.012*swimAmplitude;
 transformed.z+=sin(wave+1.4)*abs(swimFin)*0.018*swimAmplitude;
 transformed.y+=swimWing*sin(wave)*abs(position.z)*0.20*swimAmplitude;
 `);};m.customProgramCacheKey=()=>eel?'eel-swim-v1':'fish-swim-v1'}
 const group=new T.Group(),body=new T.Mesh(geometry,mats);group.add(body);group.scale.setScalar(size);body.frustumCulled=false;
 const jaw=new T.Group();jaw.position.set(.30,-.05,0);const lower=new T.Mesh(sphere,material(0xc3cfb8));lower.position.set(.14,-.035,0);lower.scale.set(.17,.045,.11);jaw.add(lower);const mouth=new T.Mesh(sphere,material(0x19282b));mouth.position.set(.47,-.035,0);mouth.scale.set(.09,.023,.10);group.add(mouth);group.add(jaw);
 if(shark)for(let i=0;i<10;i++){const t=new T.Mesh(new T.ConeGeometry(.009,.025,3),material(0xe9ecce));t.position.set(.06+i*.014,-.018,.09);t.rotation.z=Math.PI; jaw.add(t)}
 group.userData={uniforms:u,jaw,tail:new T.Group(),type};return group;
}
export function animateFish(g,time,effort=0,turn=0,bite=0){const u=g.userData.uniforms;if(!u)return;u.time.value=time;u.amplitude.value=.45+Math.min(1.5,effort)*.75;u.frequency.value=3+Math.min(1.5,effort)*4;u.turn.value=T.MathUtils.clamp(turn,-1,1);g.userData.jaw.rotation.z=-Math.sin(Math.min(1,bite)*Math.PI)*.85;}
export function releaseFish(g,shared=[],sharedMaterials=[]){if(!g)return;g.traverse(o=>{if(o.geometry&&o.geometry!==sphere&&!shared.includes(o.geometry))o.geometry.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(![...neutral.values()].includes(m)&&!sharedMaterials.includes(m))m.dispose()}})}

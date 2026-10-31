/* Rooftop Rush expansion: fixed, deterministic courses 07–100.
   Each course combines authored challenge modules; the seed varies dimensions,
   ordering and timing once at load, so every retry and ghost uses the same map. */
(function(root,factory){const pack=factory();if(typeof module==='object'&&module.exports)module.exports=pack;else root.RooftopLevelPack=pack;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const palettes=['dawn','sunset','night','rain','dusk','midnight'];
const districts=['FOUNDATIONS','FREIGHT QUARTER','GLASS DISTRICT','RAIL LINE','SKYLINE WORKS','RAIN CITY','BROKEN HEIGHTS','NEON WARD','CLOUDLINE','THE CITADEL'];
const names=[
 ['','','','','','','AFTER HOURS','COPPER CROSSING','FIRE ESCAPE','DISTRICT LINE'],
 ['LOADING BAY','WAREHOUSE RUN','CARGO HOP','CRANE ALLEY','THE TRANSFER','FORKLIFT LANE','IRON BRIDGE','NIGHT FREIGHT','CONTAINER SKY','LAST DISPATCH'],
 ['WINDOW WALK','REFLECTIONS','GLASS CANYON','SKYBRIDGE','MIRROR EDGE','THE ATRIUM','TRANSPARENT LINE','SUNLIT SPIRES','SHATTERPROOF','HIGH-RISE HORIZON'],
 ['PLATFORM ZERO','SIGNAL GREEN','OVER THE TRACKS','RAILWAY CUT','SWITCHBACK','ELEVATED EXPRESS','THE VIADUCT','NIGHT SERVICE','TERMINAL VELOCITY','END OF THE LINE'],
 ['STEELWORK','OPEN GIRDERS','HARD HAT','THE FOREMAN','BOLTED DOWN','COUNTERWEIGHT','FOUNDATION SHIFT','SCAFFOLD DANCE','CRANE COUNTRY','TOPPING OUT'],
 ['FIRST DROPS','GUTTER RUN','RAIN CHECK','WET CONCRETE','STORM DRAIN','SILVER SKIES','THUNDERHEAD','DOWNPOUR','AFTER THE STORM','THE RAINMAKER'],
 ['FAULT LINE','NO FOOTPRINTS','CRACKED HORIZON','AFTERSHOCK','FALLING DISTRICT','RUPTURE','RUBBLE RELAY','THE LAST SUPPORT','A SECOND TO SPARE','NOTHING LEFT BELOW'],
 ['ELECTRIC AVENUE','MAGENTA MILE','NIGHT MARKET','HOT WIRES','THE AFTERGLOW','LASERLINE','NEON WEATHER','CITY NEVER SLEEPS','STATIC CHARGE','MIDNIGHT CIRCUIT'],
 ['ABOVE THE FOG','CLOUD WALK','PRESSURE DROP','THE THIN AIR','ALTITUDE','UPPER ATMOSPHERE','NO GROUND IN SIGHT','SKYWARD','BETWEEN THE SPIRES','BEYOND THE CLOUDS'],
 ['CITADEL APPROACH','THE OUTER WALL','STEEL ASCENT','FINAL DISTRICT','CROWN OF CONCRETE','NINETY-SIX','THE LONG WAY UP','SKYLINE SOVEREIGN','THE FINAL APPROACH','ROOFTOP CENTURION']
];
const descriptions=['Clean landings and a steady rhythm.','Freight roofs, narrow transfers and low beams.','Climb between the city’s glass towers.','Find your line across the elevated rail district.','Moving steel and exposed construction.','Keep your balance above the rainy streets.','Keep moving: these roofs will not wait.','Fast transitions through the neon skyline.','Precision above the clouds.','The city’s toughest combinations.'];
const hints={gaps:'Keep your momentum. Jump near the roof edge.',stairs:'Rising roofs: hold jump to reach the higher landing.',slide:'Hold S / ↓ under the orange beams. Stand when clear.',spikes:'Watch the warning stripe. Jump the spike patch.',vault:'Jump toward the raised ledge. Catch and climb to carry your speed.',moving:'Moving platforms carry you. Aim for their center.',crumble:'Cracked platforms collapse. Keep your feet moving.',sawSlide:'Slide beneath the overhead saws.',sawJump:'Jump the low saw. Its travel stays inside the marked area.',precision:'Short roofs reward clean, late takeoffs.'};
const pack=[];
for(let number=7;number<=100;number++){
 const district=Math.floor((number-1)/10),stage=(number-1)%10;let seed=(number*2654435761)>>>0;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const pick=(a,b)=>Math.round(a+random()*(b-a));
 const l={name:names[district][stage],subtitle:descriptions[district],district:district+1,districtName:districts[district],stage:stage+1,difficulty:district<2?'FLOW':district<5?'CHALLENGING':district<8?'EXPERT':'MASTER',width:0,palette:palettes[district%6],gold:0,silver:0,start:{x:100,y:600},finish:{x:0,y:600},platforms:[],hazards:[],checkpoints:[],tokens:[],hints:[]};
 let end=500,y=600;const challengeCount=3+Math.floor(district*.65)+(stage>=7?1:0)+(number===100?3:0),types=[];
 function platform(x,top,w,type='roof',extra={}){const p={x,y:top,w,h:type==='roof'||type==='hurdle'?1000:20,type,...extra};l.platforms.push(p);return p;}
 platform(0,600,end);
 function next(gap,w,dy=0,type='roof',extra={}){const x=end+gap,top=Math.max(440,Math.min(650,y+dy)),p=platform(x,top,w,type,extra);l.tokens.push({x:end+gap/2,y:Math.min(y,top)-105,r:8});end=x+w;y=top;return p;}
 function beam(p,offset,w){l.platforms.push({x:p.x+offset,y:p.y-86,w,h:54,type:'bar'});}
 function spike(p,offset,w){l.hazards.push({type:'spikes',x:p.x+offset,y:p.y-17,w,h:17});}
 function saw(p,offset,low){const r=19,cy=p.y-(low?18:50);l.hazards.push({type:'saw',x:p.x+offset-r,y:cy-r,w:r*2,h:r*2,r,move:{axis:'x',amp:pick(12,24),period:3.8+random()*1.6,phase:random()*6.28}});}
 const baseGap=110+Math.floor(district*3),wobble=()=>pick(-15,15);
 const builders={
  gaps(){next(baseGap+wobble(),pick(280,390),pick(-15,15));next(baseGap+15+wobble(),pick(300,420),pick(-15,15));},
  stairs(){next(100+pick(0,20),pick(310,380),-45);next(105+pick(0,20),pick(300,380),-45);next(120,320,65);},
  slide(){const p=next(baseGap,950+pick(0,90));beam(p,210,110+pick(0,45));beam(p,590,100+pick(0,40));},
  spikes(){const p=next(baseGap,1000+pick(0,100));spike(p,220,60+pick(0,25));spike(p,650,65+pick(0,25));},
  vault(){const p=next(baseGap,980+pick(0,80));platform(p.x+230,p.y-(district>5?95:70),65+pick(0,20),'hurdle');platform(p.x+665,p.y-60,65,'hurdle');},
  moving(){next(100,230,-20,'slab',{move:{axis:'x',amp:18,period:4.2+random(),phase:random()*6}});next(95,240,0,'slab',{move:{axis:'y',amp:18,period:4.5+random(),phase:random()*6}});next(100,360,20);},
  crumble(){next(baseGap-15,230,-10,'crumble');next(baseGap-10,240,0,'crumble');next(baseGap-10,230,10,'crumble');next(115,360,0);},
  sawSlide(){const p=next(baseGap,1100+pick(0,100));saw(p,300,false);saw(p,760,false);},
  sawJump(){const p=next(baseGap,1100+pick(0,100));saw(p,270,true);saw(p,730,true);},
  precision(){next(145+pick(0,15),220,-30);next(145+pick(0,15),210,30);next(145+pick(0,15),230,0);next(130,340,0);}
 };
 const schedules=[['gaps','slide','spikes','stairs'],['slide','vault','gaps','spikes','sawSlide'],['stairs','vault','precision','slide','moving'],['moving','gaps','sawJump','slide','stairs'],['moving','crumble','vault','sawSlide','spikes'],['precision','moving','sawSlide','stairs','sawJump'],['crumble','spikes','moving','precision','vault'],['sawSlide','sawJump','slide','vault','crumble'],['stairs','precision','moving','crumble','sawJump'],['vault','moving','crumble','sawJump','precision','stairs','sawSlide','spikes','slide']];
 let previous='';
 for(let m=0;m<challengeCount;m++){
  const schedule=schedules[district];let kind=schedule[(m+stage+pick(0,schedule.length-1))%schedule.length];if(kind===previous)kind=schedule[(schedule.indexOf(kind)+1)%schedule.length];previous=kind;
  const begin=end;builders[kind]();types.push(kind);l.hints.push({x:begin-20,w:end-begin+40,text:hints[kind]});
  // A broad, hazard-free landing separates modules and anchors every checkpoint.
  const recovery=next(105,330+pick(0,45),y<520?35:y>620?-20:0);
  if(m%2===1||m===challengeCount-1)l.checkpoints.push({x:recovery.x+55,y:recovery.y,label:'CHECKPOINT '+(l.checkpoints.length+1)});
 }
 const final=next(115,570,600-y);l.width=end;l.finish={x:final.x+410,y:final.y};l.gold=Math.ceil((l.width-240)/340*1.2+challengeCount*1.1);l.silver=Math.ceil(l.gold*1.55);
 l.hints.unshift({x:0,w:500,text:'DISTRICT '+(district+1)+' / '+districts[district]+' · ROUTE '+number+' / 100'});l.hints.push({x:final.x,w:570,text:number===100?'One hundred rooftops. One final clean landing.':'The beacon is ahead. Finish the run.'});l.features=[...new Set(types)];pack.push(l);
}
return pack;
});

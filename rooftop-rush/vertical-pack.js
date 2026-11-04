/* Fixed route compositions. No repeated section within a course; difficulty changes geometry and timing. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f;else r.BuildVerticalRoutes=f;})(typeof globalThis!=='undefined'?globalThis:this,function(original){
const kinds=['tower','lasers','water','saws','swing','stairs','glide','moving','crumble','vault','slide','precision','descent','canopy'];
const seen=new Set();
return original.map((old,index)=>{
 let seed=(index+13)*73856093;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},pick=(a,b)=>Math.round(a+rnd()*(b-a));
 const tier=Math.floor(index/10),l={...old,revision:4,subtitle:'',platforms:[],hazards:[],checkpoints:[],tokens:[],hints:[],water:[],swingBars:[],gliders:[],sections:[],start:{x:100,y:600}};
 // Each district emphasizes a different vocabulary; fixed seed makes every route repeatable.
 const pools=[['stairs','precision','slide','water','vault','lasers'],['moving','vault','slide','tower','precision','swing'],['tower','stairs','glide','canopy','precision','descent'],['moving','lasers','swing','descent','water','precision'],['crumble','tower','vault','saws','moving','canopy'],['water','descent','stairs','moving','slide','swing'],['crumble','precision','saws','tower','glide','descent'],['lasers','canopy','saws','slide','swing','vault'],['glide','tower','moving','precision','stairs','crumble'],kinds];
 let pool=[...pools[tier]],order=[];const count=4+(index%3===2?1:0)+(tier===9?1:0);
 do{pool=[...pools[tier]];for(let j=pool.length-1;j>0;j--){const k=pick(0,j);[pool[j],pool[k]]=[pool[k],pool[j]];}order=pool.slice(0,count);}while(seen.has(order.join(',')));seen.add(order.join(','));
 // First room remains a gentle introduction; it has no duplicate section or forced advanced move.
 if(index===0)order=['stairs','water','slide','precision'];
 let x=0,y=600;
 const roof=(px,py,w,h=24,type='slab',extra={})=>{const s={x:px,y:py,w,h,type,...extra};l.platforms.push(s);return s;};
 const saw=(px,py,axis='x',amp=18)=>{const r=20;l.hazards.push({type:'saw',x:px-r,y:py-r,w:r*2,h:r*2,r,move:{axis,amp,period:3.7-tier*.08,phase:rnd()*6}});};
 roof(0,y,420,1000,'roof');x=420;
 for(let n=0;n<order.length;n++){
 const type=order[n],sec={type,start:x,end:0,y,exitY:0},base=y;let text='';
 if(type==='tower'){
 const lead=pick(125,220),innerGap=pick(142,172),height=pick(330,450)+tier*12,w=lead+innerGap+pick(240,340);roof(x,y,w);const left=x+lead,right=left+32+innerGap;
 roof(left,y-height,32,height-80,'wall');roof(right,y-height,32,height+24,'wall').autoVault=true;roof(right,y-height,w-(right-x));sec.inner=left+32+innerGap*.5;sec.top=y-height;x+=w;y-=height;text='WALL SHAFT · Hold jump to rebound. Steer right onto the upper roof.';
 }
 if(type==='lasers'){
 const w=pick(710,1000),beams=2+(index%2);roof(x,y,w);for(let j=0;j<beams;j++)l.hazards.push({type:'laser',x:x+200+j*(w-350)/beams,y:y-155,w:9,h:155,period:3.4-tier*.045,on:1.25+tier*.035,phase:rnd()*2});x+=w;text='SIGNAL GALLERY · Stop before a beam; cross when its power is off.';
 }
 if(type==='water'){
 const basin=pick(360,650),depth=pick(135,215);roof(x,y,140);roof(x+140,y+depth,basin);l.water.push({x:x+140,y:y+15,w:basin,h:depth-15});const rise=pick(0,20);roof(x+140+basin,y+rise,230,1000,'roof',{autoVault:true});x+=basin+370;y+=rise;text='FLOODED COURT · Hold jump to swim up and leap out. Down dives.';
 }
 if(type==='saws'){
 const w=pick(820,1100);roof(x,y,w);saw(x+245,y-24);saw(x+w-270,y-26,'y',pick(12,25));x+=w;text='CUTTING FLOOR · Jump low blades. Their marked tracks show their travel.';
 }
 if(type==='swing'){
 const lead=pick(200,270),landing=pick(440,500),rise=pick(25,65);roof(x,y,lead);l.swingBars.push({x:x+lead+60,y:y-100,r:62});roof(x+landing,y-rise,310);x+=landing+310;y-=rise;text='CRANE TRANSFER · Catch the bar, hold to rotate, release to launch right.';
 }
 if(type==='stairs'){
 const steps=pick(3,6);for(let j=0;j<steps;j++){const w=pick(205,260);roof(x,y,w);x+=w+pick(65,100);if(j<steps-1)y-=pick(30,55);}roof(x-100,y,320);x+=220;text='FIRE ESCAPE · Short rising jumps. Catch a ledge if you fall short.';
 }
 if(type==='glide'){
 const gap=pick(580,800),drop=pick(170,240);roof(x,y,260);l.gliders.push({x:x+145,y:y-34});roof(x+260+gap,y+drop,340);x+=gap+600;y+=drop;text='OPEN SKY · Pick up the wing, leap out. Down folds it for a fast landing.';
 }
 if(type==='moving'){
 roof(x,y,200);let end=x+200;for(let j=0;j<3;j++){const gap=pick(75,100),w=pick(195,240),dy=pick(-20,10);roof(end+gap,y+dy,w,20,'slab',{move:{axis:j%2?'y':'x',amp:15,period:4.5,phase:rnd()*6}});end+=gap+w;y+=dy;}roof(end+95,y,260);x=end+355;text='COUNTERWEIGHTS · Let each moving platform carry you before the next leap.';
 }
 if(type==='crumble'){
 roof(x,y,160);x+=160;for(let j=0;j<3;j++){x+=pick(90,125);y+=pick(-25,20);const w=pick(210,275);roof(x,y,w,20,'crumble');x+=w;}roof(x+100,y,260);x+=360;text='BROKEN SUPPORTS · These ledges fall after a moment. Keep moving.';
 }
 if(type==='vault'){
 roof(x,y,180);x+=180;for(let j=0;j<3;j++){x+=pick(70,100);y-=pick(45,75);const w=pick(210,280);roof(x,y,w,1000,'roof');x+=w;}text='SERVICE TERRACES · Jump into ledges, catch their edge and climb.';
 }
 if(type==='slide'){
 const w=pick(740,1000);roof(x,y,w);for(let j=0;j<2;j++)roof(x+220+j*(w-350)/2,y-86,pick(100,155),54,'bar');x+=w;text='LOW DUCTS · Build speed, hold down to slide beneath the beams.';
 }
 if(type==='precision'){
 roof(x,y,150);x+=150;for(let j=0;j<4;j++){x+=pick(100,145);y+=pick(-25,20);const w=pick(160,235);roof(x,y,w);x+=w;}roof(x+100,y,240);x+=340;text='ANTENNA HOPS · Aim for the center of each short roof.';
 }
 if(type==='descent'){
 for(let j=0;j<4;j++){const w=pick(180,260);roof(x,y,w);x+=w+pick(85,140);if(j<3)y+=pick(40,70);}roof(x-100,y,330);x+=230;text='SPILLWAY · Control your fall. Use short hops between descending ledges.';
 }
 if(type==='canopy'){
 const w=pick(850,1100);roof(x,y,w);saw(x+260,y-78,'x',20);saw(x+w-260,y-78,'x',24);x+=w;text='BLADE CANOPY · Stay low beneath the overhead cutters. Do not jump into them.';
 }
 roof(x,y,260);l.checkpoints.push({x:x+75,y,label:'CHECKPOINT '+(n+1)});l.tokens.push({x:x+165,y:y-65,r:8});x+=260;sec.end=x;sec.exitY=y;l.sections.push(sec);l.hints.push({x:sec.start,w:x-sec.start,text});
 }
 roof(x,y,460);l.width=x+460;l.finish={x:x+320,y};l.gold=Math.ceil(l.width/260+order.filter(t=>t==='tower').length*10+order.length*1.7);l.silver=Math.ceil(l.gold*1.65);const ys=l.platforms.map(p=>p.y);l.deathY=Math.max(1000,...ys.map(v=>v+400));l.bounds={top:Math.min(...ys)-320,bottom:l.deathY};l.features=order;l.routeSignature=order.join(' → ');l.subtitle=order.map(t=>t.toUpperCase()).join(' · ');l.hints.unshift({x:0,w:420,text:'ROUTE '+(index+1)+' · '+l.routeSignature+' · A/D or arrows; W/↑/Space jumps.'});return l;
});
});

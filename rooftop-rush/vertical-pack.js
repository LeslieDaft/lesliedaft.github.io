/* Rooftop Rush: rebuilt vertical adventures, version 3. Fixed layouts for repeatable runs. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f;else r.BuildVerticalRoutes=f;})(typeof globalThis!=='undefined'?globalThis:this,function(original){
return original.map((old,index)=>{const tier=Math.floor(index/10),l={...old,revision:3,subtitle:'Vertical adventure · Water, lasers, swing bars and gliders',platforms:[],hazards:[],checkpoints:[],tokens:[],hints:[],water:[],swingBars:[],gliders:[],sections:[],start:{x:100,y:600}};let x=0,y=600;const roof=(px,py,w,h=28,type='slab')=>{const s={x:px,y:py,w,h,type};l.platforms.push(s);return s;};roof(0,y,520,1000,'roof');x=520;
const count=Math.max(15,Math.ceil(old.width/850)*2),order=['tower','lasers','water','saws','swing','stairs','glide'];
for(let n=0;n<count;n++){const type=order[n%7],start=x,base=y;const sec={type,start,end:0,y,exitY:0};
 if(type==='tower'){roof(x,y,650);const height=400+tier*32+(n%3)*40+(index%10)*7,left=x+180,right=left+164;roof(left,y-height,32,height-80,'wall');roof(right,y-height,32,height+28,'wall').autoVault=true;roof(right,y-height,380);sec.inner=left+98;sec.top=y-height;l.hints.push({x,w:650,text:'WALL SHAFT · Hold jump to rebound between walls. Steer toward the opening at the top.'});x+=650;y-=height;}
 if(type==='lasers'){roof(x,y,1150);for(let j=0;j<3;j++)l.hazards.push({type:'laser',x:x+270+j*270,y:y-175,w:9,h:175,period:3.2-tier*.065,on:1.5+tier*.04,phase:index*.137+j*.22});l.hints.push({x,w:1150,text:'TIMED LASERS · Orange warns of power-up. Wait for the beam to turn off.'});x+=1150;}
 if(type==='water'){roof(x,y,170);const wx=x+170;roof(wx,y+230,650);l.water.push({x:wx,y:y+25,w:650,h:205});roof(wx+650,y,250);l.hints.push({x,w:1070,text:'WATER · Hold jump / W / ↑ to swim upward and leap out. S / ↓ dives.'});x+=1070;}
 if(type==='saws'){roof(x,y,1300);for(let j=0;j<3;j++){const rad=20+tier*.5;l.hazards.push({type:'saw',x:x+270+j*350-rad,y:y-24-rad,w:rad*2,h:rad*2,r:rad,move:{axis:j===1?'y':'x',amp:15+tier,period:3.4,phase:j*.8+index*.23}});}x+=1300;}
 if(type==='swing'){roof(x,y,240);l.swingBars.push({x:x+300,y:y-105,r:62});roof(x+480,y-55,390);l.hints.push({x,w:870,text:'SWING BAR · Jump to catch. Hold jump to circle, release to launch; steer your exit.'});x+=870;y-=55;}
 if(type==='stairs'){for(let j=0;j<6;j++){roof(x,y,220);x+=310;y-=55;}roof(x-90,y+55,440);x+=350;y+=55;}
 if(type==='glide'){roof(x,y,280);l.gliders.push({x:x+150,y:y-34});const gap=700+tier*12+(index%10)*5;roof(x+280+gap,y+210,420);l.hints.push({x,w:gap+700,text:'HANG GLIDER · Collect the wing, jump out and hold jump to fly. S / ↓ folds it.'});x+=gap+700;y+=210;}
 roof(x,y,370);l.checkpoints.push({x:x+95,y,label:'CHECKPOINT '+(n+1)});l.tokens.push({x:x+200,y:y-65,r:8});x+=370;sec.end=x;sec.exitY=y;l.sections.push(sec);
}
roof(x,y,600);l.width=x+600;l.finish={x:x+440,y};l.gold=Math.ceil(l.width/250+count*3);l.silver=Math.ceil(l.gold*1.6);l.deathY=1200;l.bounds={top:Math.min(...l.platforms.map(p=>p.y))-350,bottom:1200};l.hints.unshift({x:0,w:520,text:'REBUILT ROUTE '+(index+1)+' / 100 · Reach every checkpoint and climb to the skyline beacon.'});return l;});
});

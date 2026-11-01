const {World,laserActive}=require('./engine.js');
function solve(index,maxSeconds=900,observe=null){const events={};const w=new World(index,e=>events[e]=(events[e]||0)+1);let hold=0,secIndex=0,lastJump=-100;const fails=[],entered=new Set(),committed=new Set();for(let frame=0;frame<120*maxSeconds&&!w.finished;frame++){const p=w.p,sections=w.level.sections;while(secIndex<sections.length-1&&p.x>=sections[secIndex].end)secIndex++;if(w.dying){w.update(1/120,{});continue;}const sec=sections[secIndex];let right=true,left=false,jump=false,down=false;if(hold>0){hold--;jump=true;}
 if(sec.type==='tower'&&p.x<sec.end-365){if(p.x>=sec.inner-8)entered.add(secIndex);if(!entered.has(secIndex)){right=true;jump=false;}else{right=true;left=false;jump=true;}}
 else if(p.swing){right=true;jump=p.swing.age<.52;}
 else if(p.swimming){jump=true;}
 else if(p.grounded){const g=w.level.platforms[p.groundId],edge=g?g.x+g.w:Infinity;const danger=w.level.hazards.find(h=>h.type==='saw'&&h.x>p.x&&h.x-p.x<115&&Math.abs(h.y+h.h-p.y)<120);const needsJump=(edge-p.x<32&&edge<w.level.width-600)||danger;
 if(needsJump&&frame-lastJump>40){if(w.previousJump){jump=false;hold=0;}else{jump=true;hold=65;lastJump=frame;}}else if(!hold)jump=false;
 const laser=w.level.hazards.find(h=>h.type==='laser'&&h.x>p.x-10&&h.x-p.x<115&&Math.abs(h.y+h.h-p.y)<10);if(laser){const phase=((w.time+(laser.phase||0))%laser.period+laser.period)%laser.period;if(!committed.has(laser.x)){if(laserActive(laser,w.time)||laser.period-phase<.65){right=false;jump=false;hold=0;}else committed.add(laser.x);}}
 }
 if(p.hasGlider&&!p.grounded)jump=true;
 if(p.hang)jump=true;
 const before=w.deaths;w.update(1/120,{right,left,jump,down});if(observe)observe({right,left,jump,down},w);if(w.deaths>before)committed.clear();if(w.deaths>before&&fails.length<8)fails.push({x:p.x,y:p.y,type:sec.type,frame});
 if(w.deaths>20)break;
 }
 return{events,index,finished:w.finished,time:w.time,deaths:w.deaths,x:w.p.x,y:w.p.y,state:w.p.state,wall:w.p.wall,hang:w.p.hang,vy:w.p.vy,section:secIndex,type:w.level.sections[secIndex]?.type,fails};}
if(require.main===module){const indices=process.argv.slice(2).map(Number);console.log(JSON.stringify((indices.length?indices:[0]).map(i=>solve(i)),null,2));}module.exports={solve};

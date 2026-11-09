(() => {
'use strict';
const {slaps,rivals,upgrades}=window.SLAP_DATA;
const $=id=>document.getElementById(id);
const STORE='daft-slap-circuit-v1';
const fresh=()=>({version:1,cash:0,unlocked:0,wins:0,losses:0,beaten:[],stats:{power:0,precision:0,chin:0,endurance:0},kit:['snap','hook','palm'],sound:false});
function validSave(s){return s&&s.version===1&&Number.isInteger(s.cash)&&s.cash>=0&&s.cash<1e8&&Number.isInteger(s.unlocked)&&s.unlocked>=0&&s.unlocked<=10&&Number.isInteger(s.wins)&&s.wins>=0&&Number.isInteger(s.losses)&&s.losses>=0&&Array.isArray(s.beaten)&&s.beaten.every(n=>Number.isInteger(n)&&n>=0&&n<10)&&s.stats&&upgrades.every(u=>Number.isInteger(s.stats[u.id])&&s.stats[u.id]>=0&&s.stats[u.id]<=6)&&Array.isArray(s.kit)&&s.kit.length===3&&new Set(s.kit).size===3&&s.kit.every(id=>slaps.some(x=>x.id===id&&x.unlock<=s.unlocked));}
let career=fresh(),storageOK=true;
try{const saved=localStorage.getItem(STORE);if(saved){const s=JSON.parse(saved);if(validSave(s))career=s;}}catch(e){storageOK=false;}
let audio,toastUntil=0,game=null,lastFrame=performance.now(),heroTime=0,confirmAction=null;
const heroCtx=$('heroArt').getContext('2d'),ctx=$('arena').getContext('2d');
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+3000;}
function save(){try{localStorage.setItem(STORE,JSON.stringify(career));storageOK=true;$('saveStatus').textContent='✓ Career saved on this device';}catch(e){storageOK=false;$('saveStatus').textContent='Storage unavailable. Export a backup.';}}
function sound(freq=220,length=.08,type='square',volume=.04){if(!career.sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.45),audio.currentTime+length);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+length);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+length);}catch(e){}}
function upgradeCost(u){return Math.round(u.base*Math.pow(1.65,career.stats[u.id]));}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function portrait(c,rival,x,y,scale=1,pose='idle',t=0,hit=0){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 const skin=hit?'#fff0dc':rival.skin,shade=hit?'#f5c5a2':'#9e654e',dark='#222139',bob=pose==='idle'?Math.round(Math.sin(t*3)*1):0;
 c.translate(0,bob);px(c,-22,-52,44,55,dark);px(c,-19,-50,38,51,rival.shirt);px(c,-27,-40,9,34,skin);px(c,18,-40,9,34,skin);px(c,-19,-12,38,14,'#25243b');px(c,-15,-9,12,15,'#202338');px(c,4,-9,12,15,'#202338');px(c,-18,4,16,5,'#171c31');px(c,3,4,16,5,'#171c31');
 px(c,-20,-50,40,8,shade);px(c,-14,-58,28,11,skin);px(c,-18,-88,36,32,skin);px(c,-21,-81,4,13,skin);px(c,18,-81,4,13,skin);px(c,-17,-91,34,9,rival.hair);px(c,-20,-84,6,14,rival.hair);px(c,15,-84,5,11,rival.hair);px(c,-10,-79,8,3,dark);px(c,4,-79,8,3,dark);
 if(pose==='hurt'){px(c,-10,-75,7,2,dark);px(c,5,-75,7,2,dark);px(c,-5,-64,11,4,dark);}else{px(c,-10,-74,6,4,'#fff1da');px(c,5,-74,6,4,'#fff1da');px(c,-7,-74,3,4,dark);px(c,5,-74,3,4,dark);px(c,-6,-64,13,3,dark);px(c,-3,-64,7,1,'#fff1da');}
 px(c,-2,-73,4,9,shade);px(c,-16,-69,4,3,'#d27968');px(c,13,-69,4,3,'#d27968');
 if(pose==='left'){px(c,-39,-71,13,29,skin);px(c,-44,-80,19,16,skin);px(c,-43,-78,17,3,'#f3c99e');px(c,24,-48,13,19,skin);}else if(pose==='right'){px(c,26,-71,13,29,skin);px(c,25,-80,19,16,skin);px(c,26,-78,17,3,'#f3c99e');px(c,-37,-48,13,19,skin);}else if(pose==='brace'){px(c,-31,-101,10,56,skin);px(c,22,-101,10,56,skin);px(c,-31,-111,21,14,skin);px(c,11,-111,21,14,skin);}else if(pose==='swing'){px(c,-47,-65,51,11,skin);px(c,-57,-68,18,18,skin);px(c,-55,-66,16,3,'#ffdbc0');}else{px(c,-31,-48,14,17,skin);px(c,18,-48,14,17,skin);px(c,-29,-48,10,3,'#edbf98');px(c,20,-48,10,3,'#edbf98');}
 px(c,-20,-37,5,24,'#00000019');px(c,15,-37,5,24,'#00000019');px(c,-9,-43,18,3,'#ffffff2b');px(c,-5,-38,10,2,'#ffffff2b');
 c.restore();
}
function ring(c,w,h,t){
 px(c,0,0,w,h,'#171b31');
 for(let i=0;i<30;i++){const x=(i*31+7)%w,y=28+(i*17)%42,color=['#706077','#414e73','#5d6677','#6c6258'][i%4];px(c,x,y,10,8,color);px(c,x-2,y+8,14,15,'#2d344f');px(c,x+3,y+2,2,2,'#d0b296');}
 px(c,0,h*.5,w,h*.5,'#424c68');px(c,20,h*.5+12,w-40,h*.5-16,'#6d7d92');px(c,30,h*.5+17,w-60,h*.5-24,'#9da6aa');
 for(let i=0;i<3;i++){px(c,8,54+i*18,w-16,3,'#be646a');px(c,8,58+i*18,w-16,1,'#f1a5a0');}px(c,6,44,5,h-42,'#e0c891');px(c,w-11,44,5,h-42,'#e0c891');px(c,2,h-5,w-4,5,'#1d253f');
 px(c,w*.27,h*.76,w*.46,3,'#87939d');px(c,w*.35,h*.71,w*.3,3,'#87939d');
 c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#596b81';c.fillText('S L A P   C I R C U I T',w/2,h-17);
}
function renderLobby(){
 $('record').textContent=career.wins+'–'+career.losses;$('cash').textContent='$'+career.cash.toLocaleString();$('rank').textContent=career.unlocked>=10?'WORLD CHAMPION':career.unlocked===0?'ROOKIE':'#'+(11-career.unlocked)+' CONTENDER';$('soundBtn').textContent='SOUND: '+(career.sound?'ON':'OFF');$('saveStatus').textContent=storageOK?'✓ Career saved on this device':'Storage unavailable. Export a backup.';
 $('opponentList').innerHTML=rivals.map((r,i)=>`<article class="rival ${i>career.unlocked?'locked':''}"><canvas width="54" height="54" data-portrait="${i}" aria-hidden="true"></canvas><div><strong><span class="number">${String(i+1).padStart(2,'0')}.</span> ${r.name}</strong><small>${r.title}<br>${career.beaten.includes(i)?'✓ DEFEATED · REMATCH $'+Math.round(r.purse*.4):'PURSE $'+r.purse}</small></div><button data-fight="${i}" ${i>career.unlocked?'disabled':''}>${i>career.unlocked?'LOCKED':career.beaten.includes(i)?'REMATCH':'FIGHT →'}</button></article>`).join('');
 document.querySelectorAll('[data-portrait]').forEach(canvas=>{const c=canvas.getContext('2d');px(c,0,0,54,54,'#303b5a');portrait(c,rivals[+canvas.dataset.portrait],27,80,.82,'idle',0);});
 document.querySelectorAll('[data-fight]').forEach(btn=>btn.onclick=()=>startFight(+btn.dataset.fight));
 $('upgrades').innerHTML=upgrades.map(u=>`<div class="upgrade"><div><strong>${u.name}</strong><p>${u.desc}</p><div class="pips">${Array.from({length:6},(_,i)=>`<i class="${i<career.stats[u.id]?'on':''}"></i>`).join('')}</div></div><button data-upgrade="${u.id}" ${career.stats[u.id]>=6||career.cash<upgradeCost(u)?'disabled':''}>${career.stats[u.id]>=6?'MAX':'$'+upgradeCost(u)}</button></div>`).join('');
 document.querySelectorAll('[data-upgrade]').forEach(btn=>btn.onclick=()=>{const u=upgrades.find(x=>x.id===btn.dataset.upgrade),cost=upgradeCost(u);if(career.stats[u.id]>=6||career.cash<cost)return;career.cash-=cost;career.stats[u.id]++;save();renderLobby();sound(480,.1);toast(u.name+' upgraded.');});
 $('kitCount').textContent=career.kit.length+' / 3';
 $('loadout').innerHTML=slaps.map(s=>`<button class="kit-slap ${career.kit.includes(s.id)?'selected':''}" data-kit="${s.id}" ${s.unlock>career.unlocked?'disabled':''}><span>${career.kit.includes(s.id)?'■':'□'} ${s.name}</span><em>${s.unlock>career.unlocked?'BEAT RIVAL '+s.unlock:s.cost+' STAMINA'}</em><small>${s.desc}</small></button>`).join('');
 document.querySelectorAll('[data-kit]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.kit;if(career.kit.includes(id)){toast('Choose an unselected slap to replace one of your three.');return;}const replacing=career.kit[0];career.kit=[...career.kit.slice(1),id];save();renderLobby();toast(slaps.find(s=>s.id===replacing).name+' replaced. New picks replace the oldest slot.');});
}
function startFight(index){
 if(index>career.unlocked)return;
 const r=rivals[index],maxHp=120+career.stats.chin*18,maxStamina=100+career.stats.endurance*10;
 game={index,r,maxHp,hp:maxHp,enemyHp:r.hp,maxStamina,stamina:maxStamina,round:1,turn:0,totalTurns:0,used:[],phase:'choose',age:0,time:0,paused:false,guard:r.guard[0],openNext:false,counter:1,combo:0,accuracy:0,hits:0,perfects:0,damage:0,defenses:0,defenseTotal:0,hitEnemy:0,hitPlayer:0,floaters:[],particles:[],shake:0,defense:null,chosen:null};
 $('lobby').hidden=true;$('fight').hidden=false;$('enemyName').textContent=r.name;$('enemyStyle').textContent=r.style;$('boutLabel').textContent=index===9?'WORLD TITLE FIGHT':'BOUT '+(index+1)+' / 10';$('pauseBtn').textContent='PAUSE';
 say('“'+r.quote+'” '+r.weakness);setPhase('choose');updateFight();window.scrollTo({top:0,behavior:'instant'});sound(220,.16);
}
function say(s){$('message').textContent=s;}
function setPhase(phase){if(!game)return;game.phase=phase;game.age=0;$('attackPanel').hidden=phase!=='choose';$('timingPanel').hidden=phase!=='timing';$('defensePanel').hidden=phase!=='windup';$('phaseLabel').textContent={choose:'YOUR TURN',timing:'FIND THE GOLD',attackResult:'CONTACT',windup:'READ • WAIT • DEFEND',defenseResult:'THE EXCHANGE',over:'BOUT COMPLETE'}[phase]||'';document.querySelector('.arena-wrap').classList.remove('ready');if(phase==='choose')renderAttacks();}
function renderAttacks(){
 $('fightSlaps').innerHTML=career.kit.map((id,i)=>{const s=slaps.find(x=>x.id===id),used=game.used.includes(id);return `<button class="fight-slap ${used?'used':''}" data-slap="${id}" ${used||game.stamina<s.cost?'disabled':''}><b><kbd>${i+1}</kbd> ${s.name}</b><span>${s.power+career.stats.power*3} POWER / ${s.cost} STAMINA</span><small>${s.tag}</small></button>`;}).join('');
 document.querySelectorAll('[data-slap]').forEach(b=>b.onclick=()=>selectSlap(b.dataset.slap));
}
function updateFight(){if(!game)return;
 $('playerHp').style.width=(Math.max(0,game.hp)/game.maxHp*100)+'%';$('enemyHp').style.width=(Math.max(0,game.enemyHp)/game.r.hp*100)+'%';$('stamina').style.width=(game.stamina/game.maxStamina*100)+'%';$('playerHpText').textContent=Math.max(0,Math.ceil(game.hp))+' / '+game.maxHp;$('enemyHpText').textContent=Math.max(0,Math.ceil(game.enemyHp))+' / '+game.r.hp;$('staminaText').textContent=Math.floor(game.stamina)+' / '+game.maxStamina;$('roundNo').textContent=game.round;$('turnNo').textContent='TURN '+(game.turn+1)+' / 3';$('guardLabel').textContent={open:'OPEN STANCE',high:'HIGH GUARD',low:'LOW GUARD',counter:'READY TO COUNTER'}[game.guard];$('combo').textContent=game.counter>1?'COUNTER OPENING ×'+game.counter.toFixed(1):game.combo>=2?game.combo+' HIT STREAK':'';
}
function selectSlap(id){if(!game||game.paused||game.phase!=='choose')return;const s=slaps.find(x=>x.id===id);if(!s||!career.kit.includes(id)||game.used.includes(id)||game.stamina<s.cost)return;game.chosen=s;game.used.push(id);game.stamina-=s.cost;game.target=.29+Math.random()*.42;game.width=s.width+career.stats.precision*.012;game.meterPosition=0;setPhase('timing');$('goodZone').style.left=(game.target-game.width/2)*100+'%';$('goodZone').style.width=game.width*100+'%';$('perfectZone').style.left=(game.target-game.width*.16)*100+'%';$('perfectZone').style.width=game.width*.32*100+'%';say(s.name+': '+s.desc);updateFight();sound(350,.05);}
function floater(text,color='#ffcd58',target='enemy'){if(!game)return;game.floaters.push({text,color,x:target==='enemy'?160:110,y:target==='enemy'?55:140,life:1.25});}
function strike(forceMiss=false){
 if(!game||game.phase!=='timing'||game.paused)return;const s=game.chosen,diff=Math.abs(game.meterPosition-game.target),perfect=!forceMiss&&diff<=game.width*.16,clean=!forceMiss&&diff<=game.width/2,glance=!forceMiss&&diff<=game.width*.8;
 let quality=perfect?1.45:clean?1:glance?.3:0,modifier=1,tag='',countered=false;
 if(quality){if(game.guard==='high'){if(s.id==='hook'){modifier=.25;tag='HIGH GUARD BLOCK';}if(s.id==='palm'||s.id==='upper'){modifier=1.4;tag='GUARD BREAK';}}
 if(game.guard==='low'){if(s.id==='upper'){modifier=.2;tag='LOW GUARD BLOCK';}if(s.id==='hook'){modifier=1.4;tag='AROUND THE GUARD';}}
 if(game.guard==='counter'){if(s.id==='snap'){modifier=1.4;tag='INTERRUPTED';}else if(s.id==='palm'||s.id==='upper'){modifier=.35;countered=true;tag='COUNTERED';}}
 if(s.id==='backhand'){modifier=1;tag='GUARD IGNORED';}
 if(s.id==='feint'&&clean){game.openNext=true;tag='FEINT • NEXT GUARD OPEN';}
 }
 const damage=Math.round((s.power+career.stats.power*3)*quality*modifier*game.counter);
 game.enemyHp-=damage;game.damage+=damage;game.accuracy++;if(clean){game.hits++;game.combo++;}else game.combo=0;if(perfect)game.perfects++;game.counter=1;game.hitEnemy=damage?1:0;game.shake=perfect?.45:.15;
 if(countered){const retaliation=Math.round(game.r.power*.45);game.hp-=retaliation;game.hitPlayer=.8;floater('COUNTER −'+retaliation,'#ff655b','player');}
 if(damage)floater((perfect?'PERFECT! ':'')+'−'+damage,perfect?'#ffdc77':'#f8eddf');else floater('MISS','#b5bfd6');
 say((perfect?'Perfect slap! ':clean?'Clean connection. ':glance?'Glancing hit. ':'You swung wide. ')+(tag?tag+'. ':'')+(damage?'Dealt '+damage+' damage.':'The slap was spent.'));
 sound(damage?perfect?110:160:70,damage?.14:.08,'sawtooth',.06);setPhase('attackResult');updateFight();
}
function recover(){if(!game||game.phase!=='choose'||game.paused)return;const gain=22+career.stats.endurance*2;game.stamina=Math.min(game.maxStamina,game.stamina+gain);game.counter=1;floater('+'+gain+' STAMINA','#83e5ba','player');say('You recover your breath. The rival still gets an attack.');setPhase('attackResult');updateFight();}
function beginDefense(){
 game.defense=null;game.enemyAttack=game.r.pattern[game.totalTurns%game.r.pattern.length];game.feint=!!game.r.feint&&Math.random()<game.r.feint&&game.enemyAttack!=='brace';game.fakeAttack=game.enemyAttack==='left'?'right':'left';game.windup=game.r.speed;game.defenseWindow=195+career.stats.precision*17-(game.stamina<20?55:0);game.finalTell=!game.feint;setPhase('windup');document.querySelectorAll('[data-defense]').forEach(b=>b.classList.remove('chosen'));$('defenseHint').textContent='Wait for the gold flash. First choice is locked.';renderTell(game.feint?game.fakeAttack:game.enemyAttack,false);say(game.feint?'Something feels off. Watch the shoulders until the last moment.':'Read the shoulder tell. Commit when the border flashes gold.');
}
function renderTell(action,feint){const labels={left:'RIGHT SHOULDER DRAWS BACK',right:'LEFT SHOULDER DRAWS BACK',brace:'BOTH HANDS RISE OVERHEAD'};$('defenseCue').textContent=(feint?'FEINT! ':'')+labels[action];if(game.index<2)$('defenseHint').textContent={left:'STEP LEFT on gold. First choice is locked.',right:'STEP RIGHT on gold. First choice is locked.',brace:'BRACE on gold. First choice is locked.'}[action];}
function defend(action){if(!game||game.paused||game.phase!=='windup'||game.defense)return;game.defense={action,time:game.age};document.querySelectorAll('[data-defense]').forEach(b=>b.classList.toggle('chosen',b.dataset.defense===action));$('defenseHint').textContent='COMMITTED: '+action.toUpperCase()+(game.age<game.windup-game.defenseWindow?' — too early!':'');sound(360,.04);}
function resolveDefense(){
 const d=game.defense,late=d?Math.abs(d.time-game.windup):Infinity,inWindow=d&&d.time>=game.windup-game.defenseWindow&&d.time<=game.windup+110,correct=d&&d.action===game.enemyAttack,perfect=inWindow&&correct&&late<game.defenseWindow*.45;
 let damage=game.r.power+Math.min(8,Math.floor((game.round-1)/3)),line='';game.defenseTotal++;
 if(inWindow&&correct){damage=0;game.defenses++;game.counter=perfect?1.6:1.3;game.stamina=Math.max(0,game.stamina-(d.action==='brace'?5:7));line=perfect?'PERFECT DEFENSE! Your next slap gets ×1.6 damage.':'Clean defense. Your next slap gets ×1.3 damage.';floater(perfect?'PERFECT READ':'DODGED',perfect?'#ffcd58':'#83e5ba','player');sound(570,.08);}
 else if(inWindow&&d.action==='brace'&&game.enemyAttack!=='brace'){damage=Math.ceil(damage*.5);game.stamina=Math.max(0,game.stamina-10);line='You braced instead of stepping. Half damage, no counter opening.';floater('BRACED −'+damage,'#f4c080','player');sound(130,.09);}
 else {if(d&&!inWindow)line='Too '+(d.time<game.windup?'early':'late')+'. The hand catches you moving.';else if(d)line='Wrong read. Watch which shoulder draws back.';else line='No defense. Read the tell and press a defense on gold.';game.hitPlayer=1;game.shake=.6;game.combo=0;game.stamina=Math.max(0,game.stamina-8);floater('−'+damage,'#ff655b','player');sound(65,.2,'sawtooth',.07);}
 game.hp-=damage;say(line);setPhase('defenseResult');updateFight();
}
function nextTurn(){
 game.totalTurns++;game.turn++;game.stamina=Math.min(game.maxStamina,game.stamina+9+career.stats.endurance);
 let roundText='';if(game.turn>=3){game.turn=0;game.round++;game.used=[];game.stamina=Math.min(game.maxStamina,game.stamina+17+career.stats.endurance*2);roundText='ROUND '+game.round+': kit refreshed and stamina recovered. ';}
 game.guard=game.openNext?'open':game.r.guard[game.totalTurns%game.r.guard.length];game.openNext=false;setPhase('choose');say(roundText+({high:'High guard: a power palm or rising slap can crack it.',low:'Low guard: a wide hook goes around it.',counter:'Counter stance: snap slaps interrupt. Heavy slaps invite punishment.',open:'Open stance: make your best remaining slap count.'}[game.guard]));updateFight();
}
function endFight(won,forfeit=false){
 if(!game||game.phase==='over')return;const g=game,first=!career.beaten.includes(g.index);setPhase('over');
 const payout=forfeit?0:won?(first?g.r.purse:Math.round(g.r.purse*.4)):Math.round(g.r.purse*.22);
 if(won){career.wins++;if(first)career.beaten.push(g.index);career.unlocked=Math.max(career.unlocked,g.index+1);}else career.losses++;
 career.cash+=payout;save();$('resultTag').textContent=won&&g.index===9?'THE WORLD HAS A NEW CHAMPION':forfeit?'TOWEL THROWN':'THE DECISION';$('resultTitle').textContent=won?'VICTORY!':forfeit?'FORFEIT':'DEFEATED';$('resultTitle').style.color=won?'var(--gold)':'var(--red)';
 const newlyUnlocked=slaps.filter(s=>s.unlock===career.unlocked&&first&&won);
 $('resultMessage').textContent=won?(g.index===9?'You climbed the entire circuit and took the world belt. The ladder stays open for rematches.':first?'You took down '+g.r.name+'. The next rival is waiting.':'You beat '+g.r.name+' again. A smaller rematch purse keeps the gym open.')+(newlyUnlocked.length?' NEW MOVE: '+newlyUnlocked.map(x=>x.name).join(', ')+'. Add it in Your Corner.':''):forfeit?'You left the bout. The forfeit counts as a loss and pays no purse.':'Every rival has a pattern. Spend your consolation purse, change your kit, and come back sharper.';
 $('resultStats').innerHTML=`<div><small>PRIZE MONEY</small><b>$${payout}</b></div><div><small>ATTACK ACCURACY</small><b>${g.accuracy?Math.round(g.hits/g.accuracy*100):0}%</b></div><div><small>PERFECT SLAPS</small><b>${g.perfects}</b></div><div><small>CLEAN DEFENSES</small><b>${g.defenses} / ${g.defenseTotal}</b></div>`;
 $('result').showModal();sound(won?620:90,.3,'triangle',.07);
}
function toLobby(){$('result').close();game=null;$('fight').hidden=true;$('lobby').hidden=false;renderLobby();window.scrollTo({top:0,behavior:'instant'});}
function pause(auto=false){if(!game||game.phase==='over')return;game.paused=!game.paused;$('pauseBtn').textContent=game.paused?'RESUME':'PAUSE';$('phaseLabel').textContent=game.paused?(auto?'PAUSED • TAB HIDDEN':'PAUSED • P TO RESUME'):({choose:'YOUR TURN',timing:'FIND THE GOLD',attackResult:'CONTACT',windup:'READ • WAIT • DEFEND',defenseResult:'THE EXCHANGE'}[game.phase]);}
function requestConfirm(title,text,action){const wasPaused=game&&game.paused;if(game&&!game.paused)pause();$('confirmTitle').textContent=title;$('confirmText').textContent=text;confirmAction={action,wasPaused};$('confirm').showModal();}
function closeConfirm(accept){$('confirm').close();const c=confirmAction;confirmAction=null;if(!c)return;if(accept)c.action();else if(game&&!c.wasPaused&&game.paused)pause();}
function animate(dt){
 if(!game)return;const g=game;if(!g.paused&&g.phase!=='over'){
 g.age+=dt*1000;g.time+=dt;g.hitEnemy=Math.max(0,g.hitEnemy-dt*2.5);g.hitPlayer=Math.max(0,g.hitPlayer-dt*2.6);g.shake=Math.max(0,g.shake-dt*2);g.floaters.forEach(f=>{f.life-=dt;f.y-=dt*18;});g.floaters=g.floaters.filter(f=>f.life>0);
 if(g.phase==='timing'){g.meterPosition=.5+.5*Math.sin(g.age/1000*g.chosen.speed*4.2-Math.PI/2);$('cursor').style.left=(g.meterPosition*99)+'%';if(g.age>6500)strike(true);}
 else if(g.phase==='attackResult'&&g.age>1050){if(g.enemyHp<=0||g.hp<=0)endFight(g.enemyHp<=0&&g.hp>0);else beginDefense();}
 else if(g.phase==='windup'){
 if(g.feint&&!g.finalTell&&g.age>g.windup*.47){g.finalTell=true;renderTell(g.enemyAttack,true);sound(500,.04);}
 const ready=g.age>=g.windup-g.defenseWindow&&g.age<=g.windup+110;document.querySelector('.arena-wrap').classList.toggle('ready',ready);$('defenseClock').style.width=Math.min(100,g.age/(g.windup+120)*100)+'%';if(ready&&!g.defense)$('defenseHint').textContent='GOLD! DEFEND NOW';
 if(g.age>g.windup+120)resolveDefense();
 }
 else if(g.phase==='defenseResult'&&g.age>1150){if(g.hp<=0)endFight(false);else nextTurn();}
 }
 drawFight();
}
function drawFight(){
 if(!game)return;const g=game;ctx.save();ctx.scale(2,2);ctx.imageSmoothingEnabled=false;ring(ctx,320,180,g.time);
 if(g.shake>0)ctx.translate(Math.round(Math.sin(g.time*105)*g.shake*3),0);
 px(ctx,118,148,88,8,'#57697c');let pose='idle';if(g.hitEnemy>.1)pose='hurt';else if(g.phase==='windup'){pose=g.feint&&!g.finalTell?g.fakeAttack:g.enemyAttack;}else if(g.phase==='defenseResult'&&g.age<350)pose='swing';
 const enemyX=160+(g.hitEnemy>.1?Math.sin(g.time*50)*3:0);portrait(ctx,g.r,enemyX,152,1.12,pose,g.time,g.hitEnemy>.65?1:0);
 if(g.phase==='windup'){const ready=g.age>=g.windup-g.defenseWindow;if(ready){ctx.strokeStyle='#ffcd58';ctx.lineWidth=2;ctx.strokeRect(108,39,104,113);}if(g.feint&&!g.finalTell){px(ctx,154,17,12,4,'#d783ab');}}
 // First-person hands at the bottom of the screen; the selected defense moves them.
 let shift=0;if(g.phase==='windup'&&g.defense)shift=g.defense.action==='left'?-24:g.defense.action==='right'?24:0;
 const hit=g.phase==='attackResult'&&g.age<300?Math.sin(g.age/300*Math.PI)*45:0;
 px(ctx,50+shift,171-hit*.4,39,20,'#bc7e63');px(ctx,44+shift,158-hit*.4,47,20,'#e9b18c');px(ctx,47+shift,157-hit*.4,40,4,'#f8cfaa');px(ctx,57+shift,153-hit*.4,6,9,'#efc199');px(ctx,67+shift,151-hit*.4,6,10,'#efc199');px(ctx,77+shift,153-hit*.4,6,8,'#efc199');
 px(ctx,232+shift,171-hit,39,20,'#bc7e63');px(ctx,228+shift,158-hit,47,20,'#e9b18c');px(ctx,231+shift,157-hit,40,4,'#f8cfaa');px(ctx,236+shift,153-hit,6,9,'#efc199');px(ctx,246+shift,151-hit,6,10,'#efc199');px(ctx,256+shift,153-hit,6,8,'#efc199');
 if(g.phase==='windup'&&g.defense&&g.defense.action==='brace'){px(ctx,107,118,44,14,'#e9b18c');px(ctx,168,118,44,14,'#e9b18c');}
 if(g.hitPlayer>.1){px(ctx,0,0,320,180,'rgba(240,65,72,'+(g.hitPlayer*.2)+')');}
 g.floaters.forEach(f=>{ctx.globalAlpha=Math.min(1,f.life*2);ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillStyle='#11172d';ctx.fillText(f.text,f.x+1,f.y+1);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.globalAlpha=1;});
 if(g.paused){px(ctx,0,0,320,180,'#0c1124ba');ctx.font='bold 21px monospace';ctx.textAlign='center';ctx.fillStyle='#ffcd58';ctx.fillText('PAUSED',160,91);ctx.font='9px monospace';ctx.fillStyle='#eee6d6';ctx.fillText('PRESS P OR RESUME',160,108);}
 ctx.restore();
}
function drawHero(t){const c=heroCtx;c.imageSmoothingEnabled=false;ring(c,320,210,t);portrait(c,rivals[9],160,178,1.5,'idle',t);px(c,128,97,64,15,'#e9c65e');px(c,135,101,9,7,'#fff1a8');px(c,174,101,9,7,'#fff1a8');px(c,150,94,20,21,'#b57b36');px(c,154,97,12,15,'#f6dc7d');px(c,157,100,6,9,'#e9b952');c.font='bold 8px monospace';c.fillStyle='#171c34';c.textAlign='center';c.fillText('SC',160,108);}
$('strikeBtn').onclick=()=>strike();$('restBtn').onclick=recover;$('pauseBtn').onclick=()=>pause();document.querySelectorAll('[data-defense]').forEach(b=>b.onclick=()=>defend(b.dataset.defense));
$('helpBtn').onclick=()=>{if(game&&!game.paused)pause();$('help').showModal();};$('closeHelp').onclick=$('gotIt').onclick=()=>{$('help').close();};
$('soundBtn').onclick=()=>{career.sound=!career.sound;save();$('soundBtn').textContent='SOUND: '+(career.sound?'ON':'OFF');sound(600,.1);};
$('leaveBtn').onclick=()=>requestConfirm('LEAVE BOUT?','Leaving counts as a loss and pays no purse. Your career upgrades stay saved.',()=>{if(game)game.paused=false;endFight(false,true);});
$('resultClose').onclick=toLobby;$('result').addEventListener('cancel',e=>{e.preventDefault();toLobby();});
$('resetBtn').onclick=()=>requestConfirm('RESET CAREER?','This removes your saved record, money, upgrades and unlocked rivals. Export a backup first if you want to keep them.',()=>{career=fresh();save();renderLobby();toast('Fresh career started.');});
$('cancelConfirm').onclick=()=>closeConfirm(false);$('acceptConfirm').onclick=()=>closeConfirm(true);$('confirm').addEventListener('cancel',e=>{e.preventDefault();closeConfirm(false);});
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(career,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='slap-circuit-career.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Career backup exported.');};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>100000){toast('That save file is too large.');return;}try{const s=JSON.parse(await f.text());if(!validSave(s))throw Error('invalid');requestConfirm('IMPORT CAREER?','This replaces the career currently saved on this device.',()=>{career=s;save();renderLobby();toast('Career imported.');});}catch(err){toast('Invalid Slap Circuit career file.');}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!game.paused&&game.phase!=='over')pause(true);});
document.addEventListener('keydown',e=>{
 if(!game||$('help').open||$('result').open||$('confirm').open||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowdown','arrowup','1','2','3','a','s','d','r','p'].includes(k))e.preventDefault();if(e.repeat)return;if(k==='p'){pause();return;}if(game.paused)return;
 if(game.phase==='choose'){if(['1','2','3'].includes(k))selectSlap(career.kit[Number(k)-1]);if(k==='r')recover();}else if(game.phase==='timing'&&(k===' '||k==='enter'))strike();else if(game.phase==='windup'){if(k==='arrowleft'||k==='a')defend('left');if(k==='arrowright'||k==='d')defend('right');if(k==='arrowdown'||k==='s')defend('brace');}
});
function frame(now){const dt=Math.min(.25,Math.max(0,(now-lastFrame)/1000));lastFrame=now;heroTime+=dt;if(game)animate(dt);else drawHero(heroTime);if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}requestAnimationFrame(frame);}
// Small, read-only diagnostics help validate combat without changing a saved career.
window.SlapCircuit={getState:()=>game?JSON.parse(JSON.stringify(game)):null,validateSave:validSave};
renderLobby();drawHero(0);requestAnimationFrame(frame);
})();

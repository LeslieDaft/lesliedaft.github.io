/* Out of Credits — browser UI. No network, accounts, or real AI credits. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const {Game,HARDWARE,AGENTS,PROJECTS,UPGRADES,PERSONALITIES,fmt} = OOC;
 const KEY = 'daft-out-of-credits-v1';
 const MAX_OFFLINE = 4*60*60;
 const freshSettings = {sound:false,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
 let prefs={...freshSettings}, saved=null, storageOK=true, activeTab='hardware', quantity=1, scene;
 let audio, lastSound=0, lastDraw=0, lastScene='', lastClickLine=0, saveTimer=0;
 const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try {const text=localStorage.getItem(KEY);if(text) saved=JSON.parse(text);} catch {storageOK=false;}
 if(saved?.version===1 && saved.settings){prefs.sound=saved.settings.sound===true;prefs.reducedMotion=typeof saved.settings.reducedMotion==='boolean'?saved.settings.reducedMotion:freshSettings.reducedMotion;}
 let game=new Game(saved?.version===1?saved.game:undefined);
 const offline=saved?.version===1&&Number.isFinite(saved.savedAt)?Math.min(MAX_OFFLINE,Math.max(0,(Date.now()-saved.savedAt)/1000)):0;
 const offlineBefore=game.s.credits;
 if(offline>5)game.tick(offline);
 const offlineGain=game.s.credits-offlineBefore;
 const titles=['Bedroom startup','Garage compute','The GPU era','Server room','Data center district','Orbital operations','Lunar intelligence','A stellar idea'];
 const lines=['Ready when you are, boss.','I have 12 ideas. Eleven involve a hamster.','Thinking outside the server rack.','Yes, the button is part of the business model.','The future has a suspicious number of fans.','I turned coffee into a spreadsheet.','Working on my next very confident guess.','Please do not unplug the moon.','We are approximately one upgrade from greatness.'];
 const rivals=[
  {target:1000,name:'They have a pitch deck. You have a laptop.',desc:'Take your first customer.',reward:150},
  {target:25000,name:'Ramble Inc. bought a billboard.',desc:'Win the local AI showdown.',reward:3500},
  {target:500000,name:'Their chatbot is writing a 400-page apology.',desc:'Become the neighborhood supercomputer.',reward:65000},
  {target:10000000,name:'They just discovered the power button.',desc:'Outgrow their entire data center.',reward:1250000},
  {target:1000000000,name:'Ramble Inc. would like to discuss a merger.',desc:'Buy the company. Keep the office plant.',reward:150000000}
 ];
 function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;$('toasts').append(el);while($('toasts').children.length>3)$('toasts').firstElementChild.remove();setTimeout(()=>el.remove(),4200);}
 function sound(high=false){if(!prefs.sound||document.hidden||performance.now()-lastSound<45)return;lastSound=performance.now();try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.setValueAtTime(high?740:350,audio.currentTime);o.frequency.exponentialRampToValueAtTime(high?1100:510,audio.currentTime+.07);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}catch{}}
 function save(show=false){try{localStorage.setItem(KEY,JSON.stringify({version:1,game:game.save(),savedAt:Date.now(),settings:prefs}));storageOK=true;}catch{storageOK=false;}$('save-status').textContent=storageOK?'● Progress saves on this browser':'○ Storage unavailable — use Export in settings';if(show)toast(storageOK?'Progress saved.':'Browser storage is blocked. Export your save in settings.');}
 function handle(result,quiet=false){if(result?.message&&!quiet)toast(result.message);if(result?.ok){sound(true);save();}render();return result;}
 function total(list){return list.reduce((a,b)=>a+b,0);}
 function stageIndex(stats){if(typeof stats.stage==='number')return stats.stage;return Math.max(0,HARDWARE.findIndex(x=>x.id===stats.stage?.id));}
 function shopEntries(){
  const upgrades=category=>UPGRADES.filter(item=>item.category===category).map(item=>({item,kind:'upgrade'}));
  if(activeTab==='hardware')return [...HARDWARE.map((item,index)=>({item,index,kind:'hardware'})),...upgrades('hardware')];
  if(activeTab==='agents')return [...AGENTS.map((item,index)=>({item,index,kind:'agent'})),...upgrades('agent')];
  if(activeTab==='upgrades')return upgrades('click');
  return PROJECTS.map(item=>({item,kind:'project'}));
 }
 function buildShop(){
  const list=shopEntries();
  const descriptions={hardware:'Machines and upgrades · hardware income only.',agents:'Workers and upgrades · agent income only.',upgrades:'Click upgrades · credits per click only.',projects:'Global bonuses · boost all three income sources.'};
  $('shop-caption').textContent=descriptions[activeTab];$('quantity-control').hidden=!['hardware','agents'].includes(activeTab);
  $('shop-items').setAttribute('aria-labelledby','tab-'+activeTab);
  $('shop-items').innerHTML=list.map(({item,kind},i)=>{
   const heading=(i===0||kind!==list[i-1].kind)?`<h3 class="shop-group">${kind==='hardware'?'Machines':kind==='agent'?'AI workers':kind==='project'?'Creations':activeTab==='hardware'?'Hardware upgrades':activeTab==='agents'?'Agent upgrades':'Click upgrades'}</h3>`:'';
   return heading+`<div class="shop-row" data-index="${i}"><div class="item-icon" aria-hidden="true">${escape(item.icon||'✳')}</div><div class="item-copy"><div class="item-title">${escape(item.name)} <span class="owned"></span></div><p>${escape(item.description)}</p><span class="item-benefit"></span></div><button class="buy" data-buy="${i}" aria-label="Buy ${escape(item.name)}"></button></div>`;
  }).join('');
  updateShop();
 }
 function updateShop(){
  const list=shopEntries();
  $('shop-items').querySelectorAll('.shop-row').forEach(row=>{
   const entry=list[Number(row.dataset.index)],{item,kind,index}=entry;let cost,owned,built=false,benefit;
   const repeatable=kind==='hardware'||kind==='agent';
   if(repeatable){
    owned=(kind==='hardware'?game.s.hardware:game.s.agents)[index]||0;cost=kind==='hardware'?game.quoteHardware(index,quantity):game.quoteAgent(index,quantity);
    benefit=`+${fmt(item.cps)} base ${kind==='hardware'?'hardware':'agent'} credits / sec each`;
   }else{
    built=(kind==='project'?game.s.projects:game.s.upgrades).includes(item.id);owned=built?'✓':'';cost=item.cost;
    benefit=kind==='project'?`+${Math.round(item.bonus*100)}% to all three sources${game.s.personality==='creative'?' · doubled in creative mode':''}`:item.category==='click'?`×${item.clickMult} credits / click only`:item.category==='hardware'?`×${item.hardwareMult} hardware income only`:`×${item.agentMult} agent income only`;
   }
   row.classList.toggle('built',built);row.querySelector('.owned').textContent=owned;row.querySelector('.owned').hidden=owned==='';
   row.querySelector('.item-benefit').textContent=benefit;
   const button=row.querySelector('.buy');button.textContent=built?(kind==='project'?'Created ✓':'Owned ✓'):`${fmt(cost)} ✳`;button.disabled=built||game.s.credits<cost;
   button.title=built?'Already owned':`Buy ${repeatable?quantity+' × ':''}${item.name} for ${Math.ceil(cost).toLocaleString()} credits`;
  });
 }
 function render(){
  const s=game.s,st=game.stats();
  $('credits').textContent=fmt(s.credits);$('credits').title=Math.floor(s.credits).toLocaleString()+' credits';
  $('cps').textContent=fmt(st.cps);$('hardware-cps').textContent=fmt(st.hardwareCps);$('agent-cps').textContent=fmt(st.agentCps);$('per-click').textContent=fmt(st.perClick);$('generate-plus').textContent='+'+fmt(st.perClick)+' ↗';
  const stage=stageIndex(st);$('stage-name').textContent=titles[Math.min(stage,7)];$('generation').textContent='GEN '+String(s.generation).padStart(2,'0');
  const agentCount=total(s.agents),hardwareCount=total(s.hardware);
  $('agent-count').textContent=agentCount+' agent'+(agentCount===1?'':'s')+' online';$('total-compute').textContent=hardwareCount+' machine'+(hardwareCount===1?'':'s')+' humming';$('project-count').textContent=s.projects.length+' / '+PROJECTS.length+' creations shipped';
  $('next-tip').textContent=hardwareCount===0?'Your first laptop costs 15 credits. Give that button a few clicks.':s.projects.length===0?'Ship your first creation in Projects for a permanent boost this run.':agentCount===0?'Hire an AI agent to keep credits flowing while you plan your next move.':st.prestigeGain>0?'A new generation is ready. Launch below for permanent intelligence.':'Keep building. New hardware changes your lab as your empire grows.';
  document.querySelectorAll('[data-personality]').forEach(button=>{const selected=button.dataset.personality===s.personality;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  const selectedPersonality=PERSONALITIES.find(p=>p.id===s.personality);$('personality-info').textContent=selectedPersonality?'Selected: '+selectedPersonality.name+' — '+selectedPersonality.description:'';
  const sceneState={stage,hardware:s.hardware,agents:s.agents,personality:s.personality,projects:s.projects.length,generation:s.generation,reducedMotion:prefs.reducedMotion};
  const signature=JSON.stringify(sceneState);if(scene&&signature!==lastScene){scene.setState(sceneState);lastScene=signature;}
  const cook=s.cook;const cookPercent=cook?Math.min(100,cook.elapsed/20*100):0;
  $('cook-progress').style.width=cookPercent+'%';$('cook-progress').style.background=cook?.stalled?'#bd8575':cook?.elapsed>6?'#ffaf74':'#d0f884';
  document.querySelector('.cook-meter').setAttribute('aria-valuenow',Math.min(20,cook?.elapsed||0).toFixed(1));
  $('cook-status').textContent=!cook?'The kitchen is open.':cook.stalled?'It rambled. Collect half the response reward.':cook.ready?'Perfectly cooked. Collect your response.':cook.elapsed<=6?`${cook.elapsed.toFixed(1)}s · safe thinking`:`${cook.elapsed.toFixed(1)}s · rambling risk`;
  $('cook-value').textContent=fmt(cook?.potential||0)+' credits';$('cook').innerHTML=!cook?'Start thinking <span>↗</span>':cook.stalled?'Collect salvaged credits <span>↻</span>':'Collect response <span>↗</span>';
  $('prompt-submit').disabled=s.promptCooldown>0;$('prompt-submit').innerHTML=s.promptCooldown>0?`Thinking break · ${Math.ceil(s.promptCooldown)}s <span>◷</span>`:'Run prompt <span>↗</span>';
  $('intelligence').textContent='+'+fmt(st.prestigeReward);$('intel-bonus').textContent='+'+fmt(st.prestigeReward*25)+'% income forever';
  $('intel-total').textContent=`${fmt(s.intelligence)} total intelligence · +${fmt(s.intelligence*25)}% income`;
  $('prestige-requirement').textContent=`Earn ${fmt(st.prestigeCost)} credits this run to launch. Next reset: +${fmt(st.nextPrestigeReward)} intelligence for ${fmt(st.nextPrestigeCost)} credits (reward ×${st.prestigeRewardGrowth}, cost ×${st.prestigeGrowth}).`;
  $('prestige-progress').style.width=Math.min(100,s.runEarned/st.prestigeCost*100)+'%';$('prestige-earned').textContent=`${fmt(s.runEarned)} / ${fmt(st.prestigeCost)} credits earned this run`;
  $('prestige').disabled=st.prestigeGain<1;$('prestige').innerHTML=`Launch for +${fmt(st.prestigeReward)} intelligence <span>↗</span>`;
  const rival=rivals[Math.min(s.rivalWins||0,rivals.length)];
  if(rival){$('rival-title').textContent=rival.name;$('rival-description').textContent=`${rival.desc} Reward: ${fmt(rival.reward)} credits.`;$('rival-progress').style.width=Math.min(100,s.totalEarned/rival.target*100)+'%';$('rival-count').textContent=fmt(s.totalEarned)+' / '+fmt(rival.target);$('rival-claim').disabled=s.totalEarned<rival.target;$('rival-claim').textContent=s.totalEarned>=rival.target?'Claim victory ↗':'In progress';}
  else{$('rival-title').textContent='Ramble Inc. is now a houseplant subsidiary.';$('rival-description').textContent='You bought the competition. Next stop: a simulated universe.';$('rival-progress').style.width='100%';$('rival-count').textContent='5 / 5 victories';$('rival-claim').disabled=true;$('rival-claim').textContent='Acquired ✓';}
  $('event-banner').hidden=!s.event;if(s.event){$('event-name').textContent=s.event.name||s.event.title;$('event-description').textContent=s.event.description+' · '+Math.ceil(s.event.expiresIn)+'s left';}
  $('sound').textContent=prefs.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(prefs.sound));updateShop();
 }
 function click(){if($('dialog').open)return;const r=game.click();sound(r.critical);scene?.burst(r.amount);if(!prefs.reducedMotion){const el=document.createElement('span');el.className='float'+(r.critical?' critical':'');el.textContent=(r.critical?'CRIT! ':'')+'+'+fmt(r.amount);el.style.left=(35+Math.random()*28)+'%';el.style.top=(40+Math.random()*15)+'%';$('floating').append(el);while($('floating').children.length>14)$('floating').firstElementChild.remove();setTimeout(()=>el.remove(),1000);}
  $('generate').classList.add('pressed');setTimeout(()=>$('generate').classList.remove('pressed'),90);
  if(Date.now()-lastClickLine>2800){$('model-line').textContent=lines[Math.floor(Math.random()*lines.length)];lastClickLine=Date.now();}render();
 }
 // This clicker uses its native buttons for every action on touch screens.
 window.DaftTouch?.create({id:'out-of-credits',title:'Tap controls',buttons:[],joysticks:[]});
 $('generate').addEventListener('click',click);
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!$('dialog').open&&!['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();click();}});
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{activeTab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));});buildShop();}));
 document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();});
 document.querySelectorAll('[data-qty]').forEach(b=>b.addEventListener('click',()=>{quantity=Number(b.dataset.qty);document.querySelectorAll('[data-qty]').forEach(button=>{const yes=Number(button.dataset.qty)===quantity;button.classList.toggle('selected',yes);button.setAttribute('aria-pressed',String(yes));});updateShop();}));
 $('shop-items').addEventListener('click',e=>{const button=e.target.closest('[data-buy]');if(!button||button.disabled)return;const entry=shopEntries()[Number(button.dataset.buy)];if(!entry)return;const {kind,item,index}=entry;let result;if(kind==='hardware')result=game.buyHardware(index,quantity);else if(kind==='agent')result=game.buyAgent(index,quantity);else if(kind==='upgrade')result=game.buyUpgrade(item.id);else result=game.buildProject(item.id);handle(result);scene?.burst(3);});
 document.querySelectorAll('[data-personality]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.personality!==game.s.personality)handle(game.setPersonality(button.dataset.personality));}));
 $('cook').addEventListener('click',()=>handle(game.s.cook?game.collectCook():game.startCook()));
 $('prompt-submit').addEventListener('click',()=>{const result=game.choosePrompt(Number($('prompt-a').value),Number($('prompt-b').value),Number($('prompt-c').value));if(result.ok)$('prompt-result').textContent=result.title+'. '+result.message;handle(result);});
 $('event-claim').addEventListener('click',()=>handle(game.claimEvent()));
 $('rival-claim').addEventListener('click',()=>{const i=game.s.rivalWins||0,rival=rivals[i];if(!rival||game.s.totalEarned<rival.target)return;game.s.rivalWins=i+1;game.earn(rival.reward);sound(true);toast(`Ramble Inc. defeated! +${fmt(rival.reward)} credits.`);save();render();});
 $('sound').addEventListener('click',()=>{prefs.sound=!prefs.sound;sound(true);save();render();});
 function showDialog(html){$('dialog-content').innerHTML=html;if(!$('dialog').open)$('dialog').showModal();}
 $('dialog-close').addEventListener('click',()=>$('dialog').close());
 $('help').addEventListener('click',()=>showDialog(`<h2>Your first million starts here.</h2><p>Click <strong>Generate Credits</strong> or press Space. Buy hardware and AI agents to earn credits every second.</p><ul><li><strong>Clicks</strong> has upgrades that only improve credits per click.</li><li><strong>Hardware</strong> has machines and upgrades that only improve hardware income.</li><li><strong>Agents</strong> has workers and upgrades that only improve agent income. Their earnings are separate from hardware.</li><li><strong>Projects</strong> are clearly marked global bonuses for all three income sources. Collect all ${PROJECTS.length}.</li><li><strong>Personalities</strong> are free to switch. Match one to your strategy.</li><li><strong>Let it cook</strong> gives a risk-free response for 6 seconds, then risks halving that response’s reward. It never spends your credits.</li><li><strong>Prompt Lab</strong> pays a bonus and hides secret combinations.</li><li><strong>New generations</strong> reset your setup for intelligence: +25% income per point, forever. The reward starts at +2 intelligence and doubles after every reset: +2, +4, +8, +16… The requirement starts at 1M credits earned this run and increases 4× after every reset: 1M, 4M, 16M, 64M… The big number and launch button show the reward for your next reset; your total is listed separately.</li></ul><p>Progress saves on this browser. Your machines earn for up to 4 hours while you’re away. These are fictional game credits.</p>`));
 $('prestige').addEventListener('click',()=>{const {prestigeGain:gain,nextPrestigeReward,nextPrestigeCost,prestigeGrowth,prestigeRewardGrowth}=game.stats();if(gain<1)return;showDialog(`<h2>Launch the next generation?</h2><p>You’ll gain <strong>+${fmt(gain)} intelligence</strong>, worth +${fmt(gain*25)}% to your base income permanently.</p><p>After this launch, your next reset will award <strong>+${fmt(nextPrestigeReward)} intelligence</strong> (×${prestigeRewardGrowth}) and require <strong>${fmt(nextPrestigeCost)} credits earned that run</strong> (×${prestigeGrowth}).</p><p>Your credits, hardware, agents, upgrades, and creations reset. You keep your intelligence, discoveries, rival victories, and lifetime earnings.</p><button id="confirm-prestige" class="secondary">Launch for +${fmt(gain)} intelligence <span>↗</span></button>`);$('confirm-prestige').addEventListener('click',()=>{$('dialog').close();handle(game.prestige());buildShop();render();toast('Fresh model. Bigger possibilities.');});});
 function settingsDialog(){showDialog(`<h2>Your lab, your settings.</h2><div class="dialog-stats"><span>Lifetime credits <b>${fmt(game.s.totalEarned)}</b></span><span>Clicks <b>${fmt(game.s.clicks)}</b></span><span>Discoveries <b>${game.s.discoveries?.length||0}</b></span><span>Generation <b>${game.s.generation}</b></span></div><label class="check-row"><input type="checkbox" id="motion-setting" ${prefs.reducedMotion?'checked':''}> Reduce animation</label><p>Autosave is local to this browser. Export a backup to move your progress to another computer. Offline earnings are capped at 4 hours.</p><button class="secondary" id="save-now">Save now <span>↗</span></button><button class="secondary" id="export-save">Export save <span>↓</span></button><button class="secondary" id="import-save">Import save <span>↑</span></button><input id="import-file" type="file" accept="application/json,.json"><button class="secondary danger" id="reset-game">Reset all progress</button>`);
  $('motion-setting').addEventListener('change',()=>{prefs.reducedMotion=$('motion-setting').checked;lastScene='';save();render();});
  $('save-now').addEventListener('click',()=>save(true));
  $('export-save').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,game:game.save(),settings:prefs,savedAt:Date.now()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='out-of-credits-save.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Save exported. Keep it somewhere safe.');});
  $('import-save').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1e6)throw Error('Save is too large.');const raw=JSON.parse(await file.text());if(raw?.version!==1||!raw.game||typeof raw.game!=='object'||!Array.isArray(raw.game.hardware)||!Number.isFinite(raw.game.credits))throw Error('This is not an Out of Credits save.');showDialog('<h2>Replace your current progress?</h2><p>This imports the selected save over the game on this browser.</p><button id="confirm-import" class="secondary">Import this save <span>↑</span></button>');$('confirm-import').addEventListener('click',()=>{game=new Game(raw.game);if(raw.settings&&typeof raw.settings==='object'){prefs.sound=raw.settings.sound===true;prefs.reducedMotion=typeof raw.settings.reducedMotion==='boolean'?raw.settings.reducedMotion:freshSettings.reducedMotion;}lastTick=Date.now();lastScene='';$('dialog').close();buildShop();save();render();toast('Save imported. Welcome back to the lab.');});}catch(err){toast(err.message||'Could not read this save.');}});
  $('reset-game').addEventListener('click',()=>{showDialog('<h2>Start completely over?</h2><p>This erases all credits, intelligence, creations, and discoveries on this browser. Export a backup first if you want to keep them.</p><button class="secondary danger" id="confirm-reset">Erase progress and restart</button>');$('confirm-reset').addEventListener('click',()=>{game=new Game();lastTick=Date.now();lastScene='';$('dialog').close();buildShop();save();render();toast('A fresh start. Make those first five credits count.');});});
 }
 $('settings').addEventListener('click',settingsDialog);
 try{scene=new CreditScene($('lab-canvas'));}catch(err){console.warn('Lab illustration unavailable',err);}
 // Keep UI labels tied to the engine’s actual prompt combinations.
 if(OOC.PROMPT_OPTIONS){const values=Object.values(OOC.PROMPT_OPTIONS);['prompt-a','prompt-b','prompt-c'].forEach((id,i)=>{const arr=values[i];if(Array.isArray(arr))$(id).innerHTML=arr.map((x,j)=>`<option value="${j}">${escape(x)}</option>`).join('');});}
 let lastTick=Date.now();
 function advance(){const now=Date.now(),dt=Math.min(MAX_OFFLINE,Math.max(0,(now-lastTick)/1000));lastTick=now;if(dt>0){game.tick(dt);saveTimer+=dt;}if(!document.hidden&&now-lastDraw>200){render();lastDraw=now;}if(saveTimer>=5){saveTimer=0;save();}}
 setInterval(advance,250);
 document.addEventListener('visibilitychange',()=>{advance();save();});
 window.addEventListener('pagehide',()=>{advance();save();});
 buildShop();render();save();
 if(!storageOK)toast('Browser storage is unavailable. Export a backup in settings to keep your progress.');
 if(offline>15&&offlineGain>0)toast(`Welcome back! Your AI earned ${fmt(offlineGain)} credits while you were away.`);
})();

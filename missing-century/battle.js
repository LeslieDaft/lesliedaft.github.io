(() => {
  'use strict';

  const partyNames = ['Ari', 'Mira', 'Bram'];
  const patterns = {
    rush: ['rush', 'quick', 'charge', 'quick'],
    ward: ['quick', 'ward', 'heavy', 'quick'],
    swarm: ['swarm', 'quick', 'swarm', 'heavy'],
    drain: ['quick', 'drain', 'quick', 'heavy'],
    ash: ['ash', 'quick', 'charge', 'quick'],
    pierce: ['pierce', 'quick', 'heavy', 'pierce'],
    gale: ['quick', 'gale', 'quick', 'charge'],
    counter: ['quick', 'counter', 'pierce', 'heavy'],
    focus: ['quick', 'ward', 'quick', 'heavy'],
    rewind: ['quick', 'ward', 'charge', 'drain']
  };
  const aliases = {charge:'rush', guard:'ward', poison:'ash', heal:'drain',
    beetle:'rush', slime:'ward', crab:'counter', moth:'gale', golem:'ward',
    wisp:'drain', bird:'gale', knight:'pierce', serpent:'rush', root:'ash'};
  const moves = {
    quick: { name:'Quick strike', cue:'It prepares a quick strike.', damage:.7 },
    rush: { name:'Rush', cue:'It lowers its head to rush.', damage:1.1 },
    charge: { name:'Full charge', cue:'The ground shudders. Guard or use Spark to break the charge.', damage:2, high:true, interrupt:true },
    ward: { name:'Ward', cue:'Its ward will blunt strikes. A combo breaks it.', damage:.35, block:true },
    swarm: { name:'Swarm', cue:'Shadows gather for a sweeping attack. Guard or use Spark.', damage:1.6, high:true, interrupt:true },
    heavy: { name:'Crushing blow', cue:'It winds up a crushing blow. Guard or use Spark.', damage:1.85, high:true, interrupt:true },
    drain: { name:'Life drain', cue:'It is drawing in energy. Guard to limit what it steals.', damage:.95, heal:true },
    ash: { name:'Ash wave', cue:'A wave of embers builds. Guard or use Spark.', damage:1.62, high:true, interrupt:true },
    pierce: { name:'Piercing strike', cue:'It aims past the party’s guard. Use Spark to interrupt.', damage:1.35, pierce:true, interrupt:true },
    gale: { name:'Gale', cue:'The wind rises. Guard or use Spark to interrupt.', damage:1.7, high:true, interrupt:true },
    counter: { name:'Riposte', cue:'It braces for a riposte. A combo breaks its stance.', damage:.7, block:true, counter:true },
    breath: { name:'Sleeping breath', cue:'Dust rises with every breath. Its eyes are closed.', damage:.7 },
    age: { name:'A Thousand Years', cue:'The sleeping giant takes a deep breath. Guard against the shockwave.', damage:2.15, high:true },
    echo: { name:'Second Toll', cue:'A familiar bell tolls inside the creature’s chest.', damage:.95 },
    rewind: { name:'Unmake', cue:'Your last blow flickers backward. Use Anchor to make this turn stick.', damage:.6, rewind:true },
    nightmare: { name:'A Thousand Years', cue:'Stone turns to dust where it looks. Guard or use Spark.', damage:2.05, high:true, interrupt:true },
    shade: { name:'Stolen Moment', cue:'The Reef Crown rises again for a moment. Its shadow towers over the party.', damage:1.25 },
    freeze: { name:'Stop the World', cue:'Everything freezes. Only a shared memory can move. Use Anchor.', damage:0, high:true, freeze:true },
    gaze: { name:'The Open Eye', cue:'Its gaze bends the arena. Guard to keep the party standing.', damage:2.15, high:true },
    collapse: { name:'End of Days', cue:'The arena begins to collapse into a single point. Guard or use Spark.', damage:2.35, high:true, interrupt:true },
    fracture: { name:'Fractured Time', cue:'The floor splits into yesterday and tomorrow.', damage:1.2 }
  };
  const finalTurns = [
    ['age','echo','breath','age'],
    ['rewind','nightmare','shade','echo'],
    ['freeze','gaze','fracture','collapse','rewind','shade']
  ];
  const finalNames = ['In Its Sleep','The Dreaming Dark','The Eye Opens'];
  const commands = [
    {id:'strike', title:'Strike', desc:'+2 Focus', cost:0},
    {id:'spark', title:'Spark', desc:'2 Focus · interrupt', cost:2},
    {id:'mend', title:'Mend', desc:'3 Focus · restore HP', cost:3},
    {id:'guard', title:'Guard', desc:'+2 Focus · brace', cost:0},
    {id:'combo', title:'Crosslight', desc:'4 Focus · break ward', cost:4},
    {id:'anchor', title:'Anchor', desc:'Remember together', cost:0}
  ];
  const phaseLines = [
    'The Last Hour is asleep. Its first breath turns the far wall into ruins.',
    'Something dreams behind the closed eyelids. The shattered stones rise back into place.',
    'One eye opens. You can hear the last nine heartbeats, each trapped in the instant it happened.'
  ];
  const capped = (value, min, max) => Math.min(max,Math.max(min,value));

  function create({chapter=1, enemy={}, party=partyNames, bonus=0}={}) {
    const enemies = {...enemy};
    const final = !!enemies.boss && (chapter === 10 || enemies.form === 'final' || enemies.form === 'last');
    const power = capped(Number(enemies.power) || (enemies.boss ? 13 : 9) + Math.floor(chapter/2),5,24);
    const hp = capped(Number(enemies.hp) || (enemies.boss ? 76+chapter*5 : 34+chapter*4),24,165);
    const pattern = patterns[enemies.pattern] || patterns[aliases[enemies.pattern]] || patterns[aliases[enemies.form]] || patterns.rush;
    const health = 108 + capped(Number(bonus) || 0, 0, 6)*2 + chapter*2;
    const state = {
      chapter, enemy:enemies, party, final, phase:0, turn:0,
      maxHp:health, hp:health, focus:2, enemyHp:final ? 62 : hp, enemyMaxHp:final ? 62 : hp,
      intent:null, log:[], status:'playing', effect:'none', hit:0, lastStrike:0, ruins:false
    };
    const say = line => { state.log.push(line); if (state.log.length > 5) state.log.shift(); };
    function nextIntent() {
      const rotation = final ? finalTurns[state.phase] : pattern;
      const id = rotation[state.turn % rotation.length];
      state.intent = {id,...moves[id]};
    }
    function available() {
      return commands.map(command => {
        const visible = command.id !== 'anchor' || final && state.phase > 0;
        const local = command.id !== 'anchor' || state.intent.rewind || state.intent.freeze;
        const frozen = state.intent.freeze && command.id !== 'anchor';
        return {...command, visible, enabled:visible && local && !frozen && state.focus >= command.cost && state.status === 'playing'};
      });
    }
    function applyCommand(id) {
      const command = available().find(entry => entry.id === id && entry.enabled);
      if (!command) return false;
      const guarding = id === 'guard';
      const {intent} = state;
      let damage = 0;
      state.focus -= command.cost;
      state.effect = id;
      if (id === 'strike') {
        damage = intent.block ? 7 : 17;
        say(`Ari strikes for ${damage}.`);
      }
      if (id === 'spark') {
        damage = intent.interrupt ? 15 : intent.block ? 6 : 18;
        say(`Mira casts Spark for ${damage}.`);
      }
      if (id === 'mend') {
        const healed = Math.min(state.maxHp - state.hp, 44);
        state.hp += healed;
        say(`Mira restores ${healed} party HP.`);
      }
      if (id === 'guard') say('Bram shields the party and builds Focus.');
      if (id === 'combo') {
        damage = intent.block ? 43 : 39;
        say(`Ari and Mira land Crosslight for ${damage}.`);
      }
      if (id === 'anchor') {
        damage = 30;
        say(intent.freeze
          ? 'Ari hears the bell at Bellmead. Mira feels the spray at the lighthouse. Bram smells copper coal. Their hands move together.'
          : 'The party remembers the bell at Bellmead. The moment holds.');
        state.focus = Math.min(6,state.focus + 2);
      }
      if (id === 'strike' || guarding) state.focus = Math.min(6,state.focus + 2);
      state.enemyHp = Math.max(0, state.enemyHp - damage);
      state.hit = damage;

      const breakAttack = id === 'spark' && intent.interrupt || id === 'combo' && intent.block || id === 'anchor';
      const livePhase = final && state.phase < 2;
      const phaseProtected = livePhase && state.turn < (state.phase === 0 ? 2 : 1);
      if (state.enemyHp === 0 && !phaseProtected) {
        if (livePhase) {
          state.phase += 1;
          state.enemyMaxHp = [62,78,105][state.phase];
          state.enemyHp = state.enemyMaxHp;
          state.focus = Math.max(2,state.focus);
          state.hp = Math.min(state.maxHp,state.hp+33);
          state.turn = 0;
          state.lastStrike = 0;
          state.ruins = false;
          state.effect = 'phase';
          say(phaseLines[state.phase]);
          nextIntent();
          return true;
        }
        state.status = 'won';
        say(final ? 'For the first time in a thousand years, the clock strikes morning.' : `${enemies.name || 'The enemy'} is defeated.`);
        return true;
      }
      if (breakAttack) {
        if (id !== 'anchor') say(`${intent.name} is interrupted.`);
      } else {
        if (intent.rewind) {
          const restored = Math.min(state.enemyMaxHp-state.enemyHp,Math.max(18,state.lastStrike+damage));
          state.enemyHp += restored;
          say(`Unmake rewinds the wound. ${restored} enemy HP returns.`);
          state.effect = 'rewind';
        }
        let lost = Math.round(power * intent.damage * (guarding ? (intent.pierce ? .67 : .23) : 1));
        if (intent.counter && id === 'strike') lost += 9;
        state.hp = Math.max(0, state.hp-lost);
        if (lost) say(`${intent.name} hits the party for ${lost}.`);
        if (intent.heal) state.enemyHp = Math.min(state.enemyMaxHp, state.enemyHp + Math.floor(lost/2));
        if (intent.id === 'age') {
          state.effect = 'age';
          state.ruins = true;
        }
      }
      if (state.hp === 0) {
        state.status = 'lost';
        say('The party falls.');
      } else {
        state.turn += 1;
        state.lastStrike = damage;
        nextIntent();
      }
      return true;
    }

    say(final ? phaseLines[0] : `${enemies.name || 'A foe'} blocks the way.`);
    nextIntent();
    return {state, actions:available, act:applyCommand};
  }

  const battlePalettes = [
    ['#121e31','#203c51','#355b62','#4d6965','#293d47','#26343a','#d7cc92'],
    ['#161e2f','#214651','#2e656e','#73978c','#304b58','#25343f','#d1d9c2'],
    ['#181a2c','#302d4d','#553b61','#89768c','#443b5d','#2d2846','#e6b7ba'],
    ['#261c25','#573540','#774a46','#9d7457','#553b42','#3b2a38','#f4c387'],
    ['#08152a','#1a3d5c','#2e5672','#75a2b1','#26394e','#1c2439','#d5eaed']
  ];
  const finalPalettes = [
    ['#180e1c','#351d32','#593846','#8b6562','#473040','#2d202f','#f1bb82'],
    ['#080a1a','#201b3d','#34215e','#655379','#2e284f','#1d193a','#b4a1ed'],
    ['#1e0716','#451025','#731d35','#aa5658','#542432','#2f1729','#ff9082']
  ];
  const heroes = [
    ['#f8c78a','#19977d','#28464d','#6fe9b6','#532a34'],
    ['#eab8ae','#c66ab2','#4c2854','#ffd2f0','#5b324c'],
    ['#d6a586','#b77737','#5e4640','#f4bd73','#4e3234']
  ];
  const beasts = {
    beetle:['#313637','#737e4d','#b4be67','#f7d668'],
    slime:['#15404d','#2e8d7e','#67d0a9','#d2ffe4'],
    crab:['#55253e','#a34f53','#e98a65','#ffda79'],
    moth:['#443559','#8565a0','#c197c4','#ffe7ae'],
    golem:['#37404b','#647477','#9cafa2','#91fbd1'],
    wisp:['#2a295a','#586ade','#91c1ff','#f1e3ff'],
    bird:['#332754','#674b85','#cc88b4','#ffe1ae'],
    knight:['#2d3447','#6d7898','#a4b9ce','#ffe58d'],
    serpent:['#363347','#6f761c','#c1cd52','#fddc85'],
    root:['#443342','#82615b','#ab9060','#fff0a1']
  };
  const pixel = (ctx,x,y,w,h,color) => { ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function poly(ctx,points,color) {
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fill();
  }
  function field(ctx,state,t) {
    const c = state.final ? finalPalettes[state.phase] : battlePalettes[(state.chapter-1) % battlePalettes.length];
    pixel(ctx,0,0,384,152,c[0]);
    for (let i=0;i<6;i++) pixel(ctx,0,30+i*8,384,8,i<3?c[0]:c[1]);
    for (let i=0;i<65;i++) {
      const x = (i*97+32) % 384;
      const y = (i*29+7) % 71;
      pixel(ctx,x,y,i%7===0?3:1,1,i%6===0?c[6]:c[2]);
    }
    const sun = state.final ? 305 : 69+state.chapter*23;
    pixel(ctx,sun-12,21,24,27,c[2]);
    pixel(ctx,sun-18,27,36,16,c[2]);
    pixel(ctx,sun-8,22,19,24,c[3]);
    pixel(ctx,sun-12,27,26,15,c[3]);
    if (state.final && state.phase === 2) {
      for (let i=0;i<11;i++) {
        pixel(ctx,0,11+i*6,384,1,c[2]);
        pixel(ctx,(i*67)%384,14+i*7,20+i*3,1,c[3]);
      }
    }
    for (let i=0;i<14;i++) {
      const x=i*31-17;
      const y=61+((i*59+state.chapter*17)%28);
      poly(ctx,[[x,108],[x+9,y+19],[x+19,y],[x+31,y+17],[x+53,104]],c[2]);
      poly(ctx,[[x+19,y],[x+22,y+17],[x+32,y+24],[x+46,105],[x+37,106]],c[3]);
    }
    if (state.final || [3,6,9].includes(state.chapter)) {
      for (const [x,h] of [[25,38],[51,61],[140,30],[335,55],[365,32]]) {
        const n=state.ruins ? Math.floor(h*.42) : h+((state.final && state.phase===1)?10:0);
        pixel(ctx,x,97-n,11,n,c[1]);
        pixel(ctx,x+2,98-n,3,n,c[2]);
        pixel(ctx,x-3,95-n,17,4,c[1]);
        pixel(ctx,x+1,105-n,8,2,c[3]);
        if(state.ruins){
          pixel(ctx,x+15,97,10,3,c[2]);
          pixel(ctx,x-9,95,7,5,c[2]);
        }
      }
    }
    pixel(ctx,0,100,384,52,c[4]);
    pixel(ctx,0,100,384,2,c[3]);
    for(let i=0;i<19;i++){
      const y=105+i*3;
      pixel(ctx,0,y,384,1,c[5]);
      for(let j=0;j<8;j++) pixel(ctx,(j*59+i*47)%384,y-1,3+i*.75,1,i%3?c[2]:c[3]);
    }
    for(let i=0;i<25;i++){
      const speed=state.final?42:16;
      const x=(i*107+Math.floor(t*speed/1000))%384;
      const y=(i*47+17)%103;
      if (Math.sin(t/500+i)>0) pixel(ctx,x,y,1+(i%3===0),1,c[6]);
    }
  }
  function hero(ctx,index,x,y,step,state) {
    const [skin,coat,boot,shine,hair] = heroes[index];
    const bounce = (step+index)%6===0 ? -1:0;
    const selected = {strike:0,spark:1,mend:1,guard:2,combo:0,anchor:1}[state.effect];
    const lean = selected === index && step % 8 < 3 ? 4 : 0;
    pixel(ctx,x-6,y-2,27,5,'#171b2b');
    x += lean;
    y += bounce;
    pixel(ctx,x+2,y-18,15,20,'#1b1b2c');
    pixel(ctx,x+4,y-30,14,15,'#212036');
    pixel(ctx,x+5,y-28,8,11,hair);
    pixel(ctx,x+8,y-26,9,9,skin);
    pixel(ctx,x+13,y-24,5,2,skin);
    pixel(ctx,x+14,y-24,2,2,'#231f32');
    pixel(ctx,x+5,y-29,12,4,hair);
    pixel(ctx,x+5,y-31,9,2,coat);
    pixel(ctx,x+3,y-17,13,13,coat);
    pixel(ctx,x+5,y-17,9,3,shine);
    pixel(ctx,x+6,y-12,3,6,shine);
    pixel(ctx,x+2,y-11,8,4,coat);
    pixel(ctx,x+13,y-14,6,5,skin);
    pixel(ctx,x+5,y-4,4,5,boot);
    pixel(ctx,x+12,y-4,4,4,boot);
    pixel(ctx,x+6,y-1,5,2,'#19192a');
    pixel(ctx,x+13,y-1,5,2,'#19192a');
    if (index===0) {
      pixel(ctx,x+18,y-18,3,11,'#d6e2ed');
      pixel(ctx,x+19,y-19,2,7,'#f8f2c0');
      pixel(ctx,x+17,y-10,5,2,shine);
    } else if (index===1) {
      pixel(ctx,x+19,y-23,2,18,hair);
      pixel(ctx,x+18,y-25,4,4,shine);
    } else {
      pixel(ctx,x+16,y-14,7,9,boot);
      pixel(ctx,x+18,y-13,4,6,shine);
    }
  }
  function beast(ctx,state,step) {
    const form=state.enemy.form || 'beetle';
    const [shadow,mid,light,eye] = beasts[form] || beasts.golem;
    const large=state.enemy.boss ? 1.33 : 1.03;
    const y=109+(step%8===0?-2:0);
    pixel(ctx,241,y-3,102,9,'#202030');
    ctx.save();
    ctx.translate(287,y-27);
    ctx.scale(large,large);
    if (['moth','bird','wisp'].includes(form)) {
      const lift = step%6<3 ? -8:2;
      poly(ctx,[[-12,-2],[-35,-21+lift],[-39,-12+lift],[-33,9],[-10,12]], shadow);
      poly(ctx,[[-8,0],[-33,-16+lift],[-35,-10+lift],[-25,8]], mid);
      poly(ctx,[[10,0],[36,-23+lift],[42,-11+lift],[31,12],[9,14]],shadow);
      poly(ctx,[[11,2],[33,-16+lift],[36,-9+lift],[28,8]],light);
    }
    if (['crab','beetle','root'].includes(form)) {
      for(let i=0;i<3;i++){
        pixel(ctx,-35+i*8,11,5,12-i,shadow);
        pixel(ctx,-36+i*8,11,3,6,mid);
        pixel(ctx,-38+i*8,22-i,9,3,shadow);
        pixel(ctx,15+i*8,11,5,10+i,shadow);
        pixel(ctx,18+i*8,13,3,7,mid);
        pixel(ctx,15+i*8,21+i,9,3,shadow);
      }
    }
    if (form==='serpent') {
      poly(ctx,[[0,20],[30,25],[47,17],[37,10],[19,11],[21,0],[34,-11],[24,-15],[11,-7],[8,15]],shadow);
      poly(ctx,[[3,18],[28,21],[41,16],[28,15]],light);
    }
    if (['golem','knight'].includes(form)) {
      pixel(ctx,-31,-8,14,32,shadow);
      pixel(ctx,18,-10,15,32,shadow);
      pixel(ctx,-29,-6,8,20,mid);
      pixel(ctx,22,-8,8,22,mid);
      pixel(ctx,-17,15,12,12,shadow);
      pixel(ctx,6,15,13,12,shadow);
      if (form==='knight') {
        pixel(ctx,-37,-27,6,48,light);
        pixel(ctx,-40,3,13,4,eye);
      }
    }
    poly(ctx,[[-30,9],[-26,-9],[-17,-16],[-7,-19],[15,-19],[24,-9],[30,10],[23,20],[-23,20]],shadow);
    poly(ctx,[[-25,8],[-18,-10],[-8,-15],[15,-15],[23,-7],[25,10],[17,15],[-18,16]],mid);
    poly(ctx,[[-19,1],[-13,-9],[-4,-12],[13,-11],[17,-7],[-5,-3],[-13,8]],light);
    if (form==='root') {
      poly(ctx,[[-21,-7],[-30,-30],[-23,-30],[-17,-20],[-11,-11]],shadow);
      poly(ctx,[[12,-11],[19,-31],[24,-32],[22,-21],[19,-12]],light);
    }
    if (['crab','beetle'].includes(form)) {
      pixel(ctx,-29,-1,9,6,shadow);
      pixel(ctx,-38,-8,14,9,mid);
      pixel(ctx,-39,-8,6,4,light);
    }
    pixel(ctx,-12,0,8,4,shadow);
    pixel(ctx,5,0,8,4,shadow);
    pixel(ctx,-12,0,5,3,eye);
    pixel(ctx,5,0,5,3,eye);
    pixel(ctx,-7,9,15,2,shadow);
    ctx.restore();
  }

  function sleepingPower(ctx,state,t) {
    const phase=state.phase;
    const breath = Math.round(Math.sin(t/360) * (phase===2 ? 2 : 1));
    const colors = [
      ['#171320','#2b202e','#3e3040','#52394b','#a25e56','#eec0a3'],
      ['#101026','#211b38','#332850','#4c3a6c','#956bd1','#e1cff9'],
      ['#1c0c1f','#320f24','#4d1b32','#792540','#f26766','#fff0b6']
    ][phase];
    if (state.intent.id==='shade') {
      ctx.save();
      ctx.globalAlpha=.45;
      ctx.translate(70,-14);
      beast(ctx,{enemy:{form:'serpent',boss:true}},Math.floor(t/110));
      ctx.restore();
    }
    ctx.save();
    ctx.translate(275,87+breath);
    pixel(ctx,-99,20,195,18,colors[0]);
    poly(ctx,[[-103,22],[-92,5],[-77,-4],[-66,-4],[-54,-25],[-39,-40],[-19,-47],[13,-49],[43,-45],[66,-29],[77,-9],[93,6],[103,24],[85,36],[-94,37]],colors[0]);
    poly(ctx,[[-97,22],[-64,7],[-57,-20],[-42,-35],[-27,-42],[13,-45],[38,-42],[60,-29],[67,-13],[83,-8],[91,16],[83,23],[62,17],[52,23],[-60,20],[-79,30]],colors[1]);
    poly(ctx,[[-67,10],[-60,-20],[-39,-32],[-21,-40],[14,-42],[30,-36],[43,-22],[47,-4],[61,7],[45,12],[15,5],[-10,14],[-38,9]],colors[2]);
    poly(ctx,[[-61,-18],[-46,-42],[-58,-62],[-53,-66],[-37,-49],[-30,-41],[-38,-35],[-49,-29]], colors[0]);
    poly(ctx,[[32,-38],[46,-50],[50,-70],[55,-67],[58,-53],[49,-35],[56,-25]], colors[0]);
    poly(ctx,[[-59,-19],[-47,-38],[-40,-39],[-43,-28],[-48,-22]],colors[3]);
    poly(ctx,[[34,-36],[50,-51],[50,-57],[53,-48],[45,-31]],colors[3]);
    for(let i=0;i<6;i++){
      const x=-68+i*27;
      const sway=Math.round(Math.sin(t/230+i)*phase*2);
      poly(ctx,[[x-9,1],[x-5,13],[x-16+sway,31],[x-24+sway,35],[x-5+sway,35],[x+5,21],[x+15,6]],colors[0]);
      poly(ctx,[[x-3,10],[x+9,6],[x+2,19],[x-7+sway,32],[x-16+sway,34],[x-8+sway,26]],colors[2]);
      pixel(ctx,x-2,12,4,3,colors[3]);
    }
    poly(ctx,[[-45,-12],[-27,-19],[-7,-17],[16,-22],[33,-15],[42,-12],[34,-4],[19,2],[1,2],[-24,2],[-38,-4]],colors[0]);
    if(phase===2){
      poly(ctx,[[-44,-11],[-30,-17],[-8,-14],[15,-20],[33,-14],[39,-11],[29,-6],[18,-3],[-5,-2],[-29,-3]],colors[4]);
      pixel(ctx,-22,-12,46,6,colors[5]);
      pixel(ctx,-1,-16,9,13,'#330719');
      pixel(ctx,1,-16,4,12,'#100713');
      pixel(ctx,11,-12,4,3,'#fffaf1');
    } else {
      pixel(ctx,-40,-10,20,2,colors[3]);
      pixel(ctx,-18,-8,24,2,colors[3]);
      pixel(ctx,8,-10,27,2,phase===1?colors[4]:colors[3]);
    }
    pixel(ctx,-43,-25,15,2,colors[3]);
    pixel(ctx,26,-25,17,2,colors[3]);
    if (state.intent.freeze) {
      pixel(ctx,-275,-87,384,152,'rgba(98, 96, 164, .22)');
      for(let i=0;i<8;i++){
        const x=-225+(i*137%324), y=-66+(i*103%100);
        pixel(ctx,x-5,y,11,1,'#b4b3e4');
        pixel(ctx,x,y-4,1,9,'#d9d9f3');
      }
    }
    ctx.restore();
  }

  function createNode(type,className,value) {
    const node=document.createElement(type);
    if(className) node.className=className;
    if(value!==undefined) node.textContent=value;
    return node;
  }
  function start(root, config) {
    const battle=create(config);
    const {state}=battle;
    const ui=createNode('div','battle-ui');
    const header=createNode('div','battle-heading');
    const name=createNode('strong','battle-name',state.enemy.name || 'Battle');
    const phase=createNode('span','battle-phase');
    const enemyMeter=createNode('progress','battle-meter');
    enemyMeter.setAttribute('aria-label','Enemy HP');
    header.append(name,phase,enemyMeter);
    const arena=createNode('div','battle-arena');
    const canvas=createNode('canvas','battle-canvas');
    canvas.width=384;
    canvas.height=152;
    canvas.setAttribute('aria-hidden','true');
    arena.append(canvas);
    const telegraph=createNode('p','battle-telegraph');
    telegraph.setAttribute('aria-live','polite');
    const status=createNode('div','battle-status');
    const party=createNode('div','battle-party');
    const partyList=createNode('strong','battle-party-names');
    partyList.textContent=state.party.map(member=>typeof member==='string'?member:member.name).join(' · ');
    const partyState=createNode('div','battle-party-state');
    const playerMeter=createNode('progress','battle-meter player-meter');
    playerMeter.setAttribute('aria-label','Party HP');
    party.append(partyList,partyState,playerMeter);
    const log=createNode('p','battle-log');
    log.setAttribute('aria-live','polite');
    status.append(party,log);
    const controls=createNode('div','battle-actions');
    ui.append(header,arena,telegraph,status,controls);
    root.replaceChildren(ui);

    let frame=0, ended=0, effectAt=-400, alive=true;
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const context=canvas.getContext('2d');
    const keyActions=['strike','spark','mend','guard','combo','anchor'];
    const controlsById=new Map(battle.actions().map((action,i)=>{
      const button=createNode('button');
      button.type='button';
      button.dataset.battleAction=action.id;
      button.setAttribute('aria-keyshortcuts',String(i+1));
      button.append(createNode('span','',action.title),createNode('small','',action.desc));
      button.addEventListener('click',()=>act(action.id));
      controls.append(button);
      return [action.id,button];
    }));
    function refresh() {
      ui.dataset.hp=state.hp;
      ui.dataset.maxHp=state.maxHp;
      ui.dataset.focus=state.focus;
      ui.dataset.intent=state.intent.id;
      ui.dataset.threat=state.intent.high?'high':'normal';
      ui.dataset.phase=state.final?String(state.phase+1):'';
      ui.dataset.status=state.status;
      phase.textContent=state.final?finalNames[state.phase]:state.enemy.boss?'Guardian':'Encounter';
      enemyMeter.max=state.enemyMaxHp;
      enemyMeter.value=state.enemyHp;
      enemyMeter.title=`${state.enemyHp}/${state.enemyMaxHp} enemy HP`;
      playerMeter.max=state.maxHp;
      playerMeter.value=state.hp;
      telegraph.dataset.threat=state.intent.high?'high':'normal';
      telegraph.textContent=state.status==='playing'?state.intent.cue:state.status==='won'?'Victory':'The party needs to recover';
      partyState.textContent=`${state.hp}/${state.maxHp} HP · ${state.focus}/6 Focus`;
      log.textContent=state.log.slice(-2).join(' ');
      for(const action of battle.actions()){
        const button=controlsById.get(action.id);
        button.hidden=!action.visible;
        button.disabled=!action.enabled;
        button.classList.toggle('primary',action.enabled && (action.id==='anchor' || action.id==='combo'));
      }
    }
    function act(id) {
      if(!battle.act(id)) return;
      effectAt=performance.now();
      const cue=state.status==='won'?'victory':state.status==='lost'?'loss':({phase:'phase',rewind:'phase',age:'phase',mend:'heal',guard:'guard',anchor:'phase'}[state.effect] || 'hit');
      config.sfx?.(cue);
      refresh();
      if(state.status!=='playing'){
        ended=setTimeout(()=>{if(alive)config.onFinish?.(state.status==='won');},740);
      }
    }
    function onKey(event) {
      if(event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const id=keyActions[Number(event.key)-1];
      if(!id || root.hidden || !root.isConnected) return;
      event.preventDefault();
      act(id);
    }
    function draw(t) {
      if(!alive) return;
      const stageTime=state.intent.freeze || reducedMotion ? 0 : t;
      const step=Math.floor(stageTime/110);
      const effect=state.status==='playing'||state.status==='won';
      const motion=t-effectAt<320 && effect && !reducedMotion;
      context.save();
      field(context,state,stageTime);
      hero(context,1,73,99,step,state);
      hero(context,0,115,109,step,state);
      hero(context,2,61,128,step,state);
      if(state.final) sleepingPower(context,state,stageTime);
      else beast(context,state,step);
      if(motion && state.hit && ['strike','spark','combo','anchor'].includes(state.effect)){
        const x=265+((step%3)*4);
        const tint=state.effect==='spark'?'#b8d3ff':state.effect==='anchor'?'#ffe8b3':'#fef2cc';
        const flicker=1-(t-effectAt)/320;
        context.globalAlpha=flicker;
        poly(context,[[x-19,86],[x+16,51],[x+24,55],[x-10,94]],tint);
        for(let i=0;i<8;i++) pixel(context,x-18+i*6,55+((i*13)%34),2+i%3,2,tint);
        context.globalAlpha=1;
      }
      if(motion && ['phase','age','rewind'].includes(state.effect)){
        pixel(context,0,0,384,152,'rgba(180, 154, 199, .16)');
        for(let i=0;i<10;i++) pixel(context,(i*57+step*7)%384,i*16,22,1,'#e7c7d9');
      }
      context.restore();
      frame=requestAnimationFrame(draw);
    }
    refresh();
    window.addEventListener('keydown',onKey);
    if(context) frame=requestAnimationFrame(draw);
    return {state,act,destroy(){
      alive=false;
      cancelAnimationFrame(frame);
      clearTimeout(ended);
      window.removeEventListener('keydown',onKey);
      ui.remove();
    }};
  }
  const api={create,start};
  if(typeof window!=='undefined') window.MissingCenturyBattle=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})();

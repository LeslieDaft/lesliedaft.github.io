// Procedural music and sound design. No downloads, subscriptions, or audio files.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
const hz=midi=>440*2**((midi-69)/12);
const CHORDS=[45,41,48,43];

class CinematicAudio {
  constructor(kind){
    this.kind=kind;this.ctx=null;this.enabled=true;this.voices=new Set();
    this.state={paused:false,speed:0,depth:0,danger:0,proximity:0,intensity:0};
    this.step=0;this.nextBeat=0;this.lastUpdate=0;this.lastGun=-100;this.nextCreak=8;
  }
  start(){
    try {
      if(!this.ctx){
        const Context=globalThis.AudioContext||globalThis.webkitAudioContext||globalThis.window?.AudioContext||globalThis.window?.webkitAudioContext;
        if(!Context)return false;
        this.ctx=new Context();this.build();
      }
      const resumed=this.ctx.resume?.();resumed?.catch?.(()=>{});
      return true;
    }catch{return false;}
  }
  build(){
    const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=.72;
    const limiter=c.createDynamicsCompressor();limiter.threshold.value=-13;limiter.knee.value=14;limiter.ratio.value=6;limiter.attack.value=.005;limiter.release.value=.18;
    this.master.connect(limiter);limiter.connect(c.destination);
    this.engine=this.bus(0);this.wind=this.bus(0);this.music=this.bus(.15);this.effects=this.bus(.7);
    const length=Math.max(1,Math.floor(c.sampleRate*2));this.noise=c.createBuffer(1,length,c.sampleRate);
    const samples=this.noise.getChannelData(0);let brown=0;
    for(let i=0;i<length;i++){const white=Math.random()*2-1;brown=(brown+white*.025)/1.025;samples[i]=brown*2.8+white*.13;}
    this.engineTone=this.continuous('sawtooth',this.kind==='sub'?28:33,this.engine,0.37,this.kind==='sub'?170:740);
    this.engineOvertone=this.continuous('triangle',this.kind==='sub'?55:67,this.engine,.2,this.kind==='sub'?220:900);
    this.engineNoise=this.loopNoise(this.engine,this.kind==='sub'?125:410,.24);
    this.windNoise=this.loopNoise(this.wind,this.kind==='sub'?250:820,.7);
    this.rumble=this.continuous('sine',this.kind==='sub'?31:24,this.wind,.34,130);
    this.pad=[];
    for(let i=0;i<4;i++){
      const tone=this.continuous(i===3?'sawtooth':'triangle',hz(45+[0,3,7,12][i]),this.music,.052,this.kind==='sub'?450:1000);
      tone.osc.detune.value=(i%2?1:-1)*(i+2);this.pad.push(tone);
    }
    if(this.kind==='sub'){
      // Short, filtered reflections feel like a pressure cabin rather than open air.
      const delay=c.createDelay(.8),feedback=c.createGain(),low=c.createBiquadFilter(),wet=c.createGain();
      delay.delayTime.value=.19;feedback.gain.value=.19;low.type='lowpass';low.frequency.value=640;wet.gain.value=.16;
      this.effects.connect(delay);delay.connect(low);low.connect(wet);wet.connect(this.master);low.connect(feedback);feedback.connect(delay);
    }
    this.nextBeat=c.currentTime+.15;
  }
  bus(gain){const n=this.ctx.createGain();n.gain.value=gain;n.connect(this.master);return n;}
  param(p,value,time=.14){if(!p||!this.ctx)return;p.setTargetAtTime(value,this.ctx.currentTime,time);}
  continuous(type,freq,destination,gain,cutoff){
    const c=this.ctx,osc=c.createOscillator(),filter=c.createBiquadFilter(),volume=c.createGain();
    osc.type=type;osc.frequency.value=freq;filter.type='lowpass';filter.frequency.value=cutoff;volume.gain.value=gain;
    osc.connect(filter);filter.connect(volume);volume.connect(destination);osc.start();return {osc,filter,volume};
  }
  loopNoise(destination,cutoff,gain){
    const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),volume=c.createGain();
    source.buffer=this.noise;source.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;volume.gain.value=gain;
    source.connect(filter);filter.connect(volume);volume.connect(destination);source.start();return {source,filter,volume};
  }
  setEnabled(value){this.enabled=!!value;if(this.ctx)this.param(this.master.gain,this.enabled&&!this.state.paused ? .72 : 0,.08);}
  update(next={}){
    this.state={...this.state,...next};if(!this.ctx)return;
    const s=this.state,c=this.ctx,sub=this.kind==='sub',v=clamp(Math.abs(Number(s.speed)||0)/60),danger=sub?Math.max(clamp(s.danger),clamp((Number(s.depth)-180)/1500)*.7):clamp(s.proximity),strength=clamp(s.intensity);
    this.param(this.master.gain,this.enabled&&!s.paused ? .72 : 0,.08);
    const throttle=s.throttle?1:0;
    this.param(this.engine.gain,sub?.045+v*.18:.11+v*.27+throttle*.06);
    this.param(this.engineTone.osc.frequency,sub?27+v*48:29+v*93+throttle*14,.09);
    this.param(this.engineOvertone.osc.frequency,sub?54+v*70:58+v*151+throttle*20,.12);
    this.param(this.engineTone.filter.frequency,sub?145+v*85:300+v*1050,.18);
    this.param(this.wind.gain,sub?.018+danger*.12:.018+danger**1.25*(.64+strength*.2));
    this.param(this.windNoise.filter.frequency,sub?210+danger*160:340+danger*1750,.4);
    this.param(this.rumble.osc.frequency,sub?28+danger*7:21+strength*12+danger*6,.5);
    this.param(this.music.gain,sub?.075+danger*.055:.23+danger*.24,.8);
    for(const p of this.pad)this.param(p.filter.frequency,sub?220+danger*210:480+danger*1500,1.3);
    if(s.paused||!this.enabled){this.nextBeat=c.currentTime+.15;return;}
    if(sub&&s.depth>220&&c.currentTime>this.nextCreak){this.creak();this.nextCreak=c.currentTime+11+Math.random()*8-danger*6;}
    // Updates never create an unbounded backlog after the page was hidden.
    if(this.nextBeat<c.currentTime-1)this.nextBeat=c.currentTime+.04;
    let scheduled=0;
    while(this.nextBeat<c.currentTime+.12&&scheduled++<3){
      this.sequence(this.nextBeat,danger);this.nextBeat+=sub?1.65:60/(116+danger*30)/2;this.step++;
    }
    this.lastUpdate=c.currentTime;
  }
  sequence(time,danger){
    const sub=this.kind==='sub',bar=Math.floor(this.step/(sub?8:16)),root=CHORDS[bar%CHORDS.length];
    if(this.step%(sub?8:16)===0){
      for(let i=0;i<this.pad.length;i++)this.pad[i].osc.frequency.setTargetAtTime(hz(root+(sub?-12:0)+[0,3,7,12][i]),time,sub?1.8:.6);
    }
    if(sub){
      if(this.step%4===0)this.note(hz(root+12+[0,7,3,10][Math.floor(this.step/4)%4]),1.9,.055,'sine',time,700);
      if(danger>.5&&this.step%8===5)this.note(hz(root-12),1.1,.08,'triangle',time,180);
    }else{
      const pos=this.step%16;
      if(pos%4===0){this.drum('kick',time,.34+danger*.16);this.note(hz(root-12),.27,.14,'sawtooth',time,230+danger*350);}
      if(pos%8===4)this.drum('snare',time,.13+danger*.15);
      if(danger>.2||pos%2===0)this.drum('hat',time,.028+danger*.045);
      if(danger>.45||pos%2===0){const melody=[0,7,12,3,7,15,12,7];this.note(hz(root+12+melody[this.step%8]),.16+danger*.08,.065+danger*.055,'triangle',time,1300+danger*1900);}
    }
  }
  voice(source,filter,envelope,destination,time,duration){
    if(this.voices.size>=26){source.disconnect();filter?.disconnect();envelope.disconnect();return false;}
    source.connect(filter||envelope);if(filter)filter.connect(envelope);envelope.connect(destination);
    const voice={source,filter,envelope};this.voices.add(voice);
    source.onended=()=>{this.voices.delete(voice);source.disconnect();filter?.disconnect();envelope.disconnect();};
    source.start(time);source.stop(time+duration+.06);return true;
  }
  note(frequency,duration,gain,type='sine',when,cutoff=700,endFrequency){
    if(!this.ctx||!this.enabled||this.state.paused)return;
    const c=this.ctx,t=when??c.currentTime,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(frequency,t);if(endFrequency)o.frequency.exponentialRampToValueAtTime(Math.max(12,endFrequency),t+duration);
    f.type='lowpass';f.frequency.value=cutoff;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    this.voice(o,f,g,when===undefined?this.effects:this.music,t,duration);
  }
  noiseHit(duration,gain,cutoff,when,destination,type='lowpass'){
    if(!this.ctx||!this.enabled||this.state.paused)return;
    const c=this.ctx,t=when??c.currentTime,o=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    o.buffer=this.noise;f.type=type;f.frequency.value=cutoff;f.Q.value=.7;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    this.voice(o,f,g,destination||this.effects,t,duration);
  }
  drum(type,time,gain){
    if(type==='kick')this.note(115,.18,gain,'sine',time,500,38);
    else this.noiseHit(type==='snare'?.13:.035,gain,type==='snare'?1800:6500,time,this.music,type==='hat'?'highpass':'bandpass');
  }
  gun(){
    if(!this.ctx||this.ctx.currentTime-this.lastGun<.055)return;this.lastGun=this.ctx.currentTime;
    this.noiseHit(.16,.5,510);this.note(115,.17,.25,'sine',undefined,230,41);
  }
  torpedo(){this.noiseHit(.95,.48,340);this.note(160,.6,.3,'sine',undefined,280,34);}
  sonar(){this.note(620,.6,.08,'sine',undefined,850,540);}
  creak(){this.noiseHit(.85,.11,190);this.note(49,1.05,.065,'sawtooth',undefined,160,31);}
  impact(power=.6){const p=clamp(power,.08,1);this.noiseHit(.3+p*.55,.35+p*.65,this.kind==='sub'?460:1300);this.note(70,.25+p*.4,.2+p*.35,'sine',undefined,210,20);}
  dispose(){
    if(!this.ctx)return;for(const v of this.voices){try{v.source.stop();}catch{}}this.voices.clear();
    const closing=this.ctx.close?.();closing?.catch?.(()=>{});this.ctx=null;
  }
  get diagnostics(){return {kind:this.kind,started:!!this.ctx,enabled:this.enabled,activeVoices:this.voices.size,step:this.step};}
}

export const createSubAudio=()=>new CinematicAudio('sub');
export const createStormAudio=()=>new CinematicAudio('storm');

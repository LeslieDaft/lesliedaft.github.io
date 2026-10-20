import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubAudio,createStormAudio} from './cinematic.mjs';

class Param {
  constructor(){this.value=0;this.writes=[];}
  write(value,time){assert.ok(Number.isFinite(value)&&Number.isFinite(time),'Audio automation must remain finite');this.value=value;this.writes.push({value,time});return this;}
  setValueAtTime(v,t){return this.write(v,t);}
  setTargetAtTime(v,t){return this.write(v,t);}
  exponentialRampToValueAtTime(v,t){assert.ok(v>0);return this.write(v,t);}
}
class Node {
  constructor(ctx){this.ctx=ctx;for(const p of ['gain','frequency','detune','Q','delayTime','threshold','knee','ratio','attack','release'])this[p]=new Param();}
  connect(node){return node;}
  disconnect(){}
  start(time=0){assert.ok(Number.isFinite(time));this.ctx.sources.add(this);}
  stop(time=0){this.endAt=time;}
}
class AudioContext {
  static instances=0;
  constructor(){AudioContext.instances++;this.currentTime=0;this.sampleRate=8000;this.destination=new Node(this);this.sources=new Set();this.state='running';}
  createGain(){return new Node(this);}createDynamicsCompressor(){return new Node(this);}
  createBiquadFilter(){return new Node(this);}createOscillator(){return new Node(this);}
  createBufferSource(){return new Node(this);}createDelay(){return new Node(this);}
  createBuffer(_,length){const a=new Float32Array(length);return {getChannelData:()=>a};}
  resume(){return Promise.resolve();}
  advance(dt){this.currentTime+=dt;for(const source of this.sources)if(source.endAt<=this.currentTime){source.onended?.();this.sources.delete(source);}}
  close(){this.state='closed';for(const s of this.sources)s.onended?.();this.sources.clear();return Promise.resolve();}
}

test('sound starts only after the user gesture and repeated starts reuse one context',()=>{
  globalThis.AudioContext=AudioContext;
  const n=AudioContext.instances,rig=createSubAudio();assert.equal(AudioContext.instances,n);
  assert.equal(rig.start(),true);assert.equal(rig.start(),true);assert.equal(AudioContext.instances,n+1);rig.dispose();
});
test('storm danger increases engine/wind and score intensity while resource usage stays bounded',()=>{
  const rig=createStormAudio();rig.start();rig.update({speed:0,proximity:0,throttle:false});
  const calm={engine:rig.engine.gain.value,wind:rig.wind.gain.value,music:rig.music.gain.value};
  for(let i=0;i<1800;i++){
    rig.ctx.advance(1/6);rig.update({speed:55,throttle:true,proximity:1,intensity:1});
    if(i%3===0)rig.impact(.15);
    assert.ok(rig.diagnostics.activeVoices<=26,'One-shot sound sources must be capped');
    assert.ok(rig.ctx.sources.size<42,'Continuous beds plus temporary sounds must stay bounded');
  }
  assert.ok(rig.engine.gain.value>calm.engine*2);assert.ok(rig.wind.gain.value>calm.wind*10);assert.ok(rig.music.gain.value>calm.music);assert.ok(rig.diagnostics.step>100);rig.dispose();
});
test('submarine sounds are filtered and repeated gun/torpedo effects cannot leak voices',()=>{
  const rig=createSubAudio();rig.start();rig.update({speed:12,depth:500,danger:.8});
  assert.ok(rig.engineTone.filter.frequency.value<300);assert.ok(rig.windNoise.filter.frequency.value<500);
  for(let i=0;i<100;i++){rig.gun();rig.torpedo();}
  assert.ok(rig.diagnostics.activeVoices<=26);rig.ctx.advance(10);assert.equal(rig.diagnostics.activeVoices,0);rig.dispose();
});
test('pause and audio toggle mute the rig and stop musical scheduling',()=>{
  const rig=createStormAudio();rig.start();rig.ctx.advance(1);rig.update({speed:30,proximity:.8});
  rig.update({paused:true});const step=rig.step,count=rig.voices.size;
  rig.ctx.advance(.1);rig.update({paused:true});rig.gun();assert.equal(rig.master.gain.value,0);assert.equal(rig.step,step);assert.ok(rig.voices.size<=count);
  rig.setEnabled(false);rig.update({paused:false});assert.equal(rig.master.gain.value,0);
  rig.setEnabled(true);rig.update({paused:false});assert.ok(rig.master.gain.value>0);rig.dispose();
});
test('unsupported audio is a safe silent fallback',()=>{
  delete globalThis.AudioContext;const rig=createSubAudio();assert.equal(rig.start(),false);rig.update({speed:Infinity,danger:NaN});rig.gun();rig.torpedo();rig.sonar();rig.impact();rig.dispose();
});

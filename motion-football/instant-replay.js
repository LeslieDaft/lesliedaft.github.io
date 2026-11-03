// Bounded pose history, sampled at 15 Hz; interpolation keeps scrubbing smooth.
export class ReplayTape{
 constructor({hz=15,seconds=24}={}){this.hz=hz;this.seconds=seconds;this.frames=[];this.previous=[];this.key=null;}
 begin(key){if(key===this.key)return;if(this.frames.length>1)this.previous=this.frames;this.frames=[];this.key=key;}
 record(t,capture){if(!Number.isFinite(t))return;const last=this.frames.at(-1);if(last&&t<last.t-1e-4){if(this.frames.length>1)this.previous=this.frames;this.frames=[];}else if(last&&t-last.t<1/this.hz-1e-5)return;this.frames.push({t,pose:capture()});while(this.frames.length>2&&t-this.frames[0].t>this.seconds)this.frames.shift();}
 clip(){return this.frames.length>1?this.frames:this.previous;}
 static sample(frames,t){if(!frames.length)return null;let lo=0,hi=frames.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(frames[mid].t<=t)lo=mid;else hi=mid;}const a=frames[lo],b=frames[hi];return {a:a.pose,b:b.pose,u:Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t||1)))};}
}

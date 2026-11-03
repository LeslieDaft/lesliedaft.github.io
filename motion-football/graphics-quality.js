export function graphicsProfile(mode='high'){
 const school=mode==='school';return {mode:school?'school':'high',school,antialias:!school,segments:n=>school?Math.max(4,Math.round(n*.42)):n,pixelRatio:dpr=>school?Math.min(dpr,1)*.7:Math.min(dpr,2),crowdStride:school?6:1};
}
export function savedGraphics(){if(globalThis.motionFootballGraphics)return graphicsProfile(globalThis.motionFootballGraphics);try{return graphicsProfile(localStorage.getItem('motionFootballGraphics'));}catch{return graphicsProfile();}}

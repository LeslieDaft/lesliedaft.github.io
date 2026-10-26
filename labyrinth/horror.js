/* Presentation and one-press interaction helpers. No chase difficulty changes. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function lanternDim(distance,time){
  if(distance>=7)return 0;
  const proximity=clamp((7-distance)/6,0,1);
  // Broad irregular dips rather than rapid strobing.
  const dip=Math.pow(Math.max(0,Math.sin(time*4.1+Math.sin(time*1.3)*.8)),6);
  return proximity*(.08+dip*.48);
 }
 function capturePose(seconds){
  const t=clamp(seconds,0,3.8),reach=clamp(t/.85,0,1),pull=clamp((t-.75)/1.4,0,1),close=clamp((t-2.5)/.85,0,1);
  return {reach,pull,close,blackout:clamp((t-3.3)/.35,0,1),done:t>=3.8};
 }
 function pressEdge(down,repeat){return !down&&!repeat}
 const api={lanternDim,capturePose,pressEdge};
 root.LabyrinthHorror=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

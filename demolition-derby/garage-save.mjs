import {MODELS} from './physics.mjs';
export const DEFAULT_SAVE=Object.freeze({credits:0,wins:0,owned:['sedan'],model:'sedan',arena:'yard',armor:0,engine:0,low:false,sound:true});
const finiteInt=(v,max=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
export function normalizeSave(raw){
  const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const owned=Array.isArray(v.owned)?[...new Set(v.owned.filter(m=>Object.hasOwn(MODELS,m)))]:[];
  if(!owned.includes('sedan'))owned.unshift('sedan');
  return {credits:finiteInt(v.credits),wins:finiteInt(v.wins),owned,
    model:owned.includes(v.model)?v.model:'sedan',arena:['yard','industrial','speedway'].includes(v.arena)?v.arena:'yard',
    armor:finiteInt(v.armor,3),engine:finiteInt(v.engine,3),handling:finiteInt(v.handling,3),grille:finiteInt(v.grille,3),tourResults:Object.fromEntries(Object.entries(v.tourResults&&typeof v.tourResults==='object'?v.tourResults:{}).filter(([k,n])=>Number.isInteger(+k)&&+k>=0&&+k<12&&Number.isFinite(n)&&n>=0)),activeTour:v.activeTour&&Number.isInteger(v.activeTour.id)&&v.activeTour.id>=0&&v.activeTour.id<12?{id:v.activeTour.id,event:finiteInt(v.activeTour.event,5),points:finiteInt(v.activeTour.points,1000)}:null,low:v.low===true,sound:v.sound!==false};
}

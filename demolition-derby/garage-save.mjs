export const DEFAULT_SAVE=Object.freeze({credits:0,wins:0,owned:['sedan'],model:'sedan',arena:'yard',armor:0,engine:0,low:false,sound:true});
const finiteInt=(v,max=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
export function normalizeSave(raw){
  const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const owned=Array.isArray(v.owned)?[...new Set(v.owned.filter(m=>['sedan','muscle','truck'].includes(m)))]:[];
  if(!owned.includes('sedan'))owned.unshift('sedan');
  return {credits:finiteInt(v.credits),wins:finiteInt(v.wins),owned,
    model:owned.includes(v.model)?v.model:'sedan',arena:['yard','industrial','speedway'].includes(v.arena)?v.arena:'yard',
    armor:finiteInt(v.armor,3),engine:finiteInt(v.engine,3),low:v.low===true,sound:v.sound!==false};
}

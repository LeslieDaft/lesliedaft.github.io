import assert from 'node:assert/strict';
import { advanceReload, fillMagazine, canFire, normalizeArmory } from './armory.js';
const guns=[{mag:5},{mag:4},{mag:1}];
let state={playing:true,driving:false,cooldown:0,reloading:0,ammo:5,reserve:35};
for(let magazine=0;magazine<8;magazine++){
 for(let shot=0;shot<5;shot++){assert.equal(canFire(state),true,`magazine ${magazine+1} shot ${shot+1}`);state.ammo--;}
 assert.equal(canFire(state),false);
 if(!state.reserve)break;
 state.reloading=1.7;
 while(state.reloading>0)state.reloading=advanceReload(state.reloading,.037);
 assert.equal(state.reloading,0,'fractional frame countdown settles at zero');
 Object.assign(state,fillMagazine(state.ammo,state.reserve,5));
 assert.equal(canFire(state),true,'reload restores fire across repeated magazines');
}
assert.equal(state.reserve,0);assert.equal(state.ammo,0);
assert.deepEqual(fillMagazine(3,1,5),{ammo:4,reserve:0,rounds:1});
assert.deepEqual(fillMagazine(0,0,5),{ammo:0,reserve:0,rounds:0});
assert.equal(advanceReload(-.01,.016),0);
assert.deepEqual(normalizeArmory({gun:99,owned:[99],ammo:8,reserve:2},guns),{gun:0,owned:[0],ammo:5,reserve:5});
assert.deepEqual(normalizeArmory({gun:2,owned:[2],ammo:1,reserve:4},guns),{gun:2,owned:[0,2],ammo:1,reserve:4});
assert.equal(canFire({...state,ammo:1,driving:true}),false);
assert.equal(canFire({...state,ammo:1,playing:false}),false);
console.log('Armory: eight magazines, partial/empty reloads, weapon saves, and exact-zero timers passed.');

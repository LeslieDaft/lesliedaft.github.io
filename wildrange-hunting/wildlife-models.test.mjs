import assert from 'node:assert/strict';
import { specialCreature } from './wildlife-models.js';

const families=['elephant','lion','bear','rhino','hippo','buffalo','giraffe','zebra','crocodile','hyena','cheetah','rabbit','fox'];
for(const kind of families){
  const model=specialCreature({kind,color:'#8b8065',name:kind,scale:1.4},null);
  assert.equal(model.userData.family,kind);
  assert.equal(model.userData.legs.length,4);
  assert.equal(model.userData.rig.knees.length,4);
  assert.ok(model.userData.rig.head&&model.userData.rig.tail,`${kind} has head and tail joints`);
  assert.equal(model.scale.x,1.4);
  for(const leg of model.userData.legs)assert.ok(leg.userData.restY>0,`${kind}: animated legs retain authored height`);
  const {min,max}=model.userData.damageBounds;
  assert.ok(max.x>min.x&&max.y>min.y&&max.z>min.z,`${kind}: positive hit bounds`);
  let meshes=0;
  model.traverse(o=>{
    if(!o.isMesh)return;meshes++;
    const position=o.geometry.getAttribute('position');
    assert.ok(position&&position.count>0);
    for(const v of position.array)assert.ok(Number.isFinite(v),`${kind}: finite geometry`);
  });
  assert.ok(meshes>20,`${kind}: detailed anatomy`);
}
assert.equal(specialCreature({kind:'deer'},null),null,'existing deer uses its retained model');
const elephant=specialCreature({kind:'elephant',color:'#888888',scale:1},null);
const croc=specialCreature({kind:'crocodile',color:'#667755',scale:1},null);
const giraffe=specialCreature({kind:'giraffe',color:'#bb9966',scale:1},null);
assert.ok(giraffe.userData.damageBounds.max.y>3.4,'giraffe neck creates a tall silhouette');
assert.ok(croc.userData.damageBounds.max.y<.8,'crocodile stays close to the ground');
assert.ok(elephant.userData.damageBounds.max.x>.9,'elephant ears extend beyond its body');
console.log(`Wildlife anatomy: ${families.length} families built, rigged, and checked.`);

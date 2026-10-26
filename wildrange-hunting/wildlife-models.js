import * as T from './vendor/three.module.js';

// Each family has its own silhouette and joints, rather than a recolored deer.
const supported = new Set(['elephant','lion','bear','rhino','hippo','buffalo','giraffe','zebra','crocodile','hyena','cheetah','rabbit','fox']);
const sphere = new T.SphereGeometry(1, 20, 14);
export function specialCreature(s, furTexture) {
  const kind = s.kind;
  if (!supported.has(kind)) return null;
  const g = new T.Group(), legs = [], knees = [];
  const skin = ['elephant','rhino','hippo','crocodile'].includes(kind);
  const coat = new T.MeshStandardMaterial({color:s.color, map:skin?null:furTexture, roughness:1});
  const dark = new T.MeshStandardMaterial({color:'#231e19',roughness:.95});
  const pale = new T.MeshStandardMaterial({color:kind==='fox'?'#f1e4c6':'#d8cbb0',roughness:1});
  const ivory = new T.MeshStandardMaterial({color:'#e6d7b6',roughness:.78});
  const pink = new T.MeshStandardMaterial({color:'#9f7069',roughness:1});
  const head = new T.Group();g.add(head);
  function ell(parent, material, x,y,z, sx,sy,sz) {
    const m = new T.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
    m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function link(parent, material, a,b, r0,r1=r0) {
    const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
    const m=new T.Mesh(new T.CylinderGeometry(r1,r0,delta.length(),12),material);
    m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function curve(parent,material,points,radius=.055) {
    const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,radius,8,false),material);
    m.castShadow=true;parent.add(m);return m;
  }
  function eyePair(y,z,width=.24,rad=.035) {
    for(const side of [-1,1]) {
      ell(head,dark,side*width,y,z,rad,rad,rad*.65);
      ell(head,pale,side*(width+.008),y+.008,z-.012,rad*.22,rad*.22,rad*.2);
    }
  }
  function ears(y,z,width=.27,tall=.21,round=false) {
    for(const side of [-1,1]) {
      const ear=round?ell(head,coat,side*width,y,z,.16,tall,.09):new T.Mesh(new T.ConeGeometry(.145,tall*2,12),coat);
      if(!round){ear.position.set(side*width,y,z);ear.scale.z=.5;head.add(ear);ear.castShadow=true;}
      ear.rotation.z=-side*.32;
      ell(head,pink,side*width,y,z-.065,.075,tall*.62,.025);
    }
  }
  function leg(x,z,y,length,radius,foot=.14,hoof=false) {
    const pivot=new T.Group();pivot.position.set(x,y,z);pivot.userData.restY=y;g.add(pivot);
    link(pivot,coat,[0,0,0],[0,-length*.5,.015],radius,radius*.72);
    const knee=new T.Group();knee.position.set(0,-length*.48,.015);pivot.add(knee);
    link(knee,coat,[0,0,0],[0,-length*.47,.035],radius*.7,radius*.52);
    ell(knee,hoof?dark:coat,0,-length*.47,.01,foot,.09,foot*1.35);
    if(!hoof)for(let i=-1;i<=1;i++)ell(knee,ivory,i*foot*.45,-length*.48,-foot*.95,.017,.018,.045);
    legs.push(pivot);knees.push(knee);
  }
  function quadruped(y,length,radius,width=.36,front=-.64,rear=.66,foot=.14,hoof=false) {
    for(const x of [-width,width])for(const z of [front,rear])leg(x,z,y,length,radius,foot,hoof);
  }
  let tail;
  if(kind==='elephant') {
    ell(g,coat,0,1.6,.05,.66,.78,1.1);
    ell(g,coat,0,1.93,-.65,.53,.68,.55);
    head.position.set(0,2.02,-.91);
    ell(head,coat,0,0,-.06,.43,.56,.43);
    for(const side of [-1,1]){
      const ear=ell(head,coat,side*.5,-.05,.04,.43,.63,.11);ear.rotation.y=-side*.28;
      curve(head,ivory,[[side*.22,-.26,-.29],[side*.27,-.42,-.58],[side*.33,-.3,-.88]],.065);
    }
    curve(head,coat,[[0,-.13,-.38],[0,-.57,-.5],[0,-1.07,-.56],[0,-1.38,-.76],[0,-1.28,-.95]],.12);
    eyePair(.09,-.34,.3,.033);quadruped(1.44,1.42,.2,.42,-.65,.68,.23);
    tail=curve(g,coat,[[0,1.65,1.03],[0,1.16,1.17],[0,.85,1.12]],.034);
    ell(g,dark,0,.82,1.12,.07,.13,.07);
  } else if(kind==='rhino') {
    ell(g,coat,0,1.18,.13,.65,.64,1.03);ell(g,coat,0,1.43,-.48,.6,.57,.57);
    head.position.set(0,1.24,-.97);ell(head,coat,0,0,-.16,.38,.36,.59);
    ell(head,coat,0,-.09,-.57,.31,.23,.28);ears(.42,.07,.31,.18,true);eyePair(.1,-.33,.33,.034);
    const horn=new T.Mesh(new T.ConeGeometry(.16,.62,16),ivory);horn.position.set(0,.4,-.57);horn.rotation.x=-.3;head.add(horn);
    const horn2=new T.Mesh(new T.ConeGeometry(.11,.28,14),ivory);horn2.position.set(0,.35,-.2);head.add(horn2);
    quadruped(1.02,1,.2,.43,-.63,.65,.2,true);tail=curve(g,coat,[[0,1.35,1.05],[0,.94,1.25]],.04);
    for(const z of [-.4,.4])link(g,coat,[-.57,1.37,z],[.57,1.37,z],.045);
  } else if(kind==='hippo') {
    ell(g,coat,0,.96,.13,.72,.59,1.05);ell(g,coat,0,1.08,-.56,.6,.51,.58);
    head.position.set(0,1.03,-.96);ell(head,coat,0,0,-.23,.5,.36,.55);
    ell(head,coat,0,-.08,-.6,.52,.24,.32);ell(head,dark,0,-.12,-.69,.49,.019,.24);
    for(const side of [-1,1]){
      ell(head,coat,side*.39,.29,-.22,.12,.14,.12);ell(head,dark,side*.4,.32,-.32,.039,.037,.025);
      ell(head,coat,side*.4,.4,.08,.1,.14,.08);ell(head,pink,side*.4,.42,.035,.05,.08,.02);
      ell(head,dark,side*.21,.13,-.84,.054,.03,.025);
      const tusk=new T.Mesh(new T.ConeGeometry(.055,.16,10),ivory);tusk.position.set(side*.33,-.02,-.8);head.add(tusk);
    }
    quadruped(.66,.63,.19,.43,-.57,.68,.22);
    tail=curve(g,coat,[[0,1.03,1.13],[0,.8,1.3],[0,.65,1.27]],.035);
  } else if(kind==='buffalo') {
    ell(g,coat,0,1.2,.1,.57,.58,.97);ell(g,coat,0,1.5,-.49,.59,.54,.6);
    head.position.set(0,1.35,-.99);ell(head,coat,0,0,-.12,.39,.38,.41);
    ell(head,dark,0,-.18,-.47,.31,.18,.21);ears(.14,.08,.45,.15,true);eyePair(.06,-.4,.28,.026);
    const hornMaterial=new T.MeshStandardMaterial({color:'#7e7863',roughness:1});
    ell(head,hornMaterial,0,.3,-.1,.37,.13,.22);
    for(const side of [-1,1])curve(head,hornMaterial,[[side*.19,.34,-.1],[side*.46,.25,-.12],[side*.7,.13,-.16],[side*.83,.3,-.2],[side*.77,.57,-.22]],.075);
    quadruped(1.04,1.01,.14,.37,-.63,.65,.15,true);
    tail=curve(g,coat,[[0,1.35,1.03],[0,.86,1.26],[0,.61,1.24]],.032);ell(g,dark,0,.6,1.24,.065,.14,.07);
  } else if(kind==='bear') {
    const polar=/polar/i.test(s.name);ell(g,coat,0,1.14,.06,.6,.63,.96);
    ell(g,coat,0,1.48,-.52,.57,.57,.54);head.position.set(0,1.45,-.98);
    ell(head,coat,0,0,-.07,.37,.36,.4);ell(head,polar?coat:pale,0,-.09,-.39,.25,.2,.3);
    ell(head,dark,0,-.03,-.64,.13,.09,.08);ears(.32,.01,.27,.14,true);eyePair(.09,-.35,.25,.026);
    quadruped(1.03,1.01,.2,.39,-.63,.62,.21);
    tail=ell(g,coat,0,1.1,.98,.1,.1,.13);
  } else if(kind==='giraffe') {
    ell(g,coat,0,1.65,.15,.41,.52,.83);
    link(g,coat,[0,1.65,-.45],[0,2.93,-.72],.26,.18);
    head.position.set(0,3.05,-.85);ell(head,coat,0,0,-.17,.2,.22,.41);ell(head,pale,0,-.05,-.51,.17,.13,.17);
    ears(.14,.02,.28,.16);eyePair(.08,-.28,.185,.027);
    for(const side of [-1,1]){link(head,coat,[side*.1,.13,.04],[side*.11,.43,.05],.04);ell(head,dark,side*.11,.44,.05,.05,.06,.05);}
    quadruped(1.53,1.5,.085,.28,-.48,.69,.1,true);
    tail=curve(g,coat,[[0,1.7,.96],[0,1.15,1.14],[0,.9,1.16]],.025);ell(g,dark,0,.87,1.16,.06,.13,.06);
    for(const side of [-1,1])for(let j=0;j<15;j++){
      const z=-.53+(j%5)*.29,y=1.45+Math.floor(j/5)*.19;
      ell(g,dark,side*(.36+Math.sin(j)*.02),y,z,.022,.09,.11);
    }
    for(let j=0;j<6;j++)ell(g,dark,j%2?.13:-.13,1.95+j*.14,-.55-j*.022,.06,.07,.065);
  } else if(kind==='zebra') {
    ell(g,pale,0,1.27,.08,.4,.5,.87);link(g,pale,[0,1.4,-.5],[0,1.97,-.85],.25,.19);
    head.position.set(0,2,-.99);ell(head,pale,0,0,-.13,.21,.3,.35);ell(head,dark,0,-.18,-.43,.19,.14,.18);
    ears(.36,.02,.17,.25);eyePair(.02,-.27,.2,.024);quadruped(1.16,1.13,.09,.27,-.5,.62,.11,true);
    tail=curve(g,dark,[[0,1.36,.89],[0,.9,1.18],[0,.65,1.16]],.045);
    // Narrow segmented stripes follow the body and continue onto the neck.
    for(let j=0;j<12;j++){
      const z=-.67+j*.13,w=.4*Math.sqrt(Math.max(.12,1-((z-.08)/.94)**2));
      for(const side of [-1,1])curve(g,dark,[[side*w*.3,1.69,z],[side*w*.9,1.52,z+.02],[side*(w+.008),1.27,z-.01],[side*w*.83,1.02,z+.025]],.032);
    }
    for(let j=0;j<6;j++)curve(g,dark,[[-.19,1.6+j*.07,-.56-j*.05],[0,1.77+j*.06,-.48-j*.055],[.19,1.6+j*.07,-.56-j*.05]],.025);
    for(let j=0;j<9;j++)ell(g,dark,0,1.71+j*.045,-.45-j*.045,.065,.1,.05);
  } else if(kind==='crocodile') {
    ell(g,coat,0,.43,.16,.4,.25,1.02);head.position.set(0,.42,-.92);
    ell(head,coat,0,0,-.18,.33,.17,.56);ell(head,coat,0,-.07,-.62,.28,.08,.38);
    ell(head,dark,0,-.03,-.75,.25,.018,.32);eyePair(.15,-.12,.25,.04);
    for(const side of [-1,1])for(let j=0;j<9;j++){
      const tooth=new T.Mesh(new T.ConeGeometry(.028,.075,7),ivory);tooth.position.set(side*.255,-.025,-.42-j*.07);tooth.rotation.z=Math.PI;head.add(tooth);
    }
    quadruped(.31,.27,.09,.44,-.6,.65,.11);
    tail=curve(g,coat,[[0,.44,.83],[0,.38,1.3],[0,.29,1.84],[0,.22,2.32]],.16);
    for(let j=0;j<15;j++)for(const x of [-.13,.13]){
      const scute=new T.Mesh(new T.ConeGeometry(.075,.12,4),coat);scute.position.set(x,.66,-.6+j*.105);g.add(scute);
    }
  } else if(kind==='rabbit') {
    ell(g,coat,0,.44,.12,.29,.35,.42);ell(g,coat,0,.58,.36,.3,.36,.32);
    head.position.set(0,.68,-.32);ell(head,coat,0,0,0,.23,.23,.23);ell(head,pale,0,-.09,-.19,.12,.1,.12);
    ears(.44,.03,.13,.43);eyePair(.03,-.14,.18,.032);ell(head,pink,0,-.06,-.29,.035,.026,.026);
    quadruped(.33,.3,.075,.2,-.29,.36,.12);tail=ell(g,pale,0,.45,.57,.13,.13,.13);
  } else {
    const lion=kind==='lion',fox=kind==='fox',hyena=kind==='hyena',cheetah=kind==='cheetah';
    const y=fox?.82:hyena?1.05:1.08;
    ell(g,coat,0,y,.04,fox?.27:hyena?.36:.38,fox?.3:.4,fox?.76:.91);
    if(hyena)ell(g,coat,0,1.34,-.52,.37,.43,.4);
    head.position.set(0,y+.23,-.91);ell(head,coat,0,0,-.07,fox?.21:.29,fox?.23:.29,fox?.29:.33);
    ell(head,lion?pale:coat,0,-.08,fox?-.4:-.3,fox?.13:.21,.13,fox?.26:.2);
    ell(head,dark,0,-.045,fox?-.6:-.46,fox?.055:.08,.045,.04);
    ears(.27,.015,fox?.2:.235,fox?.26:hyena?.2:.15,!fox);eyePair(.05,fox?-.27:-.29,fox?.185:.23,.028);
    quadruped(y-.12,y-.12,fox?.065:lion?.115:.085,fox?.22:.29,-.57,.65,fox?.09:lion?.16:.115);
    const tailPoints=fox?[[0,.91,.71],[0,.77,1.14],[0,.57,1.5],[0,.4,1.63]]:[[0,y+.1,.85],[.1,y-.03,1.18],[.23,y-.15,1.57],[.2,y+.04,1.86]];
    tail=curve(g,coat,tailPoints,fox?.135:hyena?.065:.04);
    if(fox)ell(g,pale,0,.43,1.56,.1,.12,.17);
    if(lion){
      const mane=new T.MeshStandardMaterial({color:'#765035',map:furTexture,roughness:1});
      for(let j=0;j<13;j++){const a=j/13*Math.PI*2;ell(head,mane,Math.cos(a)*.29,Math.sin(a)*.32,.1,.19,.21,.24);}
      ell(g,dark,.2,y+.04,1.86,.075,.07,.12);
    }
    if(cheetah||hyena)for(const side of [-1,1])for(let j=0;j<29;j++){
      const z=-.69+(j%8)*.2,oy=(Math.floor(j/8)-1.2)*.14;
      ell(g,dark,side*(.355-Math.abs(oy)*.14),y+oy,z,.013,hyena?.043:.025,hyena?.047:.027);
    }
    if(cheetah)for(const side of [-1,1])curve(head,dark,[[side*.21,.03,-.3],[side*.17,-.08,-.35],[side*.15,-.16,-.31]],.012);
    if(fox)ell(g,pale,0,.72,-.49,.22,.23,.22);
  }
  // Curve coordinates are authored in animal space; give the tail a local pivot
  // before the animation rotates it, so it swishes rather than orbiting the body.
  if(tail?.geometry?.type==='TubeGeometry'){
    tail.geometry.computeBoundingBox();const center=tail.geometry.boundingBox.getCenter(new T.Vector3());
    tail.geometry.translate(-center.x,-center.y,-center.z);tail.position.copy(center);
  }
  g.userData.legs=legs;g.userData.rig={head,tail,knees};g.userData.family=kind;
  g.scale.setScalar(s.scale??1);g.updateMatrixWorld(true);
  // Normalized bounds let the hit grid fit short crocodiles and towering giraffes alike.
  const bounds=new T.Box3().setFromObject(g);
  g.userData.damageBounds={min:bounds.min.clone().divideScalar(s.scale??1),max:bounds.max.clone().divideScalar(s.scale??1)};
  return g;
}

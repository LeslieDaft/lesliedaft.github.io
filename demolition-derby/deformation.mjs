const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Stable, location-based crush field in vehicle-local space. Every offset is
// bounded by chassis dimensions; irregularity adds creases without runaway verts.
export function deformPoint(x,y,z,offset,halfWidth,halfLength,damage,index){
  const wx=x+offset.x,wz=z+offset.z;
  const front=clamp((wz/halfLength-.12)/.88,0,1)*(damage.front||0);
  const rear=clamp((-wz/halfLength-.12)/.88,0,1)*(damage.rear||0);
  const left=clamp((-wx/halfWidth-.15)/.85,0,1)*(damage.left||0);
  const right=clamp((wx/halfWidth-.15)/.85,0,1)*(damage.right||0);
  const total=front+rear+left+right;
  const noise=Math.sin(index*19.43+offset.z*7)*Math.cos(index*5.36);
  return [x+left*(.32+noise*.09)-right*(.32+noise*.09),
    y+total*(noise*.14-.055),z-front*(.65+noise*.13)+rear*(.58+noise*.13)];
}

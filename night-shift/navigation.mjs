// Half-metre ground navigation respects the same barriers as the player.
export function findPath(start,goal,blocked){
 const scale=2,sx=Math.round(start.x*scale),sz=Math.round(start.z*scale);let gx=Math.round(goal.x*scale),gz=Math.round(goal.z*scale);
 if(blocked(gx/scale,gz/scale)){let found=false;for(let r=1;r<=4&&!found;r++)for(let dx=-r;dx<=r&&!found;dx++)for(let dz=-r;dz<=r;dz++)if(!blocked((gx+dx)/scale,(gz+dz)/scale)){gx+=dx;gz+=dz;found=true;break;}if(!found)return [];}
 const minX=Math.max(-70,Math.min(sx,gx)-20),maxX=Math.min(70,Math.max(sx,gx)+20),minZ=Math.max(-40,Math.min(sz,gz)-20),maxZ=Math.min(90,Math.max(sz,gz)+20),key=(x,z)=>x+','+z;
 const open=[],costs=new Map(),parents=new Map();function push(n){open.push(n);let i=open.length-1;while(i){const p=(i-1)>>1;if(open[p].f<=n.f)break;open[i]=open[p];i=p;open[i]=n;}}function pop(){const top=open[0],last=open.pop();if(open.length){open[0]=last;let i=0;while(true){let child=i*2+1;if(child>=open.length)break;if(child+1<open.length&&open[child+1].f<open[child].f)child++;if(open[i].f<=open[child].f)break;[open[i],open[child]]=[open[child],open[i]];i=child;}}return top;}
 push({x:sx,z:sz,g:0,f:Math.abs(gx-sx)+Math.abs(gz-sz)});costs.set(key(sx,sz),0);let loops=0;
 while(open.length&&loops++<10000){const c=pop(),ck=key(c.x,c.z);if(c.g!==costs.get(ck))continue;if(c.x===gx&&c.z===gz){const path=[];let n=c;while(n){path.push({x:n.x/scale,z:n.z/scale});n=parents.get(key(n.x,n.z));}return path.reverse().slice(1);}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=c.x+dx,z=c.z+dz,k=key(x,z),g=c.g+1;if(x<minX||x>maxX||z<minZ||z>maxZ||g>=(costs.get(k)??Infinity)||blocked(x/scale,z/scale))continue;costs.set(k,g);parents.set(k,c);push({x,z,g,f:g+Math.abs(gx-x)+Math.abs(gz-z)});}
 }
 return [];
}

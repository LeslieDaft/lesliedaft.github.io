// One damage roll per frightened visitor, independent of animation frame rate.
export function newGlass(){return {cracks:0,shattered:false};}
export function panicStrike(glass,visitor,random=Math.random){
 if(visitor.struck||glass.shattered)return {rolled:false,cracked:false,shattered:glass.shattered};
 visitor.struck=true;const cracked=random()<1/3;
 if(cracked){glass.cracks=Math.min(3,glass.cracks+1);glass.shattered=glass.cracks===3;}
 return {rolled:true,cracked,shattered:glass.shattered};
}
export function clearSegment(a,b,colliders,{doorOpen=false,shattered=false,ignoreDoor=false,margin=0}={}){
 const dx=b.x-a.x,dz=b.z-a.z;
 for(const c of colliders){if(c.door&&(ignoreDoor||doorOpen||shattered))continue;
  let near=0,far=1;
  for(const [v,d,lo,hi]of [[a.x,dx,c.x-c.w-margin,c.x+c.w+margin],[a.z,dz,c.z-c.d-margin,c.z+c.d+margin]]){
   if(Math.abs(d)<1e-8){if(v<lo||v>hi){near=2;break;}}
   else{let x=(lo-v)/d,y=(hi-v)/d;if(x>y)[x,y]=[y,x];near=Math.max(near,x);far=Math.min(far,y);if(near>far)break;}
  }
  if(near<=far&&far>.025&&near<.975)return false;
 }
 return true;
}
export function canInteract(player,target,colliders,options={}){
 return Math.hypot(player.x-target.pos.x,player.z-target.pos.z)<=1.8&&(!target.outside||player.x<-8.4)&&clearSegment(player,target.pos,colliders,{...options,ignoreDoor:target.door===true});
}

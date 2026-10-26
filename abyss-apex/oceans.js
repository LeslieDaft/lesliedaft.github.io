// Travel distances are laid out from the arrival point, using the hunter's
// unboosted speed. Reaching a beacon really requires swimming across the water.
export const OCEANS = [
 {name:'Mini Ocean',color:0x123f49,fog:.017,ceiling:150,extent:900,titans:[7,22,23],caption:'Juvenile reef · titan range begins at Megalodon'},
 {name:'Normal Ocean',color:0x0b344c,fog:.0016,ceiling:700,extent:5000,titans:[7,22,23,24],caption:'Megalodon → Giant squid'},
 {name:'Giant Ocean',color:0x091d37,fog:.00048,ceiling:2200,extent:14000,titans:[24,25,26,27],caption:'Giant squid → Abyssal leviathan'},
 {name:'Mythical Ocean',color:0x160f2d,fog:.00012,ceiling:7000,extent:42000,titans:[28,29,30,31,32],caption:'Giant sea serpent → Moby Dick'}
];
export const cruiseSpeed=(size,speed=1)=>5*Math.pow(size/.65,.82)*speed;
export function routesFor(index,origin,speed){
 const distance=Math.max(100,speed*45),routes=[];
 if(index>0)routes.push({to:index-1,x:origin.x-distance*.82,z:origin.z-distance*.572,arrival:origin.y});
 if(index<OCEANS.length-1)routes.push({to:index+1,x:origin.x+distance,z:origin.z,arrival:origin.y});
 return routes;
}
export function routeInfo(route,pos,heading,speed){
 const dx=route.x-pos.x,dz=route.z-pos.z,distance=Math.hypot(dx,dz);
 const bearing=Math.atan2(-dz,dx),angle=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));
 return {distance,angle,seconds:distance/Math.max(.01,speed)};
}
export function reachedRoute(route,pos,size){return Math.hypot(route.x-pos.x,route.z-pos.z)<Math.max(4,size*.5)}

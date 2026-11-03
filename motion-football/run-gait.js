const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// A full stride has two support periods separated by short flight periods.
export function runGait(distance,speed,turn=0){
 const weight=clamp(Math.abs(speed)/8.7,0,1),cadence=2.5,phase=distance/8.7*cadence,cycle=((phase%1)+1)%1;
 const half=cycle% .5,air=half>.40?Math.sin((half-.40)/.10*Math.PI):0,angle=phase*Math.PI*2;
 return {weight,cadence,phase,angle,flight:air*weight,bob:(.018*Math.cos(angle*2)+.055*air)*weight,lean:.04+.11*weight,hipYaw:.045*Math.sin(angle)*weight,hipRoll:.035*Math.sin(angle)*weight-clamp(turn*speed*.025,-.16,.16),shoulderYaw:-.10*Math.sin(angle)*weight,shoulderRoll:-.025*Math.sin(angle)*weight-clamp(turn*speed*.035,-.20,.20)};
}

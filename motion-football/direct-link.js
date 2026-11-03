// Complete, independently decodable poses: a dropped packet never holds up a newer one.
export function packPose(snapshot,sequence,slot){
 const rigs=snapshot.rigs||[],meta={...snapshot,wireSequence:sequence,wireSlot:slot,rigs:rigs.map(r=>({visible:r.visible,count:r.bones.length}))};
 const header=new TextEncoder().encode(JSON.stringify(meta)),count=rigs.reduce((n,r)=>n+r.bones.length*10,0),offset=4+header.length+(header.length%2),buffer=new ArrayBuffer(offset+count*2),view=new DataView(buffer);
 view.setUint32(0,header.length);new Uint8Array(buffer,4,header.length).set(header);let at=offset;
 for(const rig of rigs)for(let b=0;b<rig.bones.length;b++)for(let j=0;j<10;j++){const scale=j<3?(b===0?100:1000):j<7?32767:1000;view.setInt16(at,Math.max(-32767,Math.min(32767,Math.round(rig.bones[b][j]*scale))));at+=2;}
 return buffer;
}
export function unpackPose(buffer){const view=new DataView(buffer),length=view.getUint32(0);if(length>buffer.byteLength-4)throw Error('Invalid pose');const snapshot=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,length)));let at=4+length+(length%2);for(const rig of snapshot.rigs||[]){rig.bones=[];if(rig.count>100)throw Error('Invalid rig');for(let b=0;b<rig.count;b++){const bone=[];for(let j=0;j<10;j++){const scale=j<3?(b===0?100:1000):j<7?32767:1000;bone.push(view.getInt16(at)/scale);at+=2;}rig.bones.push(bone);}delete rig.count;}return snapshot;}
export class DirectLink{
 constructor(slot,sendSignal,receive){Object.assign(this,{slot,sendSignal,receive,lastSent:0,sequence:0,lastReceived:0,signalVersion:0});if(typeof RTCPeerConnection==='undefined')return;
  this.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}]});this.pc.ondatachannel=e=>this.attach(e.channel);
  this.pc.onicecandidate=()=>{clearTimeout(this.signalTimer);this.signalTimer=setTimeout(()=>this.publish(),200);};
  if(slot===0){this.attach(this.pc.createDataChannel('poses',{ordered:false,maxRetransmits:0}));this.start().catch(()=>{});}
 }
 get ready(){return this.channel?.readyState==='open'&&!['disconnected','failed','closed'].includes(this.pc?.connectionState)}
 attach(channel){this.channel=channel;channel.binaryType='arraybuffer';channel.onmessage=e=>{try{const packet=typeof e.data==='string'?JSON.parse(e.data):unpackPose(e.data);if(packet.wireSlot===this.slot||packet.wireSequence<=this.lastReceived)return;this.lastReceived=packet.wireSequence;this.receive(packet);}catch{}};}
 async start(){await this.pc.setLocalDescription(await this.pc.createOffer());await this.publish();}
 async publish(){if(!this.pc?.localDescription||this.closed)return;try{await this.sendSignal({version:++this.signalVersion,description:this.pc.localDescription.toJSON()});}catch{}}
 async accept(signal){if(!this.pc||!signal?.description||this.closed||this.accepting)return;if(signal.version<=this.remoteVersion)return;this.accepting=true;try{if(!this.pc.remoteDescription){await this.pc.setRemoteDescription(signal.description);if(this.slot===1){await this.pc.setLocalDescription(await this.pc.createAnswer());await this.publish();}}else{const lines=signal.description.sdp.split('\r\n').filter(l=>l.startsWith('a=candidate:'));for(const line of lines)try{await this.pc.addIceCandidate({candidate:line.slice(2),sdpMid:'0',sdpMLineIndex:0});}catch{}}this.remoteVersion=signal.version;}catch{}finally{this.accepting=false;}}
 sendInput(input,now){if(!this.ready||now-(this.lastInput||0)<50||this.channel.bufferedAmount>65536)return;this.lastInput=now;try{this.channel.send(JSON.stringify({...input,kind:'input',wireSlot:this.slot,wireSequence:++this.sequence}));}catch{}}
 send(snapshot,now){if(!this.ready||now-this.lastSent<50||this.channel.bufferedAmount>65536)return;this.lastSent=now;try{this.channel.send(packPose(snapshot,++this.sequence,this.slot));}catch{}}
 close(){this.closed=true;clearTimeout(this.signalTimer);this.channel?.close();this.pc?.close();}
}

export function compactPose(snapshot){const bytes=new Uint8Array(packPose(snapshot,0,0));let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return {match:snapshot.match,packed:btoa(binary)};}
export function expandPose(snapshot){if(!snapshot?.packed)return snapshot;const binary=atob(snapshot.packed),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return unpackPose(bytes.buffer);}

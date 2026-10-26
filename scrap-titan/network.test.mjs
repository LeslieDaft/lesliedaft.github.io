import test from 'node:test';
import assert from 'node:assert/strict';
import { roomCode, validCode, validPose, validShot, lerpAngle, MultiplayerRoom, MAX_PLAYERS } from './network.mjs';
import { fresh } from './model.mjs';
const pose = () => validPose({ x:0,z:67,angle:0,aim:0,hp:290,equipped:fresh().equipped,active:true });
test('room codes accept pasted spaces and reject non-room IDs',()=>{assert.equal(roomCode(' abcd 23 '),'ABCD23');assert.ok(validCode('ABCD23'));assert.equal(validCode('<script>'),false);assert.equal(MAX_PLAYERS,4);});
test('remote poses reject nonfinite and off-map positions, sanitize loadouts',()=>{assert.equal(validPose({...pose(),x:NaN}),null);assert.equal(validPose({...pose(),x:9000}),null);assert.equal(validPose({...pose(),equipped:{left:'reactive',legs:'rocket'}}).equipped.left,null);assert.equal(validPose({...pose(),hp:Infinity}).hp,290);});
test('host derives weapon damage and enforces loadout, origin and cadence',()=>{const p=pose(),raw={slot:'left',x:0,z:60,angle:0,damage:99999};assert.equal(validShot(raw,p,-Infinity,1).damage,36);assert.equal(validShot(raw,p,.9,1),null);assert.equal(validShot({...raw,x:100},p,-Infinity,1),null);assert.equal(validShot({...raw,slot:'shoulder'},p,-Infinity,1),null);assert.equal(validShot(raw,{...p,active:false},-Infinity,1),null);});
test('interpolation crosses angle wrap by the short route',()=>{assert.ok(Math.abs(lerpAngle(Math.PI-.1,-Math.PI+.1,.5)-Math.PI)<1e-8);});
test('host broadcasts and targeted loot only reach chosen open peers',()=>{const room=new MultiplayerRoom(),received=[];room.role='host';for(const id of ['a','b'])room.connections.set(id,{open:true,dataChannel:{bufferedAmount:0},send:packet=>received.push({id,packet})});room.send({t:'reward',worth:35},'b');assert.deepEqual(received.map(x=>x.id),['b']);assert.equal(received[0].packet.v,1);room.send({t:'world'});assert.equal(received.length,3);});

test('room transport handshakes, carries bidirectional packets, caps room, and returns solo on host loss', async()=>{
  const { EventEmitter } = await import('node:events');
  const registry=new Map();let sequence=0;
  class Wire extends EventEmitter {
    constructor(id,metadata){super();this.peer=id;this.metadata=metadata;this.open=false;this.dataChannel={bufferedAmount:0};}
    send(packet){if(this.open)queueMicrotask(()=>this.other.open&&this.other.emit('data',structuredClone(packet)));}
    close(){if(!this.open)return;this.open=false;this.emit('close');if(this.other.open){this.other.open=false;this.other.emit('close');}}
  }
  class FakePeer extends EventEmitter {
    constructor(id){super();this.id=id||'pilot-'+ ++sequence;this.wires=[];registry.set(this.id,this);queueMicrotask(()=>this.emit('open',this.id));}
    connect(id,options){const out=new Wire(id,options.metadata),target=registry.get(id);this.wires.push(out);queueMicrotask(()=>{if(!target){this.emit('error',{type:'peer-unavailable'});return;}const incoming=new Wire(this.id,options.metadata);out.other=incoming;incoming.other=out;target.wires.push(incoming);target.emit('connection',incoming);out.open=incoming.open=true;out.emit('open');incoming.emit('open');});return out;}
    destroy(){this.destroyed=true;registry.delete(this.id);for(const w of this.wires)w.close();}
  }
  const previous=globalThis.Peer;globalThis.Peer=FakePeer;
  const rooms=[],messages=[],statuses=[];const settle=()=>new Promise(resolve=>setImmediate(resolve));
  try{
    const host=new MultiplayerRoom({message:(packet,id)=>messages.push({at:'host',packet,id})});rooms.push(host);host.create();await settle();assert.equal(host.role,'host');assert.ok(validCode(host.code));
    for(let i=0;i<3;i++){const guest=new MultiplayerRoom({message:packet=>messages.push({at:'guest'+i,packet})});rooms.push(guest);guest.join(host.code);await settle();assert.equal(guest.role,'guest');}
    assert.equal(host.connections.size,3);rooms[1].send({t:'pose',pose:pose()});await settle();assert.equal(messages.at(-1).at,'host');assert.equal(messages.at(-1).packet.t,'pose');host.send({t:'world',sequence:5});await settle();assert.equal(messages.filter(m=>m.packet.t==='world').length,3);
    const overflow=new MultiplayerRoom({status:message=>statuses.push(message)});rooms.push(overflow);overflow.join(host.code);await settle();assert.equal(overflow.role,'offline');assert.ok(statuses.some(message=>message.includes('full')));
    host.leave();await settle();assert.equal(rooms[1].role,'offline');assert.equal(rooms[2].role,'offline');assert.equal(rooms[3].role,'offline');
  } finally {for(const room of rooms)room.cleanup();globalThis.Peer=previous;}
});

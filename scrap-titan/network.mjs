import { PARTS, SLOTS, stats } from './model.mjs?v=2';
export const PROTOCOL = 1, MAX_PLAYERS = 4;
const PREFIX = 'daft-titan-1-';
const number = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
export function roomCode(value) { return String(value || '').trim().toUpperCase().replace(/[\s-]/g, ''); }
export function validCode(value) { return /^[A-Z2-9]{6}$/.test(roomCode(value)); }
export function safeLoadout(raw) {
  const result = {};
  for (const slot of SLOTS) result[slot.id] = PARTS[raw?.[slot.id]]?.kind === slot.kind ? raw[slot.id] : null;
  result.legs ||= 'biped';
  return result;
}
export function validPose(raw) {
  if (!raw || !number(raw.x, -1200, 1200) || !number(raw.z, -1200, 1200) || !number(raw.angle, -10000, 10000) || !number(raw.aim, -10000, 10000)) return null;
  const equipped = safeLoadout(raw.equipped), maximum = stats(equipped).hp;
  return { x: raw.x, z: raw.z, angle: raw.angle, aim: raw.aim, hp: number(raw.hp, 0, maximum) ? raw.hp : maximum, max: maximum, equipped, moving: !!raw.moving, use: !!raw.use, active: !!raw.active, dash: !!raw.dash };
}
export function validShot(raw, pose, lastShotAt = -Infinity, now = 0) {
  if (!pose?.active || pose.hp <= 0 || !raw || !['left', 'right', 'shoulder'].includes(raw.slot)) return null;
  const id = pose.equipped[raw.slot], part = PARTS[id];
  if (!part || part.kind !== 'weapon' || !number(raw.x, -1220, 1220) || !number(raw.z, -1220, 1220) || !number(raw.angle, -10000, 10000)) return null;
  if (Math.hypot(raw.x - pose.x, raw.z - pose.z) > 24 || now - lastShotAt < part.rate * .8) return null;
  return { x: raw.x, z: raw.z, angle: raw.angle, id, slot: raw.slot, damage: part.damage, speed: part.speed };
}
export function lerpAngle(a, b, amount) { return a + Math.atan2(Math.sin(b-a), Math.cos(b-a)) * amount; }
// Public PeerJS signaling plus WebRTC STUN: no game server or paid relay is needed.
export class MultiplayerRoom {
  constructor(callbacks = {}) { this.callbacks = callbacks; this.role = 'offline'; this.connections = new Map(); this.code = ''; this.peer = null; this.hostConnection = null; this.connectTimer = null; this.lastWorldAt = 0; }
  get connected() { return this.role === 'host' || this.role === 'guest'; }
  get hosting() { return this.role === 'host'; }
  status(message) { this.callbacks.status?.(message); }
  cleanup() {
    clearTimeout(this.connectTimer); this.connectTimer = null;
    const peer = this.peer; this.peer = null; this.role = 'offline';
    for (const connection of this.connections.values()) { try { connection.close(); } catch {} }
    this.connections.clear(); this.hostConnection = null;
    try { peer?.destroy(); } catch {}
  }
  leave(message = 'Single player · progress stays on this device') { const wasConnected = this.connected; this.cleanup(); this.code = ''; if (wasConnected) this.callbacks.leave?.(); this.status(message); }
  create() {
    this.leave();
    if (typeof globalThis.Peer !== 'function') { this.status('Multiplayer library could not load. Reload and try again.'); return; }
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes = new Uint8Array(6); globalThis.crypto.getRandomValues(bytes);
    this.code = [...bytes].map(v => alphabet[v % alphabet.length]).join(''); this.role = 'connecting';
    this.openPeer(PREFIX + this.code, () => { this.role = 'host'; this.status(`Room ${this.code} · 1/${MAX_PLAYERS} pilots · waiting for friends`); this.callbacks.ready?.('host'); });
  }
  join(value) {
    const code = roomCode(value);
    if (!validCode(code)) { this.status('Enter the six-character room code from your friend.'); return; }
    this.leave();
    if (typeof globalThis.Peer !== 'function') { this.status('Multiplayer library could not load. Reload and try again.'); return; }
    this.code = code; this.role = 'connecting';
    // Choose an ID locally without the automatic ID endpoint or secure-context-only randomUUID.
    const clientBytes = new Uint8Array(16); globalThis.crypto.getRandomValues(clientBytes);
    const clientId = PREFIX + 'pilot-' + [...clientBytes].map(value => value.toString(16).padStart(2, '0')).join('');
    this.openPeer(clientId, () => {
      this.status(`Connecting to room ${this.code}…`);
      const connection = this.peer.connect(PREFIX + code, { reliable: true, serialization: 'json', metadata: { game: 'scrap-titan', protocol: PROTOCOL } });
      this.hostConnection = connection; this.attach(connection, false);
    });
  }
  openPeer(id, ready) {
    this.status('Contacting multiplayer signaling…');
    let peer;
    try { peer = this.peer = new globalThis.Peer(id, { debug: 0 }); }
    catch { this.leave('Could not initialize multiplayer. Try a current Chrome, Edge, or Firefox browser.'); return; }
    this.connectTimer = setTimeout(() => { if (this.role === 'connecting') this.leave('Connection timed out. Check the code and keep the host tab open. Some networks block direct WebRTC connections.'); }, 18000);
    peer.on('open', () => { if (this.peer === peer) { ready(); if (this.hosting) clearTimeout(this.connectTimer); } });
    peer.on('connection', connection => {
      if (this.peer !== peer) { connection.close(); return; }
      if (!this.hosting || this.connections.size >= MAX_PLAYERS - 1 || connection.metadata?.protocol !== PROTOCOL) {
        connection.on('open', () => { connection.send({ v: PROTOCOL, t: 'reject', reason: this.hosting ? 'This room is full (4 pilots).' : 'This room is unavailable.' }); setTimeout(() => connection.close(), 100); }); return;
      }
      this.attach(connection, true);
    });
    peer.on('error', error => {
      if (this.peer !== peer) return;
      const reason = error?.type === 'peer-unavailable' ? 'Room not found. Check the code; the host must keep the game open.' : error?.type === 'unavailable-id' ? 'Room code is busy. Press Host again for a new code.' : 'Connection failed. Some networks block direct WebRTC; try another network or browser.';
      if (this.role === 'connecting') this.leave(reason); else this.status(reason);
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) { this.status('Signaling interrupted; reconnecting. Existing pilots can keep playing.'); try { peer.reconnect(); } catch {} } });
  }
  attach(connection, incoming) {
    const generationPeer = this.peer;
    connection.on('open', () => {
      if (this.peer !== generationPeer) { connection.close(); return; }
      if (incoming) {
        if (!this.hosting || this.connections.size >= MAX_PLAYERS - 1) { connection.send({ v: PROTOCOL, t: 'reject', reason: 'Room is full.' }); connection.close(); return; }
        this.connections.set(connection.peer, connection); this.send({ t: 'welcome', code: this.code, id: connection.peer }, connection.peer); this.callbacks.join?.(connection.peer); this.status(`Room ${this.code} · ${this.connections.size + 1}/${MAX_PLAYERS} pilots`);
      }
    });
    connection.on('data', packet => {
      if (this.peer !== generationPeer) return;
      if (!packet || packet.v !== PROTOCOL || typeof packet.t !== 'string') return;
      if (!incoming && packet.t === 'reject') { this.leave(typeof packet.reason === 'string' ? packet.reason : 'Room unavailable.'); return; }
      if (!incoming && packet.t === 'welcome') { clearTimeout(this.connectTimer); this.role = 'guest'; this.lastWorldAt = Date.now(); this.status(`Connected · room ${this.code} · cooperative patrol`); this.callbacks.ready?.('guest'); return; }
      if (incoming && !this.connections.has(connection.peer)) return;
      if (!incoming && this.role !== 'guest') return;
      if (packet.t === 'world') this.lastWorldAt = Date.now();
      this.callbacks.message?.(packet, connection.peer);
    });
    const close = () => {
      if (this.peer !== generationPeer) return;
      if (incoming) { if (this.connections.delete(connection.peer)) { this.callbacks.disconnect?.(connection.peer); if (this.hosting) this.status(`Room ${this.code} · ${this.connections.size + 1}/${MAX_PLAYERS} pilots`); } }
      else if (this.hostConnection === connection && this.role !== 'offline') this.leave('Host disconnected. You are back in single player; create a new room to regroup.');
    };
    connection.on('close', close); connection.on('error', close);
  }
  send(packet, only) {
    const data = { ...packet, v: PROTOCOL };
    if (this.hosting) { for (const [id, connection] of this.connections) if ((!only || only === id) && connection.open && (connection.dataChannel?.bufferedAmount || 0) < 256000) { try { connection.send(data); } catch {} } }
    else if (this.role === 'guest' && this.hostConnection?.open && (this.hostConnection.dataChannel?.bufferedAmount || 0) < 256000) { try { this.hostConnection.send(data); } catch {} }
  }
}

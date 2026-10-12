import * as THREE from './vendor/three.module.js';
import { MAP, WIDTH, HEIGHT, CELL_SIZE, ORIGIN_X, ORIGIN_Z, ROOMS, SPAWN, EXIT, gridToWorld } from './engine.js';

const WALL_HEIGHT = 3.8;
const PALETTE = { wood: 0x8c6549, legs: 0x404a52, brass: 0xc59c43, teal: 0x557f86,
  paper: 0xe9e3cf, navy: 0x34445d, maroon: 0x743c4c, green: 0x5c7b69 };

/** A compact, completely local school. Static furniture is batched by material. */
export function buildSchool(scene) {
  const interactables = [], hideSpots = [], colliders = [], sightBlockers = [], lamps = [], students = [];
  const mats = new Map(), batches = new Map(), boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const material = (color, options = {}) => {
    const key = `${color}:${JSON.stringify(options)}`;
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.86, flatShading: true, ...options }));
    return mats.get(key);
  };
  const box = (x, y, z, sx, sy, sz, color, rotation = 0) => {
    const mat = material(color), key = mat.uuid;
    if (!batches.has(key)) batches.set(key, { mat, transforms: [] });
    const transform = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation), new THREE.Vector3(sx, sy, sz));
    batches.get(key).transforms.push(transform);
  };
  const meshBox = (parent, sx, sy, sz, color, x = 0, y = 0, z = 0, options = {}) => {
    const mesh = new THREE.Mesh(boxGeo, material(color, options));
    mesh.scale.set(sx, sy, sz); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const collider = (x, z, sx, sz) => colliders.push({ minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2 });
  const roomForCell = (x, z) => Object.values(ROOMS).find(r => x >= r.cells.minX && x <= r.cells.maxX && z >= r.cells.minZ && z <= r.cells.maxZ)?.id ?? 'hall';

  // Only the exposed edges are built; solid map cells do not become thousands of cubes.
  const faces = [], floorCells = [];
  for (let z = 0; z < HEIGHT; z++) for (let x = 0; x < WIDTH; x++) {
    if (MAP[z][x] !== '.') continue;
    const p = gridToWorld(x, z), room = roomForCell(x, z);
    floorCells.push({ ...p, room, checker: (x + z) % 2 });
    for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (MAP[z + dz]?.[x + dx] === '.') continue;
      faces.push({ x: p.x + dx * CELL_SIZE / 2, z: p.z + dz * CELL_SIZE / 2, rotation: dx ? Math.PI / 2 : 0, room });
    }
  }
  const wallColors = { hall: 0xaebbb4, homeroom: 0xb8c8b4, band: 0xbca6ac, library: 0xc5bda1,
    lab: 0xa3bdc6, office: 0xa9c4b7, storage: 0xb0b3aa, detention: 0xa9a9a0 };
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE + 0.02, WALL_HEIGHT, 0.14), material(0xffffff), faces.length);
  const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE + 0.02, 0.12, 0.17), material(0x4f6963), faces.length);
  const baseMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE + 0.02, 0.18, 0.17), material(0x455653), faces.length);
  const dummy = new THREE.Object3D();
  faces.forEach((f, i) => {
    dummy.position.set(f.x, WALL_HEIGHT / 2, f.z); dummy.rotation.set(0, f.rotation, 0); dummy.updateMatrix();
    wallMesh.setMatrixAt(i, dummy.matrix); wallMesh.setColorAt(i, new THREE.Color(wallColors[f.room]));
    dummy.position.y = 1.1; dummy.updateMatrix(); trimMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.09; dummy.updateMatrix(); baseMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(wallMesh, trimMesh, baseMesh);
  const floorMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE, 0.12, CELL_SIZE), material(0xffffff), floorCells.length);
  const roofMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE), material(0x919b94), floorCells.length);
  floorCells.forEach((f, i) => {
    dummy.position.set(f.x, -0.06, f.z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); floorMesh.setMatrixAt(i, dummy.matrix);
    floorMesh.setColorAt(i, new THREE.Color(f.room === 'hall' ? (f.checker ? 0x919f97 : 0xb8c2b0) : (f.checker ? 0x85938b : 0xa5b09b)));
    dummy.position.y = WALL_HEIGHT + 0.05; dummy.updateMatrix(); roofMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(floorMesh, roofMesh);

  function textPanel(text, width = 2.2, height = 0.6, bg = '#233936', fg = '#e9ecdb', lines = []) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = Math.round(512 * height / width);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.45; ctx.lineWidth = 6; ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14); ctx.globalAlpha = 1;
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.min(64, canvas.height * (lines.length ? 0.26 : 0.44))}px sans-serif`;
    ctx.fillText(text, canvas.width / 2, canvas.height * (lines.length ? 0.25 : 0.52), canvas.width - 32);
    if (lines.length) {
      ctx.font = `500 ${Math.min(32, canvas.height * 0.13)}px sans-serif`;
      lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, canvas.height * (0.52 + i * 0.18), canvas.width - 30));
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  }
  function panel(text, x, y, z, rotation, width, height, bg, fg, lines) {
    const p = textPanel(text, width, height, bg, fg, lines); p.position.set(x, y, z); p.rotation.y = rotation; scene.add(p); return p;
  }
  for (const r of Object.values(ROOMS)) {
    if (r.id === 'detention') continue;
    const left = r.center.x < 0, frameX = left ? r.bounds.maxX : r.bounds.minX, yaw = left ? Math.PI / 2 : -Math.PI / 2;
    box(frameX, 1.52, r.door.z - 0.72, 0.19, 3.05, 0.14, 0x405e5a);
    box(frameX, 1.52, r.door.z + 0.72, 0.19, 3.05, 0.14, 0x405e5a);
    box(frameX, 3.10, r.door.z, 0.19, 0.2, 1.58, 0x405e5a);
    panel(r.label.toUpperCase(), frameX + (left ? 0.13 : -0.13), 3.35, r.door.z, yaw, 2.1, 0.42);
    // A quiet wall poster and a convincing board give every room a recognizable identity.
    const boardX = left ? r.bounds.minX + 0.12 : r.bounds.maxX - 0.12;
    const boardText = { homeroom: 'MONDAY', band: 'LISTEN FIRST', library: 'KEEP READING', lab: 'OBSERVE', office: 'STAFF ONLY', storage: 'SUPPLIES' }[r.id];
    panel(boardText, boardX, 2.15, r.center.z, yaw, 4.4, 1.6, '#233e37', '#c8d4b9',
      r.id === 'band' ? ['No running. No shouting.', 'Someone is always listening.'] : ['After the bell, return to your seat.', 'Doors lock at sundown.']);
    const posterZ = r.bounds.minZ + 0.09;
    panel('SCHOOL RULES', r.center.x + (left ? 3.7 : -3.7), 2.3, posterZ, 0, 1.35, 1.7, '#d7cfab', '#3c5148', ['Walk quietly.', 'Respect the bell.']);
    interactables.push({ id: `class-${r.id}`, type: 'class', label: `Attend ${r.label}`, x: r.center.x, z: r.center.z, y: 1, mesh: null, room: r.id });
  }

  function desk(x, z, wide = 1.5, depth = 0.78, color = PALETTE.wood) {
    box(x, 0.83, z, wide, 0.12, depth, color);
    for (const dx of [-wide * 0.4, wide * 0.4]) for (const dz of [-depth * 0.32, depth * 0.32]) box(x + dx, 0.39, z + dz, 0.075, 0.78, 0.075, PALETTE.legs);
    collider(x, z, wide, depth);
  }
  function chair(x, z, yaw = 0, color = 0x466765) {
    box(x, 0.47, z, 0.57, 0.10, 0.59, color, yaw);
    box(x, 0.76, z + Math.cos(yaw) * 0.25, 0.57, 0.55, 0.08, color, yaw);
    for (const dx of [-0.22, 0.22]) for (const dz of [-0.21, 0.21]) box(x + dx, 0.23, z + dz, 0.055, 0.47, 0.055, PALETTE.legs);
    collider(x, z, 0.62, 0.62);
  }
  function classFurniture(r) {
    const top = r.bounds.minZ + 0.75, bottom = r.bounds.maxZ - 0.75;
    for (const offset of [-4.3, -1.5, 1.5, 4.3]) {
      const x = r.center.x + offset;
      desk(x, top); desk(x, bottom);
      // Chairs are also along the walls, leaving the middle and doorway travel lanes clear.
      chair(x, top + 0.9, Math.PI); chair(x, bottom - 0.9);
      box(x + 0.23, 0.905, top, 0.36, 0.025, 0.25, PALETTE.paper);
      box(x - 0.25, 0.905, bottom, 0.26, 0.04, 0.33, 0x59647c);
    }
  }
  classFurniture(ROOMS.homeroom); classFurniture(ROOMS.lab);
  const lab = ROOMS.lab;
  for (const offset of [-4.3, -1.5, 1.5, 4.3]) {
    box(lab.center.x + offset, 1.04, lab.bounds.minZ + 0.75, 0.14, 0.27, 0.14, 0x78bdb2);
    box(lab.center.x + offset + 0.2, 1.05, lab.bounds.maxZ - 0.75, 0.14, 0.30, 0.14, 0x747da5);
  }

  const band = ROOMS.band;
  const pianoX = band.bounds.minX + 1.4, pianoZ = band.center.z;
  box(pianoX, 0.85, pianoZ, 1.9, 1.7, 2.7, 0x292e35); collider(pianoX, pianoZ, 1.9, 2.7);
  box(pianoX + 0.97, 0.83, pianoZ, 0.4, 0.11, 2.3, 0xe8e1cf);
  for (let i = 0; i < 13; i++) box(pianoX + 1.03, 0.91, pianoZ - 1.03 + i * 0.17, 0.22, 0.07, 0.065, 0x202731);
  chair(pianoX + 1.6, pianoZ, Math.PI / 2, 0x57394a);
  for (const dz of [-3.3, 3.3]) for (const dx of [-3, 0, 3]) {
    const x = band.center.x + dx, z = band.center.z + dz;
    chair(x, z, 0, 0x624858);
    box(x, 0.65, z - 0.65, 0.08, 1.3, 0.08, PALETTE.legs);
    box(x, 1.24, z - 0.65, 0.64, 0.44, 0.08, 0x3e4a51);
    collider(x, z - 0.65, 0.68, 0.24);
  }
  desk(band.center.x + 4.8, band.bounds.minZ + 1.2, 1.7, 0.8);

  const library = ROOMS.library;
  for (const z of [library.center.z - 2.3, library.center.z + 2.3]) {
    const x = library.bounds.minX + 0.6;
    box(x, 1.3, z, 0.9, 2.6, 3.3, 0x725840); collider(x, z, 0.9, 3.3);
    for (const y of [0.5, 1.2, 1.9]) for (let i = 0; i < 10; i++) {
      const colors = [0x647e72, 0x725765, 0x9a824e, 0x4a6179];
      box(x + 0.48, y, z - 1.36 + i * 0.29, 0.1, 0.43 + (i % 3) * 0.05, 0.21, colors[i % 4]);
    }
  }
  for (const dz of [-3, 3]) { desk(library.center.x + 1, library.center.z + dz, 3.4, 0.9); chair(library.center.x + 1, library.center.z + dz + (dz < 0 ? 0.85 : -0.85)); }
  const office = ROOMS.office;
  desk(office.bounds.maxX - 2.1, office.center.z + 2.6, 2.8, 1.2, 0x846248);
  chair(office.bounds.maxX - 2.1, office.center.z + 3.75, Math.PI, 0x354a50);
  box(office.bounds.maxX - 2.1, 1.24, office.center.z + 2.6, 0.92, 0.63, 0.14, 0x253542);
  panel('OFFLINE', office.bounds.maxX - 2.1, 1.24, office.center.z + 2.51, Math.PI, 0.72, 0.42, '#071b21', '#73a89a');
  for (const dx of [-3.6, -1.5]) {
    box(office.center.x + dx, 0.88, office.bounds.minZ + 0.65, 1.1, 1.76, 0.85, 0x697c74);
    collider(office.center.x + dx, office.bounds.minZ + 0.65, 1.1, 0.85);
    for (const y of [0.4, 0.92, 1.43]) box(office.center.x + dx, y, office.bounds.minZ + 1.10, 0.5, 0.06, 0.06, 0xb6b49c);
  }
  const storage = ROOMS.storage;
  for (let i = 0; i < 7; i++) {
    const x = storage.bounds.maxX - 1.1 - (i % 3) * 1.4, z = storage.bounds.minZ + 0.8 + Math.floor(i / 3) * 1.25;
    box(x, 0.43, z, 1.1, 0.86, 1, i % 2 ? 0x9a8963 : 0x87795b); collider(x, z, 1.1, 1);
    box(x, 0.875, z, 0.15, 0.015, 1.02, 0xb5aa87);
    if (i % 3 === 0) box(x, 1.28, z, 0.95, 0.76, 0.85, 0x9a8963);
  }
  desk(storage.center.x - 3.5, storage.bounds.maxZ - 0.7, 2.8, 0.9);

  // Six usable hall lockers. Hiding positions remain in walkable cells and outside props.
  for (const [side, z] of [[-1, -5.25], [1, -5.25], [-1, 3.75], [1, 3.75], [-1, 15], [1, 15]]) {
    const x = side * 3.28;
    box(x, 1.22, z, 0.62, 2.44, 1.1, side < 0 ? 0x557b80 : 0x54766c); collider(x, z, 0.62, 1.1);
    for (const h of [0.3, 2.03, 2.13]) box(x - side * 0.32, h, z, 0.04, 0.035, 0.58, 0x263e46);
    box(x - side * 0.35, 1.05, z + 0.30, 0.05, 0.13, 0.07, 0xb3b59d);
    const marker = new THREE.Group(); marker.position.set(x - side * 0.95, 0, z); scene.add(marker);
    hideSpots.push({ id: `locker-${hideSpots.length + 1}`, x: marker.position.x, z, angle: side < 0 ? -Math.PI / 2 : Math.PI / 2, label: 'locker', mesh: marker });
  }
  panel('AFTER BELL', 0, 2.8, 17.15, Math.PI, 3.5, 0.6, '#344d45', '#dce5c6');
  panel('WALK. LISTEN. RETURN.', -3.61, 2.4, 0, Math.PI / 2, 2.9, 0.58, '#394b49', '#bdd0b4');

  function pickup(id, type, label, x, z, y, room) {
    const group = new THREE.Group(); group.position.set(x, y, z);
    const accent = type === 'proof' ? 0xc6b986 : type.includes('Key') || type === 'key' ? 0xe0b65d : type === 'battery' ? 0x9ac8a6 : 0x84c9d0;
    if (type === 'flashlight') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.43, 10), material(0x3e4d55)); body.rotation.z = Math.PI / 2; group.add(body);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.08, 0.13, 12), material(accent, { emissive: accent, emissiveIntensity: 0.12 })); lens.rotation.z = Math.PI / 2; lens.position.x = 0.24; group.add(lens);
    } else if (type === 'key' || type === 'detKey') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.026, 5, 12), material(accent)); ring.rotation.x = -Math.PI / 2; ring.position.x = -0.13; group.add(ring);
      meshBox(group, 0.27, 0.045, 0.045, accent, 0.06); meshBox(group, 0.045, 0.045, 0.09, accent, 0.14, 0, 0.04);
    } else if (type === 'proof') {
      meshBox(group, 0.48, 0.055, 0.61, 0x786344); meshBox(group, 0.43, 0.025, 0.56, PALETTE.paper, 0, 0.036);
      meshBox(group, 0.16, 0.02, 0.05, 0x64876b, 0, 0.055, -0.08);
    } else if (type === 'battery') {
      meshBox(group, 0.2, 0.32, 0.2, 0x4d7361, 0, 0.10); meshBox(group, 0.12, 0.025, 0.12, 0xbfc7b6, 0, 0.27);
    } else if (type === 'decoy') {
      meshBox(group, 0.27, 0.3, 0.21, PALETTE.maroon, 0, 0.12);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.095, 12), material(0xddcba1)); dial.position.set(0, 0.14, 0.11); group.add(dial);
    } else if (type === 'detFuse') {
      meshBox(group, 0.14, 0.29, 0.14, 0xb5b9a8, 0, 0.10); meshBox(group, 0.16, 0.06, 0.16, 0x9b7e45, 0, -0.03);
    }
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.23, 0.27, 20), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.34, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = -0.06; group.add(halo);
    scene.add(group);
    const item = { id, type, label, x, z, y, mesh: group, room }; interactables.push(item); return item;
  }
  pickup('flashlight', 'flashlight', 'Take flashlight', ROOMS.homeroom.center.x - 4.3, ROOMS.homeroom.bounds.minZ + 0.75, 0.99, 'homeroom');
  pickup('staffKey', 'key', 'Take staff key', office.bounds.maxX - 2.7, office.center.z + 2.6, 0.99, 'office');
  pickup('battery1', 'battery', 'Take battery', library.center.x + 1, library.center.z - 3, 0.98, 'library');
  pickup('battery2', 'battery', 'Take battery', lab.center.x + 4.3, lab.bounds.maxZ - 0.75, 0.98, 'lab');
  pickup('decoy', 'decoy', 'Take wind-up distraction', band.center.x + 4.8, band.bounds.minZ + 1.2, 0.98, 'band');
  for (const r of Object.values(ROOMS)) {
    if (r.id === 'detention') continue;
    const item = pickup(`proof-${r.id}`, 'proof', `Collect ${r.label} evidence`, r.center.x + (r.center.x < 0 ? -2.6 : 2.6), r.center.z, 0.78, r.id);
    item.mesh.visible = false;
    // Small evidence side table is out of the central room path.
    desk(item.x, item.z, 0.84, 0.82, 0x76624c);
  }

  // Detention contains an escape key, replacement fuse, and reset panel.
  const det = ROOMS.detention;
  desk(-3.25, det.center.z - 1.1, 1.8, 0.85); chair(-3.25, det.center.z - 0.12, Math.PI);
  desk(3.1, det.center.z - 1.1, 1.8, 0.85); chair(3.1, det.center.z - 0.12, Math.PI);
  // Tall cabinets make genuine cover, with a clear aisle around both sides.
  for (const x of [-3, 3]) {
    const z = det.center.z + 0.75;
    box(x, 0.925, z, 0.9, 1.85, 0.65, 0x59685c); collider(x, z, 0.9, 0.65);
    for (const y of [0.29, 0.73, 1.17, 1.61]) {
      box(x, y, z + 0.335, 0.76, 0.38, 0.035, 0x647460);
      box(x, y + 0.05, z + 0.37, 0.26, 0.04, 0.045, 0xb9b7a0);
    }
    sightBlockers.push({ minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.325, maxZ: z + 0.325, height: 1.85 });
  }
  pickup('detKey', 'detKey', 'Take detention key', -3.25, det.center.z - 1.1, 0.98, 'detention');
  pickup('detFuse', 'detFuse', 'Take replacement fuse', 3.1, det.center.z - 1.1, 0.98, 'detention');
  const detentionDoor = new THREE.Group(); detentionDoor.position.set(det.door.x, 0, det.door.z);
  meshBox(detentionDoor, 1.33, 3.13, 0.17, 0x686f61, 0, 1.565);
  meshBox(detentionDoor, 0.89, 0.49, 0.035, 0x273e39, 0, 2.34, 0.10);
  meshBox(detentionDoor, 0.12, 0.065, 0.09, PALETTE.brass, 0.46, 1.2, 0.13); scene.add(detentionDoor);
  panel('DETENTION', 0, 3.4, det.door.z + 0.15, 0, 2.5, 0.45, '#483c31', '#d9cfa8');
  panel('STAY IN YOUR SEAT', 0, 2.45, det.bounds.minZ + 0.10, 0, 3.8, 0.8, '#424137', '#e1d6b1');
  const detPanel = new THREE.Group(); detPanel.position.set(2.8, 1.25, det.bounds.maxZ - 0.15);
  meshBox(detPanel, 0.6, 0.9, 0.15, 0x46594e); meshBox(detPanel, 0.18, 0.12, 0.06, 0x9eb276, 0, 0.14, -0.105); scene.add(detPanel);
  interactables.push({ id: 'detPanel', type: 'detPanel', label: 'Reset door power', x: 2.8, z: det.bounds.maxZ - 0.55, y: 1.25, mesh: detPanel, room: 'detention' });
  interactables.push({ id: 'detDoor', type: 'detDoor', label: 'Unlock detention door', x: det.door.x, z: det.door.z - 0.3, y: 1.4, mesh: detentionDoor, room: 'detention' });
  const exitDoor = new THREE.Group(); exitDoor.position.set(EXIT.x, 0, 17.17);
  meshBox(exitDoor, 2.55, 3.15, 0.17, 0x415e57, 0, 1.575);
  for (const dx of [-0.68, 0.68]) { meshBox(exitDoor, 0.82, 1.6, 0.05, 0x193f48, dx, 2.1, -0.12); meshBox(exitDoor, 0.6, 0.07, 0.12, 0xa2aa89, dx, 1.22, -0.15); }
  scene.add(exitDoor);
  interactables.push({ id: 'exit', type: 'exit', label: 'Leave school', x: EXIT.x, z: EXIT.z - 0.2, y: 1.4, mesh: exitDoor, room: 'hall' });

  // Facial proportions, clothing, and hair match the corresponding jumpscare artwork.
  function makeHuman(kind, student = false) {
    const friend = kind === 'jamie';
    const root = new THREE.Group(), skin = friend ? 0xc69c7e : student ? 0xbe9680 : kind === 'band' ? 0xc7bcae : 0xc1b6a5;
    const coat = friend ? 0xd2ad4f : student ? 0x556c86 : kind === 'band' ? PALETTE.maroon : 0x477b76;
    const trouser = student ? 0x334b56 : 0x252f37;
    const sphere = (parent, radius, color, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
    };
    meshBox(root, 0.62, 0.67, 0.33, coat, 0, 1.42);
    meshBox(root, 0.26, 0.52, 0.06, friend ? 0xd2ad4f : student ? 0xa9bbba : 0xd4d1be, 0, 1.47, 0.185);
    if (friend) {
      // Jamie has a warm yellow hoodie, a front pocket, and a distinctly normal face.
      meshBox(root, 0.39, 0.19, 0.07, 0xb98c37, 0, 1.24, 0.20);
      for (const dx of [-0.085, 0.085]) meshBox(root, 0.018, 0.17, 0.02, 0xf0dfb7, dx, 1.68, 0.205);
      sphere(root, 0.23, coat, 0, 1.82, -0.09, 1.2, 0.65, 0.9);
    }
    if (kind === 'band' && !student) meshBox(root, 0.07, 0.43, 0.05, 0x20272f, 0, 1.44, 0.225);
    meshBox(root, 0.45, 0.21, 0.3, trouser, 0, 1.0);
    sphere(root, 0.105, skin, 0, 1.88, 0, 0.8, 1.4, 0.8);
    const head = new THREE.Group(); head.position.set(0, 2.13, 0.01); head.rotation.z = friend ? 0 : kind === 'band' ? -0.025 : 0.055; root.add(head);
    sphere(head, 0.26, skin, 0, 0, 0, 0.93, 1.23, 0.88);
    const hair = student ? 0x4c392d : kind === 'band' ? 0x24262b : 0xb0b1a7;
    sphere(head, 0.268, hair, 0, 0.15, -0.045, 1.02, 0.76, 0.95);
    if (kind !== 'band' && !friend) {
      sphere(head, 0.20, hair, -0.205, -0.045, -0.065, 0.42, 1.05, 0.95);
      sphere(head, 0.20, hair, 0.205, -0.045, -0.065, 0.42, 1.05, 0.95);
    } else sphere(head, 0.14, hair, -0.1, 0.20, 0.12, 1.05, 0.65, 0.52);
    sphere(head, 0.043, skin, -0.25, -0.04, 0, 0.55, 1.5, 1); sphere(head, 0.043, skin, 0.25, -0.04, 0, 0.55, 1.5, 1);
    sphere(head, 0.035, skin, 0, -0.014, 0.223, 0.85, 1.15, 1.2);
    const eyes = [];
    for (const dx of [-0.093, 0.093]) {
      sphere(head, 0.041, 0xe7e0c9, dx, 0.053, 0.205, 1.3, 0.82, 0.6);
      const pupil = sphere(head, 0.018, 0x1b2328, dx + 0.004, 0.055, 0.231, 0.83, 1.04, 0.52); eyes.push(pupil);
      meshBox(head, 0.105, 0.018, 0.024, hair, dx, 0.117, 0.205);
      if (kind === 'band' && !student) {
        const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.009, 5, 16), material(0x263039)); glasses.position.set(dx, 0.053, 0.252); head.add(glasses);
      }
    }
    if (kind === 'band' && !student) meshBox(head, 0.05, 0.013, 0.025, 0x263039, 0, 0.06, 0.252);
    const smile = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.076, -0.11, 0.202), new THREE.Vector3(0, friend ? -0.119 : -0.135, 0.23), new THREE.Vector3(0.078, friend ? -0.109 : -0.095, 0.20)]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(smile, 8, 0.008, 5, false), material(0x614845)));
    const arms = [], legs = [], lowerArms = [], lowerLegs = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * 0.37, 1.71, 0); root.add(arm); arms.push(arm);
      meshBox(arm, 0.17, 0.42, 0.20, coat, 0, -0.21);
      const lowerArm = new THREE.Group(); lowerArm.position.y = -0.43; arm.add(lowerArm); lowerArms.push(lowerArm);
      meshBox(lowerArm, 0.145, 0.36, 0.17, coat, 0, -0.18); sphere(lowerArm, 0.087, skin, 0, -0.4, 0.01, 0.8, 1.2, 0.75);
      const leg = new THREE.Group(); leg.position.set(side * 0.14, 1.02, 0); root.add(leg); legs.push(leg);
      meshBox(leg, 0.22, 0.43, 0.24, trouser, 0, -0.23);
      const lowerLeg = new THREE.Group(); lowerLeg.position.y = -0.47; leg.add(lowerLeg); lowerLegs.push(lowerLeg);
      meshBox(lowerLeg, 0.19, 0.43, 0.21, trouser, 0, -0.22); meshBox(lowerLeg, 0.22, 0.13, 0.39, 0x242b2d, 0, -0.47, 0.07);
    }
    if (student) meshBox(root, 0.43, 0.49, 0.2, 0x9a794e, 0, 1.42, -0.26);
    root.scale.setScalar(student ? 0.68 : kind === 'band' ? 0.85 : 0.79);
    root.userData.limbs = { arms, legs, lowerArms, lowerLegs, leftArm: arms[0], rightArm: arms[1], leftLeg: legs[0], rightLeg: legs[1] };
    root.userData.head = head; root.userData.eyes = eyes; root.userData.kind = kind;
    return root;
  }
  const teachers = { band: makeHuman('band'), teacher: makeHuman('teacher') };
  teachers.band.position.set(band.center.x, 0, band.center.z); teachers.band.rotation.y = Math.PI / 2;
  teachers.teacher.position.set(office.center.x, 0, office.center.z); teachers.teacher.rotation.y = -Math.PI / 2;
  scene.add(teachers.band, teachers.teacher);
  for (let i = 0; i < 4; i++) {
    const pupil = makeHuman(i % 2 ? 'teacher' : 'band', true);
    pupil.position.set(ROOMS.homeroom.center.x + (i % 2 ? 2.6 : -2.6), 0, ROOMS.homeroom.center.z + (i < 2 ? -1.6 : 1.6));
    pupil.rotation.y = Math.PI / 2; scene.add(pupil); students.push(pupil);
  }
  const friend = makeHuman('jamie', true);
  friend.name = 'Jamie'; friend.visible = false; scene.add(friend);

  const guardian = new THREE.Group(); guardian.position.set(SPAWN.x, 1.6, SPAWN.z - 9);
  const shield = new THREE.Shape(); shield.moveTo(0, 0.88); shield.lineTo(-0.70, 0.52); shield.lineTo(-0.58, -0.35); shield.lineTo(0, -0.84); shield.lineTo(0.58, -0.35); shield.lineTo(0.70, 0.52); shield.closePath();
  const shieldMesh = new THREE.Mesh(new THREE.ShapeGeometry(shield), material(0x16484f, { emissive: 0x165865, emissiveIntensity: 0.34, side: THREE.DoubleSide })); guardian.add(shieldMesh);
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shield.getPoints().map(p => new THREE.Vector3(p.x, p.y, 0.01))), new THREE.LineBasicMaterial({ color: 0x69d4dd })); guardian.add(outline);
  const guardianTexture = new THREE.TextureLoader().load('./assets/guardian.webp'); guardianTexture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.44), new THREE.MeshBasicMaterial({ map: guardianTexture, transparent: false, side: THREE.DoubleSide })); face.position.z = 0.025; guardian.add(face);
  guardian.userData.face = face; scene.add(guardian);
  // A second monitor references the same exact Guardian design.
  const wallMonitor = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: guardianTexture }));
  wallMonitor.position.set(3.61, 2.6, 8.3); wallMonitor.rotation.y = -Math.PI / 2; scene.add(wallMonitor);

  const ambient = new THREE.AmbientLight(0xc4d2c6, 1.0);
  const hemisphere = new THREE.HemisphereLight(0xb7cfce, 0x283936, 0.7); scene.add(ambient, hemisphere);
  const lampSpecs = [
    ...Object.values(ROOMS).filter(r => r.id !== 'detention').map(r => ({ x: r.center.x, z: r.center.z, room: r.id, point: false })),
    ...[-5.4, 5, 14].map(z => ({ x: 0, z, room: 'hall', point: true })),
    ...[-3.1, 0, 3.1].map(x => ({ x, z: det.center.z, room: 'detention', point: true }))
  ];
  for (const spec of lampSpecs) {
    const group = new THREE.Group(); group.position.set(spec.x, 3.68, spec.z);
    meshBox(group, 1.75, 0.14, 0.66, 0x424e49);
    const panelMesh = meshBox(group, 1.58, 0.05, 0.50, 0xe1e6c7, 0, -0.087, 0, { emissive: 0xe1e6c7, emissiveIntensity: 0.7 });
    // Unique material lets detention fixtures turn on one at a time.
    panelMesh.material = panelMesh.material.clone(); group.userData.panel = panelMesh;
    const light = spec.point ? new THREE.PointLight(0xc5d8c0, 18, 15, 2) : null;
    if (light) { light.position.set(spec.x, 3.30, spec.z); scene.add(light); }
    const pool = new THREE.Mesh(new THREE.CircleGeometry(spec.room === 'hall' ? 3.1 : 3.8, 20),
      new THREE.MeshBasicMaterial({ color: 0xc0d4ae, transparent: true, opacity: 0.10, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(spec.x, 0.004, spec.z); scene.add(pool);
    scene.add(group); lamps.push({ mesh: group, light, room: spec.room, pool });
  }
  function setMood(day, detentionLights = 0) {
    ambient.color.setHex(day ? 0xd6dcc5 : 0x91a4b2); ambient.intensity = day ? 0.90 : 0.18;
    hemisphere.color.setHex(day ? 0xc6d9d0 : 0x88a9bc); hemisphere.groundColor.setHex(day ? 0x777b62 : 0x17272d); hemisphere.intensity = day ? 0.70 : 0.20;
    scene.background = new THREE.Color(day ? 0x8aaba6 : 0x071118); scene.fog = new THREE.Fog(day ? 0x899f94 : 0x071118, day ? 22 : 8, day ? 58 : 38);
    let detIndex = 0;
    for (const lamp of lamps) {
      // Normal classroom lights switch off after the bell. Only dim hall emergency lamps remain.
      const on = lamp.room === 'detention' ? detIndex++ < detentionLights : day || lamp.room === 'hall';
      lamp.mesh.userData.panel.material.emissiveIntensity = on ? (day ? 0.9 : lamp.room === 'detention' ? 0.65 : 0.12) : 0;
      lamp.mesh.userData.panel.material.color.setHex(on ? 0xdce6c6 : 0x515d55);
      lamp.pool.visible = on; lamp.pool.material.opacity = day ? 0.06 : lamp.room === 'detention' ? 0.16 : 0.09;
      if (lamp.light) lamp.light.intensity = on ? (lamp.room === 'detention' ? 30 : day ? 9 : 4) : 0;
    }
  }
  for (const { mat, transforms } of batches.values()) {
    const instanced = new THREE.InstancedMesh(boxGeo, mat, transforms.length);
    transforms.forEach((matrix, i) => instanced.setMatrixAt(i, matrix)); scene.add(instanced);
  }
  setMood(true, 0);
  scene.userData.school = { floorCells: floorCells.length, exposedWallFaces: faces.length, staticBatches: batches.size };
  return { lamps, interactables, hideSpots, exitDoor, detentionDoor, colliders, sightBlockers, teachers, guardian, students, friend, setMood };
}

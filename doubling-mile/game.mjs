import { speedAt } from './physics.mjs?v=2';

const $ = (selector) => document.querySelector(selector);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const mode = $('#mode');
const value = $('#value');
const start = $('#start');
const pause = $('#pause');
const status = $('#status');
const mph = 0.44704;
const trafficSpeed = 35 * mph;
const far = 330;
const trafficSpan = 490;
const modes = {
  constant: ['Speed (mph)', 35, 0, 1000000, 'Hold your selected speed for the whole drive.'],
  accel: ['Acceleration (mph/s)', 5, 0, 1000000, 'Start at 2 mph and add this many mph every second.'],
  exp: ['Speed doubling time (s)', 8, 0.1, 3600, 'Start at 2 mph, then double your speed each interval.'],
  super: ['Exponent doubling time (s)', 8, 0.1, 3600, 'Start at 2 mph. The exponent doubles each interval: 2 → 4 → 16 → 256 mph.'],
};
const settings = Object.fromEntries(Object.entries(modes).map(([key, [, initial]]) => [key, initial]));
const palettes = ['#96becf', '#e08a75', '#f1ece1', '#85a88c', '#9a92c6', '#506885'];
let selected = mode.value;
let active = selected;
let setting = settings[active];
let state = 'ready';
let time = 0;
let distance = 0;
const playerLane = 3;
let roadPhase = 0;
let buildingPhase = 0;
let cars = [];
let last = 0;
let w, h, horizon, focal, camera;

function resetTraffic() {
  cars = Array.from({ length: 15 }, (_, i) => {
    const lane = i % 3;
    return { lane, z: (111 + Math.floor(i / 3) * 95 + (lane * 17) % 31) % trafficSpan - 65,
      color: palettes[i % palettes.length], facing: lane < 2 ? -1 : 1 };
  });
}

mode.addEventListener('change', () => {
  if (value.validity.valid) settings[selected] = value.valueAsNumber;
  selected = mode.value;
  const [label, , min, max, hint] = modes[selected];
  $('#parameter').textContent = label;
  value.min = min;
  value.max = max;
  value.value = settings[selected];
  $('#formula').textContent = hint;
  if (state === 'ready') {
    active = selected;
    setting = Number(value.value);
    updateHud();
  }
});
value.addEventListener('input', () => {
  if (state === 'ready' && value.validity.valid) {
    setting = value.valueAsNumber;
    updateHud();
  }
});

$('form').addEventListener('submit', (event) => {
  event.preventDefault();
  active = mode.value;
  setting = value.valueAsNumber;
  time = distance = 0;
  roadPhase = buildingPhase = 0;
  resetTraffic();
  state = 'running';
  status.textContent = '';
  start.textContent = 'Restart simulation';
  pause.disabled = false;
  pause.textContent = 'Pause';
  updateHud();
});

function togglePause() {
  if (state === 'running') {
    state = 'paused';
    pause.textContent = 'Resume';
    status.textContent = 'Paused';
  } else if (state === 'paused') {
    state = 'running';
    pause.textContent = 'Pause';
    status.textContent = '';
  }
}

pause.addEventListener('click', togglePause);
window.addEventListener('keydown', (event) => {
  if (!event.target.closest('input,select') && !event.repeat && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    togglePause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'running') togglePause();
});

function step(dt) {
  const nextTime = time + dt;
  const nextSpeed = speedAt(active, setting, nextTime);
  const travel = mph * dt / 6 * speedAt(active, setting, time) +
    mph * dt * (2 / 3) * speedAt(active, setting, time + dt / 2) +
    mph * dt / 6 * nextSpeed;
  if (!Number.isFinite(nextSpeed) || !Number.isFinite(distance + travel)) {
    state = 'limit';
    pause.disabled = true;
    status.textContent = 'Numerical limit reached. Restart to try a different speed curve.';
    return;
  }

  time = nextTime;
  distance += travel;
  roadPhase = (roadPhase + travel % 12) % 12;
  buildingPhase = (buildingPhase + travel % 630) % 630;
  for (const car of cars) {
    const shifted = car.z + 65 + car.facing * trafficSpeed * dt - travel % trafficSpan;
    car.z = ((shifted % trafficSpan) + trafficSpan) % trafficSpan - 65;
  }
}

function updateHud() {
  const speed = speedAt(active, setting, time);
  $('#speed').textContent = speed >= 1e6 ? speed.toExponential(2) : speed.toFixed(1);
  $('#time').textContent = time.toFixed(1);
  const miles = distance / 1609.344;
  $('#distance').textContent = miles >= 1e6 ? miles.toExponential(2) : miles.toFixed(2);
}

const laneX = (lane) => (lane - 1.5) * 3.6;
function project(worldX, z, height = 0) {
  const scale = focal / (z + 11);
  return [w * 0.5 + (worldX - camera) * scale, horizon + (4.2 - height) * scale];
}
function polygon(color, ...points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fill();
}
function strip(color, a, b, near, distant) {
  polygon(color, project(a, near), project(b, near), project(b, distant), project(a, distant));
}
function building(left, right, near, depth, height, variant) {
  const rear = near + depth;
  const frontColor = ['#546077', '#5f637c', '#796b76', '#435970'][variant % 4];
  const inside = right < 0 ? right : left;
  polygon('#34495f', project(inside, rear), project(inside, near),
    project(inside, near, height), project(inside, rear, height));
  polygon('#8293a4', project(left, near, height), project(right, near, height),
    project(right, rear, height), project(left, rear, height));
  polygon(frontColor, project(left, near), project(right, near),
    project(right, near, height), project(left, near, height));
  for (let floor = 3; floor < height - 1; floor += 3.2) {
    for (let column = left + 1.3; column < right - 1.5; column += 2.7) {
      polygon((Math.floor(floor + column + variant) % 4 === 0) ? '#f4d99b' : '#34475f',
        project(column, near, floor), project(column + 1.3, near, floor),
        project(column + 1.3, near, floor + 1.5), project(column, near, floor + 1.5));
    }
  }
}

function drawCar(worldX, z, color, facing) {
  const [cx, ground] = project(worldX, z);
  const scale = focal / (z + 11);
  ctx.save();
  ctx.translate(cx, ground);
  ctx.scale(scale, scale);
  polygon('#192131', [-1.14,.15], [1.15,.15], [1.04,-.7], [-1.01,-.7]);
  polygon(color, [-.96,-.12], [.96,-.12], [.98,-.73], [.59,-1.31],
    [-.59,-1.31], [-.98,-.73]);
  polygon('#273d53', [-.65,-.72], [.65,-.72], [.43,-1.18], [-.43,-1.18]);
  ctx.fillStyle = facing > 0 ? '#ff564d' : '#fff1c0';
  ctx.fillRect(-.88,-.52,.34,.17);
  ctx.fillRect(.54,-.52,.34,.17);
  ctx.fillStyle = '#d5dce3';
  ctx.fillRect(-.22,-.38,.44,.13);
  ctx.restore();
}

function render() {
  w = canvas.clientWidth;
  h = canvas.clientHeight;
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * pixelRatio) || canvas.height !== Math.round(h * pixelRatio)) {
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);
  }
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  horizon = h * .34;
  focal = Math.min(w * .59, h * 1.25);
  camera = laneX(playerLane) * .64;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon + 45);
  sky.addColorStop(0, '#314d7c');
  sky.addColorStop(1, '#ffc297');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe2ab';
  ctx.beginPath();
  ctx.arc(w * .68, horizon * .76, Math.min(w, h) * .063, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4c5668';
  ctx.fillRect(0, horizon + 4, w, h);
  strip('#818792', -10.5, 10.5, -9, far);
  strip('#333945', -7.2, 7.2, -9, far);
  for (const edge of [-7.02, 7.02]) strip('#aeb8c4', edge - .04, edge + .04, -9, far);
  for (const edge of [-.11, .11]) strip('#f4c95d', edge - .045, edge + .045, -9, far);
  for (let z = far - roadPhase; z > -12; z -= 12) {
    for (const edge of [-3.6, 3.6]) strip('#d4d9df', edge - .06, edge + .06, Math.max(-9, z), z + 4);
  }
  const block = Math.floor(buildingPhase / 30);
  for (let i = 11; i >= 0; i--) {
    const near = i * 30 - buildingPhase % 30 + 10;
    if (near < -8) continue;
    const variant = (block + i) % 21;
    building(-23, -10.6, near, 23, 11 + (variant * 7) % 17, variant);
    building(10.6, 24, near, 21, 9 + (variant * 5) % 21, variant + 1);
  }
  const visible = cars.filter((car) => car.z > 0 && car.z < far);
  visible.push({ worldX: laneX(playerLane), z: 0, color: '#ffcc54', facing: 1 });
  visible.sort((a, b) => b.z - a.z);
  for (const car of visible) drawCar(car.worldX ?? laneX(car.lane), car.z, car.color, car.facing);
}

function frame(now) {
  if (state === 'running' && last) {
    const elapsed = Math.min((now - last) / 1000, .06);
    const steps = Math.ceil(elapsed * 120);
    for (let i = 0; i < steps && state === 'running'; i++) step(elapsed / steps);
    updateHud();
  }
  last = now;
  render();
  requestAnimationFrame(frame);
}

resetTraffic();
updateHud();
requestAnimationFrame(frame);

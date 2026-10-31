// The cars' noses point along local +Z. In the chase camera a right turn is
// negative world yaw, so right controls must produce negative physics steering.
export function readDriveInput(keys, touch = {}) {
  const held = (codes, button) => codes.some(code => keys.has(code)) || !!touch[button];
  return {
    throttle: Number(held(['KeyW', 'ArrowUp'], 'gas')) - Number(held(['KeyS', 'ArrowDown'], 'brake')),
    steer: Number(held(['KeyA', 'ArrowLeft'], 'left')) - Number(held(['KeyD', 'ArrowRight'], 'right')),
    handbrake: keys.has('Space') || !!touch.handbrake
  };
}

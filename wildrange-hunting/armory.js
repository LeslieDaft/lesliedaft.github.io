// Reload timers must settle at exactly zero: a negative, truthy timer blocks firing.
export function advanceReload(remaining, dt) {
  return Math.max(0, (Number.isFinite(remaining) ? remaining : 0) - Math.max(0, dt));
}
export function fillMagazine(ammo, reserve, capacity) {
  const rounds = Math.max(0, Math.min(Math.floor(reserve), capacity - ammo));
  return { ammo: ammo + rounds, reserve: reserve - rounds, rounds };
}
export function canFire({ playing, driving, cooldown, reloading, ammo }) {
  return !!playing && !driving && cooldown <= 0 && reloading <= 0 && ammo > 0;
}
export function normalizeArmory(save, guns) {
  let owned = [...new Set([0, ...(Array.isArray(save?.owned) ? save.owned : [])])].filter(i => Number.isInteger(i) && guns[i]);
  let gun = owned.includes(save?.gun) ? save.gun : 0;
  let valid = (n, fallback) => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
  let ammo = valid(save?.ammo, guns[gun].mag), reserve = valid(save?.reserve, 35);
  reserve += Math.max(0, ammo - guns[gun].mag);
  return { owned, gun, ammo: Math.min(ammo, guns[gun].mag), reserve };
}

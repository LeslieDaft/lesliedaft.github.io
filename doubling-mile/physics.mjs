export function speedAt(mode, setting, seconds) {
  switch (mode) {
    case 'constant': return setting;
    case 'accel': return 2 + setting * seconds;
    case 'exp': return 2 ** (1 + seconds / setting);
    case 'super': return 2 ** (2 ** (seconds / setting));
    default: throw new RangeError('Unknown speed mode');
  }
}

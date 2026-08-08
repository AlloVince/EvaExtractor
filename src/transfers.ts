export const humanFileSizeToBytes = (str: string): number => {
  const bits = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
  const bytes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const match = str.match(/([\d.]+)([a-zA-Z]+)/);
  if (!match) {
    return Number.NaN;
  }
  const [, num, unit] = match;
  if (bytes.includes(unit)) {
    return Number.parseFloat(num) * (1000 ** bytes.indexOf(unit));
  }
  if (bits.includes(unit)) {
    return (Number.parseFloat(num) * (1000 ** bits.indexOf(unit))) / 8;
  }
  return Number.NaN;
};

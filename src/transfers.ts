export const humanFileSizeToBytes = (str: string): number => {
  const bits = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
  const bytes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const [, num, unit] = str.match(/([\d.]+)([a-zA-Z]+)/);
  if (bytes.includes(unit)) {
    return Number.parseFloat(num) * (1000 ** bytes.indexOf(unit));
  }
  return (Number.parseFloat(num) * (1000 ** bits.indexOf(unit))) / 8;
};

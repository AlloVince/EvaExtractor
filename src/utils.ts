import crypto from 'node:crypto';

interface Callable {
  (input: any): any;
}

export const pipe = (...ops: Callable[]) => ops.reduce((a: Callable, b: Callable) => {
  return (arg: any): any => {
    return b(a(arg));
  };
}, (value: any) => value);

interface HtmlPlusInterface {
  [x: string]: any;

  content: string;
}

const escapeMetaValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');

const unescapeMetaValue = (value: string): string =>
  value.replace(/\\\\|\\n/g, (match) => (match === '\\n' ? '\n' : '\\'));

export class HtmlPlus {
  static stringify(input: HtmlPlusInterface): string {
    const meta = Object
      .entries(input)
      .filter(([k]) => k !== 'content')
      .map(([k, v]) => `<!--${k}:${escapeMetaValue(String(v))}-->`)
      .join('\n');
    return meta ? [meta, input.content].join('\n') : input.content;
  }

  static parse(content: string = ''): HtmlPlusInterface {
    let lineStart = 0;
    let lineEnd = 0;
    let currentLine = '';
    const meta = [];
    while (lineStart < content.length) {
      lineEnd = content.indexOf('\n', lineStart);
      if (lineEnd === -1) {
        lineEnd = content.length;
      }
      currentLine = content.slice(lineStart, lineEnd);
      if (currentLine.endsWith('-->') && /^<!--\w+:.+-->$/.test(currentLine)) {
        meta.push(currentLine);
      } else {
        break;
      }
      lineStart = lineEnd + 1;
    }
    const parsedItem = meta
      .map((line) => {
        const [key, ...values] = line.slice(4, -3).split(':');
        return [key, unescapeMetaValue(values.join(':'))];
      })
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return Object.assign(
      parsedItem,
      {
        content: content.slice(lineStart),
      },
    );
  }
}

export const hashUrlToPath = (
  uri: string,
  depth: number = 3,
  extension: string = 'html',
): { hash: string, filename: string, folder: string, relative: string } => {
  const safeDepth = Math.max(0, Math.min(depth, 15));
  const hash = crypto.createHash('md5').update(uri).digest('hex');
  const blockSize = 2;
  const blocks = hash.split('');
  const paths = [];
  let i;
  for (i = 0; i < safeDepth; i += 1) {
    paths.push(blocks.slice(i * blockSize, (i + 1) * blockSize).join(''));
  }
  const filename = `${blocks.slice(i * blockSize).join('')}.${extension}`;
  const folder = paths.join('/');
  paths.push(filename);

  return { hash, filename, folder, relative: paths.join('/') };
};

import crypto from 'crypto';

interface Callable {
  (input: any): any;
}

export const pipe = (...ops: Callable[]) => ops.reduce((a: Callable, b: Callable) => {
  return (arg: any): any => {
    return b(a(arg));
  };
});

interface HtmlPlusInterface {
  [x: string]: any;

  content: string;
}

export class HtmlPlus {
  static stringify(input: HtmlPlusInterface): string {
    const meta = Object
      .entries(input)
      .filter(([k]) => k !== 'content')
      .map(([k, v]) => `<!--${k}:${v}-->`)
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
        return [key, values.join(':')];
      })
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return Object.assign(
      parsedItem,
      {
        content: content.substr(lineStart),
      },
    );
  }
}

export const hashUrlToPath = (uri: string, depth: number = 3, extension: string = 'html') => {
  const hash = crypto.createHash('md5').update(uri).digest('hex');
  const blockSize = 2;
  const blocks = hash.split('');
  const paths = [];
  let i;
  for (i = 0; i < depth; i += 1) {
    paths.push(blocks.slice(i * blockSize, (i + 1) * blockSize).join(''));
  }
  const filename = `${blocks.slice(i * blockSize).join('')}.${extension}`;
  const folder = paths.join('/');
  paths.push(filename);

  return { hash, filename, folder, relative: paths.join('/') };
};

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

  static parse(content: string): HtmlPlusInterface {
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

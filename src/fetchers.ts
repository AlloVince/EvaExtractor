import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buffer as streamBuffer, text as streamText } from 'node:stream/consumers';

export interface FetcherInterface {
  fetcher: any;

  fetch(uri: string): Promise<string>;

  fetchBuffer(uri: string): Promise<Buffer>;
}

const resolveInsideRoot = (root: string | undefined, uri: string): string => {
  const base = root ? path.resolve(root) : undefined;
  const full = path.resolve(base ?? process.cwd(), uri);
  if (base && full !== base && !full.startsWith(`${base}${path.sep}`)) {
    throw new Error(`refusing to read outside of root: ${uri}`);
  }
  return full;
};

export class FileFetcher implements FetcherInterface {
  fetcher: any;

  async fetch(uri: string): Promise<string> {
    const root = process.env['FILE_FETCHER_ROOT'];
    return fs.readFile(resolveInsideRoot(root, uri), 'utf8');
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const root = process.env['FILE_FETCHER_ROOT'];
    return fs.readFile(resolveInsideRoot(root, uri));
  }
}

export class OssFetcher implements FetcherInterface {
  fetcher: any;

  constructor(oss: any) {
    this.fetcher = oss;
  }

  async fetch(uri: string): Promise<string> {
    const { content } = await this.fetcher.get(uri);
    return content.toString();
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const { content } = await this.fetcher.get(uri);
    return content;
  }
}

export class HttpFetcher implements FetcherInterface {
  fetcher: any;

  constructor(client: any) {
    this.fetcher = client;
  }

  async fetch(uri: string): Promise<string> {
    const { body } = await this.fetcher.request(uri);
    if (typeof body === 'string') {
      return body;
    }
    if (Buffer.isBuffer(body)) {
      return body.toString();
    }
    return streamText(body);
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const { body } = await this.fetcher.request(uri);
    if (typeof body === 'string') {
      return Buffer.from(body);
    }
    if (Buffer.isBuffer(body)) {
      return body;
    }
    return streamBuffer(body);
  }
}

export class MinioFetcher implements FetcherInterface {
  fetcher: any;
  bucket: string;

  constructor(client: any, bucket: string) {
    this.fetcher = client;
    this.bucket = bucket;
  }

  async fetch(uri: string): Promise<string> {
    const stream = await this.fetcher.getObject(this.bucket, uri);
    return streamText(stream);
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const stream = await this.fetcher.getObject(this.bucket, uri);
    return streamBuffer(stream);
  }
}

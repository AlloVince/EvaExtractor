import { promises as fs } from 'fs';
import getStream from 'get-stream';

export interface FetcherInterface {
  fetcher: any;

  fetch(uri: string): Promise<string>;

  fetchBuffer(uri: string): Promise<Buffer>;
}

export class FileFetcher implements FetcherInterface {
  fetcher: any;

  async fetch(uri: string): Promise<string> {
    const fullpath = process.env.FILE_FETCHER_ROOT ?
      [process.env.FILE_FETCHER_ROOT, uri].join('/') : uri;
    return fs.readFile(fullpath, 'utf8');
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const fullpath = process.env.FILE_FETCHER_ROOT ?
      [process.env.FILE_FETCHER_ROOT, uri].join('/') : uri;
    return fs.readFile(fullpath);
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
    return body;
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const { body } = await this.fetcher.request(uri);
    return Buffer.from(body);
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
    return getStream(stream);
  }

  async fetchBuffer(uri: string): Promise<Buffer> {
    const stream = await this.fetcher.getObject(this.bucket, uri);
    return getStream.buffer(stream);
  }
}

import { promises as fsPromise } from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

export interface StorageInterface {
  store: any;

  access(uri: string): Promise<any>;

  write(path: string, content: string): Promise<any>;
}

export class FileStorage implements StorageInterface {
  store: any;
  root: string;

  constructor(root: string) {
    this.root = root;
    this.store = fsPromise;
  }

  async access(relative: string) {
    const localPath = `${this.root}/${relative}`;
    await fsPromise.access(localPath);
    return localPath;
  }

  async write(relative: string, content: string) {
    const localPath = `${this.root}/${relative}`;
    mkdirp.sync(path.dirname(localPath));
    await fsPromise.writeFile(localPath, content);
    return localPath;
  }
}

export class OssStorage {
  store: any;
  root: string;

  constructor(root: string, oss: any) {
    this.store = oss;
    this.root = root;
  }

  async access(relative: string) {
    const localPath = `${this.root}/${relative}`;
    await this.store.head(localPath);
    return localPath;
  }

  async write(relative: string, content: string) {
    const localPath = `${this.root}/${relative}`;
    await this.store.put(localPath, Buffer.from(content));
    return localPath;
  }
}

export class MinioStorage {
  store: any;
  root: string;
  bucket: string;

  constructor(root: string, minio: any, bucket: string) {
    this.store = minio;
    this.root = root;
    this.bucket = bucket;
  }

  async access(relative: string) {
    const localPath = `${this.root}/${relative}`;
    return this.store.statObject(this.bucket, localPath);
  }

  async write(relative: string, content: string, meta: any) {
    const localPath = `${this.root}/${relative}`;
    await this.store.putObject(this.bucket, localPath, Buffer.from(content), meta);
    return localPath;
  }
}

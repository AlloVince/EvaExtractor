/**
 * EvaExtractor — 轻量 TypeScript 库，从本地/HTTP/OSS/MinIO 抓取、解析、提取与转换内容。
 * @packageDocumentation
 */
import * as cheerio from 'cheerio';
import { HtmlPlus, pipe } from './utils';
import { FileFetcher, HttpFetcher, OssFetcher, MinioFetcher } from './fetchers';
import type { FetcherInterface } from './fetchers';

export enum STORAGES {
  FILE = 'file',
  OSS = 'oss',
  HTTP = 'http',
  S3 = 's3',
}

export type Constructor = new (...args: any[]) => any;
export type ExtractRule =
  ($: any, item: ParsedItemInterface, processor?: ProcessorInterface) => any;
export type TransferRule = (item: any, processor?: ProcessorInterface) => any;

export interface MetaItemInterface {
  storage: STORAGES;
  uri: string;
}

export interface FetchedItemInterface {
  storage: STORAGES;
  uri: string;
  content: string;
}

export interface ParsedItemInterface {
  url: string;
  version?: string;
  timestamp?: string;
  content: string | object;

  [x: string]: unknown;
}

export interface ExtractRulesInterface {
  [x: string]: ExtractRule | ExtractRulesInterface;
}

export interface TransferRulesInterface {
  [x: string]: TransferRule[];
}

export interface ProcessorInterface {
  extractRules: ExtractRulesInterface;
  transferRules: TransferRulesInterface;
  metaItem: MetaItemInterface;
  fetchedItem: FetchedItemInterface;
  parsedItem: ParsedItemInterface;
  extractedItem: object;
  transferedItem: object;
  loadItem: object;

  process(): Promise<this>;

  fetch(): this | Promise<this>;

  parse(): this | Promise<this>;

  extract(): this | Promise<this>;

  transfer(): this | Promise<this>;

  load(): this | Promise<this>;
}

abstract class AbstractProcessor {
  fetcher!: FetcherInterface;
  extractRules: Record<string, ExtractRule | ExtractRulesInterface> = {};
  transferRules: Record<string, TransferRule[]> = {};
  metaItem!: MetaItemInterface;
  fetchedItem!: FetchedItemInterface;
  parsedItem!: ParsedItemInterface;
  extractedItem!: Record<string, any>;
  transferedItem!: Record<string, any>;
  loadItem!: Record<string, any>;

  async fetch(): Promise<this> {
    return this;
  }

  async parse(): Promise<this> {
    return this;
  }

  async extract(): Promise<this> {
    return this;
  }

  async transfer(): Promise<this> {
    return this;
  }

  async load(): Promise<this> {
    return this;
  }

  async process(): Promise<this> {
    await this.fetch();
    await this.parse();
    await this.extract();
    await this.transfer();
    return await this.load();
  }

  protected assertFetched(): void {
    if (this.fetchedItem === undefined) {
      throw new Error('fetch() must be called before parse()');
    }
  }

  protected assertParsed(): void {
    if (this.parsedItem === undefined) {
      throw new Error('parse() must be called before extract()');
    }
  }

  protected assertExtracted(): void {
    if (this.extractedItem === undefined) {
      throw new Error('extract() must be called before transfer()');
    }
  }

  getExtractRules(): ExtractRulesInterface {
    return this.extractRules;
  }

  getTransferRules(): TransferRulesInterface {
    return this.transferRules;
  }

  setFetchedItem(item: FetchedItemInterface): this {
    this.fetchedItem = item;
    return this;
  }

  getFetchedItem(): FetchedItemInterface {
    return this.fetchedItem;
  }

  setParsedItem(item: ParsedItemInterface): this {
    this.parsedItem = item;
    return this;
  }

  getParsedItem(): ParsedItemInterface {
    return this.parsedItem;
  }

  setExtractedItem(item: any): this {
    this.extractedItem = item;
    return this;
  }

  getExtractedItem(): Record<string, any> {
    return this.extractedItem;
  }

  setTransferedItem(item: any): this {
    this.transferedItem = item;
    return this;
  }

  getTransferedItem(): Record<string, any> {
    return this.transferedItem;
  }

  getLoadItem(): Record<string, any> {
    return this.loadItem;
  }

  setLoadItem(item: any): this {
    this.loadItem = item;
    return this;
  }

  debug(): any[] {
    return [
      '-----META_ITEM-----',
      this.metaItem,
      '-----META_ITEM-=>FETCHED_ITEM-----',
      this.fetchedItem,
      '-----META_ITEM-=>PARSED_ITEM-----',
      this.parsedItem,
      '-----PARSED_ITEM-=>EXTRACTED_ITEM-----',
      this.extractedItem,
      '-----EXTRACTED_ITEM-=>TRANSFERED_ITEM-----',
      this.transferedItem,
    ];
  }

  output(): Record<string, any> {
    return this.transferedItem;
  }
}

export const factoryFetcher = (storage: STORAGES, mapping: {
  [x: string]: any[];
}): FetcherInterface => {
  const fetcherClass: Constructor = ({
    file: FileFetcher,
    oss: OssFetcher,
    http: HttpFetcher,
    s3: MinioFetcher,
  })[storage];
  return new fetcherClass(...mapping[storage]);
};

export class HtmlProcessor extends AbstractProcessor implements ProcessorInterface {

  constructor(metaItem: MetaItemInterface, fetcher?: FetcherInterface) {
    super();
    this.metaItem = metaItem;
    this.fetcher = fetcher || new FileFetcher();
  }

  /**
   * MetaItem convert to FetchedItem
   * @returns {Promise<this>}
   */
  override async fetch(): Promise<this> {
    const { storage, uri } = this.metaItem;
    this.fetchedItem = {
      storage,
      uri,
      content: await this.fetcher.fetch(uri),
    };
    return this;
  }

  /**
   * FetchedItem convert to ParsedItem
   * @returns {Promise<this>}
   */
  override async parse(): Promise<this> {
    this.assertFetched();
    const { content } = this.fetchedItem;
    this.parsedItem = Object.assign(
      {
        url: '',
        version: '',
        timestamp: '',
      },
      HtmlPlus.parse(content),
    );
    return this;
  }

  /**
   * ParsedItem convert to ExtractedItem
   * @returns {Promise<this>}
   */
  override async extract(): Promise<this> {
    this.assertParsed();
    const $ = cheerio.load(this.parsedItem.content.toString());
    this.extractedItem = Object
      .entries(this.getExtractRules())
      .map(
    ([key, rule]) => [key, typeof rule === 'function' ? rule($, this.parsedItem) : rule],
      )
      .reduce<Record<string, unknown>>((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return this;
  }

  /**
   * ExtractedItem convert to TransferedItem
   * @returns {Promise<this>}
   */
  override async transfer(): Promise<this> {
    this.assertExtracted();
    const rules = this.getTransferRules();

    this.transferedItem = Object
      .entries(this.extractedItem)
      .map(
        ([key, value]: [string, any]) =>
          (rules[key] ? [key, pipe(...rules[key])(value)] : [key, value]),
      )
      .reduce<Record<string, unknown>>((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return this;
  }

  /**
   * @returns {Promise<this>}
   */
  override async load(): Promise<this> {
    throw new Error('load require override in child class');
  }
}

export class JsonProcessor extends AbstractProcessor implements ProcessorInterface {

  constructor(metaItem: MetaItemInterface, fetcher?: FetcherInterface) {
    super();
    this.metaItem = metaItem;
    this.fetcher = fetcher || new FileFetcher();
  }

  /**
   * MetaItem convert to FetchedItem
   * @returns {Promise<this>}
   */
  override async fetch(): Promise<this> {
    const { storage, uri } = this.metaItem;
    this.fetchedItem = {
      storage,
      uri,
      content: await this.fetcher.fetch(uri),
    };
    return this;
  }

  /**
   * FetchedItem convert to ParsedItem
   * @returns {Promise<this>}
   */
  override async parse(): Promise<this> {
    this.assertFetched();
    const { content } = this.fetchedItem;
    this.parsedItem = Object.assign(
      {
        url: '',
        version: '',
        timestamp: '',
      },
      JSON.parse(content),
    );
    return this;
  }

  /**
   * ParsedItem convert to ExtractedItem
   * @returns {Promise<this>}
   */
  override async extract(): Promise<this> {
    this.assertParsed();
    this.extractedItem = this.parsedItem;
    return this;
  }

  /**
   * ExtractedItem convert to TransferedItem
   * @returns {Promise<this>}
   */
  override async transfer(): Promise<this> {
    this.assertExtracted();
    this.transferedItem = this.extractedItem;
    return this;
  }

  /**
   * @returns {Promise<this>}
   */
  override async load(): Promise<this> {
    throw new Error('load require override in child class');
  }
}

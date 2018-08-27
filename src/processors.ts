import { promises as fs } from 'fs';
import assert from 'assert';
import cheerio from 'cheerio';
import { HtmlPlus, pipe } from './utils';

export enum STORAGES {
  FILE = 'file',
  OSS = 'oss',
}

export type Constructor = (new (...args: any[]) => any);
export type ExtractRule =
  ($: any, item: ParsedItemInterface, processor?: ProcessorInterface) => any;
export type TransferRule = (item: any, processor?: ProcessorInterface) => any;

export interface FetcherInterface {
  fetcher: any;

  fetch(uri: string): Promise<any>;
}

export interface MetaItemInterface {
  storage: STORAGES;
  uri: string;
}

export interface FetchedItemInterface {
  uri: string;
  content: string;
}

export interface ParsedItemInterface {
  url: string;
  version?: string;
  timestamp?: string;
  content: string | object;

  [x: string]: any;
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

  process(): any;

  fetch(): this | Promise<this>;

  parse(): this | Promise<this>;

  extract(): this | Promise<this>;

  transfer(): this | Promise<this>;

  load(): this | Promise<this>;
}

abstract class AbstractProcessor {
  extractRules: {};
  transferRules: {};
  metaItem: MetaItemInterface;
  fetchedItem: FetchedItemInterface;
  parsedItem: ParsedItemInterface;
  extractedItem: object;
  transferedItem: object;
  loadItem: object;

  async fetch() {
    return this;
  }

  async parse() {
    return this;
  }

  async extract() {
    return this;
  }

  async transfer() {
    return this;
  }

  async load() {
    return this;
  }

  async process() {
    await this.fetch();
    await this.parse();
    await this.extract();
    await this.transfer();
    return await this.load();
  }

  getExtractRules(): ExtractRulesInterface {
    return this.extractRules;
  }

  getTransferRules(): TransferRulesInterface {
    return this.transferRules;
  }

  setFetchedItem(item: FetchedItemInterface) {
    this.fetchedItem = item;
    return this;
  }

  getFetchedItem() {
    return this.fetchedItem;
  }

  setParsedItem(item: ParsedItemInterface) {
    this.parsedItem = item;
    return this;
  }

  getParsedItem() {
    return this.parsedItem;
  }

  setExtractedItem(item: any) {
    this.extractedItem = item;
    return this;
  }

  getExtractedItem() {
    return this.extractedItem;
  }

  setTransferedItem(item: any) {
    this.transferedItem = item;
    return this;
  }

  getTransferedItem() {
    return this.transferedItem;
  }

  getLoadItem() {
    return this.loadItem;
  }
}

export class FileFetcher implements FetcherInterface {
  fetcher: any;

  async fetch(uri: string): Promise<string> {
    const fullpath = process.env.FILE_FETCHER_ROOT ?
      [process.env.FILE_FETCHER_ROOT, uri].join('/') : uri;
    return fs.readFile(fullpath, 'utf8');
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
}

export class HtmlProcessor extends AbstractProcessor implements ProcessorInterface {
  static fetchers: {
    [STORAGES.FILE]: FetcherInterface,
    [STORAGES.OSS]: FetcherInterface,
  };

  constructor(metaItem: MetaItemInterface) {
    super();
    this.metaItem = metaItem;
  }

  static registerFetcher(storage: STORAGES, fetcher: FetcherInterface) {
    HtmlProcessor.fetchers[storage] = fetcher;
  }

  async fetch() {
    const { storage, uri } = this.metaItem;
    const fetcher: FetcherInterface = HtmlProcessor.fetchers[storage];
    this.fetchedItem = await fetcher.fetch(uri);
    return this;
  }

  async parse() {
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
   * @returns {HtmlProcessor}
   */
  async extract() {
    const $ = cheerio.load(this.parsedItem.content.toString());
    this.extractedItem = Object
      .entries(this.getExtractRules())
      .map(
        ([key, rule]: [string, ExtractRule]) => [key, rule($, this.parsedItem)],
      )
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return this;
  }

  /**
   * ExtractedItem convert to TransferedItem
   * @returns {HtmlProcessor}
   */
  async transfer() {
    const rules = this.getTransferRules();

    this.transferedItem = Object
      .entries(this.extractedItem)
      .map(
        ([key, value]: [string, any]) =>
          (rules[key] ? [key, pipe(...rules[key])(value)] : [key, value]),
      )
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    return this;
  }

  /**
   * Child class implement
   */
  async load() {
    assert(false, 'load require override in child class');
    return this;
  }

  debug() {
    return [
      '-----META_ITEM-----',
      this.metaItem,
      '-----META_ITEM-=>PARSED_ITEM-----',
      this.parsedItem,
      '-----PARSED_ITEM-=>EXTRACTED_ITEM-----',
      this.extractedItem,
      '-----EXTRACTED_ITEM-=>TRANSFERED_ITEM-----',
      this.transferedItem,
    ];
  }

  output() {
    return this.transferedItem;
  }
}

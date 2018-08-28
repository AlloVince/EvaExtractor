import assert from 'assert';
import cheerio from 'cheerio';
import { HtmlPlus, pipe } from './utils';
import { FetcherInterface, FileFetcher, HttpFetcher, OssFetcher } from './fetchers';

export enum STORAGES {
  FILE = 'file',
  OSS = 'oss',
  HTTP = 'http',
}

export type Constructor = (new (...args: any[]) => any);
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
  fetcher: FetcherInterface;
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

export const factoryFetcher = (storage: STORAGES, mapping: {
  [x: string]: any;
}): FetcherInterface => {
  const fetcherClass: Constructor = ({
    file: FileFetcher,
    oss: OssFetcher,
    http: HttpFetcher,
  })[storage];
  return new fetcherClass(mapping[storage]);
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
  async fetch() {
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
   * @returns {Promise<this>}
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
   * @returns {Promise<this>}
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
   * @returns {Promise<this>}
   */
  async load() {
    assert(false, 'load require override in child class');
    return this;
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
  async fetch() {
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
  async parse() {
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
  async extract() {
    this.extractedItem = this.parsedItem;
    return this;
  }

  /**
   * ExtractedItem convert to TransferedItem
   * @returns {Promise<this>}
   */
  async transfer() {
    this.transferedItem = this.extractedItem;
    return this;
  }

  /**
   * @returns {Promise<this>}
   */
  async load() {
    assert(false, 'load require override in child class');
    return this;
  }
}

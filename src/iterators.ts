import fg from 'fast-glob';

export interface IteratorInterface {
  getItems(input: any): AsyncIterableIterator<any>;
}

export enum ORDER {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FileIterator implements IteratorInterface {
  async* getItems(
    { prefix, pattern = '**/*.html' }: { prefix: string, pattern: string },
  ): AsyncIterableIterator<{ file: { name: string | Buffer } }> {
    const stream = fg.stream([prefix, pattern].join(prefix.endsWith('/') ? '' : '/'));
    for await (const name of stream) {
      yield {
        file: {
          name,
        },
      };
    }
  }
}

export class OssIterator implements IteratorInterface {
  oss: any;
  objects: any[];
  nextMarker: string;
  cursor: string;
  count: number;
  limit: number;

  constructor(oss: any) {
    this.oss = oss;
    this.objects = [];
    this.nextMarker = '';
    this.cursor = null;
    this.count = 0;
    this.limit = 1000;
  }

  async* getItems(
    {
      prefix,
      startCursor,
      max = -1,
    }: { prefix: string, startCursor: string, max: number },
  ): AsyncIterableIterator<{
    count: number, pageOffset: number, file: string, cursor: string, nextCursor: string,
  }> {
    this.cursor = startCursor;
    ({ objects: this.objects, nextMarker: this.nextMarker } = await this.oss.list({
      prefix,
      marker: startCursor,
      'max-keys': this.limit,
    }));
    while (this.objects.length >= 1 || (max > 0 && this.count > max)) {
      yield {
        count: this.count,
        pageOffset: this.limit - this.objects.length,
        file: this.objects.shift(),
        cursor: this.cursor,
        nextCursor: this.nextMarker,
      };
      if (this.objects.length < 1 && this.nextMarker) {
        this.cursor = this.nextMarker;
        ({ objects: this.objects, nextMarker: this.nextMarker } = await this.oss.list({
          prefix,
          marker: this.nextMarker,
          'max-keys': this.limit,
        }));
      }
      this.count += 1;
    }
  }
}

export class DatabaseIterator implements IteratorInterface {
  entity: any;
  primaryKey: string;
  limit: number;

  constructor(entity: any, primaryKey = 'id', limit = 100) {
    this.entity = entity;
    this.primaryKey = primaryKey;
    this.limit = limit;
  }

  async* getItems(input: { startCursor: number, whereCondition: object, direction: ORDER } = {
    startCursor: 0,
    whereCondition: {},
    direction: ORDER.ASC,
  }) {
    const { startCursor, whereCondition, direction } = input;
    let offset = startCursor;
    let items = await this.entity.findAll({
      offset,
      where: whereCondition,
      order: [[this.primaryKey, direction]],
      limit: this.limit,
    });

    while (items.length > 0) {
      yield items.shift();
      if (items.length < 1) {
        offset += this.limit;
        items = await this.entity.findAll({
          offset,
          where: whereCondition,
          order: [[this.primaryKey, 'ASC']],
          limit: this.limit,
        });
      }
    }
  }
}

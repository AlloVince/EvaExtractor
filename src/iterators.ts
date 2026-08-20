import fg from 'fast-glob';

export interface IteratorInterface {
  getItems(input: any): AsyncIterableIterator<any>;
}

export interface ObjectIteratorItem<TFile = Record<string, unknown>> {
  file: TFile;
  cursor: string;
}

export enum ORDER {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FileIterator implements IteratorInterface {
  async* getItems(
    { prefix, pattern = '**/*.html' }: { prefix?: string, pattern?: string },
  ): AsyncIterableIterator<ObjectIteratorItem<{ name: string | Buffer }>> {
    const glob = prefix ? [prefix, pattern].join(prefix.endsWith('/') ? '' : '/') : pattern;
    const stream = fg.stream(glob);
    for await (const name of stream) {
      yield {
        file: {
          name,
        },
        cursor: String(name),
      };
    }
  }
}

export class MinioIterator implements IteratorInterface {
  minio: any;
  defaultBucket?: string;

  constructor(minio: any, defaultBucket?: string) {
    this.minio = minio;
    this.defaultBucket = defaultBucket;
  }

  async* getItems(
    {
      prefix = '',
      startCursor = '',
      bucket,
    }: { prefix?: string, startCursor?: string, bucket?: string },
  ): AsyncIterableIterator<ObjectIteratorItem<{ name: string | Buffer }>> {
    const stream = this.minio.listObjectsV2(
      bucket || this.defaultBucket,
      prefix,
      true,
      startCursor,
    );
    for await (const item of stream) {
      yield { file: item, cursor: String(item.name) };
    }
  }
}

export class OssIterator implements IteratorInterface {
  oss: any;
  objects: any[];
  nextMarker = '';
  cursor = '';
  count = 0;
  limit = 1000;

  constructor(oss: any) {
    this.oss = oss;
    this.objects = [];
  }

  async* getItems(
    {
      prefix,
      startCursor = '',
      max = -1,
    }: { prefix: string, startCursor?: string, max?: number },
  ): AsyncIterableIterator<ObjectIteratorItem & {
    count: number, pageOffset: number, nextCursor: string,
  }> {
    this.cursor = startCursor;
    this.count = 0;
    this.objects = [];
    this.nextMarker = '';
    ({ objects: this.objects, nextMarker: this.nextMarker } = await this.oss.list({
      prefix,
      marker: startCursor,
      'max-keys': this.limit,
    }));

    while (this.objects.length >= 1) {
      yield {
        count: this.count,
        pageOffset: this.limit - this.objects.length,
        file: this.objects.shift(),
        cursor: this.cursor,
        nextCursor: this.nextMarker,
      };
      this.count += 1;

      // Stop early when the caller requested a maximum number of items.
      if (max > 0 && this.count >= max) {
        break;
      }

      if (this.objects.length < 1 && this.nextMarker) {
        this.cursor = this.nextMarker;
        ({ objects: this.objects, nextMarker: this.nextMarker } = await this.oss.list({
          prefix,
          marker: this.nextMarker,
          'max-keys': this.limit,
        }));
      }
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

  async* getItems(input: { startCursor?: number, whereCondition?: object, direction?: ORDER } = {
    startCursor: 0,
    whereCondition: {},
    direction: ORDER.ASC,
  }) {
    const { startCursor = 0, whereCondition = {}, direction = ORDER.ASC } = input;
    let lastSeenId = startCursor;
    let items = await this.entity.findAll({
      where: { ...whereCondition, [this.primaryKey]: direction === ORDER.ASC
        ? { $gt: lastSeenId }
        : { $lt: lastSeenId } },
      order: [[this.primaryKey, direction]],
      limit: this.limit,
    });

    while (items.length > 0) {
      const item = items.shift();
      yield item;
      lastSeenId = item[this.primaryKey];
      if (items.length < 1) {
        items = await this.entity.findAll({
          where: { ...whereCondition, [this.primaryKey]: direction === ORDER.ASC
            ? { $gt: lastSeenId }
            : { $lt: lastSeenId } },
          order: [[this.primaryKey, direction]],
          limit: this.limit,
        });
      }
    }
  }
}

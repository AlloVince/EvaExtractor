import { MinioIterator } from '../src/iterators';
import { MinioFetcher } from '../src/fetchers';
import Minio from 'minio';

const client = new Minio.Client({
  endPoint: '',
  port: 9000,
  useSSL: false,
  accessKey: '',
  secretKey: '',
});

const iterator = new MinioIterator(
  client,
  'dev',
);

const fetcher = new MinioFetcher(client, 'dev');

(async () => {
  for await (const item of iterator.getItems({
    prefix: '',
  })) {
    console.log(item);
  }

  const res = await fetcher.fetch('');
  console.log(res);
})();

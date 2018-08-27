import test from 'ava';
import { foo } from '../src/index';

test('demo', async (t) => {
  t.is(foo(), 'bar');
});

import test from 'ava';
import { setup, cleanup } from './utils';

const port = Math.floor(Math.random() * 1000 + 9000);

test.serial('can upload and download file', async (t) => {
  // GIVEN
  const data = await setup({
    port: String(port),
    users: {
      test: { password: 'test' },
    },
  });
  await data.client.connect({
    host: '127.0.0.1',
    port,
    username: 'test',
    password: 'test',
  });
  const content = 'My file content is awesome';

  // WHEN
  await data.client.put(Buffer.from(content), '/test/file.txt');
  const read = await data.client.get('/test/file.txt');

  // THEN
  t.is(read.toString(), content);

  await cleanup(data);
});

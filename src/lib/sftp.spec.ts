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

test.serial('can move and delete file', async (t) => {
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
  t.is(read.toString(), content);

  await data.client.rename('/test/file.txt', '/test/fileRenamed.txt');
  const stat = await data.client.stat('/test/fileRenamed.txt');
  t.assert(stat.isFile);
  const read2 = await data.client.get('/test/fileRenamed.txt');
  t.is(read2.toString(), content);

  await data.client.delete('/test/fileRenamed.txt');
  t.throwsAsync(() => data.client.get('/test/fileRenamed.txt'));
  // THEN

  await cleanup(data);
});

test.serial('can read from directory', async (t) => {
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
  const files = await data.client.list('/test');

  // THEN

  t.truthy(files.find((f) => f.name === '/test/file.txt'));

  t.throwsAsync(() => data.client.list('/unknown'));

  await cleanup(data);
});

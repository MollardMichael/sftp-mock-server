import { clientPrivateKey, clientPublicKey } from './data/keys';
import test from 'ava';

import { setup, cleanup } from './utils';

const port = Math.floor(Math.random() * 1000 + 9000);

test.serial('can create and close a sftp server', async (t) => {
  // GIVEN & WHEN
  const data = await setup({ port: String(port) });

  // THEN
  await cleanup({ server: data.server });
  t.pass();
});

test.serial(
  'can connect to the server with a client using password',
  async (t) => {
    // GIVEN
    const data = await setup({
      port: String(port),
      users: {
        test: { password: 'test' },
      },
    });

    // WHEN
    await data.client.connect({
      host: '127.0.0.1',
      port,
      username: 'test',
      password: 'test',
    });

    // THEN
    await cleanup(data);
    t.pass();
  }
);

test.serial(
  'cannot connect to the server with the wrong password',
  async (t) => {
    // GIVEN
    const data = await setup({
      port: String(port),
      users: {
        test: { password: 'test' },
      },
    });

    // WHEN
    const error = await t.throwsAsync(() =>
      data.client.connect({
        host: '127.0.0.1',
        port,
        username: 'test',
        password: 'wrong-password',
      })
    );

    // THEN
    t.is((error as any).code, 'ERR_GENERIC_CLIENT');
    await cleanup(data);
  }
);

test.serial(
  'can connect to the server with a client using public key',
  async (t) => {
    // GIVEN
    const data = await setup({
      port: String(port),
      users: {
        test: { publicKey: clientPublicKey },
      },
    });

    // WHEN
    await data.client.connect({
      host: '127.0.0.1',
      port,
      username: 'test',
      privateKey: clientPrivateKey,
    });

    // THEN
    await cleanup(data);
    t.pass();
  }
);

test.serial('can get file information for unknown file', async (t) => {
  // GIVEN
  const data = await setup({ port: String(port) });

  // WHEN
  await data.client.connect({
    host: '127.0.0.1',
    port,
    username: 'test',
    password: 'password',
  });

  const result = await data.client.exists('/test');
  t.false(result);

  // THEN
  await cleanup(data);
});

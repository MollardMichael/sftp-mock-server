import { Server } from 'ssh2';
import Client from 'ssh2-sftp-client';

import { closeServer, createSftpMockServer, MockServerConfig } from './server';

const debug = console.log;

export const setup = async (serverConfig: MockServerConfig = {}) => ({
  server: await createSftpMockServer({
    ...serverConfig,
    debug,
  }),
  client: new Client(),
});

export const cleanup = async ({
  client,
  server,
}: {
  client?: Client;
  server?: Server;
}) => {
  await client?.end();
  server ? await closeServer(server) : undefined;
};

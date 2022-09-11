import {
  AcceptConnection,
  AuthContext,
  Connection,
  RejectConnection,
  Server,
  Session,
  utils,
} from 'ssh2';
import { MarkRequired } from 'ts-essentials';

import { UnreachableCaseError } from '../utils';

import { clientPublicKey, serverPrivateKey } from './data/keys';
import { handleSftpSession } from './sftp';

export type Context = {
  debug: Debug;
  users: Record<string, { password?: string; publicKey?: string }>;
};

/**
 * Config that can be passed to the server at creation to control it's behavior
 */
export type MockServerConfig = {
  port?: string;
  hostname?: string;
  debug?: Debug;
  users?: Record<string, { password?: string; publicKey?: string }>;
};

/**
 * Function that can be used to log debug information
 */
type Debug = (message: string) => void;

/**
 * Create a new sftp server listening on a provided port
 */
type CreateServer = (config?: MockServerConfig) => Promise<Server>;

/**
 * Close an existing sftp server
 */
type CloseServer = (server: Server, debug?: Debug) => Promise<void>;

const defaultData: MarkRequired<
  MockServerConfig,
  'port' | 'debug' | 'hostname' | 'users'
> = {
  port: '9393',
  hostname: '127.0.0.1',
  debug: () => {
    return;
  },
  users: {
    test: { password: 'password', publicKey: clientPublicKey },
  },
};

/**
 * Call this function to create a new mock server
 * By default the server will listen on 127.0.0.1:9393
 *
 * @param config used to override the port and hostname that the server will listen on.
 * @returns a reference to the mock server
 */
export const createSftpMockServer: CreateServer = (config = {}) => {
  const conf = {
    ...defaultData,
    ...config,
  };

  return new Promise((resolve) => {
    const server = new Server({
      hostKeys: [serverPrivateKey],
    });

    server.on(
      'connection',
      handleNewConnection({
        debug: conf.debug,
        users: conf.users,
      })
    );

    server.listen(Number(conf.port), conf.hostname, () => {
      conf.debug(`Listening on port ${conf.port} at ${conf.hostname}`);
      resolve(server);
    });
  });
};

export const closeServer: CloseServer = (
  server: Server,
  debug: Debug = defaultData.debug
) => {
  debug('Close sftp server');
  return new Promise((resolve, reject) =>
    server.close((error) => {
      if (error) {
        debug('Failed to close sftp server');
        reject(error);
      }
      debug('Closed sftp server successfully');
      resolve();
    })
  );
};

const handleNewConnection = (ctx: Context) => (connection: Connection) => {
  ctx.debug(`Client connected!`);
  connection.on('authentication', checkAuthentication(ctx));
  connection.on('ready', () => ctx.debug('ready called'));
  connection.on('close', () => ctx.debug('close called'));
  connection.on('error', () => ctx.debug('error called'));
  connection.on('greeting', () => ctx.debug('greeting called'));
  connection.on('handshake', () => ctx.debug('handshake called'));
  connection.on('end', () => ctx.debug('end called'));
  connection.on('request', () => ctx.debug('request called'));
  connection.on('session', handleClientSession(ctx));
  connection.on('tcpip', () => ctx.debug('tcpip called'));
  connection.on('rekey', () => ctx.debug('rekey called'));
  connection.on('openssh.streamlocal', () =>
    ctx.debug('openssh.streamlocal called')
  );
};

const checkAuthentication = (ctx: Context) => (context: AuthContext) => {
  ctx.debug(`Client tried to authenticate using ${context.method}`);
  const targetInfo = ctx.users[context.username];
  switch (context.method) {
    case 'hostbased':
      return context.accept();
    case 'password': {
      return targetInfo !== undefined &&
        targetInfo?.password &&
        targetInfo.password === context.password
        ? context.accept()
        : context.reject(['publickey']);
    }
    case 'keyboard-interactive':
      return context.accept();
    case 'publickey': {
      const parsedKey = utils.parseKey(targetInfo.publicKey!);
      if (parsedKey instanceof Error) {
        ctx.debug('Could not parse public key ' + parsedKey);
        return context.reject();
      }

      const match =
        context.key.algo === parsedKey.type &&
        context.key.data.equals(parsedKey.getPublicSSH()) &&
        (!context.signature ||
          !context.blob ||
          parsedKey.verify(context.blob, context.signature));

      ctx.debug(`Verify key ended up with result: ${match}`);
      return match ? context.accept() : context.reject();
    }
    case 'none':
      return context.reject(['password', 'publickey']);
    default:
      throw new UnreachableCaseError(context);
  }
};

const handleClientSession =
  (ctx: Context) =>
  (accept: AcceptConnection<Session>, _reject: RejectConnection) => {
    const session = accept();
    ctx.debug(`Session started with client`);
    session.on('sftp', handleSftpSession(ctx));
    [
      'window-change',
      'exec',
      'pty',
      'signal',
      'subsystem',
      'x11',
      'auth-agent',
      'env',
      'shell',
    ].forEach((event) => {
      session.on(event, (_: any, reject: RejectConnection) => {
        ctx.debug(`${event} call. NOT IMPLEMENTED`);
        reject();
      });
    });
  };

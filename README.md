# sftp-mock-server

![license](https://img.shields.io/github/license/MollardMichael/sftp-mock-server.svg)
[![codecov](https://codecov.io/gh/MollardMichael/sftp-mock-server/branch/master/graph/badge.svg?token=OI6LKGG1R7)](https://codecov.io/gh/MollardMichael/sftp-mock-server)
![Build Status](https://github.com/MollardMichael/sftp-mock-server/actions/workflows/push.yml/badge.svg)

This repository is aimed to provide you with the means to setup and interact with a small sftp server that you can use to run end to end tests in an application using [ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) or another node based sftp client. The package is mostly tested against ssh2-sftp-client.

You can check out the API reference [here](https://mollardmichael.github.io/sftp-mock-server/)

## Why should I use this library?

- Written in typescript (fully typed) for seamless integration in typescript based applications and libraries
- Will allow you to run e2e tests using your favorite test framework without the need to setup a real sftp server in your local and CI infrastructure

## Use cases

Mostly e2e tests but you could also run the server as a standalone service in a dev cluster. Just know that the files will be kept in memory so try not to go overboard

## Installation

### Using NPM

```shell
npm install --save-dev @micham/sftp-mock-server
```

### Using Yarn

```shell
yarn add -D @micham/sftp-mock-server
```

## API

### Usage

#### Create a new SFTP server

```typescript
const mockServer = await createSftpMockServer({
  port: '9999',
  hostname: '127.0.0.1',
  debug: (msg: string) => logger.debug(msg),
});
```

#### Connect using a private key

```typescript
const mockServer = await createSftpMockServer({
  port: '9999',
  hostname: '127.0.0.1',
  debug: (msg: string) => logger.debug(msg),
  users: {
    alice: {
      publicKey: clientPublicKey,
    },
  },
});

await data.client.connect({
  host: '127.0.0.1',
  port: 9999,
  username: 'test',
  privateKey: clientPrivateKey,
});
```

#### Write/Read a file to the SFTP server

```typescript
import Client from 'ssh2-sftp-client';

const mockServer = await createSftpMockServer({
  port: '9999',
  hostname: '127.0.0.1',
  debug: (msg: string) => logger.debug(msg),
  users: {
    alice: {
      password: 'password',
      publicKey: clientPublicKey,
    },
  },
});

const client = new Client();
await client.connect({
  host: '127.0.0.1',
  port: 9999,
  username: 'test',
  password: 'test',
});

await client.put(Buffer.from('File content'), 'tmp/data.txt');
const content = await client.get('tmp/data.txt');
```

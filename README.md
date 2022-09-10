# trie-ts

![license](https://img.shields.io/github/license/MollardMichael/sftp-mock-server.svg)
[![codecov](https://codecov.io/gh/MollardMichael/sftp-mock-server/branch/master/graph/badge.svg?token=OI6LKGG1R7)](https://codecov.io/gh/MollardMichael/trie-ts)
![Build Status](https://github.com/MollardMichael/sftp-mock-server/actions/workflows/push.yml/badge.svg)

This repository is aimed to provide you with the means to setup and interact with a small sftp server that you can use to run end to end tests in an application using [ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) or another node based sftp client. The package is mostly tested against ssh2-sftp-client

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

```

#### Add a file to the SFTP server

```typescript

```

import { randomUUID } from 'crypto';
import { constants } from 'fs';

import {
  AcceptSftpConnection,
  Attributes,
  RejectConnection,
  SFTPWrapper,
  utils,
} from 'ssh2';

import { Context } from './types';

type File = Attributes & {
  data: Buffer;
  path: string;
  handleId: string;
};

export const handleSftpSession =
  (ctx: Context) =>
  (accept: AcceptSftpConnection, _reject: RejectConnection) => {
    const files: Record<string, File> = {};
    const sftp = accept();
    ctx.debug('SFTP Session established with client');
    sftp.on('ready', () => ctx.debug('Client is ready for some SFTP fun!'));
    sftp.on('LSTAT', handleStat(files, sftp));
    sftp.on('STAT', handleStat(files, sftp));
    sftp.on('FSTAT', handleStat(files, sftp));
    sftp.on('OPEN', handleSftpOpen(files, ctx, sftp));
    sftp.on('WRITE', (reqId, handle, offset, data) => {
      ctx.debug(`Client start to write to file ${handle.toString()}`);
      const file = Object.values(files).find(
        (f) => f.handleId === handle.toString()
      );
      if (!file) {
        return sftp.status(reqId, utils.sftp.STATUS_CODE.FAILURE);
      }
      const preBuffer = file.data.subarray(0, offset);
      const postBuffer = file.data.subarray(offset, file.data.length);
      const result = Buffer.concat([preBuffer, data, postBuffer]);
      file.data = result;
      ctx.debug(`Write to file at offset ${offset}: ${data.toString()}`);
      sftp.status(reqId, utils.sftp.STATUS_CODE.OK);
    });
    sftp.on('READ', handleSftpRead(ctx, files, sftp));
    sftp.on('REMOVE', (reqId, path) => {
      delete files[path];
      sftp.status(reqId, utils.sftp.STATUS_CODE.OK);
    });
    sftp.on('RENAME', (reqId, oldPath, newPath) => {
      files[newPath] = files[oldPath];
      sftp.status(reqId, utils.sftp.STATUS_CODE.OK);
    });
    sftp.on('CLOSE', (reqId, _handle) => {
      sftp.status(reqId, utils.sftp.STATUS_CODE.OK);
      ctx.debug('Closing file');
    });
  };

function handleSftpOpen(
  files: Record<string, File>,
  ctx: Context,
  sftp: SFTPWrapper
): (reqId: number, filename: string, flags: number, attrs: Attributes) => void {
  return (reqId, filename, _flags, _attrs) => {
    let file = files[filename];
    if (!file) {
      ctx.debug('create handle for new file');
      const handleId = randomUUID();
      const newFile: File = {
        atime: new Date().getTime(),
        mtime: new Date().getTime(),
        mode: constants.S_IFREG,
        handleId,
        data: Buffer.from(''),
        gid: 1,
        uid: 1,
        path: filename,
        size: 0,
      };
      files[filename] = newFile;
      file = newFile;
    }
    ctx.debug(`opened file handle ${file.handleId}`);
    sftp.handle(reqId, Buffer.from(file.handleId));
  };
}

function handleSftpRead(
  ctx: Context,
  files: Record<string, File>,
  sftp: SFTPWrapper
): (reqId: number, handle: Buffer, offset: number, len: number) => void {
  return (reqId, handle, offset, length) => {
    ctx.debug(`Client tries to read file ${handle.toString()}`);
    const file = Object.values(files).find(
      (f) => f.handleId === handle.toString()
    );
    if (!file) {
      return sftp.status(reqId, utils.sftp.STATUS_CODE.FAILURE);
    }

    const result = file.data.subarray(offset, offset + length);

    if (result.length === 0) {
      return sftp.status(reqId, utils.sftp.STATUS_CODE.EOF);
    }

    ctx.debug(`reading ${result} from file ${file.path}`);
    return sftp.data(reqId, result);
  };
}

function handleStat(
  fileHandles: Record<string, File>,
  sftp: SFTPWrapper
): (reqId: number, path: string) => void {
  return (reqId, path) => {
    const file = fileHandles[path];
    if (!file) {
      return sftp.status(
        reqId,
        utils.sftp.STATUS_CODE.NO_SUCH_FILE,
        'File could not be found'
      );
    }
    sftp.attrs(reqId, {
      atime: file.atime,
      mtime: file.mtime,
      mode: file.mode,
      gid: file.gid,
      size: file.size,
      uid: file.uid,
    });
  };
}

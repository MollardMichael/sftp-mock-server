import { Debug } from './server';

export type Context = {
  debug: Debug;
  users: Record<string, { password?: string; publicKey?: string }>;
};

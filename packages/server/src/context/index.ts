import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token === 'demo-token' ? { id: '1', name: 'Demo User' } : null;
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

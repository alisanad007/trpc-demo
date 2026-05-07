import { TRPCError } from '@trpc/server';
import { t } from '../trpc/init.js';

/** Rejects the request with UNAUTHORIZED if no authenticated user is on the context. */
export const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be signed in to perform this action.' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

import { requireAuth } from '../middleware/auth.js';
import { t } from './init.js';

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);

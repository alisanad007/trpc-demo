import { router } from '../trpc.js';
import { todosRouter } from './todos.js';

export const appRouter = router({
  todos: todosRouter,
});

export type AppRouter = typeof appRouter;

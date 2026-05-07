import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc/index.js';

type Todo = { id: string; title: string; completed: boolean };

let todos: Todo[] = [
  { id: '1', title: 'Learn tRPC end-to-end types', completed: false },
  { id: '2', title: 'Build a type-safe API with Zod', completed: false },
  { id: '3', title: 'Ship to production', completed: false },
];

export const todosRouter = router({
  getAll: publicProcedure.query(() => todos),

  add: publicProcedure
    .input(z.object({ title: z.string().min(1).max(200) }))
    .mutation(({ input }) => {
      const todo: Todo = { id: Date.now().toString(), title: input.title, completed: false };
      todos.push(todo);
      return todo;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const todo = todos.find((t) => t.id === input.id);
      if (!todo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found.' });
      if (input.title !== undefined) todo.title = input.title;
      if (input.completed !== undefined) todo.completed = input.completed;
      return todo;
    }),

  // Protected: requires a valid auth token
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = todos.findIndex((t) => t.id === input.id);
      if (index === -1) throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found.' });
      todos.splice(index, 1);
      return { id: input.id };
    }),
});

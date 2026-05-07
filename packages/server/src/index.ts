import cors from 'cors';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router/index.js';
import { createContext } from './context.js';

export type { AppRouter } from './router/index.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(
  '/trpc',
  createExpressMiddleware({ router: appRouter, createContext })
);

app.listen(port, () => {
  console.log(`[server] tRPC on http://localhost:${port}/trpc`);
  console.log(`[server] health: http://localhost:${port}/health`);
});

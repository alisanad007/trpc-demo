import cors from 'cors'
import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router/index.js'
import { createContext } from './context/index.js'

export type { AppRouter } from './router/index.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(
  '/trpc',
  createExpressMiddleware({ router: appRouter, createContext })
)

app.listen(port, () => {
  console.log(`[server] tRPC on http://localhost:${port}/trpc`)
  console.log(`[server] health: http://localhost:${port}/health`)
})

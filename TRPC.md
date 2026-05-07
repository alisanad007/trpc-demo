# tRPC in this repo

## What is tRPC?

[tRPC](https://trpc.io) is a library for building **type-safe remote procedures** between TypeScript clients and servers. You define a **router** on the server (queries, mutations, and subscriptions) and describe inputs with **Zod** (or other validators). The client gets **full TypeScript inference** for procedure names, inputs, and outputs—**without** OpenAPI schemas or code generation steps.

At runtime the client sends HTTP requests (often batched) to a single endpoint; the wire format is JSON. The "magic" is compile-time: the server's `AppRouter` type is shared with the client so refactors stay aligned.

---

## Project structure

```
packages/
  server/                        @trpc-demo/server
    src/
      context.ts                 ← creates per-request context (auth user)
      trpc.ts                    ← initTRPC + publicProcedure + protectedProcedure
      router/
        todos.ts                 ← todos sub-router (getAll, add, update, delete)
        index.ts                 ← root appRouter, AppRouter type export
      index.ts                   ← Express server entry, re-exports AppRouter
  client/                        @trpc-demo/client
    src/
      trpc.ts                    ← createTRPCReact<AppRouter>, createTrpcClient
      main.tsx                   ← auth state + providers
      App.tsx                    ← Todo UI
```

The root `package.json` uses **Yarn workspaces** (`packages/*`) and **Lerna** to run scripts across both packages in parallel (`yarn dev`).

---

## Server

### 1. Context (`context.ts`)

Every incoming request passes through `createContext` before reaching a procedure. This is where you read headers and attach any per-request state:

```ts
export function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token === 'demo-token' ? { id: '1', name: 'Demo User' } : null;
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 2. tRPC init + procedure types (`trpc.ts`)

Initialize tRPC once and export reusable procedure builders. Never call `initTRPC` more than once per server.

```ts
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

`protectedProcedure` is a middleware-wrapped base that narrows `ctx.user` from `User | null` to `User` for all downstream handlers.

### 3. Routers split by feature (`router/todos.ts`)

Each feature gets its own router file:

```ts
export const todosRouter = router({
  getAll:  publicProcedure.query(…),          // no auth required
  add:     publicProcedure.input(…).mutation(…),
  update:  publicProcedure.input(…).mutation(…),
  delete:  protectedProcedure.input(…).mutation(…), // requires auth
});
```

### 4. Root router (`router/index.ts`)

Compose sub-routers into one root and export both the value and its type:

```ts
export const appRouter = router({ todos: todosRouter });
export type AppRouter = typeof appRouter;
```

### 5. Express entry (`index.ts`)

Mount the router with `createExpressMiddleware` and pass `createContext`:

```ts
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
```

Re-export `AppRouter` so the client workspace can `import type { AppRouter } from '@trpc-demo/server'`:

```ts
export type { AppRouter } from './router/index.js';
```

---

## Client

### 1. tRPC React client (`trpc.ts`)

`createTRPCReact<AppRouter>()` generates fully-typed hooks. The `httpBatchLink` headers factory reads the auth token on every request without needing to recreate the client:

```ts
export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
```

### 2. Auth state + providers (`main.tsx`)

The tRPC client is created once. A mutable ref (`authToken.current`) is shared with the headers factory so toggling auth updates every subsequent request without tearing down the client:

```tsx
const authToken = { current: null as string | null };
const trpcClient = createTrpcClient(() => authToken.current);

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function toggleAuth() {
    authToken.current = isAuthenticated ? null : 'demo-token';
    setIsAuthenticated((v) => !v);
    void queryClient.invalidateQueries();
  }
  …
}
```

### 3. Calling procedures (`App.tsx`)

```tsx
const todos   = trpc.todos.getAll.useQuery();
const addTodo = trpc.todos.add.useMutation({ onSuccess: () => utils.todos.getAll.invalidate() });
const deleteTodo = trpc.todos.delete.useMutation({ onSuccess: …, onError: … });
```

`protectedProcedure` enforcement happens on the server. The client disables the delete button when not authenticated as a UX hint, but the server rejects unauthenticated calls regardless.

### 4. Dev proxy (`vite.config.ts`)

Vite proxies `/trpc` → `http://localhost:3000` so the browser makes same-origin requests:

```ts
server: { proxy: { '/trpc': { target: 'http://localhost:3000', changeOrigin: true } } }
```

---

## Public vs protected procedures

| Procedure | Type | Auth required |
|---|---|---|
| `todos.getAll` | query | No |
| `todos.add` | mutation | No |
| `todos.update` | mutation | No |
| `todos.delete` | mutation | **Yes** (`protectedProcedure`) |

In the demo, auth is simulated with the static token `demo-token`. Click **Sign in (demo)** in the UI to attach it.

---

## Sharing router types

The client depends on the server package **only for types** (`import type { AppRouter }`). The server implementation is never bundled into the browser.

For production you have two common patterns:

**Types-only contract package** — extract `appRouter` + shared Zod schemas into a separate `@your-org/api` package. The server imports and mounts it; clients import just the type. Use `inferRouterInputs` / `inferRouterOutputs` for typed props and mappers:

```ts
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
export type RouterInputs  = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

**Workspace package (what this demo does)** — Yarn workspaces link `@trpc-demo/server` locally. Moving to npm is mostly packaging: publish the server package's type entry and bump the client's semver range on breaking changes.

Things to watch:
- Client and server must use **compatible** `@trpc/*` major versions.
- Never put secrets, connection strings, or server-only imports in the shared type package.

---

## Further reading

- [tRPC documentation](https://trpc.io/docs)
- [Context & authorization](https://trpc.io/docs/server/context)
- [Middlewares](https://trpc.io/docs/server/middlewares)
- [Inference helpers](https://trpc.io/docs/server/infer-types)

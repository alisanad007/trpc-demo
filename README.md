# tRPC Todo Demo

A full-stack todo app demonstrating end-to-end type safety with [tRPC](https://trpc.io), React, and Express — no codegen, no OpenAPI.

## Stack

| Layer | Tech |
|---|---|
| API server | Express + tRPC v11 |
| Validation | Zod |
| Client | React 19 + Vite |
| Data fetching | TanStack Query + `@trpc/tanstack-react-query` |
| Monorepo | Yarn workspaces + Lerna |

---

## Prerequisites

- Node.js ≥ 18
- Yarn 1.x (`npm i -g yarn`)

## Getting started

```bash
yarn install   # install all workspace dependencies
yarn dev       # start server (port 3000) + client (port 5173) in parallel
```

Open [http://localhost:5173](http://localhost:5173).

### Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Start server + client in watch mode |
| `yarn build` | Build both packages |
| `yarn list` | List workspace packages |

Run a single package:

```bash
cd packages/server && yarn dev   # Express on :3000
cd packages/client && yarn dev   # Vite on :5173
```

---

## Project structure

```
packages/
  server/                   @trpc-demo/server  (Express + tRPC)
    src/
      context/
        index.ts            createContext — extracts auth user from Bearer token
      middleware/
        auth.ts             requireAuth — rejects unauthenticated requests
      trpc/
        init.ts             t = initTRPC (no other server deps — breaks circular imports)
        index.ts            router, publicProcedure, protectedProcedure
      router/
        todos.ts            getAll · add · update (public) · delete (protected)
        index.ts            root appRouter + AppRouter type
      index.ts              Express entry, mounts /trpc, re-exports AppRouter

  client/                   @trpc-demo/client  (React + Vite)
    src/
      api/
        trpc.ts              tRPC client + options proxy (queryOptions / mutationOptions)
        react-query.ts       single QueryClient instance
      context/
        auth.tsx             AuthContext, AuthProvider, trpcClient
      hooks/
        useAuth.ts           useAuth() — reads isAuthenticated + toggleAuth
      components/
        TodoForm.tsx         add-todo form
        TodoItem.tsx         single row — checkbox, title, delete button
        TodoList.tsx         fetches list, renders TodoItems
      utils/
        auth.ts              loadToken · saveToken · clearToken (localStorage)
      App.tsx                page layout + auth header
      main.tsx               providers entry point
```

The root `package.json` uses Yarn workspaces (`packages/*`) and Lerna to run scripts across both packages in parallel.

---

## What is tRPC?

tRPC lets you build fully type-safe APIs between a TypeScript server and client with no code generation. You define procedures on the server using Zod for input validation, and the client gets complete inference for procedure names, inputs, and outputs at compile time.

At runtime the client sends batched HTTP requests to `/trpc`; the wire format is plain JSON. The type safety is purely compile-time — the server's `AppRouter` type is shared with the client so any rename or schema change instantly produces a type error on both sides.

---

## Server

### Context (`context/index.ts`)

Every request passes through `createContext` before reaching a procedure. This is where per-request state — such as the authenticated user — is extracted from headers:

```ts
export function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token === 'demo-token' ? { id: '1', name: 'Demo User' } : null;
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Middleware (`middleware/auth.ts`)

`requireAuth` is created with `t.middleware()` for full type inference. It imports `t` from `trpc/init.ts` rather than `trpc/index.ts` to avoid a circular dependency:

```ts
export const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be signed in to perform this action.' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### tRPC init + procedure builders (`trpc/`)

Split into two files to break the circular import between middleware and procedures:

**`trpc/init.ts`** — owns the single `t` instance, no other server imports:

```ts
export const t = initTRPC.context<Context>().create();
```

**`trpc/index.ts`** — assembles procedure builders by composing `t` with middleware:

```ts
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);
```

`protectedProcedure` narrows `ctx.user` from `User | null` to `User` for all downstream handlers, giving them type-safe access to the authenticated user.

### Feature routers (`router/todos.ts`)

Each feature lives in its own router file and uses the appropriate procedure base:

```ts
export const todosRouter = router({
  getAll:  publicProcedure.query(…),
  add:     publicProcedure.input(…).mutation(…),
  update:  publicProcedure.input(…).mutation(…),
  delete:  protectedProcedure.input(…).mutation(…), // requires auth
});
```

### Root router (`router/index.ts`)

Sub-routers are composed into a single root and the type is exported:

```ts
export const appRouter = router({ todos: todosRouter });
export type AppRouter = typeof appRouter;
```

### Express entry (`index.ts`)

The router is mounted with `createExpressMiddleware` and `createContext` is wired in:

```ts
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
```

`AppRouter` is re-exported from the entry so the client workspace can import just the type:

```ts
export type { AppRouter } from './router/index.js';
```

---

## Client

### tRPC client + options proxy (`api/trpc.ts`)

`createTRPCClient` is a plain framework-agnostic client. `createTRPCOptionsProxy` wraps it to produce `queryOptions` / `mutationOptions` / `queryKey` factories consumed by standard TanStack Query hooks. `authToken` is a module-level mutable ref — the `headers` factory reads it on every request so the client never needs to be recreated when auth changes:

```ts
export const authToken = { current: loadToken() };

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/trpc',
      headers: () => {
        const token = authToken.current;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
```

### QueryClient (`api/react-query.ts`)

A single `QueryClient` instance shared across the app with sensible defaults:

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Auth state + providers

| File | Responsibility |
|---|---|
| `api/trpc.ts` | tRPC client, `trpc` options proxy, `authToken` ref |
| `api/react-query.ts` | `QueryClient` singleton |
| `context/auth.tsx` | `AuthContext`, `AuthProvider` — mutates `authToken`, manages React state |
| `hooks/useAuth.ts` | `useAuth()` hook |

**`context/auth.tsx`** — purely React, no client setup:

```ts
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authToken.current !== null);

  function toggleAuth() {
    const next = !isAuthenticated;
    if (next) { saveToken(); authToken.current = DEMO_TOKEN; }
    else       { clearToken(); authToken.current = null; }
    setIsAuthenticated(next);
    void queryClient.invalidateQueries();
  }

  return <AuthContext.Provider value={{ isAuthenticated, toggleAuth }}>{children}</AuthContext.Provider>;
}
```

`main.tsx` wires all providers; any component reads auth state via `useAuth()` without prop drilling. No `trpc.Provider` is needed — the `queryClient` is wired directly into the options proxy in `api/trpc.ts`:

```tsx
// main.tsx
<AuthProvider>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</AuthProvider>

// any component
const { isAuthenticated, toggleAuth } = useAuth();
```

### Calling procedures (`App.tsx` + components)

`trpc.*` produces options objects consumed by standard TanStack Query hooks. Cache invalidation uses `queryClient` directly (imported singleton) and `trpc.todos.getAll.queryKey()` for precise targeting:

```tsx
// TodoList.tsx — public query
const todos = useQuery(trpc.todos.getAll.queryOptions());

// TodoForm.tsx — public mutation
const addTodo = useMutation(
  trpc.todos.add.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trpc.todos.getAll.queryKey() });
    },
  }),
);

// TodoItem.tsx — protected mutation
const deleteTodo = useMutation(
  trpc.todos.delete.mutationOptions({
    onSuccess: invalidateTodos,
    onError: (err) => alert(err.message),
  }),
);
```

The server enforces `protectedProcedure` regardless of the client. The delete button is disabled when not signed in as a UX hint only.

### Dev proxy (`vite.config.ts`)

Vite proxies `/trpc` → `http://localhost:3000` so the browser makes same-origin requests during development:

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
| `todos.delete` | mutation | **Yes** |

Auth is simulated with the static token `demo-token`. Click **Sign in (demo)** in the UI to attach it. The token is saved to `localStorage` under the key `demo-token` so it persists across refreshes.

---

## How type sharing works

The client imports `AppRouter` type-only from the server workspace package:

```ts
import type { AppRouter } from '@trpc-demo/server';
```

Yarn workspaces symlink `@trpc-demo/server` locally so TypeScript resolves the type directly from server source — no publishing, no codegen. Rename a procedure or tighten a Zod schema and the client immediately shows a type error.

### Sharing types in production

Extract the router type into a standalone  package. The server mounts it; every microfrontend imports the type only.

****

```ts
import type { AppRouter } from '@your-org/server';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type { AppRouter };
export type RouterInputs  = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

Set `emitDeclarationOnly: true` in `tsconfig.json` and declare `@trpc/server` + `zod` as `peerDependencies` so the package ships only `.d.ts` files.

**Consuming in any microfrontend**

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@your-org/api-types';

const trpcClient = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/trpc' })] });
export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
// trpc.todos.getAll.queryOptions(), RouterOutputs['todos']['getAll'] etc. are fully inferred.
```

**Publishing**

```bash
cd packages/api-types && yarn build
npm publish --access public
```

Bump `major` on breaking changes (removed/renamed procedures), `minor` for additions. Pin microfrontends to `"@your-org/api-types": "^1.x.x"` so they adopt breaking changes explicitly.

---

## Further reading

- [tRPC docs](https://trpc.io/docs)
- [Context & authorization](https://trpc.io/docs/server/context)
- [Middlewares](https://trpc.io/docs/server/middlewares)
- [Inference helpers](https://trpc.io/docs/server/infer-types)

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@trpc-demo/server';

// Typed React hooks derived from the server's AppRouter — no codegen required.
export const trpc = createTRPCReact<AppRouter>();

// getToken is called on every request, so the client never needs to be recreated on auth change.
export function createTrpcClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        // Vite proxies /trpc → http://localhost:3000 in dev (see vite.config.ts).
        url: '/trpc',
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

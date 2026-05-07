// The demo token the server accepts — also used as the localStorage key.
export const DEMO_TOKEN = 'demo-token';

// Returns the persisted token, or null if the user was never signed in.
export function loadToken(): string | null {
  return localStorage.getItem(DEMO_TOKEN);
}

// Writes the token to localStorage so it survives page refreshes.
export function saveToken(): void {
  localStorage.setItem(DEMO_TOKEN, DEMO_TOKEN);
}

// Removes the token, effectively signing the user out across refreshes.
export function clearToken(): void {
  localStorage.removeItem(DEMO_TOKEN);
}

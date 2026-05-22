import { TRAKT_API_BASE, TRAKT_API_VERSION, TRAKT_USER_AGENT, getEnvCredentials } from '../config.js';
import { readToken, writeToken, isExpired, type StoredToken } from '../auth/token-store.js';
import { refreshAccessToken } from '../auth/device-flow.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  auth?: boolean; // default true
}

async function ensureToken(): Promise<StoredToken> {
  const token = await readToken();
  if (!token) {
    const err = new Error('Not authenticated. Run `trakt-cli login` first.');
    (err as NodeJS.ErrnoException).code = 'ENOAUTH';
    throw err;
  }
  const upgraded = upgradeLegacyToken(token);
  if (isExpired(upgraded)) {
    return refreshAccessToken(upgraded);
  }
  return upgraded;
}

function upgradeLegacyToken(token: StoredToken): StoredToken {
  if (token.client_id && token.client_secret) return token;
  const { clientId, clientSecret } = getEnvCredentials();
  const upgraded: StoredToken = { ...token, client_id: clientId, client_secret: clientSecret };
  void writeToken(upgraded);
  return upgraded;
}

async function resolveClientId(): Promise<string> {
  const token = await readToken();
  if (token?.client_id) return token.client_id;
  return getEnvCredentials().clientId;
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const useAuth = opts.auth !== false;

  const url = new URL(path, TRAKT_API_BASE);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': TRAKT_USER_AGENT,
    'trakt-api-version': TRAKT_API_VERSION,
    'trakt-api-key': '',
  };

  if (useAuth) {
    const token = await ensureToken();
    headers['trakt-api-key'] = token.client_id;
    headers['Authorization'] = `Bearer ${token.access_token}`;
  } else {
    headers['trakt-api-key'] = await resolveClientId();
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    throw new Error(`Trakt API ${method} ${path} → ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as T;
}

import { mkdir, readFile, writeFile, unlink, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AUTH_FILE } from '../config.js';

export interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  scope: string;
  token_type: string;
  client_id: string;
  client_secret: string;
}

export async function readToken(): Promise<StoredToken | null> {
  try {
    const raw = await readFile(AUTH_FILE, 'utf8');
    return JSON.parse(raw) as StoredToken;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeToken(token: StoredToken): Promise<void> {
  await mkdir(dirname(AUTH_FILE), { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(token, null, 2), 'utf8');
  await chmod(AUTH_FILE, 0o600);
}

export async function clearToken(): Promise<void> {
  try {
    await unlink(AUTH_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

export function isExpired(token: StoredToken, skewSeconds = 60): boolean {
  return Math.floor(Date.now() / 1000) >= token.expires_at - skewSeconds;
}

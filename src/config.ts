import { homedir } from 'node:os';
import { join } from 'node:path';

export const TRAKT_API_BASE = 'https://api.trakt.tv';
export const TRAKT_API_VERSION = '2';
export const TRAKT_USER_AGENT = 'trakt-cli/0.1.0 (+https://github.com/raulanatol/trakt-cli)';

export const CONFIG_DIR = join(homedir(), '.config', 'trakt-cli');
export const AUTH_FILE = join(CONFIG_DIR, 'auth.json');

export function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TRAKT_CLIENT_ID;
  const clientSecret = process.env.TRAKT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing TRAKT_CLIENT_ID or TRAKT_CLIENT_SECRET environment variables. ' +
        'Create an app at https://trakt.tv/oauth/applications and export both.',
    );
  }
  return { clientId, clientSecret };
}

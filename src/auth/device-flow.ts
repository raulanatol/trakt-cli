import { TRAKT_API_BASE, TRAKT_USER_AGENT, getCredentials } from '../config.js';
import { writeToken, type StoredToken } from './token-store.js';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number;
  scope: string;
  token_type: string;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const { clientId } = getCredentials();
  const res = await fetch(`${TRAKT_API_BASE}/oauth/device/code`, {
    method: 'POST',
    headers: oauthHeaders(),
    body: JSON.stringify({ client_id: clientId }),
  });
  if (!res.ok) {
    throw new Error(`Device code request failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as DeviceCodeResponse;
}

export async function pollForToken(device: DeviceCodeResponse): Promise<StoredToken> {
  const { clientId, clientSecret } = getCredentials();
  const deadline = Date.now() + device.expires_in * 1000;
  let intervalMs = device.interval * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const res = await fetch(`${TRAKT_API_BASE}/oauth/device/token`, {
      method: 'POST',
      headers: oauthHeaders(),
      body: JSON.stringify({
        code: device.device_code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (res.status === 200) {
      const data = (await res.json()) as TokenResponse;
      const stored: StoredToken = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.created_at + data.expires_in,
        scope: data.scope,
        token_type: data.token_type,
      };
      await writeToken(stored);
      return stored;
    }

    if (res.status === 400) continue; // pending
    if (res.status === 404) throw new Error('Invalid device code.');
    if (res.status === 409) throw new Error('Code already used.');
    if (res.status === 410) throw new Error('Code expired. Please retry login.');
    if (res.status === 418) throw new Error('Authorization denied by user.');
    if (res.status === 429) {
      intervalMs += 1000;
      continue;
    }

    throw new Error(`Unexpected status ${res.status}: ${await res.text()}`);
  }

  throw new Error('Device code expired before authorization completed.');
}

export async function refreshAccessToken(refreshToken: string): Promise<StoredToken> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(`${TRAKT_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: oauthHeaders(),
    body: JSON.stringify({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as TokenResponse;
  const stored: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.created_at + data.expires_in,
    scope: data.scope,
    token_type: data.token_type,
  };
  await writeToken(stored);
  return stored;
}

function oauthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': TRAKT_USER_AGENT,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

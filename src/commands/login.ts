import { requestDeviceCode, pollForToken } from '../auth/device-flow.js';
import { emit } from '../output.js';

export async function loginCommand(): Promise<void> {
  const device = await requestDeviceCode();
  // Human-readable prompt goes to stderr so stdout stays JSON-clean.
  process.stderr.write(
    `\nOpen ${device.verification_url} and enter the code: ${device.user_code}\n` +
      `Waiting for authorization (expires in ${device.expires_in}s)...\n\n`,
  );
  const token = await pollForToken(device);
  emit({
    status: 'authenticated',
    expires_at: token.expires_at,
    scope: token.scope,
  });
}

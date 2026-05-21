import { clearToken } from '../auth/token-store.js';
import { emit } from '../output.js';

export async function logoutCommand(): Promise<void> {
  await clearToken();
  emit({ status: 'logged_out' });
}

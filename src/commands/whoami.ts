import { request } from '../api/client.js';
import { emit } from '../output.js';

export async function whoamiCommand(): Promise<void> {
  const data = await request('/users/me', { query: { extended: 'full' } });
  emit(data);
}

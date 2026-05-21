import { request } from '../api/client.js';
import { emit } from '../output.js';

export async function statsCommand(): Promise<void> {
  const data = await request('/users/me/stats');
  emit(data);
}

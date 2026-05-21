import { request } from '../api/client.js';
import { emit } from '../output.js';

export interface TrendingOptions {
  type?: 'movies' | 'shows';
  limit?: string;
}

export async function trendingCommand(opts: TrendingOptions): Promise<void> {
  const type = opts.type ?? 'movies';
  const data = await request(`/${type}/trending`, {
    query: { limit: opts.limit ?? '10', extended: 'full' },
    auth: false,
  });
  emit(data);
}

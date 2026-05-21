import { request } from '../api/client.js';
import { emit } from '../output.js';

export interface RecommendationsOptions {
  type?: 'movies' | 'shows';
  limit?: string;
}

export async function recommendationsCommand(opts: RecommendationsOptions): Promise<void> {
  const type = opts.type ?? 'movies';
  const data = await request(`/recommendations/${type}`, {
    query: { limit: opts.limit ?? '10', extended: 'full' },
  });
  emit(data);
}

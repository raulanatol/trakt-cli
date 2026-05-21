import { request } from '../api/client.js';
import { emit } from '../output.js';

export interface SearchOptions {
  type?: string; // movie,show,episode,person,list — comma-separated allowed
  limit?: string;
}

export async function searchCommand(query: string, opts: SearchOptions): Promise<void> {
  const type = opts.type ?? 'movie,show';
  const data = await request(`/search/${type}`, {
    query: { query, limit: opts.limit ?? '10', extended: 'full' },
    auth: false,
  });
  emit(data);
}

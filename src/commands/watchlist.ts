import { request } from '../api/client.js';
import { emit } from '../output.js';

export interface WatchlistOptions {
  type?: 'movies' | 'shows' | 'seasons' | 'episodes';
  limit?: string;
}

export async function watchlistCommand(opts: WatchlistOptions): Promise<void> {
  const path = opts.type ? `/sync/watchlist/${opts.type}` : '/sync/watchlist';
  const data = await request(path, {
    query: { limit: opts.limit, extended: 'full' },
  });
  emit(data);
}

import { request } from '../api/client.js';
import { emit } from '../output.js';

export interface HistoryOptions {
  type?: 'movies' | 'shows' | 'seasons' | 'episodes';
  limit?: string;
}

export async function historyCommand(opts: HistoryOptions): Promise<void> {
  const path = opts.type ? `/sync/history/${opts.type}` : '/sync/history';
  const data = await request(path, {
    query: { limit: opts.limit ?? '20', extended: 'full' },
  });
  emit(data);
}

import { request } from '../api/client.js';
import { emit } from '../output.js';

interface SearchResult {
  show?: { ids?: { trakt?: number; slug?: string }; title?: string };
}

export interface MissingEpisode {
  season: number;
  number: number;
  title: string;
  ids: Record<string, unknown>;
}

interface ProgressEpisode {
  number?: number;
  title?: string;
  completed?: boolean;
  ids?: Record<string, unknown>;
}

interface ProgressSeason {
  number?: number;
  episodes?: ProgressEpisode[];
}

export interface MissingOptions {
  show: string;
  season?: string;
  next?: boolean;
  json?: boolean;
}

export function findMissingEpisodes(
  seasons: ProgressSeason[],
  seasonFilter?: number,
): MissingEpisode[] {
  return seasons
    .flatMap((season) =>
      season.number === undefined || !season.episodes
        ? []
        : season.episodes
            .filter((episode) => episode.number !== undefined && episode.completed !== true)
            .map((episode) => ({
              season: season.number as number,
              number: episode.number as number,
              title: episode.title ?? 'Untitled episode',
              ids: episode.ids ?? {},
            })),
    )
    .filter((episode) => seasonFilter === undefined || episode.season === seasonFilter)
    .sort((left, right) => left.season - right.season || left.number - right.number);
}

export async function missingEpisodesCommand(opts: MissingOptions): Promise<void> {
  const query = opts.show.trim();
  if (!query) throw new Error('The --show option cannot be empty.');

  const season = parseSeason(opts.season);
  const results = await request<SearchResult[]>('/search/show', {
    query: { query, limit: 1, extended: 'full' },
    auth: false,
  });
  const show = results[0]?.show;
  const showId = show?.ids?.trakt ?? show?.ids?.slug;
  if (!show || showId === undefined) throw new Error(`Show not found: ${query}`);

  const progress = await request<{ seasons?: ProgressSeason[] }>(
    `/shows/${encodeURIComponent(String(showId))}/progress/watched`,
    { query: { hidden: 'false', specials: 'true' } },
  );
  let missing = findMissingEpisodes(progress.seasons ?? [], season);
  if (opts.next) missing = missing.slice(0, 1);
  if (missing.length === 0) throw new Error('No pending episodes found.');

  if (opts.json) {
    emit(missing);
    return;
  }

  process.stdout.write(
    missing
      .map((episode) => `${episode.season}x${String(episode.number).padStart(2, '0')} ${episode.title}`)
      .join('\n') + '\n',
  );
}

function parseSeason(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new Error(`Invalid season: ${value}`);
  return Number(value);
}

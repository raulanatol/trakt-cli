#!/usr/bin/env node
import { Command } from 'commander';
import { fail } from './output.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { whoamiCommand } from './commands/whoami.js';
import { historyCommand } from './commands/history.js';
import { watchlistCommand } from './commands/watchlist.js';
import { searchCommand } from './commands/search.js';
import { trendingCommand } from './commands/trending.js';
import { recommendationsCommand } from './commands/recommendations.js';
import { statsCommand } from './commands/stats.js';

const program = new Command();

program
  .name('trakt-cli')
  .description('CLI for Trakt.tv — JSON output, designed for Claude skills')
  .version('0.1.0');

program.command('login').description('Authenticate via OAuth device flow').action(run(loginCommand));

program.command('logout').description('Remove stored credentials').action(run(logoutCommand));

program.command('whoami').description('Show authenticated user').action(run(whoamiCommand));

program
  .command('history')
  .description('Show watch history')
  .option('-t, --type <type>', 'movies | shows | seasons | episodes')
  .option('-l, --limit <n>', 'max items', '20')
  .action(run(historyCommand));

program
  .command('watchlist')
  .description('Show watchlist')
  .option('-t, --type <type>', 'movies | shows | seasons | episodes')
  .option('-l, --limit <n>', 'max items')
  .action(run(watchlistCommand));

program
  .command('search <query>')
  .description('Search for movies/shows')
  .option('-t, --type <type>', 'movie | show | episode | person | list (csv ok)', 'movie,show')
  .option('-l, --limit <n>', 'max items', '10')
  .action(run(searchCommand));

program
  .command('trending')
  .description('Show trending movies or shows')
  .option('-t, --type <type>', 'movies | shows', 'movies')
  .option('-l, --limit <n>', 'max items', '10')
  .action(run(trendingCommand));

program
  .command('recommendations')
  .description('Personal recommendations')
  .option('-t, --type <type>', 'movies | shows', 'movies')
  .option('-l, --limit <n>', 'max items', '10')
  .action(run(recommendationsCommand));

program.command('stats').description('Show your Trakt stats').action(run(statsCommand));

program.parseAsync(process.argv).catch((err) => {
  const code = (err as NodeJS.ErrnoException).code;
  fail(err instanceof Error ? err.message : String(err), code);
});

// Wraps async actions so any throw is rendered as a JSON error on stderr.
function run<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A): Promise<void> => {
    try {
      await fn(...args);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      fail(err instanceof Error ? err.message : String(err), code);
    }
  };
}

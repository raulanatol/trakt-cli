import assert from 'node:assert/strict';
import test from 'node:test';
import { findMissingEpisodes, missingEpisodesCommand } from '../dist/commands/missing.js';

const progress = {
  seasons: [
    { number: 0, episodes: [{ number: 1, title: 'Christmas Special', completed: false }] },
    {
      number: 2,
      episodes: [
        { number: 2, title: 'Watched', completed: true },
        { number: 1, title: 'Next', completed: false, ids: { trakt: 21 } },
      ],
    },
    { number: 1, episodes: [{ number: 3, title: 'Earlier', completed: false }] },
  ],
};

function fakeRequest(path) {
  if (path === '/search/show') return Promise.resolve([{ show: { ids: { trakt: 42 } } }]);
  return Promise.resolve(progress);
}

test('returns pending episodes in series order and excludes specials', () => {
  assert.deepEqual(findMissingEpisodes(progress.seasons), [
    { season: 1, number: 3, title: 'Earlier', ids: {} },
    { season: 2, number: 1, title: 'Next', ids: { trakt: 21 } },
  ]);
});

test('filters by season before selecting the next episode', async () => {
  const output = [];
  await missingEpisodesCommand(
    { show: 'Example', season: '2', next: true },
    { request: fakeRequest, emit: (value) => output.push(value), write: (value) => output.push(value) },
  );
  assert.deepEqual(output, ['2x01 Next\n']);
});

test('executes --next and emits stable JSON without presentation text', async () => {
  const output = [];
  await missingEpisodesCommand(
    { show: 'Example', next: true, json: true },
    { request: fakeRequest, emit: (value) => output.push(value), write: (value) => output.push(value) },
  );
  assert.deepEqual(output, [[{ season: 1, number: 3, title: 'Earlier', ids: {} }]]);
});

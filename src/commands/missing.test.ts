import assert from 'node:assert/strict';
import test from 'node:test';
import { findMissingEpisodes } from './missing.js';

const seasons = [
  {
    number: 2,
    episodes: [
      { number: 2, title: 'Watched', completed: true },
      { number: 1, title: 'Next', completed: false, ids: { trakt: 21 } },
    ],
  },
  { number: 1, episodes: [{ number: 3, title: 'Earlier', completed: false }] },
];

test('returns pending episodes in series order', () => {
  assert.deepEqual(findMissingEpisodes(seasons), [
    { season: 1, number: 3, title: 'Earlier', ids: {} },
    { season: 2, number: 1, title: 'Next', ids: { trakt: 21 } },
  ]);
});

test('filters by season before selecting the next episode', () => {
  assert.deepEqual(findMissingEpisodes(seasons, 2).slice(0, 1), [
    { season: 2, number: 1, title: 'Next', ids: { trakt: 21 } },
  ]);
});

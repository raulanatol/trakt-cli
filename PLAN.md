# trakt-cli — Plan

Living roadmap for the project. Tick items as they land; add notes when context shifts.

## Project shape (already decided)

- **Language**: Node.js + TypeScript (ESM, Node ≥ 20).
- **Package manager**: pnpm (`packageManager: pnpm@10.33.0`).
- **Binary**: `trakt-cli` (defined in `package.json` → `bin`).
- **Output contract**: every command emits JSON on stdout. Errors go to stderr as `{"error": "...", "code": "..."}` with exit ≠ 0. This is the interface the Claude skill consumes — do not break it.
- **Auth**: OAuth device flow. Tokens at `~/.config/trakt-cli/auth.json` (mode 0600). Refresh is automatic on 401-via-expiry inside `src/api/client.ts`.
- **Credentials**: `TRAKT_CLIENT_ID` / `TRAKT_CLIENT_SECRET` come from env vars only. Register the app at https://trakt.tv/oauth/applications with redirect URI `urn:ietf:wg:oauth:2.0:oob`.

## Status snapshot

### Done
- [x] Scaffolding: `package.json`, `tsconfig.json`, `.gitignore`, `README.md`.
- [x] Auth: device flow (`src/auth/device-flow.ts`) + token store (`src/auth/token-store.ts`) + transparent refresh.
- [x] API client (`src/api/client.ts`) with required Trakt headers + auto-refresh.
- [x] Read commands: `login`, `logout`, `whoami`, `history`, `watchlist`, `search`, `trending`, `recommendations`, `stats`.
- [x] Output helpers (`src/output.ts`): `emit` / `fail`.
- [x] Commander wiring + global error handler (`src/index.ts`).
- [x] pnpm migration.

### Pending — in priority order

#### 1. Validate end-to-end with real credentials (manual, do this before anything else)
```sh
export TRAKT_CLIENT_ID=... TRAKT_CLIENT_SECRET=...
cd /Users/raulanatol/work/oss/trakt-cli
pnpm install && pnpm build && pnpm link --global
trakt-cli login
trakt-cli whoami
trakt-cli trending --type shows --limit 3
trakt-cli history --limit 5
```
Confirms device flow, token persistence, refresh path, and JSON contract against the real API.

#### 2. Claude skill (`~/.claude/skills/trakt/SKILL.md`)
This is the original goal. Once #1 passes, write a skill manifest that:
- Triggers on Trakt-related queries (history, recommendations, watchlist, search, stats).
- Tells Claude to invoke `trakt-cli <command>` via Bash and parse the JSON.
- Tells Claude **not** to dump raw JSON to the user — always summarize.
- Handles the `ENOAUTH` error path by asking the user to run `trakt-cli login`.

Draft skeleton lives in our conversation; lift it from there.

#### 3. Write commands (mutations)
Each follows the existing command pattern (`src/commands/*.ts` + register in `src/index.ts`).
- [ ] `history add <trakt-id>` / `history remove <trakt-id>` → `POST /sync/history` / `POST /sync/history/remove`.
- [ ] `watchlist add <id>` / `watchlist remove <id>` → `POST /sync/watchlist` / `POST /sync/watchlist/remove`.
- [ ] `collection add <id>` / `collection remove <id>` → `POST /sync/collection` / `POST /sync/collection/remove`.
- [ ] `checkin <id>` → `POST /checkin` (currently-watching). Includes a 409 "already checked in" path worth surfacing cleanly.

Decide ID convention: accept `trakt:12345`, `imdb:tt1234567`, `tmdb:12345` and dispatch accordingly. Trakt's sync endpoints take an object with arrays of `{ ids: { trakt|imdb|tmdb } }`.

#### 4. Detail commands (read)
- [ ] `show <id> [--extended full]` → `/shows/:id`.
- [ ] `movie <id> [--extended full]` → `/movies/:id`.
- [ ] Optional: `show <id> seasons`, `show <id> episodes`.

These pair well with the skill: "how many seasons does X have", "what's X about".

#### 5. Tests
- [ ] Add `vitest`.
- [ ] Unit tests for `token-store` (round-trip, perms, expiry).
- [ ] Unit tests for `api/client` with `fetch` mocked (auth header, refresh on expiry, query serialization).
- [ ] Snapshot or contract test for at least one command's JSON shape.

#### 6. CI
- [ ] GitHub Actions: install pnpm, build, lint (add `eslint` or `biome`), run vitest. Cache pnpm store.

#### 7. (Optional) Publish
- [ ] Decide if this goes to npm public. If yes: scope under `@raulanatol/` or similar, add `prepublishOnly: pnpm build`, drop `dist` from `.gitignore` only if shipping prebuilt (we already do — fine).

## Working notes / gotchas
- Trakt rate limit: 1000 calls / 5 min for authed, lower unauth. Not yet handled — if we hit it, surface `429` cleanly from `api/client.ts`.
- `search` and `trending` are unauth (`auth: false` in `request`); the rest require a token.
- `noUncheckedIndexedAccess` is on in tsconfig — be careful when narrowing arrays from the API.
- The CLI prints human prompts (device-flow URL/code) to **stderr** so stdout stays valid JSON. Keep this invariant for any future interactive flow.

## Open questions
- Do we want a `--json` flag at all, or stay JSON-always? Currently always-JSON; reconsider only if a human-friendly mode becomes useful outside the skill.
- Caching: should `search`/`trending` cache responses locally to be polite with rate limits? Skip for v1.

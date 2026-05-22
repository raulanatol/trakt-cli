# trakt-cli

A friendly command-line tool for [Trakt.tv](https://trakt.tv) — the service that tracks what you watch on TV and in movies, scrobbles from your media players, and keeps your watchlist, history and stats in one place.

`trakt-cli` exposes that data through a clean JSON interface, so you can pipe it into scripts, dashboards, or **AI skills** that need to know what you've been watching. All commands emit JSON on stdout; errors go to stderr with non-zero exit codes.

## Install

```sh
npm i -g @raulanatol/trakt-cli
# or
pnpm add -g @raulanatol/trakt-cli
```

The global binary is `trakt-cli`.

## Setup

1. Create an application at https://trakt.tv/oauth/applications
   - Set the redirect URI to: `urn:ietf:wg:oauth:2.0:oob`
2. Export your credentials **only for the login step**:
   ```sh
   export TRAKT_CLIENT_ID=...
   export TRAKT_CLIENT_SECRET=...
   trakt-cli login       # device flow — just follow the on-screen instructions
   ```

That's it. After `login`, your credentials and OAuth tokens are stored together in `~/.config/trakt-cli/auth.json` (mode `0600`), so you can safely `unset` the env vars. The CLI refreshes tokens transparently when they expire — you won't need to log in again.

### Local development

```sh
pnpm install
pnpm build
pnpm link --global
```

## Commands

All commands emit JSON on stdout. Errors are written to stderr as `{"error": "..."}` and exit with a non-zero status.

| Command | Description |
| --- | --- |
| `trakt-cli login` | Sign in via OAuth device flow |
| `trakt-cli logout` | Remove stored tokens |
| `trakt-cli whoami` | Show the authenticated user |
| `trakt-cli history [--type movies\|shows] [--limit N]` | Your watch history |
| `trakt-cli watchlist [--type] [--limit N]` | Items on your watchlist |
| `trakt-cli search <query> [--type movie\|show]` | Search Trakt's catalog |
| `trakt-cli trending [--type movies\|shows] [--limit N]` | What's trending right now |
| `trakt-cli recommendations [--type movies\|shows] [--limit N]` | Personalized recommendations |
| `trakt-cli stats` | Your personal Trakt stats |

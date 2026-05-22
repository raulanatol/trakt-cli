# trakt-cli

A CLI for [Trakt.tv](https://trakt.tv) designed to be consumed by Claude skills. All commands emit JSON on stdout; errors go to stderr with non-zero exit codes.

## Install

```sh
npm i -g @raulanatol/trakt-cli
# or
pnpm add -g @raulanatol/trakt-cli
```

The global bin is `trakt-cli`.

## Setup

1. Create an app at https://trakt.tv/oauth/applications
   - Redirect URI: `urn:ietf:wg:oauth:2.0:oob`
2. Export your credentials **only for the login step**:
   ```sh
   export TRAKT_CLIENT_ID=...
   export TRAKT_CLIENT_SECRET=...
   trakt-cli login       # device flow — follow on-screen instructions
   ```

After `login`, the credentials are persisted in `~/.config/trakt-cli/auth.json` (mode `0600`) alongside the OAuth tokens, so you can `unset` the env vars. The CLI will refresh tokens transparently when they expire without needing them again.

### Upgrading from 1.0.x

`1.0.0` required the env vars on every command. If you upgraded an existing install, run `trakt-cli logout && trakt-cli login` once (with env vars set) to migrate your session to the new format.

### Local development

```sh
pnpm install
pnpm build
pnpm link --global
```

## Commands

All commands emit JSON. Errors → stderr as `{"error": "..."}` and exit ≠ 0.

| Command | Description |
| --- | --- |
| `trakt-cli login` | OAuth device flow |
| `trakt-cli logout` | Remove stored tokens |
| `trakt-cli whoami` | Authenticated user info |
| `trakt-cli history [--type movies\|shows] [--limit N]` | Watch history |
| `trakt-cli watchlist [--type] [--limit N]` | Watchlist items |
| `trakt-cli search <query> [--type movie\|show]` | Search |
| `trakt-cli trending [--type movies\|shows] [--limit N]` | Trending |
| `trakt-cli recommendations [--type movies\|shows] [--limit N]` | Personal recommendations |
| `trakt-cli stats` | Your Trakt stats |

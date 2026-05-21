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
2. Export your credentials:
   ```sh
   export TRAKT_CLIENT_ID=...
   export TRAKT_CLIENT_SECRET=...
   ```
3. Authenticate:
   ```sh
   trakt-cli login       # device flow — follow on-screen instructions
   ```

Tokens are stored at `~/.config/trakt-cli/auth.json` with mode `0600`.

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

# trakt-cli

A friendly command-line tool for [Trakt.tv](https://trakt.tv) — the service that tracks what you watch on TV and in movies, scrobbles from your media players, and keeps your watchlist, history and stats in one place.

`trakt-cli` exposes that data through a clean interface, so you can pipe it into scripts, dashboards, or **AI skills** that need to know what you've been watching. Commands emit JSON where documented; errors go to stderr with non-zero exit codes.

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

Run `make help` to see every available task.

### Releasing

Releases are cut with a single command from an up-to-date `main`:

```sh
make release-dry-run   # optional: run every guard and list commits since the last tag
make release-minor     # or release-patch / release-major
```

Pick the bump with [semver](https://semver.org): `patch` for fixes, `minor` for new commands or options, `major` for breaking changes to the JSON output or CLI flags.

The target refuses to run unless you are on `main`, the working tree is clean, and local `main` matches `origin/main`. It then runs the typecheck and the test suite, bumps `package.json`, creates the `chore(release): X.Y.Z` commit plus the `vX.Y.Z` tag, and pushes both.

Pushing the tag triggers `.github/workflows/release.yml`, which tests, builds, publishes to npm (with provenance) and creates the GitHub Release with auto-generated notes. Follow it with `gh run watch`.

If the workflow fails after the tag is pushed (for example, an expired `NPM_TOKEN` secret), fix the cause, then delete and re-push the tag:

```sh
git push --delete origin vX.Y.Z && git tag -d vX.Y.Z
git tag vX.Y.Z && git push origin vX.Y.Z
```

## Commands

Commands emit JSON on stdout by default. `episodes:missing` emits readable terminal lines unless `--json` is supplied. Errors are written to stderr as `{"error": "..."}` and exit with a non-zero status.

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
| `trakt-cli episodes:missing --show <query> [--season N] [--next] [--json]` | Pending episodes for a show (`--json` for automation) |

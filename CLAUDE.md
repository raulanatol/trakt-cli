# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

`trakt-cli` is a Node.js CLI for Trakt.tv designed to be consumed by Claude skills. The contract is strict and machine-oriented:

- **stdout is JSON only** — every successful command emits a single `JSON.stringify(data, null, 2)` blob followed by `\n` (`src/output.ts:emit`).
- **stderr is for humans and errors** — interactive prompts (e.g. the device-flow URL/code in `src/commands/login.ts`) and JSON error payloads (`{"error": "...", "code": "..."}`) both go to stderr.
- **Non-zero exit on failure** — `src/output.ts:fail` writes to stderr and `process.exit(1)`.

Preserve this contract when adding or changing commands. Never `console.log` non-JSON to stdout from inside a command.

## Commands

```sh
npm run build      # tsc → dist/
npm run dev        # tsc --watch
npm run clean      # rm -rf dist
npm link           # exposes `trakt-cli` globally after build
node dist/index.js <cmd>   # run without linking
```

There is no test runner, linter, or formatter configured. If you add one, wire it into `package.json` scripts.

Required env vars for any command that talks to Trakt: `TRAKT_CLIENT_ID`, `TRAKT_CLIENT_SECRET` (see `src/config.ts:getCredentials`). The CLI throws a clear error if either is missing.

## Architecture

ESM TypeScript, `strict` + `noUncheckedIndexedAccess` on, Node ≥20 (relies on global `fetch`). Imports use `.js` extensions because `tsconfig.json` emits ESM and `package.json` has `"type": "module"` — keep this when adding new files.

Layering (each layer only depends on the ones below it):

1. **`src/config.ts`** — endpoint constants, config paths, and `getCredentials()` reading env vars. Auth tokens live at `~/.config/trakt-cli/auth.json` with mode `0600` (enforced by `token-store.ts:writeToken`).
2. **`src/auth/`** — `token-store.ts` (read/write/clear the JSON token file) and `device-flow.ts` (OAuth device flow + refresh). `device-flow.ts` handles Trakt's full polling state machine — 200/400/404/409/410/418/429 each have specific semantics; consult it before changing.
3. **`src/api/client.ts`** — single `request<T>(path, opts)` entrypoint. It transparently refreshes expired tokens via `ensureToken` (60s skew in `token-store.ts:isExpired`). Pass `auth: false` for unauthenticated endpoints (e.g. `search`, `trending`). All requests include `trakt-api-version: 2` and `trakt-api-key: <clientId>` headers — set in one place; don't duplicate.
4. **`src/commands/*.ts`** — one file per subcommand. Each exports a single async function that takes commander options, calls `request(...)`, and `emit`s the result. Commands should stay this thin; put any reusable logic in `api/` or a new helper.
5. **`src/index.ts`** — commander wiring. Every action is wrapped in `run(...)` so thrown errors become JSON on stderr with the appropriate exit code. The top-level `parseAsync` catch is the final safety net.

### Adding a new command

1. Create `src/commands/<name>.ts` exporting `async function <name>Command(opts)`.
2. Inside it, call `request('/path', { query: {...} })` and `emit(data)`. Pass `auth: false` only if the Trakt endpoint allows unauthenticated calls.
3. Register the command in `src/index.ts` inside `run(...)` so error handling stays uniform.
4. Update the README command table.

### Error handling convention

Throw `Error` (optionally with a `code` property attached as `(err as NodeJS.ErrnoException).code = 'ENOAUTH'`) from anywhere. Both the per-command wrapper in `src/index.ts:run` and the top-level `parseAsync` catch will surface it via `fail()`. The custom code `ENOAUTH` is emitted when no token exists (see `src/api/client.ts:ensureToken`); reuse it rather than inventing a new "not logged in" signal.

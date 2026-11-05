PNPM ?= pnpm
BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null)

.DEFAULT_GOAL := help

.PHONY: help install build clean dev typecheck test check link unlink \
        release-patch release-minor release-major \
        release-dry-run _guard-clean _guard-main _guard-synced _release

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies (frozen lockfile)
	$(PNPM) install --frozen-lockfile

build: ## Compile TypeScript to dist/
	$(PNPM) run build

clean: ## Remove dist/
	$(PNPM) run clean

dev: ## Watch mode (tsc --watch)
	$(PNPM) run dev

typecheck: ## Run tsc --noEmit
	$(PNPM) run typecheck

test: ## Run the test suite
	$(PNPM) test

check: typecheck test ## Typecheck + tests (test also builds) — release gate

link: build ## pnpm link --global (after build)
	$(PNPM) link --global

unlink: ## pnpm unlink --global
	$(PNPM) unlink --global

# --- Release ---------------------------------------------------------------
# Single entrypoint for cutting a release. See "Releasing" in README.md.
#
#   make release-patch | release-minor | release-major
#
# Guards: on main, clean tree, in sync with origin/main, typecheck + tests pass.
# Then bumps package.json, creates commit "chore(release): X.Y.Z" + tag vX.Y.Z,
# and pushes both. The tag triggers .github/workflows/release.yml, which
# publishes to npm and creates the GitHub Release.

release-patch: BUMP=patch ## Release a patch version (x.y.Z) — bug fixes
release-patch: _release

release-minor: BUMP=minor ## Release a minor version (x.Y.0) — new features
release-minor: _release

release-major: BUMP=major ## Release a major version (X.0.0) — breaking changes
release-major: _release

release-dry-run: _guard-main _guard-clean _guard-synced check ## Run every release guard without bumping or pushing
	@echo "✓ All release guards passed. Current version: $$(node -p "require('./package.json').version")"
	@echo "  Commits since last tag:"
	@git log --oneline "$$(git describe --tags --abbrev=0)..HEAD" | sed 's/^/    /'

_release: _guard-main _guard-clean _guard-synced check
	@echo "→ Bumping $(BUMP) version…"
	npm version $(BUMP) -m "chore(release): %s"
	@echo "→ Pushing commit and tag to origin/main…"
	git push origin main --follow-tags
	@echo "✓ Tag v$$(node -p "require('./package.json').version") pushed."
	@echo "  Follow the workflow with: gh run watch"

_guard-clean:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "✗ Working tree is not clean. Commit or stash first."; \
		git status --short; \
		exit 1; \
	fi

_guard-main:
	@if [ "$(BRANCH)" != "main" ]; then \
		echo "✗ Releases must be cut from main (current: $(BRANCH))."; \
		exit 1; \
	fi

_guard-synced:
	@git fetch --quiet --tags origin main
	@if [ "$$(git rev-parse HEAD)" != "$$(git rev-parse origin/main)" ]; then \
		echo "✗ Local main differs from origin/main. Run 'git pull' (or push) first."; \
		exit 1; \
	fi

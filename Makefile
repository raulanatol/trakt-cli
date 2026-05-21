PNPM ?= pnpm
BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null)

.DEFAULT_GOAL := help

.PHONY: help install build clean dev typecheck test check link unlink \
        release-patch release-minor release-major \
        _guard-clean _guard-main _release

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

check: typecheck build ## Typecheck + build (release gate)

link: build ## pnpm link --global (after build)
	$(PNPM) link --global

unlink: ## pnpm unlink --global
	$(PNPM) unlink --global

# --- Release ---------------------------------------------------------------
# Bumps version in package.json, creates commit + tag, and pushes both.
# The release workflow (.github/workflows/release.yml) picks up the tag
# and publishes to npm.

release-patch: BUMP=patch ## Release a patch version (x.y.Z)
release-patch: _release

release-minor: BUMP=minor ## Release a minor version (x.Y.0)
release-minor: _release

release-major: BUMP=major ## Release a major version (X.0.0)
release-major: _release

_release: _guard-main _guard-clean check
	@echo "→ Bumping $(BUMP) version…"
	npm version $(BUMP) -m "chore(release): %s"
	@echo "→ Pushing commit and tag to origin/main…"
	git push origin main --follow-tags
	@echo "✓ Released. Watch the release workflow on GitHub Actions."

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

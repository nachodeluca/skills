# Git, Gitflow and commits

## Contents
- When to commit
- Gitflow branches
- Branch names
- Commit message format
- Merge commits
- Releases and hotfixes
- Rules that protect the history
- Examples

## When to commit

Commit or push only when the user asks. Never decide on your own to publish work. When asked, follow the project's own instructions first (a `CLAUDE.md`/`AGENTS.md`, or attribution lines the environment requires); this file is the default.

## Gitflow branches

| Branch | Purpose | Branches from | Merges into |
|-|-|-|-|
| `main` | Production. Every commit on it is a release, tagged `vX.Y.Z` | - | - |
| `develop` | Integration of the next release | `main` | - |
| `feature/*` | One feature or change | `develop` | `develop` |
| `release/*` | Final polish of a version: version bump, last fixes, no new features | `develop` | `main` and `develop` |
| `hotfix/*` | Urgent fix of production | `main` | `main` and `develop` |

Never commit directly to `main` or `develop`. If the current branch is one of them, create the right branch first. If the project does not use `develop` (trunk-based, only `main`), follow the project and mention the difference.

## Branch names

`<type>/<short-kebab-description>`, lowercase, no spaces, optionally with the ticket id:
- `feature/order-cancellation`
- `feature/PROJ-123-invoice-export`
- `release/1.4.0`
- `hotfix/payment-double-charge`

One branch, one purpose. Keep it short-lived: merge it back before it drifts.

## Commit message format

```
<type>(<scope>): <summary in the imperative, lowercase, no period>

<optional body: why, not what. Wrapped at ~72 columns>

<optional footer: Refs: PROJ-123, BREAKING CHANGE: ...>
```

Types:
| Type | Use for |
|-|-|
| `feat` | A new capability for the user |
| `fix` | A bug fix |
| `refactor` | Structure change with the same behavior |
| `perf` | A measured performance improvement |
| `test` | Adding or fixing tests only |
| `docs` | Documentation only |
| `style` | Formatting only, no logic |
| `build` | Build system or dependencies |
| `ci` | Pipelines |
| `chore` | Maintenance that fits nowhere else |
| `revert` | Reverting a previous commit |

Rules:
- The summary is 50 characters ideally, 72 at most, in the imperative: `add order cancellation`, not `added` or `adds`.
- `scope` is the feature or package touched (`orders`, `api`, `web`). Omit it if the change is repo-wide.
- The body explains *why* and any trade-off. The diff already shows what.
- A breaking change gets `!` after the scope (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer.
- Match the language and style of the project's recent commits (`git log --oneline -20`) before writing yours.
- One logical change per commit. Do not mix refactor, feature and formatting. A reader should be able to revert one commit and remove exactly one idea.

## Merge commits

Gitflow merges keep the branch visible in history, so merge with `--no-ff`:
```
git checkout develop
git merge --no-ff feature/order-cancellation
```
Default message, kept as is: `Merge branch 'feature/order-cancellation' into develop`.
Release and hotfix merges into `main` are tagged right after: `git tag -a v1.4.0 -m "release 1.4.0"`.

Before merging a feature, make it reviewable: rebase or merge `develop` into the branch so conflicts are solved on the branch, tests green, formatter and linter clean.

## Releases and hotfixes

Release:
1. `git checkout -b release/1.4.0 develop`
2. Only version bump, changelog and bug fixes on it (`chore(release): bump version to 1.4.0`).
3. Merge `--no-ff` into `main`, tag `v1.4.0`, merge back into `develop`, delete the release branch.

Hotfix:
1. `git checkout -b hotfix/payment-double-charge main`
2. Fix with a test (`fix(payments): prevent double charge on retry`).
3. Merge `--no-ff` into `main`, tag a patch version (`v1.4.1`), merge into `develop`, delete the branch.

## Rules that protect the history

- Never `--no-verify` or skip signing unless the user explicitly asks. If a hook fails, fix the cause.
- Never force-push to `main` or `develop`. Force-push to your own feature branch only if you rewrote it, and only with `--force-with-lease`.
- Prefer a new commit over amending a commit that is already pushed.
- Never commit secrets, `.env` files, build output, or large generated files. Check `git status` and the diff before committing.
- Stage specific files, not `git add -A`, so unrelated changes do not slip in.
- Do not run destructive commands (`reset --hard`, `clean -fd`, `checkout -- .`, branch deletion with unmerged work) without being asked; look at what would be lost first.

## Examples

Good:
```
feat(orders): add order cancellation

An order can be cancelled only while it is still "created". Paid orders go
through the refund flow instead, so the two paths never mix.

Refs: PROJ-123
```
```
fix(payments): prevent double charge on retry
```
```
refactor(orders): extract order state transitions into a table
```

Bad:
```
fix stuff
updated files
WIP
feat: add cancellation, refactor repository, fix typo, update deps
```

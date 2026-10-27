---
name: code-principles
description: Opinionated, non-negotiable coding standards for any project, language or stack - clean code, high cohesion, low coupling (interfaces, dependency injection), scalable and maintainable, fully typed, readable, with UPPER_SNAKE_CASE constants, a fixed class member order, restrained comments and Gitflow commits. Make sure to use this skill whenever the task involves writing or changing code - implementing a feature, endpoint, service, class, component, schema or migration, fixing a bug, adding tests, refactoring, cleaning up or reviewing code or a PR, deciding where code should live or how to structure a module, or creating a branch or commit - even if the user never says "clean code" or "architecture" (also "escribí/armá/refactorizá/revisá código"). Skip it for pure questions, prose, data analysis or one-line answers that write no code. A project's own CLAUDE.md or AGENTS.md wins on project-specific conventions; this skill supplies the underlying principles.
---

# Code principles

These rules apply to every line you write or touch, in any language. A change that breaks them is not done, even if it works. The reason is simple: code is read many more times than it is written, and each shortcut is paid for by the next person (often a future agent with no context).

When a project has its own `CLAUDE.md`/`AGENTS.md`, it wins on project-specific conventions (naming style, folders, tooling). If a project convention conflicts with these principles, say so instead of silently following either.

When two options both work, pick the one with fewer dependencies between modules and the one a newcomer understands faster.

## The four pillars

### 1. Clean code
Readable first, clever never.
- Names say what a thing is or does. Ban `data`, `info`, `handle`, `util`, `tmp`, `manager`, `stuff`.
- Functions are small, do one thing, at one level of abstraction.
- Early returns over deep nesting (guard clauses first, happy path last).
- No dead code, no commented-out code. Version control remembers.
- Comments explain *why* (a constraint, a trade-off, a surprise), never *what*. If you need a comment to say what, rename or extract instead. Only two kinds exist: a `/* ... */` block above a function that truly needs it, and a `//` line where a future editor could break something. Format in `references/comments.md`.
- **No magic numbers.** Every limit, timeout, retry count, size, status code, port, threshold or default is a named constant with units in the name. Only identities stay literal: `0`/`1` as counters, `length === 0`, `index += 1`.
- **No magic strings.** URLs, paths, headers, selectors, locales, env var names used twice, regexes and user-visible messages are named once and reused. Members of a closed union/enum are fine inline because the compiler checks them.
- **Constants are UPPER_SNAKE_CASE and sit at the very top of the file**, right after the imports, before any function or class (never declared in the middle of a function):
  ```ts
  import { ... } from "...";

  const REQUEST_TIMEOUT_MS = 5_000;
  const MAXIMUM_ITEMS = 50;
  const HTTP_TOO_MANY_REQUESTS = 429;
  const RETRY_POLICY = { MAXIMUM_ATTEMPTS: 3, DELAY_MS: 250 } as const;
  ```
  A constant used by several files of one feature goes in a `<feature>.constants.ts` at the root of that feature's folder, not in a global bag. Values only one vendor/provider/environment knows live in that module's config so generic code never mentions it.
- **One source of truth per value.** A fact lives in one place and everything else derives from it. If a rate, limit or name is also written inside a message, label or comment (`"Discount (10%)"` next to `DISCOUNT_RATE = 0.1`), build the text from the constant (`` `Discount (${DISCOUNT_RATE * PERCENT_FACTOR}%)` ``) so changing one cannot leave the other stale.
- **Everything is typed.** Every parameter, return value, field, constant and boundary has an explicit, honest type. No `any`, no implicit `any`, no unchecked casts.

### 2. High cohesion
A module, file or function has one reason to change.
- Group by feature/domain, not by technical layer dumped in one folder (`users/` with its route, service and repository, not `controllers/` + `services/` + `models/` for the whole app).
- If you need "and" to describe what a file does, split it.
- No `utils`, `helpers`, `common`, `misc` grab-bags. If a function has no home, the domain concept it belongs to is missing: name it.

### 3. Low coupling
Modules depend on small, explicit interfaces, not on each other's internals.
- **Implementations never know each other. Everything is wired through interfaces, always.** A class or function depends on an interface (a typed contract it owns or that lives in a shared contracts module), never on a concrete implementation. `OrderService` receives an `OrderRepository` interface, not `PostgresOrderRepository`. Concrete classes are named and instantiated in exactly one place, the composition root.
- Inject dependencies (database, clock, mailer, HTTP client, AI model) instead of importing singletons inside business logic. This is what makes each piece testable alone.
- Business logic never imports the web framework. HTTP handlers hold no business rules and no SQL.
- Dependencies point inward (interface -> service -> repository / port), never the other way and never in cycles.
- Share across packages only through an explicit contract (types/interfaces) or a dedicated package; never reach into another module's internals or tables.
- One composition root wires real dependencies; everything else receives them.

### 4. Scalable and maintainable
- Prefer explicit, typed, boring code. Keep types honest: no `any`, no unchecked casts.
- Validate input at the boundary (schema validation), then trust the types inside.
- Adding a new variant (a new payment method, a new notification channel, a new export format) should be a new file plus one registration line, not edits scattered through generic code. If adding one means touching five places, the seam is wrong.
- Every behavior worth keeping has a test. Test behavior through the public interface; fake the injected ports, not the internals.
- Leave the code cleaner than you found it, but do not refactor unrelated code in the same change. Mention it instead.

## How to work

1. **Read before writing.** Look at the neighboring code and match its naming, structure, comment density and idiom. Consistency beats your personal taste.
2. **Decide where it lives first.** Before writing, name the feature/module and its single responsibility. If it fits nowhere, you are about to create a grab-bag.
3. **Write the smallest thing that is clear.** No speculative abstractions, flags or config nobody asked for. Duplication twice is fine; abstract on the third, and only if the abstraction has a real name.
4. **Self-review before finishing** with the checklist below, then run the project's formatter, linter, typecheck and tests. Report honestly what passed and what did not.

## Self-review checklist

- [ ] Could a newcomer say what each function does from its name alone?
- [ ] Any literal number or string that deserves a name? Are constants UPPER_SNAKE_CASE at the top of the file?
- [ ] Does anything depend on a concrete implementation instead of an interface? Is everything typed?
- [ ] In classes: fields declared explicitly at the top (no constructor parameter properties), then constructor, then public methods, then private methods last?
- [ ] Does each file/function have one reason to change?
- [ ] Do dependencies come in through parameters/constructors, pointing inward, with no cycles?
- [ ] Is business logic free of framework, HTTP and SQL concerns (and the reverse)?
- [ ] Input validated at the boundary, no `any` or unchecked casts?
- [ ] No dead or commented-out code, no comment explaining *what*?
- [ ] New behavior has a test; I did not refactor unrelated code?

## Going deeper

Read these only when the situation calls for them:
- `references/examples.md` - before/after examples of each principle. Read when unsure how to apply a rule.
- `references/structure-and-boundaries.md` - feature folders, layers, ports, composition root, registries. Read when creating a module, service or package, or deciding where code goes.
- `references/classes-and-interfaces.md` - interface-first design, class member order (fields, constructor, public, private), constants at the top, full typing. Read whenever you write a class, a service or a dependency between two modules.
- `references/comments.md` - when a comment is allowed and the exact block format above functions. Read before writing any comment or docblock.
- `references/naming-and-readability.md` - naming, function design, smells table. Read when naming things or when code feels hard to read.
- `references/error-handling.md` - validation at the edge, typed errors, retries, logging. Read when code touches I/O, user input, third parties or failure paths.
- `references/testing.md` - what and how to test, fakes, contract tests, determinism. Read when adding or changing behavior, or fixing a bug.
- `references/typescript.md` - types, unions, modules, async, constants, React components. Read when the project is TypeScript/JavaScript.
- `references/review-and-refactoring.md` - review order, safe refactoring, splitting files. Read when asked to review, refactor or clean up code.

- `references/security.md` - input, secrets, authentication/authorization, dependencies, data exposure. Read when code handles user input, credentials, personal data, auth, uploads or third-party calls.
- `references/data-and-persistence.md` - migrations, queries, transactions, pagination, money and time, caching. Read when touching a database, a schema or anything stored.
- `references/git-and-commits.md` - Gitflow branches and commit message format. Read before creating a branch, committing or merging (and only commit when the user asks).

## Templates

`assets/templates/feature/` is a complete small feature (constants, types, errors, repository interface, ports, service class, in-memory implementation, tests, composition root) that already follows every rule. When creating a new feature or module, copy and rename it instead of inventing the structure; `assets/templates/README.md` explains each file.

## Audit script

`scripts/audit-code.mjs` (Node, read-only) checks the mechanical rules: magic numbers, repeated strings, `any`, long functions, deep nesting, many parameters, grab-bag file names, commented-out code, long files. Run it on what you wrote or changed before finishing: `node <skill-dir>/scripts/audit-code.mjs <paths>`. Findings are hints, not verdicts; fix the real ones and decide consciously on the rest. It cannot judge cohesion, coupling or naming, which stay your job. Details in `references/review-and-refactoring.md`.

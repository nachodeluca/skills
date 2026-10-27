# Data and persistence

## Contents
- Keep persistence behind an interface
- Schema and migrations
- Queries
- Transactions and concurrency
- Pagination
- Money, time and identifiers
- Caching

## Keep persistence behind an interface

Only repositories talk to the database, and the rest of the code sees them as interfaces (see `classes-and-interfaces.md`). Services never contain SQL; routes never import the driver. Only one package or folder imports the ORM/driver, so a change of database touches one place.

Return domain types, not rows. A repository maps between the table shape and the domain shape in one spot.

Keep an in-memory implementation of each repository for tests, and run one contract test against both the real and the in-memory version so they do not drift.

## Schema and migrations

- The schema lives in code and every change is a versioned migration, committed with the code that needs it. Never edit the database by hand in an environment that matters.
- A migration is small, does one thing, and is safe to run on a live system: add a nullable column or a default, backfill, then add the constraint, over separate deploys. Avoid locking a big table.
- Never edit a migration that already ran anywhere. Add a new one.
- Destructive changes (drop column/table, narrowing a type) are a separate step after the code stopped using the thing, and are called out to the user first.
- Enforce rules in the database too: primary keys, foreign keys, `NOT NULL`, `UNIQUE`, `CHECK`. The application is not the only writer, and constraints catch bugs you did not think of.
- Name tables and columns consistently and in the domain's vocabulary (snake_case plural tables, `created_at`, `updated_at`).
- Index what you filter, join and sort on; check with `EXPLAIN` before and after. An index you never use costs every write.

## Queries

- Parameterized always (see `security.md`).
- Select the columns you need, not `SELECT *`.
- Avoid N+1: load related data in one query or a batch, not inside a loop.
- Push work the database does well (filtering, aggregation, sorting, counting) into SQL instead of loading rows to process them in code. A report must cost the same at ten rows or ten million.
- A read that may be large is paginated or streamed, never loaded whole.

## Transactions and concurrency

- A transaction wraps the writes that must succeed or fail together, and nothing slow (no network calls inside it).
- State changes use compare-and-set (`UPDATE ... WHERE id = $1 AND status = $2`) or optimistic versioning, so two simultaneous requests cannot both succeed. Check the affected row count.
- Make writes idempotent when a retry can happen: a client-chosen id or an idempotency key plus a unique constraint, so a repeat is the same operation, not a duplicate.
- Keep a state machine as a table of allowed moves (from, to) in one place, not `if`s scattered through services.

## Pagination

Prefer keyset (cursor) pagination over `OFFSET`: it stays fast on big tables and does not skip or repeat rows while data changes. Order by a stable, indexed key plus a tiebreaker (`updated_at, id`). The cursor is opaque to the client. Cap the page size with a named constant.

## Money, time and identifiers

- Money is an integer in minor units plus a currency code (`priceMinor`, `currency`), never a float.
- Store timestamps in UTC with time zone; convert to the user's zone only at the edge. Business calendars (a "month" for billing) name their zone in a constant.
- Inject the clock; never call `now()` inside business logic.
- Identifiers are opaque (UUID/ULID), not sequential numbers exposed to users. Never reuse them.

## Caching

Measure first; cache only what is slow and read far more than written. Say in one place who invalidates it and when, set a TTL as a named constant, and make sure a stale value cannot cause a wrong charge or a leaked record. Never cache per-user data under a shared key.

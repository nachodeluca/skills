# Structure and boundaries

## Contents
- Feature folders
- Layers and the direction of dependencies
- Ports and adapters
- Composition root
- Extending without editing generic code
- Testing seams

## Feature folders

Group by what the code is about, not by what kind of file it is.
```
src/
  modules/
    orders/        routes, service, repository, tests together
    payments/
  config/          environment parsing, validated once
  http/            what every feature shares about HTTP
```
What several features truly share sits beside `modules/` under a name that says what it is (`auth/`, `logging/`, `mail/`). Never `common/`.

## Layers and the direction of dependencies

```
routes (HTTP + validation)  ->  service (rules)  ->  repository (persistence)
```
- Routes translate HTTP to a service call and back. No business rules, no SQL.
- Services hold the rules and know nothing about HTTP or the database driver.
- Repositories only persist and read.
- Arrows never reverse and never form a cycle. If service B needs service A and A needs B, extract the shared concept into a third module.

## Ports and adapters

When business logic needs the outside world (database, clock, mail, payment provider, AI model), define a small interface (a port) in the module that needs it, shaped by what the module needs, not by what the vendor offers. Implement it once per real vendor (an adapter) in one place. The vendor's SDK is imported in that adapter only.

Benefits: swapping vendors is a new adapter; tests use an in-memory fake; a vendor change cannot ripple through the app.

Implementations never reference each other: not service to concrete repository, not the Postgres repository to the in-memory one, not one adapter to another. They meet only through the interface (see `classes-and-interfaces.md`). A quick test: delete one implementation; only the composition root should fail to compile.

## Composition root

Exactly one place (e.g. `server.ts`/`main`) reads the environment and builds real dependencies, then hands them down. The rest of the app receives its dependencies through parameters, so it can be exercised in tests with fakes and no environment.

## Extending without editing generic code

Model variants as a registry:
```
payment-providers/
  stripe/        its own endpoints, keys and quirks in its own config
  paypal/
registry.ts      one entry per provider
```
Adding a provider = a new folder + one registration line. Generic code never names a specific variant; values only one variant knows live in that variant's config.

## Testing seams

- Test through the public interface of a module.
- Fake ports (repository, clock, mailer), never internals.
- When there are two implementations of a port (real and in-memory), run one shared contract test against both so they cannot drift.
- Pure helpers get plain unit tests; no mocking needed.

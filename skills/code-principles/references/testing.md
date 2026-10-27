# Testing

## Contents
- What to test
- Shape of a good test
- Fakes, not mocks of internals
- Contract tests for two implementations
- Test data and names
- Determinism
- Order of work

## What to test

Every behavior worth keeping has a test: the rules in services, state transitions, edge cases and every bug you fix (write the failing test first, then the fix). Do not test the framework, getters, or implementation details that can change without changing behavior.

Test through the public interface of a module. If you must reach into internals to test something, the module has the wrong seams.

## Shape of a good test

Arrange, act, assert, visibly separated. One reason to fail per test. The test name states the scenario and the expectation in plain words:

`rejects payment when the order is already cancelled`
not `test approve 2`.

A reader should understand the rule from the test alone, without opening the implementation.

## Fakes, not mocks of internals

Dependencies come in through the constructor/parameters (see structure-and-boundaries.md), so a test passes:
- an in-memory repository instead of the database,
- a fixed clock instead of `new Date()`,
- a recording mailer instead of sending email,
- a scripted model/HTTP client instead of the network.

Prefer a hand-written fake with real behavior over a mock that asserts on call order. Asserting "method X was called twice with Y" couples the test to the implementation; asserting on the resulting state and on what the fake recorded couples it to behavior.

## Contract tests for two implementations

When a port has a real implementation (Postgres) and an in-memory one, write one contract test suite and run it against both. This keeps the fake honest, so the fast tests stay trustworthy. Integration tests against the real thing may be opt-in behind an env var, with a clear skip message.

## Test data and names

- Name the values that express the scenario: `UNIT_PRICE_MINOR`, `LIFETIME_MS`, `expiredAt`. A magic `42` in a test hides what matters.
- Structural fixtures (an id that is just an id) may stay inline.
- Use small builders (`anOrder({ status: "cancelled" })`) so each test states only what is relevant to it.
- Assert on strings that are the point of the test; do not extract those.

## Determinism

No real time, randomness, network, or shared mutable state in unit tests. Inject the clock and the id generator. Tests must pass in any order and in parallel. A flaky test is a bug: fix or delete it, never retry it into green.

Tests that cost money or hit real services (LLM evals, calls to a real payment provider or any live third-party API) live apart from the default test command and are run on purpose.

## Order of work

1. Write or update the test that describes the behavior.
2. Make it pass with the simplest clean code.
3. Refactor with the tests green.
4. Run the project's formatter, linter, typecheck and the whole test suite before saying it is done, and report honestly what passed.

# Error handling

## Contents
- Principles
- Validate at the boundary
- Typed errors and where they are translated
- Never swallow
- Retries, timeouts, idempotency
- Logging
- Messages

## Principles

Errors are part of the design, not an afterthought. Decide for every operation what can fail, who can fix it, and what the caller sees.

## Validate at the boundary

Everything that enters the system (HTTP body, query string, env vars, webhook payload, file, model output, third-party response) is untrusted. Parse it once at the edge with a schema (zod, pydantic, serde...) into a typed value. Inside, trust the types and do not re-validate.
- Env vars: parse and validate in one config module at startup. Fail fast with a message that names the variable. Never read `process.env` scattered through the code.
- Third-party responses: validate the fields you use; do not assume the shape stays.

## Typed errors and where they are translated

- Business logic throws or returns domain errors that say what happened in business terms (`OutOfStock`, `OrderAlreadyPaid`), not HTTP codes and not driver errors.
- The outermost layer (route, job runner, CLI) is the only place that translates a domain error to a status code, exit code or user message. The service never knows about 404.
- Prefer a small closed set of error kinds that callers can branch on, over string matching on messages.
- Expected failures (not found, invalid state, limit reached) are values or typed errors. Bugs are exceptions that surface loudly.

## Never swallow

- No empty `catch`. If you catch, you either handle it (recover, translate) or add context and rethrow.
- Keep the original error as `cause` when wrapping.
- Do not catch broad exceptions "just in case". Catch the narrowest thing you can actually handle.
- A fallback that hides a failure (returning `[]` when the database is down) turns an outage into wrong data. Fail visibly or degrade explicitly and log it.

## Retries, timeouts, idempotency

- Every call to the outside world has a timeout, named in a constant with its unit.
- Retry only what is safe and transient (network, 429/503), with bounded attempts, backoff, and respect for `Retry-After`. Never retry a non-idempotent write blindly.
- Make writes idempotent where retries can happen: the client chooses an id, so a repeat is the same operation, not a duplicate. Use compare-and-set for state transitions so two concurrent moves cannot both succeed.
- Ask the source of truth again instead of believing a notification (a webhook says "something happened"; fetch the state to learn what).

## Logging

- Log at the boundary where the error is handled, once. Not at every layer it passes through.
- Structured, with identifiers that let you find the story (request id, entity id). Never secrets, tokens, full card numbers, or personal data that is not needed.
- Do not log and rethrow the same error at every level; that creates duplicates.

## Messages

- Developer-facing: say what failed and with which input, so the log is actionable.
- User-facing: say what happened and what they can do, in the product's language and tone. Never leak stack traces, SQL or internals. The text lives in one named place, not inline.

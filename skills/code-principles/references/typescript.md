# TypeScript specifics

Load when the project is TypeScript/JavaScript. The principles are the same in any language; this is how they look here.

## Contents
- Types that tell the truth
- Closed unions instead of strings
- Validation at the edge
- Modules and imports
- Async
- Constants and policy objects
- React / UI components

## Types that tell the truth

- No `any`. Use `unknown` at untrusted edges and narrow it by validation. No `as` casts to silence the compiler; a cast that needs a comment is a design problem.
- Make illegal states unrepresentable: a discriminated union `{ status: "paid"; paidAt: Date } | { status: "pending" }` beats optional fields that may or may not go together.
- Derive types from the single source (a zod schema: `type X = z.infer<typeof xSchema>`) instead of writing the shape twice.
- Prefer `readonly` and `as const` for data that should not change.
- Export the smallest surface. A module exposes an interface; its helpers stay unexported.

## Closed unions instead of strings

`type OrderStatus = "created" | "paid" | "cancelled"` lets the compiler catch a typo, so these literals may stay inline. Use exhaustive `switch` with a `never` check so adding a member forces every handler to update. A transition table (`Record<Status, Transitions>`) beats an if-ladder.

## Validation at the edge

Parse request bodies, query strings, env vars and third-party payloads with a schema at the boundary and pass typed values inward. Return the parsed value, not the raw input.

## Modules and imports

- One main export per file, named after the file; named exports over default for greppability.
- No circular imports. If two modules need each other, extract the shared concept.
- Import from a package's public entry only (`@scope/pkg`), never from its `src/internal/...`.
- Keep framework imports (Express, Fastify, Next) in the outer layer. A service file that imports the framework is a smell.
- Dependencies are passed in: `createXService({ repository, clock })`, wired in one composition root.

## Async

- `async/await` over raw promise chains. Always handle rejections; never leave a floating promise (`void` it deliberately and log, or await it).
- Run independent work with `Promise.all`; bound concurrency for large fan-out.
- Pass an `AbortSignal` / timeout to every outbound call.

## Constants and policy objects

```ts
const MINUTE_MS = 60 * 1_000;
const SESSION_POLICY = {
  LIFETIME_MS: 30 * MINUTE_MS,
  MAXIMUM_OPEN_ORDERS: 5,
} as const;
```
UPPER_SNAKE_CASE, at the very top of the file after the imports, in the module that owns the policy (or in the feature's `<feature>.constants.ts` when several files use it). Env var names, header names, paths and cookie names are named once. See `classes-and-interfaces.md`.

Also in TypeScript: depend on interfaces and use `import type` for them, declare return types on exported functions, and mark implementing classes with `implements`.

## React / UI components

- A component renders; it does not fetch, validate or hold business rules. Move logic to hooks or services that take their dependencies.
- Small components with one job; props typed and minimal. No prop drilling past two levels: use composition or context for genuinely shared state.
- Derive state instead of copying it; do not mirror props into state.
- Effects synchronize with the outside world only. Computation belongs in render, events in handlers.
- Follow the design system's primitives and tokens; no raw colors or magic spacing numbers where tokens exist.
- Accessibility is part of done: labels, roles, keyboard, focus, contrast.
- User-visible text lives in one place (a constants/copy module), not scattered inline, so it can be reviewed and translated.

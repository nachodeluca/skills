# Comments

## Contents
- The rule
- Block comment above a function
- Line comment inside code
- What never gets a comment
- Examples

## The rule

Code explains *what*; names, types and small functions do that job. A comment exists only to carry what the code cannot say: *why* it is this way, or a warning for whoever changes it next. Fewer comments, each one earning its place. A comment that repeats the code is noise that goes stale and starts to lie.

Two, and only two, kinds of comments are allowed:
1. A **block comment above a function**, only when the function needs it.
2. A **line comment inside the code**, only where something must be clarified for a future change by another person.

## Block comment above a function

Only on functions that need it: a non-obvious contract, a business rule, a side effect, a constraint, an ordering requirement. Most functions need none, because a good name and good types already say it. Do not put a block on every function.

Format: a block, with the text on its own lines between the delimiters:

```ts
/*

Moves the order to the next state. Applies the move with a compare-and-set,
so two simultaneous moves cannot both succeed: the loser gets a conflict error.

*/
async function advanceOrder(request: AdvanceRequest): Promise<Order> {
  ...
}
```

Note the closing delimiter is `*/`. Keep the text short: say what the function guarantees, what it expects, and what can surprise the caller. Write it in plain sentences, no restating of the signature, no `@param` lists that repeat the types.

When the project already has a different documentation convention (for example JSDoc enforced by a linter), follow the project and mention the difference to the user.

## Line comment inside code

Only where something really needs clarifying for a future change by another person: a trap, a workaround, a reason a "simpler" version would break, a link to the source of a magic requirement.

```ts
// The login service locks the account after five wrong passwords, so this is tried only once.
const loginResult: LoginResult = await authService.login(email, password);
```

Ask before writing one: "if someone edits this line next month without knowing the history, what would they break?" If nothing, there is no comment. If the answer is "a name would have prevented it", rename instead.

Prefer one clear line. If it needs a paragraph, the code probably needs a function or a named constant instead.

## What never gets a comment

- What the code obviously does (`// increment counter`, `// loop over users`).
- Banner or section dividers (`// ---- helpers ----`); split the file instead.
- Commented-out code; delete it, version control remembers.
- `TODO` without an owner and a reason; either do it, or tell the user.
- Changelog or author notes (`// fixed by ...`); git remembers.
- A comment compensating for a bad name or a long function; fix the name or split the function.
- Comments on getters, trivial constructors, plain types or constants whose name already says it.

## Examples

Needed (block, non-obvious guarantee):
```ts
/*

Returns the offers sorted by unit price, cheapest first. Offers without a known
size are kept at the end, because their unit price cannot be computed.

*/
function sortByUnitPrice(offers: readonly Offer[]): Offer[] { ... }
```

Needed (line, protects a future change):
```ts
// Must run before the charge: the payment provider rejects an invoice that has no tax id.
await attachTaxId(invoice);
```

Not needed (the name and the types already say it):
```ts
// Gets the user by id
function findUserById(userId: string): Promise<User | null> { ... }
```
Delete the comment; the signature is the documentation.

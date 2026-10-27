# Naming and readability

## Contents
- Names that say what a thing is
- Functions
- Booleans, collections, units
- Reading flow of a file
- Formatting
- Smells to fix on sight

## Names that say what a thing is

A name is the cheapest documentation. Spend time on it.
- Nouns for things (`invoice`, `deliveryWindow`), verbs for actions (`closeInvoice`, `findOpenOrders`).
- Name by role in the domain, not by type: `pendingOrders`, not `orderList`; `customer`, not `userObj`.
- Use the vocabulary of the business (the words the user and the product use). One concept, one word across the codebase: not `fetch`, `get`, `load` and `retrieve` for the same idea.
- No abbreviations a newcomer must decode (`usr`, `cfg`, `mgr`). Well-known ones are fine (`id`, `url`, `html`).
- Banned for being empty: `data`, `info`, `item`, `thing`, `stuff`, `handle`, `process`, `do`, `manager`, `helper`, `util`, `tmp`, `obj`, `val`.
- Longer is fine when scope is wide; short is fine in a three-line scope (`order` in a `.map`, not `o`... but `o` never).
- If you cannot name it without "and" or "or", it does two things.

## Functions

- Name tells what it does; body does exactly that and nothing else. A function called `getUser` that also writes a log line lies.
- Prefer at most 3 parameters. More than that means a missing concept: group them into a named object (`{ origin, destination, deliveryMethod }`).
- Avoid boolean flag parameters (`render(true)`). Split into two functions or pass a named option.
- Separate commands (change something) from queries (return something). A query has no side effects.
- Return early on invalid or trivial cases; keep the happy path at the left margin.
- Prefer pure functions: same input, same output, no hidden state. Push side effects to the edges.

## Booleans, collections, units

- Booleans read as questions: `isExpired`, `hasStock`, `canShipTo`. Never negated names (`isNotValid`), they breed double negatives.
- Collections are plural: `products`, `selectedIds`.
- Put the unit in the name when the type does not carry it: `timeoutMs`, `priceMinor` (minor currency units), `weightKg`, `retryDelaySeconds`.
- Name the transformation, not the mechanism: `productsBySku`, not `map1`.

## Reading flow of a file

Top-down like a newspaper: the main exported thing first, then the helpers it calls in the order it calls them, details last. A reader should understand the file's purpose from its first screen.
- Imports, then constants of this module, then the public API, then private details.
- One main concept per file, named after it.

## Formatting

Let the project's formatter decide (Biome, Prettier, gofmt, black...). Never hand-format against it. Run it before finishing. Style arguments are not worth a reviewer's time.

## Smells to fix on sight

| Smell | Fix |
|-|-|
| Comment explaining what a block does | Extract a function named after that comment |
| Long parameter list | Group into a named object |
| Same `if (kind === ...)` ladder in many places | Table or registry lookup |
| Nested ternaries | Early returns or a small function |
| Boolean flag selects behavior | Two functions |
| Variable reused for different meanings | One variable per meaning |
| Deep nesting (>3 levels) | Guard clauses, extract |
| Function over ~40 lines | Split by step |
| Dead code, unused imports/params | Delete |

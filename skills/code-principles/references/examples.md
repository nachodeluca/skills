# Before / after examples

Examples are in TypeScript but the ideas are language-agnostic.

## Contents
- Naming and small functions
- Magic numbers and strings
- Early returns
- Comments
- Dependency injection
- Cohesion: splitting a file that says "and"

## Naming and small functions

Before:
```ts
function handle(data: any) {
  // validate, compute total, save, send email
}
```
After:
```ts
function placeOrder(request: PlaceOrderRequest): Order {
  const items = validateItems(request.items);
  const order = createOrder(items);
  orders.save(order);
  notifier.orderPlaced(order);
  return order;
}
```
Each step is one call at the same level of abstraction; the details live in their own named functions.

## Magic numbers and strings

Before:
```ts
if (retries > 3) throw new Error("fail");
await sleep(5000);
if (res.status === 429) { ... }
```
After:
```ts
// top of the file, right after the imports
const RETRY_POLICY = { MAXIMUM_ATTEMPTS: 3, DELAY_MS: 5_000 } as const;
const HTTP_TOO_MANY_REQUESTS = 429;

// ...below, in the functions
if (attempts > RETRY_POLICY.MAXIMUM_ATTEMPTS) throw new RetriesExhaustedError();
await sleep(RETRY_POLICY.DELAY_MS);
if (response.status === HTTP_TOO_MANY_REQUESTS) { ... }
```
UPPER_SNAKE_CASE, at the top of the file, in the module that owns the policy, with units in the name. See classes-and-interfaces.md.

## Early returns

Before:
```ts
function price(user, item) {
  if (user) {
    if (item) {
      if (item.inStock) { return compute(user, item); }
    }
  }
  return null;
}
```
After:
```ts
function price(user, item) {
  if (!user || !item) return null;
  if (!item.inStock) return null;
  return compute(user, item);
}
```

## Comments

Bad (says *what*): `// loop over users and add 1`
Good (says *why*): `// The login service locks the account after five wrong passwords, so we never retry automatically.`

## Dependency injection

Before (hidden singletons, untestable):
```ts
import { db } from "./db";
export async function closeInvoice(id: string) {
  const invoice = await db.query(...);
  if (invoice.dueAt < new Date()) { ... }
}
```
After:
```ts
export function createInvoiceService(deps: { invoices: InvoiceRepository; clock: Clock }) {
  return {
    async close(id: string) {
      const invoice = await deps.invoices.find(id);
      if (invoice.dueAt < deps.clock.now()) { ... }
    },
  };
}
```
A test passes an in-memory repository and a fixed clock. Only the composition root builds the real ones.

## Cohesion: a file that says "and"

`user-service.ts` "validates input and sends emails and talks to the database and formats responses" becomes:
```
users/
  user.routes      HTTP and validation only
  user.service     the rules, no HTTP, no SQL
  user.repository  persistence only
  welcome-email    the email, built by and for this feature
```
Not `utils.ts`, not `helpers.ts`.

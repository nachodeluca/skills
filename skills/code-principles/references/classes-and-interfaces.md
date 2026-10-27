# Classes, interfaces and constants

## Contents
- Interfaces always
- Everything typed
- Constants: UPPER_SNAKE_CASE at the top
- Class member order
- Complete example

## Interfaces always

Implementations never know each other. Two concrete things talk only through an interface (a typed contract).

Rules:
1. The consumer owns the interface, shaped by what the consumer needs (`OrderRepository`, `Clock`, `Mailer`), not by what a vendor offers.
2. A class receives its collaborators typed as interfaces, through the constructor.
3. No file imports a concrete implementation of another feature or layer. `import { PostgresOrderRepository }` inside a service is a violation.
4. Exactly one place, the composition root, imports the concrete classes and wires them.
5. Each implementation is declared `implements Interface`, so the compiler proves it fulfils the contract.
6. Two implementations of one interface (Postgres and in-memory) never reference each other; one shared contract test runs against both.

Before (coupled to the implementation):
```ts
import { PostgresOrderRepository } from "./postgres-order.repository";

export class OrderService {
  private readonly repository = new PostgresOrderRepository();
}
```
After (coupled to the interface):
```ts
// order.repository.ts
export interface OrderRepository {
  findById(orderId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

// order.service.ts
import type { OrderRepository } from "./order.repository";

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}
}

// server.ts (composition root, the only place that knows the concrete class)
const orderService: OrderService = new OrderService(new PostgresOrderRepository(database));
```
Use `import type` for interfaces so no runtime dependency is created.

Keep interfaces small and focused (one reason to change). If a consumer uses two methods of a fat interface, split it.

## Everything typed

- Every parameter, return type, class field, constant and exported value has an explicit type or an inferred type you could state without doubt. Exported functions always declare their return type.
- No `any`, implicit or explicit. Use `unknown` at untrusted edges and narrow by validation.
- No unchecked `as` casts; no non-null `!` to silence the compiler.
- Model domain concepts as types: an `OrderId`, a `Money` with minor units, a union of statuses, instead of bare `string` and `number`.
- Do not duplicate shapes. Derive types from one source (a schema, an interface).

## Constants: UPPER_SNAKE_CASE at the top

All named constants are UPPER_SNAKE_CASE, declared at the very top of the file right after the imports, before the first function or class. Never inside a function body, never between functions. The reader sees every tunable of the module in the first screen.

```ts
import type { Clock } from "./clock";

const SESSION_LIFETIME_MS = 30 * 60 * 1_000;
const MAXIMUM_OPEN_ORDERS = 5;
const HTTP_NOT_FOUND = 404;
const ORDER_ID_PATTERN = /^[a-z0-9-]{8,64}$/;
const CHECKOUT_PATH = "/checkout";
const PRICE_POLICY = {
  DEFAULT_QUANTITY: 1,
  MAXIMUM_DISCOUNT_RATE: 0.3,
} as const;

export class SessionService { ... }
```

- Units in the name: `_MS`, `_SECONDS`, `_BYTES`, `_MINOR`, `_PERCENT`.
- Used by several files of one feature: a `<feature>.constants.ts` at the root of that feature's folder (`orders/orders.constants.ts`), imported by those files. Not a global `constants.ts` for the whole app.
- Only a vendor or environment knows it: put it in that module's config.
- Tests may name scenario values the same way at the top of the test file.
- The only literals allowed inline are identities: `0`, `1` as counters, `length === 0`, `index += 1`.

Bad: `if (items.length > 50)` and `const timeout = 5000` inside a function.
Good: `if (items.length > MAXIMUM_ITEMS)` with `MAXIMUM_ITEMS` at the top.

## Class member order

From top to bottom, always:
1. **Fields** (static first, then instance; `readonly` where possible)
2. **Constructor**
3. **Public methods** (the API of the class, the thing a reader came to see)
4. **Protected methods**
5. **Private methods** at the very bottom, in the order the public methods use them

Declare every field explicitly at the top and assign it in the constructor body. Do not use constructor parameter properties (`constructor(private readonly x: X)`): they hide the fields inside the signature, so the "fields first" layout disappears.

The reader gets the contract first and the details last, like a newspaper. Never interleave private helpers between public methods.

```ts
export class InvoiceService {
  private readonly invoices: InvoiceRepository;
  private readonly clock: Clock;

  constructor(invoices: InvoiceRepository, clock: Clock) {
    this.invoices = invoices;
    this.clock = clock;
  }

  async close(invoiceId: string): Promise<Invoice> {
    const invoice: Invoice = await this.findOrFail(invoiceId);
    this.assertNotOverdue(invoice);
    return this.invoices.save({ ...invoice, closedAt: this.clock.now() });
  }

  async reopen(invoiceId: string): Promise<Invoice> {
    const invoice: Invoice = await this.findOrFail(invoiceId);
    return this.invoices.save({ ...invoice, closedAt: null });
  }

  private async findOrFail(invoiceId: string): Promise<Invoice> {
    const invoice: Invoice | null = await this.invoices.findById(invoiceId);
    if (invoice === null) throw new InvoiceNotFoundError(invoiceId);
    return invoice;
  }

  private assertNotOverdue(invoice: Invoice): void {
    if (invoice.dueAt < this.clock.now()) throw new InvoiceOverdueError(invoice.id);
  }
}
```

A class with many private methods that have little to do with its public API is hiding another class: extract it behind its own interface.

In languages without classes (functions and closures), keep the same spirit: constants at the top, the exported API first, private helpers below it.

## Complete example

A small feature, all rules together:
```
notifications/
  notifications.constants.ts     MAXIMUM_BATCH_SIZE, RETRY_DELAY_MS
  notification.sender.ts         export interface NotificationSender { send(notice: Notice): Promise<void> }
  notification.service.ts        class NotificationService (depends on NotificationSender)
  email.sender.ts                class EmailSender implements NotificationSender
  memory.sender.ts               class MemorySender implements NotificationSender (tests)
```
`NotificationService` imports only the `NotificationSender` type. `EmailSender` and `MemorySender` never import each other or the service. `server.ts` wires `new NotificationService(new EmailSender(...))`.

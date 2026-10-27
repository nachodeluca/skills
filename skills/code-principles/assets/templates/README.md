# Templates

`feature/` is a small, complete feature (`orders`) that already follows every rule in the skill. Copy it as a starting point instead of reinventing the structure, then rename `order`/`orders` to the new domain concept and replace the example rules.

| File | Role | Rule it shows |
|-|-|-|
| `orders.constants.ts` | Named values shared by the feature | UPPER_SNAKE_CASE constants, one place, no global bag |
| `order.ts` | Domain types and request shapes | Closed union for status, `readonly`, everything typed |
| `order.errors.ts` | Typed domain errors | Errors in business words, no HTTP codes |
| `order.repository.ts` | Interface the service needs | Interface owned by the consumer, block comment only because it is a contract |
| `order.ports.ts` | `Clock`, `IdGenerator` | No hidden `new Date()` or random ids in the rules |
| `order.service.ts` | The rules | Fields, constructor, public methods, private methods last; depends only on interfaces |
| `memory-order.repository.ts` | In-memory implementation | `implements` the interface, knows no other implementation |
| `order.service.test.ts` | Behavior tests | Fakes through interfaces, named scenario values, deterministic |
| `compose.ts` | Composition root | The only place that names concrete classes |

What to add per project (not in the template because it depends on the stack): the database repository (`implements OrderRepository`), the routes (validate with a schema, call the service, translate errors to status codes), and the migration.

Adapt names to the project's conventions (file naming, test runner, import extensions) when they differ; the structure and the rules stay.

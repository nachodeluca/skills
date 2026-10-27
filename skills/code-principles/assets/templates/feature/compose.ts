import { MemoryOrderRepository } from "./orders/memory-order.repository";
import type { Clock, IdGenerator } from "./orders/order.ports";
import { OrderService } from "./orders/order.service";

/*

The composition root: the only file that names concrete classes and wires them to the
interfaces the rest of the code depends on. In a real project this is where the
database-backed repository replaces the in-memory one.

*/
export function composeOrders(clock: Clock, ids: IdGenerator): OrderService {
  return new OrderService(new MemoryOrderRepository(), clock, ids);
}

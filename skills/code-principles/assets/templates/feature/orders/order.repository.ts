import type { Order } from "./order";

/*

The persistence contract the service depends on. Owned by this feature and shaped by
what the service needs; every storage (database, memory) implements it and none of
them references another.

*/
export interface OrderRepository {
  findById(orderId: string): Promise<Order | null>;
  countOpenByCustomer(customerId: string): Promise<number>;
  save(order: Order): Promise<void>;
}

import type { Order } from "./order";
import type { OrderRepository } from "./order.repository";

export class MemoryOrderRepository implements OrderRepository {
  private readonly ordersById: Map<string, Order> = new Map();

  async findById(orderId: string): Promise<Order | null> {
    return this.ordersById.get(orderId) ?? null;
  }

  async countOpenByCustomer(customerId: string): Promise<number> {
    return [...this.ordersById.values()].filter(
      (order: Order) => order.customerId === customerId && order.status === "created",
    ).length;
  }

  async save(order: Order): Promise<void> {
    this.ordersById.set(order.id, order);
  }
}

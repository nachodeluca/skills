import { MAXIMUM_OPEN_ORDERS, ORDER_ID_PREFIX } from "./orders.constants";
import type { CreateOrderRequest, Order } from "./order";
import { OrderNotFoundError, OrderNotPayableError, TooManyOpenOrdersError } from "./order.errors";
import type { Clock, IdGenerator } from "./order.ports";
import type { OrderRepository } from "./order.repository";

export class OrderService {
  private readonly orders: OrderRepository;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(orders: OrderRepository, clock: Clock, ids: IdGenerator) {
    this.orders = orders;
    this.clock = clock;
    this.ids = ids;
  }

  async create(request: CreateOrderRequest): Promise<Order> {
    await this.assertBelowOpenLimit(request.customerId);
    const order: Order = {
      id: this.ids.next(ORDER_ID_PREFIX),
      customerId: request.customerId,
      status: "created",
      totalMinor: request.totalMinor,
      createdAt: this.clock.now(),
      paidAt: null,
    };
    await this.orders.save(order);
    return order;
  }

  /*

  Only a "created" order can be paid. A paid or cancelled one is rejected, so a
  retry of the same payment never charges twice.

  */
  async pay(orderId: string): Promise<Order> {
    const order: Order = await this.findOrFail(orderId);
    if (order.status !== "created") throw new OrderNotPayableError(order.id, order.status);
    const paidOrder: Order = { ...order, status: "paid", paidAt: this.clock.now() };
    await this.orders.save(paidOrder);
    return paidOrder;
  }

  private async findOrFail(orderId: string): Promise<Order> {
    const order: Order | null = await this.orders.findById(orderId);
    if (order === null) throw new OrderNotFoundError(orderId);
    return order;
  }

  private async assertBelowOpenLimit(customerId: string): Promise<void> {
    const openOrders: number = await this.orders.countOpenByCustomer(customerId);
    if (openOrders >= MAXIMUM_OPEN_ORDERS) throw new TooManyOpenOrdersError(customerId);
  }
}

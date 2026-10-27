import type { OrderStatus } from "./order";

export class OrderNotFoundError extends Error {
  readonly orderId: string;

  constructor(orderId: string) {
    super(`Order ${orderId} does not exist`);
    this.orderId = orderId;
  }
}

export class OrderNotPayableError extends Error {
  readonly orderId: string;
  readonly status: OrderStatus;

  constructor(orderId: string, status: OrderStatus) {
    super(`Order ${orderId} cannot be paid while it is ${status}`);
    this.orderId = orderId;
    this.status = status;
  }
}

export class TooManyOpenOrdersError extends Error {
  readonly customerId: string;

  constructor(customerId: string) {
    super(`Customer ${customerId} has too many open orders`);
    this.customerId = customerId;
  }
}

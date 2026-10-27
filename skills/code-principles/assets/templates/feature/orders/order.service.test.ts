import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAXIMUM_OPEN_ORDERS } from "./orders.constants";
import type { Order } from "./order";
import { OrderNotPayableError, TooManyOpenOrdersError } from "./order.errors";
import type { Clock, IdGenerator } from "./order.ports";
import { OrderService } from "./order.service";
import { MemoryOrderRepository } from "./memory-order.repository";

const CUSTOMER_ID = "customer-1";
const TOTAL_MINOR = 2_500;
const NOW = new Date("2026-01-15T12:00:00Z");

class FixedClock implements Clock {
  now(): Date {
    return NOW;
  }
}

class SequentialIds implements IdGenerator {
  private counter = 0;

  next(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }
}

function buildService(): OrderService {
  return new OrderService(new MemoryOrderRepository(), new FixedClock(), new SequentialIds());
}

describe("OrderService", () => {
  it("creates an order in the created state", async () => {
    const service: OrderService = buildService();

    const order: Order = await service.create({ customerId: CUSTOMER_ID, totalMinor: TOTAL_MINOR });

    assert.equal(order.status, "created");
    assert.equal(order.paidAt, null);
  });

  it("rejects a new order when the customer reached the open limit", async () => {
    const service: OrderService = buildService();
    for (let created = 0; created < MAXIMUM_OPEN_ORDERS; created += 1) {
      await service.create({ customerId: CUSTOMER_ID, totalMinor: TOTAL_MINOR });
    }

    await assert.rejects(
      service.create({ customerId: CUSTOMER_ID, totalMinor: TOTAL_MINOR }),
      TooManyOpenOrdersError,
    );
  });

  it("rejects paying an order that is already paid", async () => {
    const service: OrderService = buildService();
    const order: Order = await service.create({ customerId: CUSTOMER_ID, totalMinor: TOTAL_MINOR });
    await service.pay(order.id);

    await assert.rejects(service.pay(order.id), OrderNotPayableError);
  });
});

export type OrderStatus = "created" | "paid" | "cancelled";

export interface Order {
  readonly id: string;
  readonly customerId: string;
  readonly status: OrderStatus;
  readonly totalMinor: number;
  readonly createdAt: Date;
  readonly paidAt: Date | null;
}

export interface CreateOrderRequest {
  readonly customerId: string;
  readonly totalMinor: number;
}

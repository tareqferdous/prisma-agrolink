import { z } from "zod";

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

export const shipOrderSchema = z.object({
  courierName: z.string().min(1, "Courier name is required"),
  trackingNumber: z.string().min(1, "Tracking number is required"),
  shippingCost: z.number().min(0, "Shipping cost must be positive"),
});

export type TConfirmPayment = z.infer<typeof confirmPaymentSchema>;
export type TShipOrder = z.infer<typeof shipOrderSchema>;

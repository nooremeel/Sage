import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentStatusSchema = z.enum([
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const createCheckoutSessionSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid course ID' }),
  couponCode: z
    .string()
    .min(2, { message: 'Coupon code must be at least 2 characters' })
    .max(50, { message: 'Coupon code too long' })
    .optional(),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;

export const checkoutSessionDtoSchema = z.object({
  orderId: z.string().uuid(),
  checkoutUrl: z.string(),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3),
});

export type CheckoutSessionDto = z.infer<typeof checkoutSessionDtoSchema>;

export const orderDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.record(z.string()),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3),
  status: orderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrderDto = z.infer<typeof orderDtoSchema>;

export const paymentWebhookEventSchema = z.object({
  orderId: z.string().uuid(),
  eventType: z.enum(['payment.succeeded', 'payment.failed']),
  transactionId: z.string().min(1),
  timestamp: z.number().int(),
});

export type PaymentWebhookEvent = z.infer<typeof paymentWebhookEventSchema>;


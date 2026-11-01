import { describe, it, expect } from 'vitest';
import {
  createCheckoutSessionSchema,
  orderStatusSchema,
  paymentStatusSchema,
  paymentWebhookEventSchema,
} from './payments.js';

describe('Phase 9: Payments & Checkout Schemas', () => {
  it('validates valid create checkout input', () => {
    const valid = {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      couponCode: 'SAVE50',
    };
    expect(() => createCheckoutSessionSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid uuid in checkout input', () => {
    const invalid = {
      courseId: 'not-a-uuid',
    };
    expect(() => createCheckoutSessionSchema.parse(invalid)).toThrow();
  });

  it('validates supported order and payment statuses', () => {
    expect(orderStatusSchema.parse('pending')).toBe('pending');
    expect(orderStatusSchema.parse('completed')).toBe('completed');
    expect(() => orderStatusSchema.parse('unknown')).toThrow();

    expect(paymentStatusSchema.parse('succeeded')).toBe('succeeded');
    expect(paymentStatusSchema.parse('failed')).toBe('failed');
    expect(() => paymentStatusSchema.parse('in-progress')).toThrow();
  });

  it('validates payment webhook event payload', () => {
    const event = {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      eventType: 'payment.succeeded',
      transactionId: 'txn_fake_12345678',
      timestamp: Date.now(),
    };
    expect(() => paymentWebhookEventSchema.parse(event)).not.toThrow();
  });
});


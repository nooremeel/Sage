import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../../src/modules/payments/payments.service.js';
import { FakePaymentProvider } from '../../src/modules/payments/fake-payment.provider.js';
import { orders, payments, enrollments, users, courses } from '../../src/db/schema/index.js';

describe('Phase 9: Simulated Payments & Idempotent Webhook Suite', () => {
  let paymentsService: PaymentsService;
  let fakeProvider: FakePaymentProvider;
  let mockDb: any;
  let mockConfigService: any;

  const webhookSecret = 'test_webhook_secret_key_32chars_long';
  const userId = '11111111-1111-1111-1111-111111111111';
  const courseId = '22222222-2222-2222-2222-222222222222';
  const orderId = '33333333-3333-3333-3333-333333333333';

  let ordersList: any[] = [];
  let paymentsList: any[] = [];
  let enrollmentsList: any[] = [];

  beforeEach(() => {
    fakeProvider = new FakePaymentProvider();
    mockConfigService = {
      get: vi.fn().mockReturnValue(webhookSecret),
    };

    ordersList = [
      {
        id: orderId,
        userId,
        courseId,
        amountCents: 4900,
        currency: 'USD',
        status: 'pending',
        couponId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    paymentsList = [];
    enrollmentsList = [];

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: (cond: any) => {
            if (table === orders) {
              return ordersList;
            }
            if (table === payments) {
              return paymentsList;
            }
            if (table === enrollments) {
              return enrollmentsList;
            }
            if (table === users) {
              return [{ id: userId, email: 'scholar@example.com' }];
            }
            if (table === courses) {
              return [{ id: courseId, priceCents: 4900, status: 'published' }];
            }
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          if (table === orders) {
            const o = { id: orderId, createdAt: new Date(), updatedAt: new Date(), ...vals };
            ordersList.push(o);
            return { returning: () => [o] };
          }
          if (table === payments) {
            const p = { id: `pay-${paymentsList.length + 1}`, ...vals };
            paymentsList.push(p);
            return [p];
          }
          if (table === enrollments) {
            const e = { id: `enr-${enrollmentsList.length + 1}`, ...vals };
            enrollmentsList.push(e);
            return [e];
          }
          return [];
        },
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          select: () => ({
            from: (table: any) => ({
              where: () => {
                const res =
                  table === orders
                    ? ordersList
                    : table === enrollments
                      ? enrollmentsList
                      : [];
                (res as any).for = () => res;
                return res;
              },
            }),
          }),
          insert: (table: any) => ({
            values: (vals: any) => {
              if (table === payments) {
                const p = { id: `pay-${paymentsList.length + 1}`, ...vals };
                paymentsList.push(p);
                return [p];
              }
              if (table === enrollments) {
                const e = { id: `enr-${enrollmentsList.length + 1}`, ...vals };
                enrollmentsList.push(e);
                return [e];
              }
              return { onConflictDoNothing: () => [] };
            },
          }),
          update: (table: any) => ({
            set: (vals: any) => ({
              where: () => {
                if (table === orders) {
                  Object.assign(ordersList[0], vals);
                }
                return [];
              },
            }),
          }),
        };
        return cb(tx);
      },
    };

    paymentsService = new PaymentsService(
      mockDb,
      fakeProvider,
      mockConfigService,
    );
  });

  it('rejects webhook with invalid HMAC signature', async () => {
    const payload = JSON.stringify({
      orderId,
      eventType: 'payment.succeeded',
      transactionId: 'txn_fake_123',
      timestamp: Date.now(),
    });

    await expect(
      paymentsService.processWebhook(payload, 'invalid_hmac_hex'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('processes payment.succeeded webhook, completes order, and grants enrollment', async () => {
    const payload = JSON.stringify({
      orderId,
      eventType: 'payment.succeeded',
      transactionId: 'txn_fake_valid_100',
      timestamp: Date.now(),
    });

    const signature = fakeProvider.generateWebhookSignature(payload, webhookSecret);

    const result = await paymentsService.processWebhook(payload, signature);

    expect(result.status).toBe('success');
    expect(result.idempotent).toBe(false);
    expect(result.orderId).toBe(orderId);

    // Verify order completed
    expect(ordersList[0].status).toBe('completed');

    // Verify payment recorded
    expect(paymentsList.length).toBe(1);
    expect(paymentsList[0].status).toBe('succeeded');
    expect(paymentsList[0].transactionId).toBe('txn_fake_valid_100');

    // Verify enrollment granted
    expect(enrollmentsList.length).toBe(1);
    expect(enrollmentsList[0].userId).toBe(userId);
    expect(enrollmentsList[0].courseId).toBe(courseId);
    expect(enrollmentsList[0].source).toBe('paid');
  });

  it('duplicate webhook delivery test: guarantees exactly once enrollment and idempotency', async () => {
    const payload = JSON.stringify({
      orderId,
      eventType: 'payment.succeeded',
      transactionId: 'txn_duplicate_test',
      timestamp: Date.now(),
    });

    const signature = fakeProvider.generateWebhookSignature(payload, webhookSecret);

    // First delivery
    const firstResult = await paymentsService.processWebhook(payload, signature);
    expect(firstResult.status).toBe('success');
    expect(firstResult.idempotent).toBe(false);
    expect(enrollmentsList.length).toBe(1);

    // Second delivery (duplicate delivery with identical transactionId/payload)
    const secondResult = await paymentsService.processWebhook(payload, signature);
    expect(secondResult.status).toBe('success');
    expect(secondResult.idempotent).toBe(true);
    expect(secondResult.orderId).toBe(orderId);

    // Assert enrollment was granted EXACTLY once
    expect(enrollmentsList.length).toBe(1);
    expect(paymentsList.length).toBe(1);
  });

  it('marks order as failed and does not grant enrollment on payment.failed', async () => {
    const payload = JSON.stringify({
      orderId,
      eventType: 'payment.failed',
      transactionId: 'txn_failed_test',
      timestamp: Date.now(),
    });

    const signature = fakeProvider.generateWebhookSignature(payload, webhookSecret);

    const result = await paymentsService.processWebhook(payload, signature);

    expect(result.status).toBe('failed');
    expect(ordersList[0].status).toBe('failed');
    expect(enrollmentsList.length).toBe(0);
    expect(paymentsList[0].status).toBe('failed');
  });
});

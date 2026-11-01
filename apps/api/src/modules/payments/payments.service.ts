import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import {
  orders,
  payments,
  courses,
  courseTranslations,
  coupons,
  couponRedemptions,
  enrollments,
  users,
} from '../../db/schema/index.js';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider.interface.js';
import {
  type CreateCheckoutSessionInput,
  type CheckoutSessionDto,
  type OrderDto,
  type PaymentWebhookEvent,
  paymentWebhookEventSchema,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class PaymentsService {
  private readonly webhookSecret: string;

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('PAYMENT_WEBHOOK_SECRET') ||
      'dev_payment_webhook_secret_key_32chars_long';
  }

  async createCheckoutSession(
    userId: string,
    input: CreateCheckoutSessionInput,
    locale: string = 'en',
  ): Promise<CheckoutSessionDto> {
    // 1. Fetch user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Fetch course
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, input.courseId));

    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found or not published');
    }

    // 3. Check if user is already enrolled
    const [existingEnrollment] = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, input.courseId),
        ),
      );

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    // 4. Calculate price & handle coupon
    let finalPriceCents = course.priceCents;
    let appliedCouponId: string | null = null;

    if (input.couponCode) {
      const code = input.couponCode.trim().toUpperCase();
      const [coupon] = await this.db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code));

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        const err = new BadRequestException('Coupon has expired');
        (err as any).code = AppErrorCode.COUPON_EXPIRED;
        throw err;
      }

      if (coupon.timesRedeemed >= coupon.maxRedemptions) {
        const err = new ConflictException('Coupon usage limit reached');
        (err as any).code = AppErrorCode.COUPON_EXHAUSTED;
        throw err;
      }

      if (coupon.courseId && coupon.courseId !== input.courseId) {
        throw new BadRequestException('Coupon is not applicable to this course');
      }

      if (coupon.discountType === 'percentage') {
        const discount = Math.round(
          (finalPriceCents * coupon.discountValue) / 100,
        );
        finalPriceCents = Math.max(0, finalPriceCents - discount);
      } else {
        finalPriceCents = Math.max(0, finalPriceCents - coupon.discountValue);
      }

      appliedCouponId = coupon.id;
    }

    // 5. Create order in pending status
    const [order] = await this.db
      .insert(orders)
      .values({
        userId,
        courseId: input.courseId,
        amountCents: finalPriceCents,
        currency: 'USD',
        status: 'pending',
        couponId: appliedCouponId,
      })
      .returning();

    // 6. Fetch primary course title for provider session
    const [trans] = await this.db
      .select()
      .from(courseTranslations)
      .where(
        and(
          eq(courseTranslations.courseId, input.courseId),
          eq(courseTranslations.locale, locale),
        ),
      );

    const courseTitle = trans?.title || 'Sage Course';

    // 7. Create checkout session through provider
    const session = await this.paymentProvider.createCheckoutSession({
      orderId: order!.id,
      amountCents: finalPriceCents,
      currency: 'USD',
      customerEmail: user.email,
      courseTitle,
      locale,
    });

    return {
      orderId: order!.id,
      checkoutUrl: session.checkoutUrl,
      amountCents: finalPriceCents,
      currency: 'USD',
    };
  }

  async getOrder(orderId: string, userId: string): Promise<OrderDto> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const translations = await this.db
      .select()
      .from(courseTranslations)
      .where(eq(courseTranslations.courseId, order.courseId));

    const courseTitle: Record<string, string> = {};
    for (const t of translations) {
      courseTitle[t.locale] = t.title;
    }

    return {
      id: order.id,
      userId: order.userId,
      courseId: order.courseId,
      courseTitle,
      amountCents: order.amountCents,
      currency: order.currency,
      status: order.status as any,
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
    };
  }

  async cancelOrder(orderId: string, userId: string): Promise<{ ok: boolean; status: string }> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'pending') {
      await this.db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    return { ok: true, status: 'cancelled' };
  }

  async processWebhook(
    rawPayload: string | Buffer,
    signature: string,
  ): Promise<{ status: string; idempotent: boolean; orderId: string }> {
    // 1. Verify HMAC Signature
    const isValid = this.paymentProvider.verifyWebhookSignature(
      rawPayload,
      signature,
      this.webhookSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Parse and validate webhook event
    const payloadStr =
      typeof rawPayload === 'string'
        ? rawPayload
        : rawPayload.toString('utf8');

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(payloadStr);
    } catch {
      throw new BadRequestException('Malformed webhook JSON');
    }

    const eventResult = paymentWebhookEventSchema.safeParse(parsedJson);
    if (!eventResult.success) {
      throw new BadRequestException('Invalid webhook event payload shape');
    }

    const event = eventResult.data;

    // 3. Idempotency Check: if this idempotency key was already processed
    const [existingPayment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, event.transactionId));

    if (existingPayment) {
      return {
        status: existingPayment.status === 'succeeded' ? 'success' : 'failed',
        idempotent: true,
        orderId: existingPayment.orderId,
      };
    }

    // 4. Transactionally process order and payment record
    return this.db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, event.orderId))
        .for('update');

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // If order is already completed
      if (order.status === 'completed' && event.eventType === 'payment.succeeded') {
        return {
          status: 'success',
          idempotent: true,
          orderId: order.id,
        };
      }

      const paymentStatus =
        event.eventType === 'payment.succeeded' ? 'succeeded' : 'failed';

      // Insert payment record
      await tx.insert(payments).values({
        orderId: order.id,
        provider: this.paymentProvider.providerName,
        transactionId: event.transactionId,
        amountCents: order.amountCents,
        currency: order.currency,
        status: paymentStatus,
        idempotencyKey: event.transactionId,
        rawPayload: parsedJson,
      });

      if (event.eventType === 'payment.succeeded') {
        // Update order status to completed
        await tx
          .update(orders)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Increment coupon timesRedeemed if order used a coupon
        if (order.couponId) {
          await tx
            .update(coupons)
            .set({
              timesRedeemed: sql`${coupons.timesRedeemed} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(coupons.id, order.couponId));

          await tx
            .insert(couponRedemptions)
            .values({
              couponId: order.couponId,
              userId: order.userId,
              courseId: order.courseId,
            })
            .onConflictDoNothing();
        }

        // Idempotently grant enrollment
        const [existingEnrollment] = await tx
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, order.userId),
              eq(enrollments.courseId, order.courseId),
            ),
          );

        if (!existingEnrollment) {
          await tx.insert(enrollments).values({
            userId: order.userId,
            courseId: order.courseId,
            source: 'paid',
          });
        }

        return {
          status: 'success',
          idempotent: false,
          orderId: order.id,
        };
      } else {
        // Payment failed
        await tx
          .update(orders)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        return {
          status: 'failed',
          idempotent: false,
          orderId: order.id,
        };
      }
    });
  }

  async simulateAction(
    orderId: string,
    action: 'pay' | 'fail',
  ): Promise<{ status: string; idempotent: boolean; orderId: string }> {
    const event: PaymentWebhookEvent = {
      orderId,
      eventType: action === 'pay' ? 'payment.succeeded' : 'payment.failed',
      transactionId: `sim_txn_${orderId}_${Date.now()}`,
      timestamp: Date.now(),
    };

    const payload = JSON.stringify(event);
    const signature = this.paymentProvider.generateWebhookSignature(
      payload,
      this.webhookSecret,
    );

    return this.processWebhook(payload, signature);
  }
}

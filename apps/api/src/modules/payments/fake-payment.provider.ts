import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSessionResult,
} from './payment-provider.interface.js';

@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  readonly providerName = 'fake';

  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSessionResult> {
    const sessionId = `fake_sess_${params.orderId}_${Date.now()}`;
    const checkoutUrl = `/${params.locale || 'en'}/checkout/${params.orderId}`;
    return {
      checkoutUrl,
      sessionId,
    };
  }

  generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret) {
      return false;
    }

    try {
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf8');
      const expected = this.generateWebhookSignature(payloadString, secret);

      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}

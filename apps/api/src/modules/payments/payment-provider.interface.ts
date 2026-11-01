export interface CreateCheckoutParams {
  orderId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  courseTitle: string;
  locale: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface PaymentProvider {
  readonly providerName: string;
  createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSessionResult>;
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): boolean;
  generateWebhookSignature(payload: string, secret: string): string;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');


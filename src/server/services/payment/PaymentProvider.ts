import {
  SubscriptionPlanId,
  CheckoutSessionInit,
  CheckoutSessionResult,
} from '../../../shared/types/membership';

export interface PaymentWebhookPayload {
  rawBody: string | Buffer;
  headers: Record<string, string | string[] | undefined>;
  parsedBody: any;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderId?: string;
  paymentId?: string;
  status?: 'successful' | 'failed';
  amount?: number;
  currency?: string;
  customerToken?: string;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly name: 'payhere' | 'onepay' | 'sandbox';
  createCheckoutSession(
    userId: string,
    username: string,
    email: string,
    amountLKR: number,
    init: CheckoutSessionInit
  ): Promise<CheckoutSessionResult>;
  verifyWebhook(payload: PaymentWebhookPayload): Promise<WebhookVerificationResult>;
}

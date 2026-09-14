import {
  IPaymentProvider,
  PaymentWebhookPayload,
  WebhookVerificationResult,
} from './PaymentProvider';
import {
  CheckoutSessionInit,
  CheckoutSessionResult,
} from '../../../shared/types/membership';

export class SandboxPaymentProvider implements IPaymentProvider {
  public readonly name = 'sandbox' as const;

  async createCheckoutSession(
    userId: string,
    _username: string,
    _email: string,
    amountLKR: number,
    init: CheckoutSessionInit
  ): Promise<CheckoutSessionResult> {
    const sessionId = `df_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const trialEnd = init.isTrial
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : undefined;
    const nextBillingDate = init.isTrial
      ? trialEnd
      : new Date(Date.now() + 30 * 86400000).toISOString();

    return {
      sessionId,
      planId: init.planId,
      amountLKR,
      isTrial: init.isTrial,
      trialEnd,
      nextBillingDate,
      provider: 'sandbox',
      requiresRedirect: false,
    };
  }

  async verifyWebhook(payload: PaymentWebhookPayload): Promise<WebhookVerificationResult> {
    const body = payload.parsedBody || {};
    return {
      isValid: true,
      orderId: body.order_id || body.orderId,
      paymentId: body.payment_id || `sbx_pay_${Date.now()}`,
      status: body.status === 'failed' ? 'failed' : 'successful',
      amount: Number(body.amount) || 0,
      currency: 'LKR',
      customerToken: body.customer_token || `sbx_tok_${Date.now()}`,
    };
  }
}

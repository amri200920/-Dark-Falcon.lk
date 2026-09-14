import crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentWebhookPayload,
  WebhookVerificationResult,
} from './PaymentProvider';
import {
  CheckoutSessionInit,
  CheckoutSessionResult,
} from '../../../shared/types/membership';

export class PayHereProvider implements IPaymentProvider {
  public readonly name = 'payhere' as const;
  private merchantId: string;
  private merchantSecret: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = process.env.PAYHERE_MERCHANT_ID || 'TEST_MERCHANT_ID';
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'TEST_MERCHANT_SECRET';
    this.isSandbox = process.env.PAYMENT_MODE !== 'live';
  }

  generateHash(orderId: string, amount: number, currency: string = 'LKR'): string {
    const formattedAmount = amount.toFixed(2);
    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();
    return crypto
      .createHash('md5')
      .update(`${this.merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`)
      .digest('hex')
      .toUpperCase();
  }

  async createCheckoutSession(
    userId: string,
    username: string,
    email: string,
    amountLKR: number,
    init: CheckoutSessionInit
  ): Promise<CheckoutSessionResult> {
    const orderId = `df_${Date.now()}_${userId.slice(0, 6)}`;
    const hash = this.generateHash(orderId, amountLKR, 'LKR');

    const trialEnd = init.isTrial
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : undefined;
    const nextBillingDate = init.isTrial
      ? trialEnd
      : new Date(Date.now() + 30 * 86400000).toISOString();

    const checkoutUrl = this.isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
    const params: Record<string, any> = {
      merchant_id: this.merchantId,
      return_url: init.redirectUrl || `${frontendUrl}/#membership`,
      cancel_url: init.cancelUrl || `${frontendUrl}/#membership`,
      notify_url: `${process.env.APP_URL || 'http://localhost:5000'}/api/memberships/webhook/payhere`,
      order_id: orderId,
      items: `Dark Falcon ${init.planId.toUpperCase()} Subscription`,
      currency: 'LKR',
      amount: amountLKR.toFixed(2),
      first_name: username,
      last_name: 'Aviator',
      email: email || 'aviator@darkfalcon.io',
      phone: '0771234567',
      address: 'Dark Falcon HQ',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
      custom_1: userId,
      custom_2: init.planId,
    };

    return {
      sessionId: orderId,
      planId: init.planId,
      amountLKR,
      isTrial: init.isTrial,
      trialEnd,
      nextBillingDate,
      provider: 'payhere',
      checkoutUrl,
      params,
      requiresRedirect: true,
    };
  }

  async verifyWebhook(payload: PaymentWebhookPayload): Promise<WebhookVerificationResult> {
    const b = payload.parsedBody || {};
    const merchantId = b.merchant_id;
    const orderId = b.order_id;
    const payhereAmount = b.payhere_amount;
    const payhereCurrency = b.payhere_currency;
    const statusCode = b.status_code;
    const md5sig = b.md5sig;

    if (!md5sig) {
      return { isValid: false, errorMessage: 'Missing md5 signature' };
    }

    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const localHash = crypto
      .createHash('md5')
      .update(`${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`)
      .digest('hex')
      .toUpperCase();

    const isValid = localHash === md5sig;
    const isSuccess = String(statusCode) === '2';

    return {
      isValid,
      orderId,
      paymentId: b.payment_id,
      status: isSuccess ? 'successful' : 'failed',
      amount: parseFloat(payhereAmount) || 0,
      currency: payhereCurrency || 'LKR',
      customerToken: b.customer_token,
      errorMessage: isValid ? undefined : 'Invalid signature verification',
    };
  }
}

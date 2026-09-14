import { db } from '../dbService';
import { subscriptionService } from './SubscriptionService';
import { PaymentWebhookPayload } from './PaymentProvider';

export class PaymentWebhookService {
  private static instance: PaymentWebhookService;

  public static getInstance(): PaymentWebhookService {
    if (!PaymentWebhookService.instance) {
      PaymentWebhookService.instance = new PaymentWebhookService();
    }
    return PaymentWebhookService.instance;
  }

  public async handlePayHereWebhook(payload: PaymentWebhookPayload): Promise<{ success: boolean; message: string }> {
    const settings = db.getMembershipSettings();
    const provider = subscriptionService.getProvider(settings.paymentMode === 'test' ? 'sandbox' : 'payhere');
    const result = await provider.verifyWebhook(payload);

    if (!result.isValid) {
      return { success: false, message: result.errorMessage || 'Invalid signature' };
    }

    const { orderId, paymentId, status, amount, customerToken } = result;
    if (!orderId) {
      return { success: false, message: 'Missing orderId' };
    }

    // Check idempotency
    const existingTx = db.findTransactionByProviderTxId(paymentId || orderId);
    if (existingTx && existingTx.status === 'successful') {
      return { success: true, message: 'Already processed' };
    }

    const custom1 = payload.parsedBody?.custom_1; // userId
    const custom2 = payload.parsedBody?.custom_2; // planId

    if (status === 'successful' && custom1 && custom2) {
      const user = db.findUserById(custom1);
      if (user) {
        subscriptionService.activateSubscriptionDirectly(user.id, custom2, false, paymentId || orderId);
      }
    }

    return { success: true, message: 'Processed successfully' };
  }
}

export const paymentWebhookService = PaymentWebhookService.getInstance();

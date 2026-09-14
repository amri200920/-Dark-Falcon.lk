import { db } from '../dbService';
import {
  Subscription,
  SubscriptionPlanId,
  CheckoutSessionInit,
  CheckoutSessionResult,
} from '../../../shared/types/membership';
import { IPaymentProvider } from './PaymentProvider';
import { SandboxPaymentProvider } from './SandboxPaymentProvider';
import { PayHereProvider } from './PayHereProvider';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private sandboxProvider: IPaymentProvider;
  private payhereProvider: IPaymentProvider;

  private constructor() {
    this.sandboxProvider = new SandboxPaymentProvider();
    this.payhereProvider = new PayHereProvider();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public getProvider(preferred?: 'payhere' | 'onepay' | 'sandbox'): IPaymentProvider {
    const settings = db.getMembershipSettings();
    const mode = settings.paymentMode;
    if (mode === 'test' || preferred === 'sandbox' || settings.provider === 'sandbox') {
      return this.sandboxProvider;
    }
    return this.payhereProvider;
  }

  public checkTrialEligibility(userId: string): boolean {
    const user = db.findUserById(userId);
    if (!user) return false;
    if (user.trialUsed) return false;
    const existingSub = db.findSubscriptionByUserId(userId);
    if (existingSub && (existingSub.trialStart || existingSub.trialEnd)) return false;
    return true;
  }

  public async initiateSubscription(
    userId: string,
    init: CheckoutSessionInit
  ): Promise<CheckoutSessionResult> {
    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found');

    const settings = db.getMembershipSettings();
    const plan = settings.plans[init.planId];
    if (!plan || !plan.isActive) {
      throw new Error(`Invalid or inactive plan: ${init.planId}`);
    }

    let isTrial = false;
    if (init.isTrial && plan.trialDays > 0) {
      if (!this.checkTrialEligibility(userId)) {
        throw new Error('You have already used your free trial.');
      }
      isTrial = true;
    }

    const provider = this.getProvider();
    const result = await provider.createCheckoutSession(
      user.id,
      user.username,
      user.email,
      isTrial ? 0 : plan.priceLKR,
      { ...init, isTrial }
    );

    // If sandbox / instant activation
    if (provider.name === 'sandbox') {
      this.activateSubscriptionDirectly(user.id, init.planId, isTrial, result.sessionId);
    }

    return result;
  }

  public activateSubscriptionDirectly(
    userId: string,
    planId: SubscriptionPlanId,
    isTrial: boolean,
    sessionId: string
  ): Subscription {
    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found');

    const settings = db.getMembershipSettings();
    const plan = settings.plans[planId];
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 86400000);

    let sub = db.findSubscriptionByUserId(userId);
    const subData: Subscription = {
      id: sub?.id || `sub_${Date.now()}_${userId.slice(0, 6)}`,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      planId,
      provider: 'sandbox',
      status: isTrial ? 'trialing' : 'active',
      amountLKR: plan.priceLKR,
      trialStart: isTrial ? now.toISOString() : undefined,
      trialEnd: isTrial ? periodEnd.toISOString() : undefined,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      nextBillingDate: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      failureCount: 0,
      createdAt: sub?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (sub) {
      db.updateSubscription(sub.id, subData);
    } else {
      db.createSubscription(subData);
    }

    // Record transaction
    db.createPaymentTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subscriptionId: subData.id,
      userId: user.id,
      username: user.username,
      planId,
      amountLKR: isTrial ? 0 : plan.priceLKR,
      currency: 'LKR',
      status: 'successful',
      provider: 'sandbox',
      providerTransactionId: sessionId,
      paymentMethod: 'TEST_SANDBOX_CARD',
      maskedCard: '•••• 4242',
      createdAt: now.toISOString(),
    });

    // Update user profile tier
    db.updateUser(user.id, {
      membershipTier: planId,
      membershipStatus: isTrial ? 'trialing' : 'active',
      subscriptionId: subData.id,
      trialUsed: user.trialUsed || isTrial,
      trialStart: isTrial ? now.toISOString() : user.trialStart,
      trialEnd: isTrial ? periodEnd.toISOString() : user.trialEnd,
      isVerified: planId === 'verified' || planId === 'premium_verified' ? user.isVerified : user.isVerified,
    });

    return subData;
  }

  public cancelSubscription(userId: string): Subscription {
    const sub = db.findSubscriptionByUserId(userId);
    if (!sub) throw new Error('No active subscription found.');

    const updated = db.updateSubscription(sub.id, {
      cancelAtPeriodEnd: true,
      cancelledAt: new Date().toISOString(),
    });

    if (!updated) throw new Error('Failed to update subscription.');
    return updated;
  }

  public reactivateSubscription(userId: string): Subscription {
    const sub = db.findSubscriptionByUserId(userId);
    if (!sub) throw new Error('No subscription found.');
    if (!sub.cancelAtPeriodEnd) throw new Error('Subscription is not pending cancellation.');

    const updated = db.updateSubscription(sub.id, {
      cancelAtPeriodEnd: false,
      cancelledAt: undefined,
    });

    if (!updated) throw new Error('Failed to reactivate.');
    return updated;
  }
}

export const subscriptionService = SubscriptionService.getInstance();

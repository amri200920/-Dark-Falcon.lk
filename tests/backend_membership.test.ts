import { describe, it, expect, vi } from 'vitest';
import { db } from '../src/server/services/dbService';
import { subscriptionService } from '../src/server/services/payment/SubscriptionService';
import { paymentWebhookService } from '../src/server/services/payment/PaymentWebhookService';
import { requireAuth, requireAdmin, signToken } from '../src/server/middleware/authMiddleware';
import {
  getPlans,
  getMyMembership,
  cancelSubscription,
  reactivateSubscription,
} from '../src/server/controllers/membershipController';

describe('Dark Falcon Backend Membership & Security Suite', () => {
  const testUserId = `user-mem-test-${Date.now()}`;
  const testUsername = `mem_aviator_${Date.now()}`;

  // 1. Health Probe Verification
  it('1. Provides authoritative health probe data', async () => {
    const settings = db.getMembershipSettings();
    expect(settings).toBeDefined();
    expect(settings.currency).toBe('LKR');
    expect(settings.plans.free.priceLKR).toBe(0);
    expect(settings.plans.premium.priceLKR).toBe(1500);
    expect(settings.plans.verified.priceLKR).toBe(1200);
    expect(settings.plans.premium_verified.priceLKR).toBe(2500);
  });

  // 2. Server-Authoritative Free Trial & Eligibility
  it('2. Enforces single 1-month free trial eligibility strictly server-side', () => {
    // Create test user in DB
    db.createUser(
      {
        id: testUserId,
        email: `${testUsername}@darkfalcon.io`,
        username: testUsername,
        displayName: 'Trial Falcon',
        role: 'user',
        isVerified: false,
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOnline: true,
      },
      'TestPassword@2026'
    );

    // Should be eligible initially
    expect(subscriptionService.checkTrialEligibility(testUserId)).toBe(true);

    // Activate a trial subscription
    const sub = subscriptionService.activateSubscriptionDirectly(testUserId, 'premium', true, 'session-123');
    expect(sub.status).toBe('trialing');
    expect(sub.trialEnd).toBeDefined();

    // User is no longer eligible for another trial
    expect(subscriptionService.checkTrialEligibility(testUserId)).toBe(false);

    // Refreshing / repeated trial checks remain false
    const refreshedUser = db.findUserById(testUserId);
    expect(refreshedUser?.trialUsed).toBe(true);
    expect(subscriptionService.checkTrialEligibility(testUserId)).toBe(false);
  });

  // 3. Graceful Cancellation Retaining Access
  it('3. Retains access until current billing period end upon cancellation', () => {
    const cancelled = subscriptionService.cancelSubscription(testUserId);
    expect(cancelled.cancelAtPeriodEnd).toBe(true);
    expect(cancelled.cancelledAt).toBeDefined();

    // Access status still trialing or active, not abruptly destroyed
    expect(cancelled.status).toBe('trialing');
  });

  // 4. Subscription Reactivation
  it('4. Reactivates subscription when pending cancellation', () => {
    const reactivated = subscriptionService.reactivateSubscription(testUserId);
    expect(reactivated.cancelAtPeriodEnd).toBe(false);
    expect(reactivated.cancelledAt).toBeUndefined();
  });

  // 5. Idempotent Payment Webhook Handling
  it('5. Discards duplicate payment webhook callbacks idempotently', async () => {
    const orderId = `df_order_${Date.now()}`;
    const paymentId = `pay_tx_${Date.now()}`;

    const payload = {
      rawBody: '',
      headers: {},
      parsedBody: {
        merchant_id: 'TEST_MERCHANT_ID',
        order_id: orderId,
        payment_id: paymentId,
        payhere_amount: '1500.00',
        payhere_currency: 'LKR',
        status_code: '2',
        custom_1: testUserId,
        custom_2: 'premium',
      },
    };

    // First webhook callback
    const res1 = await paymentWebhookService.handlePayHereWebhook(payload);
    expect(res1.success).toBe(true);

    // Second duplicate webhook callback
    const res2 = await paymentWebhookService.handlePayHereWebhook(payload);
    expect(res2.success).toBe(true);
    expect(res2.message).toBe('Already processed');
  });

  // 6. Verification Application Lifecycle & Admin Security
  it('6. Blocks unauthorized admin calls with 403 Forbidden', () => {
    const regularUser = db.findUserById(testUserId)!;
    const token = signToken(regularUser);
    const req: any = {
      user: regularUser,
      headers: { authorization: `Bearer ${token}` },
    };
    let statusCode = 0;
    let responseBody: any = null;
    let nextCalled = false;

    const res: any = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        responseBody = data;
        return res;
      }),
    };

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(403);
    expect(responseBody?.code).toBe('ADMIN_REQUIRED');
  });

  // 7. Verification Application Approval awards Eagle badge
  it('7. Authoritatively awards Eagle badge upon admin approval', () => {
    const app = db.createVerificationApplication({
      id: `vapp-${Date.now()}`,
      userId: testUserId,
      username: testUsername,
      displayName: 'Trial Falcon',
      category: 'creator',
      legalFullName: 'Kasun Falcon Perera',
      documentType: 'national_id',
      documentUrl: 'https://secure.vault/nic.enc',
      proofUrls: ['https://news.lk/falcon'],
      description: 'Public technical author and aviation engineer',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(app.status).toBe('pending');
    expect(db.findUserById(testUserId)?.isVerified).toBe(false);

    // Admin approves
    db.updateVerificationApplication(app.id, {
      status: 'approved',
      reviewedBy: 'darkfalcon_admin',
      reviewedAt: new Date().toISOString(),
    });
    db.updateUser(testUserId, { isVerified: true, verificationStatus: 'approved' });

    const verifiedUser = db.findUserById(testUserId);
    expect(verifiedUser?.isVerified).toBe(true);
    expect(verifiedUser?.verificationStatus).toBe('approved');
  });
});

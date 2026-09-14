// Dark Falcon 🦅 — Sovereign Membership, Subscription & Verification Types

export type SubscriptionPlanId = 'free' | 'premium' | 'verified' | 'premium_verified';

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'payment_failed'
  | 'cancelled'
  | 'expired';

export type VerificationStatus =
  | 'not_verified'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  badgeTitle: string;
  priceLKR: number;
  billingInterval: 'month';
  trialDays: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  planId: SubscriptionPlanId;
  provider: 'payhere' | 'onepay' | 'sandbox';
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  amountLKR: number;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  lastPaymentId?: string;
  lastPaymentDate?: string;
  failureCount: number;
  lastFailureDate?: string;
  failureReason?: string;
  gracePeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  subscriptionId?: string;
  userId: string;
  username: string;
  planId: SubscriptionPlanId;
  amountLKR: number;
  currency: 'LKR';
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  provider: 'payhere' | 'onepay' | 'sandbox';
  providerTransactionId?: string;
  paymentMethod?: string; // e.g. 'VISA', 'Mastercard'
  maskedCard?: string; // e.g. '•••• 4242'
  failureReason?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface VerificationApplication {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  category:
    | 'creator'
    | 'business'
    | 'public_figure'
    | 'developer'
    | 'community_leader'
    | 'aviator';
  legalFullName: string;
  knownAs?: string;
  documentType: 'national_id' | 'passport' | 'driving_license' | 'business_reg';
  documentUrl: string;
  proofUrls: string[];
  description: string;
  status: VerificationStatus;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipSettings {
  plans: Record<SubscriptionPlanId, SubscriptionPlan>;
  trialDurationDays: number;
  oneTrialPerCustomer: boolean;
  gracePeriodDays: number;
  provider: 'payhere' | 'onepay' | 'sandbox';
  paymentMode: 'test' | 'live';
  merchantId?: string;
  currency: 'LKR';
  aiMonthlyQuota: {
    free: number;
    premium: number;
  };
  storageQuotaMB: {
    free: number;
    premium: number;
  };
  updatedAt: string;
}

export interface CheckoutSessionInit {
  planId: SubscriptionPlanId;
  isTrial: boolean;
  agreedToRecurring: boolean;
  redirectUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  planId: SubscriptionPlanId;
  amountLKR: number;
  isTrial: boolean;
  trialEnd?: string;
  nextBillingDate?: string;
  provider: 'payhere' | 'onepay' | 'sandbox';
  checkoutUrl?: string;
  params?: Record<string, any>;
  requiresRedirect: boolean;
}

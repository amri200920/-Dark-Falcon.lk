import React, { useState, useEffect } from 'react';
import {
  Crown,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import {
  SubscriptionPlan,
  Subscription,
  PaymentTransaction,
  VerificationApplication,
  SubscriptionPlanId,
} from '../../shared/types/membership';
import { VerificationBadge } from '../components/common/VerificationBadge';
import { PremiumBadge } from '../components/common/PremiumBadge';
import { CheckoutModal } from '../components/membership/CheckoutModal';
import { VerificationApplicationModal } from '../components/membership/VerificationApplicationModal';
import { Button } from '../components/common/Button';

export const MembershipPage: React.FC = () => {
  const [plans, setPlans] = useState<Record<SubscriptionPlanId, SubscriptionPlan> | null>(null);
  const [currency, setCurrency] = useState('LKR');
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>('test');
  const [membershipData, setMembershipData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, meRes] = await Promise.all([
        api.get<any>('/memberships/plans'),
        api.get<any>('/memberships/me'),
      ]);

      if (plansRes.success) {
        setPlans(plansRes.data.plans);
        setCurrency(plansRes.data.currency || 'LKR');
        setPaymentMode(plansRes.data.paymentMode || 'test');
      }

      if (meRes.success) {
        setMembershipData(meRes.data);
      }
    } catch (err) {
      console.error('Error loading membership data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? You will keep your benefits until your current billing period ends.')) return;
    setActionLoading(true);
    try {
      const res = await api.post('/memberships/cancel', {});
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/memberships/reactivate', {});
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  if (isLoading || !plans) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-falcon-blue" />
        Loading Sovereign Membership Portal...
      </div>
    );
  }

  const sub: Subscription | undefined = membershipData?.subscription;
  const currentTier: SubscriptionPlanId = membershipData?.membershipTier || 'free';
  const isTrialEligible = !!membershipData?.isTrialEligible;
  const verificationApp: VerificationApplication | undefined = membershipData?.verificationApplication;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 md:pb-8">
      {/* Test Mode Banner */}
      {paymentMode === 'test' && (
        <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <strong className="uppercase font-extrabold tracking-wider">Test Sandbox Active</strong>
            <span>— Transactions use simulated zero-risk sandbox tokens. No actual bank fees will be charged.</span>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1220] via-[#09152e] to-[#0b1220] border border-[#1b2b4e] rounded-3xl p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <VerificationBadge size="xs" showTooltip={false} /> Sovereign Aviator Pass
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Elevate Your Dark Falcon Presence
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Gain verified sovereign prestige with our custom Eagle Verification Badge, unlock unlimited AI capabilities, 4K media broadcasting, and enhanced platform visibility.
          </p>
        </div>
      </div>

      {/* Current Active Status Card */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#121828] border border-[#222e4c] flex items-center justify-center">
            {currentTier === 'premium' ? (
              <PremiumBadge size="lg" />
            ) : currentTier === 'verified' || currentTier === 'premium_verified' ? (
              <VerificationBadge size="lg" />
            ) : (
              <Zap className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base">
                Current Plan: {plans[currentTier]?.name || 'Free Tier'}
              </h3>
              {sub?.status === 'trialing' && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                  FREE TRIAL ACTIVE
                </span>
              )}
              {sub?.cancelAtPeriodEnd && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  PENDING CANCELLATION
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {sub?.currentPeriodEnd
                ? sub.cancelAtPeriodEnd
                  ? `Access remains active until ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()} for LKR ${sub.amountLKR.toLocaleString()}`
                : 'Standard access enabled. Upgrade anytime.'}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3">
          {sub && !sub.cancelAtPeriodEnd && sub.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="text-slate-400 hover:text-red-400"
            >
              Cancel Subscription
            </Button>
          )}

          {sub && sub.cancelAtPeriodEnd && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleReactivateSubscription}
              disabled={actionLoading}
            >
              Reactivate Membership
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsVerificationModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <VerificationBadge size="xs" showTooltip={false} />
            {verificationApp ? 'Verification Status' : 'Apply for Eagle Badge'}
          </Button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['premium', 'verified', 'premium_verified'] as SubscriptionPlanId[]).map((planKey) => {
          const plan = plans[planKey];
          if (!plan) return null;
          const isCurrent = currentTier === planKey;
          const hasTrial = plan.trialDays > 0 && isTrialEligible;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-[#0f172a] to-[#080d1a] border-2 border-falcon-blue shadow-[0_0_25px_rgba(0,180,255,0.15)]'
                  : 'bg-[#0c101a] border border-[#1b2438] hover:border-slate-700'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-falcon-blue text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {plan.id === 'premium' && <PremiumBadge size="sm" />}
                    {plan.id === 'verified' && <VerificationBadge size="sm" />}
                    {plan.id === 'premium_verified' && (
                      <div className="flex items-center -space-x-1">
                        <PremiumBadge size="sm" />
                        <VerificationBadge size="sm" />
                      </div>
                    )}
                    <h3 className="font-extrabold text-white text-lg">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">{plan.tagline}</p>

                {/* Pricing */}
                <div className="mb-6 p-4 rounded-2xl bg-[#080c14] border border-[#161f33]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">LKR {plan.priceLKR.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/{plan.billingInterval}</span>
                  </div>
                  {hasTrial ? (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3" /> 1 Month Free Trial Included
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Direct recurring monthly billing</p>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-falcon-blue shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <Button variant="secondary" className="w-full py-2.5 text-xs" disabled>
                    Current Active Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.isPopular ? 'primary' : 'secondary'}
                    className="w-full py-2.5 text-xs font-bold"
                    onClick={() => openCheckout(plan)}
                  >
                    {hasTrial ? 'Start 1-Month Free Trial' : `Subscribe • LKR ${plan.priceLKR.toLocaleString()}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Eagle Verification Showcase Section */}
      <div className="bg-[#0a0f1d] border border-[#1b2845] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="shrink-0 flex items-center justify-center p-6 rounded-3xl bg-[#060a14] border border-[#142038]">
          <VerificationBadge size="xl" showTooltip={false} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-white text-lg">
              The Sovereign Eagle: Sri Lanka's Most Unique Verification Badge
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike generic platforms that reuse standard social media checkmarks, Dark Falcon awards a custom-designed Sovereign Eagle emblem. Crafted with electric cyan accents and 8-pointed celestial symmetry, it represents verified trust, authenticity, and leadership within the sovereign digital frontier.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsVerificationModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <VerificationBadge size="xs" showTooltip={false} /> Submit Identity Credentials
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            loadData();
          }}
          isTrialEligible={isTrialEligible}
        />
      )}

      <VerificationApplicationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};

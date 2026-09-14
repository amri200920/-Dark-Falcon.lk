import React, { useState } from 'react';
import { X, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '../../../shared/types/membership';
import { api } from '../../services/api';
import { Button } from '../common/Button';

interface CheckoutModalProps {
  plan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isTrialEligible: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSuccess,
  isTrialEligible,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [useTrial, setUseTrial] = useState(isTrialEligible && plan.trialDays > 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!agreed) {
      setError('You must agree to the subscription terms before continuing.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<any>('/memberships/checkout', {
        planId: plan.id,
        isTrial: useTrial,
        agreedToRecurring: true,
        redirectUrl: `${window.location.origin}/#membership`,
        cancelUrl: `${window.location.origin}/#membership`,
      });

      if (res.success) {
        if (res.data.requiresRedirect && res.data.checkoutUrl) {
          // In live PayHere, submit form / redirect
          window.location.href = res.data.checkoutUrl;
        } else {
          onSuccess();
          onClose();
        }
      } else {
        setError(res.message || 'Payment initiation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101b] border border-[#1d273f] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-[#1d273f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-falcon-blue" />
            <h3 className="font-extrabold text-white text-base">Secure Sovereign Checkout</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl bg-[#121828] border border-[#222e4c] space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-white text-lg">{plan.name}</span>
              <span className="text-xl font-black text-falcon-blue">
                LKR {useTrial ? '0' : plan.priceLKR.toLocaleString()}
                <span className="text-xs font-normal text-slate-400">/{plan.billingInterval}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">{plan.tagline}</p>
          </div>

          {/* Trial toggle if eligible */}
          {isTrialEligible && plan.trialDays > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/40">
              <div>
                <p className="text-xs font-bold text-sky-200">1-Month Free Trial Available</p>
                <p className="text-[11px] text-sky-400">Enjoy full sovereign access with LKR 0 charged today</p>
              </div>
              <input
                type="checkbox"
                checked={useTrial}
                onChange={(e) => setUseTrial(e.target.checked)}
                className="w-4 h-4 rounded text-falcon-blue accent-falcon-blue cursor-pointer"
              />
            </div>
          )}

          {/* Explicit Billing Disclosure */}
          <div className="text-xs text-slate-400 space-y-2 bg-[#080c14] p-3.5 rounded-xl border border-slate-800">
            <p className="font-bold text-slate-300">Billing Terms & Transparent Guarantee:</p>
            {useTrial ? (
              <p>
                Your card will be pre-authorized today for <strong className="text-white">LKR 0</strong>. After your 30-day free trial, your membership will renew automatically at <strong className="text-white">LKR {plan.priceLKR.toLocaleString()}/month</strong> unless cancelled before the trial ends.
              </p>
            ) : (
              <p>
                You will be charged <strong className="text-white">LKR {plan.priceLKR.toLocaleString()}</strong> today. Your membership automatically renews each month until cancelled.
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Cancel at any time from your Membership Settings. You will retain full access until the end of the billing period.
            </p>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-falcon-blue accent-falcon-blue cursor-pointer"
            />
            <span className="text-xs text-slate-300">
              I agree to the recurring subscription terms and understand my subscription will renew automatically.
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1d273f] bg-[#090d16] flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCheckout}
            disabled={!agreed || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {useTrial ? 'Start 1-Month Free Trial' : `Subscribe for LKR ${plan.priceLKR.toLocaleString()}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { Request, Response } from 'express';
import { db } from '../services/dbService';
import { subscriptionService } from '../services/payment/SubscriptionService';
import { paymentWebhookService } from '../services/payment/PaymentWebhookService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  SubscriptionPlanId,
  VerificationApplication,
} from '../../shared/types/membership';

export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = db.getMembershipSettings();
    res.json({
      success: true,
      data: {
        plans: settings.plans,
        trialDurationDays: settings.trialDurationDays,
        currency: settings.currency,
        paymentMode: settings.paymentMode,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyMembership = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = db.findUserById(userId);
    const subscription = db.findSubscriptionByUserId(userId);
    const transactions = db.getUserTransactions(userId);
    const application = db.getUserVerificationApplication(userId);
    const isTrialEligible = subscriptionService.checkTrialEligibility(userId);

    res.json({
      success: true,
      data: {
        membershipTier: user?.membershipTier || 'free',
        membershipStatus: user?.membershipStatus || 'none',
        isVerified: user?.isVerified || false,
        trialUsed: user?.trialUsed || false,
        isTrialEligible,
        subscription,
        transactions,
        verificationApplication: application,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { planId, isTrial, agreedToRecurring, redirectUrl, cancelUrl } = req.body;
    if (!planId) {
      res.status(400).json({ success: false, message: 'Plan ID is required' });
      return;
    }

    if (!agreedToRecurring) {
      res.status(400).json({
        success: false,
        message: 'You must agree to recurring billing terms to proceed.',
      });
      return;
    }

    const session = await subscriptionService.initiateSubscription(userId, {
      planId: planId as SubscriptionPlanId,
      isTrial: !!isTrial,
      agreedToRecurring: !!agreedToRecurring,
      redirectUrl,
      cancelUrl,
    });

    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const sub = subscriptionService.cancelSubscription(userId);
    res.json({
      success: true,
      data: sub,
      message: 'Subscription marked to cancel at the end of the current billing period.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reactivateSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const sub = subscriptionService.reactivateSubscription(userId);
    res.json({ success: true, data: sub, message: 'Subscription successfully reactivated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitVerificationApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = db.findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const {
      category,
      legalFullName,
      knownAs,
      documentType,
      documentUrl,
      proofUrls,
      description,
    } = req.body;

    if (!category || !legalFullName || !documentType || !documentUrl || !description) {
      res.status(400).json({ success: false, message: 'Please provide all required application fields.' });
      return;
    }

    const existing = db.getUserVerificationApplication(userId);
    if (existing && (existing.status === 'pending' || existing.status === 'under_review')) {
      res.status(400).json({ success: false, message: 'You already have an active verification application under review.' });
      return;
    }

    const appData: VerificationApplication = {
      id: `vapp_${Date.now()}_${userId.slice(0, 5)}`,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      category,
      legalFullName,
      knownAs,
      documentType,
      documentUrl,
      proofUrls: Array.isArray(proofUrls) ? proofUrls : [],
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.createVerificationApplication(appData);
    db.updateUser(user.id, { verificationStatus: 'pending' });

    res.json({
      success: true,
      data: saved,
      message: 'Verification application submitted! Our team will review your identity credentials.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handlePayHereWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentWebhookService.handlePayHereWebhook({
      rawBody: (req as any).rawBody || '',
      headers: req.headers as any,
      parsedBody: req.body,
    });

    if (result.success) {
      res.status(200).send('OK');
    } else {
      res.status(400).send(result.message);
    }
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

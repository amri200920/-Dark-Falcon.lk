import { Request, Response } from 'express';
import { db } from '../services/dbService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getAdminMembershipData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = db.getMembershipAdminStats();
    const settings = db.getMembershipSettings();
    const subscriptions = db.getAllSubscriptions();
    const transactions = db.getAllTransactions();
    const verificationApplications = db.getVerificationApplications();

    res.json({
      success: true,
      data: {
        stats,
        settings,
        subscriptions,
        transactions,
        verificationApplications,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminMembershipSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { plans, trialDurationDays, oneTrialPerCustomer, gracePeriodDays, provider, paymentMode } = req.body;
    const patch: any = {};

    if (plans && typeof plans === 'object') patch.plans = plans;
    if (typeof trialDurationDays === 'number' && trialDurationDays >= 0) patch.trialDurationDays = trialDurationDays;
    if (typeof oneTrialPerCustomer === 'boolean') patch.oneTrialPerCustomer = oneTrialPerCustomer;
    if (typeof gracePeriodDays === 'number' && gracePeriodDays >= 0) patch.gracePeriodDays = gracePeriodDays;
    if (provider && ['payhere', 'onepay', 'sandbox'].includes(provider)) patch.provider = provider;
    if (paymentMode && ['test', 'live'].includes(paymentMode)) patch.paymentMode = paymentMode;

    const updated = db.updateMembershipSettings(patch);
    res.json({
      success: true,
      data: updated,
      message: 'Membership settings and pricing updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewVerificationApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'under_review', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid verification status' });
      return;
    }

    const app = db.getVerificationApplications().find((a) => a.id === id);
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const updated = db.updateVerificationApplication(id, {
      status,
      adminNotes,
      rejectionReason,
      reviewedBy: req.user?.username,
      reviewedAt: new Date().toISOString(),
    });

    // If approved, update user's verification status
    if (status === 'approved') {
      db.updateUser(app.userId, {
        isVerified: true,
        verificationStatus: 'approved',
      });
    } else if (status === 'rejected' || status === 'suspended') {
      db.updateUser(app.userId, {
        isVerified: false,
        verificationStatus: status,
      });
    }

    res.json({
      success: true,
      data: updated,
      message: `Verification application marked as ${status}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

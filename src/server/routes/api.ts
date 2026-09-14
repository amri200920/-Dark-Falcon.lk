import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  register,
  login,
  googleAuth,
  phoneOtpRequest,
  getMe,
  getSessions,
  terminateSession,
  terminateOtherSessions,
  setAppLockPin,
  verifyAppLockPin,
  requestRecovery,
  verifyAndResetPassword,
  configureRecovery,
  logoutUser,
} from '../controllers/authController';
import {
  getPlans,
  getMyMembership,
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  submitVerificationApplication,
  handlePayHereWebhook,
} from '../controllers/membershipController';
import {
  getAdminMembershipData,
  updateAdminMembershipSettings,
  reviewVerificationApplication,
} from '../controllers/adminMembershipController';
import {
  getFeed,
  getPost,
  createPost,
  deletePost,
  toggleReaction,
  getComments,
  addComment,
} from '../controllers/postController';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  createConversation,
  toggleLockConversation,
  editMessage,
  deleteMessage,
  reactMessage,
  markMessagesRead,
} from '../controllers/messageController';
import {
  getStories,
  createStory,
  viewStory,
  getStatuses,
  createStatus,
  getShortVideos,
  createShortVideo,
} from '../controllers/storyController';
import {
  getCallLogs,
  createMeeting,
  getMeeting,
  joinMeeting,
  getIceServers,
} from '../controllers/callMeetingController';
import {
  getCommunities,
  getCommunity,
  createCommunity,
  getBroadcastChannels,
  getBroadcastChannel,
  createBroadcastChannel,
  createBroadcastPost,
} from '../controllers/communityChannelController';
import {
  askAI,
  getCaptions,
  getHashtags,
  rewrite,
  summarize,
} from '../controllers/aiController';
import {
  getStats,
  getUsers,
  updateUserStatus,
  getReports,
  resolveReport,
  getAuditLogs,
} from '../controllers/adminController';
import {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getNotifications,
  markNotificationRead,
  getSavedItems,
  toggleSaveItem,
  searchGlobal,
  getSystemConfig,
  deleteAccount,
  exportAccountData,
} from '../controllers/userController';
import {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireModerator,
} from '../middleware/authMiddleware';
import {
  authRateLimiter,
  aiRateLimiter,
  standardRateLimiter,
} from '../middleware/rateLimiter';

const router = express.Router();

// --- Health & Readiness Probes ---
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Dark Falcon🦅',
    version: '1.0.0',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.get('/ready', (_req, res) => {
  res.json({
    status: 'ready',
    app: 'Dark Falcon🦅',
    version: '1.0.0',
    services: {
      api: 'online',
      db: 'ready',
      storage: 'ready',
    },
    time: new Date().toISOString(),
  });
});

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `df-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Upload media route
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded.' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// --- Auth Routes ---
router.post('/auth/register', authRateLimiter, register);
router.post('/auth/login', authRateLimiter, login);
router.post('/auth/google', googleAuth);
router.post('/auth/logout', requireAuth, logoutUser);
router.post('/auth/phone-otp', phoneOtpRequest);
router.get('/auth/me', requireAuth, getMe);
router.get('/auth/sessions', requireAuth, getSessions);
router.delete('/auth/sessions/:sessionId', requireAuth, terminateSession);
router.post('/auth/sessions/terminate-others', requireAuth, terminateOtherSessions);
router.post('/auth/app-lock/pin', requireAuth, setAppLockPin);
router.post('/auth/app-lock/verify', requireAuth, verifyAppLockPin);
router.post('/auth/recovery/request', authRateLimiter, requestRecovery);
router.post('/auth/recovery/verify-and-reset', authRateLimiter, verifyAndResetPassword);
router.post('/auth/recovery/configure', requireAuth, configureRecovery);

// --- Feed & Posts ---
router.get('/posts/feed', optionalAuth, standardRateLimiter, getFeed);
router.get('/posts/:id', optionalAuth, getPost);
router.post('/posts', requireAuth, createPost);
router.delete('/posts/:id', requireAuth, deletePost);
router.post('/posts/:id/reactions', requireAuth, toggleReaction);
router.post('/posts/:id/react', requireAuth, toggleReaction);
router.get('/posts/:id/comments', optionalAuth, getComments);
router.post('/posts/:id/comments', requireAuth, addComment);

// --- Stories, Status, Short Videos ---
router.get('/stories', optionalAuth, getStories);
router.post('/stories', requireAuth, createStory);
router.post('/stories/:id/view', requireAuth, viewStory);
router.get('/status', optionalAuth, getStatuses);
router.post('/status', requireAuth, createStatus);
router.get('/videos', optionalAuth, getShortVideos);
router.post('/videos', requireAuth, createShortVideo);

// --- Messaging & Groups ---
router.get('/conversations', requireAuth, getConversations);
router.post('/conversations', requireAuth, createConversation);
router.get('/conversations/:id', requireAuth, getConversation);
router.get('/conversations/:id/messages', requireAuth, getMessages);
router.post('/conversations/:id/messages', requireAuth, sendMessage);
router.post('/conversations/:id/read', requireAuth, markMessagesRead);
router.put('/conversations/messages/:messageId', requireAuth, editMessage);
router.delete('/conversations/messages/:messageId', requireAuth, deleteMessage);
router.post('/conversations/messages/:messageId/react', requireAuth, reactMessage);
router.post('/conversations/:id/lock', requireAuth, toggleLockConversation);

// --- Calls & Meetings ---
router.get('/calls/history', requireAuth, getCallLogs);
router.get('/calls/ice-servers', requireAuth, getIceServers);
router.post('/meetings', requireAuth, createMeeting);
router.get('/meetings/:code', requireAuth, getMeeting);
router.post('/meetings/:code/join', requireAuth, joinMeeting);

// --- Communities & Channels ---
router.get('/communities', optionalAuth, getCommunities);
router.get('/communities/:id', optionalAuth, getCommunity);
router.post('/communities', requireAuth, createCommunity);
router.get('/channels', optionalAuth, getBroadcastChannels);
router.get('/channels/:id', optionalAuth, getBroadcastChannel);
router.post('/channels', requireAuth, createBroadcastChannel);
router.post('/channels/:id/posts', requireAuth, createBroadcastPost);

// --- Dark Falcon AI 🦅 ---
router.post('/ai/chat', requireAuth, aiRateLimiter, askAI);
router.post('/ai/caption', requireAuth, aiRateLimiter, getCaptions);
router.post('/ai/hashtags', requireAuth, aiRateLimiter, getHashtags);
router.post('/ai/rewrite', requireAuth, aiRateLimiter, rewrite);
router.post('/ai/summarize', requireAuth, aiRateLimiter, summarize);

// --- User Profiles & Actions ---
router.get('/users/profile/:username', optionalAuth, getProfile);
router.put('/users/profile', requireAuth, updateProfile);
router.post('/users/:id/follow', requireAuth, followUser);
router.post('/users/:id/unfollow', requireAuth, unfollowUser);
router.post('/users/:id/block', requireAuth, blockUser);
router.post('/users/:id/unblock', requireAuth, unblockUser);
router.get('/notifications', requireAuth, getNotifications);
router.post('/notifications/:id/read', requireAuth, markNotificationRead);
router.get('/saved', requireAuth, getSavedItems);
router.post('/saved/toggle', requireAuth, toggleSaveItem);
router.get('/search', optionalAuth, searchGlobal);
router.get('/config/status', getSystemConfig);
router.delete('/users/account', requireAuth, deleteAccount);
router.get('/users/data/export', requireAuth, exportAccountData);

// --- Admin & Moderation ---
router.get('/admin/stats', requireAdmin, getStats);
router.get('/admin/users', requireAdmin, getUsers);
router.put('/admin/users/:id/status', requireAdmin, updateUserStatus);
router.get('/admin/reports', requireModerator, getReports);
router.put('/admin/reports/:id/resolve', requireModerator, resolveReport);
router.get('/admin/audit-logs', requireAdmin, getAuditLogs);

// --- Membership & Subscriptions 👑🦅 ---
router.get('/memberships/plans', getPlans);
router.get('/memberships/me', requireAuth, getMyMembership);
router.post('/memberships/checkout', requireAuth, createCheckoutSession);
router.post('/memberships/cancel', requireAuth, cancelSubscription);
router.post('/memberships/reactivate', requireAuth, reactivateSubscription);
router.post('/memberships/verification/apply', requireAuth, submitVerificationApplication);
router.post('/memberships/webhook/payhere', express.urlencoded({ extended: true }), handlePayHereWebhook);

// --- Admin Membership Management ---
router.get('/admin/memberships', requireAdmin, getAdminMembershipData);
router.put('/admin/memberships/settings', requireAdmin, updateAdminMembershipSettings);
router.put('/admin/memberships/verification/:id/review', requireAdmin, reviewVerificationApplication);

export default router;

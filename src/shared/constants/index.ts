// Dark Falcon Shared Constants

export const APP_NAME = 'Dark Falcon🦅';
export const APP_TAGLINE = 'Connect. Create. Communicate.';

export const BRAND_COLORS = {
  bg: '#06080d',
  card: '#0c101a',
  surface: '#121826',
  border: '#1b2438',
  blue: '#00a6ff',
  blueGlow: '#00d2ff',
  silver: '#cbd5e1',
  white: '#f8fafc',
};

export const REACTION_ICONS: Record<string, { label: string; emoji: string; color: string }> = {
  like: { label: 'Like', emoji: '👍', color: '#00a6ff' },
  love: { label: 'Love', emoji: '❤️', color: '#ef4444' },
  haha: { label: 'Haha', emoji: '😂', color: '#f59e0b' },
  wow: { label: 'Wow', emoji: '😮', color: '#8b5cf6' },
  sad: { label: 'Sad', emoji: '😢', color: '#3b82f6' },
  angry: { label: 'Angry', emoji: '😡', color: '#f97316' },
};

export const DEFAULT_COLLECTIONS = ['Favorites', 'Business', 'Inspiration', 'Personal'];

export const COMMUNITY_CATEGORIES = [
  'Technology',
  'Gaming',
  'Design & Art',
  'Crypto & Web3',
  'Music & Audio',
  'Science',
  'Cinema & Video',
  'Education',
];

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or automated content' },
  { value: 'scam', label: 'Fraud or scam attempt' },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'impersonation', label: 'Impersonation of someone else' },
  { value: 'abuse', label: 'Bullying or abuse' },
  { value: 'sexual', label: 'Inappropriate or NSFW content' },
  { value: 'violence', label: 'Violence or dangerous acts' },
  { value: 'illegal', label: 'Illegal goods or activities' },
  { value: 'other', label: 'Other violation of Community Guidelines' },
];

export const RESERVED_USERNAMES = [
  'admin',
  'darkfalcon',
  'root',
  'system',
  'moderator',
  'official',
  'security',
  'support',
  'help',
  'api',
  'falcon',
];

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

export interface VisualFilter {
  id: string;
  name: string;
  css: string;
}

export const CINEMATIC_FILTERS: VisualFilter[] = [
  { id: 'original', name: 'Original', css: 'none' },
  { id: 'cinematic', name: 'Cinematic', css: 'contrast(1.2) saturate(1.25) brightness(0.95) sepia(0.08)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.4) contrast(1.1) brightness(0.9) saturate(1.3)' },
  { id: 'bw', name: 'Black & White', css: 'grayscale(1) contrast(1.25) brightness(1.05)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.25) saturate(1.35) hue-rotate(-15deg)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(20deg) saturate(1.15) contrast(1.05)' },
  { id: 'neon', name: 'Neon', css: 'saturate(2.2) contrast(1.3) brightness(1.1)' },
  { id: 'dark', name: 'Dark', css: 'brightness(0.7) contrast(1.4) saturate(1.1)' },
  { id: 'high_contrast', name: 'High Contrast', css: 'contrast(1.6) saturate(1.2)' },
  { id: 'dark_falcon', name: 'Dark Falcon', css: 'contrast(1.35) saturate(1.4) hue-rotate(195deg) brightness(0.95)' },
];

export const getFilterCss = (filterId?: string): string => {
  if (!filterId || filterId === 'original') return 'none';
  const found = CINEMATIC_FILTERS.find((f) => f.id === filterId);
  return found ? found.css : 'none';
};


// src/constants/theme.js
// Design system constants — used throughout the app for consistent styling

export const Colors = {
  primary: '#0C4A8F',
  primaryLight: '#1565C0',
  primaryDark: '#062B5B',
  accent: '#E85D04',
  accentLight: '#FF8C42',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  success: '#1B5E20',
  successLight: '#E8F5E9',
  error: '#B71C1C',
  errorLight: '#FFEBEE',
  warning: '#E65100',
  warningLight: '#FFF3E0',
  text: '#1A1A2E',
  textSecondary: '#5C5C7B',
  textMuted: '#9898B0',
  border: '#E0E4EF',
  divider: '#F0F2F8',
  overlay: 'rgba(0,0,0,0.5)',
  // Status colors
  available: '#1B5E20',
  busy: '#E65100',
  offline: '#9898B0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

// Min touch target size per accessibility guidelines (48dp)
export const MIN_TOUCH_SIZE = 48;

// Service categories with icons (emoji as fallback, no icon library needed)
export const SERVICE_CATEGORIES = [
  { id: 'electrician', label: 'Electrician', icon: '⚡', color: '#F4B400' },
  { id: 'plumber', label: 'Plumber', icon: '🔧', color: '#4285F4' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪵', color: '#8D5524' },
  { id: 'painter', label: 'Painter', icon: '🎨', color: '#E91E63' },
  { id: 'cleaner', label: 'Cleaner', icon: '🧹', color: '#00BCD4' },
  { id: 'ac_technician', label: 'AC Technician', icon: '❄️', color: '#0C4A8F' },
  { id: 'mason', label: 'Mason', icon: '🧱', color: '#795548' },
  { id: 'welder', label: 'Welder', icon: '🔩', color: '#607D8B' },
];

export const SERVICE_RADIUS_OPTIONS = [5, 10, 20]; // km

export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

export const JOB_STATUS = {
  OPEN: 'open',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const URGENCY = {
  NORMAL: 'normal',
  URGENT: 'urgent',
};

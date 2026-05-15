// src/components/ui/Badge.jsx
// Status badge used for job status, availability, urgency, verification

import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const VARIANTS = {
  available: { bg: '#E8F5E9', text: Colors.success, label: 'Available' },
  busy: { bg: '#FFF3E0', text: Colors.warning, label: 'Busy' },
  offline: { bg: Colors.divider, text: Colors.textMuted, label: 'Offline' },
  open: { bg: '#E3F2FD', text: '#1565C0', label: 'Open' },
  accepted: { bg: '#E8F5E9', text: Colors.success, label: 'Accepted' },
  in_progress: { bg: '#FFF9C4', text: '#F57F17', label: 'In Progress' },
  completed: { bg: '#E8F5E9', text: Colors.success, label: 'Completed' },
  cancelled: { bg: Colors.errorLight, text: Colors.error, label: 'Cancelled' },
  urgent: { bg: '#FFE0E0', text: Colors.error, label: '🔴 Urgent' },
  normal: { bg: Colors.divider, text: Colors.textSecondary, label: 'Normal' },
  verified: { bg: '#E8F5E9', text: Colors.success, label: '✓ Verified' },
  pending: { bg: '#FFF9C4', text: '#F57F17', label: 'Pending' },
  rejected: { bg: Colors.errorLight, text: Colors.error, label: 'Rejected' },
};

export default function Badge({ type, label: customLabel, size = 'sm' }) {
  const variant = VARIANTS[type] || VARIANTS.normal;
  const label = customLabel || variant.label;

  return (
    <View style={[styles.badge, { backgroundColor: variant.bg }, size === 'lg' && styles.lg]}>
      <Text style={[styles.text, { color: variant.text }, size === 'lg' && styles.lgText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  lg: { paddingHorizontal: 12, paddingVertical: 5 },
  lgText: { fontSize: FontSize.sm },
});

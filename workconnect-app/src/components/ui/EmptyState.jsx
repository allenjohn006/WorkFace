// src/components/ui/EmptyState.jsx
// Empty state display for lists with no data — no blank screens ever

import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../../constants/theme';
import Button from './Button';

/**
 * @param {string} emoji - Large emoji icon
 * @param {string} title - Main message
 * @param {string} subtitle - Helper text
 * @param {string} actionLabel - Optional CTA button label
 * @param {Function} onAction - CTA button handler
 */
export default function EmptyState({
  emoji = '📭',
  title = 'Nothing here yet',
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          size="md"
          style={{ marginTop: 20, width: 200 }}
          fullWidth={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 8,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
});

// src/components/ui/Button.jsx
// Reusable Button with primary, secondary, outline, and danger variants
// Min touch target: 48dp per accessibility guidelines

import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, MIN_TOUCH_SIZE } from '../../constants/theme';

/**
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = true,
  style,
}) {
  const styles = getStyles(variant, size, disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.button, fullWidth && { alignSelf: 'stretch' }, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : Colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getStyles(variant, size, disabled) {
  const bgMap = {
    primary: Colors.primary,
    secondary: Colors.accent,
    outline: 'transparent',
    danger: Colors.error,
    ghost: 'transparent',
  };
  const textMap = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: Colors.primary,
    danger: '#FFFFFF',
    ghost: Colors.primary,
  };
  const sizeMap = {
    sm: { height: MIN_TOUCH_SIZE, px: 12, fontSize: FontSize.sm },
    md: { height: 52, px: 20, fontSize: FontSize.md },
    lg: { height: 58, px: 24, fontSize: FontSize.lg },
  };
  const s = sizeMap[size];

  return StyleSheet.create({
    button: {
      height: s.height,
      minHeight: MIN_TOUCH_SIZE,
      paddingHorizontal: s.px,
      backgroundColor: disabled
        ? Colors.border
        : bgMap[variant],
      borderRadius: BorderRadius.lg,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderColor: variant === 'outline' ? Colors.primary : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      color: disabled ? Colors.textMuted : textMap[variant],
      fontSize: s.fontSize,
      fontWeight: FontWeight.semibold,
      letterSpacing: 0.3,
    },
  });
}

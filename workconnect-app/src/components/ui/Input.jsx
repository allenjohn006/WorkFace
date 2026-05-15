// src/components/ui/Input.jsx
// Reusable form input with label, error state, and keyboard type support

import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  prefix,
  suffix,
  autoFocus = false,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 44 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoFocus={autoFocus}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.background,
    opacity: 0.7,
  },
  prefix: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginRight: 6,
    fontWeight: FontWeight.medium,
  },
  suffix: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 2,
  },
});

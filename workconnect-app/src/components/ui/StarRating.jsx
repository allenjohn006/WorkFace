// src/components/ui/StarRating.jsx
// Interactive and display-only star rating component

import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * @param {number} rating - Current rating value (1-5)
 * @param {Function} onRate - Called with new rating when user taps (omit for display-only)
 * @param {number} size - Star size in dp
 */
export default function StarRating({ rating = 0, onRate, size = 24 }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const filled = star <= Math.round(rating);
        if (onRate) {
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRate(star)}
              style={styles.starTouch}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Text style={{ fontSize: size, color: filled ? '#F4B400' : '#E0E0E0' }}>★</Text>
            </TouchableOpacity>
          );
        }
        return (
          <Text key={star} style={{ fontSize: size, color: filled ? '#F4B400' : '#E0E0E0' }}>
            ★
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  starTouch: { minWidth: 32, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
});

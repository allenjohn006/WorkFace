// app/(customer)/review.jsx
// Post-job review screen — 5-star rating + optional text

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, updateDoc, doc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import StarRating from '../../src/components/ui/StarRating';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

const QUICK_TAGS = ['Great work!', 'Very professional', 'On time', 'Clean work', 'Affordable', 'Highly recommend'];

export default function ReviewScreen() {
  const { jobId, workerId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const showToast = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { showToast('Please select a rating', 'error'); return; }
    setLoading(true);
    try {
      const reviewText = [review.trim(), ...selectedTags].filter(Boolean).join(' · ');

      // Save review document
      await addDoc(collection(db, 'reviews'), {
        jobId,
        fromUid: user.uid,
        toUid: workerId,
        rating,
        text: reviewText || '',
        createdAt: serverTimestamp(),
      });

      // Update worker's aggregate rating using Firestore increment
      const workerRef = doc(db, 'workers', workerId);
      const workerSnap = await getDoc(workerRef);
      if (workerSnap.exists()) {
        const { rating: oldRating = 0, totalRatings = 0 } = workerSnap.data();
        const newTotal = totalRatings + 1;
        const newRating = ((oldRating * totalRatings) + rating) / newTotal;
        await updateDoc(workerRef, {
          rating: Math.round(newRating * 10) / 10,
          totalRatings: increment(1),
        });
      }

      showToast('Review submitted! Thank you.', 'success');
      router.replace('/(customer)/bookings');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit review. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.title}>Rate your experience</Text>
          <Text style={styles.subtitle}>
            Your feedback helps other customers and motivates workers
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap to rate'
              : rating === 1 ? '😞 Poor'
              : rating === 2 ? '😐 Below Average'
              : rating === 3 ? '😊 Average'
              : rating === 4 ? '😁 Good'
              : '🤩 Excellent!'}
          </Text>
          <StarRating rating={rating} onRate={setRating} size={44} />
        </View>

        {/* Quick Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick feedback</Text>
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Review */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Write a review (optional)</Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="Share more details about your experience..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={300}
            style={styles.textInput}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length}/300</Text>
        </View>

        <Button
          label="Submit Review"
          onPress={handleSubmit}
          loading={loading}
          disabled={rating === 0}
          size="lg"
        />

        <TouchableOpacity onPress={() => router.replace('/(customer)/bookings')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 10, paddingTop: 16 },
  emoji: { fontSize: 60 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  ratingCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
  },
  ratingLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, height: 30 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  tagTextActive: { color: '#fff' },
  textInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 14, fontSize: FontSize.md, color: Colors.text,
    minHeight: 100, backgroundColor: Colors.background,
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: FontSize.md, color: Colors.textMuted, textDecoration: 'underline' },
});

// app/(customer)/post-request.jsx
// Post a job request — category, description, location, urgency, budget

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { geohashForLocation } from 'geofire-common';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createJob } from '../../src/services/jobService';
import useAuthStore from '../../src/store/authStore';
import useJobStore from '../../src/store/jobStore';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, SERVICE_CATEGORIES,
} from '../../src/constants/theme';

const schema = z.object({
  description: z.string().min(10, 'Please describe the job in at least 10 characters').max(500),
  address: z.string().min(5, 'Please enter the job location address').max(200),
  budgetMin: z.number().min(100).max(5000),
  budgetMax: z.number().min(100).max(5000),
});

const BUDGET_STEPS = [100, 200, 500, 1000, 1500, 2000, 3000, 5000];

export default function PostRequestScreen() {
  const { user, profile } = useAuthStore();
  const { selectedCategory, setSelectedCategory } = useJobStore();
  const showToast = useToast();

  const [category, setCategory] = useState(selectedCategory || SERVICE_CATEGORIES[0]);
  const [urgent, setUrgent] = useState(false);
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(2000);
  const [locationLoading, setLocationLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema.omit({ budgetMin: true, budgetMax: true })),
    defaultValues: { description: '', address: profile?.address || '' },
  });

  const fetchGPS = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied. Please enter address manually.', 'error');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGpsLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      // Reverse geocode for human-readable address
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place) {
        const addr = [place.name, place.street, place.district, place.city]
          .filter(Boolean).join(', ');
        setValue('address', addr);
      }
      showToast('Location detected!', 'success');
    } catch {
      showToast('Could not get location. Please enter address manually.', 'error');
    } finally {
      setLocationLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!user) return;
    if (budgetMin > budgetMax) {
      showToast('Minimum budget cannot exceed maximum', 'error'); return;
    }
    setLoading(true);
    try {
      const location = gpsLocation || { lat: 10.8505, lng: 76.2711 }; // Kerala center fallback
      const geohash = geohashForLocation([location.lat, location.lng]);

      const jobId = await createJob({
        customerId: user.uid,
        customerName: profile?.name,
        category: category.id,
        categoryLabel: category.label,
        description: data.description.trim(),
        address: data.address.trim(),
        location,
        geohash,
        urgency: urgent ? 'urgent' : 'normal',
        budgetMin,
        budgetMax,
      });

      showToast('Job posted! Finding workers near you...', 'success');
      router.push({ pathname: '/(customer)/nearby-workers', params: { jobId } });
    } catch (err) {
      console.error(err);
      showToast('Failed to post job. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Post a Request</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Service Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <View style={styles.catRow}>
                {SERVICE_CATEGORIES.map((cat) => {
                  const isSelected = category.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategory(cat)}
                      style={[styles.catChip, isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                    >
                      <Text style={styles.catEmoji}>{cat.icon}</Text>
                      <Text style={[styles.catLabel, isSelected && { color: '#fff' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Controller
              control={control} name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Describe the Job"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. My bathroom tap is leaking and needs to be replaced..."
                  multiline numberOfLines={4}
                  error={errors.description?.message}
                />
              )}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Controller
              control={control} name="address"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Job Location Address"
                  value={value}
                  onChangeText={onChange}
                  placeholder="House no., Street, Area"
                  error={errors.address?.message}
                  multiline numberOfLines={2}
                />
              )}
            />
            <Button
              label={locationLoading ? 'Detecting...' : '📍 Use My Current Location'}
              onPress={fetchGPS}
              variant="outline"
              size="sm"
              loading={locationLoading}
              style={{ alignSelf: 'flex-start' }}
              fullWidth={false}
            />
            {gpsLocation && (
              <Text style={styles.gpsConfirm}>✅ GPS location captured</Text>
            )}
          </View>

          {/* Urgency Toggle */}
          <View style={styles.urgencyRow}>
            <View style={styles.urgencyLeft}>
              <Text style={styles.sectionLabel}>Mark as Urgent</Text>
              <Text style={styles.urgencyHint}>Workers will prioritize urgent requests</Text>
            </View>
            <Switch
              value={urgent}
              onValueChange={setUrgent}
              trackColor={{ false: Colors.border, true: Colors.error }}
              thumbColor="#fff"
            />
          </View>

          {/* Budget Range */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Budget Range</Text>
            <View style={styles.budgetDisplay}>
              <Text style={styles.budgetValue}>₹{budgetMin.toLocaleString()}</Text>
              <Text style={styles.budgetDash}>—</Text>
              <Text style={styles.budgetValue}>₹{budgetMax.toLocaleString()}</Text>
            </View>
            <Text style={styles.urgencyHint}>Minimum budget</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.budgetRow}>
                {BUDGET_STEPS.map((val) => (
                  <TouchableOpacity
                    key={`min-${val}`}
                    onPress={() => setBudgetMin(val)}
                    style={[styles.budgetChip, budgetMin === val && styles.budgetChipActive]}
                  >
                    <Text style={[styles.budgetChipText, budgetMin === val && { color: '#fff' }]}>
                      ₹{val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.urgencyHint}>Maximum budget</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.budgetRow}>
                {BUDGET_STEPS.map((val) => (
                  <TouchableOpacity
                    key={`max-${val}`}
                    onPress={() => setBudgetMax(val)}
                    style={[styles.budgetChip, budgetMax === val && styles.budgetChipActive]}
                  >
                    <Text style={[styles.budgetChipText, budgetMax === val && { color: '#fff' }]}>
                      ₹{val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Button
            label="🔍 Find Workers Nearby"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  pageTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  catScroll: { marginHorizontal: -4 },
  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
  },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  gpsConfirm: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.medium },
  urgencyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  urgencyLeft: { gap: 3, flex: 1 },
  urgencyHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  budgetDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  budgetDash: { fontSize: FontSize.lg, color: Colors.textMuted },
  budgetRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  budgetChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  budgetChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  budgetChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
});

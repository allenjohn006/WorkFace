// app/(auth)/worker-onboarding.jsx
// Worker profile setup — skills, experience, service radius, photo

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../src/lib/firebase';
import { upsertUserProfile, upsertWorkerProfile } from '../../src/services/userService';
import useAuthStore from '../../src/store/authStore';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
  SERVICE_CATEGORIES, SERVICE_RADIUS_OPTIONS,
} from '../../src/constants/theme';

export default function WorkerOnboardingScreen() {
  const { user, setProfile, profile } = useAuthStore();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experience, setExperience] = useState(1);
  const [serviceRadius, setServiceRadius] = useState(10);
  const [photoUri, setPhotoUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Camera roll permission needed to upload photo', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const uploadPhoto = async (uid) => {
    if (!photoUri) return null;
    const response = await fetch(photoUri);
    const blob = await response.blob();
    const fileRef = storageRef(storage, `profile_photos/${uid}.jpg`);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, blob);
      task.on('state_changed',
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showToast('Please enter your name', 'error'); return; }
    if (selectedSkills.length === 0) { showToast('Select at least one skill', 'error'); return; }
    setLoading(true);
    try {
      const photoURL = await uploadPhoto(user.uid);
      const workerData = {
        uid: user.uid,
        name: name.trim(),
        phone: user.phoneNumber,
        skills: selectedSkills,
        experience,
        serviceRadius,
        photoURL,
        availability: 'offline',
        isOnline: false,
        rating: 0,
        totalRatings: 0,
        totalJobs: 0,
        verificationStatus: 'pending',
        role: 'worker',
      };
      await upsertWorkerProfile(user.uid, workerData);
      await upsertUserProfile(user.uid, { name: name.trim(), role: 'worker' });
      setProfile({ ...profile, name: name.trim(), role: 'worker' });
      showToast('Profile created! Welcome to WorkConnect 🎉', 'success');
      router.replace('/(worker)/jobs');
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Worker Profile</Text>
            <Text style={styles.subtitle}>Tell customers about your skills</Text>
          </View>

          {/* Photo Upload */}
          <TouchableOpacity onPress={pickPhoto} style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoLabel}>Add Profile Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          )}

          <View style={styles.section}>
            <Input label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Suresh Kumar" autoFocus />
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Skills <Text style={styles.required}>*</Text></Text>
            <Text style={styles.sectionHint}>Select all that apply</Text>
            <View style={styles.chips}>
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedSkills.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleSkill(cat.id)}
                    style={[styles.chip, isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  >
                    <Text style={styles.chipEmoji}>{cat.icon}</Text>
                    <Text style={[styles.chipLabel, isSelected && { color: '#fff' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Years of Experience</Text>
            <View style={styles.expRow}>
              {[1, 2, 3, 5, 7, 10, '10+'].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setExperience(typeof yr === 'number' ? yr : 10)}
                  style={[styles.expChip, experience === (typeof yr === 'number' ? yr : 10) && styles.expChipActive]}
                >
                  <Text style={[styles.expText, experience === (typeof yr === 'number' ? yr : 10) && { color: '#fff' }]}>
                    {yr} {typeof yr === 'number' ? 'yr' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Service Radius */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Service Radius</Text>
            <Text style={styles.sectionHint}>How far are you willing to travel?</Text>
            <View style={styles.radiusRow}>
              {SERVICE_RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  onPress={() => setServiceRadius(km)}
                  style={[styles.radiusChip, serviceRadius === km && styles.radiusChipActive]}
                >
                  <Text style={[styles.radiusText, serviceRadius === km && { color: '#fff' }]}>{km} km</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.verificationNote}>
            <Text style={styles.noteText}>
              🕐 Your profile will be reviewed by our team before going live.
              You can start receiving jobs once verified.
            </Text>
          </View>

          <Button label="Create Profile →" onPress={handleSubmit} loading={loading} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 8, paddingTop: 8 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  photoContainer: { alignSelf: 'center' },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.background, borderWidth: 2,
    borderColor: Colors.primary, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  photoIcon: { fontSize: 28 },
  photoLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
  },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: -6 },
  required: { color: Colors.error },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  expRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  expChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
  },
  expChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  expText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  radiusRow: { flexDirection: 'row', gap: 10 },
  radiusChip: {
    flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, alignItems: 'center',
  },
  radiusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radiusText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  verificationNote: {
    backgroundColor: '#FFF9C4', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#F9A825',
  },
  noteText: { fontSize: FontSize.sm, color: '#5D4037', lineHeight: 20 },
});

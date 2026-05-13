import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';

const WINDOWS = ['09:00-12:00', '12:00-15:00', '15:00-18:00'];

export default function SchedulePickup() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [pkgCount, setPkgCount] = useState('1');
  const [weight, setWeight] = useState('2');
  const [date, setDate] = useState('');
  const [win, setWin] = useState(WINDOWS[0]);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    api.get('/addresses').then(r => {
      setAddresses(r.data);
      const def = r.data.find((a: any) => a.isDefaultSender) || r.data[0];
      if (def) setSelectedAddr(def);
    }).catch(() => {});
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setDate(d.toISOString().slice(0, 10));
  }, []);

  const submit = async () => {
    if (!selectedAddr) { Alert.alert('Error', 'Pick a pickup address'); return; }
    setCreating(true);
    try {
      const res = await api.post('/pickups', {
        addressSnapshot: {
          name: selectedAddr.name, company: selectedAddr.company,
          address: selectedAddr.address, city: selectedAddr.city,
          country: selectedAddr.country, postalCode: selectedAddr.postalCode,
          phone: selectedAddr.phone,
        },
        packageCount: Number(pkgCount),
        totalWeightKg: Number(weight),
        scheduledDate: date,
        scheduledWindow: win,
        specialInstructions: notes,
      });
      setSuccess(res.data);
    } catch {
      Alert.alert('Error', 'Could not schedule pickup');
    } finally {
      setCreating(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View testID="pickup-success" style={styles.successCard}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color={Colors.white} />
            </View>
            <Text style={styles.successLabel}>PICKUP SCHEDULED</Text>
            <Text style={styles.successTitle}>Booked.</Text>
            <Text testID="pickup-conf" style={styles.successConf}>{success.confirmationNumber}</Text>
            <View style={styles.successDetails}>
              <Text style={styles.successDetailText}><Text style={{ fontWeight: '700' }}>Date:</Text> {success.scheduledDate}</Text>
              <Text style={styles.successDetailText}><Text style={{ fontWeight: '700' }}>Window:</Text> {success.scheduledWindow}</Text>
              <Text style={styles.successDetailText}><Text style={{ fontWeight: '700' }}>Address:</Text> {success.addressSnapshot.address}, {success.addressSnapshot.city}</Text>
              <Text style={styles.successDetailText}><Text style={{ fontWeight: '700' }}>Packages:</Text> {success.packageCount} · {success.totalWeightKg} kg</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/pickups')}>
              <Text style={styles.primaryBtnText}>VIEW ALL PICKUPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => setSuccess(null)}>
              <Text style={styles.ghostBtnText}>SCHEDULE ANOTHER</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="pickup-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View testID="pickup-page" style={styles.titleSection}>
            <Text style={styles.pageTitle}>Schedule Pickup</Text>
            <Text style={styles.pageSub}>Book a courier to collect your shipments.</Text>
          </View>

          <View style={styles.formCard}>
            {/* Step 1: Address */}
            <Text style={styles.stepLabel}>1. PICKUP ADDRESS</Text>
            {addresses.length === 0 ? (
              <Text style={styles.noAddresses}>No addresses found. Add one in Address Book first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {addresses.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    testID={`pickup-addr-${a.id}`}
                    style={[styles.addrCard, selectedAddr?.id === a.id && styles.addrCardSelected]}
                    onPress={() => setSelectedAddr(a)}
                  >
                    <Text style={styles.addrLabel}>{a.label}</Text>
                    <Text style={styles.addrName}>{a.name}</Text>
                    <Text style={styles.addrDetail}>{a.address}, {a.city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Step 2: Packages */}
            <Text style={styles.stepLabel}>2. NUMBER OF PACKAGES</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextInput testID="pickup-count" style={styles.input} value={pkgCount} onChangeText={setPkgCount} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>TOTAL WEIGHT (KG)</Text>
                <TextInput testID="pickup-weight" style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
              </View>
            </View>

            {/* Step 3: Date */}
            <Text style={styles.stepLabel}>3. DATE</Text>
            <TextInput testID="pickup-date" style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.dhlMuted} />

            {/* Step 4: Time Window */}
            <Text style={styles.stepLabel}>4. TIME WINDOW</Text>
            <View style={styles.windowRow}>
              {WINDOWS.map(w => (
                <TouchableOpacity
                  key={w}
                  testID={`pickup-win-${w}`}
                  style={[styles.windowBtn, win === w && styles.windowBtnActive]}
                  onPress={() => setWin(w)}
                >
                  <Text style={[styles.windowBtnText, win === w && styles.windowBtnTextActive]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 5: Notes */}
            <Text style={styles.stepLabel}>5. SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              testID="pickup-notes"
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Use rear loading dock, call upon arrival"
              placeholderTextColor={Colors.dhlMuted}
              multiline
            />

            {/* Submit */}
            <View style={styles.submitRow}>
              <TouchableOpacity
                testID="pickup-submit"
                style={[styles.submitBtn, (creating || !selectedAddr) && { opacity: 0.5 }]}
                onPress={submit}
                disabled={creating || !selectedAddr}
              >
                {creating ? <ActivityIndicator color={Colors.dhlInk} /> : (
                  <>
                    <Text style={styles.submitBtnText}>CONFIRM PICKUP</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  scroll: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  formCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16,
  },
  stepLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginTop: 16, marginBottom: 10 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6 },
  noAddresses: { fontSize: 13, color: Colors.dhlMuted, fontStyle: 'italic' },
  addrCard: { width: 180, padding: 12, borderWidth: 2, borderColor: Colors.dhlBorder, marginRight: 8, backgroundColor: Colors.white },
  addrCardSelected: { borderColor: Colors.dhlYellow, backgroundColor: 'rgba(255,204,0,0.1)' },
  addrLabel: { fontSize: 10, fontWeight: '800', color: Colors.dhlRed, letterSpacing: 1, textTransform: 'uppercase' },
  addrName: { fontSize: 14, fontWeight: '700', color: Colors.dhlText, marginTop: 4 },
  addrDetail: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
  row: { flexDirection: 'row', gap: 12 },
  input: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  windowRow: { flexDirection: 'row', gap: 8 },
  windowBtn: { flex: 1, paddingVertical: 12, borderWidth: 2, borderColor: Colors.dhlBorder, alignItems: 'center' },
  windowBtnActive: { borderColor: Colors.dhlYellow, backgroundColor: 'rgba(255,204,0,0.1)' },
  windowBtnText: { fontSize: 13, fontWeight: '700', color: Colors.dhlMuted },
  windowBtnTextActive: { color: Colors.dhlInk },
  submitRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 20, marginTop: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 44, backgroundColor: Colors.dhlYellow, paddingHorizontal: 24,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  submitBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  // Success
  successScroll: { paddingHorizontal: 16, paddingTop: 40 },
  successCard: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.green500, padding: 32, alignItems: 'center' },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.green500, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.green600, marginBottom: 8 },
  successTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, marginBottom: 8 },
  successConf: { fontSize: 22, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlRed, marginBottom: 16 },
  successDetails: { backgroundColor: Colors.dhlPanel, padding: 16, width: '100%', marginBottom: 20 },
  successDetailText: { fontSize: 14, color: Colors.dhlText, marginBottom: 4 },
  primaryBtn: {
    height: 44, backgroundColor: Colors.dhlYellow, paddingHorizontal: 24,
    borderWidth: 2, borderColor: Colors.dhlInk, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  ghostBtn: { paddingVertical: 12 },
  ghostBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1.5 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import api from '../../src/lib/api';
import { formatPGK, SERVICE_LABELS } from '../../src/lib/shipmentUtils';

const STEPS = ['Sender', 'Receiver', 'Package', 'Service', 'Confirm'];
const blankParty = { name: '', company: '', address: '', city: '', country: 'PG', postalCode: '', phone: '', email: '' };

export default function ShipNow() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const [sender, setSender] = useState({
    ...blankParty, name: user ? `${user.firstName} ${user.lastName}` : '',
    company: user?.companyName || '', phone: user?.phone || '', email: user?.email || '',
  });
  const [receiver, setReceiver] = useState({ ...blankParty, country: 'AU' });
  const [pkg, setPkg] = useState({ pieces: 1, weightKg: 2, l: 30, w: 20, h: 15, description: 'Commercial documents', declaredValueUSD: 100 });
  const [service, setService] = useState('');
  const [agree, setAgree] = useState(false);

  useEffect(() => { api.get('/locations/countries').then(r => setCountries(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (step === 3 && sender.city && receiver.city) {
      setQuoteLoading(true);
      api.post('/quotes', {
        originCountry: sender.country, originCity: sender.city,
        destinationCountry: receiver.country, destinationCity: receiver.city,
        weightKg: pkg.weightKg, length: pkg.l, width: pkg.w, height: pkg.h,
        declaredValueUSD: pkg.declaredValueUSD,
      }).then(r => setQuotes(r.data)).catch(() => Alert.alert('Error', 'Could not fetch quotes')).finally(() => setQuoteLoading(false));
    }
  }, [step]);

  const selectedQuote = quotes?.options?.find((o: any) => o.service === service);

  const canNext = () => {
    if (step === 0) return sender.name && sender.address && sender.city;
    if (step === 1) return receiver.name && receiver.address && receiver.city;
    if (step === 2) return pkg.pieces > 0 && pkg.weightKg > 0;
    if (step === 3) return !!service;
    if (step === 4) return agree;
    return false;
  };

  const onSubmit = async () => {
    setCreating(true);
    try {
      const body = {
        sender, receiver,
        package: { pieces: pkg.pieces, weightKg: pkg.weightKg, dimensions: { l: pkg.l, w: pkg.w, h: pkg.h }, description: pkg.description, declaredValueUSD: pkg.declaredValueUSD },
        service, paymentMethod: 'account', costPGK: selectedQuote?.pricePGK || 0,
      };
      const res = await api.post('/shipments', body);
      setSuccess(res.data);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Could not create shipment');
    } finally { setCreating(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View testID="shipnow-success" style={styles.successCard}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color={Colors.white} />
            </View>
            <Text style={styles.successLabel}>SHIPMENT CREATED</Text>
            <Text style={styles.successTitle}>Your AWB is ready.</Text>
            <Text testID="success-awb" style={styles.successAwb}>{success.awb}</Text>
            <Text style={styles.successSub}>{success.sender?.city} → {success.receiver?.city} · {SERVICE_LABELS[success.service]}</Text>
            <TouchableOpacity testID="success-view-shipment" style={styles.primaryBtn} onPress={() => router.push(`/shipment/${success.awb}`)}>
              <Text style={styles.primaryBtnText}>VIEW SHIPMENT</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => { setSuccess(null); setStep(0); setReceiver({ ...blankParty, country: 'AU' }); setService(''); setAgree(false); }}>
              <Text style={styles.ghostBtnText}>SHIP ANOTHER</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <View testID="shipnow-page" style={styles.headerSection}>
            <Text style={styles.pageTitle}>Ship Now</Text>
            <Text style={styles.pageSub}>Create a shipment in {STEPS.length} steps.</Text>
          </View>

          {/* Progress */}
          <View style={styles.progress}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.progressItem}>
                <View style={[styles.progressDot, i < step ? styles.progressDone : i === step ? styles.progressActive : styles.progressPending]}>
                  {i < step ? <Ionicons name="checkmark" size={12} color={Colors.white} /> : <Text style={[styles.progressNum, i === step && { color: Colors.dhlInk }]}>{i + 1}</Text>}
                </View>
                <Text style={[styles.progressLabel, i === step && { color: Colors.dhlText }]}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.stepCard} testID={`step-${step}`}>
            {step === 0 && (
              <>
                <Text style={styles.stepTitle}>Where's it shipping from?</Text>
                <InputField label="Full Name" value={sender.name} onChangeText={v => setSender({ ...sender, name: v })} testID="sender-name" />
                <InputField label="Company" value={sender.company} onChangeText={v => setSender({ ...sender, company: v })} testID="sender-company" />
                <InputField label="Address" value={sender.address} onChangeText={v => setSender({ ...sender, address: v })} testID="sender-address" />
                <InputField label="City" value={sender.city} onChangeText={v => setSender({ ...sender, city: v })} testID="sender-city" />
                <InputField label="Country Code" value={sender.country} onChangeText={v => setSender({ ...sender, country: v })} testID="sender-country" />
                <InputField label="Phone" value={sender.phone} onChangeText={v => setSender({ ...sender, phone: v })} testID="sender-phone" />
              </>
            )}

            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>Who's receiving it?</Text>
                <InputField label="Full Name" value={receiver.name} onChangeText={v => setReceiver({ ...receiver, name: v })} testID="receiver-name" />
                <InputField label="Company" value={receiver.company} onChangeText={v => setReceiver({ ...receiver, company: v })} testID="receiver-company" />
                <InputField label="Address" value={receiver.address} onChangeText={v => setReceiver({ ...receiver, address: v })} testID="receiver-address" />
                <InputField label="City" value={receiver.city} onChangeText={v => setReceiver({ ...receiver, city: v })} testID="receiver-city" />
                <InputField label="Country Code" value={receiver.country} onChangeText={v => setReceiver({ ...receiver, country: v })} testID="receiver-country" />
                <InputField label="Phone" value={receiver.phone} onChangeText={v => setReceiver({ ...receiver, phone: v })} testID="receiver-phone" />
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Package details</Text>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}><InputField label="Pieces" value={String(pkg.pieces)} onChangeText={v => setPkg({ ...pkg, pieces: Number(v) || 0 })} testID="pkg-pieces" keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><InputField label="Weight (kg)" value={String(pkg.weightKg)} onChangeText={v => setPkg({ ...pkg, weightKg: Number(v) || 0 })} testID="pkg-weight" keyboardType="numeric" /></View>
                </View>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}><InputField label="L (cm)" value={String(pkg.l)} onChangeText={v => setPkg({ ...pkg, l: Number(v) || 0 })} testID="pkg-l" keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><InputField label="W (cm)" value={String(pkg.w)} onChangeText={v => setPkg({ ...pkg, w: Number(v) || 0 })} testID="pkg-w" keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><InputField label="H (cm)" value={String(pkg.h)} onChangeText={v => setPkg({ ...pkg, h: Number(v) || 0 })} testID="pkg-h" keyboardType="numeric" /></View>
                </View>
                <InputField label="Description" value={pkg.description} onChangeText={v => setPkg({ ...pkg, description: v })} testID="pkg-desc" />
                <InputField label="Value (USD)" value={String(pkg.declaredValueUSD)} onChangeText={v => setPkg({ ...pkg, declaredValueUSD: Number(v) || 0 })} testID="pkg-value" keyboardType="numeric" />
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.stepTitle}>Pick your service</Text>
                {quoteLoading ? <ActivityIndicator color={Colors.dhlYellow} style={{ paddingVertical: 20 }} /> : (
                  quotes?.options?.map((opt: any) => (
                    <TouchableOpacity
                      key={opt.service}
                      testID={`service-option-${opt.service}`}
                      style={[styles.serviceOption, service === opt.service && styles.serviceOptionSelected]}
                      onPress={() => setService(opt.service)}
                    >
                      <View>
                        <Text style={styles.serviceName}>{opt.serviceName}</Text>
                        <Text style={styles.serviceDesc}>{opt.description}</Text>
                        <Text style={styles.serviceTransit}>Transit: {opt.transitDays} day{opt.transitDays > 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={styles.servicePrice}>{formatPGK(opt.pricePGK)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.stepTitle}>Review & confirm</Text>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>From</Text><Text style={styles.reviewValue}>{sender.name}, {sender.city}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>To</Text><Text style={styles.reviewValue}>{receiver.name}, {receiver.city}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Service</Text><Text style={styles.reviewValue}>{SERVICE_LABELS[service] || service}</Text></View>
                <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Package</Text><Text style={styles.reviewValue}>{pkg.pieces} pc · {pkg.weightKg} kg</Text></View>
                <View style={[styles.reviewRow, { backgroundColor: Colors.dhlInk, padding: 12 }]}><Text style={[styles.reviewLabel, { color: Colors.dhlYellow }]}>TOTAL</Text><Text style={{ fontSize: 20, fontWeight: '900', color: Colors.white }}>{selectedQuote ? formatPGK(selectedQuote.pricePGK) : '—'}</Text></View>

                <TouchableOpacity testID="confirm-tnc" style={styles.agreeRow} onPress={() => setAgree(!agree)}>
                  <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                    {agree && <Ionicons name="checkmark" size={14} color={Colors.dhlInk} />}
                  </View>
                  <Text style={styles.agreeText}>I confirm the shipment details are correct and accept DHL's terms.</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity testID="ship-back" style={styles.backBtn} onPress={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <Ionicons name="arrow-back" size={16} color={step === 0 ? Colors.dhlBorder : Colors.dhlText} />
              <Text style={[styles.backBtnText, step === 0 && { color: Colors.dhlBorder }]}>BACK</Text>
            </TouchableOpacity>
            {step < STEPS.length - 1 ? (
              <TouchableOpacity testID="ship-next" style={[styles.nextBtn, !canNext() && { opacity: 0.5 }]} onPress={() => setStep(s => s + 1)} disabled={!canNext()}>
                <Text style={styles.nextBtnText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity testID="ship-submit" style={[styles.nextBtn, (!canNext() || creating) && { opacity: 0.5 }]} onPress={onSubmit} disabled={!canNext() || creating}>
                {creating ? <ActivityIndicator color={Colors.dhlInk} /> : (
                  <><Text style={styles.nextBtnText}>CREATE SHIPMENT</Text><Ionicons name="checkmark-circle" size={14} color={Colors.dhlInk} /></>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputField = ({ label, value, onChangeText, testID, keyboardType }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput testID={testID} style={styles.fieldInput} value={value} onChangeText={onChangeText} placeholderTextColor={Colors.dhlMuted} keyboardType={keyboardType || 'default'} />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  formScroll: { paddingBottom: 40 },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  progress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, marginHorizontal: 16, marginBottom: 12 },
  progressItem: { alignItems: 'center', gap: 4 },
  progressDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  progressDone: { backgroundColor: Colors.green500 },
  progressActive: { backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk },
  progressPending: { backgroundColor: Colors.dhlPanel, borderWidth: 1, borderColor: Colors.dhlBorder },
  progressNum: { fontSize: 11, fontWeight: '700', color: Colors.dhlMuted },
  progressLabel: { fontSize: 9, fontWeight: '700', color: Colors.dhlMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 20 },
  stepTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText, marginBottom: 16 },
  fieldContainer: { marginBottom: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  inputRow: { flexDirection: 'row', gap: 8 },
  serviceOption: { borderWidth: 2, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceOptionSelected: { borderColor: Colors.dhlYellow, backgroundColor: 'rgba(255,204,0,0.1)' },
  serviceName: { fontSize: 16, fontWeight: '700', color: Colors.dhlText },
  serviceDesc: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  serviceTransit: { fontSize: 11, fontWeight: '700', color: Colors.dhlRed, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  servicePrice: { fontSize: 20, fontWeight: '900', color: Colors.dhlText },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  reviewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlMuted, textTransform: 'uppercase' },
  reviewValue: { fontSize: 14, fontWeight: '600', color: Colors.dhlText, maxWidth: '60%', textAlign: 'right' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: Colors.dhlBorder, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlYellow },
  agreeText: { flex: 1, fontSize: 13, color: Colors.dhlText, lineHeight: 20 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  backBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, backgroundColor: Colors.dhlYellow, paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk },
  nextBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  successContainer: { paddingHorizontal: 16, paddingTop: 40 },
  successCard: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.green500, padding: 32, alignItems: 'center' },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.green500, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.green600, marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '900', color: Colors.dhlText, marginBottom: 8 },
  successAwb: { fontSize: 22, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlRed, marginBottom: 8 },
  successSub: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, backgroundColor: Colors.dhlYellow, paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk, marginBottom: 12 },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  ghostBtn: { paddingVertical: 12 },
  ghostBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1.5 },
});

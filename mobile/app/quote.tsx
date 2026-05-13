import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';
import { formatPGK, SERVICE_LABELS } from '../src/lib/shipmentUtils';

export default function Quote() {
  const router = useRouter();
  const [countries, setCountries] = useState<any[]>([]);
  const [originCities, setOriginCities] = useState<any[]>([]);
  const [destCities, setDestCities] = useState<any[]>([]);
  const [form, setForm] = useState({
    originCountry: 'PG', originCity: 'Port Moresby',
    destinationCountry: 'AU', destinationCity: 'Sydney',
    weightKg: 5, length: 30, width: 20, height: 15, declaredValueUSD: 250,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get('/locations/countries').then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.originCountry) {
      api.get(`/locations/cities?country=${form.originCountry}`).then(r => setOriginCities(r.data)).catch(() => {});
    }
  }, [form.originCountry]);

  useEffect(() => {
    if (form.destinationCountry) {
      api.get(`/locations/cities?country=${form.destinationCountry}`).then(r => setDestCities(r.data)).catch(() => {});
    }
  }, [form.destinationCountry]);

  useEffect(() => {
    if (!form.originCity || !form.destinationCity || !form.weightKg) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.post('/quotes', form).then(r => setResult(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form]);

  const applyQuote = (opt: any) => {
    router.push('/(tabs)/ship');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="quote-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View testID="quote-page" style={styles.titleSection}>
            <Text style={styles.pageTitle}>Get a Quote</Text>
            <Text style={styles.pageSub}>Live rates between 220+ countries. No sign-up required.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>ORIGIN</Text>
            <Text style={styles.fieldLabel}>COUNTRY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {countries.map(c => (
                <TouchableOpacity
                  key={c.code}
                  testID={`quote-origin-country-${c.code}`}
                  style={[styles.chip, form.originCountry === c.code && styles.chipActive]}
                  onPress={() => setForm({ ...form, originCountry: c.code, originCity: '' })}
                >
                  <Text style={[styles.chipText, form.originCountry === c.code && styles.chipTextActive]}>
                    {c.flag} {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>CITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {originCities.map(c => (
                <TouchableOpacity
                  key={c.code}
                  testID={`quote-origin-city-${c.city}`}
                  style={[styles.chip, form.originCity === c.city && styles.chipActive]}
                  onPress={() => setForm({ ...form, originCity: c.city })}
                >
                  <Text style={[styles.chipText, form.originCity === c.city && styles.chipTextActive]}>
                    {c.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DESTINATION</Text>
            <Text style={styles.fieldLabel}>COUNTRY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {countries.map(c => (
                <TouchableOpacity
                  key={c.code}
                  testID={`quote-dest-country-${c.code}`}
                  style={[styles.chip, form.destinationCountry === c.code && styles.chipActive]}
                  onPress={() => setForm({ ...form, destinationCountry: c.code, destinationCity: '' })}
                >
                  <Text style={[styles.chipText, form.destinationCountry === c.code && styles.chipTextActive]}>
                    {c.flag} {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>CITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {destCities.map(c => (
                <TouchableOpacity
                  key={c.code}
                  testID={`quote-dest-city-${c.city}`}
                  style={[styles.chip, form.destinationCity === c.city && styles.chipActive]}
                  onPress={() => setForm({ ...form, destinationCity: c.city })}
                >
                  <Text style={[styles.chipText, form.destinationCity === c.city && styles.chipTextActive]}>
                    {c.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PACKAGE</Text>
            <Text style={styles.fieldLabel}>WEIGHT: {form.weightKg} KG</Text>
            <View style={styles.weightRow}>
              <TouchableOpacity testID="quote-weight-minus" style={styles.weightBtn} onPress={() => setForm({ ...form, weightKg: Math.max(0.5, form.weightKg - 0.5) })}>
                <Text style={styles.weightBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.weightBar}>
                <View style={[styles.weightFill, { width: `${Math.min(100, (form.weightKg / 50) * 100)}%` }]} />
              </View>
              <TouchableOpacity testID="quote-weight-plus" style={styles.weightBtn} onPress={() => setForm({ ...form, weightKg: Math.min(50, form.weightKg + 0.5) })}>
                <Text style={styles.weightBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dimRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>L (CM)</Text>
                <TextInput testID="quote-l" style={styles.input} value={String(form.length)} onChangeText={v => setForm({ ...form, length: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>W (CM)</Text>
                <TextInput testID="quote-w" style={styles.input} value={String(form.width)} onChangeText={v => setForm({ ...form, width: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>H (CM)</Text>
                <TextInput testID="quote-h" style={styles.input} value={String(form.height)} onChangeText={v => setForm({ ...form, height: Number(v) || 0 })} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>DECLARED VALUE (USD)</Text>
            <TextInput testID="quote-value" style={styles.input} value={String(form.declaredValueUSD)} onChangeText={v => setForm({ ...form, declaredValueUSD: Number(v) || 0 })} keyboardType="numeric" />
          </View>

          {/* Results */}
          <View testID="quote-results" style={styles.resultsBanner}>
            <View style={styles.resultsBannerInner}>
              <View>
                <Text style={styles.resultsLabel}>LIVE ESTIMATE</Text>
                <Text style={styles.resultsRoute}>
                  {result ? `${form.originCity} → ${form.destinationCity}` : 'Pick a route'}
                </Text>
              </View>
              {loading && <ActivityIndicator color={Colors.dhlYellow} />}
            </View>
          </View>

          {result?.options?.map((opt: any) => (
            <View key={opt.service} testID={`quote-card-${opt.service}`} style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionName}>{opt.serviceName}</Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                  <Text style={styles.optionTransit}>
                    Transit: {opt.transitDays} day{opt.transitDays > 1 ? 's' : ''} · ETA {opt.estimatedDelivery}
                  </Text>
                </View>
                <Text style={styles.optionPrice}>{formatPGK(opt.pricePGK)}</Text>
              </View>
              <TouchableOpacity testID={`use-quote-${opt.service}`} style={styles.useQuoteBtn} onPress={() => applyQuote(opt)}>
                <Text style={styles.useQuoteBtnText}>USE THIS QUOTE — SHIP NOW</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
              </TouchableOpacity>
            </View>
          ))}

          {result && (
            <View style={styles.metaCard}>
              <Text style={styles.metaText}>
                Chargeable weight: <Text style={{ fontWeight: '700', color: Colors.dhlText }}>{result.chargeableKg} kg</Text> · Volumetric: {result.volumetricKg} kg · Distance factor: {result.distanceFactor}×
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
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
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, marginTop: 10 },
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.dhlPanel, marginRight: 6 },
  chipActive: { backgroundColor: Colors.dhlYellow },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.dhlMuted },
  chipTextActive: { color: Colors.dhlInk },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  weightBtn: { width: 36, height: 36, backgroundColor: Colors.dhlInk, justifyContent: 'center', alignItems: 'center' },
  weightBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  weightBar: { flex: 1, height: 8, backgroundColor: Colors.dhlBorder, borderRadius: 4 },
  weightFill: { height: 8, backgroundColor: Colors.dhlYellow, borderRadius: 4 },
  dimRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  resultsBanner: { marginHorizontal: 16, marginTop: 16 },
  resultsBannerInner: {
    backgroundColor: Colors.dhlInk, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  resultsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlYellow },
  resultsRoute: { fontSize: 18, fontWeight: '900', color: Colors.white, marginTop: 4 },
  optionCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16,
  },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  optionName: { fontSize: 16, fontWeight: '700', color: Colors.dhlText },
  optionDesc: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  optionTransit: { fontSize: 11, fontWeight: '700', color: Colors.dhlRed, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  optionPrice: { fontSize: 22, fontWeight: '900', color: Colors.dhlText },
  useQuoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk,
  },
  useQuoteBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  metaCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.dhlPanel, padding: 12 },
  metaText: { fontSize: 12, color: Colors.dhlMuted },
});

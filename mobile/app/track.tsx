import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import StatusBadge from '../src/components/StatusBadge';
import api from '../src/lib/api';
import { formatDateTime, STATUS_PROGRESS } from '../src/lib/shipmentUtils';

export default function Track() {
  const router = useRouter();
  const { awb: awbParam } = useLocalSearchParams<{ awb?: string }>();
  const [input, setInput] = useState(awbParam || '');
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ kind: string; awb?: string } | null>(null);

  useEffect(() => {
    if (awbParam) fetchShipment(awbParam);
  }, [awbParam]);

  const fetchShipment = async (awb: string) => {
    setLoading(true); setError(null); setShipment(null);
    try {
      const res = await api.get(`/track/${encodeURIComponent(awb.trim().toUpperCase())}`);
      setShipment(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError({ kind: 'notfound', awb: awb.trim().toUpperCase() });
      } else {
        // Network / 5xx → inline banner below shows retry; no native alert needed.
        setError({ kind: 'network' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) { Alert.alert('Error', 'Please enter an AWB number'); return; }
    fetchShipment(trimmed.toUpperCase());
  };

  const progress = shipment ? (STATUS_PROGRESS[shipment.status] || 0) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
            </TouchableOpacity>
            <View style={styles.logoPill}>
              <Text style={styles.logoText}>DHL</Text>
              <Text style={styles.logoAccent}> Forwarding</Text>
            </View>
            <View style={{ width: 20 }} />
          </View>

          {/* Search */}
          <View style={styles.searchSection}>
            <Text style={styles.label}>TRACKING</Text>
            <Text testID="track-headline" style={styles.title}>Track Your Shipment</Text>
            <Text style={styles.subtitle}>Enter your AWB number to see real-time status and milestones.</Text>

            <View testID="track-form" style={styles.searchBox}>
              <TextInput
                testID="track-input"
                style={styles.searchInput}
                placeholder="e.g. DHL1234567890"
                placeholderTextColor={Colors.dhlMuted}
                value={input}
                onChangeText={setInput}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity testID="track-submit" style={styles.searchBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.dhlInk} size="small" /> : (
                  <View style={styles.searchBtnRow}>
                    <Text style={styles.searchBtnText}>TRACK</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity testID="demo-awb-button" onPress={() => { setInput('DHL1234567890'); fetchShipment('DHL1234567890'); }}>
              <Text style={styles.demoAwb}>Try demo: <Text style={styles.demoAwbCode}>DHL1234567890</Text></Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          <View style={styles.resultSection}>
            {loading && (
              <View testID="track-loading" style={styles.center}>
                <ActivityIndicator size="large" color={Colors.dhlYellow} />
                <Text style={styles.loadingText}>Looking up your shipment…</Text>
              </View>
            )}

            {!loading && error?.kind === 'notfound' && (
              <View testID="track-notfound" style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
                <Text style={styles.emptyTitle}>No shipment found</Text>
                <Text style={styles.emptyText}>
                  We couldn't find AWB <Text style={{ fontWeight: '700', fontFamily: 'monospace' }}>{error.awb}</Text>. Please check and try again.
                </Text>
                <TouchableOpacity testID="track-retry" style={styles.retryBtn} onPress={() => { setError(null); setInput(''); }}>
                  <Text style={styles.retryBtnText}>TRY ANOTHER AWB</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && shipment && (
              <View style={styles.resultCard}>
                {/* Status Banner */}
                <View style={styles.statusBanner}>
                  <StatusBadge status={shipment.status} />
                  <Text style={styles.awbText}>{shipment.awb}</Text>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeCode}>{shipment.origin?.code}</Text>
                    <Text style={styles.routeCity}>{shipment.origin?.city}</Text>
                  </View>
                  <View style={styles.routeLine}>
                    <View style={styles.routeLineBg} />
                    <View style={[styles.routeLineProgress, { width: `${progress}%` }]} />
                    <Ionicons name="airplane" size={16} color={Colors.dhlRed} style={styles.planeIcon} />
                  </View>
                  <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                    <Text style={styles.routeCode}>{shipment.destination?.code}</Text>
                    <Text style={styles.routeCity}>{shipment.destination?.city}</Text>
                  </View>
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                  <Text style={styles.timelineTitle}>SHIPMENT TIMELINE</Text>
                  {(() => {
                    const events: any[] = Array.isArray(shipment.events) ? shipment.events : [];
                    if (events.length === 0) {
                      return (
                        <View testID="timeline-empty" style={styles.timelineEmpty}>
                          <Ionicons name="time-outline" size={28} color={Colors.dhlMuted} />
                          <Text style={styles.timelineEmptyText}>No tracking events yet</Text>
                        </View>
                      );
                    }
                    // Sort DESC by timestamp → most recent at top (web parity).
                    const sorted = [...events].sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    );
                    return sorted.map((ev: any, i: number) => {
                      const isLatest = i === 0;
                      return (
                        <View testID={`timeline-event-${i}`} key={`${ev.timestamp}-${i}`} style={styles.timelineItem}>
                          <View style={styles.timelineDotCol}>
                            <View style={[styles.timelineDot, isLatest && styles.timelineDotActive]} />
                            {i < sorted.length - 1 && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineHeadRow}>
                              <Text style={[styles.timelineEvent, isLatest && styles.timelineEventLatest]} numberOfLines={2}>
                                {ev.description}
                              </Text>
                              {ev.code ? <Text style={styles.timelineCode}>{ev.code}</Text> : null}
                              {isLatest && <Text style={styles.timelineLatestTag}>LATEST</Text>}
                            </View>
                            <View style={styles.timelineMetaRow}>
                              <Ionicons name="time-outline" size={11} color={Colors.dhlMuted} />
                              <Text style={styles.timelineDate}>{formatDateTime(ev.timestamp)}</Text>
                              <Ionicons name="location-outline" size={11} color={Colors.dhlMuted} style={{ marginLeft: 6 }} />
                              <Text style={styles.timelineDate}>{ev.location}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            )}

            {!loading && error?.kind === 'network' && (
              <View testID="track-network-error" style={styles.errorBanner}>
                <Ionicons name="cloud-offline-outline" size={20} color={Colors.dhlRed} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.errorBannerTitle}>Could not reach the tracking service</Text>
                  <Text style={styles.errorBannerText}>Check your connection and try again.</Text>
                </View>
                <TouchableOpacity testID="track-network-retry" onPress={() => input.trim() && fetchShipment(input.trim().toUpperCase())}>
                  <Text style={styles.errorBannerRetry}>RETRY</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !shipment && !error && (
              <View style={styles.center}>
                <Ionicons name="search" size={40} color={Colors.dhlBorder} />
                <Text style={styles.loadingText}>Enter an AWB above to see tracking.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { padding: 4 },
  logoPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  logoText: { fontSize: 13, fontWeight: '900', color: Colors.dhlInk },
  logoAccent: { fontSize: 13, fontWeight: '900', color: Colors.dhlRed },
  searchSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.dhlMuted, lineHeight: 22, marginBottom: 20 },
  searchBox: {
    borderWidth: 2, borderColor: Colors.dhlInk, padding: 4,
    shadowColor: Colors.dhlYellow, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
    elevation: 4,
  },
  searchInput: { height: 48, paddingHorizontal: 16, fontSize: 16, fontFamily: 'monospace', color: Colors.dhlText },
  searchBtn: {
    height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
  },
  searchBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchBtnText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  demoAwb: { fontSize: 12, color: Colors.dhlMuted, marginTop: 12 },
  demoAwbCode: { fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlRed },
  resultSection: { flex: 1, backgroundColor: Colors.dhlPanel, padding: 20 },
  center: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 13, color: Colors.dhlMuted, marginTop: 12 },
  emptyCard: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 32, alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk,
  },
  retryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  resultCard: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  awbText: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  routeRow: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
  },
  routePoint: { width: 60 },
  routeCode: { fontSize: 16, fontWeight: '900', fontFamily: 'monospace', color: Colors.dhlText },
  routeCity: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },
  routeLine: { flex: 1, height: 4, marginHorizontal: 12, position: 'relative', justifyContent: 'center' },
  routeLineBg: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: Colors.dhlBorder, borderRadius: 2 },
  routeLineProgress: { position: 'absolute', left: 0, height: 4, backgroundColor: Colors.dhlYellow, borderRadius: 2 },
  planeIcon: { position: 'absolute', alignSelf: 'center' },
  timeline: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  timelineTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 12 },
  timelineItem: { flexDirection: 'row', minHeight: 48 },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.dhlBorder, marginTop: 4 },
  timelineDotActive: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.dhlBorder, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineHeadRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  timelineEvent: { flexShrink: 1, fontSize: 13, color: Colors.dhlMuted },
  timelineEventLatest: { color: Colors.dhlText, fontWeight: '700' },
  timelineCode: {
    fontSize: 9, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1,
    color: Colors.dhlMuted, backgroundColor: Colors.dhlPanel,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  timelineLatestTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Colors.dhlRed },
  timelineMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 },
  timelineDate: { fontSize: 11, color: Colors.dhlMuted, marginLeft: 2 },
  timelineEmpty: { alignItems: 'center', paddingVertical: 24 },
  timelineEmptyText: { fontSize: 13, color: Colors.dhlMuted, marginTop: 8 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginTop: 16,
    backgroundColor: Colors.red100, borderLeftWidth: 4, borderLeftColor: Colors.dhlRed,
  },
  errorBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.dhlText },
  errorBannerText: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
  errorBannerRetry: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: Colors.dhlRed, paddingHorizontal: 8 },
});

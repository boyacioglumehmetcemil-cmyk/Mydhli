/**
 * Track tab — internal (auth-gated) tracking surface mirrors the web
 * /dashboard/track page. Uses the public /api/track/{ref} endpoint but lives
 * inside the (tabs) auth wrapper so the tab bar stays visible.
 *
 * Migrated from /app/mobile/app/track.tsx (now removed) so the route key matches
 * the bottom tab. ?awb= query param is still honoured for deep links.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import StatusBadge from '../../src/components/StatusBadge';
import api from '../../src/lib/api';
import {
  formatDateTime, STATUS_PROGRESS, getPickupBadge, formatRouteCodes,
} from '../../src/lib/shipmentUtils';
import type { Shipment } from '../../src/types/shipment';

export default function TrackTab() {
  const { awb: awbParam } = useLocalSearchParams<{ awb?: string }>();
  const [input, setInput] = useState(awbParam || '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ kind: string; awb?: string } | null>(null);

  const fetchShipment = useCallback(async (awb: string) => {
    setLoading(true);
    setError(null);
    setShipment(null);
    try {
      const res = await api.get(`/track/${encodeURIComponent(awb.trim().toUpperCase())}`);
      setShipment(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setError({ kind: 'notfound', awb: awb.trim().toUpperCase() });
      else setError({ kind: 'network' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (awbParam) fetchShipment(awbParam);
  }, [awbParam, fetchShipment]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    fetchShipment(trimmed.toUpperCase());
  };

  const progress = shipment ? (STATUS_PROGRESS[shipment.status] || 0) : 0;
  const pickup = getPickupBadge(shipment);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={styles.searchSection}>
            <Text style={styles.label}>TRACK SHIPMENT</Text>
            <Text testID="track-headline" style={styles.title}>Find any shipment</Text>
            <Text style={styles.subtitle}>
              Enter an AWB or House Bill number to see live route, milestones and pickup status.
            </Text>

            <View testID="track-form" style={styles.searchBox}>
              <TextInput
                testID="track-input"
                style={styles.searchInput}
                placeholder="e.g. DHL-SWB-029"
                placeholderTextColor={Colors.dhlMuted}
                value={input}
                onChangeText={setInput}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                testID="track-submit"
                style={styles.searchBtn}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.dhlInk} size="small" />
                ) : (
                  <View style={styles.searchBtnRow}>
                    <Text style={styles.searchBtnText}>TRACK</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.dhlInk} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="demo-awb-button"
              onPress={() => {
                setInput('DHL-SWB-029');
                fetchShipment('DHL-SWB-029');
              }}
            >
              <Text style={styles.demoAwb}>
                Try a demo: <Text style={styles.demoAwbCode}>DHL-SWB-029</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultSection}>
            {loading && (
              <View testID="track-loading" style={styles.center}>
                <ActivityIndicator size="large" color={Colors.dhlYellow} />
                <Text style={styles.loadingText}>Looking up shipment…</Text>
              </View>
            )}

            {!loading && error?.kind === 'notfound' && (
              <View testID="track-notfound" style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
                <Text style={styles.emptyTitle}>No shipment found</Text>
                <Text style={styles.emptyText}>
                  We couldn&apos;t find{' '}
                  <Text style={{ fontWeight: '700', fontFamily: 'monospace' }}>{error.awb}</Text>.
                  Please check the reference and try again.
                </Text>
                <TouchableOpacity
                  testID="track-retry"
                  style={styles.retryBtn}
                  onPress={() => { setError(null); setInput(''); }}
                >
                  <Text style={styles.retryBtnText}>TRY ANOTHER REFERENCE</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && shipment && (
              <View style={styles.resultCard}>
                <View style={styles.statusBanner}>
                  <StatusBadge status={shipment.status} />
                  <Text style={styles.awbText}>{shipment.awb}</Text>
                </View>

                {pickup && (
                  <View
                    testID="track-pickup-badge"
                    style={[
                      styles.pickupBanner,
                      { backgroundColor: pickup.bg, borderColor: pickup.border },
                    ]}
                  >
                    <Ionicons
                      name={pickup.overdue ? 'alert-circle' : 'time-outline'}
                      size={18}
                      color={pickup.fg}
                    />
                    <Text style={[styles.pickupText, { color: pickup.fg }]}>
                      {pickup.longText}
                    </Text>
                  </View>
                )}

                <View style={styles.routeRow}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeCode}>{shipment.origin?.code}</Text>
                    <Text style={styles.routeCity}>{shipment.origin?.city}</Text>
                  </View>
                  <View style={styles.routeLine}>
                    <View style={styles.routeLineBg} />
                    <View style={[styles.routeLineProgress, { width: `${progress}%` }]} />
                    <Ionicons
                      name={shipment.mode === 'AIR' ? 'airplane' : shipment.mode === 'ROAD' ? 'car' : 'boat'}
                      size={16}
                      color={Colors.dhlRed}
                      style={styles.modeIcon}
                    />
                  </View>
                  <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                    <Text style={styles.routeCode}>{shipment.destination?.code}</Text>
                    <Text style={styles.routeCity}>{shipment.destination?.city}</Text>
                  </View>
                </View>
                <Text style={styles.routeSummary}>{formatRouteCodes(shipment)}</Text>

                <View style={styles.timeline}>
                  <Text style={styles.timelineTitle}>SHIPMENT TIMELINE</Text>
                  {(() => {
                    const events = Array.isArray(shipment.events) ? shipment.events : [];
                    if (events.length === 0) {
                      return (
                        <View testID="timeline-empty" style={styles.timelineEmpty}>
                          <Ionicons name="time-outline" size={28} color={Colors.dhlMuted} />
                          <Text style={styles.timelineEmptyText}>No tracking events yet</Text>
                        </View>
                      );
                    }
                    const sorted = [...events].sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    );
                    return sorted.map((ev, i) => {
                      const isLatest = i === 0;
                      return (
                        <View testID={`timeline-event-${i}`} key={`${ev.timestamp}-${i}`} style={styles.timelineItem}>
                          <View style={styles.timelineDotCol}>
                            <View style={[styles.timelineDot, isLatest && styles.timelineDotActive]} />
                            {i < sorted.length - 1 && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineHeadRow}>
                              <Text
                                style={[styles.timelineEvent, isLatest && styles.timelineEventLatest]}
                                numberOfLines={2}
                              >
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
                  <Text style={styles.errorBannerTitle}>Could not reach tracking service</Text>
                  <Text style={styles.errorBannerText}>Check your connection and try again.</Text>
                </View>
                <TouchableOpacity
                  testID="track-network-retry"
                  onPress={() => input.trim() && fetchShipment(input.trim().toUpperCase())}
                >
                  <Text style={styles.errorBannerRetry}>RETRY</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !shipment && !error && (
              <View style={styles.center}>
                <Ionicons name="search" size={40} color={Colors.dhlBorder} />
                <Text style={styles.loadingText}>Enter a reference above to track.</Text>
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
  searchBtn: { height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center' },
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
  resultCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  awbText: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  pickupBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  pickupText: { flex: 1, fontSize: 12, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  routePoint: { width: 60 },
  routeCode: { fontSize: 16, fontWeight: '900', fontFamily: 'monospace', color: Colors.dhlText },
  routeCity: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },
  routeLine: { flex: 1, height: 4, marginHorizontal: 12, position: 'relative', justifyContent: 'center' },
  routeLineBg: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: Colors.dhlBorder, borderRadius: 2 },
  routeLineProgress: { position: 'absolute', left: 0, height: 4, backgroundColor: Colors.dhlYellow, borderRadius: 2 },
  modeIcon: { position: 'absolute', alignSelf: 'center' },
  routeSummary: {
    textAlign: 'center', fontSize: 11, color: Colors.dhlMuted, marginBottom: 4,
    fontFamily: 'monospace', letterSpacing: 1,
  },
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

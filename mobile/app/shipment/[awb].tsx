import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import StatusBadge from '../../src/components/StatusBadge';
import api from '../../src/lib/api';
import { formatDateTime, formatPGK, SERVICE_LABELS, STATUS_PROGRESS } from '../../src/lib/shipmentUtils';

export default function ShipmentDetail() {
  const { awb } = useLocalSearchParams<{ awb: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!awb) return;
    setLoading(true); setNotFound(false);
    api.get(`/shipments/${encodeURIComponent(awb)}`)
      .then(res => setShipment(res.data))
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true);
        else Alert.alert('Error', 'Unable to load shipment');
      })
      .finally(() => setLoading(false));
  }, [awb]);

  const progress = shipment ? (STATUS_PROGRESS[shipment.status] || 0) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="shipment-back-link" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerAwb}>{awb}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading && (
          <View testID="shipment-detail-loading" style={styles.center}>
            <ActivityIndicator size="large" color={Colors.dhlYellow} />
            <Text style={styles.loadingText}>Loading shipment…</Text>
          </View>
        )}

        {!loading && notFound && (
          <View testID="shipment-detail-notfound" style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>Shipment not found</Text>
            <Text style={styles.emptyText}>AWB {awb} was not found in your account.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>BACK TO SHIPMENTS</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && shipment && (
          <View testID="shipment-detail-page">
            {/* Status Banner */}
            <View style={styles.statusBanner}>
              <StatusBadge status={shipment.status} />
              <Text style={styles.serviceTag}>{SERVICE_LABELS[shipment.service] || shipment.service}</Text>
            </View>

            {/* Route Visual */}
            <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View>
                  <Text style={styles.routeCode}>{shipment.origin?.code}</Text>
                  <Text style={styles.routeCity}>{shipment.origin?.city}</Text>
                </View>
                <View style={styles.routeLine}>
                  <View style={styles.routeLineBg} />
                  <View style={[styles.routeLineProgress, { width: `${progress}%` }]} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.routeCode}>{shipment.destination?.code}</Text>
                  <Text style={styles.routeCity}>{shipment.destination?.city}</Text>
                </View>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>SHIPMENT DETAILS</Text>
              <DetailRow label="AWB" value={shipment.awb} />
              <DetailRow label="Sender" value={`${shipment.senderName || '—'} · ${shipment.senderCity || ''}`} />
              <DetailRow label="Receiver" value={`${shipment.receiverName || '—'} · ${shipment.receiverCity || ''}`} />
              <DetailRow label="Pieces" value={`${shipment.packages?.[0]?.pieces || '—'}`} />
              <DetailRow label="Weight" value={`${shipment.packages?.[0]?.weightKg || '—'} kg`} />
              <DetailRow label="Cost" value={formatPGK(shipment.costPGK)} highlight />
            </View>

            {/* Timeline */}
            {shipment.timeline?.length > 0 && (
              <View style={styles.timelineCard}>
                <Text style={styles.detailSectionTitle}>SHIPMENT TIMELINE</Text>
                {shipment.timeline.map((ev: any, i: number) => (
                  <View key={i} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View style={[styles.timelineDot, i === 0 && styles.timelineDotActive]} />
                      {i < shipment.timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineEvent, i === 0 && { color: Colors.dhlText, fontWeight: '700' }]}>{ev.description}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(ev.timestamp)} · {ev.location}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <View style={dStyles.row}>
    <Text style={dStyles.label}>{label}</Text>
    <Text style={[dStyles.value, highlight && { color: Colors.dhlRed, fontWeight: '700' }]}>{value}</Text>
  </View>
);

const dStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlMuted, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '600', color: Colors.dhlText, maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  headerAwb: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { fontSize: 13, color: Colors.dhlMuted, marginTop: 12 },
  emptyCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  statusBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 12,
  },
  serviceTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlMuted, backgroundColor: Colors.dhlPanel, paddingHorizontal: 10, paddingVertical: 4, textTransform: 'uppercase' },
  routeCard: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 20, marginBottom: 12,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeCode: { fontSize: 18, fontWeight: '900', fontFamily: 'monospace', color: Colors.dhlText },
  routeCity: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
  routeLine: { flex: 1, height: 4, marginHorizontal: 16, position: 'relative' },
  routeLineBg: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: Colors.dhlBorder, borderRadius: 2 },
  routeLineProgress: { position: 'absolute', left: 0, height: 4, backgroundColor: Colors.dhlYellow, borderRadius: 2 },
  detailCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 12 },
  detailSectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 8 },
  timelineCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16 },
  timelineItem: { flexDirection: 'row', minHeight: 48 },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.dhlBorder, marginTop: 4 },
  timelineDotActive: { backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.dhlBorder, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineEvent: { fontSize: 13, color: Colors.dhlMuted },
  timelineDate: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
});

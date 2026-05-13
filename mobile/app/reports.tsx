import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';
import { formatPGK, SERVICE_LABELS } from '../src/lib/shipmentUtils';

const BAR_COLORS = [Colors.dhlYellow, Colors.dhlRed, Colors.dhlInk, Colors.dhlMuted, '#FFE066'];

export default function Reports() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/overview').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="reports-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const maxSpend = Math.max(...data.monthlySpend.map((m: any) => m.totalPGK), 1);
  const maxStatus = Math.max(...data.shipmentsByStatus.map((s: any) => s.count), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="reports-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="reports-pdf" style={styles.pdfBtn} onPress={() => Alert.alert('PDF', 'Reports PDF exported')}>
          <Ionicons name="download-outline" size={14} color={Colors.white} />
          <Text style={styles.pdfBtnText}>EXPORT PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View testID="reports-page" style={styles.titleSection}>
          <Text style={styles.pageTitle}>Reports</Text>
          <Text style={styles.pageSub}>Your account analytics across spend, services, and destinations.</Text>
        </View>

        {/* Monthly Spend Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>LAST 6 MONTHS · PGK</Text>
          <Text style={styles.chartTitle}>Monthly Spend</Text>
          {data.monthlySpend.map((m: any, i: number) => (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barLabel}>{m.month}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(m.totalPGK / maxSpend) * 100}%`, backgroundColor: Colors.dhlYellow }]} />
              </View>
              <Text style={styles.barValue}>{formatPGK(m.totalPGK)}</Text>
            </View>
          ))}
        </View>

        {/* Shipments by Service */}
        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>DISTRIBUTION</Text>
          <Text style={styles.chartTitle}>Shipments by Service</Text>
          {data.shipmentsByService.map((s: any, i: number) => (
            <View key={i} style={styles.serviceRow}>
              <View style={[styles.serviceDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
              <Text style={styles.serviceLabel}>{SERVICE_LABELS[s.service] || s.service}</Text>
              <Text style={styles.serviceCount}>{s.count}</Text>
            </View>
          ))}
        </View>

        {/* Shipments by Status */}
        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>CURRENT PIPELINE</Text>
          <Text style={styles.chartTitle}>Shipments by Status</Text>
          {data.shipmentsByStatus.map((s: any, i: number) => (
            <View key={i} style={styles.barRow}>
              <Text style={[styles.barLabel, { width: 110 }]}>{s.status}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(s.count / maxStatus) * 100}%`, backgroundColor: Colors.dhlRed }]} />
              </View>
              <Text style={styles.barValue}>{s.count}</Text>
            </View>
          ))}
        </View>

        {/* Top Destinations */}
        <View testID="reports-top-destinations" style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>TOP DESTINATIONS</Text>
          <Text style={styles.chartTitle}>Where you ship most</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>City</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Country</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Count</Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Spend</Text>
          </View>
          {data.topDestinations.map((d: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>{d.city}</Text>
              <Text style={[styles.tableCell, { flex: 2, color: Colors.dhlMuted }]}>{d.country}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontFamily: 'monospace' }]}>{d.count}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }]}>{formatPGK(d.totalPGK)}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.dhlInk, paddingHorizontal: 14, paddingVertical: 8,
  },
  pdfBtnText: { fontSize: 11, fontWeight: '800', color: Colors.white, letterSpacing: 1.5 },
  scroll: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  chartCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16 },
  chartSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 4 },
  chartTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText, marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 60, fontSize: 11, color: Colors.dhlMuted },
  barTrack: { flex: 1, height: 16, backgroundColor: Colors.dhlPanel, marginHorizontal: 8, borderRadius: 2 },
  barFill: { height: 16, borderRadius: 2 },
  barValue: { width: 70, fontSize: 11, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText, textAlign: 'right' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  serviceDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  serviceLabel: { flex: 1, fontSize: 13, color: Colors.dhlText },
  serviceCount: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  tableHeaderText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Colors.dhlMuted, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  tableCell: { fontSize: 13, color: Colors.dhlText },
});

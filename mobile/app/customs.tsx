/**
 * Customs documents — Phase 5.
 *
 * Data:
 *   GET  /api/customs                  → list of CustomsDocOut
 *   GET  /api/customs/{id}/pdf         → binary PDF (Linking.openURL for native save)
 *   POST /api/customs                  → create (handled by previous form; kept as overflow)
 *
 * NO doc-creation pipeline added — the existing minimal form was already in
 * place from Phase 1; this rewrite focuses on the LIST view + PDF preview
 * tap. "SAVE & SUBMIT" copy preserved (Phase 3.1 rename).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Linking, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';
import { formatDate, formatUSD } from '../src/lib/shipmentUtils';

interface CustomsItem {
  id: string;
  shipmentAwb?: string;
  docType?: string;
  exporter?: { name?: string; company?: string; city?: string; country?: string };
  importer?: { name?: string; company?: string; city?: string; country?: string };
  items?: Array<{ description?: string; hsCode?: string; quantity?: number; unitValue?: number }>;
  currency?: string;
  totalValueUSD?: number;
  signedBy?: string;
  signatureDate?: string;
  createdAt?: string;
}

const DOC_LABELS: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  EXPORT_DECLARATION: 'Export Declaration',
};

const statusLabel = (it: CustomsItem) => {
  if (it.signatureDate) return 'CLEARED';
  return 'PENDING';
};

const STATUS_TONE: Record<string, { bg: string; text: string; dot: string }> = {
  CLEARED: { bg: Colors.green100, text: Colors.green900, dot: Colors.green600 },
  PENDING: { bg: '#FFFBEB', text: '#78350F', dot: '#F59E0B' },
};

export default function CustomsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CustomsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const r = await api.get('/customs');
      const list = Array.isArray(r.data) ? r.data : (r.data?.items || []);
      setItems(list as CustomsItem[]);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const previewPdf = (id: string) => {
    const base = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
    Linking.openURL(`${base}/api/customs/${encodeURIComponent(id)}/pdf`).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity testID="customs-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>CUSTOMS</Text>
        <Text style={styles.title}>Declarations & permits</Text>
        <Text style={styles.subtitle}>
          Commercial invoices, packing lists and export declarations filed for your shipments.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
      ) : items.length === 0 ? (
        <View testID="customs-empty" style={styles.center}>
          <Ionicons name="document-attach-outline" size={42} color={Colors.dhlMuted} />
          <Text style={styles.emptyTitle}>No customs documents on file</Text>
          <Text style={styles.emptyText}>
            Customs declarations submitted at booking time will appear here, with a clearance status badge once processed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
          ListHeaderComponent={
            <Text testID="customs-count" style={styles.countText}>
              <Text style={styles.countNum}>{items.length}</Text> declaration{items.length === 1 ? '' : 's'}
            </Text>
          }
          renderItem={({ item }) => {
            const status = statusLabel(item);
            const tone = STATUS_TONE[status];
            return (
              <View testID={`customs-row-${item.id}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardType}>{DOC_LABELS[item.docType || ''] || item.docType || 'Customs document'}</Text>
                    {item.shipmentAwb ? (
                      <Text style={styles.cardAwb}>{item.shipmentAwb}</Text>
                    ) : null}
                  </View>
                  <View
                    testID={`customs-status-pill-${item.id}`}
                    style={[styles.statusPill, { backgroundColor: tone.bg }]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
                    <Text style={[styles.statusText, { color: tone.text }]}>{status}</Text>
                  </View>
                </View>

                <View style={styles.partiesRow}>
                  <View style={styles.partyCol}>
                    <Text style={styles.partyLabel}>EXPORTER</Text>
                    <Text style={styles.partyName} numberOfLines={1}>
                      {item.exporter?.company || item.exporter?.name || '—'}
                    </Text>
                    <Text style={styles.partyCity} numberOfLines={1}>
                      {[item.exporter?.city, item.exporter?.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={12} color={Colors.dhlMuted} />
                  <View style={[styles.partyCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.partyLabel}>IMPORTER</Text>
                    <Text style={[styles.partyName, { textAlign: 'right' }]} numberOfLines={1}>
                      {item.importer?.company || item.importer?.name || '—'}
                    </Text>
                    <Text style={[styles.partyCity, { textAlign: 'right' }]} numberOfLines={1}>
                      {[item.importer?.city, item.importer?.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLbl}>Items</Text>
                    <Text style={styles.metaVal}>{item.items?.length ?? 0}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLbl}>Value</Text>
                    <Text style={styles.metaVal}>{item.totalValueUSD ? formatUSD(item.totalValueUSD) : '—'}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLbl}>Signed</Text>
                    <Text style={styles.metaVal}>{formatDate(item.signatureDate || item.createdAt)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  testID={`customs-preview-${item.id}`}
                  onPress={() => previewPdf(item.id)}
                  style={styles.previewBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={Platform.OS === 'web' ? 'open-outline' : 'document-outline'}
                    size={14}
                    color={Colors.dhlInk}
                  />
                  <Text style={styles.previewBtnText}>OPEN PDF</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  topbar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.dhlMuted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: Colors.dhlText, marginTop: 12 },
  emptyText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 6, textAlign: 'center', maxWidth: 320, lineHeight: 18 },
  list: { paddingHorizontal: 12, paddingBottom: 32 },
  countText: { fontSize: 11, color: Colors.dhlMuted, paddingBottom: 8, paddingHorizontal: 4, paddingTop: 12 },
  countNum: { fontWeight: '900', color: Colors.dhlText },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 12, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  cardType: { fontSize: 13, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.2 },
  cardAwb: { fontSize: 10, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlRed, marginTop: 3, letterSpacing: 0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  partiesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.dhlBorder },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: Colors.dhlMuted },
  partyName: { fontSize: 12, fontWeight: '700', color: Colors.dhlText, marginTop: 2 },
  partyCity: { fontSize: 10, color: Colors.dhlMuted, marginTop: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  metaCol: { alignItems: 'center', flex: 1 },
  metaLbl: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: Colors.dhlMuted },
  metaVal: { fontSize: 11, fontWeight: '800', color: Colors.dhlText, marginTop: 2 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk, paddingVertical: 9 },
  previewBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

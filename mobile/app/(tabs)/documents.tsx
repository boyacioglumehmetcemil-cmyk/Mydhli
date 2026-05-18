/**
 * Documents tab — Global document library (Phase 3 live data).
 *
 * Data: GET /api/documents?page_size=500 — the seed has exactly 482 PDFs so
 * a single page covers the whole account. Backend reports `total` so the
 * header headline stays truthful even if pagination is added later.
 *
 * Type filter chips are derived from the live response (the seed currently
 * yields 10 distinct types: COMMERCIAL_INVOICE, PACKING_LIST, HBL,
 * BOOKING_CONFIRMATION, DHL_SHIPPING_FORM, CUSTOMS_DECLARATION,
 * ARRIVAL_NOTICE, PROOF_OF_DELIVERY, WAREHOUSE_RECEIPT, PENDING_ACTION_NOTE).
 *
 * NO doc-creation affordances anywhere
 * — Phase 8.4c forbids them. The only action on this screen is OPEN-PREVIEW.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';
import { formatDate } from '../../src/lib/shipmentUtils';

interface DocItem {
  document_id: string;
  shipment_ref?: string;
  document_type?: string;
  file_name: string;
  file_size_bytes?: number;
  page_count?: number;
  status?: string;
  uploaded_at?: string;
}

// Pretty labels for the type union returned by the backend seed.
const TYPE_LABELS: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  HBL: 'House B/L',
  MBL: 'Master B/L',
  BOOKING_CONFIRMATION: 'Booking Confirmation',
  DHL_SHIPPING_FORM: 'DHL Shipping Form',
  CUSTOMS_DECLARATION: 'Customs Declaration',
  ARRIVAL_NOTICE: 'Arrival Notice',
  PROOF_OF_DELIVERY: 'Proof of Delivery',
  WAREHOUSE_RECEIPT: 'Warehouse Receipt',
  PENDING_ACTION_NOTE: 'Pending Action',
  CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
  IMPORT_EXPORT_PERMIT: 'Permit',
  DELIVERY_ORDER: 'Delivery Order',
  PRE_ALERT: 'Pre-Alert',
  PROFORMA_INVOICE: 'Proforma Invoice',
  CMR: 'CMR',
  HAWB: 'HAWB',
  MAWB: 'MAWB',
};

function prettyType(t?: string): string {
  if (!t) return 'Document';
  return TYPE_LABELS[t] || t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettySize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab() {
  const router = useRouter();
  const [items, setItems] = useState<DocItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchItems = useCallback(async () => {
    try {
      // 500 covers the whole demo seed (482 PDFs) in one call.
      const res = await api.get('/documents', { params: { page_size: 500 } });
      const list = (res.data?.items || []) as DocItem[];
      const t = typeof res.data?.total === 'number' ? res.data.total : list.length;
      setItems(list);
      setTotal(t);
    } catch {
      setItems([]);
      setTotal(0);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems().finally(() => setLoading(false));
  }, [fetchItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  // Dynamic type chips (sorted DESC by count).
  const typeChips = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) => {
      const k = it.document_type || 'OTHER';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count, label: prettyType(key) }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== 'ALL' && it.document_type !== typeFilter) return false;
      if (!q) return true;
      const hay = [it.file_name, it.shipment_ref, prettyType(it.document_type)]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, typeFilter, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DOCUMENT LIBRARY</Text>
        <Text style={styles.title}>Operational paperwork</Text>
        <Text testID="documents-headline-count" style={styles.subtitle}>
          <Text style={styles.subtitleNum}>{total.toLocaleString()}</Text>{' '}PDFs indexed across your account
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.dhlMuted} />
        <TextInput
          testID="documents-search-input"
          style={styles.searchInput}
          placeholder="Search file name, AWB or type…"
          placeholderTextColor={Colors.dhlMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} testID="documents-search-clear">
            <Ionicons name="close-circle" size={16} color={Colors.dhlMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <FilterChip
          label="All"
          count={items.length}
          active={typeFilter === 'ALL'}
          onPress={() => setTypeFilter('ALL')}
          testID="documents-type-all"
        />
        {typeChips.map((c) => (
          <FilterChip
            key={c.key}
            label={c.label}
            count={c.count}
            active={typeFilter === c.key}
            onPress={() => setTypeFilter(c.key)}
            testID={`documents-type-${c.key.toLowerCase()}`}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View testID="documents-loading" style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dhlYellow} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
        >
          <View testID="documents-empty">
            <Ionicons name="document-text-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>
              {search ? 'No matches for your search' : 'No documents in this type yet'}
            </Text>
            {(search || typeFilter !== 'ALL') && (
              <TouchableOpacity
                testID="documents-empty-reset"
                style={styles.resetBtn}
                onPress={() => { setSearch(''); setTypeFilter('ALL'); }}
              >
                <Text style={styles.resetBtnText}>RESET FILTERS</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.document_id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
          ListHeaderComponent={
            <Text testID="documents-count" style={styles.countText}>
              <Text style={styles.countNum}>{filtered.length}</Text> of{' '}
              <Text style={styles.countNum}>{total}</Text> document{filtered.length === 1 ? '' : 's'}
            </Text>
          }
          renderItem={({ item }) => (
            <DocRow
              item={item}
              onPress={() => router.push(`/document/${item.document_id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────────────────
const FilterChip = React.memo(function FilterChip({
  label, count, active, onPress, testID,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Doc row ───────────────────────────────────────────────────────────────────────────────
const DocRow = React.memo(function DocRow({
  item, onPress,
}: { item: DocItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      testID={`document-row-${item.document_id}`}
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="document-text" size={20} color={Colors.dhlRed} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{item.file_name}</Text>
        <View style={styles.cardMetaRow}>
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText} numberOfLines={1}>
              {prettyType(item.document_type)}
            </Text>
          </View>
          {item.shipment_ref ? (
            <Text style={styles.cardAwb}>{item.shipment_ref}</Text>
          ) : null}
        </View>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMetaTxt}>
            {item.uploaded_at ? formatDate(item.uploaded_at) : '—'}
          </Text>
          <Text style={styles.cardMetaSep}>·</Text>
          <Text style={styles.cardMetaTxt}>{prettySize(item.file_size_bytes)}</Text>
          {item.page_count ? (
            <>
              <Text style={styles.cardMetaSep}>·</Text>
              <Text style={styles.cardMetaTxt}>
                {item.page_count} page{item.page_count === 1 ? '' : 's'}
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="eye-outline" size={20} color={Colors.dhlMuted} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.dhlMuted, marginTop: 6 },
  subtitleNum: { fontWeight: '900', color: Colors.dhlText },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    marginHorizontal: 16, paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dhlText },

  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  chipActive: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlInk },
  chipLabel: { fontSize: 11, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 0.5 },
  chipLabelActive: { color: Colors.dhlInk },
  chipCount: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 5, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  chipCountActive: { backgroundColor: Colors.dhlInk },
  chipCountText: { fontSize: 10, fontWeight: '900', color: Colors.dhlText },
  chipCountTextActive: { color: Colors.dhlYellow },

  countText: { fontSize: 11, color: Colors.dhlMuted, paddingBottom: 8, paddingHorizontal: 4 },
  countNum: { fontWeight: '900', color: Colors.dhlText },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  center: { paddingVertical: 60, alignItems: 'center', flexGrow: 1 },
  loadingText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.dhlText, marginTop: 16, textAlign: 'center' },
  resetBtn: { marginTop: 18, height: 40, paddingHorizontal: 18, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dhlInk },
  resetBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 12, marginBottom: 8,
  },
  cardIcon: {
    width: 36, height: 36,
    backgroundColor: Colors.red100,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 13, fontWeight: '700', color: Colors.dhlText },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  typeChip: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 6, paddingVertical: 2 },
  typeChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: Colors.dhlText, textTransform: 'uppercase', maxWidth: 160 },
  cardAwb: { fontSize: 11, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlRed },
  cardMetaTxt: { fontSize: 10, color: Colors.dhlMuted },
  cardMetaSep: { fontSize: 10, color: Colors.dhlBorder },
});

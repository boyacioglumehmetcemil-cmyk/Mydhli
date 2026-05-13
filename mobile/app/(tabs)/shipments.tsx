import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import StatusBadge from '../../src/components/StatusBadge';
import api from '../../src/lib/api';
import { STATUS_LABELS, formatDate, formatPGK } from '../../src/lib/shipmentUtils';

const PAGE_SIZE = 20;

export default function Shipments() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query: any = { page, pageSize: PAGE_SIZE };
      if (search) query.search = search;
      if (statusFilter !== 'ALL') query.status = statusFilter;
      const res = await api.get('/shipments', { params: query });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onSearch = () => { setPage(1); fetchItems(); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Shipments</Text>
        <Text style={styles.subtitle}>Search, filter and view your shipments.</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={Colors.dhlMuted} />
          <TextInput
            testID="shipments-search-input"
            style={styles.searchInput}
            placeholder="Search AWB, receiver"
            placeholderTextColor={Colors.dhlMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['ALL', ...Object.keys(STATUS_LABELS)].map(s => (
            <TouchableOpacity
              key={s}
              testID={`shipments-filter-${s.toLowerCase()}`}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              onPress={() => { setStatusFilter(s); setPage(1); }}
            >
              <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text testID="shipments-count" style={styles.countText}>
          <Text style={{ fontWeight: '800', color: Colors.dhlText }}>{total}</Text> shipment{total === 1 ? '' : 's'}
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <View testID="shipments-loading" style={styles.center}>
            <ActivityIndicator size="large" color={Colors.dhlYellow} />
            <Text style={styles.loadingText}>Loading shipments…</Text>
          </View>
        ) : items.length === 0 ? (
          <View testID="shipments-empty" style={styles.center}>
            <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>No shipments match your filters</Text>
            <TouchableOpacity testID="shipments-empty-reset" style={styles.resetBtn} onPress={() => { setSearch(''); setStatusFilter('ALL'); setPage(1); }}>
              <Text style={styles.resetBtnText}>RESET FILTERS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map(s => (
              <TouchableOpacity
                key={s.awb}
                testID={`shipment-card-${s.awb}`}
                style={styles.card}
                onPress={() => router.push(`/shipment/${s.awb}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardAwb}>{s.awb}</Text>
                  <StatusBadge status={s.status} />
                </View>
                <Text style={styles.cardReceiver}>{s.receiverName}</Text>
                <View style={styles.cardRoute}>
                  <Text style={styles.cardRouteCode}>{s.origin?.code}</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.dhlRed} />
                  <Text style={styles.cardRouteCode}>{s.destination?.code}</Text>
                  <Text style={styles.cardCity}>{s.receiverCity}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{formatDate(s.createdAt)}</Text>
                  <Text style={styles.cardCost}>{formatPGK(s.costPGK)}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <View testID="shipments-pagination" style={styles.pagination}>
                <Text style={styles.pageText}>Page {page} of {totalPages}</Text>
                <View style={styles.pageButtons}>
                  <TouchableOpacity testID="shipments-page-prev" style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <Text style={styles.pageBtnText}>PREV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="shipments-page-next" style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <Text style={styles.pageBtnText}>NEXT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.dhlPanel },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  filterBar: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.dhlText },
  filterScroll: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.dhlPanel, marginRight: 6 },
  filterChipActive: { backgroundColor: Colors.dhlYellow },
  filterChipText: { fontSize: 10, fontWeight: '700', color: Colors.dhlMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipTextActive: { color: Colors.dhlInk },
  countText: { fontSize: 12, color: Colors.dhlMuted },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.dhlText, marginTop: 16, marginBottom: 16 },
  resetBtn: { height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk },
  resetBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardAwb: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  cardReceiver: { fontSize: 14, fontWeight: '600', color: Colors.dhlText, marginBottom: 4 },
  cardRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardRouteCode: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  cardCity: { marginLeft: 8, fontSize: 12, color: Colors.dhlMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12, color: Colors.dhlMuted },
  cardCost: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, backgroundColor: Colors.dhlPanel, marginTop: 8 },
  pageText: { fontSize: 12, color: Colors.dhlMuted },
  pageButtons: { flexDirection: 'row', gap: 8 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1 },
});

/**
 * Shipments tab — mirrors /dashboard/shipments on web.
 *
 * Phase 2 contract:
 *   • Loads up to 100 records in one shot from /api/shipments
 *   • 3 segmented filter chips: All · At Depot · Delivered (with counts)
 *   • Client-side text search across AWB, receiver, booking ref, vessel
 *   • Each row shows AWB, booking ref, route, receiver, mode·service,
 *     status pill, AT_DEPOT pickup badge, and ETA / Delivered date
 *   • Pull-to-refresh
 *   • Tap navigates to /shipment/[awb]
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';
import {
  formatDate, formatRouteCodes, getPickupBadge, getStatusColor, getStatusLabel,
  freightServiceFor,
} from '../../src/lib/shipmentUtils';
import type { ShipmentSummary } from '../../src/types/shipment';

type TabKey = 'ALL' | 'AT_DEPOT' | 'DELIVERED';

export default function ShipmentsTab() {
  const router = useRouter();
  const [items, setItems] = useState<ShipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('ALL');

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/shipments', { params: { page: 1, pageSize: 100 } });
      const list = (res.data?.items || []) as ShipmentSummary[];
      setItems(list);
    } catch {
      setItems([]);
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

  // Counts derived from the full set (independent of search term so the tab
  // badges always reflect the underlying account, not the active query).
  const counts = useMemo(() => {
    const all = items.length;
    const atDepot = items.filter((s) => s.status === 'AT_DEPOT').length;
    const delivered = items.filter((s) => s.status === 'DELIVERED').length;
    return { ALL: all, AT_DEPOT: atDepot, DELIVERED: delivered };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (tab !== 'ALL' && s.status !== tab) return false;
      if (!q) return true;
      const haystack = [
        s.awb,
        s.bookingReference,
        s.receiverName,
        s.receiverCity,
        s.origin?.code,
        s.destination?.code,
        s.oceanSpecifics?.vessel,
        s.oceanSpecifics?.blNumber,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => {
      // Surface overdue AT_DEPOT first when on AT_DEPOT or ALL tab.
      if (tab !== 'DELIVERED') {
        const ap = getPickupBadge(a)?.overdue ? 1 : 0;
        const bp = getPickupBadge(b)?.overdue ? 1 : 0;
        if (ap !== bp) return bp - ap;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, search, tab]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'AT_DEPOT', label: 'At Depot' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Shipments</Text>
        <Text style={styles.subtitle}>Ocean freight bookings across Singapore → PNG / Fiji.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.dhlMuted} />
        <TextInput
          testID="shipments-search-input"
          style={styles.searchInput}
          placeholder="Search AWB, booking, receiver, vessel…"
          placeholderTextColor={Colors.dhlMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} testID="shipments-search-clear">
            <Ionicons name="close-circle" size={16} color={Colors.dhlMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Segmented control */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              testID={`shipments-tab-${t.key.toLowerCase()}`}
              style={[styles.tabChip, active && styles.tabChipActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                  {counts[t.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View testID="shipments-loading" style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dhlYellow} />
          <Text style={styles.loadingText}>Loading shipments…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
        >
          <View testID="shipments-empty">
            <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>
              {search ? 'No matches for your search' : `No ${tab === 'ALL' ? '' : getStatusLabel(tab).toLowerCase() + ' '}shipments in this view`}
            </Text>
            <Text style={styles.emptySub}>
              {search
                ? 'Try a different AWB, booking reference or receiver name.'
                : 'Pull down to refresh or switch tabs above.'}
            </Text>
            {(search || tab !== 'ALL') && (
              <TouchableOpacity
                testID="shipments-empty-reset"
                style={styles.resetBtn}
                onPress={() => { setSearch(''); setTab('ALL'); }}
              >
                <Text style={styles.resetBtnText}>RESET FILTERS</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.awb}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
          renderItem={({ item }) => (
            <ShipmentRow
              shipment={item}
              onPress={() => router.push(`/shipment/${item.awb}` as never)}
            />
          )}
          ListHeaderComponent={
            <Text testID="shipments-count" style={styles.countText}>
              <Text style={styles.countNum}>{filtered.length}</Text> of{' '}
              <Text style={styles.countNum}>{counts.ALL}</Text> shipment{filtered.length === 1 ? '' : 's'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────
const ShipmentRow = React.memo(function ShipmentRow({
  shipment, onPress,
}: {
  shipment: ShipmentSummary;
  onPress: () => void;
}) {
  const tone = getStatusColor(shipment.status);
  const pickup = getPickupBadge(shipment);
  const service = freightServiceFor(shipment.awb);
  const etaIso = shipment.actualDelivery || shipment.eta || shipment.estimatedDelivery;
  const etaLabel = shipment.status === 'DELIVERED' ? 'Delivered' : 'ETA';

  return (
    <TouchableOpacity
      testID={`shipment-card-${shipment.awb}`}
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAwb}>{shipment.awb}</Text>
          {shipment.bookingReference ? (
            <Text style={styles.cardBooking}>{shipment.bookingReference}</Text>
          ) : null}
        </View>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
          <Text style={[styles.statusText, { color: tone.text }]}>
            {getStatusLabel(shipment.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardRoute}>
        <Text style={styles.cardRouteCode}>{shipment.origin?.code}</Text>
        <Ionicons name="arrow-forward" size={12} color={Colors.dhlRed} />
        <Text style={styles.cardRouteCode}>{shipment.destination?.code}</Text>
        <Text style={styles.cardCity} numberOfLines={1}>
          · {shipment.destination?.city}
        </Text>
      </View>

      <Text style={styles.cardReceiver} numberOfLines={1}>
        {shipment.receiverName}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaTxt}>
          {(shipment.mode || 'OCEAN')}  ·  {service}
        </Text>
        <Text style={styles.cardMetaTxt}>
          {etaLabel}: <Text style={styles.cardMetaStrong}>{formatDate(etaIso)}</Text>
        </Text>
      </View>

      {pickup && (
        <View
          testID={`pickup-badge-${shipment.awb}`}
          style={[
            styles.pickupChip,
            { backgroundColor: pickup.bg, borderColor: pickup.border },
          ]}
        >
          <Ionicons
            name={pickup.overdue ? 'alert-circle' : 'time-outline'}
            size={12}
            color={pickup.fg}
          />
          <Text style={[styles.pickupText, { color: pickup.fg }]}>
            {pickup.text}
          </Text>
          {shipment.oceanSpecifics?.depotStatus?.location ? (
            <Text style={[styles.pickupDepot, { color: pickup.fg }]} numberOfLines={1}>
              {' '}· {shipment.oceanSpecifics.depotStatus.location.split('–')[0].trim()}
            </Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    marginHorizontal: 16, paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dhlText },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  tabChipActive: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlInk },
  tabLabel: { fontSize: 11, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 1, textTransform: 'uppercase' },
  tabLabelActive: { color: Colors.dhlInk },
  tabCount: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 6, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  tabCountActive: { backgroundColor: Colors.dhlInk },
  tabCountText: { fontSize: 10, fontWeight: '900', color: Colors.dhlText },
  tabCountTextActive: { color: Colors.dhlYellow },
  countText: { fontSize: 11, color: Colors.dhlMuted, paddingBottom: 8, paddingHorizontal: 4 },
  countNum: { fontWeight: '900', color: Colors.dhlText },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  center: { paddingVertical: 60, alignItems: 'center', flexGrow: 1 },
  loadingText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.dhlText, marginTop: 16, textAlign: 'center' },
  emptySub: { fontSize: 12, color: Colors.dhlMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  resetBtn: { marginTop: 18, height: 40, paddingHorizontal: 18, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dhlInk },
  resetBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1 },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 14, marginBottom: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardAwb: { fontSize: 14, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlText, letterSpacing: 0.4 },
  cardBooking: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2, fontFamily: 'monospace' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  cardRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardRouteCode: { fontSize: 12, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlText },
  cardCity: { fontSize: 12, color: Colors.dhlMuted, flexShrink: 1 },
  cardReceiver: { fontSize: 13, fontWeight: '600', color: Colors.dhlText, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMetaTxt: { fontSize: 11, color: Colors.dhlMuted },
  cardMetaStrong: { fontWeight: '700', color: Colors.dhlText },
  pickupChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  pickupText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pickupDepot: { fontSize: 10, flexShrink: 1 },
});

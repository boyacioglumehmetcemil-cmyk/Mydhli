/**
 * Parties (formerly "Address Book") — Phase 5 rebrand.
 *
 * Web parity: /dashboard/addresses lists Shipper / Consignee / Notify
 * directories. Backend exposes a single /api/addresses endpoint without an
 * explicit `role` field; we derive role from the legacy boolean flags:
 *   isDefaultSender   → SHIPPER
 *   isDefaultReceiver → CONSIGNEE
 *   neither flag      → NOTIFY
 *
 * NO doc-creation affordances. Only view / select role.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';

type PartyRole = 'SHIPPER' | 'CONSIGNEE' | 'NOTIFY';

interface ApiAddress {
  id: string;
  label?: string;
  name?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  isDefaultSender?: boolean;
  isDefaultReceiver?: boolean;
  role?: PartyRole;
  createdAt?: string;
}

function roleOf(addr: ApiAddress): PartyRole {
  if (addr.role === 'SHIPPER' || addr.role === 'CONSIGNEE' || addr.role === 'NOTIFY') return addr.role;
  if (addr.isDefaultSender) return 'SHIPPER';
  if (addr.isDefaultReceiver) return 'CONSIGNEE';
  return 'NOTIFY';
}

const ROLE_TONES: Record<PartyRole, { bg: string; text: string; dot: string }> = {
  SHIPPER:   { bg: '#FFFBEB', text: '#78350F', dot: Colors.dhlYellow },
  CONSIGNEE: { bg: '#EFF6FF', text: '#1E40AF', dot: '#2563EB' },
  NOTIFY:    { bg: Colors.dhlPanel, text: Colors.dhlMuted, dot: Colors.dhlMuted },
};

type TabKey = 'ALL' | PartyRole;

export default function PartiesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const r = await api.get('/addresses');
      const list = (Array.isArray(r.data) ? r.data : r.data?.items) as ApiAddress[];
      setItems(list || []);
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

  const counts = useMemo(() => {
    const c = { ALL: items.length, SHIPPER: 0, CONSIGNEE: 0, NOTIFY: 0 };
    items.forEach((p) => {
      const r = roleOf(p);
      if (r === 'SHIPPER') c.SHIPPER += 1;
      else if (r === 'CONSIGNEE') c.CONSIGNEE += 1;
      else c.NOTIFY += 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return items;
    return items.filter((p) => roleOf(p) === tab);
  }, [items, tab]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SHIPPER', label: 'Shipper' },
    { key: 'CONSIGNEE', label: 'Consignee' },
    { key: 'NOTIFY', label: 'Notify' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity testID="parties-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>PARTIES</Text>
        <Text style={styles.title}>Shipper, consignee & notify directory</Text>
        <Text style={styles.subtitle}>
          Every counterparty involved in your forwarding bookings, grouped by role.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              testID={`parties-tab-${t.key.toLowerCase()}`}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {t.label}
              </Text>
              <View style={[styles.chipCount, active && styles.chipCountActive]}>
                <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                  {counts[t.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
      ) : filtered.length === 0 ? (
        <View testID="parties-empty" style={styles.center}>
          <Ionicons name="people-outline" size={42} color={Colors.dhlMuted} />
          <Text style={styles.emptyTitle}>No parties in this role yet</Text>
          <Text style={styles.emptyText}>
            Counterparties added at booking time will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
          renderItem={({ item }) => {
            const role = roleOf(item);
            const tone = ROLE_TONES[role];
            const isExpanded = expandedId === item.id;
            const isDefault = (role === 'SHIPPER' && item.isDefaultSender) || (role === 'CONSIGNEE' && item.isDefaultReceiver);
            return (
              <TouchableOpacity
                testID={`party-row-${item.id}`}
                activeOpacity={0.8}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardCompany} numberOfLines={1}>
                        {item.company || item.name || '—'}
                      </Text>
                      {isDefault && (
                        <View testID={`party-default-badge-${item.id}`} style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    {item.name && item.company && item.name !== item.company ? (
                      <Text style={styles.cardContact}>Attn: {item.name}</Text>
                    ) : null}
                    <Text style={styles.cardAddress} numberOfLines={2}>
                      {[item.address, item.city, item.country, item.postalCode].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                  <View
                    testID={`party-role-pill-${item.id}`}
                    style={[styles.rolePill, { backgroundColor: tone.bg }]}
                  >
                    <View style={[styles.roleDot, { backgroundColor: tone.dot }]} />
                    <Text style={[styles.roleText, { color: tone.text }]}>{role}</Text>
                  </View>
                </View>
                {isExpanded && (
                  <View style={styles.expanded}>
                    {item.phone ? (
                      <View style={styles.expandRow}>
                        <Ionicons name="call-outline" size={12} color={Colors.dhlMuted} />
                        <Text style={styles.expandTxt}>{item.phone}</Text>
                      </View>
                    ) : null}
                    {item.email ? (
                      <View style={styles.expandRow}>
                        <Ionicons name="mail-outline" size={12} color={Colors.dhlMuted} />
                        <Text style={styles.expandTxt}>{item.email}</Text>
                      </View>
                    ) : null}
                    {!item.phone && !item.email ? (
                      <Text style={styles.expandMuted}>No contact details on file.</Text>
                    ) : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.dhlMuted, marginTop: 4 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder },
  chipActive: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlInk },
  chipLabel: { fontSize: 11, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 0.5 },
  chipLabelActive: { color: Colors.dhlInk },
  chipCount: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 5, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  chipCountActive: { backgroundColor: Colors.dhlInk },
  chipCountText: { fontSize: 10, fontWeight: '900', color: Colors.dhlText },
  chipCountTextActive: { color: Colors.dhlYellow },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: Colors.dhlText, marginTop: 12 },
  emptyText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 6, textAlign: 'center', maxWidth: 280 },
  list: { paddingHorizontal: 12, paddingBottom: 32 },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 12, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  cardCompany: { fontSize: 14, fontWeight: '800', color: Colors.dhlText, flexShrink: 1 },
  defaultBadge: { backgroundColor: Colors.dhlYellow, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: Colors.dhlInk },
  defaultBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: Colors.dhlInk },
  cardContact: { fontSize: 11, color: Colors.dhlMuted, marginBottom: 4 },
  cardAddress: { fontSize: 12, color: Colors.dhlText, lineHeight: 17 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  expanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  expandTxt: { fontSize: 12, color: Colors.dhlText, fontFamily: 'monospace' },
  expandMuted: { fontSize: 11, color: Colors.dhlMuted, fontStyle: 'italic' },
});

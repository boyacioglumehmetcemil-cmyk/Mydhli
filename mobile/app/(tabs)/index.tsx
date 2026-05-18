/**
 * Home tab — Dashboard mirroring web /dashboard.
 *
 * Phase 4 contract:
 *   • Top header  : DHL Forwarding wordmark + HeaderBell + settings + logout
 *   • Welcome     : firstName greeting
 *   • 4 KPI cards : Total / At Depot / Overdue Pickups / Outstanding Invoices
 *   • Urgent list : top 3-5 AT_DEPOT shipments with overdue / ≤2-day badges
 *   • Quick links : Schedule Pickup / Get Quote / My Shipments  (existing footer kept)
 *
 * Data sources:
 *   • GET /api/shipments?pageSize=100  → totals, status mix, oceanSpecifics
 *   • GET /api/invoices               → ledger total + OVERDUE total
 *   • GET /api/notifications/unread-count (via HeaderBell)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import HeaderBell from '../../src/components/HeaderBell';
import api from '../../src/lib/api';
import {
  formatDate, formatPGK, formatUSD, getPickupBadge,
} from '../../src/lib/shipmentUtils';
import type { ShipmentSummary, Invoice } from '../../src/types/shipment';

interface DashboardStats {
  total: number;
  atDepot: number;
  delivered: number;
  overdueCount: number;
  urgentCount: number;
  ledgerTotal: number;
  ledgerOverdue: number;
  ledgerCurrency: 'USD' | 'PGK';
  invoiceCount: number;
  loading: boolean;
}

const initialStats: DashboardStats = {
  total: 0, atDepot: 0, delivered: 0, overdueCount: 0, urgentCount: 0,
  ledgerTotal: 0, ledgerOverdue: 0, ledgerCurrency: 'USD',
  invoiceCount: 0, loading: true,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [urgent, setUrgent] = useState<ShipmentSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    // Shipments — derive total, AT_DEPOT count, overdue / urgent set.
    try {
      const r = await api.get('/shipments', { params: { page: 1, pageSize: 100 } });
      const items = (r.data?.items || []) as ShipmentSummary[];
      const atDepot = items.filter((s) => s.status === 'AT_DEPOT');
      const delivered = items.filter((s) => s.status === 'DELIVERED').length;
      const withBadges = atDepot
        .map((s) => ({ s, badge: getPickupBadge(s) }))
        .filter((x) => x.badge !== null);
      const overdueCount = withBadges.filter((x) => x.badge!.overdue).length;
      const urgentCount = withBadges.filter((x) => x.badge!.urgent).length;

      // Top 5 urgent shipments — overdue first (by absolute days), then urgent.
      const sorted = withBadges
        .filter((x) => x.badge!.urgent)
        .sort((a, b) => {
          const ao = a.badge!.overdue ? 1 : 0;
          const bo = b.badge!.overdue ? 1 : 0;
          if (ao !== bo) return bo - ao;
          // Larger overdue magnitude first
          return Math.abs(b.badge!.daysRemaining) - Math.abs(a.badge!.daysRemaining);
        })
        .slice(0, 5)
        .map((x) => x.s);

      setUrgent(sorted);
      setStats((prev) => ({
        ...prev,
        total: r.data?.total ?? items.length,
        atDepot: atDepot.length,
        delivered,
        overdueCount,
        urgentCount,
      }));
    } catch {
      /* leave previous values */
    }

    // Invoices — ledger total + OVERDUE total (USD if available, else PGK fallback).
    try {
      const r = await api.get('/invoices');
      const items = (r.data?.items || []) as Invoice[];
      let usdTotal = 0, pgkTotal = 0, overdueUSD = 0, overduePGK = 0, anyUSD = false;
      for (const inv of items) {
        const u = Number(inv.totalUSD || 0);
        const p = Number(inv.totalPGK || 0);
        if (u > 0) anyUSD = true;
        usdTotal += u;
        pgkTotal += p;
        if (inv.status === 'OVERDUE') {
          overdueUSD += u;
          overduePGK += p;
        }
      }
      const useUSD = anyUSD;
      setStats((prev) => ({
        ...prev,
        invoiceCount: items.length,
        ledgerTotal: useUSD ? usdTotal : pgkTotal,
        ledgerOverdue: useUSD ? overdueUSD : overduePGK,
        ledgerCurrency: useUSD ? 'USD' : 'PGK',
        loading: false,
      }));
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); return undefined; }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    setStats((s) => ({ ...s, loading: true }));
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    router.replace('/');
    await logout();
  };

  const fmtMoney = useCallback((n: number) => {
    return stats.ledgerCurrency === 'USD' ? formatUSD(n) : formatPGK(n);
  }, [stats.ledgerCurrency]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>DHL</Text>
          <Text style={styles.logoAccent}> Forwarding</Text>
        </View>
        <View style={styles.headerRight}>
          <HeaderBell />
          <TouchableOpacity testID="dashboard-settings-btn" onPress={() => router.push('/settings')} style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={20} color={Colors.dhlText} />
          </TouchableOpacity>
          <TouchableOpacity testID="dashboard-logout-btn" onPress={handleLogout} style={styles.headerIcon}>
            <Ionicons name="log-out-outline" size={20} color={Colors.dhlRed} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
      >
        {/* Welcome */}
        <View testID="dashboard-page" style={styles.welcome}>
          <Text style={styles.welcomeLabel}>myDHLi · DASHBOARD</Text>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.firstName || 'there'}.</Text>
          <Text style={styles.welcomeSub}>Snapshot of your ocean freight account.</Text>
        </View>

        {/* KPI grid 2×2 */}
        <View style={styles.kpiGrid}>
          <KpiCard
            testID="home-kpi-total"
            icon="cube"
            iconBg={Colors.dhlYellow}
            iconColor={Colors.dhlInk}
            label="TOTAL SHIPMENTS"
            value={stats.loading ? null : String(stats.total)}
            sub="Ocean Freight"
            onPress={() => router.push('/(tabs)/shipments' as never)}
          />
          <KpiCard
            testID="home-kpi-at-depot"
            icon="business"
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
            label="AT DEPOT"
            value={stats.loading ? null : String(stats.atDepot)}
            sub={stats.atDepot === 0 ? 'None awaiting' : `${stats.atDepot} awaiting collection`}
            onPress={() => router.push('/(tabs)/shipments' as never)}
          />
          <KpiCard
            testID="home-kpi-overdue"
            icon="alert-circle"
            iconBg={Colors.red100}
            iconColor={Colors.dhlRed}
            label="OVERDUE PICKUPS"
            value={stats.loading ? null : String(stats.overdueCount)}
            valueColor={stats.overdueCount > 0 ? Colors.dhlRed : undefined}
            sub={
              stats.overdueCount > 0
                ? `${stats.urgentCount - stats.overdueCount} urgent ≤2 days`
                : 'All within window'
            }
            onPress={() => router.push('/(tabs)/shipments' as never)}
          />
          <KpiCard
            testID="home-kpi-billed"
            icon="card"
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            label="OUTSTANDING"
            value={stats.loading ? null : fmtMoney(stats.ledgerTotal)}
            sub={
              stats.invoiceCount === 0
                ? 'No invoices on file'
                : `${stats.invoiceCount} invoice${stats.invoiceCount === 1 ? '' : 's'}${
                    stats.ledgerOverdue > 0 ? ` · ${fmtMoney(stats.ledgerOverdue)} overdue` : ''
                  }`
            }
            onPress={() => router.push('/invoices' as never)}
          />
        </View>

        {/* AT_DEPOT urgency list */}
        <SectionTitle
          title="AWAITING BUYER COLLECTION"
          actionLabel={urgent.length > 0 ? 'VIEW ALL' : undefined}
          onAction={() => router.push('/(tabs)/shipments' as never)}
        />
        {stats.loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.dhlYellow} />
          </View>
        ) : urgent.length === 0 ? (
          <View testID="home-urgent-empty" style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.green600} />
            <Text style={styles.emptyTxt}>No pickups overdue or due within 2 days.</Text>
          </View>
        ) : (
          <View testID="home-urgent-list" style={{ marginBottom: 8 }}>
            {urgent.map((s) => (
              <UrgentRow
                key={s.awb}
                shipment={s}
                onPress={() => router.push(`/shipment/${s.awb}` as never)}
              />
            ))}
          </View>
        )}

        {/* Quick links */}
        <SectionTitle title="QUICK ACTIONS" />
        <View style={styles.actionsRow}>
          {[
            { icon: 'cube' as const, label: 'Shipments', sub: 'All bookings', route: '/(tabs)/shipments', testId: 'quick-shipments' },
            { icon: 'document-text' as const, label: 'Documents', sub: 'Operational PDFs', route: '/(tabs)/documents', testId: 'quick-documents' },
            { icon: 'search' as const, label: 'Track', sub: 'Trace any AWB', route: '/(tabs)/track', testId: 'quick-track' },
            { icon: 'calendar' as const, label: 'Pickup', sub: 'Arrange a freight pickup', route: '/schedule-pickup', testId: 'quick-pickup' },
          ].map((a) => (
            <TouchableOpacity key={a.label} testID={a.testId} style={styles.actionTile} onPress={() => router.push(a.route as never)}>
              <View style={styles.actionIcon}><Ionicons name={a.icon} size={18} color={Colors.dhlInk} /></View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
const SectionTitle = ({
  title, actionLabel, onAction,
}: { title: string; actionLabel?: string; onAction?: () => void }) => (
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const KpiCard = ({
  testID, icon, iconBg, iconColor, label, value, valueColor, sub, onPress,
}: {
  testID?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | null;
  valueColor?: string;
  sub: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    testID={testID}
    activeOpacity={onPress ? 0.8 : 1}
    onPress={onPress}
    style={styles.kpiCard}
  >
    <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={16} color={iconColor} />
    </View>
    <Text style={styles.kpiLabel}>{label}</Text>
    {value === null ? (
      <ActivityIndicator color={Colors.dhlYellow} style={{ marginVertical: 4 }} />
    ) : (
      <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    )}
    <Text style={styles.kpiSub} numberOfLines={1}>{sub}</Text>
  </TouchableOpacity>
);

const UrgentRow = ({
  shipment, onPress,
}: { shipment: ShipmentSummary; onPress: () => void }) => {
  const pickup = getPickupBadge(shipment);
  if (!pickup) return null;
  return (
    <TouchableOpacity
      testID={`home-urgent-card-${shipment.awb}`}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.urgentRow, { borderLeftColor: pickup.border }]}
    >
      <View style={[styles.urgentIcon, { backgroundColor: pickup.bg }]}>
        <Ionicons
          name={pickup.overdue ? 'alert-circle' : 'time-outline'}
          size={18}
          color={pickup.fg}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.urgentHead}>
          <Text style={styles.urgentAwb}>{shipment.awb}</Text>
          <Text style={[styles.urgentBadge, { color: pickup.fg }]}>{pickup.text}</Text>
        </View>
        <Text style={styles.urgentReceiver} numberOfLines={1}>
          {shipment.receiverName}
        </Text>
        <Text style={styles.urgentRoute}>
          {shipment.origin?.code} → {shipment.destination?.code}
          {shipment.oceanSpecifics?.depotStatus?.location
            ? `  ·  ${shipment.oceanSpecifics.depotStatus.location.split('–')[0].trim()}`
            : ''}
        </Text>
        {shipment.eta ? (
          <Text style={styles.urgentEta}>ETA {formatDate(shipment.eta)}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.dhlMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  logoPill: { flexDirection: 'row', alignItems: 'baseline' },
  logoText: { fontSize: 18, fontWeight: '900', color: Colors.dhlRed, letterSpacing: 0.5 },
  logoAccent: { fontSize: 14, fontWeight: '600', color: Colors.dhlText },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  welcome: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  welcomeLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 4 },
  welcomeTitle: { fontSize: 22, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },

  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginTop: 4,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 12,
    minHeight: 100,
  },
  kpiIcon: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  kpiLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: Colors.dhlMuted },
  kpiValue: { fontSize: 24, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginTop: 2 },
  kpiSub: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },

  sectionTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlMuted },
  sectionAction: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: Colors.dhlRed },

  center: { paddingVertical: 24, alignItems: 'center' },
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 14,
  },
  emptyTxt: { fontSize: 12, color: Colors.dhlMuted, flex: 1 },

  urgentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    borderLeftWidth: 4,
    padding: 12,
  },
  urgentIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  urgentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  urgentAwb: { fontSize: 12, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlText, letterSpacing: 0.4 },
  urgentBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  urgentReceiver: { fontSize: 12, fontWeight: '600', color: Colors.dhlText, marginTop: 2 },
  urgentRoute: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2, fontFamily: 'monospace' },
  urgentEta: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  actionTile: {
    width: '48%',
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 12,
  },
  actionIcon: { width: 28, height: 28, backgroundColor: Colors.dhlYellow, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '900', color: Colors.dhlText },
  actionSub: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import StatusBadge from '../../src/components/StatusBadge';
import api from '../../src/lib/api';
import { formatDate, formatPGK } from '../../src/lib/shipmentUtils';

const ACTIVE_STATUSES = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ active: 0, monthSpend: 0, loading: true });
  const [recent, setRecent] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const recentRes = await api.get('/shipments', { params: { page: 1, pageSize: 5 } });
      setRecent(recentRes.data.items);
    } catch {} finally { setRecentLoading(false); }

    try {
      const responses = await Promise.all(
        ACTIVE_STATUSES.map(st => api.get('/shipments', { params: { status: st, page: 1, pageSize: 1 } }))
      );
      const active = responses.reduce((acc, r) => acc + (r.data?.total || 0), 0);
      setStats(s => ({ ...s, active, loading: false }));
    } catch { setStats(s => ({ ...s, loading: false })); }

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const res = await api.get('/shipments', { params: { dateFrom: monthStart, page: 1, pageSize: 100 } });
      const monthSpend = res.data.items.reduce((sum: number, it: any) => sum + (it.costPGK || 0), 0);
      setStats(s => ({ ...s, monthSpend }));
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setRecentLoading(true);
    setStats(s => ({ ...s, loading: true }));
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    router.replace('/');
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>DHL</Text>
          <Text style={styles.logoAccent}> Forwarding</Text>
        </View>
        <View style={styles.headerRight}>
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
          <Text style={styles.welcomeSub}>Here's a snapshot of your account.</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.dhlYellow }]}>
              <Ionicons name="cube" size={16} color={Colors.dhlInk} />
            </View>
            <Text style={styles.kpiLabel}>ACTIVE SHIPMENTS</Text>
            {stats.loading ? <ActivityIndicator color={Colors.dhlYellow} /> : (
              <Text style={styles.kpiValue}>{stats.active}</Text>
            )}
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.dhlRed }]}>
              <Ionicons name="cash" size={16} color={Colors.white} />
            </View>
            <Text style={styles.kpiLabel}>THIS MONTH</Text>
            {stats.loading ? <ActivityIndicator color={Colors.dhlYellow} /> : (
              <Text style={styles.kpiValue}>{formatPGK(stats.monthSpend)}</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <Text style={styles.sectionTitle}>What's next?</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'send' as const, label: 'Ship Now', sub: 'Create a new shipment', route: '/(tabs)/ship', testId: 'quick-ship-now' },
            { icon: 'search' as const, label: 'Track', sub: 'Look up any AWB', route: '/track', testId: 'quick-track' },
            { icon: 'calculator' as const, label: 'Get Quote', sub: 'Estimate rates instantly', route: '/quote', testId: 'quick-quote' },
            { icon: 'calendar' as const, label: 'Pickup', sub: 'Book a courier visit', route: '/schedule-pickup', testId: 'quick-pickup' },
          ].map((a, i) => (
            <TouchableOpacity key={i} testID={a.testId} style={styles.actionCard} onPress={() => router.push(a.route as any)}>
              <View style={styles.actionIconBox}>
                <Ionicons name={a.icon} size={20} color={Colors.dhlInk} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Shipments */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <View>
              <Text style={styles.recentLabel}>ACTIVITY</Text>
              <Text style={styles.recentTitle}>Recent Shipments</Text>
            </View>
            <TouchableOpacity testID="view-all-shipments" onPress={() => router.push('/(tabs)/shipments')}>
              <Text style={styles.viewAll}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {recentLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.dhlYellow} />
              <Text style={styles.loadingText}>Loading recent shipments…</Text>
            </View>
          ) : recent.length === 0 ? (
            <View testID="recent-shipments-empty" style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color={Colors.dhlMuted} />
              <Text style={styles.emptyTitle}>No shipments yet.</Text>
            </View>
          ) : (
            recent.map(s => (
              <TouchableOpacity
                key={s.awb}
                testID={`recent-row-${s.awb}`}
                style={styles.shipmentCard}
                onPress={() => router.push(`/shipment/${s.awb}`)}
              >
                <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentAwb}>{s.awb}</Text>
                  <StatusBadge status={s.status} />
                </View>
                <Text style={styles.shipmentReceiver}>{s.receiverName}</Text>
                <View style={styles.shipmentRoute}>
                  <Text style={styles.routeCode}>{s.origin?.code}</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.dhlRed} />
                  <Text style={styles.routeCode}>{s.destination?.code}</Text>
                  <Text style={styles.shipmentCost}>{formatPGK(s.costPGK)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  logoPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  logoText: { fontSize: 13, fontWeight: '900', color: Colors.dhlInk },
  logoAccent: { fontSize: 13, fontWeight: '900', color: Colors.dhlRed },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerIcon: { padding: 8 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  welcome: { padding: 20 },
  welcomeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  welcomeTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  kpiCard: {
    flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16,
  },
  kpiIcon: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  kpiLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlMuted, marginBottom: 8 },
  kpiValue: { fontSize: 28, fontWeight: '900', color: Colors.dhlText },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, paddingHorizontal: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: Colors.dhlText, paddingHorizontal: 20, marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  actionCard: {
    width: '47%', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.dhlBorder, padding: 16,
  },
  actionIconBox: {
    width: 40, height: 40, backgroundColor: Colors.dhlYellow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: '700', color: Colors.dhlText, marginBottom: 2 },
  actionSub: { fontSize: 11, color: Colors.dhlMuted },
  recentSection: {
    marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  recentLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted },
  recentTitle: { fontSize: 16, fontWeight: '700', color: Colors.dhlText, marginTop: 2 },
  viewAll: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: Colors.dhlRed },
  loadingContainer: { padding: 32, alignItems: 'center' },
  loadingText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 8 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.dhlText, marginTop: 12 },
  shipmentCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  shipmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shipmentAwb: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  shipmentReceiver: { fontSize: 14, fontWeight: '600', color: Colors.dhlText, marginBottom: 4 },
  shipmentRoute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeCode: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  shipmentCost: { marginLeft: 'auto', fontSize: 12, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
});

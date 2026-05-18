/**
 * Notifications inbox (/notifications) — mirrors web /dashboard/notifications.
 *
 * Phase 4 contract:
 *   • GET  /api/notifications              → { items, total, unread }
 *   • POST /api/notifications/{id}/read    → mark single as read
 *   • POST /api/notifications/read-all     → mark all as read
 *
 * Notification shape (live response):
 *   { id, type, title, subtitle, awb, invoiceNumber, createdAt, readAt, link }
 *
 * UI rules:
 *   • Unread rows  → left red bar + bold title
 *   • Read rows    → muted text, no bar
 *   • Tap row      → mark as read + deep link (shipment AWB → /shipment/[awb],
 *                    invoice → /invoices, otherwise stay)
 *   • "Mark all as read" toolbar action (visible only when unread > 0)
 *   • Pull-to-refresh, empty state, error state
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';
import { formatDateTime } from '../src/lib/shipmentUtils';

interface NotifItem {
  id: string;
  type?: string;
  title: string;
  subtitle?: string;
  awb?: string | null;
  invoiceNumber?: string | null;
  createdAt: string;
  readAt?: string | null;
  link?: string | null;
}

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  AT_DEPOT_OVERDUE: { icon: 'alert-circle', color: Colors.dhlRed },
  AT_DEPOT_ARRIVAL: { icon: 'business', color: '#92400E' },
  OUT_FOR_DELIVERY: { icon: 'car-sport', color: '#0EA5E9' },
  IN_TRANSIT: { icon: 'boat', color: '#0EA5E9' },
  PICKUP_CONFIRMED: { icon: 'checkmark-circle', color: Colors.green600 },
  SHIPMENT_DELIVERED: { icon: 'checkmark-done', color: Colors.green600 },
  SHIPMENT_UPDATE: { icon: 'cube', color: Colors.dhlMuted },
  INVOICE_OVERDUE: { icon: 'card', color: Colors.dhlRed },
  INVOICE_DUE: { icon: 'card-outline', color: '#92400E' },
  INVOICE_PAID: { icon: 'checkmark-circle', color: Colors.green600 },
  SERVICE_UPDATE: { icon: 'information-circle', color: Colors.dhlMuted },
  SYSTEM: { icon: 'settings', color: Colors.dhlMuted },
};

const iconFor = (t?: string) => TYPE_META[t || ''] || { icon: 'notifications', color: Colors.dhlMuted } as const;

export default function NotificationsInbox() {
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErr(null);
      const res = await api.get('/notifications');
      const list = (res.data?.items || []) as NotifItem[];
      setItems(list);
      const u = typeof res.data?.unread === 'number'
        ? res.data.unread
        : list.filter((n) => !n.readAt).length;
      setUnread(u);
    } catch (e: unknown) {
      setErr('Could not load notifications. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const markOneRead = useCallback(async (id: string) => {
    // Optimistic update.
    setItems((prev) => prev.map((n) =>
      n.id === id && !n.readAt
        ? { ...n, readAt: new Date().toISOString() }
        : n,
    ));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      // Best-effort — don't reset the optimistic UI; user can pull-to-refresh.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnread(0);
    try {
      await api.post('/notifications/read-all');
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  }, [marking]);

  const handleRowPress = useCallback((n: NotifItem) => {
    if (!n.readAt) markOneRead(n.id);
    if (n.awb) {
      router.push(`/shipment/${n.awb}` as never);
    } else if (n.invoiceNumber) {
      router.push('/invoices' as never);
    } else if (n.link) {
      router.push(n.link as never);
    }
  }, [router, markOneRead]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          testID="notifications-back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unread > 0 ? `${unread} unread · ${items.length} total` : `${items.length} total`}
          </Text>
        </View>
        {unread > 0 ? (
          <TouchableOpacity
            testID="notifications-mark-all-read"
            onPress={markAllRead}
            disabled={marking}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>
              {marking ? 'MARKING…' : 'MARK ALL READ'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading ? (
        <View testID="notifications-loading" style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dhlYellow} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : err ? (
        <View testID="notifications-error" style={styles.center}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.dhlRed} />
          <Text style={styles.errTitle}>Could not load notifications</Text>
          <Text style={styles.errBody}>{err}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View testID="notifications-empty" style={styles.center}>
          <Ionicons name="mail-open-outline" size={48} color={Colors.dhlMuted} />
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyText}>
            New shipment updates, depot alerts and invoice reminders will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
          renderItem={({ item }) => {
            const ic = iconFor(item.type);
            const isUnread = !item.readAt;
            return (
              <TouchableOpacity
                testID={`notification-row-${item.id}`}
                activeOpacity={0.8}
                onPress={() => handleRowPress(item)}
                style={[styles.row, isUnread && styles.rowUnread]}
              >
                {isUnread && <View testID="notification-unread-bar" style={styles.unreadBar} />}
                <View style={[styles.rowIcon, { backgroundColor: ic.color + '22' }]}>
                  <Ionicons name={ic.icon} size={18} color={ic.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHead}>
                    <Text
                      style={[styles.rowTitle, isUnread && styles.rowTitleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  {item.subtitle ? (
                    <Text style={styles.rowBody} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <View style={styles.rowMeta}>
                    {item.awb ? (
                      <Text style={styles.rowAwb}>{item.awb}</Text>
                    ) : item.invoiceNumber ? (
                      <Text style={styles.rowAwb}>{item.invoiceNumber}</Text>
                    ) : null}
                    <Text style={styles.rowDate}>{formatDateTime(item.createdAt)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.dhlMuted} />
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
  topbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  titleCol: { flex: 1, marginLeft: 4 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.dhlText },
  subtitle: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
  markAllBtn: { paddingHorizontal: 10, height: 36, justifyContent: 'center' },
  markAllText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: Colors.dhlRed },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 12, color: Colors.dhlMuted, marginTop: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText, marginTop: 16 },
  emptyText: { fontSize: 12, color: Colors.dhlMuted, textAlign: 'center', maxWidth: 280, marginTop: 6 },
  errTitle: { fontSize: 16, fontWeight: '900', color: Colors.dhlText, marginTop: 12, marginBottom: 4, textAlign: 'center' },
  errBody: { fontSize: 12, color: Colors.dhlMuted, textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  primaryBtn: { height: 44, paddingHorizontal: 24, backgroundColor: Colors.dhlYellow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dhlInk },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },

  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    paddingHorizontal: 12, paddingVertical: 12,
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  rowUnread: { backgroundColor: '#FFFDF6' },
  unreadBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: Colors.dhlRed,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.dhlText },
  rowTitleUnread: { fontWeight: '900', color: Colors.dhlText },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dhlRed },
  rowBody: { fontSize: 12, color: Colors.dhlMuted, marginTop: 3, lineHeight: 17 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  rowAwb: { fontSize: 10, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlRed, letterSpacing: 0.5 },
  rowDate: { fontSize: 10, color: Colors.dhlMuted, fontFamily: 'monospace' },
});

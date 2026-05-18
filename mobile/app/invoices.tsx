/**
 * Invoices ledger — Phase 5.
 *
 * Data: GET /api/invoices       → items + total
 *       GET /api/invoices/{number}/pdf  (optional viewing)
 *
 * 3 KPI cards   : Total Billed / Paid / Outstanding (UNPAID + OVERDUE)
 * 3 filter tabs : All / Paid / Outstanding
 * Each row     : invoice #, AWB chip, amount (USD), status pill, due / paid date
 * Tap row       → inline expand with line items + dates
 *
 * Currency: prefers totalUSD (Phase 8.x USD ledger); falls back to totalPGK
 * for backward compat with older seeds.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Linking, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api, { resolveBackendUrl } from '../src/lib/api';
import { formatDate, formatUSD, formatPGK } from '../src/lib/shipmentUtils';

interface LineItem {
  shipmentAwb?: string;
  description?: string;
  amountUSD?: number;
  costPGK?: number;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  issueDate?: string;
  dueDate?: string | null;
  paidDate?: string | null;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PENDING' | string;
  currency?: string;
  totalUSD?: number;
  totalPGK?: number;
  subtotalUSD?: number;
  taxUSD?: number;
  paymentReference?: string;
  lineItems?: LineItem[];
}

type TabKey = 'ALL' | 'PAID' | 'OUTSTANDING';

const STATUS_TONES: Record<string, { bg: string; text: string; dot: string }> = {
  PAID:    { bg: Colors.green100, text: Colors.green900, dot: Colors.green600 },
  OVERDUE: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed },
  UNPAID:  { bg: '#FFFBEB', text: '#78350F', dot: '#F59E0B' },
  PENDING: { bg: Colors.gray100, text: Colors.gray700, dot: Colors.gray400 },
};

export default function InvoicesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'PGK'>('USD');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const r = await api.get('/invoices');
      const list = (r.data?.items || []) as InvoiceItem[];
      const useUSD = list.some((it) => (it.totalUSD || 0) > 0);
      setCurrency(useUSD ? 'USD' : 'PGK');
      setItems(list);
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

  const amountOf = useCallback((it: InvoiceItem) =>
    currency === 'USD' ? (it.totalUSD || 0) : (it.totalPGK || 0),
    [currency],
  );

  const fmt = useCallback((n: number) =>
    currency === 'USD' ? formatUSD(n) : formatPGK(n),
    [currency],
  );

  const stats = useMemo(() => {
    let total = 0, paid = 0, outstanding = 0;
    let paidCount = 0, outCount = 0;
    items.forEach((it) => {
      const v = amountOf(it);
      total += v;
      if (it.status === 'PAID') { paid += v; paidCount += 1; }
      else if (it.status === 'UNPAID' || it.status === 'OVERDUE') { outstanding += v; outCount += 1; }
    });
    return { total, paid, outstanding, paidCount, outCount, totalCount: items.length };
  }, [items, amountOf]);

  const filtered = useMemo(() => {
    if (tab === 'PAID') return items.filter((it) => it.status === 'PAID');
    if (tab === 'OUTSTANDING') return items.filter((it) => it.status === 'UNPAID' || it.status === 'OVERDUE');
    return items;
  }, [items, tab]);

  const counts = useMemo(() => ({
    ALL: items.length,
    PAID: items.filter((it) => it.status === 'PAID').length,
    OUTSTANDING: items.filter((it) => it.status === 'UNPAID' || it.status === 'OVERDUE').length,
  }), [items]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PAID', label: 'Paid' },
    { key: 'OUTSTANDING', label: 'Outstanding' },
  ];

  const openInvoicePdf = (invoiceNumber: string) => {
    const base = resolveBackendUrl();
    Linking.openURL(`${base}/api/invoices/${encodeURIComponent(invoiceNumber)}/pdf`).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity testID="invoices-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dhlYellow} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>INVOICES · USD LEDGER</Text>
          <Text style={styles.title}>Billing</Text>
          <Text style={styles.subtitle}>
            Open invoices, paid history and outstanding balance across your account.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
        ) : (
          <>
            {/* KPI row */}
            <View style={styles.kpiRow}>
              <KpiCard
                testID="invoices-kpi-billed"
                label="TOTAL BILLED"
                value={fmt(stats.total)}
                sub={`${stats.totalCount} invoice${stats.totalCount === 1 ? '' : 's'}`}
                icon="card"
                iconColor="#2563EB"
                iconBg="#EFF6FF"
              />
              <KpiCard
                testID="invoices-kpi-paid"
                label="PAID"
                value={fmt(stats.paid)}
                sub={`${stats.paidCount} invoice${stats.paidCount === 1 ? '' : 's'}`}
                icon="checkmark-circle"
                iconColor={Colors.green600}
                iconBg={Colors.green100}
              />
              <KpiCard
                testID="invoices-kpi-overdue"
                label="OUTSTANDING"
                value={fmt(stats.outstanding)}
                sub={`${stats.outCount} invoice${stats.outCount === 1 ? '' : 's'}`}
                icon="alert-circle"
                iconColor={Colors.dhlRed}
                iconBg={Colors.red100}
                valueColor={stats.outstanding > 0 ? Colors.dhlRed : undefined}
              />
            </View>

            {/* Tabs */}
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
                    testID={`invoices-tab-${t.key.toLowerCase()}`}
                    onPress={() => setTab(t.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {t.label}
                    </Text>
                    <View style={[styles.chipCount, active && styles.chipCountActive]}>
                      <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{counts[t.key]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* List */}
            <View style={{ paddingHorizontal: 12 }}>
              <Text style={styles.countText}>
                <Text style={styles.countNum}>{filtered.length}</Text> of{' '}
                <Text style={styles.countNum}>{counts.ALL}</Text> invoice{filtered.length === 1 ? '' : 's'}
              </Text>
              {filtered.length === 0 ? (
                <View testID="invoices-empty" style={styles.emptyCard}>
                  <Ionicons name="receipt-outline" size={32} color={Colors.dhlMuted} />
                  <Text style={styles.emptyTitle}>No invoices in this view</Text>
                </View>
              ) : (
                filtered.map((it) => {
                  const tone = STATUS_TONES[it.status] || STATUS_TONES.PENDING;
                  const isExpanded = expanded === it.invoiceNumber;
                  const amount = amountOf(it);
                  return (
                    <TouchableOpacity
                      key={it.invoiceNumber}
                      testID={`invoice-row-${it.invoiceNumber}`}
                      activeOpacity={0.8}
                      onPress={() => setExpanded(isExpanded ? null : it.invoiceNumber)}
                      style={styles.card}
                    >
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardNumber}>{it.invoiceNumber}</Text>
                          <Text style={styles.cardMeta}>
                            Issued {formatDate(it.issueDate)}
                            {it.status === 'PAID' && it.paidDate ? ` · Paid ${formatDate(it.paidDate)}` :
                              it.dueDate ? ` · Due ${formatDate(it.dueDate)}` : ''}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.cardAmount}>{fmt(amount)}</Text>
                          <View
                            testID={`invoice-status-pill-${it.invoiceNumber}`}
                            style={[styles.statusPill, { backgroundColor: tone.bg }]}
                          >
                            <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
                            <Text style={[styles.statusText, { color: tone.text }]}>
                              {it.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {isExpanded && (
                        <View style={styles.expanded}>
                          {(it.lineItems || []).slice(0, 5).map((li, idx) => {
                            const lineAmount = currency === 'USD' ? (li.amountUSD || 0) : (li.costPGK || 0);
                            return (
                              <View key={idx} style={styles.lineRow}>
                                <View style={{ flex: 1 }}>
                                  {li.shipmentAwb ? (
                                    <Text style={styles.lineAwb}>{li.shipmentAwb}</Text>
                                  ) : null}
                                  <Text style={styles.lineDesc} numberOfLines={1}>
                                    {li.description || '—'}
                                  </Text>
                                </View>
                                <Text style={styles.lineAmt}>{fmt(lineAmount)}</Text>
                              </View>
                            );
                          })}
                          <View style={styles.expandActions}>
                            <TouchableOpacity
                              testID={`invoice-open-pdf-${it.invoiceNumber}`}
                              onPress={() => openInvoicePdf(it.invoiceNumber)}
                              style={styles.actionBtn}
                            >
                              <Ionicons name={Platform.OS === 'web' ? 'open-outline' : 'document-outline'} size={14} color={Colors.dhlInk} />
                              <Text style={styles.actionTxt}>OPEN PDF</Text>
                            </TouchableOpacity>
                            {it.paymentReference ? (
                              <Text style={styles.payRef}>Ref: {it.paymentReference}</Text>
                            ) : null}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const KpiCard = ({
  testID, label, value, sub, icon, iconColor, iconBg, valueColor,
}: {
  testID?: string;
  label: string; value: string; sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string; iconBg: string;
  valueColor?: string;
}) => (
  <View testID={testID} style={styles.kpi}>
    <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={14} color={iconColor} />
    </View>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.kpiSub} numberOfLines={1}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  topbar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.dhlMuted, marginTop: 4 },

  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginTop: 4 },
  kpi: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 10, minHeight: 100 },
  kpiIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: Colors.dhlMuted },
  kpiValue: { fontSize: 16, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginTop: 2 },
  kpiSub: { fontSize: 9, color: Colors.dhlMuted, marginTop: 1 },

  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder },
  chipActive: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlInk },
  chipLabel: { fontSize: 11, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 0.5 },
  chipLabelActive: { color: Colors.dhlInk },
  chipCount: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 5, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  chipCountActive: { backgroundColor: Colors.dhlInk },
  chipCountText: { fontSize: 10, fontWeight: '900', color: Colors.dhlText },
  chipCountTextActive: { color: Colors.dhlYellow },

  countText: { fontSize: 11, color: Colors.dhlMuted, paddingBottom: 8, paddingHorizontal: 4 },
  countNum: { fontWeight: '900', color: Colors.dhlText },
  emptyCard: { alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 32 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: Colors.dhlText, marginTop: 10 },
  center: { paddingVertical: 60, alignItems: 'center' },

  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 12, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardNumber: { fontSize: 13, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlText, letterSpacing: 0.4 },
  cardMeta: { fontSize: 10, color: Colors.dhlMuted, marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '900', color: Colors.dhlText },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  lineAwb: { fontSize: 10, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlRed, letterSpacing: 0.5 },
  lineDesc: { fontSize: 11, color: Colors.dhlMuted, marginTop: 1 },
  lineAmt: { fontSize: 12, fontWeight: '700', color: Colors.dhlText, fontFamily: 'monospace' },
  expandActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.dhlYellow, borderWidth: 1, borderColor: Colors.dhlInk },
  actionTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Colors.dhlInk },
  payRef: { fontSize: 10, color: Colors.dhlMuted, fontFamily: 'monospace' },
});

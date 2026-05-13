import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';
import { formatDate, formatPGK } from '../src/lib/shipmentUtils';

const statusTone: Record<string, { bg: string; text: string }> = {
  PAID: { bg: Colors.green100, text: Colors.green900 },
  UNPAID: { bg: 'rgba(255,204,0,0.3)', text: Colors.dhlInk },
  OVERDUE: { bg: Colors.red100, text: Colors.dhlRed },
};

export default function Invoices() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [payInv, setPayInv] = useState<any>(null);

  const load = () => {
    setLoading(true);
    const params: any = filter !== 'ALL' ? { status: filter } : {};
    api.get('/invoices', { params }).then(r => {
      setItems(r.data.items);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const totalOutstanding = items.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.totalPGK, 0);
  const overdueTotal = items.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.totalPGK, 0);
  const paidCount = items.filter(i => i.status === 'PAID').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="invoices-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View testID="invoices-page" style={styles.titleSection}>
          <Text style={styles.pageTitle}>Invoices</Text>
          <Text style={styles.pageSub}>Your billing history and outstanding balances.</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: Colors.dhlYellow }]}>
            <Text style={styles.kpiLabel}>OUTSTANDING</Text>
            <Text style={styles.kpiValue}>{formatPGK(totalOutstanding)}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: Colors.dhlRed }]}>
            <Text style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.7)' }]}>OVERDUE</Text>
            <Text style={[styles.kpiValue, { color: Colors.white }]}>{formatPGK(overdueTotal)}</Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: Colors.dhlInk }]}>
            <Text style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.6)' }]}>PAID</Text>
            <Text style={[styles.kpiValue, { color: Colors.white }]}>{paidCount}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: Colors.dhlPanel }]}>
            <Text style={styles.kpiLabel}>TOTAL</Text>
            <Text style={styles.kpiValue}>{items.length}</Text>
          </View>
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map(f => (
            <TouchableOpacity
              key={f}
              testID={`inv-filter-${f.toLowerCase()}`}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
        ) : items.length === 0 ? (
          <View testID="invoices-empty" style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyText}>No invoices yet.</Text>
          </View>
        ) : (
          <View testID="invoices-list">
            {items.map(inv => {
              const tone = statusTone[inv.status] || statusTone.UNPAID;
              return (
                <View key={inv.invoiceNumber} testID={`invoice-row-${inv.invoiceNumber}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardInvNum}>{inv.invoiceNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusText, { color: tone.text }]}>{inv.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>Issued: {formatDate(inv.issueDate)}</Text>
                    <Text style={styles.metaText}>Due: {formatDate(inv.dueDate)}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardAmount}>{formatPGK(inv.totalPGK)}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity testID={`inv-pdf-${inv.invoiceNumber}`} style={styles.actionBtn} onPress={() => Alert.alert('PDF', `Invoice ${inv.invoiceNumber} PDF downloaded`)}>
                        <Ionicons name="document-text-outline" size={14} color={Colors.dhlText} />
                        <Text style={styles.actionBtnText}>PDF</Text>
                      </TouchableOpacity>
                      {inv.status !== 'PAID' && (
                        <TouchableOpacity testID={`inv-pay-${inv.invoiceNumber}`} style={styles.actionBtnRed} onPress={() => setPayInv(inv)}>
                          <Ionicons name="card-outline" size={14} color={Colors.dhlRed} />
                          <Text style={[styles.actionBtnText, { color: Colors.dhlRed }]}>PAY</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Pay Modal */}
      {payInv && <PayModal invoice={payInv} onClose={() => setPayInv(null)} onPaid={load} />}
    </SafeAreaView>
  );
}

function PayModal({ invoice, onClose, onPaid }: { invoice: any; onClose: () => void; onPaid: () => void }) {
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2027');
  const [cvv, setCvv] = useState('123');
  const [name, setName] = useState('Demo User');
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await api.post('/payments/charge', {
        cardNumber, expMonth: Number(expMonth), expYear: Number(expYear),
        cvv, cardholderName: name, amountPGK: invoice.totalPGK,
        invoiceNumber: invoice.invoiceNumber,
      });
      if (res.data.status === 'FAILED') {
        Alert.alert('Payment Failed', res.data.detail);
        return;
      }
      await api.post(`/invoices/${invoice.invoiceNumber}/pay`);
      Alert.alert('Success', `Payment successful · Ref ${res.data.referenceNumber}`);
      onPaid();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pay {invoice.invoiceNumber}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.dhlText} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.amountBanner}>
              <Text style={styles.amountLabel}>AMOUNT DUE</Text>
              <Text style={styles.amountValue}>{formatPGK(invoice.totalPGK)}</Text>
            </View>
            <View style={styles.demoNote}>
              <Text style={styles.demoNoteText}>
                Demo: <Text style={{ fontFamily: 'monospace', fontWeight: '700' }}>4111 1111 1111 1111</Text> = success
              </Text>
            </View>
            <PayField label="CARD NUMBER" value={cardNumber} onChangeText={setCardNumber} testID="pay-card-number" />
            <View style={styles.payRow}>
              <View style={{ flex: 1 }}><PayField label="MONTH" value={expMonth} onChangeText={setExpMonth} testID="pay-exp-month" keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><PayField label="YEAR" value={expYear} onChangeText={setExpYear} testID="pay-exp-year" keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><PayField label="CVV" value={cvv} onChangeText={setCvv} testID="pay-cvv" keyboardType="numeric" /></View>
            </View>
            <PayField label="CARDHOLDER NAME" value={name} onChangeText={setName} testID="pay-name" />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="pay-submit" style={[styles.payBtn, paying && { opacity: 0.6 }]} onPress={pay} disabled={paying}>
              {paying ? <ActivityIndicator color={Colors.dhlInk} /> : (
                <Text style={styles.payBtnText}>PAY {formatPGK(invoice.totalPGK)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PayField({ label, value, onChangeText, testID, keyboardType }: any) {
  return (
    <View style={styles.payFieldContainer}>
      <Text style={styles.payFieldLabel}>{label}</Text>
      <TextInput testID={testID} style={styles.payFieldInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType || 'default'} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  scroll: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 14, borderWidth: 1, borderColor: Colors.dhlBorder },
  kpiLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(0,0,0,0.5)', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '900', color: Colors.dhlText },
  filterScroll: { marginHorizontal: 16, marginVertical: 12 },
  filterContent: { gap: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.dhlPanel },
  filterChipActive: { backgroundColor: Colors.dhlYellow },
  filterChipText: { fontSize: 10, fontWeight: '700', color: Colors.dhlMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipTextActive: { color: Colors.dhlInk },
  center: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.dhlMuted, marginTop: 12 },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardInvNum: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaText: { fontSize: 12, color: Colors.dhlMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: 18, fontFamily: 'monospace', fontWeight: '900', color: Colors.dhlText },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  actionBtnRed: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, maxHeight: '85%', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText },
  modalScroll: { padding: 20, paddingBottom: 10 },
  amountBanner: { backgroundColor: Colors.dhlInk, padding: 16, marginBottom: 12 },
  amountLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlYellow },
  amountValue: { fontSize: 28, fontWeight: '900', color: Colors.white, marginTop: 4 },
  demoNote: { backgroundColor: Colors.dhlPanel, padding: 10, marginBottom: 12 },
  demoNoteText: { fontSize: 12, color: Colors.dhlMuted },
  payRow: { flexDirection: 'row', gap: 8 },
  payFieldContainer: { marginBottom: 12 },
  payFieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, textTransform: 'uppercase' },
  payFieldInput: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    padding: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1 },
  payBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk },
  payBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

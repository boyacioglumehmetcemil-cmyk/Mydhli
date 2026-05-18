import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/lib/api';
import { formatDate } from '../src/lib/shipmentUtils';

const DOC_TYPES: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  EXPORT_DECLARATION: 'Export Declaration',
};

const blankItem = { description: '', hsCode: '', quantity: 1, unitValue: 0, weightKg: 0, countryOfOrigin: 'PG' };
const blankParty = { name: '', company: '', address: '', city: '', country: '', postalCode: '' };

export default function Customs() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(null);

  const load = () => {
    setLoading(true);
    api.get('/customs').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({
      docType: 'COMMERCIAL_INVOICE',
      exporter: {
        name: `${user?.firstName} ${user?.lastName}`,
        company: user?.companyName || '', address: '12 Coronation Drive',
        city: 'Port Moresby', country: 'PG', postalCode: '121',
      },
      importer: { ...blankParty },
      items: [{ ...blankItem }],
      currency: 'USD',
      signedBy: `${user?.firstName} ${user?.lastName}`,
    });
    setModal(true);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...blankItem }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_: any, idx: number) => idx !== i) });
  const updateItem = (i: number, key: string, val: any) => {
    const next = [...form.items];
    next[i] = { ...next[i], [key]: val };
    setForm({ ...form, items: next });
  };

  const save = async () => {
    if (!form.importer.name || !form.importer.address) {
      Alert.alert('Error', 'Importer details required');
      return;
    }
    try {
      await api.post('/customs', form);
      Alert.alert('Success', 'Customs document created');
      setModal(false);
      load();
    } catch {
      Alert.alert('Error', 'Could not save');
    }
  };

  const total = form?.items?.reduce((s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unitValue) || 0), 0) || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="customs-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="customs-add" style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color={Colors.dhlInk} />
          <Text style={styles.addBtnText}>NEW DOC</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View testID="customs-page" style={styles.titleSection}>
          <Text style={styles.pageTitle}>Customs Documents</Text>
          <Text style={styles.pageSub}>Commercial invoices, packing lists, and export declarations.</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
        ) : items.length === 0 ? (
          <View testID="customs-empty" style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyText}>No customs documents yet.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openCreate}>
              <Text style={styles.primaryBtnText}>CREATE FIRST DOC</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View testID="customs-list">
            {items.map(d => (
              <View key={d.id} testID={`customs-row-${d.id}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>{DOC_TYPES[d.docType] || d.docType}</Text>
                  <Text style={styles.cardDate}>{formatDate(d.createdAt)}</Text>
                </View>
                <View style={styles.partiesRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partyLabel}>EXPORTER</Text>
                    <Text style={styles.partyName}>{d.exporter.company || d.exporter.name}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={Colors.dhlRed} />
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.partyLabel}>IMPORTER</Text>
                    <Text style={styles.partyName}>{d.importer.company || d.importer.name}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardValue}>{d.currency} {d.totalValueUSD?.toLocaleString()}</Text>
                  <TouchableOpacity
                    testID={`customs-pdf-${d.id}`}
                    style={styles.pdfLink}
                    onPress={() => Alert.alert('PDF', 'Customs PDF downloaded')}
                  >
                    <Text style={styles.pdfLinkText}>DOWNLOAD PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKav}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Customs Document</Text>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.dhlText} />
                </TouchableOpacity>
              </View>
              {form && (
                <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  {/* Doc Type */}
                  <Text style={styles.fieldLabel}>DOCUMENT TYPE</Text>
                  <View style={styles.docTypeRow}>
                    {Object.entries(DOC_TYPES).map(([k, v]) => (
                      <TouchableOpacity
                        key={k}
                        testID={k === form.docType ? 'customs-form-type' : undefined}
                        style={[styles.docTypeBtn, form.docType === k && styles.docTypeBtnActive]}
                        onPress={() => setForm({ ...form, docType: k })}
                      >
                        <Text style={[styles.docTypeBtnText, form.docType === k && styles.docTypeBtnTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Exporter */}
                  <Text style={styles.sectionLabel}>EXPORTER</Text>
                  <FormInput placeholder="Name" value={form.exporter.name} onChangeText={(v: string) => setForm({ ...form, exporter: { ...form.exporter, name: v } })} />
                  <FormInput placeholder="Company" value={form.exporter.company} onChangeText={(v: string) => setForm({ ...form, exporter: { ...form.exporter, company: v } })} />
                  <FormInput placeholder="Address" value={form.exporter.address} onChangeText={(v: string) => setForm({ ...form, exporter: { ...form.exporter, address: v } })} />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}><FormInput placeholder="City" value={form.exporter.city} onChangeText={(v: string) => setForm({ ...form, exporter: { ...form.exporter, city: v } })} /></View>
                    <View style={{ flex: 1 }}><FormInput placeholder="Country" value={form.exporter.country} onChangeText={(v: string) => setForm({ ...form, exporter: { ...form.exporter, country: v } })} /></View>
                  </View>

                  {/* Importer */}
                  <Text style={styles.sectionLabel}>IMPORTER</Text>
                  <FormInput placeholder="Name" value={form.importer.name} testID="customs-imp-name" onChangeText={(v: string) => setForm({ ...form, importer: { ...form.importer, name: v } })} />
                  <FormInput placeholder="Company" value={form.importer.company} onChangeText={(v: string) => setForm({ ...form, importer: { ...form.importer, company: v } })} />
                  <FormInput placeholder="Address" value={form.importer.address} onChangeText={(v: string) => setForm({ ...form, importer: { ...form.importer, address: v } })} />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}><FormInput placeholder="City" value={form.importer.city} onChangeText={(v: string) => setForm({ ...form, importer: { ...form.importer, city: v } })} /></View>
                    <View style={{ flex: 1 }}><FormInput placeholder="Country" value={form.importer.country} onChangeText={(v: string) => setForm({ ...form, importer: { ...form.importer, country: v } })} /></View>
                  </View>

                  {/* Items */}
                  <View style={styles.itemsHeader}>
                    <Text style={styles.sectionLabel}>ITEMS</Text>
                    <TouchableOpacity testID="customs-add-item" onPress={addItem}>
                      <Text style={styles.addItemText}>+ ADD ITEM</Text>
                    </TouchableOpacity>
                  </View>
                  {form.items.map((it: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <FormInput placeholder="Description" value={it.description} onChangeText={(v: string) => updateItem(idx, 'description', v)} />
                      <View style={styles.row}>
                        <View style={{ flex: 2 }}><FormInput placeholder="HS Code" value={it.hsCode} onChangeText={(v: string) => updateItem(idx, 'hsCode', v)} /></View>
                        <View style={{ flex: 1 }}><FormInput placeholder="Qty" value={String(it.quantity)} onChangeText={(v: string) => updateItem(idx, 'quantity', Number(v) || 0)} keyboardType="numeric" /></View>
                        <View style={{ flex: 1 }}><FormInput placeholder="Value" value={String(it.unitValue)} onChangeText={(v: string) => updateItem(idx, 'unitValue', Number(v) || 0)} keyboardType="numeric" /></View>
                      </View>
                      {form.items.length > 1 && (
                        <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeItemBtn}>
                          <Text style={styles.removeItemText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <Text style={styles.totalText}>Total: <Text style={{ color: Colors.dhlRed }}>{form.currency} {total.toFixed(2)}</Text></Text>

                  <Text style={styles.fieldLabel}>SIGNED BY</Text>
                  <FormInput value={form.signedBy} onChangeText={(v: string) => setForm({ ...form, signedBy: v })} />
                </ScrollView>
              )}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="customs-save" style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>SAVE & SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormInput({ placeholder, value, onChangeText, testID, keyboardType }: any) {
  return (
    <TextInput
      testID={testID}
      style={styles.formInput}
      value={value || ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.dhlMuted}
      keyboardType={keyboardType || 'default'}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  addBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  scroll: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  center: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.dhlMuted, marginTop: 12, marginBottom: 16 },
  primaryBtn: { height: 44, backgroundColor: Colors.dhlYellow, paddingHorizontal: 20, borderWidth: 2, borderColor: Colors.dhlInk, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardType: { fontSize: 15, fontWeight: '700', color: Colors.dhlText },
  cardDate: { fontSize: 12, color: Colors.dhlMuted },
  partiesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  partyLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlRed, textTransform: 'uppercase' },
  partyName: { fontSize: 13, color: Colors.dhlText, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  cardValue: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  pdfLink: { padding: 4 },
  pdfLinkText: { fontSize: 11, fontWeight: '800', color: Colors.dhlRed, letterSpacing: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKav: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, maxHeight: '90%', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText },
  modalScroll: { padding: 20, paddingBottom: 10 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8, marginTop: 16 },
  formInput: {
    height: 40, backgroundColor: Colors.dhlPanel, borderWidth: 1, borderColor: Colors.dhlBorder,
    paddingHorizontal: 10, fontSize: 13, color: Colors.dhlText, marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 6 },
  docTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  docTypeBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.dhlPanel },
  docTypeBtnActive: { backgroundColor: Colors.dhlYellow },
  docTypeBtnText: { fontSize: 11, fontWeight: '700', color: Colors.dhlMuted },
  docTypeBtnTextActive: { color: Colors.dhlInk },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  addItemText: { fontSize: 11, fontWeight: '800', color: Colors.dhlRed, letterSpacing: 1 },
  itemRow: { backgroundColor: Colors.dhlPanel, padding: 10, marginBottom: 8 },
  removeItemBtn: { alignSelf: 'flex-end', marginTop: 4 },
  removeItemText: { fontSize: 11, fontWeight: '700', color: Colors.dhlRed },
  totalText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText, textAlign: 'right', marginTop: 8 },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    padding: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk },
  saveBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

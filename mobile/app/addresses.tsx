import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';

const blank = {
  label: '', name: '', company: '', address: '', city: '', country: 'PG',
  postalCode: '', phone: '', email: '',
  isDefaultSender: false, isDefaultReceiver: false,
};

export default function Addresses() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [modal, setModal] = useState<{ mode: string; data: any } | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/addresses').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!modal) return;
    const d = modal.data;
    if (!d.label || !d.name || !d.address || !d.city || !d.country) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      if (modal.mode === 'create') {
        await api.post('/addresses', d);
        Alert.alert('Success', 'Address added');
      } else {
        await api.put(`/addresses/${d.id}`, d);
        Alert.alert('Success', 'Address updated');
      }
      setModal(null);
      load();
    } catch {
      Alert.alert('Error', 'Save failed');
    }
  };

  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/addresses/${id}`);
        Alert.alert('Deleted', 'Address removed');
        load();
      }},
    ]);
  };

  const setDefault = async (id: string, kind: string) => {
    await api.put(`/addresses/${id}/default`, { kind });
    Alert.alert('Success', `Set as default ${kind}`);
    load();
  };

  const filtered = items.filter(a =>
    tab === 'ALL' ||
    (tab === 'SENDERS' && a.isDefaultSender) ||
    (tab === 'RECEIVERS' && a.isDefaultReceiver)
  );

  const updateField = (key: string, val: string) => {
    if (!modal) return;
    setModal({ ...modal, data: { ...modal.data, [key]: val } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="addresses-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="add-address" style={styles.addBtn} onPress={() => setModal({ mode: 'create', data: { ...blank } })}>
          <Ionicons name="add" size={16} color={Colors.dhlInk} />
          <Text style={styles.addBtnText}>ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View testID="addresses-page" style={styles.titleSection}>
          <Text style={styles.pageTitle}>Address Book</Text>
          <Text style={styles.pageSub}>Saved senders and receivers — autofill any shipment.</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['ALL', 'SENDERS', 'RECEIVERS'].map(t => (
            <TouchableOpacity
              key={t}
              testID={`addr-tab-${t.toLowerCase()}`}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'ALL' ? 'All' : t === 'SENDERS' ? 'Senders' : 'Receivers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
        ) : filtered.length === 0 ? (
          <View testID="addresses-empty" style={styles.emptyCard}>
            <Ionicons name="book-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptyText}>Add your first address to autofill shipments.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setModal({ mode: 'create', data: { ...blank } })}>
              <Ionicons name="add" size={14} color={Colors.dhlInk} />
              <Text style={styles.primaryBtnText}>ADD ADDRESS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View testID="addresses-grid">
            {filtered.map(a => (
              <View key={a.id} testID={`address-card-${a.id}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardLabel}>{a.label}</Text>
                  <View style={styles.badgeRow}>
                    {a.isDefaultSender && (
                      <View style={styles.senderBadge}><Text style={styles.senderBadgeText}>Sender</Text></View>
                    )}
                    {a.isDefaultReceiver && (
                      <View style={styles.receiverBadge}><Text style={styles.receiverBadgeText}>Receiver</Text></View>
                    )}
                  </View>
                </View>
                <Text style={styles.cardName}>{a.name}</Text>
                {a.company ? <Text style={styles.cardCompany}>{a.company}</Text> : null}
                <Text style={styles.cardAddr}>{a.address}</Text>
                <Text style={styles.cardAddr}>{a.city}, {a.country} {a.postalCode}</Text>
                {a.phone ? <Text style={styles.cardPhone}>{a.phone}</Text> : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity testID={`addr-edit-${a.id}`} style={styles.iconBtn} onPress={() => setModal({ mode: 'edit', data: a })}>
                    <Ionicons name="create-outline" size={16} color={Colors.dhlMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity testID={`addr-default-sender-${a.id}`} style={styles.iconBtn} onPress={() => setDefault(a.id, 'sender')}>
                    <Ionicons name="star-outline" size={16} color={Colors.dhlYellowDark} />
                  </TouchableOpacity>
                  <TouchableOpacity testID={`addr-delete-${a.id}`} style={[styles.iconBtn, { marginLeft: 'auto' }]} onPress={() => remove(a.id)}>
                    <Ionicons name="trash-outline" size={16} color={Colors.dhlRed} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKav}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modal?.mode === 'create' ? 'Add Address' : 'Edit Address'}</Text>
                <TouchableOpacity onPress={() => setModal(null)}>
                  <Ionicons name="close" size={24} color={Colors.dhlText} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <ModalField label="Label *" value={modal?.data.label} onChangeText={v => updateField('label', v)} testID="addr-form-label" placeholder="e.g. Head Office" />
                <ModalField label="Full Name *" value={modal?.data.name} onChangeText={v => updateField('name', v)} testID="addr-form-name" />
                <ModalField label="Company" value={modal?.data.company} onChangeText={v => updateField('company', v)} />
                <ModalField label="Country *" value={modal?.data.country} onChangeText={v => updateField('country', v)} />
                <ModalField label="Address *" value={modal?.data.address} onChangeText={v => updateField('address', v)} testID="addr-form-address" />
                <ModalField label="City *" value={modal?.data.city} onChangeText={v => updateField('city', v)} testID="addr-form-city" />
                <ModalField label="Postal Code" value={modal?.data.postalCode} onChangeText={v => updateField('postalCode', v)} />
                <ModalField label="Phone" value={modal?.data.phone} onChangeText={v => updateField('phone', v)} keyboardType="phone-pad" />
                <ModalField label="Email" value={modal?.data.email} onChangeText={v => updateField('email', v)} keyboardType="email-address" />
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="addr-form-save" style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ModalField = ({ label, value, onChangeText, testID, placeholder, keyboardType }: any) => (
  <View style={styles.modalFieldContainer}>
    <Text style={styles.modalFieldLabel}>{label}</Text>
    <TextInput
      testID={testID}
      style={styles.modalFieldInput}
      value={value || ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.dhlMuted}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

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
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: Colors.dhlPanel, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.white },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.dhlMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: Colors.dhlInk },
  center: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: {
    marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 32, alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 20 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 44,
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 20, borderWidth: 2, borderColor: Colors.dhlInk,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  card: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlRed, textTransform: 'uppercase' },
  badgeRow: { flexDirection: 'row', gap: 4 },
  senderBadge: { backgroundColor: Colors.dhlYellow, paddingHorizontal: 6, paddingVertical: 2 },
  senderBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.dhlInk, textTransform: 'uppercase', letterSpacing: 0.5 },
  receiverBadge: { backgroundColor: Colors.dhlInk, paddingHorizontal: 6, paddingVertical: 2 },
  receiverBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.dhlYellow, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.dhlText },
  cardCompany: { fontSize: 13, color: Colors.dhlMuted, marginTop: 1 },
  cardAddr: { fontSize: 12, color: Colors.dhlMuted },
  cardPhone: { fontSize: 12, color: Colors.dhlMuted, marginTop: 4 },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },
  iconBtn: { padding: 8 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKav: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, maxHeight: '85%', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText },
  modalScroll: { padding: 20, paddingBottom: 10 },
  modalFieldContainer: { marginBottom: 12 },
  modalFieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, textTransform: 'uppercase' },
  modalFieldInput: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    padding: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlText, letterSpacing: 1 },
  saveBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk,
  },
  saveBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';

const statusTone: Record<string, { bg: string; text: string; dot: string }> = {
  SCHEDULED: { bg: 'rgba(255,204,0,0.3)', text: Colors.dhlInk, dot: Colors.dhlYellow },
  COMPLETED: { bg: Colors.green100, text: Colors.green900, dot: Colors.green600 },
  CANCELLED: { bg: Colors.red100, text: Colors.dhlRed, dot: Colors.dhlRed },
};

export default function Pickups() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/pickups').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cancel = (id: string) => {
    Alert.alert('Cancel Pickup', 'Cancel this pickup?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        await api.delete(`/pickups/${id}`);
        Alert.alert('Cancelled', 'Pickup cancelled');
        load();
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="pickups-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="schedule-pickup-btn" style={styles.addBtn} onPress={() => router.push('/schedule-pickup')}>
          <Ionicons name="add" size={16} color={Colors.dhlInk} />
          <Text style={styles.addBtnText}>SCHEDULE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View testID="pickups-page" style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Pickups</Text>
          <Text style={styles.pageSub}>Scheduled courier collections.</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.dhlYellow} /></View>
        ) : items.length === 0 ? (
          <View testID="pickups-empty" style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>No pickups scheduled</Text>
            <Text style={styles.emptyText}>Book a courier to collect your first shipment.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/schedule-pickup')}>
              <Text style={styles.primaryBtnText}>SCHEDULE NOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View testID="pickups-list">
            {items.map(p => {
              const t = statusTone[p.status] || statusTone.SCHEDULED;
              return (
                <View key={p.id} testID={`pickup-row-${p.confirmationNumber}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardConf}>{p.confirmationNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: t.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: t.dot }]} />
                      <Text style={[styles.statusText, { color: t.text }]}>{p.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardName}>{p.addressSnapshot.name}</Text>
                  <Text style={styles.cardAddr}>{p.addressSnapshot.address}, {p.addressSnapshot.city}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>{p.packageCount} pc · {p.totalWeightKg} kg</Text>
                    <Text style={styles.metaText}>{p.scheduledDate}</Text>
                    <Text style={styles.metaMono}>{p.scheduledWindow}</Text>
                  </View>
                  {p.status === 'SCHEDULED' && (
                    <TouchableOpacity
                      testID={`pickup-cancel-${p.id}`}
                      style={styles.cancelBtn}
                      onPress={() => cancel(p.id)}
                    >
                      <Text style={styles.cancelBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  addBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  scroll: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: Colors.dhlMuted, marginTop: 4 },
  center: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: {
    marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 32, alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 20 },
  primaryBtn: {
    height: 44, backgroundColor: Colors.dhlYellow, paddingHorizontal: 24,
    borderWidth: 2, borderColor: Colors.dhlInk, justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  card: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardConf: { fontSize: 14, fontFamily: 'monospace', fontWeight: '700', color: Colors.dhlText },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.dhlText },
  cardAddr: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaText: { fontSize: 12, color: Colors.dhlMuted },
  metaMono: { fontSize: 12, fontFamily: 'monospace', color: Colors.dhlText },
  cancelBtn: {
    marginTop: 12, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  cancelBtnText: { fontSize: 11, fontWeight: '800', color: Colors.dhlRed, letterSpacing: 1.5 },
});

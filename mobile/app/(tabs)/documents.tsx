/**
 * Documents tab — PHASE 2 PLACEHOLDER.
 *
 * Real list & PDF preview (482 anonymised PDFs) ship in Phase 3 with the
 * react-native-webview integration. This screen exists now so the tab bar
 * has its final 5-slot shape and routing parity with the web sidebar.
 *
 * NO "Generate Documents" button. Handover (Phase 8.4c) forbids it.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';

export default function DocumentsTab() {
  const [totalDocs, setTotalDocs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api.get('/documents', { params: { page_size: 1 } })
      .then((r) => {
        if (!active) return;
        const total = r.data?.total ?? (Array.isArray(r.data?.items) ? r.data.items.length : null);
        setTotalDocs(typeof total === 'number' ? total : null);
      })
      .catch(() => { /* swallow — placeholder copy still renders */ });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DOCUMENTS</Text>
          <Text style={styles.title}>Operational paperwork</Text>
          <Text style={styles.subtitle}>
            Every house bill of lading, packing list, certificate of origin, customs declaration
            and proof of delivery executed across your account.
          </Text>
        </View>

        <View testID="documents-placeholder" style={styles.placeholder}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text" size={28} color={Colors.dhlRed} />
          </View>
          <Text style={styles.placeholderTitle}>Document library</Text>
          {totalDocs !== null ? (
            <Text style={styles.placeholderCount}>
              <Text style={styles.placeholderCountNum}>{totalDocs.toLocaleString()}</Text> documents indexed
            </Text>
          ) : null}
          <Text style={styles.placeholderBody}>
            Inline PDF preview, type filters and download actions arrive in the next phase.
            For now you can open each shipment from the Shipments tab to see its individual
            document count.
          </Text>
          <View style={styles.kicker}>
            <Ionicons name="hourglass-outline" size={14} color={Colors.dhlMuted} />
            <Text style={styles.kickerText}>Phase 3 — coming soon</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.dhlMuted, marginTop: 6, lineHeight: 20 },
  placeholder: {
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder,
    marginHorizontal: 16, marginTop: 16,
    paddingHorizontal: 24, paddingVertical: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.red100,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  placeholderTitle: { fontSize: 18, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.3 },
  placeholderCount: { fontSize: 12, color: Colors.dhlMuted, marginTop: 6 },
  placeholderCountNum: { fontWeight: '900', color: Colors.dhlText, fontSize: 14 },
  placeholderBody: {
    fontSize: 13, color: Colors.dhlMuted, lineHeight: 20,
    textAlign: 'center', marginTop: 12,
  },
  kicker: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.dhlPanel,
    borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  kickerText: { fontSize: 11, fontWeight: '700', color: Colors.dhlMuted, letterSpacing: 1 },
});

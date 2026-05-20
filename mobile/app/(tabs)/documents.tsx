/**
 * Documents tab — myDHLi mobile redesign (Faz 9 zero-data).
 *
 * Empty until the document library is wired to the logbook. No fetches,
 * no filters — just the page banner and a single empty-state panel.
 * Phase 8.4c forbids any doc-creation affordances here.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import HeaderBell from '../../src/components/HeaderBell';
import PageBanner from '../../src/components/PageBanner';
import EmptyState from '../../src/components/EmptyState';

export default function DocumentsTab() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PageBanner
        title="Documents"
        icon="document-text-outline"
        right={<HeaderBell />}
        testID="documents-banner"
      />
      <ScrollView contentContainerStyle={styles.content} testID="documents-page">
        <EmptyState
          icon="document-text-outline"
          title="No documents yet"
          message="Operational paperwork (invoices, packing lists, B/Ls) will appear here once your logbook is linked."
          testID="documents-empty"
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  content: { paddingTop: 8, paddingBottom: 32 },
});

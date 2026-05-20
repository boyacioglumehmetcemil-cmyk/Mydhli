/**
 * Shipments tab — myDHLi mobile redesign (Faz 9 zero-data).
 *
 * The shipment list intentionally renders empty until the logbook
 * integration is wired up. Word image11/12 reference: yellow page banner
 * with icon circle + title, followed by a single empty-state panel.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import HeaderBell from '../../src/components/HeaderBell';
import PageBanner from '../../src/components/PageBanner';
import EmptyState from '../../src/components/EmptyState';

export default function ShipmentsTab() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PageBanner
        title="Shipments"
        icon="cube-outline"
        right={<HeaderBell />}
        testID="shipments-banner"
      />
      <ScrollView contentContainerStyle={styles.content} testID="shipments-page">
        <EmptyState
          icon="cube-outline"
          title="No shipments yet"
          message="Once your shipment logbook is linked, your bookings and milestones will appear here."
          testID="shipments-empty"
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

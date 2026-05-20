/**
 * Home tab — myDHLi mobile dashboard (Faz 9 zero-data redesign).
 *
 * Word image11/12 reference. The dashboard intentionally starts empty —
 * shipment, invoice, and pickup data will flow in once the logbook
 * integration is wired up.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import HeaderBell from '../../src/components/HeaderBell';
import PageBanner from '../../src/components/PageBanner';
import EmptyState from '../../src/components/EmptyState';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    router.replace('/');
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top header */}
      <View style={styles.header}>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>DHL</Text>
          <Text style={styles.logoAccent}> Forwarding</Text>
        </View>
        <View style={styles.headerRight}>
          <HeaderBell />
          <TouchableOpacity
            testID="dashboard-settings-btn"
            onPress={() => router.push('/settings' as never)}
            style={styles.headerIcon}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.dhlText} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="dashboard-logout-btn"
            onPress={handleLogout}
            style={styles.headerIcon}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.dhlRed} />
          </TouchableOpacity>
        </View>
      </View>

      <PageBanner
        title="On-Time Performance"
        icon="time-outline"
        testID="dashboard-banner"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="dashboard-page"
      >
        {/* Greeting block */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>myDHLi</Text>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user?.firstName || 'there'}.
          </Text>
          <Text style={styles.welcomeSub}>
            Your shipment performance will appear here once your logbook
            has been integrated.
          </Text>
        </View>

        {/* KPI placeholder row (numbers blank) */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>SHIPMENTS</Text>
            <Text style={styles.kpiValue}>—</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ON-TIME</Text>
            <Text style={styles.kpiValue}>—</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OUTSTANDING</Text>
            <Text style={styles.kpiValue}>—</Text>
          </View>
        </View>

        <EmptyState
          icon="cube-outline"
          title="No shipments yet"
          message="Once your shipment logbook is linked, your bookings and milestones will appear here."
          testID="dashboard-empty"
        />

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: 'cube' as const, label: 'Shipments', route: '/(tabs)/shipments', testID: 'quick-shipments' },
            { icon: 'document-text' as const, label: 'Documents', route: '/(tabs)/documents', testID: 'quick-documents' },
            { icon: 'search' as const, label: 'Track', route: '/(tabs)/track', testID: 'quick-track' },
            { icon: 'calendar' as const, label: 'Pickup', route: '/schedule-pickup', testID: 'quick-pickup' },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              testID={a.testID}
              style={styles.actionTile}
              onPress={() => router.push(a.route as never)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={18} color={Colors.dhlInk} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dhlBorder,
    backgroundColor: Colors.white,
  },
  logoPill: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: Colors.dhlRed, letterSpacing: -0.5 },
  logoAccent: { fontSize: 13, fontWeight: '700', color: Colors.dhlInk },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIcon: { padding: 8 },
  scroll: { flex: 1, backgroundColor: Colors.dhlPanel },
  content: { paddingBottom: 32 },
  welcome: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dhlRed,
    letterSpacing: 2,
    marginBottom: 6,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: Colors.dhlInk, marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: Colors.dhlMuted, lineHeight: 18 },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.dhlBorder,
    borderRadius: 6,
    padding: 14,
  },
  kpiLabel: { fontSize: 9, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 1.2, marginBottom: 6 },
  kpiValue: { fontSize: 26, fontWeight: '900', color: Colors.dhlInk },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dhlMuted,
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  actionTile: {
    width: '48%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.dhlBorder,
    borderRadius: 6,
    padding: 14,
    alignItems: 'flex-start',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dhlYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.dhlInk },
});

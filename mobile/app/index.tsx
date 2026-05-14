import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import BrandWordmark from '../src/components/BrandWordmark';

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dhlYellow} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BrandWordmark size="md" />
          {isAuthenticated ? (
            <TouchableOpacity
              testID="landing-dashboard-btn"
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.headerBtnText}>Dashboard</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="landing-signin-btn"
              style={styles.headerBtn}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.headerBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero */}
        <View style={styles.hero} testID="landing-hero">
          <Text style={styles.heroLabel}>myDHLi · GLOBAL FORWARDING</Text>
          <Text style={styles.heroTitle}>Move freight{'\n'}worldwide.</Text>
          <Text style={styles.heroSub}>
            Air, ocean and road freight forwarding tailored for global businesses.
            Book, track and pay from one portal.
          </Text>
          <View style={styles.heroBtns}>
            {isAuthenticated ? (
              <TouchableOpacity
                testID="hero-ship-btn"
                style={styles.primaryBtn}
                onPress={() => router.push('/(tabs)/ship')}
              >
                <Text style={styles.primaryBtnText}>BOOK FREIGHT</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.dhlInk} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="hero-get-started-btn"
                style={styles.primaryBtn}
                onPress={() => router.push('/register')}
              >
                <Text style={styles.primaryBtnText}>OPEN ACCOUNT</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.dhlInk} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="hero-track-btn"
              style={styles.secondaryBtn}
              onPress={() => router.push('/track')}
            >
              <Text style={styles.secondaryBtnText}>TRACK SHIPMENT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Strip — freight forwarding KPIs */}
        <View style={styles.statsStrip}>
          {[
            { val: '3', label: 'Freight Modes' },
            { val: '180+', label: 'Containers MTD' },
            { val: '4.4d', label: 'Avg Transit' },
            { val: '24/7', label: 'Ops Support' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT WE DO</Text>
          <Text style={styles.sectionTitle}>Freight forwarding · PNG</Text>
          {[
            { icon: 'airplane' as const, title: 'Air Freight', desc: 'Priority + economy, HAWB-tracked', route: isAuthenticated ? '/(tabs)/ship' : '/login' },
            { icon: 'boat' as const, title: 'Ocean Freight', desc: 'FCL & LCL with weekly sailings', route: isAuthenticated ? '/(tabs)/ship' : '/login' },
            { icon: 'car-sport' as const, title: 'Road Freight', desc: 'Domestic milk-runs + project cargo', route: isAuthenticated ? '/(tabs)/ship' : '/login' },
            { icon: 'search' as const, title: 'Track Shipment', desc: 'Look up any HAWB, BL or container', route: '/track' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              testID={`landing-action-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              style={styles.actionCard}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.dhlInk} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dhlMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoBanner}>
          <Text style={styles.demoLabel}>DEMO CREDENTIALS</Text>
          <Text style={styles.demoText}>demo@dhlpng.com / Demo@2026</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 DHL Global Forwarding PNG · Demo Build
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  logoPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  logoText: { fontSize: 18, fontWeight: '900', color: Colors.dhlInk },
  logoAccent: { fontSize: 18, fontWeight: '900', color: Colors.dhlRed },
  headerBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.dhlInk,
  },
  headerBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  hero: { padding: 24, paddingTop: 32, backgroundColor: Colors.white },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 12 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: Colors.dhlText, letterSpacing: -1, lineHeight: 40, marginBottom: 16 },
  heroSub: { fontSize: 14, color: Colors.dhlMuted, lineHeight: 22, marginBottom: 24 },
  heroBtns: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  secondaryBtn: {
    paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  statsStrip: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: Colors.dhlInk, paddingVertical: 24, paddingHorizontal: 16,
  },
  statItem: { width: '50%', paddingVertical: 12, paddingHorizontal: 8 },
  statVal: { fontSize: 28, fontWeight: '900', color: Colors.dhlYellow },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  section: { padding: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  sectionTitle: { fontSize: 26, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginBottom: 20 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.dhlBorder, marginBottom: 12,
  },
  actionIcon: {
    width: 44, height: 44, backgroundColor: Colors.dhlYellow,
    justifyContent: 'center', alignItems: 'center',
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dhlText, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: Colors.dhlMuted },
  demoBanner: {
    marginHorizontal: 24, padding: 16,
    backgroundColor: Colors.dhlPanel, borderLeftWidth: 3, borderLeftColor: Colors.dhlYellow,
  },
  demoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 4 },
  demoText: { fontSize: 13, fontFamily: 'monospace', color: Colors.dhlText },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 11, color: Colors.dhlMuted },
});

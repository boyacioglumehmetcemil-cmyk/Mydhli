import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/AuthContext';

const menuItems = [
  { icon: 'send' as const, label: 'Ship Now', sub: 'Book a new shipment', route: '/ship' },
  { icon: 'calculator' as const, label: 'Get a Quote', sub: 'Instant rate estimates', route: '/quote' },
  { icon: 'calendar' as const, label: 'Schedule Pickup', sub: 'Arrange a freight pickup', route: '/schedule-pickup' },
  { icon: 'time' as const, label: 'My Pickups', sub: 'Scheduled collections', route: '/pickups' },
  { icon: 'book' as const, label: 'Parties', sub: 'Shipper, consignee & notify directory', route: '/addresses' },
  { icon: 'receipt' as const, label: 'Invoices', sub: 'Billing history & payments', route: '/invoices' },
  { icon: 'bar-chart' as const, label: 'Reports', sub: 'Account analytics', route: '/reports' },
  { icon: 'document-text' as const, label: 'Customs', sub: 'Customs documents', route: '/customs' },
  { icon: 'settings' as const, label: 'Settings', sub: 'Profile, security & more', route: '/settings' },
];

export default function More() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    router.replace('/');
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userCompany}>{user?.companyName}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              testID={`more-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.dhlInk} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dhlBorder} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity testID="more-logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.dhlRed} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>DHL Global Forwarding PNG · Demo Build v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 16, marginBottom: 16,
    padding: 20, borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.dhlYellow,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: Colors.dhlInk },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.dhlText },
  userEmail: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  userCompany: { fontSize: 12, color: Colors.dhlMuted },
  menuSection: {
    backgroundColor: Colors.white, marginHorizontal: 16,
    borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  menuIcon: {
    width: 40, height: 40, backgroundColor: Colors.dhlPanel,
    justifyContent: 'center', alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.dhlText },
  menuSub: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 20, paddingVertical: 16,
    borderWidth: 2, borderColor: Colors.dhlRed,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: Colors.dhlRed, letterSpacing: 1 },
  versionText: { textAlign: 'center', fontSize: 11, color: Colors.dhlMuted, marginTop: 16 },
});

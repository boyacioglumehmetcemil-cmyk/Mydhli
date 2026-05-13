import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/lib/api';

type TabKey = 'profile' | 'business' | 'security' | 'notifications' | 'api';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'business', label: 'Business', icon: 'business-outline' },
  { key: 'security', label: 'Security', icon: 'lock-closed-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'api', label: 'API Access', icon: 'code-slash-outline' },
];

const NOTIF_EVENTS = [
  ['shipmentCreated', 'Shipment Created'],
  ['outForDelivery', 'Out for Delivery'],
  ['delivered', 'Delivered'],
  ['invoiceIssued', 'Invoice Issued'],
  ['pickupConfirmation', 'Pickup Confirmation'],
];

export default function Settings() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('profile');

  // Profile
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', companyName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, companyName: user.companyName });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', profile);
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  // Password
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) { Alert.alert('Error', "Passwords don't match"); return; }
    try {
      await api.put('/auth/password', { currentPassword: pwd.current, newPassword: pwd.next });
      Alert.alert('Success', 'Password updated');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed');
    }
  };

  // Notifications
  const [prefs, setPrefs] = useState<any>(null);
  useEffect(() => {
    api.get('/notifications/preferences').then(r => setPrefs(r.data)).catch(() => {});
  }, []);

  const toggle = (event: string, channel: string) => {
    if (!prefs) return;
    const next = { ...prefs, [event]: { ...prefs[event], [channel]: !prefs[event]?.[channel] } };
    setPrefs(next);
    api.put('/notifications/preferences', next).catch(() => Alert.alert('Error', 'Sync failed'));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View testID="settings-page" style={styles.titleSection}>
            <Text style={styles.pageTitle}>Settings</Text>
            <Text style={styles.pageSub}>Manage your account, security, and notifications.</Text>
          </View>

          {/* Tab selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
            {tabs.map(t => (
              <TouchableOpacity
                key={t.key}
                testID={`settings-tab-${t.key}`}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Ionicons name={t.icon as any} size={16} color={tab === t.key ? Colors.dhlInk : Colors.dhlMuted} />
                <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content */}
          <View style={styles.contentCard}>
            {tab === 'profile' && (
              <>
                <Text style={styles.sectionTitle}>Profile</Text>
                <FieldLabel label="FIRST NAME" />
                <TextInput testID="settings-firstName" style={styles.input} value={profile.firstName} onChangeText={v => setProfile({ ...profile, firstName: v })} />
                <FieldLabel label="LAST NAME" />
                <TextInput testID="settings-lastName" style={styles.input} value={profile.lastName} onChangeText={v => setProfile({ ...profile, lastName: v })} />
                <FieldLabel label="EMAIL" />
                <View style={styles.disabledInput}><Text style={styles.disabledText}>{user?.email || ''}</Text></View>
                <FieldLabel label="PHONE" />
                <TextInput testID="settings-phone" style={styles.input} value={profile.phone} onChangeText={v => setProfile({ ...profile, phone: v })} />
                <TouchableOpacity testID="settings-save-profile" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.dhlInk} /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
                </TouchableOpacity>
              </>
            )}

            {tab === 'business' && (
              <>
                <Text style={styles.sectionTitle}>Business</Text>
                <FieldLabel label="COMPANY NAME" />
                <TextInput style={styles.input} value={profile.companyName} onChangeText={v => setProfile({ ...profile, companyName: v })} />
                <FieldLabel label="DEFAULT CURRENCY" />
                <View style={styles.disabledInput}><Text style={styles.disabledText}>PGK (Locked)</Text></View>
                <FieldLabel label="TAX / VAT ID" />
                <View style={styles.disabledInput}><Text style={styles.disabledText}>—</Text></View>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                  <Text style={styles.saveBtnText}>SAVE</Text>
                </TouchableOpacity>
              </>
            )}

            {tab === 'security' && (
              <>
                <Text style={styles.sectionTitle}>Security</Text>
                <FieldLabel label="CURRENT PASSWORD" />
                <TextInput testID="pwd-current" style={styles.input} value={pwd.current} onChangeText={v => setPwd({ ...pwd, current: v })} secureTextEntry />
                <FieldLabel label="NEW PASSWORD" />
                <TextInput testID="pwd-new" style={styles.input} value={pwd.next} onChangeText={v => setPwd({ ...pwd, next: v })} secureTextEntry />
                <FieldLabel label="CONFIRM NEW PASSWORD" />
                <TextInput testID="pwd-confirm" style={styles.input} value={pwd.confirm} onChangeText={v => setPwd({ ...pwd, confirm: v })} secureTextEntry />
                <TouchableOpacity testID="pwd-submit" style={styles.saveBtn} onPress={changePwd}>
                  <Text style={styles.saveBtnText}>UPDATE PASSWORD</Text>
                </TouchableOpacity>
                <View style={styles.sessionSection}>
                  <Text style={styles.sessionTitle}>Active Sessions</Text>
                  <View style={styles.sessionCard}>
                    <View>
                      <Text style={styles.sessionDevice}>This device · Current</Text>
                      <Text style={styles.sessionMeta}>Mobile · Last activity just now</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.green500} />
                  </View>
                </View>
              </>
            )}

            {tab === 'notifications' && (
              <>
                <Text style={styles.sectionTitle}>Notification Preferences</Text>
                {!prefs ? (
                  <ActivityIndicator color={Colors.dhlYellow} />
                ) : (
                  <>
                    <View style={styles.notifHeader}>
                      <Text style={[styles.notifHeaderText, { flex: 2 }]}>Event</Text>
                      <Text style={[styles.notifHeaderText, { flex: 1, textAlign: 'center' }]}>Email</Text>
                      <Text style={[styles.notifHeaderText, { flex: 1, textAlign: 'center' }]}>SMS</Text>
                    </View>
                    {NOTIF_EVENTS.map(([k, label]) => (
                      <View key={k} style={styles.notifRow}>
                        <Text style={[styles.notifLabel, { flex: 2 }]}>{label}</Text>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Switch
                            testID={`notif-${k}-email`}
                            value={prefs[k]?.email}
                            onValueChange={() => toggle(k, 'email')}
                            trackColor={{ false: Colors.dhlBorder, true: Colors.dhlYellow }}
                            thumbColor={Colors.white}
                          />
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Switch
                            testID={`notif-${k}-sms`}
                            value={prefs[k]?.sms}
                            onValueChange={() => toggle(k, 'sms')}
                            trackColor={{ false: Colors.dhlBorder, true: Colors.dhlYellow }}
                            thumbColor={Colors.white}
                          />
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            {tab === 'api' && (
              <>
                <Text style={styles.sectionTitle}>API Access</Text>
                <View style={styles.apiCard}>
                  <View style={styles.apiBadge}><Text style={styles.apiBadgeText}>COMING Q2 2026</Text></View>
                  <Text style={styles.apiTitle}>Programmatic Access</Text>
                  <Text style={styles.apiDesc}>
                    Generate API keys to integrate DHL Global Forwarding into your back-office. REST + Webhooks. SDKs for Python, Node and PHP.
                  </Text>
                  <View style={styles.apiCodeBlock}>
                    <Text style={styles.apiCode}>
                      $ curl -H "Authorization: Bearer dhl_xxxx"{'\n'}    https://api.dhlpng.com/v1/shipments
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.saveBtn, { opacity: 0.5, backgroundColor: Colors.dhlInk }]} disabled>
                    <Text style={[styles.saveBtnText, { color: Colors.white }]}>GENERATE KEY (LOCKED)</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
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
  tabScroll: { marginHorizontal: 16, marginVertical: 12 },
  tabContent: { gap: 4 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
  },
  tabBtnActive: { borderColor: Colors.dhlYellow, backgroundColor: 'rgba(255,204,0,0.1)', borderLeftWidth: 3, borderLeftColor: Colors.dhlYellow },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dhlMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabBtnTextActive: { color: Colors.dhlInk },
  contentCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText, marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, fontSize: 14, color: Colors.dhlText },
  disabledInput: { height: 44, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder, paddingHorizontal: 12, justifyContent: 'center' },
  disabledText: { fontSize: 14, color: Colors.dhlMuted },
  saveBtn: {
    height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dhlInk, marginTop: 20,
  },
  saveBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  // Security
  sessionSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dhlText, marginBottom: 12 },
  sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dhlPanel, padding: 16 },
  sessionDevice: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  sessionMeta: { fontSize: 12, color: Colors.dhlMuted, marginTop: 2 },
  // Notifications
  notifHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  notifHeaderText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Colors.dhlMuted, textTransform: 'uppercase' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  notifLabel: { fontSize: 13, color: Colors.dhlText },
  // API
  apiCard: { backgroundColor: Colors.dhlPanel, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 20 },
  apiBadge: { backgroundColor: Colors.dhlYellow, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, marginBottom: 12 },
  apiBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1 },
  apiTitle: { fontSize: 18, fontWeight: '700', color: Colors.dhlText, marginBottom: 8 },
  apiDesc: { fontSize: 13, color: Colors.dhlMuted, lineHeight: 20, marginBottom: 16 },
  apiCodeBlock: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 12, marginBottom: 16 },
  apiCode: { fontSize: 11, fontFamily: 'monospace', color: Colors.dhlMuted },
});

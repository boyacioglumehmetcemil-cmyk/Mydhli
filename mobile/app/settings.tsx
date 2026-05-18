/**
 * Settings — 4-tab Phase 5 rewrite.
 *
 * Tabs (web parity /dashboard/settings):
 *   1. Profile          → PUT /api/auth/me
 *   2. Notifications    → GET/PUT /api/notifications/preferences
 *   3. Account Security → PUT /api/auth/password (+ 2FA placeholder)
 *   4. Billing          → PUT /api/auth/me (billing sub-fields)
 *
 * NO doc-creation affordances. "PROVISION KEY (LOCKED)" copy from earlier
 * phases is preserved on the integrations sub-section in Account Security.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Switch, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/lib/api';

type TabKey = 'profile' | 'notifications' | 'security' | 'billing';

interface NotifPref {
  email?: boolean;
  sms?: boolean;
}
interface NotifPrefs {
  [eventType: string]: NotifPref;
}

const EVENT_LABELS: { key: string; label: string; subtitle: string }[] = [
  { key: 'shipmentUpdates', label: 'Shipment status updates', subtitle: 'Status changes for every booking' },
  { key: 'pickupConfirmation', label: 'Pickup confirmations', subtitle: 'When a pickup is scheduled or completed' },
  { key: 'deliveryConfirmation', label: 'Delivery confirmations', subtitle: 'POD events and arrival notifications' },
  { key: 'invoiceReady', label: 'Invoice ready', subtitle: 'A new invoice has been issued' },
  { key: 'paymentReceipt', label: 'Payment receipt', subtitle: 'After a successful invoice payment' },
];

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('profile');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: (user as { companyName?: string } | null)?.companyName || '',
    phone: user?.phone || '',
  });

  // Billing state (we use the same PUT /api/auth/me endpoint with billing keys).
  const [billing, setBilling] = useState({
    billingEmail: '',
    taxId: '',
    billingContact: '',
  });

  // Notification prefs state
  const [prefs, setPrefs] = useState<NotifPrefs>({});
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Password state
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Load notification preferences once.
  const loadPrefs = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const r = await api.get('/notifications/preferences');
      setPrefs(r.data || {});
    } catch {
      setPrefs({});
    } finally {
      setPrefsLoading(false);
    }
  }, []);
  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  // Reset profile state when user changes.
  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      company: (user as { companyName?: string } | null)?.companyName || '',
      phone: user.phone || '',
    });
  }, [user]);

  const flash = (msg: string) => {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(null), 2400);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        companyName: profile.company,
        phone: profile.phone,
      });
      await refreshUser();
      flash('Profile saved');
    } catch {
      flash('Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const saveBilling = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', {
        billingEmail: billing.billingEmail,
        taxId: billing.taxId,
        billingContact: billing.billingContact,
      });
      flash('Billing details saved');
    } catch {
      flash('Could not save billing details');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (eventKey: string, channel: 'email' | 'sms') => {
    setPrefs((prev) => {
      const next = { ...prev };
      next[eventKey] = { ...(next[eventKey] || {}), [channel]: !next[eventKey]?.[channel] };
      // Debounced save
      api.put('/notifications/preferences', next).catch(() => undefined);
      return next;
    });
  };

  const savePassword = async () => {
    setPwdError(null);
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      setPwdError('All fields are required'); return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdError('New password fields do not match'); return;
    }
    if (pwd.next.length < 8) {
      setPwdError('Use at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: pwd.current, newPassword: pwd.next });
      setPwd({ current: '', next: '', confirm: '' });
      flash('Password updated');
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setPwdError(status === 401 ? 'Current password is incorrect' : 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
    { key: 'security', label: 'Security', icon: 'lock-closed' },
    { key: 'billing', label: 'Billing', icon: 'card' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity testID="settings-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>More</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              testID={`settings-tab-${t.key}`}
              onPress={() => setTab(t.key)}
              style={[styles.tabChip, active && styles.tabChipActive]}
            >
              <Ionicons name={t.icon} size={14} color={active ? Colors.dhlInk : Colors.dhlMuted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {savedFlash && (
          <View style={styles.flash}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.green600} />
            <Text style={styles.flashTxt}>{savedFlash}</Text>
          </View>
        )}

        {tab === 'profile' && (
          <View testID="settings-pane-profile">
            <Section title="PROFILE DETAILS">
              <Field label="First name" value={profile.firstName} onChangeText={(v: string) => setProfile((p) => ({ ...p, firstName: v }))} testID="settings-firstName" />
              <Field label="Last name" value={profile.lastName} onChangeText={(v: string) => setProfile((p) => ({ ...p, lastName: v }))} testID="settings-lastName" />
              <Field label="Company" value={profile.company} onChangeText={(v: string) => setProfile((p) => ({ ...p, company: v }))} testID="settings-company" />
              <Field label="Phone" value={profile.phone} onChangeText={(v: string) => setProfile((p) => ({ ...p, phone: v }))} testID="settings-phone" keyboardType="phone-pad" />
              <ReadOnlyField label="Email" value={user?.email || ''} />
              <PrimaryBtn label="SAVE PROFILE" loading={saving} onPress={saveProfile} testID="settings-save-profile" />
            </Section>
          </View>
        )}

        {tab === 'notifications' && (
          <View testID="settings-pane-notifications">
            <Section title="NOTIFICATION PREFERENCES">
              {prefsLoading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.dhlYellow} /></View>
              ) : (
                <>
                  <View style={styles.prefHead}>
                    <Text style={[styles.prefHeadLabel, { flex: 1 }]} />
                    <Text style={styles.prefHeadLabel}>EMAIL</Text>
                    <Text style={styles.prefHeadLabel}>SMS</Text>
                  </View>
                  {EVENT_LABELS.map((ev) => {
                    const p = prefs[ev.key] || {};
                    return (
                      <View key={ev.key} style={styles.prefRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefName}>{ev.label}</Text>
                          <Text style={styles.prefSub}>{ev.subtitle}</Text>
                        </View>
                        <Switch
                          testID={`settings-pref-${ev.key}-email`}
                          value={!!p.email}
                          onValueChange={() => togglePref(ev.key, 'email')}
                          trackColor={{ false: Colors.dhlBorder, true: Colors.dhlYellow }}
                          thumbColor={Colors.white}
                          ios_backgroundColor={Colors.dhlBorder}
                        />
                        <Switch
                          testID={`settings-pref-${ev.key}-sms`}
                          value={!!p.sms}
                          onValueChange={() => togglePref(ev.key, 'sms')}
                          trackColor={{ false: Colors.dhlBorder, true: Colors.dhlYellow }}
                          thumbColor={Colors.white}
                          ios_backgroundColor={Colors.dhlBorder}
                        />
                      </View>
                    );
                  })}
                </>
              )}
            </Section>
          </View>
        )}

        {tab === 'security' && (
          <View testID="settings-pane-security">
            <Section title="CHANGE PASSWORD">
              <Field
                label="Current password"
                value={pwd.current}
                onChangeText={(v: string) => setPwd((p) => ({ ...p, current: v }))}
                secureTextEntry
                testID="settings-pwd-current"
              />
              <Field
                label="New password"
                value={pwd.next}
                onChangeText={(v: string) => setPwd((p) => ({ ...p, next: v }))}
                secureTextEntry
                testID="settings-pwd-new"
              />
              <Field
                label="Confirm new password"
                value={pwd.confirm}
                onChangeText={(v: string) => setPwd((p) => ({ ...p, confirm: v }))}
                secureTextEntry
                testID="settings-pwd-confirm"
              />
              {pwdError ? <Text style={styles.errTxt}>{pwdError}</Text> : null}
              <PrimaryBtn label="UPDATE PASSWORD" loading={saving} onPress={savePassword} testID="settings-save-password" />
            </Section>

            <Section title="TWO-FACTOR AUTHENTICATION">
              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>SMS / authenticator 2FA</Text>
                  <Text style={styles.lockedSub}>Coming soon — reach out to your account manager to opt-in early.</Text>
                </View>
                <View style={styles.lockedBadge}><Text style={styles.lockedBadgeTxt}>LOCKED</Text></View>
              </View>
            </Section>

            <Section title="API ACCESS">
              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>Integration keys</Text>
                  <Text style={styles.lockedSub}>Provision API keys to integrate DHL Global Forwarding into your back-office. REST + Webhooks. SDKs for Python, Node and PHP.</Text>
                </View>
                <View style={[styles.lockedBadge, { backgroundColor: Colors.dhlMuted }]}><Text style={[styles.lockedBadgeTxt, { color: Colors.white }]}>PROVISION KEY (LOCKED)</Text></View>
              </View>
            </Section>
          </View>
        )}

        {tab === 'billing' && (
          <View testID="settings-pane-billing">
            <Section title="BILLING CONTACT">
              <Field
                label="Billing contact name"
                value={billing.billingContact}
                onChangeText={(v: string) => setBilling((b) => ({ ...b, billingContact: v }))}
                testID="settings-billing-contact"
              />
              <Field
                label="Billing email"
                value={billing.billingEmail}
                onChangeText={(v: string) => setBilling((b) => ({ ...b, billingEmail: v }))}
                testID="settings-billing-email"
                keyboardType="email-address"
              />
              <Field
                label="Tax ID / VAT number"
                value={billing.taxId}
                onChangeText={(v: string) => setBilling((b) => ({ ...b, taxId: v }))}
                testID="settings-billing-taxId"
              />
              <PrimaryBtn label="SAVE BILLING DETAILS" loading={saving} onPress={saveBilling} testID="settings-save-billing" />
            </Section>

            <Section title="INVOICE ADDRESS">
              <View style={styles.lockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>Default invoice address</Text>
                  <Text style={styles.lockedSub}>Choose from your Parties directory. Manage parties under More → Parties.</Text>
                </View>
                <TouchableOpacity
                  testID="settings-billing-open-parties"
                  onPress={() => router.push('/addresses' as never)}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkBtnTxt}>OPEN PARTIES</Text>
                </TouchableOpacity>
              </View>
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Small components ───────────────────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Field = ({
  label, value, onChangeText, testID, secureTextEntry, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  testID?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      testID={testID}
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      placeholderTextColor={Colors.dhlMuted}
    />
  </View>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldInput, { backgroundColor: Colors.dhlPanel, justifyContent: 'center' }]}>
      <Text style={{ color: Colors.dhlMuted, fontFamily: 'monospace' }}>{value || '—'}</Text>
    </View>
  </View>
);

const PrimaryBtn = ({
  label, onPress, loading, testID,
}: { label: string; onPress: () => void; loading?: boolean; testID?: string }) => (
  <TouchableOpacity testID={testID} onPress={onPress} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.6 }]}>
    {loading ? <ActivityIndicator color={Colors.dhlInk} size="small" /> : <Text style={styles.primaryBtnTxt}>{label}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 60 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  topbarTitle: { fontSize: 16, fontWeight: '900', color: Colors.dhlText },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder },
  tabChipActive: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlInk },
  tabLabel: { fontSize: 11, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 0.5 },
  tabLabelActive: { color: Colors.dhlInk },
  content: { paddingBottom: 32 },
  flash: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 12, marginBottom: 8, backgroundColor: Colors.green100, borderWidth: 1, borderColor: Colors.green600, paddingHorizontal: 12, paddingVertical: 8 },
  flashTxt: { fontSize: 12, fontWeight: '700', color: Colors.green900 },
  section: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, marginHorizontal: 12, marginBottom: 12, padding: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 12 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: Colors.dhlMuted, marginBottom: 5 },
  fieldInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 14, color: Colors.dhlText, minHeight: 40 },
  primaryBtn: { backgroundColor: Colors.dhlYellow, borderWidth: 2, borderColor: Colors.dhlInk, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnTxt: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  errTxt: { fontSize: 11, color: Colors.dhlRed, marginBottom: 8, fontWeight: '700' },
  prefHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  prefHeadLabel: { fontSize: 9, fontWeight: '900', color: Colors.dhlMuted, letterSpacing: 1, width: 50, textAlign: 'center' },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder },
  prefName: { fontSize: 13, fontWeight: '700', color: Colors.dhlText },
  prefSub: { fontSize: 10, color: Colors.dhlMuted, marginTop: 2 },
  lockedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lockedTitle: { fontSize: 13, fontWeight: '700', color: Colors.dhlText },
  lockedSub: { fontSize: 11, color: Colors.dhlMuted, marginTop: 4, lineHeight: 16 },
  lockedBadge: { backgroundColor: Colors.dhlBorder, paddingHorizontal: 8, paddingVertical: 4 },
  lockedBadgeTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: Colors.dhlMuted },
  linkBtn: { backgroundColor: Colors.dhlYellow, borderWidth: 1, borderColor: Colors.dhlInk, paddingHorizontal: 10, paddingVertical: 6 },
  linkBtnTxt: { fontSize: 10, fontWeight: '900', color: Colors.dhlInk, letterSpacing: 1 },
  center: { padding: 32, alignItems: 'center' },
});

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';

const calcStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: Colors.dhlBorder };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  const stages = [
    { label: 'Too short', color: Colors.dhlRed },
    { label: 'Weak', color: Colors.dhlRed },
    { label: 'Fair', color: Colors.orange400 },
    { label: 'Good', color: Colors.dhlYellow },
    { label: 'Strong', color: Colors.green500 },
    { label: 'Excellent', color: Colors.green600 },
  ];
  const s = stages[Math.min(score, stages.length - 1)];
  return { score, label: s.label, color: s.color };
};

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    companyName: '', phone: '',
  });
  const [agree, setAgree] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => calcStrength(form.password), [form.password]);
  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (!agree) { Alert.alert('Error', 'Please accept the Terms & Conditions'); return; }
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(), password: form.password,
        companyName: form.companyName.trim(), country: 'PG',
        phone: `+675 ${form.phone.trim()}`,
      };
      const user = await register(payload);
      Alert.alert('Welcome', `Account created — welcome, ${user.firstName}!`);
      router.replace('/(tabs)');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg || 'Registration failed' : 'Registration failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <View style={styles.logoPill}>
                <Text style={styles.logoText}>DHL</Text>
                <Text style={styles.logoAccent}> Forwarding</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity testID="register-signin-link" onPress={() => router.push('/login')}>
              <Text style={styles.signinLink}>Sign In →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>OPEN ACCOUNT</Text>
            <Text style={styles.title}>Start shipping in{'\n'}two minutes.</Text>
            <Text style={styles.subtitle}>Create your myDHLi account.</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>FIRST NAME</Text>
                <TextInput testID="register-firstname-input" style={styles.input} value={form.firstName} onChangeText={v => update('firstName', v)} placeholder="Jane" placeholderTextColor={Colors.dhlMuted} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>LAST NAME</Text>
                <TextInput testID="register-lastname-input" style={styles.input} value={form.lastName} onChangeText={v => update('lastName', v)} placeholder="Boroko" placeholderTextColor={Colors.dhlMuted} />
              </View>
            </View>

            <Text style={styles.inputLabel}>WORK EMAIL</Text>
            <TextInput testID="register-email-input" style={styles.input} value={form.email} onChangeText={v => update('email', v)} placeholder="jane@company.com.pg" placeholderTextColor={Colors.dhlMuted} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput testID="register-password-input" style={[styles.input, { paddingRight: 48 }]} value={form.password} onChangeText={v => update('password', v)} placeholder="Min. 8 characters" placeholderTextColor={Colors.dhlMuted} secureTextEntry={!showPwd} />
              <TouchableOpacity testID="register-toggle-password" style={styles.eyeBtn} onPress={() => setShowPwd(!showPwd)}>
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color={Colors.dhlMuted} />
              </TouchableOpacity>
            </View>
            {form.password ? (
              <View testID="password-strength" style={styles.strengthRow}>
                <View style={styles.strengthBarContainer}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength.score ? strength.color : Colors.dhlBorder }]} />
                  ))}
                </View>
                <Text style={styles.strengthText}>Strength: <Text style={{ fontWeight: '800', color: Colors.dhlText }}>{strength.label}</Text></Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <TextInput testID="register-confirm-password-input" style={styles.input} value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} placeholder="Re-enter password" placeholderTextColor={Colors.dhlMuted} secureTextEntry={!showPwd} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>COMPANY NAME</Text>
                <TextInput testID="register-company-input" style={styles.input} value={form.companyName} onChangeText={v => update('companyName', v)} placeholder="Your business" placeholderTextColor={Colors.dhlMuted} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>PHONE</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>+675</Text></View>
                  <TextInput testID="register-phone-input" style={[styles.input, styles.phoneInput]} value={form.phone} onChangeText={v => update('phone', v.replace(/[^\d ]/g, ''))} placeholder="7000 0000" placeholderTextColor={Colors.dhlMuted} keyboardType="phone-pad" />
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>COUNTRY</Text>
            <View style={styles.lockedField}><Text style={styles.lockedText}>Papua New Guinea</Text><Text style={styles.lockedCode}>Locked · PG</Text></View>

            {/* T&C */}
            <TouchableOpacity testID="register-tnc-checkbox" style={styles.agreeRow} onPress={() => setAgree(!agree)}>
              <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                {agree && <Ionicons name="checkmark" size={14} color={Colors.dhlInk} />}
              </View>
              <Text style={styles.agreeText}>I agree to the Terms of Service and Privacy Policy. This is a demo build.</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity testID="register-submit-button" style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.dhlInk} /> : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitText}>CREATE MY ACCOUNT</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.dhlInk} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  logoPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  logoText: { fontSize: 14, fontWeight: '900', color: Colors.dhlInk },
  logoAccent: { fontSize: 14, fontWeight: '900', color: Colors.dhlRed },
  signinLink: { fontSize: 13, fontWeight: '800', color: Colors.dhlText },
  form: { padding: 24 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.dhlMuted, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 6, marginTop: 14 },
  input: {
    height: 48, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder,
    paddingHorizontal: 14, fontSize: 15, color: Colors.dhlText,
  },
  passwordRow: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  strengthRow: { marginTop: 6 },
  strengthBarContainer: { flexDirection: 'row', gap: 3 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, color: Colors.dhlMuted, marginTop: 4 },
  phoneRow: { flexDirection: 'row' },
  phonePrefix: { height: 48, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: Colors.dhlInk },
  phonePrefixText: { color: Colors.white, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  phoneInput: { flex: 1, borderLeftWidth: 0 },
  lockedField: {
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder,
  },
  lockedText: { fontSize: 14, fontWeight: '600', color: Colors.dhlText },
  lockedCode: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlMuted, textTransform: 'uppercase' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20, marginBottom: 24 },
  checkbox: {
    width: 22, height: 22, borderWidth: 2, borderColor: Colors.dhlBorder,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.dhlYellow, borderColor: Colors.dhlYellow },
  agreeText: { flex: 1, fontSize: 13, color: Colors.dhlText, lineHeight: 20 },
  submitBtn: {
    height: 48, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

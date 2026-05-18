import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ImageBackground, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import BrandWordmark from '../src/components/BrandWordmark';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1670121180530-cfcba4438038?crop=entropy&cs=srgb&fm=jpg&w=1600&q=70';

const SUPPORT_EMAIL = 'support@dhlpng.com';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Sign in', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Sign-in failed';
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const openMail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=myDHLi%20-%20PNG%20support`).catch(() => {});
  };

  return (
    <View style={styles.root}>
      {/* TOP YELLOW BAR */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar} testID="login-topbar">
          <BrandWordmark size="md" />
          <TouchableOpacity
            testID="login-contact-us"
            onPress={openMail}
            style={styles.contactRow}
          >
            <Text style={styles.contactText}>Contact us</Text>
            <Ionicons name="open-outline" size={14} color={Colors.dhlRed} style={styles.contactIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* BODY — IMAGE BACKGROUND */}
      <ImageBackground
        source={{ uri: BG_IMAGE }}
        style={styles.bg}
        resizeMode="cover"
        testID="login-bg-image"
      >
        <View style={styles.bgOverlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.cardWrap}>
              <View style={styles.card} testID="login-card">
                <Text style={styles.cardTitle}>Welcome to myDHLi</Text>

                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  testID="login-email"
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.dhlMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    testID="login-password"
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor={Colors.dhlMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    testID="login-password-toggle"
                    style={styles.eyeBtn}
                    onPress={() => setShowPwd(!showPwd)}
                  >
                    <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color={Colors.dhlMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  testID="login-forgot"
                  onPress={() => router.push('/forgot-password')}
                  style={styles.forgotRow}
                >
                  <Text style={styles.forgotText}>Forgot your password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="login-submit"
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.submitText}>Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.openAccountRow}>
                  <Text style={styles.openAccountText}>New to myDHLi? </Text>
                  <TouchableOpacity
                    testID="login-open-account"
                    onPress={() => router.push('/register')}
                  >
                    <Text style={styles.openAccountLink}>Open an account</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.demoHint} testID="login-demo-hint">
                  <Text style={styles.demoHintLabel}>DEMO</Text>
                  <Text style={styles.demoHintText}>demo@dhlpng.com  /  Demo@2026</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* BOTTOM FOOTER BAR */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <View style={styles.footerBar} testID="login-footer">
          <View style={styles.footerLeft}>
            <BrandWordmark size="sm" showSub={false} />
            <View style={styles.footerLinks}>
              <TouchableOpacity testID="login-footer-privacy" onPress={openMail}>
                <Text style={styles.footerLink}>Privacy Notice</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity testID="login-footer-terms" onPress={openMail}>
                <Text style={styles.footerLink}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity testID="login-footer-legal" onPress={openMail}>
                <Text style={styles.footerLink}>Legal Notice</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity testID="login-footer-contact" onPress={openMail}>
                <Text style={styles.footerLink}>Contact us</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.localePill} testID="login-locale-picker">
            <Ionicons name="globe-outline" size={14} color={Colors.dhlInk} />
            <Text style={styles.localeText}>PG</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.dhlInk} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dhlYellow },
  flex: { flex: 1 },

  // top bar
  topBarSafe: { backgroundColor: Colors.dhlYellow },
  topBar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dhlYellow,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactText: { color: Colors.dhlRed, fontSize: 13, fontWeight: '700' },
  contactIcon: { marginLeft: 4 },

  // image background body
  bg: { flex: 1, width: '100%' },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32 },
  cardWrap: { alignItems: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dhlText,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.dhlMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.dhlBorder,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.dhlText,
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 13 },
  forgotRow: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 20 },
  forgotText: { fontSize: 13, fontWeight: '700', color: Colors.dhlRed, textDecorationLine: 'underline' },
  submitBtn: {
    height: 48,
    backgroundColor: Colors.dhlRed,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: Colors.white, fontSize: 14, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  openAccountRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  openAccountText: { fontSize: 12, color: Colors.dhlMuted },
  openAccountLink: { fontSize: 12, fontWeight: '700', color: Colors.dhlRed, textDecorationLine: 'underline' },
  demoHint: {
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dhlBorder,
    alignItems: 'center',
  },
  demoHintLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted },
  demoHintText: { fontSize: 11, color: Colors.dhlText, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // footer
  footerSafe: { backgroundColor: Colors.white },
  footerBar: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dhlBorder,
    backgroundColor: Colors.white,
  },
  footerLeft: { flex: 1, paddingRight: 12 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  footerLink: { fontSize: 10, color: Colors.dhlMuted, fontWeight: '600' },
  footerDot: { fontSize: 10, color: Colors.dhlMuted, marginHorizontal: 6 },
  localePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dhlBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  localeText: { fontSize: 11, fontWeight: '700', color: Colors.dhlInk, marginHorizontal: 4 },
});

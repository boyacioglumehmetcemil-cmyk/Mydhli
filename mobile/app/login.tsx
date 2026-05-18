import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ImageBackground, Image, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1670121180530-cfcba4438038?crop=entropy&cs=srgb&fm=jpg&w=1600&q=70';

const SUPPORT_EMAIL = 'support@dhlpng.com';

// Official DHL Global Forwarding marks (Faz 7.1)
const LOGO_HORIZONTAL = require('../assets/brand/dhl_gf_horizontal.png');
const LOGO_STACKED = require('../assets/brand/dhl_gf_stacked.png');

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
          <Image
            source={LOGO_HORIZONTAL}
            style={styles.topLogo}
            resizeMode="contain"
            accessibilityLabel="DHL Global Forwarding"
          />
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
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* BOTTOM FOOTER BAR */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <View style={styles.footerBar} testID="login-footer">
          <View style={styles.footerLeft}>
            <Image
              source={LOGO_STACKED}
              style={styles.footerLogo}
              resizeMode="contain"
              accessibilityLabel="DHL Global Forwarding"
            />
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFCC00' },
  flex: { flex: 1 },

  // top bar — exact #FFCC00 to match the logo PNG's own yellow background
  topBarSafe: { backgroundColor: '#FFCC00' },
  topBar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFCC00',
  },
  topLogo: { width: 92, height: 36, alignSelf: 'flex-start' },
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
    backgroundColor: '#FFFFFF',
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

  // footer
  footerSafe: { backgroundColor: '#F2F2F2' },
  footerBar: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dhlBorder,
    backgroundColor: '#F2F2F2',
  },
  footerLeft: { flex: 1, alignItems: 'center' },
  footerLogo: { width: 128, height: 40 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 6, flexWrap: 'wrap' },
  footerLink: { fontSize: 10, color: Colors.dhlMuted, fontWeight: '600' },
  footerDot: { fontSize: 10, color: Colors.dhlMuted, marginHorizontal: 6 },
});

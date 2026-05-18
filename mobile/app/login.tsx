import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Linking, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

const SUPPORT_EMAIL = 'support@dhlpng.com';

// Official DHL Global Forwarding marks
const LOGO_HORIZONTAL = require('../assets/brand/dhl_gf_horizontal.png');
const LOGO_STACKED_WHITE = require('../assets/brand/dhl_gf_stacked_white.png');

// ---------------- Floating-label input ----------------
type FloatingInputProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password';
  testID?: string;
  trailing?: React.ReactNode;
};

function FloatingInput({
  label, value, onChangeText, secureTextEntry, keyboardType,
  autoCapitalize, autoComplete, testID, trailing,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || value.length > 0 ? 1 : 0,
      duration: 140,
      useNativeDriver: false,
    }).start();
  }, [focused, value, anim]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 6] });
  const labelFontSize = anim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666666', '#333333'],
  });

  return (
    <View style={[styles.fieldWrap, focused && styles.fieldWrapFocused]}>
      <Animated.Text
        style={[styles.fieldLabel, { top: labelTop, fontSize: labelFontSize, color: labelColor }]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        testID={testID}
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
      {trailing ? <View style={styles.fieldTrailing}>{trailing}</View> : null}
    </View>
  );
}

// ---------------- Login screen ----------------
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
            <Ionicons name="open-outline" size={14} color="#000000" style={styles.contactIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* BODY — white, no card, no BG image */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrap} testID="login-card">
            <Text style={styles.heading}>Welcome to myDHLi</Text>

            <FloatingInput
              testID="login-email"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <FloatingInput
              testID="login-password"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              autoComplete="password"
              trailing={
                <TouchableOpacity
                  testID="login-password-toggle"
                  onPress={() => setShowPwd(!showPwd)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color="#666666" />
                </TouchableOpacity>
              }
            />

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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER — left-aligned, white bg */}
          <View style={styles.footer} testID="login-footer">
            <Image
              source={LOGO_STACKED_WHITE}
              style={styles.footerLogo}
              resizeMode="contain"
              accessibilityLabel="DHL Global Forwarding"
            />
            <TouchableOpacity style={styles.localeRow} testID="login-locale-picker">
              <Text style={styles.localeText}>English</Text>
              <Ionicons name="chevron-down" size={14} color="#000000" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.footerLinks}>
              <TouchableOpacity testID="login-footer-privacy" onPress={openMail}>
                <Text style={styles.footerLink}>Privacy Notice</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="login-footer-terms" onPress={openMail}>
                <Text style={styles.footerLink}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="login-footer-legal" onPress={openMail}>
                <Text style={styles.footerLink}>Legal Notice</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="login-footer-contact" onPress={openMail}>
                <Text style={styles.footerLink}>Contact us</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.copyright} testID="login-copyright">
              © DHL Global Forwarding Management GmbH. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },

  // top bar
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
  contactText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  contactIcon: { marginLeft: 4 },

  // body
  bodyScroll: { flex: 1, backgroundColor: '#FFFFFF' },
  bodyContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },

  // form
  formWrap: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  heading: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 28,
    letterSpacing: -0.3,
  },

  // field
  fieldWrap: {
    height: 56,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    paddingHorizontal: 14,
    marginBottom: 12,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  fieldWrapFocused: { borderColor: '#333333', borderWidth: 1.5 },
  fieldLabel: {
    position: 'absolute',
    left: 14,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
  fieldInput: {
    height: 30,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 15,
    color: '#1A1A1A',
    outlineStyle: 'none',
  } as any,
  fieldTrailing: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // forgot + submit
  forgotRow: { alignSelf: 'center', marginTop: 18, marginBottom: 22 },
  forgotText: {
    fontSize: 14,
    color: '#000000',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#D40511',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // footer
  footer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  footerLogo: { width: 128, height: 40, marginBottom: 16 },
  localeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  localeText: { fontSize: 14, color: '#000000', fontWeight: '500' },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
    marginBottom: 16,
  },
  footerLink: { fontSize: 14, color: '#000000', fontWeight: '500' },
  copyright: { fontSize: 12, color: '#888888', lineHeight: 18 },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      Alert.alert('Welcome', `Welcome back, ${user.firstName}`);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Sign-in failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity testID="login-back-home" onPress={() => router.back()}>
              <View style={styles.logoPill}>
                <Text style={styles.logoText}>DHL</Text>
                <Text style={styles.logoAccent}> Express</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>MYDHL EXPRESS</Text>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>Sign in to ship, track and manage your PNG account.</Text>

            {/* Email */}
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="you@company.com.pg"
              placeholderTextColor={Colors.dhlMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Password */}
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                testID="login-password-input"
                style={[styles.input, styles.passwordInput]}
                placeholder="Your password"
                placeholderTextColor={Colors.dhlMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoComplete="password"
              />
              <TouchableOpacity
                testID="login-toggle-password"
                style={styles.eyeBtn}
                onPress={() => setShowPwd(!showPwd)}
              >
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color={Colors.dhlMuted} />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              testID="login-forgot-link"
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotRow}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.dhlInk} />
              ) : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.dhlInk} />
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity testID="login-register-link" onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Open Account →</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            <View style={styles.demoBanner}>
              <Text style={styles.demoLabel}>DEMO CREDENTIALS</Text>
              <Text style={styles.demoText}>demo@dhlpng.com / Demo@2026</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  logoPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dhlYellow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  logoText: { fontSize: 16, fontWeight: '900', color: Colors.dhlInk },
  logoAccent: { fontSize: 16, fontWeight: '900', color: Colors.dhlRed },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.dhlMuted, marginBottom: 28 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 8, marginTop: 16 },
  input: {
    height: 48, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder,
    paddingHorizontal: 16, fontSize: 15, color: Colors.dhlText,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  forgotRow: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
  forgotText: { fontSize: 13, fontWeight: '700', color: Colors.dhlRed },
  submitBtn: {
    height: 48, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.dhlBorder },
  registerText: { fontSize: 13, color: Colors.dhlMuted },
  registerLink: { fontSize: 13, fontWeight: '800', color: Colors.dhlText },
  demoBanner: {
    marginTop: 24, padding: 12, backgroundColor: Colors.dhlPanel,
    borderLeftWidth: 3, borderLeftColor: Colors.dhlYellow,
  },
  demoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 4 },
  demoText: { fontSize: 12, fontFamily: 'monospace', color: Colors.dhlText },
});

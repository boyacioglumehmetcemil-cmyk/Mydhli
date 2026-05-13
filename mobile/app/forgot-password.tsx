import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import api from '../src/lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPill}>
            <Text style={styles.logoText}>DHL</Text>
            <Text style={styles.logoAccent}> Forwarding</Text>
          </View>
          <TouchableOpacity testID="forgot-back-to-login" onPress={() => router.push('/login')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color={Colors.dhlText} />
            <Text style={styles.backText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!sent ? (
            <>
              <Text style={styles.label}>ACCOUNT RECOVERY</Text>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter the email you registered with and we'll send you instructions to reset your password.
              </Text>

              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                testID="forgot-email-input"
                style={styles.input}
                placeholder="you@company.com.pg"
                placeholderTextColor={Colors.dhlMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                testID="forgot-submit-button"
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={Colors.dhlInk} /> : (
                  <Text style={styles.submitText}>SEND RESET LINK</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View testID="forgot-success" style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-open" size={32} color={Colors.dhlRed} />
              </View>
              <Text style={styles.successTitle}>Check your inbox.</Text>
              <Text style={styles.successSub}>
                If an account exists for <Text style={{ fontWeight: '700', color: Colors.dhlText }}>{email}</Text>, we've sent a reset link.
              </Text>
              <Text style={styles.demoNote}>(Demo build — no real email is sent.)</Text>
              <TouchableOpacity testID="forgot-return-link" style={styles.returnBtn} onPress={() => router.push('/login')}>
                <Ionicons name="arrow-back" size={16} color={Colors.white} />
                <Text style={styles.returnText}>BACK TO SIGN IN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, fontWeight: '700', color: Colors.dhlText },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.dhlRed, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '900', color: Colors.dhlText, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.dhlMuted, lineHeight: 22, marginBottom: 28 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.dhlText, marginBottom: 8 },
  input: {
    height: 48, backgroundColor: Colors.dhlPanel, borderWidth: 2, borderColor: Colors.dhlBorder,
    paddingHorizontal: 16, fontSize: 15, color: Colors.dhlText, marginBottom: 24,
  },
  submitBtn: {
    height: 48, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
  submitText: { fontSize: 13, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
  successContainer: { alignItems: 'center' },
  successIcon: {
    width: 64, height: 64, borderRadius: 0, backgroundColor: 'rgba(255,204,0,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: Colors.dhlText, marginBottom: 12 },
  successSub: { fontSize: 14, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 8 },
  demoNote: { fontSize: 12, color: Colors.dhlMuted, fontStyle: 'italic', marginBottom: 24 },
  returnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dhlInk, paddingHorizontal: 24, paddingVertical: 14,
  },
  returnText: { fontSize: 13, fontWeight: '800', color: Colors.white, letterSpacing: 1.5 },
});

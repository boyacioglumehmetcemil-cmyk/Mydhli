/**
 * Default (native) PDF viewer — fallback sibling for `import './_viewer'`.
 *
 * Metro picks `_viewer.web.tsx` for the web target and this file
 * (no platform extension) for iOS / Android. The native build naturally
 * resolves this file because `react-native-webview` only ships native
 * implementations. Important: keeping the file name without a `.native`
 * suffix means the web bundle CAN actually shadow it via the standard
 * platform-extension resolver — adding a `.native` suffix re-introduces
 * the file into the web dependency graph (Metro dev-mode behaviour).
 *
 * Uses Strategy (A) from Phase 3: inline `source.headers` so the initial
 * GET to `/api/documents/{id}/preview` carries the Bearer JWT.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export interface DocumentViewerProps {
  documentId: string;
  previewUrl: string;
  token: string | null;
}

export default function DocumentViewerNative({
  documentId: _documentId, previewUrl, token,
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  if (!token) {
    return (
      <View testID="document-token-loading" style={styles.center}>
        <ActivityIndicator size="large" color={Colors.dhlYellow} />
        <Text style={styles.loadingText}>Authenticating…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View testID="document-error" style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color={Colors.dhlRed} />
        <Text style={styles.errTitle}>Failed to load document</Text>
        <Text style={styles.errBody}>{error}</Text>
        <Text
          testID="document-error-retry"
          onPress={() => { setError(null); setLoading(true); setRetryNonce((n) => n + 1); }}
          style={styles.retryBtn}
        >
          TRY AGAIN
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <WebView
        key={`webview-${retryNonce}`}
        testID="document-webview"
        source={{
          uri: previewUrl,
          headers: { Authorization: `Bearer ${token}` },
        }}
        style={styles.webview}
        originWhitelist={['*']}
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          const desc = e?.nativeEvent?.description || 'Unknown WebView error';
          setError(`Could not render the PDF in-app. ${desc}`);
        }}
        onHttpError={(e) => {
          setLoading(false);
          const code = e?.nativeEvent?.statusCode || '?';
          setError(`Backend returned HTTP ${code} for the preview.`);
        }}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode={Platform.OS === 'android' ? 'always' : undefined}
        javaScriptEnabled
        domStorageEnabled
      />
      {loading && (
        <View pointerEvents="none" style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={Colors.dhlYellow} />
          <Text style={styles.loadingText}>Loading PDF…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#2A2A2A' },
  webview: { flex: 1, backgroundColor: '#2A2A2A' },
  loaderOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
    backgroundColor: '#2A2A2A',
  },
  loadingText: { fontSize: 12, color: Colors.white, marginTop: 12 },
  errTitle: { fontSize: 16, fontWeight: '900', color: Colors.white, marginTop: 12, marginBottom: 4, textAlign: 'center' },
  errBody: { fontSize: 12, color: Colors.gray400, textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  retryBtn: {
    fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5,
    backgroundColor: Colors.dhlYellow,
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 2, borderColor: Colors.dhlInk,
  },
});

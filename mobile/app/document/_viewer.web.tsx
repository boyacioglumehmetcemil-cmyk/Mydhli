/**
 * Web PDF viewer (Expo Web target).
 *
 * react-native-webview has no web implementation — mounting it in a
 * browser bundle renders a placeholder warning string. To avoid that
 * path entirely, this file lives behind Metro's `.web.tsx` platform
 * extension: it is the ONLY viewer module included in the browser
 * bundle, and it never imports `react-native-webview`.
 *
 * Strategy:
 *   1. Authenticated fetch → `Authorization: Bearer <jwt>`
 *   2. `await res.blob()` → binary PDF in memory
 *   3. `URL.createObjectURL(blob)` → `blob:https://…` URL
 *   4. Render via DOM <iframe> (the browser's native PDF viewer handles it)
 *   5. `URL.revokeObjectURL(…)` on unmount / id change
 *
 * Same `DocumentViewerProps` contract as the native sibling so the shell
 * (`app/document/[id].tsx`) is platform-agnostic.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export interface DocumentViewerProps {
  documentId: string;
  previewUrl: string;
  token: string | null;
}

export default function DocumentViewerWeb({
  documentId, previewUrl, token,
}: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!documentId || !token || !previewUrl) return undefined;

    let cancelled = false;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        const res = await fetch(previewUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Backend returned HTTP ${res.status} for the preview.`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setLoading(false);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load document';
        setError(msg);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [documentId, token, previewUrl, retryNonce]);

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
      {blobUrl
        ? React.createElement('iframe', {
            'data-testid': 'document-webview',
            src: blobUrl,
            title: 'Document preview',
            style: {
              width: '100%',
              height: '100%',
              border: 0,
              backgroundColor: '#2A2A2A',
              display: 'block',
            },
          })
        : null}
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

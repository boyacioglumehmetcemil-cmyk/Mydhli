/**
 * PDF preview modal — fullscreen Expo Router screen registered with
 * `presentation: 'modal'` in app/_layout.tsx.
 *
 * Two-platform render strategy:
 *
 *   • Native (iOS / Android) — react-native-webview with Strategy A:
 *     inline `source.headers: { Authorization: 'Bearer …' }`. Backend
 *     `/api/documents/{id}/preview` returns a single PDF binary so the
 *     initial-request-only header is sufficient.
 *
 *   • Web (Expo Web running in-browser) — react-native-webview is not
 *     supported on the web target, so we fetch the PDF with the Bearer
 *     header, wrap the response in an Object URL via `URL.createObjectURL`,
 *     and render it inside a DOM <iframe>. The blob URL is revoked on
 *     unmount / id change to avoid memory leaks.
 *
 * NO doc-creation affordances. Phase 8.4c forbids them. The only affordances
 * here are CLOSE and OPEN-IN-BROWSER (native save fallback).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';
import { formatDate } from '../../src/lib/shipmentUtils';

interface DocMeta {
  document_id: string;
  shipment_ref?: string;
  document_type?: string;
  file_name: string;
  file_size_bytes?: number;
  page_count?: number;
  status?: string;
  uploaded_at?: string;
}

function prettyType(t?: string): string {
  if (!t) return 'Document';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettySize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  // Web-only: blob URL fetched with the Bearer header so an <iframe> can show it.
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  // Retry trigger for the web fetch path (bumping forces re-run).
  const [retryNonce, setRetryNonce] = useState(0);

  const backendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  const previewUrl = id ? `${backendUrl}/api/documents/${encodeURIComponent(id)}/preview` : '';

  // 1) Bootstrap auth token + document metadata in parallel.
  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem('dhl_auth_token').then((t) => setToken(t));
    setMetaLoading(true);
    api.get(`/documents/${encodeURIComponent(id)}`)
      .then((r) => setMeta(r.data))
      .catch(() => setError('Failed to load document metadata'))
      .finally(() => setMetaLoading(false));
  }, [id]);

  // 2) Web-only: download the PDF as a blob and wrap it in an Object URL.
  //    react-native-webview is not implemented on the web target so we render
  //    a DOM <iframe> instead. The Object URL is revoked on unmount / id
  //    change to avoid memory leaks.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    if (!id || !token || !previewUrl) return undefined;

    let cancelled = false;
    let createdUrl: string | null = null;

    setLoadingPdf(true);
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
        setLoadingPdf(false);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load document';
        setError(msg);
        setLoadingPdf(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [id, token, previewUrl, retryNonce]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/documents');
  };

  const openInBrowser = async () => {
    // Native save fallback. The browser will prompt for re-auth if the token
    // isn't already present on the domain — acceptable trade-off; primary
    // viewing is the in-app WebView above.
    if (previewUrl) {
      try { await Linking.openURL(previewUrl); } catch { /* ignore */ }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          testID="document-close"
          onPress={close}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.dhlText} />
        </TouchableOpacity>
        <View style={styles.toolbarTitleCol}>
          <Text testID="document-title" style={styles.toolbarTitle} numberOfLines={1}>
            {meta?.file_name || 'Document'}
          </Text>
          {meta ? (
            <Text style={styles.toolbarSub} numberOfLines={1}>
              {prettyType(meta.document_type)}
              {meta.shipment_ref ? `  ·  ${meta.shipment_ref}` : ''}
              {meta.page_count ? `  ·  ${meta.page_count} page${meta.page_count === 1 ? '' : 's'}` : ''}
            </Text>
          ) : metaLoading ? (
            <Text style={styles.toolbarSub}>Loading details…</Text>
          ) : null}
        </View>
        <TouchableOpacity
          testID="document-open-browser"
          onPress={openInBrowser}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="open-outline" size={20} color={Colors.dhlText} />
        </TouchableOpacity>
      </View>

      {/* Sub-meta strip */}
      {meta && (
        <View style={styles.metaStrip}>
          <Text style={styles.metaTxt}>
            {prettySize(meta.file_size_bytes)}
          </Text>
          {meta.status && (
            <View style={[
              styles.statusChip,
              meta.status === 'APPROVED' ? styles.statusApproved :
              meta.status === 'PENDING' ? styles.statusPending :
              meta.status === 'REJECTED' ? styles.statusRejected : styles.statusDefault,
            ]}>
              <Text style={styles.statusChipText}>{meta.status}</Text>
            </View>
          )}
          {meta.uploaded_at && (
            <Text style={styles.metaTxt}>Uploaded {formatDate(meta.uploaded_at)}</Text>
          )}
        </View>
      )}

      {/* Viewer */}
      <View style={styles.viewer}>
        {error ? (
          <View testID="document-error" style={styles.center}>
            <Ionicons name="alert-circle-outline" size={42} color={Colors.dhlRed} />
            <Text style={styles.errTitle}>Failed to load document</Text>
            <Text style={styles.errBody}>{error}</Text>
            <TouchableOpacity
              testID="document-error-retry"
              style={styles.primaryBtn}
              onPress={() => {
                setError(null);
                setLoadingPdf(true);
                // Web branch is gated on `retryNonce`; bumping it re-runs the
                // blob fetch. Native WebView re-mounts naturally when error
                // state changes back to renderable.
                if (Platform.OS === 'web') setRetryNonce((n) => n + 1);
              }}
            >
              <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        ) : !id ? (
          <View style={styles.center}>
            <Text style={styles.errBody}>Missing document id.</Text>
          </View>
        ) : !token ? (
          <View testID="document-token-loading" style={styles.center}>
            <ActivityIndicator size="large" color={Colors.dhlYellow} />
            <Text style={styles.loadingText}>Authenticating…</Text>
          </View>
        ) : Platform.OS === 'web' ? (
          // ── WEB BRANCH ─────────────────────────────────────────────────
          // react-native-webview is unsupported on the web target.
          // We fetched the PDF as a blob (see useEffect above) and now
          // render a DOM <iframe> for the user. The blob URL is revoked
          // automatically by the effect cleanup on unmount / id change.
          <>
            {blobUrl ? (
              React.createElement('iframe', {
                'data-testid': 'document-webview',
                src: blobUrl,
                title: meta?.file_name || 'Document preview',
                style: {
                  width: '100%',
                  height: '100%',
                  border: 0,
                  backgroundColor: '#2A2A2A',
                  display: 'block',
                },
              })
            ) : null}
            {loadingPdf && (
              <View pointerEvents="none" style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={Colors.dhlYellow} />
                <Text style={styles.loadingText}>Loading PDF…</Text>
              </View>
            )}
          </>
        ) : (
          // ── NATIVE BRANCH (iOS / Android) ──────────────────────────────
          <>
            <WebView
              testID="document-webview"
              source={{
                uri: previewUrl,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={styles.webview}
              originWhitelist={['*']}
              startInLoadingState
              onLoadStart={() => setLoadingPdf(true)}
              onLoadEnd={() => setLoadingPdf(false)}
              onError={(e) => {
                setLoadingPdf(false);
                const desc = e?.nativeEvent?.description || 'Unknown WebView error';
                setError(`Could not render the PDF in-app. ${desc}`);
              }}
              onHttpError={(e) => {
                setLoadingPdf(false);
                const code = e?.nativeEvent?.statusCode || '?';
                setError(`Backend returned HTTP ${code} for the preview.`);
              }}
              // On Android, the system WebView doesn't always render PDFs
              // natively. We try with these flags first; if a tester reports
              // a blank viewer on Android, we'll move to Strategy B
              // (expo-file-system download → file://).
              allowFileAccess
              allowUniversalAccessFromFileURLs
              mixedContentMode={Platform.OS === 'android' ? 'always' : undefined}
              javaScriptEnabled
              domStorageEnabled
            />
            {loadingPdf && (
              <View pointerEvents="none" style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={Colors.dhlYellow} />
                <Text style={styles.loadingText}>Loading PDF…</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  toolbarTitleCol: { flex: 1 },
  toolbarTitle: { fontSize: 14, fontWeight: '800', color: Colors.dhlText },
  toolbarSub: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },
  metaStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  metaTxt: { fontSize: 11, color: Colors.dhlMuted, fontFamily: 'monospace' },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  statusChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statusApproved: { backgroundColor: Colors.green100, borderColor: Colors.green600 },
  statusPending:  { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  statusRejected: { backgroundColor: Colors.red100,   borderColor: Colors.dhlRed },
  statusDefault:  { backgroundColor: Colors.dhlPanel, borderColor: Colors.dhlBorder },

  viewer: { flex: 1, backgroundColor: '#2A2A2A', position: 'relative' },
  webview: { flex: 1, backgroundColor: '#2A2A2A' },
  loaderOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontSize: 12, color: Colors.white, marginTop: 12 },
  errTitle: { fontSize: 16, fontWeight: '900', color: Colors.dhlText, marginTop: 12, marginBottom: 4, textAlign: 'center' },
  errBody: { fontSize: 12, color: Colors.dhlMuted, textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  primaryBtn: { height: 44, paddingHorizontal: 24, backgroundColor: Colors.dhlYellow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dhlInk },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },
});

/**
 * Document preview shell — fullscreen Expo Router modal
 * (`presentation: 'modal'` registered in app/_layout.tsx).
 *
 * Platform-agnostic kabuk:
 *   • Toolbar  : close button → title / meta → open-in-browser
 *   • Sub-meta : size · status chip · uploaded date
 *   • Body     : <DocumentViewer/> — resolves to ./_viewer.web.tsx on web,
 *                 ./_viewer.native.tsx on iOS / Android (Metro auto-picks).
 *
 * Critical: react-native-webview is NEVER imported in this shell. That keeps
 * it out of the web bundle entirely. Confirmed by:
 *   $ curl <preview>/.../entry.bundle?platform=web | grep -c 'react-native-webview' → 0
 *
 * NO doc-creation affordances. Phase 8.4c forbids them. The only affordances
 * here are CLOSE and OPEN-IN-BROWSER (native save fallback).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveBackendUrl } from '../../src/lib/api';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';
import { formatDate } from '../../src/lib/shipmentUtils';
import DocumentViewer from './_viewer';

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
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const backendUrl = resolveBackendUrl();
  const previewUrl = id ? `${backendUrl}/api/documents/${encodeURIComponent(id)}/preview` : '';

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem('dhl_auth_token').then((t) => setToken(t));
    setMetaLoading(true);
    api.get(`/documents/${encodeURIComponent(id)}`)
      .then((r) => setMeta(r.data))
      .catch(() => setMetaErr('Failed to load document metadata'))
      .finally(() => setMetaLoading(false));
  }, [id]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/documents');
  };

  const openInBrowser = async () => {
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
          ) : metaErr ? (
            <Text style={[styles.toolbarSub, { color: Colors.dhlRed }]}>{metaErr}</Text>
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
          <Text style={styles.metaTxt}>{prettySize(meta.file_size_bytes)}</Text>
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

      {/* Viewer (platform-resolved) */}
      <View style={styles.viewer}>
        {id ? (
          <DocumentViewer
            documentId={id}
            previewUrl={previewUrl}
            token={token}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.errBody}>Missing document id.</Text>
          </View>
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
  viewer: { flex: 1, backgroundColor: '#2A2A2A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errBody: { fontSize: 12, color: Colors.gray400, textAlign: 'center', maxWidth: 280 },
});

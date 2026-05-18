/**
 * Customs document preview modal (Phase 5.1) — fullscreen Expo Router
 * screen registered as `presentation: 'modal'` in app/_layout.tsx.
 *
 * Reuses the same platform-split viewer as /document/[id]:
 *   • Web    → ../document/_viewer.web.tsx  (fetch + blob + <iframe>)
 *   • Native → ../document/_viewer.tsx     (react-native-webview + Bearer header)
 *
 * Why this exists:
 *   Phase 5's first cut used `Linking.openURL` to view customs PDFs which
 *   stripped the Authorization header on web, leading to a 401. Routing
 *   through the same DocumentViewer keeps the Bearer flow intact and
 *   reuses every test ID the existing /document/[id] modal already
 *   provides (`document-webview`, `document-error`, etc.).
 *
 * NO doc-creation affordances. The only actions are CLOSE and
 * OPEN-IN-BROWSER (native save fallback).
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
import DocumentViewer from '../document/_viewer';

interface CustomsMeta {
  id: string;
  shipmentAwb?: string;
  docType?: string;
  totalValueUSD?: number;
  currency?: string;
  signedBy?: string;
  signatureDate?: string;
  createdAt?: string;
  items?: Array<{ description?: string }>;
}

const DOC_LABELS: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  EXPORT_DECLARATION: 'Export Declaration',
};

export default function CustomsPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [meta, setMeta] = useState<CustomsMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const backendUrl = resolveBackendUrl();
  const previewUrl = id ? `${backendUrl}/api/customs/${encodeURIComponent(id)}/pdf` : '';

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem('dhl_auth_token').then((t) => setToken(t));
    // No single-record endpoint for customs — pull the list and look up by id.
    setMetaLoading(true);
    api.get('/customs')
      .then((r) => {
        const items = Array.isArray(r.data) ? r.data : (r.data?.items || []);
        const m = (items as CustomsMeta[]).find((x) => x.id === id) || null;
        setMeta(m);
      })
      .catch(() => setMeta(null))
      .finally(() => setMetaLoading(false));
  }, [id]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/customs');
  };

  const openInBrowser = async () => {
    if (previewUrl) {
      try { await Linking.openURL(previewUrl); } catch { /* ignore */ }
    }
  };

  const title = meta
    ? `${DOC_LABELS[meta.docType || ''] || meta.docType || 'Customs document'}`
    : metaLoading ? 'Customs document' : 'Customs document';
  const subtitleParts: string[] = [];
  if (meta?.shipmentAwb) subtitleParts.push(meta.shipmentAwb);
  if (meta?.items?.length) subtitleParts.push(`${meta.items.length} item${meta.items.length === 1 ? '' : 's'}`);
  if (meta?.signatureDate) subtitleParts.push(`Signed ${formatDate(meta.signatureDate)}`);

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
            {title}
          </Text>
          {subtitleParts.length > 0 ? (
            <Text style={styles.toolbarSub} numberOfLines={1}>
              {subtitleParts.join('  ·  ')}
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
            <Text style={styles.errBody}>Missing customs document id.</Text>
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
  viewer: { flex: 1, backgroundColor: '#2A2A2A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errBody: { fontSize: 12, color: Colors.gray400, textAlign: 'center', maxWidth: 280 },
});

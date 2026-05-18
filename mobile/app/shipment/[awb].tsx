/**
 * Shipment detail — mirrors /dashboard/shipments/:awb on web.
 *
 * Phase 2 blocks:
 *   1) Header   — AWB + status pill + AT_DEPOT pickup badge
 *   2) Route    — origin/destination + ETD/ETA + mode/service
 *   3) Booking  — booking ref, B/L, container, seal, freight term, originals
 *   4) Parties  — Shipper / Consignee (+ Notify placeholder — Phase 5 wires real list)
 *   5) Milestones — canonical 7-step ocean pipeline, mapped from events[]
 *   6) AT_DEPOT alert card (only when status === 'AT_DEPOT')
 *   7) Documents preview — count badge + Phase 3 placeholder copy (no PDF preview)
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import api from '../../src/lib/api';
import {
  formatDate, formatDateTime, freightServiceFor,
  getPickupBadge, getStatusColor, getStatusLabel,
} from '../../src/lib/shipmentUtils';
import type { Shipment, ShipmentEvent } from '../../src/types/shipment';

// Document row shape served by /api/shipments/{awb}/documents.
interface ShipmentDocItem {
  document_id: string;
  document_type?: string;
  file_name: string;
  file_size_bytes?: number;
  page_count?: number;
  status?: string;
  uploaded_at?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  HBL: 'House B/L',
  MBL: 'Master B/L',
  BOOKING_CONFIRMATION: 'Booking Confirmation',
  DHL_SHIPPING_FORM: 'DHL Shipping Form',
  CUSTOMS_DECLARATION: 'Customs Declaration',
  ARRIVAL_NOTICE: 'Arrival Notice',
  PROOF_OF_DELIVERY: 'Proof of Delivery',
  WAREHOUSE_RECEIPT: 'Warehouse Receipt',
  PENDING_ACTION_NOTE: 'Pending Action',
  CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
};
const prettyDocType = (t?: string) =>
  !t ? 'Document' : (DOC_TYPE_LABELS[t] || t.replace(/_/g, ' '));
const prettySize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Canonical ocean milestone pipeline ─────────────────────────────────────
// Maps the 7 user-facing milestones to the backend DHL event codes emitted
// by /api/shipments/{awb}. AT_DEPOT shipments stop at step 6 (Final Depot).
const OCEAN_MILESTONES: { key: string; label: string; codes: string[] }[] = [
  { key: 'PICKUP', label: 'Pre-carriage Pickup', codes: ['DF', 'PU'] },
  { key: 'ORIGIN_PORT', label: 'Origin Port', codes: ['DF', 'OC'] },
  { key: 'VESSEL_DEPARTURE', label: 'Vessel Departure', codes: ['AF'] },
  { key: 'VESSEL_ARRIVAL', label: 'Vessel Arrival', codes: ['AR'] },
  { key: 'CUSTOMS_CLEARED', label: 'Customs Cleared', codes: ['CC'] },
  { key: 'FINAL_DEPOT', label: 'Final Depot', codes: ['DEP'] },
  { key: 'DELIVERED', label: 'Delivered to consignee', codes: ['OK', 'PD'] },
];

type MilestoneState = 'done' | 'active' | 'pending';

interface DerivedMilestone {
  key: string;
  label: string;
  state: MilestoneState;
  timestamp?: string;
  description?: string;
}

function deriveMilestones(shipment: Shipment): DerivedMilestone[] {
  const events: ShipmentEvent[] = Array.isArray(shipment.events) ? shipment.events : [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // For each milestone, find the latest matching event (by code).
  const matches = OCEAN_MILESTONES.map((m) => {
    let chosen: ShipmentEvent | undefined;
    for (const ev of sorted) {
      if (ev.code && m.codes.includes(ev.code)) chosen = ev;
    }
    return chosen;
  });

  // State derivation: DELIVERED → all done. AT_DEPOT → done through Final Depot.
  // Otherwise: every milestone with a matched event = done; first unmatched = active.
  const totalDone =
    shipment.status === 'DELIVERED' ? OCEAN_MILESTONES.length :
    shipment.status === 'AT_DEPOT' ? OCEAN_MILESTONES.findIndex((m) => m.key === 'FINAL_DEPOT') + 1 :
    matches.filter(Boolean).length;

  return OCEAN_MILESTONES.map((m, i) => {
    let state: MilestoneState;
    if (i < totalDone) state = 'done';
    else if (i === totalDone) state = 'active';
    else state = 'pending';
    const ev = matches[i];
    return {
      key: m.key,
      label: m.label,
      state,
      timestamp: ev?.timestamp,
      description: ev?.description,
    };
  });
}

export default function ShipmentDetail() {
  const { awb } = useLocalSearchParams<{ awb: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [docs, setDocs] = useState<ShipmentDocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    if (!awb) return;
    setLoading(true); setNotFound(false);
    api.get(`/shipments/${encodeURIComponent(awb)}`)
      .then((r) => setShipment(r.data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [awb]);

  // Per-shipment documents list (replaces Phase 2 count-only placeholder).
  useEffect(() => {
    if (!awb) return;
    setDocsLoading(true);
    api.get(`/shipments/${encodeURIComponent(awb)}/documents`)
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data?.items || []);
        setDocs(arr as ShipmentDocItem[]);
      })
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [awb]);

  const pickup = useMemo(() => getPickupBadge(shipment), [shipment]);
  const tone = useMemo(() => getStatusColor(shipment?.status), [shipment]);
  const milestones = useMemo(
    () => (shipment ? deriveMilestones(shipment) : []),
    [shipment],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity testID="shipment-back-link" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dhlText} />
          <Text style={styles.backText}>Shipments</Text>
        </TouchableOpacity>
        <Text style={styles.topbarAwb}>{awb}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading && (
          <View testID="shipment-detail-loading" style={styles.center}>
            <ActivityIndicator size="large" color={Colors.dhlYellow} />
            <Text style={styles.loadingText}>Loading shipment…</Text>
          </View>
        )}

        {!loading && notFound && (
          <View testID="shipment-detail-notfound" style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={48} color={Colors.dhlMuted} />
            <Text style={styles.emptyTitle}>Shipment not found</Text>
            <Text style={styles.emptyText}>
              AWB {awb} was not found in your account.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>BACK TO SHIPMENTS</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && shipment && (
          <View testID="shipment-detail-page">
            {/* 1) Header: status + pickup badge */}
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <Text style={styles.headerAwb}>{shipment.awb}</Text>
                <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
                  <Text style={[styles.statusText, { color: tone.text }]}>
                    {getStatusLabel(shipment.status)}
                  </Text>
                </View>
              </View>
              {shipment.bookingReference ? (
                <Text style={styles.headerSub}>Booking · {shipment.bookingReference}</Text>
              ) : null}

              {pickup && (
                <View
                  testID="shipment-pickup-banner"
                  style={[
                    styles.pickupBanner,
                    { backgroundColor: pickup.bg, borderColor: pickup.border },
                  ]}
                >
                  <Ionicons
                    name={pickup.overdue ? 'alert-circle' : 'time-outline'}
                    size={22}
                    color={pickup.fg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickupHeadline, { color: pickup.fg }]}>
                      {pickup.text}
                    </Text>
                    <Text style={[styles.pickupLong, { color: pickup.fg }]}>
                      {pickup.longText}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 2) Route */}
            <SectionCard title="ROUTE">
              <View style={styles.routeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeCode}>{shipment.origin?.code}</Text>
                  <Text style={styles.routeCity}>{shipment.origin?.city}</Text>
                  <Text style={styles.routeCountry}>{shipment.origin?.country}</Text>
                </View>
                <View style={styles.routeMidCol}>
                  <Ionicons
                    name={shipment.mode === 'AIR' ? 'airplane' : shipment.mode === 'ROAD' ? 'car' : 'boat'}
                    size={20}
                    color={Colors.dhlRed}
                  />
                  <Text style={styles.routeMidText}>{shipment.mode || 'OCEAN'}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.routeCode}>{shipment.destination?.code}</Text>
                  <Text style={styles.routeCity}>{shipment.destination?.city}</Text>
                  <Text style={styles.routeCountry}>{shipment.destination?.country}</Text>
                </View>
              </View>
              <View style={styles.routeMetaRow}>
                <DetailKV label="ETD" value={formatDate(shipment.etd)} />
                <DetailKV label="ETA" value={formatDate(shipment.eta || shipment.estimatedDelivery)} />
                <DetailKV label="Delivered" value={formatDate(shipment.actualDelivery)} />
              </View>
            </SectionCard>

            {/* 3) Booking + Service */}
            <SectionCard title="BOOKING & SERVICE">
              <DetailRow label="Booking ref" value={shipment.bookingReference || '—'} mono />
              <DetailRow label="Service" value={freightServiceFor(shipment.awb)} />
              <DetailRow label="Container type" value={shipment.oceanSpecifics?.containerType || shipment.service || '—'} />
              <DetailRow label="Container No." value={shipment.oceanSpecifics?.containerNumber || '—'} mono />
              <DetailRow label="Seal No." value={shipment.oceanSpecifics?.sealNumber || '—'} mono />
              <DetailRow label="B/L No." value={shipment.oceanSpecifics?.blNumber || '—'} mono />
              <DetailRow label="Vessel · Voyage" value={
                shipment.oceanSpecifics?.vessel
                  ? `${shipment.oceanSpecifics.vessel}${shipment.oceanSpecifics.voyage ? ' · ' + shipment.oceanSpecifics.voyage : ''}`
                  : '—'
              } />
              <DetailRow label="Freight term" value={shipment.oceanSpecifics?.freightTerm || shipment.incoterms || '—'} />
              <DetailRow label="B/L originals" value={shipment.oceanSpecifics?.originals || '—'} />
            </SectionCard>

            {/* 4) Parties */}
            <SectionCard title="PARTIES">
              <PartyBlock
                role="Shipper"
                tone={{ bg: Colors.dhlYellow, text: Colors.dhlInk }}
                name={shipment.sender?.company || shipment.sender?.name}
                address={[shipment.sender?.address, shipment.sender?.city, shipment.sender?.country]
                  .filter(Boolean).join(', ')}
                contact={[shipment.sender?.phone, shipment.sender?.email].filter(Boolean).join(' · ')}
              />
              <PartyBlock
                role="Consignee"
                tone={{ bg: Colors.dhlInk, text: Colors.dhlYellow }}
                name={shipment.receiver?.company || shipment.receiver?.name}
                address={[shipment.receiver?.address, shipment.receiver?.city, shipment.receiver?.country]
                  .filter(Boolean).join(', ')}
                contact={[shipment.receiver?.phone, shipment.receiver?.email].filter(Boolean).join(' · ')}
              />
              <PartyBlock
                role="Notify"
                tone={{ bg: Colors.dhlPanel, text: Colors.dhlMuted }}
                name={null}
                address={null}
                contact={null}
                placeholder="Notify party will appear here when assigned at booking."
              />
            </SectionCard>

            {/* 5) Milestones */}
            <SectionCard title="MILESTONES">
              {milestones.map((m, i) => {
                const isLast = i === milestones.length - 1;
                const dotColor =
                  m.state === 'done' ? Colors.green600 :
                  m.state === 'active' ? Colors.dhlYellow : Colors.dhlBorder;
                const dotBorder =
                  m.state === 'active' ? Colors.dhlInk : 'transparent';
                const lineColor =
                  m.state === 'done' ? Colors.green600 : Colors.dhlBorder;
                return (
                  <View key={m.key} testID={`milestone-${m.key.toLowerCase()}`} style={styles.msRow}>
                    <View style={styles.msDotCol}>
                      <View style={[styles.msDot, { backgroundColor: dotColor, borderColor: dotBorder, borderWidth: m.state === 'active' ? 2 : 0 }]} />
                      {!isLast && <View style={[styles.msLine, { backgroundColor: lineColor }]} />}
                    </View>
                    <View style={styles.msContent}>
                      <View style={styles.msHead}>
                        <Text style={[styles.msLabel, m.state === 'pending' && { color: Colors.dhlMuted }]}>
                          {m.label}
                        </Text>
                        {m.state === 'active' && (
                          <Text style={styles.msActiveBadge}>ACTIVE</Text>
                        )}
                      </View>
                      {m.timestamp ? (
                        <Text style={styles.msMeta}>{formatDateTime(m.timestamp)}</Text>
                      ) : (
                        <Text style={styles.msMetaPending}>
                          {m.state === 'pending' ? 'Pending' : 'In progress'}
                        </Text>
                      )}
                      {m.description ? (
                        <Text style={styles.msDesc} numberOfLines={2}>{m.description}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </SectionCard>

            {/* 6) AT_DEPOT block */}
            {shipment.status === 'AT_DEPOT' && shipment.oceanSpecifics?.depotStatus && (
              <SectionCard title="FINAL DEPOT">
                <View testID="shipment-depot-block" style={styles.depotCard}>
                  <Ionicons name="business" size={20} color={Colors.dhlRed} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.depotLocation}>
                      {shipment.oceanSpecifics.depotStatus.location}
                    </Text>
                    <Text style={styles.depotMeta}>
                      Stored since {formatDate(shipment.oceanSpecifics.depotStatus.since)}
                      {' · '}
                      <Text style={styles.depotDays}>
                        {shipment.oceanSpecifics.depotStatus.days} day{shipment.oceanSpecifics.depotStatus.days === 1 ? '' : 's'}
                      </Text>
                      {' '}in storage
                    </Text>
                    <View style={[styles.priorityTag, {
                      backgroundColor: shipment.oceanSpecifics.depotStatus.priority === 'OVERDUE' ? Colors.red100 :
                        shipment.oceanSpecifics.depotStatus.priority === 'ESCALATE' ? '#FEF3C7' : Colors.dhlPanel,
                    }]}>
                      <Text style={[styles.priorityText, {
                        color: shipment.oceanSpecifics.depotStatus.priority === 'OVERDUE' ? Colors.dhlRed :
                          shipment.oceanSpecifics.depotStatus.priority === 'ESCALATE' ? '#92400E' : Colors.dhlMuted,
                      }]}>
                        {shipment.oceanSpecifics.depotStatus.priority}
                      </Text>
                    </View>
                  </View>
                </View>
              </SectionCard>
            )}

            {/* 7) Documents — Phase 3 live list (replaces placeholder) */}
            <SectionCard title="DOCUMENTS">
              {docsLoading ? (
                <View testID="shipment-documents-loading" style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.dhlYellow} />
                  <Text style={styles.docsCopy}>Loading documents…</Text>
                </View>
              ) : docs.length === 0 ? (
                <View testID="shipment-documents-empty" style={{ paddingVertical: 12 }}>
                  <Text style={styles.docsCopy}>
                    No operational documents on file for this shipment yet.
                  </Text>
                </View>
              ) : (
                <View testID="shipment-documents-list">
                  <View style={styles.docsCountRow}>
                    <Ionicons name="document-text" size={18} color={Colors.dhlRed} />
                    <Text style={styles.docsCount}>
                      {docs.length}{' '}
                      <Text style={styles.docsCountSub}>
                        document{docs.length === 1 ? '' : 's'} on file
                      </Text>
                    </Text>
                  </View>
                  {docs.map((doc) => (
                    <TouchableOpacity
                      key={doc.document_id}
                      testID={`shipment-doc-${doc.document_id}`}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/document/${doc.document_id}` as never)}
                      style={shipDocStyles.row}
                    >
                      <View style={shipDocStyles.iconBox}>
                        <Ionicons name="document-text" size={16} color={Colors.dhlRed} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={shipDocStyles.name} numberOfLines={1}>{doc.file_name}</Text>
                        <View style={shipDocStyles.metaRow}>
                          <View style={shipDocStyles.typeChip}>
                            <Text style={shipDocStyles.typeChipText} numberOfLines={1}>
                              {prettyDocType(doc.document_type)}
                            </Text>
                          </View>
                          <Text style={shipDocStyles.metaTxt}>
                            {prettySize(doc.file_size_bytes)}
                            {doc.page_count ? ` · ${doc.page_count}p` : ''}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="eye-outline" size={18} color={Colors.dhlMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </SectionCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Small building blocks ──────────────────────────────────────────────────
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const DetailRow = ({
  label, value, mono,
}: { label: string; value: string; mono?: boolean }) => (
  <View style={detailStyles.row}>
    <Text style={detailStyles.label}>{label}</Text>
    <Text style={[detailStyles.value, mono && detailStyles.mono]} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const DetailKV = ({ label, value }: { label: string; value: string }) => (
  <View style={detailStyles.kv}>
    <Text style={detailStyles.kvLabel}>{label}</Text>
    <Text style={detailStyles.kvValue}>{value || '—'}</Text>
  </View>
);

const PartyBlock = ({
  role, tone, name, address, contact, placeholder,
}: {
  role: string;
  tone: { bg: string; text: string };
  name: string | null | undefined;
  address: string | null;
  contact: string | null;
  placeholder?: string;
}) => (
  <View testID={`party-${role.toLowerCase()}`} style={partyStyles.block}>
    <View style={[partyStyles.roleTag, { backgroundColor: tone.bg }]}>
      <Text style={[partyStyles.roleText, { color: tone.text }]}>{role.toUpperCase()}</Text>
    </View>
    {name ? (
      <>
        <Text style={partyStyles.name}>{name}</Text>
        {address ? <Text style={partyStyles.address}>{address}</Text> : null}
        {contact ? <Text style={partyStyles.contact}>{contact}</Text> : null}
      </>
    ) : (
      <Text style={partyStyles.placeholder}>{placeholder || 'Not specified'}</Text>
    )}
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: Colors.dhlMuted, textTransform: 'uppercase' },
  value: { fontSize: 13, fontWeight: '600', color: Colors.dhlText, maxWidth: '60%', textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontWeight: '700' },
  kv: { alignItems: 'center', flex: 1 },
  kvLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Colors.dhlMuted, marginBottom: 4 },
  kvValue: { fontSize: 12, fontWeight: '700', color: Colors.dhlText, textAlign: 'center' },
});

const partyStyles = StyleSheet.create({
  block: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  roleText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.dhlText, marginBottom: 2 },
  address: { fontSize: 12, color: Colors.dhlText, marginBottom: 2 },
  contact: { fontSize: 11, color: Colors.dhlMuted, fontFamily: 'monospace' },
  placeholder: { fontSize: 12, color: Colors.dhlMuted, fontStyle: 'italic' },
});

const shipDocStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },
  iconBox: {
    width: 32, height: 32,
    backgroundColor: Colors.red100,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 12, fontWeight: '700', color: Colors.dhlText },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  typeChip: { backgroundColor: Colors.dhlPanel, paddingHorizontal: 5, paddingVertical: 1 },
  typeChipText: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: Colors.dhlText, textTransform: 'uppercase', maxWidth: 140 },
  metaTxt: { fontSize: 10, color: Colors.dhlMuted, fontFamily: 'monospace' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dhlPanel },
  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.dhlBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: Colors.dhlText },
  topbarAwb: { fontSize: 13, fontFamily: 'monospace', fontWeight: '800', color: Colors.dhlText },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { fontSize: 13, color: Colors.dhlMuted, marginTop: 12 },
  emptyCard: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder,
    padding: 32, alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.dhlText, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.dhlMuted, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { height: 44, backgroundColor: Colors.dhlYellow, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, borderWidth: 2, borderColor: Colors.dhlInk },
  primaryBtnText: { fontSize: 12, fontWeight: '800', color: Colors.dhlInk, letterSpacing: 1.5 },

  headerCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 12 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerAwb: { fontSize: 18, fontFamily: 'monospace', fontWeight: '900', color: Colors.dhlText, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: Colors.dhlMuted, fontFamily: 'monospace' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  pickupBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 12, padding: 12, borderLeftWidth: 4, borderWidth: 1,
  },
  pickupHeadline: { fontSize: 16, fontWeight: '900' },
  pickupLong: { fontSize: 11, marginTop: 2 },

  section: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.dhlBorder, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.dhlMuted, marginBottom: 12 },

  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeCode: { fontSize: 22, fontFamily: 'monospace', fontWeight: '900', color: Colors.dhlText, letterSpacing: 0.5 },
  routeCity: { fontSize: 12, fontWeight: '700', color: Colors.dhlText, marginTop: 2 },
  routeCountry: { fontSize: 11, color: Colors.dhlMuted },
  routeMidCol: { alignItems: 'center', paddingHorizontal: 16 },
  routeMidText: { fontSize: 9, fontWeight: '900', color: Colors.dhlMuted, letterSpacing: 1.5, marginTop: 4 },
  routeMetaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dhlBorder,
  },

  msRow: { flexDirection: 'row', minHeight: 56 },
  msDotCol: { alignItems: 'center', width: 18, marginRight: 12 },
  msDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  msLine: { width: 2, flex: 1, marginTop: 2 },
  msContent: { flex: 1, paddingBottom: 12 },
  msHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  msLabel: { fontSize: 13, fontWeight: '800', color: Colors.dhlText },
  msActiveBadge: { fontSize: 9, fontWeight: '900', color: Colors.dhlRed, letterSpacing: 1, backgroundColor: Colors.red100, paddingHorizontal: 5, paddingVertical: 1 },
  msMeta: { fontSize: 11, color: Colors.dhlText, fontFamily: 'monospace' },
  msMetaPending: { fontSize: 11, color: Colors.dhlMuted, fontStyle: 'italic' },
  msDesc: { fontSize: 11, color: Colors.dhlMuted, marginTop: 2 },

  depotCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, backgroundColor: Colors.dhlPanel, borderLeftWidth: 3, borderLeftColor: Colors.dhlRed },
  depotLocation: { fontSize: 13, fontWeight: '800', color: Colors.dhlText },
  depotMeta: { fontSize: 11, color: Colors.dhlMuted, marginTop: 4 },
  depotDays: { fontWeight: '900', color: Colors.dhlText },
  priorityTag: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 6, paddingVertical: 2 },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  docsPlaceholder: { paddingVertical: 4 },
  docsCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  docsCount: { fontSize: 16, fontWeight: '900', color: Colors.dhlText },
  docsCountSub: { fontSize: 12, color: Colors.dhlMuted, fontWeight: '500' },
  docsCopy: { fontSize: 12, color: Colors.dhlMuted, lineHeight: 18 },
  docsKicker: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.dhlPanel, borderWidth: 1, borderColor: Colors.dhlBorder },
  docsKickerText: { fontSize: 10, fontWeight: '800', color: Colors.dhlMuted, letterSpacing: 1 },
});

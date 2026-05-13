import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABELS, STATUS_COLORS } from '../lib/shipmentUtils';

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const label = STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]} testID={`status-badge-${status}`}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

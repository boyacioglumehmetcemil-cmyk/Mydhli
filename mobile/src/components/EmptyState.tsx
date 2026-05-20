/**
 * EmptyState — mobile counterpart to the web EmptyState panel.
 * Used everywhere data has been zeroed out pending the logbook integration.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IoniconName;
  title?: string;
  message?: string;
  testID?: string;
}

export default function EmptyState({
  icon,
  title = 'No data yet',
  message = 'Your data will appear here once it has been logged.',
  testID,
}: Props) {
  return (
    <View testID={testID || 'empty-state'} style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color={Colors.dhlMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.dhlBorder,
    borderRadius: 6,
    marginHorizontal: 16,
    marginTop: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dhlPanel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.dhlInk, marginBottom: 4 },
  message: {
    fontSize: 13,
    color: Colors.dhlMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DemoBadge() {
  return (
    <View style={styles.badge} testID="demo-badge" pointerEvents="none">
      <Text style={styles.text}>DEMO MODE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(26,26,26,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

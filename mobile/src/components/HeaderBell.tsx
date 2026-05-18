/**
 * HeaderBell — reusable header notification bell with unread badge.
 *
 * Behaviour
 *   • Fetches GET /api/notifications/unread-count
 *   • Refreshes whenever the parent screen gains focus (useFocusEffect)
 *   • Shows red pill badge when count > 0; hides when 0
 *   • Tap → navigate to /notifications inbox
 *
 * Used by Home, Shipments and Documents tabs (Phase 4).
 */
import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/colors';
import api from '../lib/api';

export default function HeaderBell() {
  const router = useRouter();
  const [count, setCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const n = Number(res.data?.unread ?? 0) || 0;
      setCount(n);
    } catch {
      /* swallow — stale count is acceptable, no UI noise on transient errors */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return undefined;
    }, [refresh]),
  );

  return (
    <TouchableOpacity
      testID="header-bell"
      style={styles.btn}
      onPress={() => router.push('/notifications' as never)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="notifications-outline" size={20} color={Colors.dhlText} />
      {count > 0 && (
        <View testID="header-bell-badge" style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2, right: 2,
    minWidth: 16, height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.dhlRed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0,
    lineHeight: 11,
  },
});

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';
import BrandWordmark from '../src/components/BrandWordmark';

/**
 * Root entry. Decides between authenticated (tabs) and unauthenticated (login)
 * surfaces. No public marketing landing is rendered on the mobile app — per
 * Faz 7 the app opens straight onto the login screen for cold sessions.
 */
export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View testID="root-splash" style={styles.splash}>
        <BrandWordmark size="lg" />
        <ActivityIndicator color={Colors.dhlInk} style={styles.spinner} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dhlYellow,
  },
  spinner: { marginTop: 24 },
});

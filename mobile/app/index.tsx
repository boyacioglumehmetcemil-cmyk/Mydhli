import React from 'react';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/contexts/AuthContext';

const LOGO_HORIZONTAL = require('../assets/brand/dhl_gf_horizontal.png');

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
        <Image
          source={LOGO_HORIZONTAL}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel="DHL Global Forwarding"
        />
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
  splashLogo: { height: 64, aspectRatio: 2.535 },
  spinner: { marginTop: 24 },
});

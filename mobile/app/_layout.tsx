import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import DemoBadge from '../src/components/DemoBadge';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shipment/[awb]" options={{ presentation: 'card' }} />
          <Stack.Screen
            name="document/[id]"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen name="quote" />
          <Stack.Screen name="addresses" />
          <Stack.Screen name="schedule-pickup" />
          <Stack.Screen name="pickups" />
          <Stack.Screen name="invoices" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="customs" />
          <Stack.Screen name="settings" />
        </Stack>
        <DemoBadge />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from './store/session';

// FOR TESTING: Automatically enter as guest
// This bypasses all authentication for rapid testing
export default function Welcome() {
  const setGuestSessionId = useSessionStore((s) => s.setGuestSessionId);
  const session = useSessionStore((s) => s.session);
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  const router = useRouter();

  // Auto-enter as guest for testing
  useEffect(() => {
    async function autoEnterAsGuest() {
      console.log('🧪 Testing mode: Auto-entering as guest...');
      
      // If already logged in or has guest session, redirect immediately
    if (session || guestSessionId) {
        console.log('✅ Session exists, redirecting to app');
      router.replace('/(tabs)');
        return;
    }

      try {
        // Create a persistent guest session for testing
        const guestId = `test-guest-${Date.now()}`;
    await SecureStore.setItemAsync('guest_session_id', guestId);
    setGuestSessionId(guestId);
        console.log('✅ Guest session created:', guestId);
        
        // Navigate to app
        router.replace('/(tabs)');
      } catch (err: any) {
        console.error('❌ Error creating guest session:', err);
        // Even if SecureStore fails, just set the session in memory
        const guestId = `test-guest-${Date.now()}`;
        setGuestSessionId(guestId);
        console.log('✅ Guest session created in memory:', guestId);
    router.replace('/(tabs)');
      }
    }

    // Execute immediately - no need to wait
    autoEnterAsGuest();
  }, [session, guestSessionId, router, setGuestSessionId]);

  // Show simple loading screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Oasis Travel</Text>
      <Text style={styles.subtitle}>
        Loading...
      </Text>
      <ActivityIndicator size="large" style={styles.loader} color="#0066CC" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  error: {
    marginTop: 20,
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    marginVertical: 8,
  },
});


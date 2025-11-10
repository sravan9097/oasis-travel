import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from './store/session';

export default function Welcome() {
  const setGuestSessionId = useSessionStore((s) => s.setGuestSessionId);
  const session = useSessionStore((s) => s.session);
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (session || guestSessionId) {
      router.replace('/(tabs)');
    }
  }, [session, guestSessionId, router]);

  const enterAsGuest = async () => {
    const guestId = `guest-${Date.now()}`;
    await SecureStore.setItemAsync('guest_session_id', guestId);
    setGuestSessionId(guestId);
    router.replace('/(tabs)');
  };

  const signIn = () => {
    router.push('/(auth)/otp');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Oasis Travel</Text>
      <Text style={styles.subtitle}>
        Plan your perfect trip with our expert help
      </Text>
      
      <Button mode="contained" onPress={signIn} style={styles.button}>
        Sign In with Phone
      </Button>
      
      <Button mode="outlined" onPress={enterAsGuest} style={styles.button}>
        Browse as Guest
      </Button>
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
  button: {
    marginVertical: 8,
  },
});


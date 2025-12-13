import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from './providers/QueryProvider';
import { theme } from './theme';
import { useEffect, useState, useRef } from 'react';
import { initSupabase, getSupabase } from '@oasis/api';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from './store/session';
import { router } from 'expo-router';
import { registerForPushNotifications, setupNotificationListeners } from './lib/notifications';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setSession = useSessionStore((s) => s.setSession);
  const setGuestSessionId = useSessionStore((s) => s.setGuestSessionId);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    async function initialize() {
      console.log('🚀 Initializing app...');
      
      // Initialize Supabase
      initSupabase(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );
      console.log('✅ Supabase initialized');

      // Restore session
      try {
        const supabase = getSupabase();
        
        // Check for existing auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Found existing auth session');
          setSession(session);
          setIsReady(true);
          return;
        }

        // Check for guest session
        const guestId = await SecureStore.getItemAsync('guest_session_id');
        if (guestId) {
          console.log('✅ Found existing guest session:', guestId);
          setGuestSessionId(guestId);
          setIsReady(true);
          return;
        }
        
        console.log('ℹ️  No existing session found');
      } catch (error) {
        console.error('❌ Error restoring session:', error);
      }

      console.log('✅ App ready');
      setIsReady(true);
    }

    initialize();
  }, [setSession, setGuestSessionId]);

  useEffect(() => {
    // Register for push notifications (gracefully handle Expo Go limitations)
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          console.log('Push token:', token);
          // TODO: Send token to backend to store for this user
          // const supabase = getSupabase();
          // await supabase.from('user_push_tokens').upsert({ user_id: ..., token });
        }
      })
      .catch((error) => {
        console.warn('Push notification registration failed:', error);
        // Continue without push notifications - app will still work
      });

    // Setup listeners (only if notifications are available)
    try {
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
          // Handle foreground notification
        },
        (response) => {
          console.log('Notification tapped:', response);
          
          // Handle deep linking based on notification data
          const data = response.notification.request.content.data;
          
          if (data?.trip_id) {
            router.push(`/trip/${data.trip_id}`);
          } else if (data?.quote_id) {
            router.push(`/quote/${data.quote_id}`);
          } else if (data?.incident_id) {
            router.push('/support');
          }
        }
      );

      return cleanup;
    } catch (error) {
      console.warn('Could not setup notification listeners:', error);
      // Return empty cleanup function
      return () => {};
    }
  }, []);

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="plan" />
            <Stack.Screen name="trip" />
            <Stack.Screen name="quote" />
            <Stack.Screen name="support" />
          </Stack>
        </QueryProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}


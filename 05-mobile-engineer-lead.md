# Mobile Engineer (Lead) Guide

**Your Role:** Mobile App Core & Primary Features  
**Sections:** 9, 10  
**Duration:** Week 3-6 (10-12 days total)  
**Dependencies:** Sections 7 (API Package), 8 (Utils Package)

---

## Overview

You are responsible for the customer-facing React Native mobile app:
1. **Section 9**: Core infrastructure (auth, navigation, state) - 5 days
2. **Section 10**: Primary features (intake, quotes, trips) - 7 days

Your work enables Section 11 (Support & Emergency features).

---

## Section 9: Mobile App - Core Infrastructure

### Timeline
- **Start**: After Sections 7 & 8 complete
- **Duration**: 5 days
- **Blocks**: Sections 10, 11

### Prerequisites

```bash
# Ensure packages exist
ls packages/api/src/index.ts
ls packages/utils/src/index.ts

# Test imports work
cd packages/api && npm test
cd packages/utils && npm test
```

### Objective
Set up Expo app with navigation, authentication (guest mode + OTP), state management, and theming.

---

### Day 1: Navigation & Structure

```bash
cd apps/mobile

# Install navigation dependencies
npm install expo-router@^3.0.0
npm install react-native-screens react-native-safe-area-context
```

**Create folder structure:**
```
app/
  _layout.tsx                 # Root layout
  index.tsx                   # Welcome/Landing screen
  (auth)/
    _layout.tsx               # Auth stack
    otp.tsx                   # OTP verification
  (tabs)/
    _layout.tsx               # Tab navigator
    index.tsx                 # Home tab
    quotes.tsx                # Quotes tab
    trips.tsx                 # Trips tab
    support.tsx               # Support tab
  trip/
    [id].tsx                  # Trip detail screen
  quote/
    [id].tsx                  # Quote detail screen
    compare.tsx               # Compare quotes
```

**app/_layout.tsx:**
```typescript
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryProvider } from './providers/QueryProvider';
import { theme } from './theme';
import { useEffect } from 'react';
import { initSupabase } from '@oasis/api';

export default function RootLayout() {
  useEffect(() => {
    // Initialize Supabase
    initSupabase(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  return (
    <PaperProvider theme={theme}>
      <QueryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryProvider>
    </PaperProvider>
  );
}
```

**app/(tabs)/_layout.tsx:**
```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Day 2: Authentication Flow

```bash
npm install expo-secure-store@^12.5.0
```

**app/store/session.ts (Zustand):**
```typescript
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface SessionStore {
  session: Session | null;
  guestSessionId: string | null;
  setSession: (session: Session | null) => void;
  setGuestSessionId: (id: string | null) => void;
  isGuest: () => boolean;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  guestSessionId: null,
  setSession: (session) => set({ session }),
  setGuestSessionId: (id) => set({ guestSessionId: id }),
  isGuest: () => get().session === null && get().guestSessionId !== null,
}));
```

**app/index.tsx (Welcome):**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from './store/session';

export default function Welcome() {
  const setGuestSessionId = useSessionStore((s) => s.setGuestSessionId);

  const enterAsGuest = async () => {
    const guestId = `guest-${Date.now()}`;
    await SecureStore.setItemAsync('guest_session_id', guestId);
    setGuestSessionId(guestId);
    router.push('/(tabs)');
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
```

**app/(auth)/otp.tsx:**
```typescript
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { getSupabase, rpcMergeGuestToUser } from '@oasis/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useSessionStore } from '../store/session';

export default function OTPScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setSession = useSessionStore((s) => s.setSession);

  const sendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({ phone });
      
      if (error) throw error;
      
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('No session created');
      
      // Set session
      setSession(data.session);
      
      // Merge guest data if exists
      const guestId = await SecureStore.getItemAsync('guest_session_id');
      if (guestId) {
        await rpcMergeGuestToUser(guestId);
        await SecureStore.deleteItemAsync('guest_session_id');
      }
      
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {step === 'phone' ? 'Enter Phone Number' : 'Enter OTP'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'phone' ? (
        <>
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={sendOTP}
            loading={loading}
            disabled={loading || !phone}
          >
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="OTP Code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={verifyOTP}
            loading={loading}
            disabled={loading || otp.length < 6}
          >
            Verify
          </Button>
          <Button mode="text" onPress={() => setStep('phone')} disabled={loading}>
            Change Phone Number
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});
```

### Day 3: State Management & Theme

**app/providers/QueryProvider.tsx:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**app/theme.ts:**
```typescript
import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFA000',
    tertiary: '#00BFA5',
    error: '#D32F2F',
    background: '#F5F5F5',
    surface: '#FFFFFF',
  },
  roundness: 8,
};
```

### Deliverables Checklist - Section 9

- [ ] Navigation structure with Expo Router
- [ ] Guest mode with UUID generation
- [ ] OTP authentication flow
- [ ] Guest-to-user merge working
- [ ] State management (Zustand + React Query)
- [ ] Theme configured
- [ ] All tabs accessible

---

## Section 10: Mobile App - Primary Features

### Timeline
- **Start**: After Section 9 complete
- **Duration**: 7 days

### Objective
Implement bot intake, quotes management, and trip viewing features.

---

### Day 1-2: Bot Intake Flow

**app/components/BotMessage.tsx:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';

interface Props {
  message: string;
  isUser?: boolean;
}

export function BotMessage({ message, isUser }: Props) {
  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {!isUser && <Avatar.Icon size={32} icon="robot" style={styles.avatar} />}
      <View style={[styles.bubble, isUser && styles.userBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: 8,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
  },
  userBubble: {
    backgroundColor: '#0066CC',
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: '#FFF',
  },
});
```

**app/plan/bot.tsx (Bot Intake Screen):**
```typescript
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { BotMessage } from '../components/BotMessage';
import { rpcCreateLeadFromGuest } from '@oasis/api';
import { useSessionStore } from '../store/session';
import { router } from 'expo-router';

export default function BotIntakeScreen() {
  const [step, setStep] = useState(0);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [nights, setNights] = useState(0);
  const [paxAdults, setPaxAdults] = useState(1);
  
  const guestSessionId = useSessionStore((s) => s.guestSessionId);

  const questions = [
    'Where would you like to go?',
    'How many nights?',
    'How many adults traveling?',
  ];

  const submitLead = async () => {
    try {
      const leadId = await rpcCreateLeadFromGuest(guestSessionId!, {
        destinations,
        nights,
        pax_adults: paxAdults,
      });
      
      router.push(`/lead/${leadId}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <BotMessage message="Hi! I'm here to help you plan your trip. Let's get started!" />
      
      {step >= 0 && (
        <>
          <BotMessage message={questions[0]} />
          <View style={styles.chipContainer}>
            {['Udaipur', 'Jaipur', 'Goa', 'Kerala'].map((dest) => (
              <Chip
                key={dest}
                selected={destinations.includes(dest)}
                onPress={() => {
                  setDestinations((prev) =>
                    prev.includes(dest)
                      ? prev.filter((d) => d !== dest)
                      : [...prev, dest]
                  );
                }}
                style={styles.chip}
              >
                {dest}
              </Chip>
            ))}
          </View>
        </>
      )}

      {step >= 1 && (
        <>
          <BotMessage message={questions[1]} />
          <View style={styles.chipContainer}>
            {[3, 4, 5, 7].map((n) => (
              <Chip
                key={n}
                selected={nights === n}
                onPress={() => setNights(n)}
                style={styles.chip}
              >
                {n} nights
              </Chip>
            ))}
          </View>
        </>
      )}

      {step >= 2 && (
        <>
          <BotMessage message={questions[2]} />
          <View style={styles.chipContainer}>
            {[1, 2, 3, 4].map((n) => (
              <Chip
                key={n}
                selected={paxAdults === n}
                onPress={() => setPaxAdults(n)}
                style={styles.chip}
              >
                {n} {n === 1 ? 'adult' : 'adults'}
              </Chip>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        {step < 2 && (
          <Button
            mode="contained"
            onPress={() => setStep(step + 1)}
            disabled={step === 0 && destinations.length === 0}
          >
            Next
          </Button>
        )}
        
        {step === 2 && (
          <Button mode="contained" onPress={submitLead}>
            Get Quote
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  chip: {
    margin: 4,
  },
  buttonContainer: {
    padding: 16,
  },
});
```

### Day 3-4: Quotes List & Detail

**app/(tabs)/quotes.tsx:**
```typescript
import { FlatList, View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getQuotes } from '@oasis/api';
import { formatINR, formatDate } from '@oasis/utils';
import { router } from 'expo-router';

export default function QuotesScreen() {
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotes,
  });

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => router.push(`/quote/${item.id}`)}
        >
          <Card.Content>
            <View style={styles.header}>
              <Text variant="titleMedium">Version {item.version}</Text>
              <Chip mode="outlined">{item.status}</Chip>
            </View>
            
            <Text variant="headlineSmall" style={styles.amount}>
              {formatINR(item.total_amount)}
            </Text>
            
            <Text variant="bodySmall" style={styles.validity}>
              Valid until: {formatDate(item.validity_date)}
            </Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    marginVertical: 8,
  },
  validity: {
    color: '#666',
  },
});
```

### Day 5-6: Trip Screen

**app/(tabs)/trips.tsx:**
```typescript
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import { router } from 'expo-router';

export default function TripsScreen() {
  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => router.push(`/trip/${item.id}`)}
        >
          <Card.Content>
            <Text variant="titleLarge">{item.title}</Text>
            <Text variant="bodyMedium">
              {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});
```

**app/trip/[id].tsx:**
```typescript
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTripPosts, getSupabase } from '@oasis/api';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  
  const { data: posts } = useQuery({
    queryKey: ['trip-posts', id],
    queryFn: () => getTripPosts(id as string),
  });

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Trip Channel
      </Text>
      
      {posts?.map((post) => (
        <Card key={post.id} style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{post.content.title}</Text>
            <Text variant="bodyMedium">{post.content.body}</Text>
            
            {post.quick_actions?.map((action: any) => (
              <Button
                key={action.id}
                mode="outlined"
                style={styles.actionButton}
              >
                {action.label}
              </Button>
            ))}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
});
```

### Day 7: Polish & Testing

- Add loading states
- Add error handling
- Add pull-to-refresh
- Test all flows end-to-end

### Deliverables Checklist - Section 10

- [ ] Bot intake 3-step flow functional
- [ ] Destinations, nights, pax selection working
- [ ] Lead creation via RPC
- [ ] Quotes list showing all quotes
- [ ] Quote detail screen
- [ ] Quote comparison view (optional for now)
- [ ] Trips list showing user's trips
- [ ] Trip detail with posts/channel
- [ ] Offline caching with React Query

---

## Handoff

Once complete, notify Mobile Engineer (Features):
"Mobile core and primary features complete. Section 11 (Support & Emergency) can now proceed. All auth, navigation, and data flows working."

---

## Success Criteria

✅ Section 9 Complete When:
- Guest mode works (UUID persists)
- OTP flow completes
- Guest-to-user merge successful
- Navigation between all tabs works
- Theme applied consistently

✅ Section 10 Complete When:
- Bot intake creates lead
- Quotes display correctly
- Trip channel shows posts
- All screens handle loading/error states
- App works offline (cached data)


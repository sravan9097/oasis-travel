# Mobile Engineer (Features) Guide

**Your Role:** Mobile Support & Emergency Features  
**Sections:** 11  
**Duration:** Week 5-6 (5-7 days)  
**Dependencies:** Section 9 (Mobile Core)

---

## Overview

You are responsible for support and emergency features in the mobile app:
1. **Section 11**: Support forms, emergency escalation, push notifications, accessibility

Your work completes the customer-facing mobile app.

---

## Section 11: Mobile App - Support & Emergency

### Timeline
- **Start**: After Section 9 complete (can parallel with Section 10)
- **Duration**: 5-7 days

### Prerequisites

```bash
cd apps/mobile

# Verify core is working
npm run ios  # or android

# Ensure you can import from shared packages
import { rpcRaiseIncident } from '@oasis/api';
```

### Objective
Implement support ticket system, emergency P0 escalation, push notifications, and accessibility features.

---

### Day 1: Support Screen Foundation

**app/(tabs)/support.tsx:**
```typescript
import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '@oasis/api';

export default function SupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  const categories = [
    { value: 'transport_delay', label: 'Transport Issue', icon: 'car' },
    { value: 'room_issue', label: 'Hotel Issue', icon: 'bed' },
    { value: 'billing', label: 'Billing Query', icon: 'receipt' },
    { value: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const activeTrip = trips?.find((t) => {
    const now = new Date();
    return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
  });

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall">How can we help?</Text>
          
          {activeTrip && (
            <View style={styles.emergencyContainer}>
              <Button
                mode="contained"
                buttonColor="#D32F2F"
                icon="alert"
                onPress={() => router.push(`/support/emergency?tripId=${activeTrip.id}`)}
                style={styles.emergencyButton}
              >
                Emergency Help
              </Button>
              <Text variant="bodySmall" style={styles.emergencyText}>
                We'll respond in ≤5 minutes
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Report an Issue
      </Text>

      {categories.map((cat) => (
        <Card
          key={cat.value}
          style={styles.categoryCard}
          onPress={() => router.push(`/support/create?category=${cat.value}`)}
        >
          <Card.Content style={styles.categoryContent}>
            <Text variant="titleMedium">{cat.label}</Text>
            <Text variant="bodyMedium" style={styles.categoryDescription}>
              Tap to report
            </Text>
          </Card.Content>
        </Card>
      ))}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Contact Information</Text>
          <Text variant="bodyMedium" style={styles.contactText}>
            📞 Customer Support: +91-XXXX-XXXX
          </Text>
          <Text variant="bodyMedium" style={styles.contactText}>
            📧 Email: support@oasistravel.com
          </Text>
          <Text variant="bodySmall" style={styles.hoursText}>
            Available 24/7 for emergencies
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  emergencyContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emergencyButton: {
    width: '100%',
  },
  emergencyText: {
    marginTop: 4,
    color: '#666',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  categoryCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryDescription: {
    color: '#666',
  },
  contactText: {
    marginTop: 8,
  },
  hoursText: {
    marginTop: 8,
    color: '#666',
  },
});
```

### Day 2: Incident Creation Form

**app/support/create.tsx:**
```typescript
import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Chip } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rpcRaiseIncident, getTrips } from '@oasis/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const incidentSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['P0', 'P1', 'P2']),
});

type IncidentForm = z.infer<typeof incidentSchema>;

export default function CreateIncidentScreen() {
  const { category } = useLocalSearchParams();
  const [selectedTrip, setSelectedTrip] = useState<string>('');

  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  const { control, handleSubmit, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      category: category as string || '',
      description: '',
      severity: 'P2',
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentForm) => {
      if (!selectedTrip) throw new Error('Please select a trip');
      
      return rpcRaiseIncident(
        selectedTrip,
        data.severity,
        data.category,
        data.description
      );
    },
    onSuccess: () => {
      Alert.alert(
        'Issue Reported',
        'Our team will respond shortly. We typically respond within 30 minutes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
    },
  });

  const onSubmit = (data: IncidentForm) => {
    createIncidentMutation.mutate(data);
  };

  // Find active trip
  const activeTrip = trips?.find((t) => {
    const now = new Date();
    return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
  });

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Report an Issue
      </Text>

      {/* Trip Selection */}
      <Text variant="titleMedium" style={styles.label}>
        Select Trip
      </Text>
      {activeTrip && (
        <Chip
          selected={selectedTrip === activeTrip.id}
          onPress={() => setSelectedTrip(activeTrip.id)}
          style={styles.chip}
        >
          {activeTrip.title} (Active)
        </Chip>
      )}
      {trips?.filter((t) => t.id !== activeTrip?.id).slice(0, 3).map((trip) => (
        <Chip
          key={trip.id}
          selected={selectedTrip === trip.id}
          onPress={() => setSelectedTrip(trip.id)}
          style={styles.chip}
        >
          {trip.title}
        </Chip>
      ))}

      {/* Severity */}
      <Text variant="titleMedium" style={styles.label}>
        Urgency
      </Text>
      <Controller
        control={control}
        name="severity"
        render={({ field: { value, onChange } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={onChange}
            buttons={[
              { value: 'P2', label: 'Normal' },
              { value: 'P1', label: 'Urgent' },
            ]}
          />
        )}
      />

      {/* Category */}
      <Text variant="titleMedium" style={styles.label}>
        Category
      </Text>
      <Controller
        control={control}
        name="category"
        render={({ field: { value, onChange } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={onChange}
            buttons={[
              { value: 'transport_delay', label: 'Transport' },
              { value: 'room_issue', label: 'Hotel' },
              { value: 'billing', label: 'Billing' },
              { value: 'other', label: 'Other' },
            ]}
          />
        )}
      />
      {errors.category && (
        <Text style={styles.error}>{errors.category.message}</Text>
      )}

      {/* Description */}
      <Text variant="titleMedium" style={styles.label}>
        Description
      </Text>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Please describe the issue in detail..."
            error={!!errors.description}
          />
        )}
      />
      {errors.description && (
        <Text style={styles.error}>{errors.description.message}</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={createIncidentMutation.isPending}
        disabled={createIncidentMutation.isPending || !selectedTrip}
        style={styles.submitButton}
      >
        Submit Issue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    marginBottom: 24,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 8,
  },
  error: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
```

### Day 3: Emergency Bottom Sheet

```bash
npm install @gorhom/bottom-sheet@^4.6.0
npm install react-native-gesture-handler react-native-reanimated
```

**app/support/emergency.tsx:**
```typescript
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rpcRaiseIncident, getSupabase } from '@oasis/api';

export default function EmergencyScreen() {
  const { tripId } = useLocalSearchParams();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [called, setCalled] = useState(false);

  // Get on-call number from admin_settings
  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'on_call')
        .single();
      return data?.value as { phone: string; hours: string };
    },
  });

  const createP0Mutation = useMutation({
    mutationFn: async (description: string) => {
      return rpcRaiseIncident(
        tripId as string,
        'P0',
        'emergency',
        description
      );
    },
    onSuccess: () => {
      Alert.alert(
        'Emergency Alert Sent',
        'Our team has been notified and will call you shortly.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleEmergencyCall = () => {
    if (!settings?.phone) {
      Alert.alert('Error', 'Unable to get emergency contact');
      return;
    }

    Alert.alert(
      'Call Emergency Support?',
      `This will call ${settings.phone} and create a high-priority incident.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            // Create P0 incident
            createP0Mutation.mutate('Emergency call requested');
            
            // Initiate call
            Linking.openURL(`tel:${settings.phone}`);
            setCalled(true);
          },
        },
      ]
    );
  };

  const handleMedicalEmergency = () => {
    Alert.alert(
      'Medical Emergency',
      'For immediate medical emergencies, call 112 (India) or local emergency services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card style={[styles.card, styles.emergencyCard]}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.emergencyTitle}>
            🚨 Emergency Help
          </Text>
          
          <Text variant="bodyLarge" style={styles.description}>
            We'll respond within 5 minutes
          </Text>

          <View style={styles.infoBox}>
            <Text variant="bodyMedium">
              Available: {settings?.hours || '24x7'}
            </Text>
            <Text variant="bodyMedium">
              Response Time: ≤5 minutes
            </Text>
          </View>

          <Button
            mode="contained"
            buttonColor="#D32F2F"
            icon="phone"
            onPress={handleEmergencyCall}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Call Emergency Support
          </Button>

          <Button
            mode="outlined"
            icon="hospital"
            onPress={handleMedicalEmergency}
            style={styles.button}
          >
            Medical Emergency (112)
          </Button>

          {called && (
            <View style={styles.successBox}>
              <Text variant="bodyMedium" style={styles.successText}>
                ✓ Emergency alert sent. Our team will call you shortly.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">When to Use Emergency Support</Text>
          <Text variant="bodyMedium" style={styles.listItem}>
            • Serious safety concerns
          </Text>
          <Text variant="bodyMedium" style={styles.listItem}>
            • Stranded without transport
          </Text>
          <Text variant="bodyMedium" style={styles.listItem}>
            • Hotel refusing accommodation
          </Text>
          <Text variant="bodyMedium" style={styles.listItem}>
            • Any urgent travel crisis
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">For Non-Emergencies</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Use the regular support form for routine issues like minor delays,
            billing questions, or general inquiries.
          </Text>
          <Button
            mode="text"
            onPress={() => router.back()}
          >
            Back to Support
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  card: {
    marginBottom: 16,
  },
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 2,
  },
  emergencyTitle: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  successBox: {
    backgroundColor: '#C8E6C9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    color: '#2E7D32',
    textAlign: 'center',
  },
  listItem: {
    marginVertical: 4,
  },
});
```

### Day 4: Push Notifications Setup

```bash
npm install expo-notifications@^0.27.0
npm install expo-device@^5.9.0
```

**app/lib/notifications.ts:**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Get the token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });

    // High priority channel for emergencies
    Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: '#D32F2F',
      sound: 'default',
    });
  }

  return token.data;
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // Listener for when a notification is tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onNotificationTapped
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: { seconds: 1 },
  });
}
```

**Update app/_layout.tsx to register notifications:**
```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerForPushNotifications, setupNotificationListeners } from './lib/notifications';

export default function RootLayout() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log('Push token:', token);
        // TODO: Send token to backend to store for this user
        // await supabase.from('user_push_tokens').upsert({ user_id: ..., token });
      }
    });

    // Setup listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle foreground notification
      },
      (response) => {
        console.log('Notification tapped:', response);
        
        // Handle deep linking based on notification data
        const data = response.notification.request.content.data;
        
        if (data.trip_id) {
          router.push(`/trip/${data.trip_id}`);
        } else if (data.quote_id) {
          router.push(`/quote/${data.quote_id}`);
        } else if (data.incident_id) {
          router.push('/support');
        }
      }
    );

    return cleanup;
  }, []);

  return (
    // ... rest of layout
  );
}
```

### Day 5: Accessibility Implementation

**app/lib/accessibility.ts:**
```typescript
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Announce message to screen reader
 */
export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * Get recommended minimum touch size
 */
export const MIN_TOUCH_SIZE = 44; // Apple HIG and Material guidelines

/**
 * Check color contrast ratio
 */
export function hasGoodContrast(
  foreground: string,
  background: string
): boolean {
  // Simplified - in production use a proper contrast checker
  return true; // TODO: Implement proper contrast checking
}
```

**Update app/theme.ts for accessibility:**
```typescript
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFA000',
    tertiary: '#00BFA5',
    error: '#D32F2F',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    // High contrast mode colors
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
  },
  // Larger touch targets
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4D9FFF',
    secondary: '#FFB74D',
    tertiary: '#4DD0C0',
    error: '#EF5350',
    // Ensure sufficient contrast in dark mode
  },
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
```

**Create accessible button component:**

**app/components/AccessibleButton.tsx:**
```typescript
import { Button, ButtonProps } from 'react-native-paper';
import { MIN_TOUCH_SIZE } from '../lib/accessibility';

interface Props extends ButtonProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function AccessibleButton({
  accessibilityLabel,
  accessibilityHint,
  ...props
}: Props) {
  return (
    <Button
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      style={[
        { minHeight: MIN_TOUCH_SIZE },
        props.style,
      ]}
    />
  );
}
```

### Day 6: Offline Support Enhancement

**app/lib/offline.ts:**
```typescript
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}

/**
 * Cache trip data for offline viewing
 */
export async function cacheTripData(tripId: string, data: any) {
  const directory = `${FileSystem.documentDirectory}trips/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  
  const filePath = `${directory}${tripId}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
}

/**
 * Retrieve cached trip data
 */
export async function getCachedTripData(tripId: string) {
  const filePath = `${FileSystem.documentDirectory}trips/${tripId}.json`;
  
  try {
    const contents = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

/**
 * Clear old cache files
 */
export async function clearOldCache(daysOld: number = 30) {
  const directory = `${FileSystem.documentDirectory}trips/`;
  
  try {
    const files = await FileSystem.readDirectoryAsync(directory);
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${directory}${file}`);
      if (info.exists && info.modificationTime! * 1000 < cutoffTime) {
        await FileSystem.deleteAsync(`${directory}${file}`);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
}
```

**Update trip screen to support offline:**

```typescript
// In app/trip/[id].tsx
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { cacheTripData, getCachedTripData, useOnlineStatus } from '../lib/offline';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const isOnline = useOnlineStatus();

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      if (!isOnline) {
        // Try to get cached data
        const cached = await getCachedTripData(id as string);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_posts(*), bookings(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Cache for offline use
      await cacheTripData(id as string, data);

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <View>
      {!isOnline && (
        <Banner visible={true}>
          You're offline. Showing cached trip data.
        </Banner>
      )}
      {/* Rest of component */}
    </View>
  );
}
```

### Day 7: Internationalization (i18n) Setup

```bash
npm install i18n-js
```

**app/lib/i18n.ts:**
```typescript
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const translations = {
  en: {
    welcome: 'Welcome to Oasis Travel',
    signIn: 'Sign In',
    browseAsGuest: 'Browse as Guest',
    emergency: 'Emergency',
    emergencyHelp: 'Emergency Help',
    weRespondIn: 'We\'ll respond in ≤5 minutes',
    callEmergencySupport: 'Call Emergency Support',
    reportIssue: 'Report an Issue',
    transportIssue: 'Transport Issue',
    hotelIssue: 'Hotel Issue',
    billingQuery: 'Billing Query',
    other: 'Other',
  },
  hi: {
    welcome: 'ओएसिस ट्रैवल में आपका स्वागत है',
    signIn: 'साइन इन करें',
    browseAsGuest: 'अतिथि के रूप में ब्राउज़ करें',
    emergency: 'आपातकाल',
    emergencyHelp: 'आपातकालीन सहायता',
    weRespondIn: 'हम ≤5 मिनट में जवाब देंगे',
    callEmergencySupport: 'आपातकालीन सहायता कॉल करें',
    reportIssue: 'समस्या की रिपोर्ट करें',
    transportIssue: 'परिवहन समस्या',
    hotelIssue: 'होटल समस्या',
    billingQuery: 'बिलिंग प्रश्न',
    other: 'अन्य',
  },
};

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app
i18n.locale = Localization.locale;

// Enable fallback to 'en' if translation not found
i18n.enableFallback = true;

export default i18n;

// Helper function for easy translation
export function t(key: string, options?: any) {
  return i18n.t(key, options);
}
```

**Usage in components:**
```typescript
import { t } from '../lib/i18n';

<Text>{t('welcome')}</Text>
<Button>{t('signIn')}</Button>
```

### Day 7 (continued): Polish & Testing

**Create app/components/OfflineBanner.tsx:**
```typescript
import { useState, useEffect } from 'react';
import { Banner } from 'react-native-paper';
import { useOnlineStatus } from '../lib/offline';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(!isOnline);

  useEffect(() => {
    setVisible(!isOnline);
  }, [isOnline]);

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: 'Dismiss',
          onPress: () => setVisible(false),
        },
      ]}
      icon="wifi-off"
    >
      You're offline. Some features may be limited.
    </Banner>
  );
}
```

**Add to main layouts:**
```typescript
// In app/_layout.tsx or (tabs)/_layout.tsx
import { OfflineBanner } from '../components/OfflineBanner';

return (
  <>
    <OfflineBanner />
    {/* Rest of layout */}
  </>
);
```

---

## Testing Checklist

### Support Flow
- [ ] Support screen loads with categories
- [ ] Can create incident with all fields
- [ ] Form validation works
- [ ] Success message shown
- [ ] Error handling works

### Emergency Flow
- [ ] Emergency button visible on active trips only
- [ ] Emergency screen shows correct info
- [ ] Call button initiates phone call
- [ ] P0 incident created on emergency call
- [ ] Medical emergency (112) button works

### Push Notifications
- [ ] Permissions requested on first launch
- [ ] Token registered and logged
- [ ] Foreground notifications show
- [ ] Tapping notification navigates correctly
- [ ] Deep linking works (trip, quote, incident)

### Accessibility
- [ ] All buttons have accessibility labels
- [ ] Screen reader announces key actions
- [ ] Touch targets ≥44pt
- [ ] High contrast mode works
- [ ] Font scaling works

### Offline Support
- [ ] Offline banner shows when offline
- [ ] Cached trip data loads offline
- [ ] Error message if no cache available
- [ ] Online status detected correctly
- [ ] Cache clears old files

### Internationalization
- [ ] English translations work
- [ ] Hindi translations work
- [ ] Locale detection automatic
- [ ] Fallback to English works

---

## Deliverables Checklist

- [ ] Support screen with category selection
- [ ] Incident creation form with validation
- [ ] Emergency bottom sheet/screen
- [ ] Emergency call integration
- [ ] P0 incident creation
- [ ] Push notifications setup
- [ ] Deep linking working
- [ ] Accessibility labels on all interactive elements
- [ ] Touch targets ≥44pt
- [ ] Offline mode with caching
- [ ] Offline banner
- [ ] Internationalization setup (English + Hindi)
- [ ] All features tested on iOS and Android
- [ ] No accessibility violations

---

## Handoff

Once Section 11 is complete, notify QA Engineer:
"Mobile app features complete. Support, emergency, notifications, accessibility, and offline mode all functional. Ready for comprehensive testing (Section 14)."

Also notify project lead:
"Customer mobile app 100% complete. All three sections (9, 10, 11) delivered."

---

## Success Criteria

✅ Section 11 Complete When:
- Support forms create incidents via RPC
- Emergency flow creates P0 incidents
- Emergency call integration works
- Push notifications registered and working
- Deep linking navigates correctly
- All screens accessible (screen reader compatible)
- Touch targets meet minimum size
- App works offline with cached data
- Translations work (English + Hindi)
- No critical accessibility issues
- Tested on both iOS and Android

---

## Performance Checklist

- [ ] App startup time <3 seconds
- [ ] Screen transitions smooth (60fps)
- [ ] Images optimized and cached
- [ ] No memory leaks
- [ ] Battery usage reasonable
- [ ] Network requests minimized
- [ ] Offline mode doesn't block UI

---

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [i18n-js Documentation](https://github.com/fnando/i18n-js)
- [NetInfo for Offline Detection](https://github.com/react-native-netinfo/react-native-netinfo)


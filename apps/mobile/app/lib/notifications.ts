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
  try {
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

    // Get the token - handle Expo Go limitations gracefully
    try {
      // Try to get projectId from multiple sources
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.manifest?.extra?.eas?.projectId ||
        Constants.expoConfig?.extra?.projectId ||
        Constants.manifest?.extra?.projectId;

      // projectId is required for push notifications
      // If not available, we can't get a push token
      if (!projectId) {
        console.warn(
          'No projectId found. Push notifications require a projectId. ' +
          'Set it in app.json under extra.eas.projectId or use EAS Build.'
        );
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0066CC',
          });

          // High priority channel for emergencies
          await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 500, 500],
            lightColor: '#D32F2F',
            sound: 'default',
          });
        } catch (channelError) {
          console.warn('Could not set notification channels:', channelError);
          // Continue without channels - will work in dev builds
        }
      }

      return token.data;
    } catch (tokenError: any) {
      // Handle Expo Go limitation (SDK 53+)
      if (tokenError.message?.includes('Expo Go') || tokenError.message?.includes('development build')) {
        console.warn('Push notifications require a development build. Use `npm run dev` instead of Expo Go.');
        return null;
      }
      throw tokenError;
    }
  } catch (error) {
    console.warn('Error registering for push notifications:', error);
    return null;
  }
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


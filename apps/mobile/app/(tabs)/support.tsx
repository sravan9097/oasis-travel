import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Divider, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTrips, getSupabase } from '@oasis/api';
import { useSessionStore } from '../store/session';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const session = useSessionStore((s) => s.session);
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  const setSession = useSessionStore((s) => s.setSession);
  const setGuestSessionId = useSessionStore((s) => s.setGuestSessionId);
  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
    enabled: !!session,
  });
  
  // Check if user is in guest mode
  const isGuest = !session && !!guestSessionId;

  const categories = [
    { value: 'transport_delay', label: 'Transport Issue', icon: 'car' },
    { value: 'room_issue', label: 'Hotel Issue', icon: 'bed' },
    { value: 'billing', label: 'Billing Query', icon: 'receipt' },
    { value: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const activeTrip = trips?.find((t) => {
    if (!t.start_date || !t.end_date) return false;
    const now = new Date();
    return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
  });

  const handleLogin = () => {
    router.push('/(auth)/otp');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const supabase = getSupabase();
              await supabase.auth.signOut();
              setSession(null);
              setGuestSessionId(null);
              await SecureStore.deleteItemAsync('guest_session_id');
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get user display name
  const userName = session?.user?.phone || session?.user?.email || (isGuest ? 'Guest User' : 'User');
  const userSubtext = session ? 
    (session.user.phone ? 'Phone verified' : 'Email verified') : 
    (isGuest ? 'Testing Mode - Guest Session' : 'Not signed in');

  return (
    <ScrollView style={styles.container}>
      {/* Always show profile (even for guests) */}
      {(session || isGuest) && (
        <>
          {/* Profile Header */}
          <Card style={styles.card}>
            <Card.Content style={styles.profileHeader}>
              <Avatar.Icon size={64} icon="account-circle" style={styles.avatar} />
              <View style={styles.profileInfo}>
                <Text variant="titleLarge" style={styles.profileName}>
                  {userName}
                </Text>
                <Text variant="bodyMedium" style={styles.profileSubtext}>
                  {userSubtext}
                </Text>
                {isGuest && (
                  <Text variant="bodySmall" style={styles.guestNote}>
                    🧪 You're in testing mode
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Settings Section */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Settings
          </Text>

      <Card style={styles.card}>
            <Card.Content style={styles.settingsContent}>
              <Button
                mode="text"
                icon="account-edit"
                onPress={() => {
                  // TODO: Navigate to profile edit screen
                  Alert.alert('Coming Soon', 'Profile editing will be available soon.');
                }}
                style={styles.settingItem}
                contentStyle={styles.settingItemContent}
              >
                Profile Details
              </Button>
              <Divider />
              <Button
                mode="text"
                icon="bell-outline"
                onPress={() => {
                  // TODO: Navigate to notifications settings
                  Alert.alert('Coming Soon', 'Notification settings will be available soon.');
                }}
                style={styles.settingItem}
                contentStyle={styles.settingItemContent}
              >
                Notifications
              </Button>
              <Divider />
              <Button
                mode="text"
                icon="shield-outline"
                onPress={() => {
                  // TODO: Navigate to privacy settings
                  Alert.alert('Coming Soon', 'Privacy settings will be available soon.');
                }}
                style={styles.settingItem}
                contentStyle={styles.settingItemContent}
              >
                Privacy & Security
              </Button>
            </Card.Content>
          </Card>

          {/* Support Section */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support & Contact
          </Text>
          
          {activeTrip && (
            <Card style={styles.card}>
              <Card.Content>
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
              </Card.Content>
            </Card>
          )}

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.supportSectionTitle}>
        Report an Issue
      </Text>
              {categories.map((cat, index) => (
                <View key={cat.value}>
                  <Button
                    mode="text"
                    icon={cat.icon}
          onPress={() => router.push(`/support/create?category=${cat.value}`)}
                    style={styles.supportItem}
                    contentStyle={styles.settingItemContent}
                  >
                    {cat.label}
                  </Button>
                  {index < categories.length - 1 && <Divider />}
                </View>
              ))}
          </Card.Content>
        </Card>

      <Card style={styles.card}>
        <Card.Content>
              <Text variant="titleMedium" style={styles.supportSectionTitle}>
                Contact Information
              </Text>
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
        </>
      )}

      {/* Logout/Clear Session Button */}
      {(session || isGuest) && (
        <View style={styles.logoutContainer}>
          {isGuest && (
            <Text variant="bodySmall" style={styles.guestLogoutNote}>
              Note: Clearing session will remove all your test data
            </Text>
          )}
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={loading}
            disabled={loading}
            textColor="#D32F2F"
            icon={isGuest ? "refresh" : "logout"}
            style={styles.logoutButton}
          >
            {isGuest ? 'Clear Test Session' : 'Logout'}
          </Button>
        </View>
      )}
      
      {/* Not logged in at all - Show sign in */}
      {!session && !isGuest && (
        <Card style={styles.card}>
          <Card.Content style={styles.loginCardContent}>
            <Avatar.Icon size={64} icon="account-circle" style={styles.avatar} />
            <Text variant="headlineSmall" style={styles.loginTitle}>
              Welcome!
            </Text>
            <Text variant="bodyMedium" style={styles.loginSubtitle}>
              Sign in to access your profile, trips, and more
            </Text>
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              icon="login"
            >
              Sign In
            </Button>
          </Card.Content>
        </Card>
      )}
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
  loginCardContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#0066CC',
  },
  loginTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 8,
    minWidth: 200,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontWeight: '600',
  },
  profileSubtext: {
    color: '#666',
    marginTop: 4,
  },
  guestNote: {
    color: '#0066CC',
    marginTop: 4,
    fontStyle: 'italic',
  },
  guestLogoutNote: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  settingsContent: {
    paddingVertical: 8,
  },
  settingItem: {
    justifyContent: 'flex-start',
    marginVertical: 4,
  },
  settingItemContent: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
  },
  supportSectionTitle: {
    marginBottom: 12,
  },
  supportItem: {
    justifyContent: 'flex-start',
    marginVertical: 4,
  },
  emergencyButton: {
    width: '100%',
    minHeight: 44,
    marginBottom: 8,
  },
  emergencyText: {
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
  },
  contactText: {
    marginTop: 8,
  },
  hoursText: {
    marginTop: 8,
    color: '#666',
  },
  logoutContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  logoutButton: {
    borderColor: '#D32F2F',
  },
});

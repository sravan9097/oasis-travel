import { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rpcRaiseIncident, getSupabase } from '@oasis/api';

export default function EmergencyScreen() {
  const { tripId } = useLocalSearchParams();
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
      return data?.value as { phone: string; hours: string } | null;
    },
    retry: false,
  });

  const createP0Mutation = useMutation({
    mutationFn: async (description: string) => {
      if (!tripId) throw new Error('Trip ID is required');
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
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send emergency alert');
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
    <ScrollView style={styles.container}>
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
            disabled={!settings?.phone}
            accessibilityLabel="Call Emergency Support"
            accessibilityHint="Calls emergency support and creates a high-priority incident"
          >
            Call Emergency Support
          </Button>

          <Button
            mode="outlined"
            icon="hospital"
            onPress={handleMedicalEmergency}
            style={styles.button}
            contentStyle={{ minHeight: 44 }}
            accessibilityLabel="Medical Emergency"
            accessibilityHint="Opens options to call medical emergency services"
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
            style={styles.backButton}
            accessibilityLabel="Back to Support"
            accessibilityRole="button"
          >
            Back to Support
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
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
    minHeight: 44,
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
  backButton: {
    marginTop: 8,
    minHeight: 44,
  },
});


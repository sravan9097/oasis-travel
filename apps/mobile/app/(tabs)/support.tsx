import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
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
    if (!t.start_date || !t.end_date) return false;
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
                accessibilityLabel="Emergency Help"
                accessibilityHint="Opens emergency support screen for immediate assistance"
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
          accessible={true}
          accessibilityLabel={`Report ${cat.label}`}
          accessibilityHint={`Opens form to report ${cat.label.toLowerCase()}`}
          accessibilityRole="button"
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
    minHeight: 44,
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
    minHeight: 44,
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


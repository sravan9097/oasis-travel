import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { formatINR } from '@oasis/utils';

export default function CompareQuotesScreen() {
  // TODO: Implement quote comparison view
  // This would show multiple quotes side by side
  
  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Compare Quotes
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Quote comparison feature coming soon
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
});


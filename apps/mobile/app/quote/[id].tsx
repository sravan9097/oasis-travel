import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getQuote, rpcAcceptQuote } from '@oasis/api';
import { formatINR, formatDate } from '@oasis/utils';
import { useState } from 'react';
import { router } from 'expo-router';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const [accepting, setAccepting] = useState(false);
  
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuote(id as string),
  });

  const handleAccept = async () => {
    if (!quote) return;
    
    setAccepting(true);
    try {
      const bookingId = await rpcAcceptQuote(quote.id);
      // Navigate to trips tab - trip will be created from booking
      router.push('/(tabs)/trips');
    } catch (error) {
      console.error('Error accepting quote:', error);
      // TODO: Show error message with Snackbar
    } finally {
      setAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.center}>
        <Text>Quote not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge">Version {quote.version}</Text>
            <Chip mode="outlined">{quote.status}</Chip>
          </View>
          
          <Text variant="headlineMedium" style={styles.amount}>
            {formatINR(quote.total_amount)}
          </Text>
          
          {quote.validity_date && (
            <Text variant="bodyMedium" style={styles.validity}>
              Valid until: {formatDate(quote.validity_date)}
            </Text>
          )}
        </Card.Content>
      </Card>

      {quote.inclusions && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Inclusions
            </Text>
            <Text variant="bodyMedium">{quote.inclusions}</Text>
          </Card.Content>
        </Card>
      )}

      {quote.exclusions && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Exclusions
            </Text>
            <Text variant="bodyMedium">{quote.exclusions}</Text>
          </Card.Content>
        </Card>
      )}

      {quote.status === 'SENT' && (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleAccept}
            loading={accepting}
            style={styles.button}
          >
            Accept Quote
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/quote/compare')}
            style={styles.button}
          >
            Compare with Others
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  button: {
    marginVertical: 8,
  },
});


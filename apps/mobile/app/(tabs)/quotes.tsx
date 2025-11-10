import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getQuotes, getLeads } from '@oasis/api';
import { formatINR, formatDate } from '@oasis/utils';
import { router } from 'expo-router';
import { useSessionStore } from '../store/session';

export default function QuotesScreen() {
  const session = useSessionStore((s) => s.session);
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  
  // Get all leads first, then get quotes for each lead
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
    enabled: !!session || !!guestSessionId,
  });

  // Get all quotes for all leads
  const { data: quotes, isLoading: quotesLoading, refetch, isRefetching } = useQuery({
    queryKey: ['quotes', leads?.map(l => l.id)],
    queryFn: async () => {
      if (!leads || leads.length === 0) return [];
      
      // Fetch quotes for all leads in parallel
      const quotePromises = leads.map(lead => getQuotes(lead.id));
      const quoteArrays = await Promise.all(quotePromises);
      
      // Flatten the array of arrays
      return quoteArrays.flat();
    },
    enabled: !!leads && leads.length > 0,
  });

  const isLoading = leadsLoading || quotesLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No quotes yet. Start planning to get quotes!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
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
              Valid until: {formatDate(item.validity_date || '')}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});


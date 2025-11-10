import { FlatList, StyleSheet, RefreshControl, View } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import { router } from 'expo-router';
import { useSessionStore } from '../store/session';

export default function TripsScreen() {
  const session = useSessionStore((s) => s.session);
  
  const { data: trips, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No trips yet. Accept a quote to create your first trip!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
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


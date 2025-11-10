import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTripPosts, getTrip } from '@oasis/api';
import { formatDate } from '@oasis/utils';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => getTrip(id as string),
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['trip-posts', id],
    queryFn: () => getTripPosts(id as string),
  });

  if (tripLoading || postsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            {trip.title}
          </Text>
          <Text variant="bodyMedium" style={styles.dates}>
            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Trip Channel
      </Text>
      
      {posts && posts.length > 0 ? (
        posts.map((post) => (
          <Card key={post.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">
                {post.content?.title || 'Trip Update'}
              </Text>
              <Text variant="bodyMedium" style={styles.postBody}>
                {post.content?.body || ''}
              </Text>
              
              {post.quick_actions && post.quick_actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  {post.quick_actions.map((action: any) => (
                    <Button
                      key={action.id}
                      mode="outlined"
                      style={styles.actionButton}
                    >
                      {action.label}
                    </Button>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No posts yet. Check back soon for updates!
            </Text>
          </Card.Content>
        </Card>
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
  headerCard: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  dates: {
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  postBody: {
    marginTop: 8,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});


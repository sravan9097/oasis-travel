import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to Oasis Travel
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Plan your perfect trip with our expert help
      </Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Start Planning
          </Text>
          <Text variant="bodySmall" style={styles.cardText}>
            Use our bot to create a personalized travel plan
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/plan/bot')}
            style={styles.button}
          >
            Start Planning
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  card: {
    marginTop: 20,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardText: {
    marginBottom: 16,
    color: '#666',
  },
  button: {
    marginTop: 8,
  },
});


import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rpcRaiseIncident, getTrips } from '@oasis/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const incidentSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['P0', 'P1', 'P2']),
});

type IncidentForm = z.infer<typeof incidentSchema>;

export default function CreateIncidentScreen() {
  const { category } = useLocalSearchParams();
  const [selectedTrip, setSelectedTrip] = useState<string>('');

  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  const { control, handleSubmit, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      category: category as string || '',
      description: '',
      severity: 'P2',
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentForm) => {
      if (!selectedTrip) throw new Error('Please select a trip');
      
      return rpcRaiseIncident(
        selectedTrip,
        data.severity,
        data.category,
        data.description
      );
    },
    onSuccess: () => {
      Alert.alert(
        'Issue Reported',
        'Our team will respond shortly. We typically respond within 30 minutes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to report issue. Please try again.');
    },
  });

  const onSubmit = (data: IncidentForm) => {
    createIncidentMutation.mutate(data);
  };

  // Find active trip
  const activeTrip = trips?.find((t) => {
    const now = new Date();
    return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
  });

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Report an Issue
      </Text>

      {/* Trip Selection */}
      <Text variant="titleMedium" style={styles.label}>
        Select Trip
      </Text>
      {activeTrip && (
        <Chip
          selected={selectedTrip === activeTrip.id}
          onPress={() => setSelectedTrip(activeTrip.id)}
          style={styles.chip}
          accessibilityLabel={`Select active trip: ${activeTrip.title}`}
          accessibilityRole="button"
        >
          {activeTrip.title} (Active)
        </Chip>
      )}
      {trips?.filter((t) => t.id !== activeTrip?.id).slice(0, 3).map((trip) => (
        <Chip
          key={trip.id}
          selected={selectedTrip === trip.id}
          onPress={() => setSelectedTrip(trip.id)}
          style={styles.chip}
          accessibilityLabel={`Select trip: ${trip.title}`}
          accessibilityRole="button"
        >
          {trip.title}
        </Chip>
      ))}

      {/* Severity */}
      <Text variant="titleMedium" style={styles.label}>
        Urgency
      </Text>
      <Controller
        control={control}
        name="severity"
        render={({ field: { value, onChange } }) => (
          <View style={styles.severityContainer}>
            <Chip
              selected={value === 'P2'}
              onPress={() => onChange('P2')}
              style={styles.severityChip}
              accessibilityLabel="Normal urgency"
              accessibilityRole="button"
            >
              Normal
            </Chip>
            <Chip
              selected={value === 'P1'}
              onPress={() => onChange('P1')}
              style={styles.severityChip}
              accessibilityLabel="Urgent"
              accessibilityRole="button"
            >
              Urgent
            </Chip>
          </View>
        )}
      />

      {/* Category */}
      <Text variant="titleMedium" style={styles.label}>
        Category
      </Text>
      <Controller
        control={control}
        name="category"
        render={({ field: { value, onChange } }) => (
          <View style={styles.categoryContainer}>
            <Chip
              selected={value === 'transport_delay'}
              onPress={() => onChange('transport_delay')}
              style={styles.categoryChip}
              accessibilityLabel="Transport issue"
              accessibilityRole="button"
            >
              Transport
            </Chip>
            <Chip
              selected={value === 'room_issue'}
              onPress={() => onChange('room_issue')}
              style={styles.categoryChip}
              accessibilityLabel="Hotel issue"
              accessibilityRole="button"
            >
              Hotel
            </Chip>
            <Chip
              selected={value === 'billing'}
              onPress={() => onChange('billing')}
              style={styles.categoryChip}
              accessibilityLabel="Billing query"
              accessibilityRole="button"
            >
              Billing
            </Chip>
            <Chip
              selected={value === 'other'}
              onPress={() => onChange('other')}
              style={styles.categoryChip}
              accessibilityLabel="Other"
              accessibilityRole="button"
            >
              Other
            </Chip>
          </View>
        )}
      />
      {errors.category && (
        <Text style={styles.error}>{errors.category.message}</Text>
      )}

      {/* Description */}
      <Text variant="titleMedium" style={styles.label}>
        Description
      </Text>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Please describe the issue in detail..."
            error={!!errors.description}
            accessibilityLabel="Issue description"
            accessibilityHint="Enter a detailed description of the issue you're experiencing"
            style={styles.textInput}
          />
        )}
      />
      {errors.description && (
        <Text style={styles.error}>{errors.description.message}</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={createIncidentMutation.isPending}
        disabled={createIncidentMutation.isPending || !selectedTrip}
        style={styles.submitButton}
        accessibilityLabel="Submit issue report"
        accessibilityHint="Submits the issue report for review"
        contentStyle={{ minHeight: 44 }}
      >
        Submit Issue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    marginBottom: 24,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 8,
    marginRight: 8,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  severityChip: {
    minHeight: 44,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    minHeight: 44,
  },
  error: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});


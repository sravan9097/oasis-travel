import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { BotMessage } from '../components/BotMessage';
import { rpcCreateLeadFromGuest } from '@oasis/api';
import { useSessionStore } from '../store/session';
import { router } from 'expo-router';

export default function BotIntakeScreen() {
  const [step, setStep] = useState(0);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [nights, setNights] = useState(0);
  const [paxAdults, setPaxAdults] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  const session = useSessionStore((s) => s.session);

  const questions = [
    'Where would you like to go?',
    'How many nights?',
    'How many adults traveling?',
  ];

  const submitLead = async () => {
    if (!guestSessionId && !session) {
      // Should not happen, but handle gracefully
      return;
    }

    setLoading(true);
    try {
      const sessionId = guestSessionId || `user-${session?.user.id}`;
      const leadId = await rpcCreateLeadFromGuest(sessionId, {
        destinations,
        nights,
        pax_adults: paxAdults,
      });
      
      // Navigate to quotes tab - quotes will show up there once created
      router.push('/(tabs)/quotes');
    } catch (error) {
      console.error('Error creating lead:', error);
      // TODO: Show error message to user with Snackbar
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <BotMessage message="Hi! I'm here to help you plan your trip. Let's get started!" />
      
      {step >= 0 && (
        <>
          <BotMessage message={questions[0]} />
          <View style={styles.chipContainer}>
            {['Udaipur', 'Jaipur', 'Goa', 'Kerala'].map((dest) => (
              <Chip
                key={dest}
                selected={destinations.includes(dest)}
                onPress={() => {
                  setDestinations((prev) =>
                    prev.includes(dest)
                      ? prev.filter((d) => d !== dest)
                      : [...prev, dest]
                  );
                }}
                style={styles.chip}
              >
                {dest}
              </Chip>
            ))}
          </View>
        </>
      )}

      {step >= 1 && (
        <>
          <BotMessage message={questions[1]} />
          <View style={styles.chipContainer}>
            {[3, 4, 5, 7].map((n) => (
              <Chip
                key={n}
                selected={nights === n}
                onPress={() => setNights(n)}
                style={styles.chip}
              >
                {n} nights
              </Chip>
            ))}
          </View>
        </>
      )}

      {step >= 2 && (
        <>
          <BotMessage message={questions[2]} />
          <View style={styles.chipContainer}>
            {[1, 2, 3, 4].map((n) => (
              <Chip
                key={n}
                selected={paxAdults === n}
                onPress={() => setPaxAdults(n)}
                style={styles.chip}
              >
                {n} {n === 1 ? 'adult' : 'adults'}
              </Chip>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        {step < 2 && (
          <Button
            mode="contained"
            onPress={() => setStep(step + 1)}
            disabled={step === 0 && destinations.length === 0}
          >
            Next
          </Button>
        )}
        
        {step === 2 && (
          <Button mode="contained" onPress={submitLead} loading={loading}>
            Get Quote
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  chip: {
    margin: 4,
  },
  buttonContainer: {
    padding: 16,
  },
});


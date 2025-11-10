import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { getSupabase, rpcMergeGuestToUser } from '@oasis/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useSessionStore } from '../store/session';

export default function OTPScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setSession = useSessionStore((s) => s.setSession);

  const sendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({ phone });
      
      if (error) throw error;
      
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('No session created');
      
      // Set session
      setSession(data.session);
      
      // Merge guest data if exists
      const guestId = await SecureStore.getItemAsync('guest_session_id');
      if (guestId) {
        await rpcMergeGuestToUser(guestId);
        await SecureStore.deleteItemAsync('guest_session_id');
      }
      
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {step === 'phone' ? 'Enter Phone Number' : 'Enter OTP'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'phone' ? (
        <>
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={sendOTP}
            loading={loading}
            disabled={loading || !phone}
          >
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="OTP Code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={verifyOTP}
            loading={loading}
            disabled={loading || otp.length < 6}
          >
            Verify
          </Button>
          <Button mode="text" onPress={() => setStep('phone')} disabled={loading}>
            Change Phone Number
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});


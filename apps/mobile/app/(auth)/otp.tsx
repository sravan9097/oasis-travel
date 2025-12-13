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

  // Generate random phone number for testing
  const generateRandomPhone = (): string => {
    const random = Math.floor(1000000000 + Math.random() * 9000000000);
    return `+91${random}`;
  };

  // Generate random email for testing (works without SMS provider)
  const generateRandomEmail = (): string => {
    const random = Math.floor(1000000 + Math.random() * 9000000);
    return `test${random}@oasistravel.test`;
  };

  // Bypass OTP for testing - tries email first (works without SMS), falls back to phone
  const bypassOTPForTesting = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try email first (works in local Supabase without SMS provider)
      await createTestUserWithEmail();
    } catch (e: any) {
      console.error('Email bypass error:', e);
      // If email fails, try phone as fallback
      try {
        await createTestUserWithPhone();
      } catch (phoneError: any) {
        console.error('Phone bypass error:', phoneError);
        const errorMessage = phoneError.message || e.message || 'Failed to create test user. Please use regular login.';
        setError(errorMessage);
        
        // If error contains phone number, set it for manual entry
        const phoneMatch = errorMessage.match(/Phone: (\+91\d+)/);
        if (phoneMatch && phoneMatch[1]) {
          setPhone(phoneMatch[1]);
          setStep('otp');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Create test user with email (works without SMS provider)
  const createTestUserWithEmail = async () => {
    const supabase = getSupabase();
    const testEmail = generateRandomEmail();
    
    try {
      // Step 1: Send OTP via email (this creates user if they don't exist)
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (emailError) {
        throw new Error(`Failed to send email OTP: ${emailError.message}`);
      }

      // Step 2: Wait for OTP to be generated
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Try common test OTPs that work in development
      // In local Supabase, email OTPs are printed to logs
      const testOTPs = ['000000', '123456', '111111'];
      let session = null;

      for (const testOTP of testOTPs) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: testEmail,
          token: testOTP,
          type: 'email',
        });

        if (!error && data?.session) {
          session = data.session;
          break;
        } else if (error) {
          console.log(`Test OTP ${testOTP} failed:`, error.message);
        }
      }

      if (!session) {
        // Show email and guide user to check logs
        setError(
          `✅ Test user created!\n\n` +
          `📧 Email: ${testEmail}\n\n` +
          `To get OTP code:\n` +
          `1. Run: supabase logs --follow\n` +
          `2. Look for: "OTP for ${testEmail}: XXXXXX"\n` +
          `3. Use regular login with this email\n\n` +
          `Or try common test codes: 000000, 123456`
        );
        return;
      }

      // Step 4: Create profile in database
      await createProfileIfNeeded(session.user.id, testEmail, 'email');
      
      // Step 5: Set session and merge guest data
      setSession(session);
      await handleGuestMerge();
      
      // Step 6: Navigate to app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Email test user creation error:', error);
      throw error;
    }
  };

  // Create test user with random phone number (fallback if email doesn't work)
  const createTestUserWithPhone = async () => {
    const supabase = getSupabase();
    const testPhone = generateRandomPhone();
    
    try {
      // Step 1: Send OTP (this creates user if they don't exist)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: testPhone,
      });

      if (signInError) {
        // Handle specific error messages
        if (signInError.message.includes('unsupported phone provider') || 
            signInError.message.includes('SMS provider') ||
            signInError.message.includes('phone provider')) {
          throw new Error(
            `SMS provider not configured.\n\n` +
            `Email-based auth is being used instead.\n` +
            `If you see this, email auth also failed.\n\n` +
            `Please configure email auth in Supabase or set up SMS provider.`
          );
        }
        // Handle rate limiting gracefully
        if (signInError.message.includes('rate limit') || signInError.message.includes('security purposes')) {
          throw new Error(
            `Rate limit reached. Please wait a moment and try again.\n\n` +
            `Or check Supabase logs: supabase logs --follow`
          );
        }
        throw new Error(`Failed to send OTP: ${signInError.message}`);
      }

      // Step 2: Wait for OTP to be generated (longer wait for reliability)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Try common test OTPs that work in development
      // In local Supabase, OTPs are printed to logs
      const testOTPs = ['123456', '000000', '111111'];
      let session = null;
      let lastError = null;

      for (const testOTP of testOTPs) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: testPhone,
          token: testOTP,
          type: 'sms',
        });

        if (!error && data?.session) {
          session = data.session;
          break;
        } else if (error) {
          lastError = error;
          console.log(`Test OTP ${testOTP} failed:`, error.message);
        }
      }

      if (!session) {
        // If test OTPs don't work, show phone number and guide user to check logs
        setPhone(testPhone);
        setStep('otp');
        const errorMsg = 
          `✅ Test user created!\n\n` +
          `📱 Phone: ${testPhone}\n\n` +
          `To get OTP code:\n` +
          `1. Run: supabase logs --follow\n` +
          `2. Look for: "OTP for ${testPhone}: XXXXXX"\n` +
          `3. Enter the OTP code below\n\n` +
          `Or try common test codes: 123456, 000000`;
        setError(errorMsg);
        return;
      }

      // Step 4: Create profile in database
      await createProfileIfNeeded(session.user.id, testPhone, 'phone');
      
      // Step 5: Set session and merge guest data
      setSession(session);
      await handleGuestMerge();
      
      // Step 6: Navigate to app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Test user creation error:', error);
      // Re-throw with more context
      throw new Error(
        `Test login failed: ${error.message}\n\n` +
        `Phone: ${testPhone}\n\n` +
        `Troubleshooting:\n` +
        `1. Check Supabase is running: supabase status\n` +
        `2. Check logs: supabase logs --follow\n` +
        `3. Try regular login flow instead`
      );
    }
  };

  // Create profile in database if it doesn't exist
  const createProfileIfNeeded = async (userId: string, identifier: string, type: 'phone' | 'email' = 'phone') => {
    const supabase = getSupabase();
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // Create profile
      const profileData: any = {
        id: userId,
        role: 'customer',
        lang: 'en',
      };

      if (type === 'phone') {
        profileData.phone = identifier;
        profileData.display_name = `User ${identifier.slice(-4)}`; // Last 4 digits
      } else {
        profileData.email = identifier;
        profileData.display_name = `User ${identifier.split('@')[0].slice(-4)}`; // Last 4 chars of username
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw - profile might be created by trigger
      }
    }
  };

  // Handle guest merge
  const handleGuestMerge = async () => {
    try {
      const guestId = await SecureStore.getItemAsync('guest_session_id');
      if (guestId) {
        await rpcMergeGuestToUser(guestId);
        await SecureStore.deleteItemAsync('guest_session_id');
      }
    } catch (e) {
      console.error('Error merging guest:', e);
      // Don't throw - guest merge is not critical
    }
  };

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
      
      // Create profile if needed
      await createProfileIfNeeded(data.session.user.id, phone);
      
      // Set session
      setSession(data.session);
      
      // Merge guest data if exists
      await handleGuestMerge();
      
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

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

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
            style={styles.button}
          >
            Send OTP
          </Button>
          
          {/* Testing: Skip OTP Button */}
          <Button
            mode="outlined"
            onPress={bypassOTPForTesting}
            loading={loading}
            disabled={loading}
            style={styles.testButton}
            textColor="#666"
          >
            🧪 Skip OTP (Testing)
          </Button>
          <Text variant="bodySmall" style={styles.testHint}>
            For testing: Creates account with random phone number
          </Text>
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
  button: {
    marginTop: 8,
  },
  testButton: {
    marginTop: 16,
    borderColor: '#999',
  },
  testHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  error: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
  },
});


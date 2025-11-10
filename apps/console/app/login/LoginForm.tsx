'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Test credentials for development
  const TEST_CREDENTIALS = {
    admin: {
      email: 'admin@oasistravel.com',
      otp: '000000', // Default test OTP
      role: 'admin' as const,
    },
    operator: {
      email: 'operator@oasistravel.com',
      otp: '000000', // Default test OTP
      role: 'operator' as const,
    },
  };

  // Handle magic link callback
  useEffect(() => {
    // DEVELOPMENT: Skip magic link handling
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // PRODUCTION: Handle magic link
    const handleMagicLink = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type === 'email') {
        setLoading(true);
        setError(null);

        try {
          // COMMENTED OUT FOR DEVELOPMENT
          /*
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          });

          if (error) throw error;

          // Check if user is operator/admin
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user!.id)
            .single();

          if (profileError) throw profileError;

          if (profile?.role !== 'operator' && profile?.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied. Operators only.');
          }

          // Clear URL params and redirect
          router.replace('/dashboard');
          */
        } catch (error: any) {
          setError(error.message || 'Failed to verify magic link');
          setLoading(false);
        }
      }
    };

    handleMagicLink();
  }, [searchParams, router]);

  // Listen for auth state changes (for magic link)
  useEffect(() => {
    // DEVELOPMENT: Skip auth state listener
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // PRODUCTION: Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // COMMENTED OUT FOR DEVELOPMENT
        /*
        // Check if user is operator/admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'operator' || profile?.role === 'admin') {
          router.push('/dashboard');
        } else {
          await supabase.auth.signOut();
          setError('Access denied. Operators only.');
        }
        */
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEVELOPMENT: Bypass OTP flow
    if (process.env.NODE_ENV === 'development') {
      setError('⚠️ Development Mode: Use Quick Login buttons to bypass authentication');
      return;
    }
    
    // PRODUCTION: Actual OTP flow
    setLoading(true);
    setError(null);

    try {
      // COMMENTED OUT FOR DEVELOPMENT - Supabase auth disabled
      /*
      // Send OTP - Supabase will send either a magic link or OTP code
      // depending on configuration. We handle both cases.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Set redirect URL for magic link (if used)
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      
      // If magic link is sent, Supabase won't return an error
      // The auth state change listener will handle the redirect
      // For OTP, we show the OTP input
      setStep('otp');
      */
      setError('⚠️ Development Mode: Authentication is disabled. Use Quick Login buttons.');
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEVELOPMENT: Bypass OTP verification
    if (process.env.NODE_ENV === 'development') {
      setError('⚠️ Development Mode: Use Quick Login buttons to bypass authentication');
      return;
    }
    
    // PRODUCTION: Actual OTP verification
    setLoading(true);
    setError(null);

    try {
      // COMMENTED OUT FOR DEVELOPMENT - Supabase auth disabled
      /*
      // Test mode: Bypass OTP for development
      if (testMode && otp === TEST_CREDENTIALS.admin.otp) {
        await testLogin(email);
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      
      if (error) throw error;

      // Check if user is operator/admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== 'operator' && profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Operators only.');
      }

      router.push('/dashboard');
      */
      setError('⚠️ Development Mode: Authentication is disabled. Use Quick Login buttons.');
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Test login function - bypasses OTP for development
  const testLogin = async (testEmail: string) => {
    try {
      // Step 1: First, try to verify with test OTP (in case OTP was already sent)
      // This avoids hitting rate limits if we try multiple times
      let { data, error } = await supabase.auth.verifyOtp({
        email: testEmail,
        token: TEST_CREDENTIALS.admin.otp,
        type: 'email',
      });

      // Step 2: If verification fails, try sending OTP first (only if not rate limited)
      if (error && (error.message.includes('Invalid token') || error.message.includes('expired') || error.message.includes('not found'))) {
        // Try to send OTP (this will create user if doesn't exist)
        const { error: sendError } = await supabase.auth.signInWithOtp({
          email: testEmail,
          options: {
            shouldCreateUser: true,
          },
        });

        // Handle rate limit errors gracefully
        if (sendError) {
          if (sendError.message.includes('security purposes') || sendError.message.includes('rate limit') || sendError.message.includes('after')) {
            throw new Error(
              `Rate limit reached. Please wait before requesting another OTP.\n\n` +
              `Alternative options:\n` +
              `1. Check Supabase logs for existing OTP: supabase logs --follow\n` +
              `2. Wait a minute and try again\n` +
              `3. Use the manual login form and check logs for OTP code`
            );
          }
          if (!sendError.message.includes('already registered') && !sendError.message.includes('User already registered')) {
            // For other errors, still try to verify (user might exist)
            console.warn('Send OTP warning:', sendError.message);
          }
        }

        // Wait a moment for OTP to be generated
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try verification again
        const verifyResult = await supabase.auth.verifyOtp({
          email: testEmail,
          token: TEST_CREDENTIALS.admin.otp,
          type: 'email',
        });
        
        data = verifyResult.data;
        error = verifyResult.error;
      }

      if (error) {
        // If test OTP doesn't work, provide helpful error
        if (error.message.includes('Invalid token') || error.message.includes('Token has expired') || error.message.includes('OTP') || error.message.includes('not found')) {
          throw new Error(
            'Test OTP verification failed. The test OTP code (000000) is not working.\n\n' +
            'For local development, use one of these options:\n\n' +
            'Option 1: Check Supabase logs for the actual OTP code:\n' +
            '  1. Run: supabase logs --follow\n' +
            '  2. Click "Send OTP" on the login page\n' +
            '  3. Look for the OTP code in the logs\n' +
            '  4. Enter that code manually\n\n' +
            'Option 2: Use magic link:\n' +
            '  1. Click "Send OTP"\n' +
            '  2. Check Supabase logs for the magic link URL\n' +
            '  3. Click the link to sign in automatically\n\n' +
            'Option 3: Wait for rate limit to reset (usually 60 seconds)'
          );
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('No user returned from authentication');
      }

      // Step 4: Check or create profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const role = testEmail.includes('admin') ? 'admin' : 'operator';
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role: role,
            display_name: role === 'admin' ? 'Admin User' : 'Operator User',
            email: testEmail,
            lang: 'en',
          });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }

        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        profile = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      // Step 5: Verify role
      if (profile?.role !== 'operator' && profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Test user must be operator or admin.');
      }

      // Step 6: Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Test login failed');
      setLoading(false);
    }
  };

  // Quick test login buttons - DEVELOPMENT: Bypass auth completely
  const handleQuickLogin = async (role: 'admin' | 'operator') => {
    // DEVELOPMENT MODE: Bypass all authentication
    if (process.env.NODE_ENV === 'development') {
      setLoading(true);
      setError(null);
      
      // Store mock session in localStorage for development
      const mockSession = {
        user: {
          id: role === 'admin' ? 'dev-admin-id' : 'dev-operator-id',
          email: TEST_CREDENTIALS[role].email,
          role: role,
        },
        access_token: 'dev-token',
        expires_at: Date.now() + 3600000, // 1 hour
      };
      
      localStorage.setItem('dev-session', JSON.stringify(mockSession));
      localStorage.setItem('dev-role', role);
      
      // Redirect directly to dashboard
      router.push('/dashboard');
      return;
    }
    
    // PRODUCTION: Use actual auth flow
    setLoading(true);
    setError(null);
    setEmail(TEST_CREDENTIALS[role].email);
    setOtp(TEST_CREDENTIALS[role].otp);
    setTestMode(true);
    
    // Try to login directly
    await testLogin(TEST_CREDENTIALS[role].email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Operator Console
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage travel operations
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Test Login Section - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs text-gray-500 mb-2 text-center">🧪 Development Mode</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Logging in...' : '🚀 Quick Login as Admin'}
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Logging in...' : '🚀 Quick Login as Operator'}
              </button>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                <p className="text-xs text-yellow-800 text-center">
                  ⚠️ <strong>Development Mode:</strong> Authentication is bypassed. Click buttons above to login instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@oasis.travel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || process.env.NODE_ENV === 'development'}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                ⚠️ Auth disabled in development. Use Quick Login buttons above.
              </p>
            )}
            {process.env.NODE_ENV !== 'development' && (
              <p className="text-xs text-center text-gray-500">
                You will receive either a magic link or OTP code via email
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={process.env.NODE_ENV === 'development'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
              {process.env.NODE_ENV === 'development' ? (
                <p className="mt-2 text-xs text-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  ⚠️ Auth disabled in development. Use Quick Login buttons above.
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Check your email for the OTP code. If you received a magic link, click it to sign in automatically.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || process.env.NODE_ENV === 'development'}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError(null);
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


import { initSupabase, getSupabase as getSupabaseFromApi } from '@oasis/api';

// Lazy initialization function
let supabaseInstance: ReturnType<typeof initSupabase> | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Validate environment variables
  if (!supabaseUrl || supabaseUrl === '') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable.\n' +
      'Please create a .env.local file in apps/console/ with:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n\n' +
      'Current env check: ' + JSON.stringify({
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      })
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey === '') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.\n' +
      'Please create a .env.local file in apps/console/ with:\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
    );
  }

  // Initialize Supabase client
  supabaseInstance = initSupabase(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Export initialized client (lazy)
export const supabase = new Proxy({} as ReturnType<typeof initSupabase>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Re-export for convenience
export { getSupabaseFromApi as getSupabase };


import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string | null = null;
let currentKey: string | null = null;

function getEnvVar(name: string): string | undefined {
  try {
    // Vite client-side environment
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return import.meta.env[name];
    }
  } catch {
    // Ignore error
  }

  try {
    // Node / process environment fallback
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
  } catch {
    // Ignore error
  }

  return undefined;
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url =
    customUrl ||
    getEnvVar('VITE_SUPABASE_URL') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    (typeof window !== 'undefined' ? window.localStorage?.getItem('daymark_supabase_url') : null);

  const key =
    customKey ||
    getEnvVar('VITE_SUPABASE_ANON_KEY') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    (typeof window !== 'undefined' ? window.localStorage?.getItem('daymark_supabase_key') : null);

  if (!url || !key) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch {
    return null;
  }
}

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.profiles" does not exist')) {
      if (error.message.includes('JWT') || error.message.includes('Invalid API key')) {
        return { success: false, message: 'Invalid Supabase Anon Key' };
      }
    }
    return { success: true, message: 'Connected successfully to Supabase instance!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return { success: false, message: msg };
  }
}

// Authentication Helpers
export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase client not initialized. Check your credentials.' };
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase client not initialized. Check your credentials.' };
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signInWithOtp(email: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase client not initialized. Check your credentials.' };
  
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  return { error: error ? error.message : null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  const { error } = await client.auth.signOut();
  return { error: error ? error.message : null };
}

export function subscribeToAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const client = getSupabaseClient();
  if (!client) return { unsubscribe: () => {} };
  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

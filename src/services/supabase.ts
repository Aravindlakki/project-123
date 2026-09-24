import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean URL: strip any trailing /rest/v1 or trailing slashes
function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export const supabaseUrl: string = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey: string = typeof rawKey === 'string' ? rawKey.trim() : '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('placeholder')
);

const createSafeFallbackClient = (): SupabaseClient => {
  const noopQueryBuilder: any = {
    select: () => noopQueryBuilder,
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: () => noopQueryBuilder,
    neq: () => noopQueryBuilder,
    ilike: () => noopQueryBuilder,
    like: () => noopQueryBuilder,
    order: () => noopQueryBuilder,
    limit: () => noopQueryBuilder,
    range: () => noopQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    catch: (reject: any) => Promise.resolve({ data: [], error: null }).catch(reject),
  };

  const channelObj: any = {
    on: () => channelObj,
    subscribe: () => channelObj,
    unsubscribe: () => Promise.resolve('ok'),
  };

  return {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => noopQueryBuilder,
    channel: () => channelObj,
    removeChannel: () => {},
    removeAllChannels: () => {},
    functions: {
      invoke: () => Promise.resolve({ data: null, error: new Error('Supabase functions not configured') }),
    },
  } as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createSafeFallbackClient();

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Warning] Operations requested while Supabase credentials are not configured.');
  }
}

export default supabase;

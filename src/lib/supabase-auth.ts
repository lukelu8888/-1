import { supabase } from './supabase';

export interface ErpUser {
  id: string;
  email: string;
  portal_role: 'admin' | 'customer' | 'supplier';
  rbac_role: string | null;
  name: string | null;
  company: string | null;
  region: string | null;
  currency: string | null;
}

export async function signIn(email: string, password: string): Promise<{ user: ErpUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  const profile = await fetchUserProfile(email);
  return { user: profile, error: null };
}

export async function signUp(
  email: string,
  password: string,
  portalRole: 'admin' | 'customer' | 'supplier',
  meta: Partial<ErpUser> = {}
): Promise<{ user: ErpUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { portal_role: portalRole, ...meta },
    },
  });
  if (error) return { user: null, error: error.message };

  // Upsert profile row
  const { error: profileError } = await supabase.from('users').upsert({
    id: data.user!.id,
    email,
    portal_role: portalRole,
    name: meta.name ?? null,
    company: meta.company ?? null,
    region: meta.region ?? null,
    currency: meta.currency ?? 'USD',
    rbac_role: meta.rbac_role ?? null,
  });

  if (profileError) console.warn('Profile upsert error:', profileError.message);

  const profile = await fetchUserProfile(email);
  return { user: profile, error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchUserProfile(email: string): Promise<ErpUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return null;
  return data as ErpUser;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (user: ErpUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user?.email) {
      const profile = await fetchUserProfile(session.user.email);
      callback(profile);
    } else {
      callback(null);
    }
  });
}

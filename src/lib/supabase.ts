import { createClient } from '@supabase/supabase-js'

// 优先读取环境变量，fallback 到硬编码值（本地开发）
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://oaavirpytvemskjooeyg.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hYXZpcnB5dHZlbXNram9vZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODc2NjUsImV4cCI6MjA4Nzg2MzY2NX0.AgKVC_Z_UmMLJs_j8XwVKnAMZhwPJjOLd0V7z0xQ5-I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cosun_supabase_auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Kasir Kopi Shop - Supabase Client Setup
 *
 * Two clients are provided:
 * 1. `supabase` - Browser client with anon key (uses user's JWT for RLS)
 * 2. `supabaseAdmin` - Server-side client with service role key (bypasses RLS)
 *
 * Installation:
 *   bun add @supabase/supabase-js
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ============================================================
// Browser Client (uses user's JWT, RLS enforced)
// ============================================================
export function createBrowserClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// ============================================================
// Server Client (service role, bypasses RLS)
// Use ONLY in API routes / server-side code
// ============================================================
export function createServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Singleton for browser
let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Singleton for server
let serverClient: SupabaseClient | null = null

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createServerClient()
  }
  return serverClient
}

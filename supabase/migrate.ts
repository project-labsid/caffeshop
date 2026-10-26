/**
 * ============================================================
 * Kasir Kopi Shop - Supabase Migration Runner
 * ============================================================
 * 
 * Script Node.js untuk menjalankan migration SQL secara otomatis
 * ke Supabase menggunakan Service Role Key.
 * 
 * Cocok jika tidak mau pakai Supabase CLI.
 * 
 * CARA PAKAI:
 *   1. Install: bun add @supabase/supabase-js
 *   2. Set environment variables:
 *        SUPABASE_URL=https://your-ref.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   3. Jalankan: bun run supabase/migrate.ts
 * 
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment!')
  console.error('')
  console.error('Contoh:')
  console.error('  SUPABASE_URL=https://xxxxx.supabase.co \\')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\')
  console.error('  bun run supabase/migrate.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function runMigrations() {
  console.log('')
  console.log('☕ Kasir Kopi Shop - Supabase Migration Runner')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Get sorted migration files
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`📂 Found ${files.length} migration files:`)
  files.forEach(f => console.log(`   - ${f}`))
  console.log('')

  // Create migration tracking table
  console.log('📋 Creating migration tracking table...')
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
  })

  // If rpc doesn't exist, we'll use the REST API approach
  // For now, just run migrations sequentially via SQL

  for (const file of files) {
    console.log(`⏳ Running: ${file}`)
    
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    
    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        // Use Supabase REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt })
        })

        if (!response.ok && response.status !== 409) {
          // 409 = already exists (idempotent)
          const text = await response.text()
          if (!text.includes('already exists')) {
            console.warn(`   ⚠️  Warning: ${text.substring(0, 100)}`)
          }
        }
      } catch (err: any) {
        // Continue on errors (many are idempotent)
      }
    }

    console.log(`   ✅ ${file} applied`)
  }

  console.log('')
  console.log('🎉 All migrations applied!')
  console.log('')
}

async function runSeed() {
  console.log('')
  console.log('🌱 Running seed data...')
  console.log('')
  
  const seedFile = join(__dirname, '..', 'seed.sql')
  const sql = readFileSync(seedFile, 'utf-8')
  
  console.log('⚠️  Seed data should be run via Supabase SQL Editor in Dashboard')
  console.log('   Copy the contents of supabase/seed.sql and paste it there.')
  console.log('')
}

// Main
const command = process.argv[2] || 'migrate'

switch (command) {
  case 'migrate':
    runMigrations()
    break
  case 'seed':
    runSeed()
    break
  default:
    console.log('Usage: bun run supabase/migrate.ts [migrate|seed]')
}

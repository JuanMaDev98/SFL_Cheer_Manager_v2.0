/**
 * Cleanup script - run with: npx tsx scripts/cleanup-db.ts
 * Or: npx ts scripts/cleanup-db.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eijzgwtpgbvyucdjhhve.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function cleanup() {
  console.log('🧹 Starting database cleanup...\n')

  // Delete in correct order (foreign key constraints)
  const tables = ['ChatMessage', 'HelperJoin', 'FarmPost', 'User']

  for (const table of tables) {
    console.log(`Deleting all records from ${table}...`)
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error(`  Error deleting from ${table}:`, error.message)
    } else {
      console.log(`  ✅ ${table} cleaned`)
    }
  }

  console.log('\n✨ Cleanup complete!')
}

cleanup().catch(console.error)
import { createClient } from '@supabase/supabase-js'

// Fallback to placeholders during build time to prevent "supabaseUrl is required" error
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rdepfiqnzilqixgxknss.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZXBmaXFuemlscWl4Z3hrbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDAxNzgsImV4cCI6MjA4OTA3NjE3OH0.a0CZTxsanpC1sno3-4m2I1iZA8GrLTNuq2sAVV6OG0g'

export const supabase = createClient(supabaseUrl, supabaseKey)
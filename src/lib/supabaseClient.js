// This file creates ONE connection to Supabase that the rest of the app reuses.
// Think of it like a phone line to your database - we set it up once here,
// then every other file just "picks up the phone" using this same line.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// import.meta.env reads from your .env file.
// This is why we kept the keys out of the code directly - Vite injects them
// at build time instead of us typing them in plain text.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

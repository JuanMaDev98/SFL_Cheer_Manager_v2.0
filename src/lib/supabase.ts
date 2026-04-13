import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if both values are present
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Types matching our Supabase schema
// Types matching our Supabase schema
// NOTE: encryptedApiKey is stored server-side only, NEVER exposed to frontend

export interface DbUser {
  id: string
  telegramId: string | null
  nickname: string
  playerId: string
  encryptedApiKey: string | null  // Encrypted SFL API key (server-only, never send to client)
  avatarIndex: number
  helpersGiven: number
  helpersReceived: number
  createdAt: string
  updatedAt: string
}

export interface DbFarmPost {
  id: string
  title: string
  message: string
  farmId: string
  category: string
  helpersNeeded: number
  helpersCount: number
  isActive: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface DbHelperJoin {
  id: string
  postId: string
  userId: string
  status: string
  createdAt: string
}

export interface DbChatMessage {
  id: string
  postId: string
  userId: string
  nickname: string
  content: string
  createdAt: string
}
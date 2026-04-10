'use client'

import { createClient } from '@supabase/supabase-js'
import type { DbUser } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ---------- Telegram WebApp ----------

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

// Get initData from Telegram WebApp
export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null
  // @ts-ignore
  const tg = window.Telegram?.WebApp
  if (!tg?.initData) return null
  return tg.initData as string
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null
  // @ts-ignore
  const tg = window.Telegram?.WebApp
  return tg?.initDataUnsafe?.user || null
}

export function readyTelegramApp(): void {
  if (typeof window === 'undefined') return
  // @ts-ignore
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
  }
}

// ---------- Subscription checks ----------

export interface SubscriptionCheck {
  chat: string
  name: string
  type: 'channel' | 'group'
  isMember: boolean
  status?: string
}

export interface SubscriptionResult {
  user: TelegramUser
  subscriptions: SubscriptionCheck[]
  allPassed: boolean
}

export async function validateTelegramUser(): Promise<{
  valid: boolean
  user: TelegramUser | null
  error?: string
}> {
  const initData = getTelegramInitData()
  const user = getTelegramUser()

  if (!initData || !user) {
    return { valid: false, user: null, error: 'Not running in Telegram Mini App' }
  }

  try {
    const res = await fetch('/api/telegram/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    return { valid: false, user: null, error: 'Validation request failed' }
  }
}

export async function checkSubscriptions(userId: number): Promise<{
  subscriptions: SubscriptionCheck[]
  allPassed: boolean
}> {
  try {
    const res = await fetch(`/api/telegram/check-subscription?userId=${userId}`)
    const data = await res.json()
    return data
  } catch {
    return { subscriptions: [], allPassed: false }
  }
}

// ---------- Supabase helpers ----------

export async function upsertUser(
  telegramId: number,
  nickname: string,
  playerId: string,
  avatarIndex: number
): Promise<DbUser | null> {
  if (!supabase) return null

  // Check if exists
  const { data: existing } = await supabase
    .from('User')
    .select('*')
    .eq('telegramId', String(telegramId))
    .maybeSingle()

  if (existing) {
    const { data: updated } = await supabase
      .from('User')
      .update({ nickname, playerId })
      .eq('telegramId', String(telegramId))
      .select()
      .single()
    return updated
  }

  const { data: created } = await supabase
    .from('User')
    .insert({
      telegramId: String(telegramId),
      nickname,
      playerId,
      avatarIndex,
    })
    .select()
    .single()

  return created
}

export async function getUserByTelegramId(telegramId: number): Promise<DbUser | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('User')
    .select('*')
    .eq('telegramId', String(telegramId))
    .maybeSingle()
  return data
}
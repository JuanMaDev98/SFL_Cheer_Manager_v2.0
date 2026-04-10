import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Telegram bot token for validation
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// MANDATORY_CHATS constant to match client
const MANDATORY_CHATS = [
  { username: 'JuanMaYoutube', type: 'channel' as const, name: 'Canal de JuanMa' },
  { username: 'MankoGuild', type: 'group' as const, name: 'Manko Guild' },
]

export async function POST(request: Request) {
  try {
    const { telegramId, nickname, playerId } = await request.json()

    if (!nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[users POST] Input:', { telegramId, nickname, playerId })

    // Find by telegramId (primary) or playerId (fallback)
    let query = supabase
      .from('User')
      .select('*')
      .eq('telegramId', String(telegramId))
      .maybeSingle()

    const { data: existingUser, error: findError } = await query

    console.log('[users POST] findExisting result:', { found: !!existingUser, error: findError })

    if (findError) {
      console.error('[users POST] findError:', findError)
      throw findError
    }

    let user

    if (existingUser) {
      // Update user
      const { data, error: updateError } = await supabase
        .from('User')
        .update({
          nickname,
          playerId: playerId || existingUser.playerId,
        })
        .eq('telegramId', String(telegramId))
        .select()
        .single()

      console.log('[users POST] update result:', { data, error: updateError })
      if (updateError) {
        console.error('[users POST] updateError:', updateError)
        throw updateError
      }
      user = data
    } else {
      // Create new user
      const avatarIndex = Math.floor(Math.random() * 6)
      const { data, error: createError } = await supabase
        .from('User')
        .insert({
          telegramId: String(telegramId),
          nickname,
          playerId: playerId || String(telegramId),
          avatarIndex,
        })
        .select()
        .single()

      console.log('[users POST] create result:', { data, error: createError })
      if (createError) {
        console.error('[users POST] createError:', createError)
        throw createError
      }
      user = data
    }

    console.log('[users POST] Success, returning user:', user)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('[users POST] Fatal error:', error)
    return NextResponse.json({ error: 'Failed to create user', details: String(error) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const telegramId = searchParams.get('telegramId')

    if (telegramId) {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('telegramId', telegramId)
        .maybeSingle()

      if (error) throw error
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json(user)
    }

    if (playerId) {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('playerId', playerId)
        .maybeSingle()

      if (error) throw error
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json(user)
    }

    const { data: users, error } = await supabase
      .from('User')
      .select('id, playerId, nickname, avatarIndex, helpersGiven, helpersReceived')
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(users || [])
  } catch (error) {
    console.error('[users GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { encrypt, isValidSflApiKey } from '@/lib/encryption'

/**
 * POST /api/users
 * Create or update user with encrypted API key storage
 * 
 * Security:
 * - API key is encrypted server-side using AES-256-GCM
 * - Only encrypted form is stored, never the raw key
 * - Raw key is never logged or returned to client
 */
export async function POST(request: Request) {
  try {
    const { telegramId, nickname, playerId, apiKey } = await request.json()

    if (!nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate API key format if provided
    let encryptedApiKey: string | null = null
    if (apiKey) {
      if (!isValidSflApiKey(apiKey)) {
        return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
      }
      try {
        encryptedApiKey = encrypt(apiKey)
      } catch (encError) {
        return NextResponse.json({ 
          error: 'Server encryption error', 
          details: 'ENCRYPTION_KEY not configured on server' 
        }, { status: 500 })
      }
    }

    // Only search by telegramId if it's a valid non-empty string
    const isValidTelegramId = telegramId && String(telegramId) !== 'undefined' && String(telegramId).trim() !== ''

    let existingUser = null
    let findError = null

    // Priority 1: find by telegramId
    if (isValidTelegramId) {
      const result = await supabase
        .from('User')
        .select('*')
        .eq('telegramId', String(telegramId))
        .maybeSingle()
      existingUser = result.data
      findError = result.error
    }

    // Priority 2: find by playerId (most reliable identifier from SFL)
    if (!existingUser && playerId) {
      const result = await supabase
        .from('User')
        .select('*')
        .eq('playerId', String(playerId))
        .maybeSingle()
      existingUser = result.data
      findError = result.error
    }

    if (findError) {
      throw findError
    }

    let user

    if (existingUser) {
      // Update user — preserve original telegramId if new one is invalid
      const updateData: Record<string, unknown> = {
        nickname,
        playerId: playerId || existingUser.playerId,
      }
      // Only update telegramId if we have a valid one
      if (isValidTelegramId) {
        updateData.telegramId = String(telegramId)
      }
      // Only update API key if provided
      if (encryptedApiKey) {
        updateData.encryptedApiKey = encryptedApiKey
      }

      const { data, error: updateError } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) throw updateError
      user = data
    } else {
      // Create new user
      const avatarIndex = Math.floor(Math.random() * 6)
      const { data, error: createError } = await supabase
        .from('User')
        .insert({
          telegramId: isValidTelegramId ? String(telegramId) : null,
          nickname,
          playerId: playerId || (isValidTelegramId ? String(telegramId) : null),
          avatarIndex,
          encryptedApiKey,
        })
        .select()
        .single()

      if (createError) throw createError
      user = data
    }

    // SECURITY: Remove encryptedApiKey before sending to client
    // The client should NEVER receive the encrypted API key
    const safeUser = {
      id: user.id,
      telegramId: user.telegramId,
      nickname: user.nickname,
      playerId: user.playerId,
      avatarIndex: user.avatarIndex,
      helpersGiven: user.helpersGiven,
      helpersReceived: user.helpersReceived,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasApiKey: !!user.encryptedApiKey,
    }

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    const playerId = searchParams.get('playerId')

    if (!telegramId && !playerId) {
      return NextResponse.json({ error: 'telegramId or playerId required' }, { status: 400 })
    }

    let query = supabase.from('User').select('*')
    
    if (telegramId) {
      query = query.eq('telegramId', telegramId)
    } else if (playerId) {
      query = query.eq('playerId', playerId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Remove encryptedApiKey before sending to client
    const safeUser = {
      id: data.id,
      telegramId: data.telegramId,
      nickname: data.nickname,
      playerId: data.playerId,
      avatarIndex: data.avatarIndex,
      helpersGiven: data.helpersGiven,
      helpersReceived: data.helpersReceived,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      hasApiKey: !!data.encryptedApiKey,
    }

    return NextResponse.json(safeUser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

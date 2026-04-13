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
        encryptedApiKey = await encrypt(apiKey)
      } catch (encError) {
        // Return specific error for encryption failures
        console.error('[users POST] Encryption error:', encError)
        return NextResponse.json({ 
          error: 'Server encryption error', 
          details: 'ENCRYPTION_KEY not configured on server' 
        }, { status: 500 })
      }
    }

    console.log('[users POST] Input:', { telegramId, nickname, playerId, hasApiKey: !!apiKey })

    // Only search by telegramId if it's a valid non-empty string (not undefined/null/"undefined")
    const isValidTelegramId = telegramId && String(telegramId) !== 'undefined' && String(telegramId).trim() !== ''

    let existingUser = null
    let findError = null

    // Priority 1: find by valid telegramId
    if (isValidTelegramId) {
      const result = await supabase
        .from('User')
        .select('*')
        .eq('telegramId', String(telegramId))
        .maybeSingle()
      existingUser = result.data
      findError = result.error
      console.log('[users POST] find by telegramId:', !!existingUser)
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
      console.log('[users POST] find by playerId:', !!existingUser)
    }

    if (findError) {
      console.error('[users POST] findError:', findError)
      throw findError
    }

    let user

    if (existingUser) {
      // Update user — preserve original telegramId if new one is invalid
      const updateData: any = {
        nickname,
        playerId: playerId || existingUser.playerId,
      }
      // Only update telegramId if we have a valid one
      if (isValidTelegramId) {
        updateData.telegramId = String(telegramId)
      }
      // Only update API key if provided (user wants to update it)
      if (encryptedApiKey) {
        updateData.encryptedApiKey = encryptedApiKey
      }

      const { data, error: updateError } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', existingUser.id)
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
          telegramId: isValidTelegramId ? String(telegramId) : null,
          nickname,
          playerId: playerId || (isValidTelegramId ? String(telegramId) : null),
          avatarIndex,
          encryptedApiKey,
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
      // Indicate if user has an API key set (for UI purposes)
      hasApiKey: !!user.encryptedApiKey,
    }

    console.log('[users POST] Success, returning user (apiKey hidden)')
    return NextResponse.json(safeUser, { status: 201 })
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

    if (telegramId && telegramId !== 'undefined') {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('telegramId', telegramId)
        .maybeSingle()

      if (error) throw error
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      
      // SECURITY: Remove encryptedApiKey before sending to client
      const { encryptedApiKey, ...safeUser } = user
      return NextResponse.json({ ...safeUser, hasApiKey: !!encryptedApiKey })
    }

    if (playerId) {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('playerId', playerId)
        .maybeSingle()

      if (error) throw error
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      
      // SECURITY: Remove encryptedApiKey before sending to client
      const { encryptedApiKey, ...safeUser } = user
      return NextResponse.json({ ...safeUser, hasApiKey: !!encryptedApiKey })
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
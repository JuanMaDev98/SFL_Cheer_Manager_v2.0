import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  if (!supabase) {
    console.error('[users GET] Supabase client not initialized - missing env vars')
    return NextResponse.json({ error: 'Database not configured', details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    console.log('[users GET] playerId:', playerId)

    if (playerId) {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .eq('playerId', playerId)
        .maybeSingle()

      console.log('[users GET] by playerId result:', { user, error })
      if (error) throw error
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json(user)
    }

    const { data: users, error } = await supabase
      .from('User')
      .select('id, playerId, nickname, avatarIndex, helpersGiven, helpersReceived')
      .order('createdAt', { ascending: false })
      .limit(50)

    console.log('[users GET] all users result:', { count: users?.length, error })
    if (error) throw error
    return NextResponse.json(users || [])
  } catch (error) {
    console.error('[users GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch users', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    console.error('[users POST] Supabase client not initialized - missing env vars')
    return NextResponse.json({ error: 'Database not configured', details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing' }, { status: 500 })
  }

  try {
    const { telegramId, nickname, playerId } = await request.json()

    console.log('[users POST] Input:', { telegramId, nickname, playerId })

    if (!nickname || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Try to find existing user by playerId
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('playerId', playerId)
      .maybeSingle()

    console.log('[users POST] findExisting result:', { found: !!existingUser, error: findError })

    if (findError) {
      console.error('[users POST] findError:', findError)
      throw findError
    }

    let user

    if (existingUser) {
      console.log('[users POST] Updating existing user:', existingUser.id)
      const { data, error: updateError } = await supabase
        .from('User')
        .update({ nickname, telegramId: telegramId || null })
        .eq('playerId', playerId)
        .select()
        .single()

      console.log('[users POST] update result:', { data, error: updateError })
      if (updateError) {
        console.error('[users POST] updateError:', updateError)
        throw updateError
      }
      user = data
    } else {
      console.log('[users POST] Creating new user')
      const avatarIndex = Math.floor(Math.random() * 6)
      const { data, error: createError } = await supabase
        .from('User')
        .insert({
          telegramId: telegramId || null,
          nickname,
          playerId,
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
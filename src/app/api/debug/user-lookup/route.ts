import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/debug/user-lookup?type=telegram&id=1166287745
 * or /api/debug/user-lookup?type=player&id=5728332167996053
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id required' }, { status: 400 })
    }

    let query = supabase.from('User').select('*')
    
    if (type === 'telegram') {
      query = query.eq('telegramId', id)
    } else if (type === 'player') {
      query = query.eq('playerId', id)
    } else {
      return NextResponse.json({ error: 'type must be telegram or player' }, { status: 400 })
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: data.id,
      telegramId: data.telegramId,
      playerId: data.playerId,
      nickname: data.nickname,
      hasApiKey: !!data.encryptedApiKey,
      apiKeyLength: data.encryptedApiKey?.length || 0,
      createdAt: data.createdAt,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
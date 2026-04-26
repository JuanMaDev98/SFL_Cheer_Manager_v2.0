import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt, isValidSflApiKey } from '@/lib/encryption'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

/**
 * Retry wrapper with exponential backoff for API calls
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 1500
): Promise<{ ok: boolean; status: number; data?: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000),
      })

      if (res.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`[VerifyCheer] Rate limited (429), retrying in ${delay}ms (attempt ${attempt}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      let data
      try { data = await res.json() } catch { data = null }

      return { ok: res.ok, status: res.status, data }
    } catch (err: any) {
      console.error(`[VerifyCheer] Fetch attempt ${attempt} failed:`, err.message)
      if (attempt === retries) return { ok: false, status: 0, data: null }
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)))
    }
  }
  return { ok: false, status: 0, data: null }
}

/**
 * POST /api/posts/[id]/verify-cheer
 * Verifies if the current user has given a cheer to the post owner's farm
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[VerifyCheer] ===== START REQUEST =====')
  console.log('[VerifyCheer] Timestamp:', new Date().toISOString())

  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    console.log('[VerifyCheer] Post ID:', id)
    console.log('[VerifyCheer] User ID making request:', userId)

    if (!userId) {
      console.log('[VerifyCheer] ERROR: userId missing')
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch post to get ownerFarmId
    console.log('[VerifyCheer] Fetching post from DB...')
    const { data: post, error: postError } = await supabase
      .from('FarmPost')
      .select('id, ownerId, farmId, title')
      .eq('id', id)
      .maybeSingle()

    console.log('[VerifyCheer] Post query result:', { post, postError })

    if (postError || !post) {
      console.log('[VerifyCheer] ERROR: Post not found')
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    console.log('[VerifyCheer] Post found:', {
      postId: post.id,
      ownerId: post.ownerId,
      farmId: post.farmId,
      farmIdType: typeof post.farmId,
      title: post.title
    })

    // Fetch user with encrypted API key
    console.log('[VerifyCheer] Fetching user from DB...')
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, playerId, encryptedApiKey, nickname')
      .eq('id', userId)
      .maybeSingle()

    console.log('[VerifyCheer] User query result:', { userId: user?.id, playerId: user?.playerId, nickname: user?.nickname, hasApiKey: !!user?.encryptedApiKey, userError })

    if (userError || !user) {
      console.log('[VerifyCheer] ERROR: User not found in DB')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.encryptedApiKey) {
      console.log('[VerifyCheer] ERROR: User has no API key stored')
      return NextResponse.json({
        verified: false,
        reason: 'no_api_key',
        message: 'No API key stored. Please relink your SFL account.',
      })
    }

    // Decrypt API key
    console.log('[VerifyCheer] Decrypting API key...')
    let apiKey: string
    try {
      apiKey = decrypt(user.encryptedApiKey)
      console.log('[VerifyCheer] Decrypt OK, API key starts with:', apiKey.substring(0, 10) + '...')
    } catch (err) {
      console.log('[VerifyCheer] ERROR: Decrypt failed:', err)
      return NextResponse.json({
        verified: false,
        reason: 'decrypt_failed',
        message: 'Could not decrypt API key. Please relink your SFL account.',
      })
    }

    if (!isValidSflApiKey(apiKey)) {
      console.log('[VerifyCheer] ERROR: Invalid API key format')
      return NextResponse.json({
        verified: false,
        reason: 'invalid_key',
        message: 'Invalid API key format.',
      })
    }

    // Call SFL API
    console.log('[VerifyCheer] Calling SFL API:', `${SFL_API_BASE}/${user.playerId}`)
    console.log('[VerifyCheer] Using playerId:', user.playerId, 'type:', typeof user.playerId)
    
    const sflResult = await fetchWithRetry(
      `${SFL_API_BASE}/${user.playerId}`,
      { headers: { 'X-API-Key': apiKey, Accept: 'application/json' } },
      3,
      1500
    )

    console.log('[VerifyCheer] SFL API result:', {
      ok: sflResult.ok,
      status: sflResult.status,
      hasData: !!sflResult.data
    })

    if (!sflResult.ok) {
      console.log('[VerifyCheer] ERROR: SFL API request failed')
      let message = 'Could not verify with Sunflower Land API. Try again in a few minutes.'
      let reason = 'sfl_api_error'

      if (sflResult.status === 429) {
        message = 'Sunflower Land API is rate limited. Please wait a few seconds and try again.'
        reason = 'rate_limited'
      } else if (sflResult.status === 0) {
        message = 'Connection timeout. Please check your internet and try again.'
        reason = 'timeout'
      }

      return NextResponse.json({ verified: false, reason, message })
    }

    const data = sflResult.data

    // Log FULL SFL response for debugging
    console.log('[VerifyCheer] ===== SFL API RAW RESPONSE =====')
    console.log('[VerifyCheer] SFL response keys:', Object.keys(data || {}))
    console.log('[VerifyCheer] data.id:', data?.id)
    console.log('[VerifyCheer] data.playerId:', data?.playerId)
    console.log('[VerifyCheer] data.farm:', data?.farm ? Object.keys(data.farm) : 'undefined')
    console.log('[VerifyCheer] data.celebrations:', data?.celebrations ? Object.keys(data.celebrations) : 'undefined')
    console.log('[VerifyCheer] ===== END SFL RAW RESPONSE =====')

    // Get cheersGiven data - try ALL possible paths
    const cheersGiven =
      data.farm?.socialFarming?.cheersGiven ||
      data.farm?.celebrations?.cheersGiven ||
      data.celebrations?.cheersGiven ||
      data.cheersGiven ||
      {}

    console.log('[VerifyCheer] ===== CHEERS GIVEN EXTRACTION =====')
    console.log('[VerifyCheer] cheersGiven:', JSON.stringify(cheersGiven))
    console.log('[VerifyCheer] cheersGiven.farms:', cheersGiven.farms)
    console.log('[VerifyCheer] cheersGiven.projects:', cheersGiven.projects)
    console.log('[VerifyCheer] cheersGiven.date:', cheersGiven.date)
    console.log('[VerifyCheer] ===== END CHEERS GIVEN =====')

    const farmsList: string[] = cheersGiven.farms || []
    const ownerFarmIdStr = String(post.farmId)

    console.log('[VerifyCheer] ===== VERIFICATION CHECK =====')
    console.log('[VerifyCheer] Post farmId:', post.farmId, 'type:', typeof post.farmId)
    console.log('[VerifyCheer] Owner farmId as string:', ownerFarmIdStr)
    console.log('[VerifyCheer] Farms list from API:', farmsList)
    console.log('[VerifyCheer] Farms list types:', farmsList.map(f => typeof f))
    console.log('[VerifyCheer] Farms list as strings:', farmsList.map(f => String(f)))
    console.log('[VerifyCheer] ===== RUNNING COMPARISONS =====')
    
    // Check each farm in the list
    for (const farmId of farmsList) {
      console.log(`[VerifyCheer] Comparing: '${farmId}' (${typeof farmId}) === '${ownerFarmIdStr}' (${typeof ownerFarmIdStr}) => ${String(farmId) === ownerFarmIdStr}`)
    }
    
    const foundInFarms = farmsList.some(farmId => String(farmId) === ownerFarmIdStr)
    console.log('[VerifyCheer] Final foundInFarms result:', foundInFarms)
    console.log('[VerifyCheer] ===== END VERIFICATION CHECK =====')

    if (!foundInFarms) {
      console.log('[VerifyCheer] FAIL: Farm not found in cheersGiven.farms')
      return NextResponse.json({
        verified: false,
        reason: 'cheer_wrong_farm',
        message: `Cheer not found for this farm. You cheered ${farmsList.length} farms today but not this one. Make sure you cheered the correct farm and wait ~1 minute before trying again.`,
        debug: {
          ownerFarmId: post.farmId,
          ownerFarmIdStr,
          userPlayerId: user.playerId,
          sflStatus: sflResult.status,
          cheersGiven,
          farmsList,
          farmsListStr: farmsList.map(f => String(f)),
          comparisonResults: farmsList.map(farmId => ({ farmId, ownerFarmIdStr, equal: String(farmId) === ownerFarmIdStr }))
        }
      })
    }

    // Success
    console.log('[VerifyCheer] SUCCESS: Cheer verified!')
    const chatMessage = {
      postId: id,
      userId: userId,
      nickname: user.nickname,
      content: `✅ @${user.nickname} confirmed their cheer! 🎉`,
      createdAt: new Date().toISOString(),
    }

    await supabase.from('ChatMessage').insert(chatMessage)

    return NextResponse.json({
      verified: true,
      message: 'Cheer verified successfully! 🎉',
    })
  } catch (err: any) {
    console.error('[VerifyCheer] ERROR:', err.message, err.stack)
    return NextResponse.json({
      verified: false,
      reason: 'server_error',
      message: 'Something went wrong. Try again.',
    })
  } finally {
    console.log('[VerifyCheer] ===== END REQUEST =====')
  }
}

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt, isValidSflApiKey } from '@/lib/encryption'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

/**
 * Retry wrapper with exponential backoff
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
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      let data
      try { data = await res.json() } catch { data = null }
      return { ok: res.ok, status: res.status, data }
    } catch (err: any) {
      if (attempt === retries) return { ok: false, status: 0, data: null }
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)))
    }
  }
  return { ok: false, status: 0, data: null }
}

/**
 * POST /api/posts/[id]/verify-return
 * Called by post OWNER after they have cheered the helper's farm back.
 * Verifies the return cheer and marks HelperJoin as 'completed'.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[VerifyReturn] ===== START REQUEST =====')

  try {
    const { id } = await params
    const body = await request.json()
    const { userId, helperUserId } = body

    if (!userId || !helperUserId) {
      return NextResponse.json({ error: 'userId and helperUserId required' }, { status: 400 })
    }

    // Verify the requester is the post owner
    const { data: post } = await supabase
      .from('FarmPost')
      .select('id, ownerId, farmId, title')
      .eq('id', id)
      .maybeSingle()

    if (!post || post.ownerId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get the helper's record
    const { data: helperJoin } = await supabase
      .from('HelperJoin')
      .select('id, userId, status, helperFarmId')
      .eq('postId', id)
      .eq('userId', helperUserId)
      .maybeSingle()

    if (!helperJoin) {
      return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
    }

    if (helperJoin.status === 'completed') {
      return NextResponse.json({
        success: false,
        reason: 'already_completed',
        message: 'This exchange is already completed!',
      })
    }

    if (!helperJoin.helperFarmId) {
      return NextResponse.json({
        success: false,
        reason: 'missing_helper_farm_id',
        message: 'Helper farm ID not found.',
      })
    }

    // Get owner's (returner's) API key
    const { data: owner } = await supabase
      .from('User')
      .select('id, playerId, encryptedApiKey, nickname')
      .eq('id', userId)
      .maybeSingle()

    if (!owner?.encryptedApiKey) {
      return NextResponse.json({
        success: false,
        reason: 'no_api_key',
        message: 'No API key stored. Please relink your SFL account.',
      })
    }

    let apiKey: string
    try {
      apiKey = decrypt(owner.encryptedApiKey)
    } catch {
      return NextResponse.json({
        success: false,
        reason: 'decrypt_failed',
        message: 'Could not decrypt API key. Please relink your SFL account.',
      })
    }

    if (!isValidSflApiKey(apiKey)) {
      return NextResponse.json({
        success: false,
        reason: 'invalid_key',
        message: 'Invalid API key format.',
      })
    }

    // Call SFL API to verify owner cheered helper's farm
    const sflResult = await fetchWithRetry(
      `${SFL_API_BASE}/${owner.playerId}`,
      { headers: { 'X-API-Key': apiKey, Accept: 'application/json' } },
      3, 1500
    )

    if (!sflResult.ok) {
      return NextResponse.json({
        success: false,
        reason: 'sfl_api_error',
        message: 'Could not verify with Sunflower Land API.',
      })
    }

    const data = sflResult.data
    const cheersGiven =
      data.farm?.socialFarming?.cheersGiven ||
      data.farm?.celebrations?.cheersGiven ||
      data.celebrations?.cheersGiven ||
      data.cheersGiven || {}

    const farmsList: string[] = cheersGiven.farms || []
    const helperFarmIdStr = String(helperJoin.helperFarmId)
    const foundInFarms = farmsList.some(farmId => String(farmId) === helperFarmIdStr)

    console.log('[VerifyReturn] Checking if owner cheered helper farm:', helperFarmIdStr)
    console.log('[VerifyReturn] Owner cheersGiven.farms:', farmsList)
    console.log('[VerifyReturn] foundInFarms:', foundInFarms)

    if (!foundInFarms) {
      return NextResponse.json({
        success: false,
        reason: 'cheer_wrong_farm',
        message: `You haven't returned the cheer yet. Make sure you cheered the correct farm (${helperFarmIdStr}) and wait ~1 minute before trying again.`,
        debug: { helperFarmId: helperFarmIdStr, farmsList }
      })
    }

    // ===== SUCCESS: Mark as completed =====
    console.log('[VerifyReturn] SUCCESS! Marking exchange as completed.')

    await supabase
      .from('HelperJoin')
      .update({ status: 'completed' })
      .eq('postId', id)
      .eq('userId', helperUserId)

    // Add chat message
    await supabase.from('ChatMessage').insert({
      postId: id,
      userId: userId,
      nickname: owner.nickname,
      content: `🔄 @${owner.nickname} returned the cheer! Exchange completed! 🎉`,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Return cheer verified! Exchange completed! 🎉',
    })

  } catch (err: any) {
    console.error('[VerifyReturn] ERROR:', err.message)
    return NextResponse.json({
      success: false,
      reason: 'server_error',
      message: 'Something went wrong. Try again.',
    })
  } finally {
    console.log('[VerifyReturn] ===== END REQUEST =====')
  }
}

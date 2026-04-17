import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt, isValidSflApiKey } from '@/lib/encryption'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

/**
 * POST /api/posts/[id]/verify-cheer
 * Verifies if the current user has given a cheer to the post owner's farm
 * Uses the user's API key to call SFL API and check cheersGiven data
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const debugLog: Record<string, any> = { timestamp: new Date().toISOString() }

  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    debugLog.postId = id
    debugLog.userId = userId

    // Fetch post to get ownerFarmId
    const { data: post, error: postError } = await supabase
      .from('Post')
      .select('id, ownerId, farmId, title')
      .eq('id', id)
      .maybeSingle()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    debugLog.ownerFarmId = post.farmId
    debugLog.postOwnerId = post.ownerId

    // Fetch user with encrypted API key
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('playerId, encryptedApiKey, nickname')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    debugLog.playerId = user.playerId
    debugLog.hasApiKey = !!user.encryptedApiKey

    if (!user.encryptedApiKey) {
      return NextResponse.json({
        verified: false,
        reason: 'no_api_key',
        message: 'No API key stored. Please relink your SFL account.',
      })
    }

    // Decrypt API key
    let apiKey: string
    try {
      apiKey = decrypt(user.encryptedApiKey)
      debugLog.decryptOk = true
    } catch {
      return NextResponse.json({
        verified: false,
        reason: 'decrypt_failed',
        message: 'Could not decrypt API key. Please relink your SFL account.',
      })
    }

    if (!isValidSflApiKey(apiKey)) {
      return NextResponse.json({
        verified: false,
        reason: 'invalid_key',
        message: 'Invalid API key format.',
      })
    }

    // Call SFL API to get user's cheersGiven data
    const sflRes = await fetch(`${SFL_API_BASE}/${user.playerId}`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })

    debugLog.sflStatus = sflRes.status

    if (!sflRes.ok) {
      return NextResponse.json({
        verified: false,
        reason: 'sfl_api_error',
        message: 'Could not verify with Sunflower Land API. Try again in a few minutes.',
      })
    }

    const data = await sflRes.json()
    debugLog.sflOk = true

    // Get cheersGiven data
    const cheersGiven = data.farm?.celebrations?.cheersGiven
      || data.celebrations?.cheersGiven
      || data.cheersGiven
      || {}

    debugLog.cheersGiven = cheersGiven

    // Check date is today
    const today = new Date().toISOString().split('T')[0]
    const cheerDate = cheersGiven.date || ''

    if (cheerDate !== today) {
      return NextResponse.json({
        verified: false,
        reason: 'no_cheer_today',
        message: 'No cheer found for today. Make sure you actually cheered today!',
      })
    }

    // Check if owner's farmId is in the farms list
    const farmsList: string[] = cheersGiven.farms || []
    const ownerFarmIdStr = String(post.farmId)

    const foundInFarms = farmsList.some(farmId => String(farmId) === ownerFarmIdStr)

    debugLog.farmsList = farmsList
    debugLog.ownerFarmId = ownerFarmIdStr
    debugLog.foundInFarms = foundInFarms

    if (!foundInFarms) {
      return NextResponse.json({
        verified: false,
        reason: 'cheer_wrong_farm',
        message: `Cheer not found for this farm. You cheered ${farmsList.length} farms today but not this one.`,
      })
    }

    // Success - add chat message
    const chatMessage = {
      postId: id,
      userId: userId,
      nickname: user.nickname,
      content: `✅ @${user.nickname} confirmed their cheer! 🎉`,
      createdAt: new Date().toISOString(),
    }

    const { error: msgError } = await supabase
      .from('ChatMessage')
      .insert(chatMessage)

    if (msgError) {
      console.error('[VerifyCheer] Failed to insert chat message:', msgError)
    }

    return NextResponse.json({
      verified: true,
      message: 'Cheer verified successfully! 🎉',
      debug: debugLog,
    })
  } catch (err: any) {
    console.error('[VerifyCheer] Error:', err.message)
    return NextResponse.json({
      verified: false,
      reason: 'server_error',
      message: 'Something went wrong. Try again.',
    })
  }
}

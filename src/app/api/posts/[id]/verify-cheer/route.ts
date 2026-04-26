import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt, isValidSflApiKey } from '@/lib/encryption'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'
// Token del bot de JuanMa — configurado en Vercel Environment Variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

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
 * Send Telegram DM to a user
 */
async function sendTelegramDM(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[VerifyCheer] No Telegram bot token configured')
    return false
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    return res.ok
  } catch (err) {
    console.error('[VerifyCheer] Telegram DM failed:', err)
    return false
  }
}

/**
 * POST /api/posts/[id]/verify-cheer
 * Called by helper AFTER they have cheered the owner's farm.
 * Updates HelperJoin status to 'cheered' and notifies owner via Telegram DM.
 */
function getLang(request: Request): string {
  const acceptLang = request.headers.get('accept-language') || ''
  return acceptLang.includes('es') ? 'es' : 'en'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const lang = getLang(request)
  console.log('[VerifyCheer] ===== START REQUEST =====')
  console.log('[VerifyCheer] Timestamp:', new Date().toISOString())
  console.log('[VerifyCheer] Lang:', lang)

  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    console.log('[VerifyCheer] Post ID:', id)
    console.log('[VerifyCheer] User ID making request:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch post to get ownerFarmId and owner info
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
      postId: post.id, ownerId: post.ownerId, farmId: post.farmId, title: post.title
    })

    // Fetch user (helper) with encrypted API key
    console.log('[VerifyCheer] Fetching helper user from DB...')
    const { data: helper, error: helperError } = await supabase
      .from('User')
      .select('id, playerId, encryptedApiKey, nickname, telegramId')
      .eq('id', userId)
      .maybeSingle()

    console.log('[VerifyCheer] Helper query result:', {
      helperId: helper?.id, playerId: helper?.playerId, nickname: helper?.nickname, hasApiKey: !!helper?.encryptedApiKey, helperError
    })

    if (helperError || !helper) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!helper.encryptedApiKey) {
      return NextResponse.json({
        verified: false,
        reason: 'no_api_key',
        message: 'No API key stored. Please relink your SFL account.',
      })
    }

    // Decrypt API key
    let apiKey: string
    try {
      apiKey = decrypt(helper.encryptedApiKey)
      console.log('[VerifyCheer] Decrypt OK, API key starts with:', apiKey.substring(0, 10) + '...')
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

    // Call SFL API with retry
    console.log('[VerifyCheer] Calling SFL API with playerId:', helper.playerId)

    const sflResult = await fetchWithRetry(
      `${SFL_API_BASE}/${helper.playerId}`,
      { headers: { 'X-API-Key': apiKey, Accept: 'application/json' } },
      3, 1500
    )

    console.log('[VerifyCheer] SFL API result:', { ok: sflResult.ok, status: sflResult.status })

    if (!sflResult.ok) {
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

    // Log SFL response keys for debugging
    console.log('[VerifyCheer] SFL response keys:', Object.keys(data || {}))
    console.log('[VerifyCheer] data.playerId:', data?.playerId)
    console.log('[VerifyCheer] data.farm:', data?.farm ? Object.keys(data.farm) : 'undefined')

    // Extract cheersGiven
    const cheersGiven =
      data.farm?.socialFarming?.cheersGiven ||
      data.farm?.celebrations?.cheersGiven ||
      data.celebrations?.cheersGiven ||
      data.cheersGiven || {}

    console.log('[VerifyCheer] cheersGiven:', JSON.stringify(cheersGiven))

    const farmsList: string[] = cheersGiven.farms || []
    const ownerFarmIdStr = String(post.farmId)
    const foundInFarms = farmsList.some(farmId => String(farmId) === ownerFarmIdStr)

    console.log('[VerifyCheer] ===== VERIFICATION CHECK =====')
    console.log('[VerifyCheer] Post farmId:', post.farmId)
    console.log('[VerifyCheer] Farms list from API:', farmsList)
    console.log('[VerifyCheer] foundInFarms:', foundInFarms)

    if (!foundInFarms) {
      console.log('[VerifyCheer] FAIL: Farm not found in cheersGiven.farms')
      return NextResponse.json({
        verified: false,
        reason: 'cheer_wrong_farm',
        message: `Cheer not found for this farm. You cheered ${farmsList.length} farms today but not this one. Make sure you cheered the correct farm and wait ~1 minute before trying again.`,
        debug: { ownerFarmId: post.farmId, userPlayerId: helper.playerId, farmsList }
      })
    }

    // ===== SUCCESS: Mark as cheered =====
    console.log('[VerifyCheer] SUCCESS! Updating HelperJoin to 'cheered'...')

    // Update HelperJoin status
    const { error: updateError } = await supabase
      .from('HelperJoin')
      .update({
        status: 'cheered',
        helperFarmId: String(helper.playerId),
      })
      .eq('postId', id)
      .eq('userId', userId)

    if (updateError) {
      console.error('[VerifyCheer] Failed to update HelperJoin:', updateError)
      return NextResponse.json({ verified: false, reason: 'db_error', message: 'Failed to record cheer.' })
    }

    // Add chat message
    const chatMessage = {
      postId: id,
      userId: userId,
      nickname: helper.nickname,
      content: `✅ @${helper.nickname} confirmed their cheer! 🎉 Return yours at sunflower-land.com 🎁`,
      createdAt: new Date().toISOString(),
    }
    await supabase.from('ChatMessage').insert(chatMessage)

    // Fetch post owner for Telegram DM
    const { data: owner } = await supabase
      .from('User')
      .select('id, telegramId, nickname')
      .eq('id', post.ownerId)
      .maybeSingle()

    // Send Telegram DM to post owner
    if (owner?.telegramId) {
      const farmLink = `https://sunflower-land.com/play/#/visit/${helper.playerId}`
      const dmText = `🎉 <b>@{helper.nickname}</b> sent you a cheer!\n\n` +
        `They helped with: <b>${post.title}</b>\n\n` +
        `Return the cheer 👇\n${farmLink}\n\n` +
        `Once you cheer them back, use "Verify Return" in the app to complete the exchange!`
      await sendTelegramDM(String(owner.telegramId), dmText)
    }

    console.log('[VerifyCheer] ===== SUCCESS =====')
    return NextResponse.json({
      verified: true,
      message: lang === 'es'
        ? '✅ ¡Cheer entregado con éxito! El creador fue notificado. ¡Te devolverá el cheer pronto!'
        : '✅ Cheer delivered successfully! The creator has been notified. They will return your cheer soon!',
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

// Need lang - we'll detect from Accept-Language header or default to en
var lang = 'en'

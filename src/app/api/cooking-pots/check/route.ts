import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt, isValidSflApiKey } from '@/lib/encryption'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

const COOKING_POTS = [
  { key: 'basicCookingPot', label: 'Basic Cooking Pot', asset: '/assets/monuments/basic_cooking_pot.webp' },
  { key: 'expertCookingPot', label: 'Expert Cooking Pot', asset: '/assets/monuments/expert_cooking_pot.webp' },
  { key: 'advancedCookingPot', label: 'Advanced Cooking Pot', asset: '/assets/monuments/advanced_cooking_pot.webp' },
]

/**
 * GET /api/cooking-pots/check?userId=xxx
 * Server-side cooking pot check using stored encrypted API key
 */
export async function GET(request: Request) {
  const debugLog: Record<string, any> = {
    timestamp: new Date().toISOString(),
    userId: null,
    playerId: null,
    hasEncryptedApiKey: false,
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      console.log('[CookingPotCheck] ❌ userId required')
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    debugLog.userId = userId
    console.log(`[CookingPotCheck] 🔍 Starting for userId: ${userId}`)

    // Fetch user with encrypted API key
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('playerId, encryptedApiKey')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      console.log(`[CookingPotCheck] ❌ User not found: ${userId}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    debugLog.playerId = user.playerId
    debugLog.hasEncryptedApiKey = !!user.encryptedApiKey
    debugLog.encryptedApiKeyLength = user.encryptedApiKey?.length || 0

    console.log(`[CookingPotCheck] 📋 User found - playerId: ${user.playerId}, hasApiKey: ${!!user.encryptedApiKey}`)

    if (!user.encryptedApiKey) {
      console.log('[CookingPotCheck] ❌ No API key stored for user')
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'no_api_key',
        debug: debugLog,
      })
    }

    // Try to decrypt
    let apiKey: string
    try {
      apiKey = decrypt(user.encryptedApiKey)
      debugLog.decryptSuccess = true
      debugLog.apiKeyPrefix = apiKey.substring(0, 8) + '...'
      console.log(`[CookingPotCheck] 🔓 Decrypted API key: ${apiKey.substring(0, 8)}...`)
    } catch (decryptErr: any) {
      console.log(`[CookingPotCheck] ❌ Decrypt failed: ${decryptErr.message}`)
      debugLog.decryptSuccess = false
      debugLog.decryptError = decryptErr.message
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'decrypt_failed',
        debug: debugLog,
      })
    }

    // Validate format
    const isValid = isValidSflApiKey(apiKey)
    debugLog.apiKeyValidFormat = isValid
    console.log(`[CookingPotCheck] ✅ API key format valid: ${isValid}`)

    if (!isValid) {
      console.log('[CookingPotCheck] ❌ Invalid API key format')
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'invalid_api_key_format',
        debug: debugLog,
      })
    }

    // Call SFL API
    console.log(`[CookingPotCheck] 🌐 Calling SFL API: ${SFL_API_BASE}/${user.playerId}`)
    const sflRes = await fetch(`${SFL_API_BASE}/${user.playerId}`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })

    debugLog.sflStatus = sflRes.status
    console.log(`[CookingPotCheck] 📡 SFL API response status: ${sflRes.status}`)

    if (!sflRes.ok) {
      const errText = await sflRes.text()
      debugLog.sflError = errText.substring(0, 200)
      console.log(`[CookingPotCheck] ❌ SFL API error: ${errText.substring(0, 200)}`)
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'sfl_api_error',
        status: sflRes.status,
        debug: debugLog,
      })
    }

    const data = await sflRes.json()
    debugLog.sflOk = true

    // Parse inventory
    const inventory = data.farm?.inventory || {}
    debugLog.inventoryHasData = Object.keys(inventory).length > 0
    debugLog.inventoryKeyCount = Object.keys(inventory).length
    console.log(`[CookingPotCheck] 📦 Inventory keys: ${Object.keys(inventory).length}`)
    console.log(`[CookingPotCheck] 📦 Inventory (first 500 chars): ${JSON.stringify(inventory).substring(0, 500)}`)

    // Find cooking pot related keys
    const potRelatedKeys = Object.keys(inventory).filter(k => 
      k.toLowerCase().includes('cooking') || k.toLowerCase().includes('pot')
    )
    debugLog.potRelatedKeys = potRelatedKeys
    console.log(`[CookingPotCheck] 🔍 Pot-related inventory keys: ${JSON.stringify(potRelatedKeys)}`)

    // Check each pot type
    const checks = {
      basic: { label: 'Basic Cooking Pot', found: false, count: 0 },
      expert: { label: 'Expert Cooking Pot', found: false, count: 0 },
      advanced: { label: 'Advanced Cooking Pot', found: false, count: 0 },
    }

    for (const [type, check] of Object.entries(checks)) {
      const count = inventory[check.label] || 0
      checks[type as keyof typeof checks].count = count
      checks[type as keyof typeof checks].found = count > 0
      console.log(`[CookingPotCheck] ${check.label}: ${count} (found: ${count > 0})`)
    }

    const details = {
      basic: (inventory['Basic Cooking Pot'] || 0) > 0,
      expert: (inventory['Expert Cooking Pot'] || 0) > 0,
      advanced: (inventory['Advanced Cooking Pot'] || 0) > 0,
    }

    const pots = COOKING_POTS.filter(pot => (inventory[pot.label] || 0) > 0)
      .map(pot => ({ label: pot.label, asset: pot.asset }))

    const hasAny = pots.length > 0

    console.log(`[CookingPotCheck] ✅ Result: hasAny=${hasAny}, details=${JSON.stringify(details)}`)
    console.log(`[CookingPotCheck] 🏺 Pots found: ${pots.map(p => p.label).join(', ') || 'none'}`)

    return NextResponse.json({
      hasAnyCookingPot: hasAny,
      pots,
      details,
      debug: debugLog,
    })
  } catch (err: any) {
    console.log(`[CookingPotCheck] ❌ Server error: ${err.message}`)
    debugLog.error = err.message
    return NextResponse.json({
      hasAnyCookingPot: false,
      pots: [],
      details: { basic: false, expert: false, advanced: false },
      reason: 'server_error',
      debug: debugLog,
    })
  }
}
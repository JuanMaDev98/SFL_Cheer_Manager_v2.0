import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { decrypt } from '@/lib/encryption'

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
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch user with encrypted API key
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('playerId, encryptedApiKey')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.encryptedApiKey) {
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'no_api_key',
      })
    }

    const apiKey = decrypt(user.encryptedApiKey)

    if (!apiKey) {
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'decrypt_failed',
      })
    }

    // Call SFL API
    const res = await fetch(`${SFL_API_BASE}/${user.playerId}`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
        reason: 'sfl_api_error',
        status: res.status,
      })
    }

    const data = await res.json()
    const inventory = data.farm?.inventory || {}

    const details = {
      basic: (inventory['Basic Cooking Pot'] || 0) > 0,
      expert: (inventory['Expert Cooking Pot'] || 0) > 0,
      advanced: (inventory['Advanced Cooking Pot'] || 0) > 0,
    }

    const pots = COOKING_POTS.filter(pot => (inventory[pot.label] || 0) > 0)
      .map(pot => ({ label: pot.label, asset: pot.asset }))

    return NextResponse.json({
      hasAnyCookingPot: pots.length > 0,
      pots,
      details,
      farmId: user.playerId,
    })
  } catch (err) {
    console.error('[cooking-pots/check] Error:', err)
    return NextResponse.json({
      hasAnyCookingPot: false,
      pots: [],
      details: { basic: false, expert: false, advanced: false },
      reason: 'server_error',
    })
  }
}
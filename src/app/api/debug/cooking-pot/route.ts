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
 * GET /api/debug/cooking-pot?userId=xxx
 * Debug endpoint to check cooking pot detection
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, nickname, playerId, encryptedApiKey')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const result: Record<string, any> = {
      userId: user.id,
      nickname: user.nickname,
      playerId: user.playerId,
      hasEncryptedApiKey: !!user.encryptedApiKey,
      encryptedApiKeyLength: user.encryptedApiKey?.length || 0,
    }

    if (!user.encryptedApiKey) {
      result.cookingPots = { basic: false, expert: false, advanced: false }
      result.reason = 'no_api_key'
      return NextResponse.json(result)
    }

    // Try to decrypt
    try {
      const apiKey = decrypt(user.encryptedApiKey)
      result.apiKeyValidFormat = isValidSflApiKey(apiKey)
      result.apiKeyPrefix = apiKey.substring(0, 10) + '...'
      
      if (!isValidSflApiKey(apiKey)) {
        result.cookingPots = { basic: false, expert: false, advanced: false }
        result.reason = 'invalid_api_key_format_after_decrypt'
        return NextResponse.json(result)
      }

      // Call SFL API
      const sflRes = await fetch(`${SFL_API_BASE}/${user.playerId}`, {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
      })

      result.sflStatus = sflRes.status
      result.sflOk = sflRes.ok

      if (!sflRes.ok) {
        const errText = await sflRes.text()
        result.sflError = errText.substring(0, 200)
        result.cookingPots = { basic: false, expert: false, advanced: false }
        result.reason = 'sfl_api_error'
        return NextResponse.json(result)
      }

      const sflData = await sflRes.json()
      
      // Check inventory structure
      result.inventoryKeys = Object.keys(sflData.farm?.inventory || {}).slice(0, 20)
      result.inventorySample = JSON.stringify(sflData.farm?.inventory).substring(0, 300)
      
      const inventory = sflData.farm?.inventory || {}
      
      // Try different naming variations
      const potNames = ['Basic Cooking Pot', 'basic_cooking_pot', 'BasicCookingPot', 'Cooking Pot', 'basic']
      result.checkedPotNames = potNames

      for (const name of potNames) {
        const count = inventory[name]
        if (count !== undefined) {
          result[`pot_${name}`] = count
        }
      }

      // Check actual keys that contain "cooking" or "pot" (case insensitive)
      const relevantKeys = Object.keys(inventory).filter(k => 
        k.toLowerCase().includes('cooking') || k.toLowerCase().includes('pot')
      )
      result.relevantInventoryKeys = relevantKeys
      result.relevantInventoryValues = relevantKeys.map(k => ({ key: k, value: inventory[k] }))

      const details = {
        basic: (inventory['Basic Cooking Pot'] || 0) > 0,
        expert: (inventory['Expert Cooking Pot'] || 0) > 0,
        advanced: (inventory['Advanced Cooking Pot'] || 0) > 0,
      }

      result.cookingPots = details
      result.hasAny = (details.basic || details.expert || details.advanced)

      // Also check buildings
      if (sflData.farm?.buildings) {
        result.buildingsKeys = Object.keys(sflData.farm.buildings).slice(0, 20)
      }

      return NextResponse.json(result)

    } catch (decryptError: any) {
      result.decryptError = decryptError.message
      result.cookingPots = { basic: false, expert: false, advanced: false }
      result.reason = 'decrypt_failed'
      return NextResponse.json(result)
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
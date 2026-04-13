import { NextResponse } from 'next/server'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

const COOKING_POTS = [
  { key: 'basicCookingPot', label: 'Basic Cooking Pot', asset: '/assets/monuments/basic_cooking_pot.webp' },
  { key: 'expertCookingPot', label: 'Expert Cooking Pot', asset: '/assets/monuments/expert_cooking_pot.webp' },
  { key: 'advancedCookingPot', label: 'Advanced Cooking Pot', asset: '/assets/monuments/advanced_cooking_pot.webp' },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const apiKey = searchParams.get('apiKey')

    if (!farmId) {
      return NextResponse.json({ error: 'farmId required' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({
        hasAnyCookingPot: false,
        pots: [],
        details: { basic: false, expert: false, advanced: false },
      })
    }

    const res = await fetch(`${SFL_API_BASE}/${farmId}`, {
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
    })
  } catch (err) {
    return NextResponse.json({
      hasAnyCookingPot: false,
      pots: [],
      details: { basic: false, expert: false, advanced: false },
    })
  }
}
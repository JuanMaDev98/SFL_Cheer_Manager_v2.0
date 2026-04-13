import { NextResponse } from 'next/server'

const SFL_API_BASE = 'https://api.sunflower-land.com/community/farms'

const COOKING_POT_TYPES = [
  'Basic Cooking Pot',
  'Expert Cooking Pot',
  'Advanced Cooking Pot',
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const apiKey = searchParams.get('apiKey')

    if (!farmId) {
      return NextResponse.json({ error: 'farmId required' }, { status: 400 })
    }

    // If no API key provided, return false (cannot check)
    if (!apiKey) {
      return NextResponse.json({ hasCookingPot: false, pots: [] })
    }

    const res = await fetch(`${SFL_API_BASE}/${farmId}`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ hasCookingPot: false, pots: [] })
    }

    const data = await res.json()
    const inventory = data.farm?.inventory || {}

    // Check for cooking pots
    const foundPots = COOKING_POT_TYPES.filter(pot => (inventory[pot] || 0) > 0)
    const hasCookingPot = foundPots.length > 0

    return NextResponse.json({
      hasCookingPot,
      pots: foundPots,
    })
  } catch (err) {
    return NextResponse.json({ hasCookingPot: false, pots: [] })
  }
}
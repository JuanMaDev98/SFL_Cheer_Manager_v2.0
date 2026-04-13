import { NextResponse } from 'next/server'
import { isValidSflApiKey } from '@/lib/encryption'

/**
 * Validates an SFL API key by verifying it matches the farm ID
 * Endpoint: GET /api/validate-sfl-key?farmId=X&apiKey=Y
 * 
 * Returns:
 * - { valid: true, farmId, username } on success
 * - { error: '...' } on failure
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const apiKey = searchParams.get('apiKey')

    if (!farmId || !apiKey) {
      return NextResponse.json({ error: 'Missing farmId or apiKey' }, { status: 400 })
    }

    if (!isValidSflApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
    }

    if (!/^\d+$/.test(farmId)) {
      return NextResponse.json({ error: 'Invalid farmId format' }, { status: 400 })
    }

    // Call SFL API to verify the key matches the farm
    const sflResponse = await fetch(
      `https://api.sunflower-land.com/community/farms/${farmId}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!sflResponse.ok) {
      return NextResponse.json({ error: 'Sunflower Land API error' }, { status: 502 })
    }

    const data = await sflResponse.json()

    if (data?.message === 'Not Found' || data?.error) {
      return NextResponse.json({ error: 'Farm not found or invalid API key' }, { status: 401 })
    }

    // Verify the returned farm ID matches what user claims
    const responseFarmId = String(data.id || data.playerId || '')

    if (!responseFarmId) {
      return NextResponse.json({ error: 'Invalid response from Sunflower Land' }, { status: 502 })
    }

    if (responseFarmId !== String(farmId)) {
      return NextResponse.json({ error: 'API key does not belong to this farm ID' }, { status: 403 })
    }

    const username = data.farm?.username || data.username || 'Unknown'

    return NextResponse.json({ valid: true, farmId: responseFarmId, username })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

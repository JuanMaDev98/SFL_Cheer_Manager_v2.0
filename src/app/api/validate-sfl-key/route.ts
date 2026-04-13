import { NextResponse } from 'next/server'
import { isValidSflApiKey } from '@/lib/encryption'

/**
 * Validates an SFL API key by verifying it against the farm ID
 * Endpoint: GET /api/validate-sfl-key?farmId=X&apiKey=Y
 * 
 * Security:
 * - API key is used server-side only, never stored or logged
 * - Validates format before making external request
 * - Returns minimal info to client
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const apiKey = searchParams.get('apiKey')

    // Basic validation
    if (!farmId || !apiKey) {
      return NextResponse.json({ error: 'Missing farmId or apiKey' }, { status: 400 })
    }

    // Validate API key format (don't process if format is invalid)
    if (!isValidSflApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
    }

    // Validate farmId format (should be numeric)
    if (!/^\d+$/.test(farmId)) {
      return NextResponse.json({ error: 'Invalid farmId format' }, { status: 400 })
    }

    // Call SFL API to verify the key matches the farm
    const sflResponse = await fetch(
      `https://api.sunflower-land.com/community/getFarms/${farmId}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    // SFL API returns 200 even if key is invalid - need to check response body
    const data = await sflResponse.json().catch(() => null)

    // Check if the response indicates valid credentials
    // A valid key for this farm should return farm data
    if (!sflResponse.ok || !data) {
      return NextResponse.json(
        { error: 'Could not verify API key with Sunflower Land' },
        { status: 401 }
      )
    }

    // The API returns farms array - verify this farm ID is in the response
    // If key is valid for different farms, we need owner verification
    if (data.farms && Array.isArray(data.farms)) {
      const farm = data.farms.find((f: any) => String(f.id) === String(farmId))
      if (!farm) {
        // Key exists but doesn't match this farm
        return NextResponse.json(
          { error: 'API key does not belong to this farm ID' },
          { status: 403 }
        )
      }
      // Success - key matches this farm
      return NextResponse.json({
        valid: true,
        farmId: farm.id,
        username: farm.username || data.username || 'Unknown'
      })
    }

    // Alternative response format - direct farm object
    if (data.id || data.playerId) {
      const responseFarmId = String(data.id || data.playerId)
      if (responseFarmId !== String(farmId)) {
        return NextResponse.json(
          { error: 'API key does not belong to this farm ID' },
          { status: 403 }
        )
      }
      return NextResponse.json({
        valid: true,
        farmId: responseFarmId,
        username: data.username || 'Unknown'
      })
    }

    // Unexpected response format
    console.error('[validate-sfl-key] Unexpected response format:', Object.keys(data || {}))
    return NextResponse.json(
      { error: 'Could not verify API key. Please check your credentials.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[validate-sfl-key] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

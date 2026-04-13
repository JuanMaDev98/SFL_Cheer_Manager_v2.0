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
 * 
 * SFL API response format:
 * {
 *   id: "5728332167996053",
 *   farm: { username: "OMFCAT", coins: 45334, ... },
 *   nftId: "251413",
 *   isBlacklisted: false
 * }
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
    // Correct endpoint: /community/farms/{farmId}
    const sflResponse = await fetch(
      `https://api.sunflower-land.com/community/farms/${farmId}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    // Parse response
    const data = await sflResponse.json().catch(() => null)

    // Check for HTTP errors or empty response
    if (!sflResponse.ok || !data) {
      return NextResponse.json(
        { error: 'Could not verify API key with Sunflower Land' },
        { status: 401 }
      )
    }

    // Verify the returned farm ID matches what user claims
    // data.id is the farm ID from SFL API
    const responseFarmId = String(data.id || data.playerId || '')
    
    if (responseFarmId !== String(farmId)) {
      // API key is valid but belongs to a different farm
      return NextResponse.json(
        { error: 'API key does not belong to this farm ID' },
        { status: 403 }
      )
    }

    // Success - key matches this farm
    // Get username from data.farm.username (main format) or data.username (fallback)
    const username = data.farm?.username || data.username || 'Unknown'

    return NextResponse.json({
      valid: true,
      farmId: responseFarmId,
      username: username
    })

  } catch (error) {
    console.error('[validate-sfl-key] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
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
 * SFL API response format (success):
 * {
 *   id: "5728332167996053",
 *   farm: { username: "OMFCAT", coins: 45334, ... },
 *   nftId: "251413",
 *   isBlacklisted: false
 * }
 * 
 * SFL API response format (error):
 * { "message": "Not Found" } or { "error": "..." }
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
    console.log('[validate-sfl-key] Calling SFL API for farm:', farmId)
    
    const sflResponse = await fetch(
      `https://api.sunflower-land.com/community/farms/${farmId}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    console.log('[validate-sfl-key] SFL response status:', sflResponse.status)

    // Check for HTTP errors first
    if (!sflResponse.ok) {
      const errorText = await sflResponse.text().catch(() => 'unknown')
      console.error('[validate-sfl-key] SFL HTTP error:', sflResponse.status, errorText)
      return NextResponse.json(
        { error: 'Sunflower Land API error', details: `HTTP ${sflResponse.status}` },
        { status: 502 }
      )
    }

    // Parse response
    let data
    try {
      data = await sflResponse.json()
    } catch (parseError) {
      const rawText = await sflResponse.text().catch(() => 'unknown')
      console.error('[validate-sfl-key] JSON parse error:', parseError, 'Raw:', rawText)
      return NextResponse.json(
        { error: 'Invalid response from Sunflower Land API' },
        { status: 502 }
      )
    }

    console.log('[validate-sfl-key] SFL response data keys:', Object.keys(data || {}))
    console.log('[validate-sfl-key] data.id:', data?.id, 'data.playerId:', data?.playerId)

    // Check if response indicates an error
    if (data?.message === 'Not Found' || data?.error) {
      console.error('[validate-sfl-key] SFL returned error message:', data.message || data.error)
      return NextResponse.json(
        { error: 'Farm not found or invalid API key' },
        { status: 401 }
      )
    }

    // Verify the returned farm ID matches what user claims
    // data.id is the farm ID from SFL API
    const responseFarmId = String(data.id || data.playerId || '')
    
    if (!responseFarmId || responseFarmId === '' || responseFarmId === 'undefined') {
      console.error('[validate-sfl-key] No farm ID in response:', data)
      return NextResponse.json(
        { error: 'Invalid response from Sunflower Land - missing farm ID' },
        { status: 502 }
      )
    }

    if (responseFarmId !== String(farmId)) {
      // API key is valid but belongs to a different farm
      console.error('[validate-sfl-key] Farm ID mismatch:', responseFarmId, 'vs', farmId)
      return NextResponse.json(
        { error: 'API key does not belong to this farm ID' },
        { status: 403 }
      )
    }

    // Success - key matches this farm
    // Get username from data.farm.username (main format) or data.username (fallback)
    const username = data.farm?.username || data.username || 'Unknown'
    
    console.log('[validate-sfl-key] Success! Username:', username)

    return NextResponse.json({
      valid: true,
      farmId: responseFarmId,
      username: username
    })

  } catch (error) {
    console.error('[validate-sfl-key] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

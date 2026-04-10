import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    if (!farmId || !/^\d+$/.test(farmId)) {
      return NextResponse.json({ error: 'Invalid farmId' }, { status: 400 })
    }

    const res = await fetch(
      `https://sfl.world/api/v1/land/info/farm_id/${farmId}`,
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'http://localhost:3000',
          Referer: 'http://localhost:3000/',
        },
      }
    )

    console.log('[lookup] SFL API status:', res.status, 'for farmId:', farmId)
    const text = await res.text()
    console.log('[lookup] SFL API response:', text.substring(0, 300))

    if (!res.ok) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const data = JSON.parse(text)

    return NextResponse.json({
      username: data.username,
      farm_id: data.farm_id,
      nft_id: data.nft_id,
    })
  } catch (err) {
    console.error('Lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}

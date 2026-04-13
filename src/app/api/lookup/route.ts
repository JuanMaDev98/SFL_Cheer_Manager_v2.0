import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    if (!farmId || !/^\d+$/.test(farmId)) {
      return NextResponse.json({ error: 'Invalid farmId' }, { status: 400 })
    }

    // Using the correct SFL API endpoint for farm info
    const res = await fetch(
      `https://api.sunflower-land.com/community/farms/${farmId}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SFL-Cheer-Manager/1.0)',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const data = await res.json()

    // The community endpoint returns { id, farm: { username }, nftId, ... }
    const username = data.farm?.username || data.username

    return NextResponse.json({
      username,
      farm_id: data.id,
      nft_id: data.nftId,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}

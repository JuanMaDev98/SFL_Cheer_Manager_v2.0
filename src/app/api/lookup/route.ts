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
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SFL-Cheer-Manager/1.0)',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const data = await res.json()

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

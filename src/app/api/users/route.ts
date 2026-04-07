import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    // Return all users (legacy, for autocomplete)
    const users = await db.user.findMany({
      select: { id: true, playerId: true, nickname: true, avatarIndex: true, helpersGiven: true, helpersReceived: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // If playerId provided, return just that user
    if (playerId) {
      const user = users.find(u => u.playerId === playerId)
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json(user)
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { telegramId, nickname, playerId } = await request.json()

    if (!nickname || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert by playerId so returning users are recognized
    const user = await db.user.upsert({
      where: { playerId },
      update: {
        nickname,
        telegramId: telegramId || undefined,
      },
      create: {
        telegramId: telegramId || null,
        nickname,
        playerId,
        avatarIndex: Math.floor(Math.random() * 6),
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

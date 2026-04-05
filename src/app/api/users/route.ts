import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, nickname: true, avatarIndex: true, helpersGiven: true, helpersReceived: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
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

    const user = await db.user.upsert({
      where: { telegramId: telegramId || `manual_${Date.now()}` },
      update: { nickname, playerId },
      create: {
        telegramId: telegramId || `manual_${Date.now()}`,
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

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const messages = await db.chatMessage.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, nickname, content } = await request.json()

    if (!userId || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const message = await db.chatMessage.create({
      data: { postId: id, userId, nickname, content },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if already joined
    const existing = await db.helperJoin.findUnique({
      where: { postId_userId: { postId: id, userId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already joined' }, { status: 409 })
    }

    // Create join and increment counter
    const [join, post] = await Promise.all([
      db.helperJoin.create({
        data: { postId: id, userId, status: 'joined' },
        include: { user: { select: { id: true, nickname: true, avatarIndex: true } } },
      }),
      db.farmPost.findUnique({ where: { id } }),
    ])

    let updatedPost
    if (post) {
      const newCount = post.helpersCount + 1
      updatedPost = await db.farmPost.update({
        where: { id },
        data: {
          helpersCount: newCount,
          isActive: newCount < post.helpersNeeded,
        },
      })
    }

    // Update user stats
    await db.user.update({
      where: { id: userId },
      data: { helpersGiven: { increment: 1 } },
    })
    if (post) {
      await db.user.update({
        where: { id: post.ownerId },
        data: { helpersReceived: { increment: 1 } },
      })
    }

    return NextResponse.json({ join, updatedPost })
  } catch (error) {
    console.error('Error joining post:', error)
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await db.farmPost.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, nickname: true, avatarIndex: true } },
        helpers: {
          include: {
            user: { select: { id: true, nickname: true, avatarIndex: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const post = await db.farmPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.helpersNeeded !== undefined && { helpersNeeded: body.helpersNeeded }),
        ...(body.helpersCount !== undefined && { helpersCount: body.helpersCount }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        owner: { select: { id: true, nickname: true, avatarIndex: true } },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.chatMessage.deleteMany({ where: { postId: id } })
    await db.helperJoin.deleteMany({ where: { postId: id } })
    await db.farmPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

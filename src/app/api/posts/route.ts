import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let where: any = { isActive: true }

    if (filter === 'urgent') {
      where.helpersCount = { lt: 3 }
    } else if (filter === 'almost-full') {
      where.helpersCount = { gte: 7 }
    } else if (filter === 'cooking') {
      where.category = 'cooking'
    }

    const [posts, total] = await Promise.all([
      db.farmPost.findMany({
        where,
        include: {
          owner: {
            select: { id: true, nickname: true, avatarIndex: true },
          },
          helpers: {
            include: {
              user: { select: { id: true, nickname: true, avatarIndex: true } },
            },
          },
          _count: { select: { helpers: true, chatMessages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.farmPost.count({ where }),
    ])

    return NextResponse.json({ posts, total, page, limit })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, message, farmId, category, helpersNeeded, ownerId } = body

    if (!title || !message || !farmId || !ownerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const post = await db.farmPost.create({
      data: {
        title,
        message,
        farmId,
        category: category || 'cleaning',
        helpersNeeded: helpersNeeded || 10,
        ownerId,
      },
      include: {
        owner: { select: { id: true, nickname: true, avatarIndex: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

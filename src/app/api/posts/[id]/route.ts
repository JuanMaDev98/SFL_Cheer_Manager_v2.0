import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, ...updateData } = body

    console.log('[PUT /api/posts/:id] userId:', userId, 'postId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 401 })
    }

    // Verify ownership
    const { data: post } = await supabase
      .from('FarmPost')
      .select('id, ownerId')
      .eq('id', id)
      .single()

    console.log('[PUT /api/posts/:id] post from DB:', post)

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.ownerId !== userId) {
      console.log('[PUT /api/posts/:id] FORBIDDEN - post.ownerId:', post.ownerId, '!== userId:', userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from('FarmPost')
      .update(updateData)
      .eq('id', id)
      .select('*, owner:User(id, nickname, avatarIndex)')
      .single()

    if (error) throw error
    return NextResponse.json(updated)
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('[DELETE /api/posts/:id] userId:', userId, 'postId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 401 })
    }

    // Verify ownership
    const { data: post } = await supabase
      .from('FarmPost')
      .select('id, ownerId')
      .eq('id', id)
      .single()

    console.log('[DELETE /api/posts/:id] post from DB:', post)

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.ownerId !== userId) {
      console.log('[DELETE /api/posts/:id] FORBIDDEN - post.ownerId:', post.ownerId, '!== userId:', userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete in order: messages, joins, then post
    await supabase.from('ChatMessage').delete().eq('postId', id)
    await supabase.from('HelperJoin').delete().eq('postId', id)
    const { error } = await supabase.from('FarmPost').delete().eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
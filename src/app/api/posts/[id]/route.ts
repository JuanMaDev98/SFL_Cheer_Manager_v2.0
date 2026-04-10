import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: post, error } = await supabase
      .from('FarmPost')
      .select(`
        *,
        owner:User(id, nickname, avatarIndex),
        helpers:HelperJoin(
          user:User(id, nickname, avatarIndex),
          order=createdAt.asc
        ),
        ChatMessage(order=createdAt.asc)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
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

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.message !== undefined) updateData.message = body.message
    if (body.helpersNeeded !== undefined) updateData.helpersNeeded = body.helpersNeeded
    if (body.helpersCount !== undefined) updateData.helpersCount = body.helpersCount
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const { data: post, error } = await supabase
      .from('FarmPost')
      .update(updateData)
      .eq('id', id)
      .select('*, owner:User(id, nickname, avatarIndex)')
      .single()

    if (error) throw error
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
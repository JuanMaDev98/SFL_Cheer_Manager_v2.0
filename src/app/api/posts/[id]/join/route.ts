import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Check if already joined (using HelperJoin table)
    const { data: existing } = await supabase
      .from('HelperJoin')
      .select('id')
      .eq('postId', id)
      .eq('userId', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already joined' }, { status: 409 })
    }

    // Get post to check capacity
    const { data: post } = await supabase
      .from('FarmPost')
      .select('helpersCount, helpersNeeded, ownerId')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.helpersCount >= post.helpersNeeded) {
      return NextResponse.json({ error: 'Post is full' }, { status: 409 })
    }

    // Create join record
    const { data: join, error: joinError } = await supabase
      .from('HelperJoin')
      .insert({ postId: id, userId, status: 'joined' })
      .select('user:User(id, nickname, avatarIndex)')
      .single()

    if (joinError) throw joinError

    // Increment helpersCount
    await supabase
      .from('FarmPost')
      .update({
        helpersCount: post.helpersCount + 1,
        isActive: (post.helpersCount + 1) < post.helpersNeeded,
      })
      .eq('id', id)

    // Update user stats
    if (userId) {
      await supabase.rpc('increment_helpers_given', { user_id: userId })
    }
    if (post?.ownerId) {
      await supabase.rpc('increment_helpers_received', { user_id: post.ownerId })
    }

    // Get updated post with helpers
    const { data: finalPost } = await supabase
      .from('FarmPost')
      .select(`
        *,
        owner:User(id, nickname, avatarIndex),
        helpers:HelperJoin(
          id,
          userId,
          status,
          createdAt,
          user:User(id, nickname, avatarIndex)
        )
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({ join, updatedPost: finalPost })
  } catch (error) {
    console.error('Error joining post:', error)
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 })
  }
}

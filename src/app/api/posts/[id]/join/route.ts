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

    // Check if already joined
    const { data: existing } = await supabase
      .from('HelperJoin')
      .select('*')
      .eq('postId', id)
      .eq('userId', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already joined' }, { status: 409 })
    }

    // Create join
    const { data: join, error: joinError } = await supabase
      .from('HelperJoin')
      .insert({ postId: id, userId, status: 'joined' })
      .select('user:User(id, nickname, avatarIndex)')
      .single()

    if (joinError) throw joinError

    // Get current post to increment counter
    const { data: post } = await supabase
      .from('FarmPost')
      .select('helpersCount, helpersNeeded, ownerId')
      .eq('id', id)
      .single()

    let updatedPost
    if (post) {
      const newCount = post.helpersCount + 1
      const { data: updated } = await supabase
        .from('FarmPost')
        .update({
          helpersCount: newCount,
          isActive: newCount < post.helpersNeeded,
        })
        .eq('id', id)
        .select()
        .single()

      updatedPost = updated
    }

    // Update user stats
    if (userId) {
      await supabase.rpc('increment_helpers_given', { user_id: userId })
    }
    if (post?.ownerId) {
      await supabase.rpc('increment_helpers_received', { user_id: post.ownerId })
    }

    return NextResponse.json({ join, updatedPost })
  } catch (error) {
    console.error('Error joining post:', error)
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 })
  }
}
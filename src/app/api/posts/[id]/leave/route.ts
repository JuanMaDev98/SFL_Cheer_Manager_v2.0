import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/posts/[id]/leave
 * Allows a user to abandon a task they previously joined
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Check if helper record exists
    const { data: helper, error: findError } = await supabase
      .from('HelperJoin')
      .select('id')
      .eq('postId', id)
      .eq('userId', userId)
      .maybeSingle()

    if (findError || !helper) {
      return NextResponse.json({ error: 'Not a helper of this post' }, { status: 404 })
    }

    // Delete helper record
    const { error: deleteError } = await supabase
      .from('HelperJoin')
      .delete()
      .eq('id', helper.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to leave task' }, { status: 500 })
    }

    // Decrement helpersCount directly (don't rely on RPC)
    const { data: post } = await supabase
      .from('FarmPost')
      .select('helpersCount')
      .eq('id', id)
      .single()

    if (post && post.helpersCount > 0) {
      await supabase
        .from('FarmPost')
        .update({ helpersCount: post.helpersCount - 1, isActive: true })
        .eq('id', id)
    }

    // Return updated post with helpers
    const { data: updatedPost } = await supabase
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

    return NextResponse.json({ success: true, updatedPost })
  } catch (err: any) {
    console.error('[LeavePost] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

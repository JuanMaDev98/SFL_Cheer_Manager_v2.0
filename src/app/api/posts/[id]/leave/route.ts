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
      .from('PostHelper')
      .select('id')
      .eq('postId', id)
      .eq('userId', userId)
      .maybeSingle()

    if (findError || !helper) {
      return NextResponse.json({ error: 'Not a helper of this post' }, { status: 404 })
    }

    // Delete helper record
    const { error: deleteError } = await supabase
      .from('PostHelper')
      .delete()
      .eq('id', helper.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to leave task' }, { status: 500 })
    }

    // Decrement helpersCount in Post
    const { error: updateError } = await supabase.rpc('decrement_helpers_count', { post_id: id })

    if (updateError) {
      console.error('[LeavePost] decrement_helpers_count error:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[LeavePost] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

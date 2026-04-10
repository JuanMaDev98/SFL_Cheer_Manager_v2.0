import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: messages, error } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('postId', id)
      .order('createdAt', { ascending: true })
      .limit(50)

    if (error) throw error
    return NextResponse.json(messages || [])
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

    const { data: message, error } = await supabase
      .from('ChatMessage')
      .insert({ postId: id, userId, nickname, content })
      .single()

    if (error) throw error
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('FarmPost')
      .select(`
        *,
        owner:User(id, nickname, avatarIndex),
        helpers:HelperJoin(
          user:User(id, nickname, avatarIndex)
        )
      `, { count: 'exact' })
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (filter === 'urgent') {
      query = query.lt('helpersCount', 3)
    } else if (filter === 'almost-full') {
      query = query.gte('helpersCount', 7)
    } else if (filter === 'cooking') {
      query = query.eq('category', 'cooking')
    }

    const { data: posts, error, count } = await query

    if (error) throw error
    return NextResponse.json({ posts: posts || [], total: count || 0, page, limit })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, message, farmId, category, helpersNeeded, ownerId, hasBasicCookingPot, hasExpertCookingPot, hasAdvancedCookingPot } = body

    if (!title || !farmId || !ownerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already has an active post in this category
    const { data: existingPost, error: checkError } = await supabase
      .from('FarmPost')
      .select('id, category')
      .eq('ownerId', ownerId)
      .eq('category', category)
      .eq('isActive', true)
      .maybeSingle()

    if (checkError) throw checkError
    if (existingPost) {
      return NextResponse.json(
        { error: 'Ya tienes un post activo en esta categoría' },
        { status: 409 }
      )
    }

    const { data: post, error } = await supabase
      .from('FarmPost')
      .insert({
        title,
        message,
        farmId,
        category: category || 'cleaning',
        helpersNeeded: helpersNeeded || 10,
        ownerId,
        hasBasicCookingPot: hasBasicCookingPot || false,
        hasExpertCookingPot: hasExpertCookingPot || false,
        hasAdvancedCookingPot: hasAdvancedCookingPot || false,
      })
      .select('*, owner:User(id, nickname, avatarIndex)')
      .single()

    if (error) throw error
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
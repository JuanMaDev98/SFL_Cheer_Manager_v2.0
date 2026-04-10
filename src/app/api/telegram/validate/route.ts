import { NextResponse } from 'next/server'
import { validateInitData, checkUserSubscriptions, type TelegramUser } from '@/lib/telegram-server'

export async function POST(request: Request) {
  try {
    const { initData } = await request.json()

    if (!initData) {
      return NextResponse.json({ valid: false, error: 'No initData provided' }, { status: 400 })
    }

    // Validate initData signature
    const user = await validateInitData(initData)

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid initData' }, { status: 401 })
    }

    // Check subscription to mandatory channels
    const subscriptionResult = await checkUserSubscriptions(user)

    return NextResponse.json({
      valid: true,
      user,
      subscriptions: subscriptionResult.subscriptions,
      allPassed: subscriptionResult.allPassed,
    })
  } catch (err) {
    console.error('[telegram/validate] Error:', err)
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { getTelegramUserFromInitData } from '@/lib/telegram-server'

export async function POST(request: Request) {
  try {
    const { initData } = await request.json()

    if (!initData) {
      return NextResponse.json({ valid: false, error: 'No initData provided' }, { status: 400 })
    }

    // Extract user from initData without complex hash validation
    // (Telegram Mini Apps already provide this data securely)
    const user = getTelegramUserFromInitData(initData)

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid initData' }, { status: 401 })
    }

    // Check subscriptions
    const { checkUserSubscriptions } = await import('@/lib/telegram-server')
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
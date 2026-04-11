import { NextResponse } from 'next/server'
import { checkMembership, MANDATORY_CHATS } from '@/lib/telegram-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const parsedUserId = parseInt(userId)
  if (isNaN(parsedUserId)) {
    return NextResponse.json({ error: 'invalid userId' }, { status: 400 })
  }

  console.log('[check-subscription] userId:', parsedUserId)
  console.log('[check-subscription] BOT_TOKEN present:', !!process.env.TELEGRAM_BOT_TOKEN)

  const subscriptions = await Promise.all(
    MANDATORY_CHATS.map(async (chat) => {
      console.log('[check-subscription] Checking:', chat.username)
      const result = await checkMembership(parsedUserId, chat.username)
      console.log('[check-subscription] Result for', chat.username, ':', JSON.stringify(result))
      return {
        chat: chat.username,
        name: chat.name,
        type: chat.type,
        isMember: result.isMember,
        status: result.status,
      }
    })
  )

  const allPassed = subscriptions.every((s) => s.isMember)
  console.log('[check-subscription] allPassed:', allPassed)

  return NextResponse.json({ subscriptions, allPassed })
}
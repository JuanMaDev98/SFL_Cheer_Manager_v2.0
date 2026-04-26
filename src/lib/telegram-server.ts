import crypto from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

export const MANDATORY_CHATS = [
  { username: 'JuanMaCryptoYoutube', type: 'channel' as const, name: 'JuanMa Crypto Chat' },
]

/**
 * Extract user from initData WITHOUT hash validation
 * NOTE: For production, always validate the hash using validateInitData()
 */
export function getTelegramUserFromInitData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(decodeURIComponent(userStr)) as TelegramUser
  } catch {
    return null
  }
}

/**
 * Full validation of initData (hash check + expiry)
 * Validates against Telegram's WebAppData secret
 */
export function validateInitData(initData: string): TelegramUser | null {
  if (!BOT_TOKEN) {
    console.error('[Telegram] BOT_TOKEN not configured')
    return null
  }

  try {
    const params = new URLSearchParams(initData)
    const receivedHash = params.get('hash')
    if (!receivedHash) return null

    params.delete('hash')

    const sortedEntries = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))

    const dataCheckString = sortedEntries
      .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const hmac = crypto.createHmac('sha256', secretKey)
    const dataCheckBuffer = hmac.update(dataCheckString, 'utf8').digest()
    const dataCheckHash = dataCheckBuffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    if (dataCheckHash !== receivedHash) {
      return null
    }

    // Check auth_date not older than 24h
    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
      return null
    }

    const userStr = params.get('user')
    if (!userStr) return null

    return JSON.parse(decodeURIComponent(userStr)) as TelegramUser
  } catch (err) {
    console.error('[Telegram] Validation error:', err)
    return null
  }
}

/**
 * Check if user is a member of a specific Telegram chat
 */
export async function checkMembership(
  userId: number,
  chatUsername: string
): Promise<{ isMember: boolean; status?: string }> {
  if (!BOT_TOKEN) {
    return { isMember: false, status: 'bot_not_configured' }
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: `@${chatUsername}`,
          user_id: userId,
        }),
      }
    )

    const data = await res.json()

    if (!data.ok) {
      return { isMember: false, status: 'error' }
    }

    const status = data.result.status
    const memberStatuses = ['member', 'creator', 'administrator']
    const isMember = memberStatuses.includes(status) || status === 'restricted'

    return { isMember, status }
  } catch {
    return { isMember: false, status: 'error' }
  }
}

/**
 * Check all mandatory subscriptions for a user
 */
export async function checkUserSubscriptions(user: TelegramUser) {
  const subscriptions = await Promise.all(
    MANDATORY_CHATS.map(async (chat) => {
      const result = await checkMembership(user.id, chat.username)
      return {
        chat: chat.username,
        name: chat.name,
        type: chat.type,
        isMember: result.isMember,
        status: result.status,
      }
    })
  )

  return {
    user,
    subscriptions,
    allPassed: subscriptions.every((s) => s.isMember),
  }
}

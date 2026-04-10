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
  { username: 'JuanMaYoutube', type: 'channel' as const, name: 'Canal de JuanMa' },
  { username: 'MankoGuild', type: 'group' as const, name: 'Manko Guild' },
]

// Validate initData from Telegram Mini App
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateInitData(initData: string): TelegramUser | null {
  if (!BOT_TOKEN) {
    console.error('[Telegram] BOT_TOKEN not configured')
    return null
  }

  try {
    const params = new URLSearchParams(initData)
    const receivedHash = params.get('hash')
    if (!receivedHash) {
      console.error('[Telegram] No hash in initData')
      return null
    }

    params.delete('hash')

    // Step 1: Build data_check_string = "key1=value1\nkey2=value2\n..."
    // Values need to be URL-decoded
    const sortedEntries = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))

    const dataCheckString = sortedEntries
      .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
      .join('\n')

    console.log('[Telegram] dataCheckString:', dataCheckString.substring(0, 80) + '...')

    // Step 2: Compute secret_key = HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    // Step 3: Compute data_check_hash = HMAC_SHA256(secret_key, data_check_string)
    // Output is raw binary, then converted to base64, then made URL-safe
    const hmac = crypto.createHmac('sha256', secretKey)
    const dataCheckBuffer = hmac.update(dataCheckString, 'utf8').digest()
    const dataCheckHash = dataCheckBuffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    console.log('[Telegram] Computed hash:', dataCheckHash)
    console.log('[Telegram] Received hash:', receivedHash)

    if (dataCheckHash !== receivedHash) {
      console.error('[Telegram] Hash mismatch')
      return null
    }

    // Step 4: Check auth_date is not older than 24h
    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
      console.error('[Telegram] initData expired')
      return null
    }

    const userStr = params.get('user')
    if (!userStr) {
      console.error('[Telegram] No user in initData')
      return null
    }

    return JSON.parse(decodeURIComponent(userStr)) as TelegramUser
  } catch (err) {
    console.error('[Telegram] Validation error:', err)
    return null
  }
}

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
          chat: `@${chatUsername}`,
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
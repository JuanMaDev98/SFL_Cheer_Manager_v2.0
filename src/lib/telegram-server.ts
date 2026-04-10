// Server-side Telegram utilities (no client library needed - uses Bot API directly)

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
export async function validateInitData(initData: string): Promise<TelegramUser | null> {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')

    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const botTokenKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(BOT_TOKEN),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const dataToCheck = new TextEncoder().encode(sortedParams)
    const dataCheckBuffer = await crypto.subtle.sign('HMAC', botTokenKey, dataToCheck)

    const finalKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(dataCheckBuffer),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const finalCheck = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      new TextEncoder().encode(sortedParams)
    )

    const finalBase64 = btoa(String.fromCharCode(...new Uint8Array(finalCheck)))

    if (finalBase64 !== hash) {
      console.error('[Telegram] Hash mismatch')
      return null
    }

    // Check if not too old (initData expires after 24h)
    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
      console.error('[Telegram] initData expired')
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

// Check if user is member of a chat via Bot API
export async function checkMembership(
  userId: number,
  chatUsername: string
): Promise<{ isMember: boolean; status?: string }> {
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

// Check all mandatory subscriptions
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
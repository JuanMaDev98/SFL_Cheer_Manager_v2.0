'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

interface SubscriptionCheck {
  chat: string
  name: string
  type: 'channel' | 'group'
  isMember: boolean
  status?: string
}

export default function TelegramGate({ children }: { children: React.ReactNode }) {
  const { setUser, setScreen, setTelegramUser } = useAppStore()
  const [ready, setReady] = useState(false)
  const [notInTelegram, setNotInTelegram] = useState(false)
  const [needsSubscription, setNeedsSubscription] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubscriptionCheck[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      // Wait for Telegram WebApp to be fully ready
      // @ts-ignore
      const tg = window.Telegram?.WebApp

      if (!tg) {
        // Not in Telegram - might be dev mode, let it pass
        console.warn('[TelegramGate] No Telegram WebApp detected')
        setReady(true)
        return
      }

      // onReady is the correct way to wait for Telegram init
      await new Promise<void>(resolve => {
        // If already ready, resolve immediately
        if (tg.ready) {
          tg.ready()
        }
        if (tg.expand) {
          tg.expand()
        }
        // Give it a moment for initData to be populated
        setTimeout(resolve, 100)
      })

      console.log('[TelegramGate] WebApp ready, initData length:', tg.initData?.length || 0)
      console.log('[TelegramGate] User:', tg.initDataUnsafe?.user)

      if (!tg.initDataUnsafe?.user) {
        setNotInTelegram(true)
        setReady(true)
        return
      }

      const tgUser = tg.initDataUnsafe.user as TelegramUser
      setTelegramUser(tgUser)

      try {
        const res = await fetch(`/api/telegram/check-subscription?userId=${tgUser.id}`)
        const data = await res.json()
        console.log('[TelegramGate] Subscription:', data)

        if (!data.subscriptions) {
          setError(data.error || 'Error checking subscriptions')
          setReady(true)
          return
        }

        setSubscriptions(data.subscriptions)

        if (!data.allPassed) {
          setNeedsSubscription(true)
          setReady(true)
          return
        }

        // All good — upsert user
        await upsertUser(tgUser)
        setReady(true)
      } catch (err) {
        console.error('[TelegramGate] Error:', err)
        setError('Error de conexión. Intentá de nuevo.')
        setReady(true)
      }
    }

    init()
  }, [])

  async function upsertUser(tgUser: TelegramUser) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id,
          nickname: tgUser.username || tgUser.first_name,
          playerId: String(tgUser.id),
        }),
      })

      if (res.ok) {
        const user = await res.json()
        setUser(user)
      }
    } catch {
      // Continue even if DB fails
    }
    setScreen('feed')
  }

  function openChat(username: string) {
    // @ts-ignore
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/${username}`)
    } else {
      window.open(`https://t.me/${username}`, '_blank')
    }
  }

  // Never render error states during initial load — wait for ready
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
        <div className="animate-spin w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full mb-4" />
        <p className="text-green-700 font-medium">Verificando...</p>
      </div>
    )
  }

  if (notInTelegram) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-green-900 mb-2">Abrí desde Telegram</h2>
        <p className="text-green-600 text-sm">
          Esta app solo funciona dentro de Telegram.
          <br />
          Abrila desde el bot para continuar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl font-medium"
        >
          Recargar
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (needsSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center">
        <div className="text-5xl mb-4">📢</div>
        <h2 className="text-xl font-bold text-green-900 mb-2">Unite a los canales</h2>
        <p className="text-green-600 text-sm mb-6">
          Para usar la app gratis, necesitas ser miembro de:
        </p>

        <div className="w-full max-w-sm space-y-3">
          {subscriptions.map((sub) => (
            <button
              key={sub.chat}
              onClick={() => openChat(sub.chat)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                sub.isMember
                  ? 'border-green-300 bg-green-50'
                  : 'border-green-200 hover:border-green-400 bg-white'
              }`}
            >
              <div className="text-left">
                <p className="font-bold text-green-800">{sub.name}</p>
                <p className="text-xs text-green-500">@{sub.chat}</p>
              </div>
              {sub.isMember ? (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">✓</span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">UNIRSE</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-green-500 text-xs mt-6">
          Una vez unido, esperá y tocá "Verificar"
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl shadow-lg"
        >
          ✓ Verificar
        </button>
      </div>
    )
  }

  return <>{children}</>
}
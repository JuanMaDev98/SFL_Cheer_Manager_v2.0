'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import type { Lang } from '@/lib/i18n'

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function RegisterScreen() {
  const { lang, setUser, setScreen } = useAppStore()
  const [nickname, setNickname] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [avatarIndex, setLocalAvatar] = useState(Math.floor(Math.random() * 6))
  const [errors, setErrors] = useState<{ nickname?: string; playerId?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  const validateNickname = (val: string): string | undefined => {
    if (!val) return t('reg.nickname.error', lang as Lang)
    if (!NICKNAME_REGEX.test(val)) return t('reg.nickname.error', lang as Lang)
    return undefined
  }

  const validatePlayerId = (val: string): string | undefined => {
    if (!val || val.length < 2) return t('reg.playerId.error', lang as Lang)
    return undefined
  }

  useEffect(() => {
    if (nickname) {
      setErrors((prev) => ({ ...prev, nickname: validateNickname(nickname) }))
    }
  }, [nickname])

  useEffect(() => {
    if (playerId) {
      setErrors((prev) => ({ ...prev, playerId: validatePlayerId(playerId) }))
    }
  }, [playerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nickErr = validateNickname(nickname)
    const idErr = validatePlayerId(playerId)
    setErrors({ nickname: nickErr, playerId: idErr })

    if (nickErr || idErr) {
      haptic([50, 50, 50])
      return
    }

    haptic([50])
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, playerId }),
      })

      if (!res.ok) throw new Error('Failed to register')

      const user = await res.json()
      haptic([50, 100, 50])
      setUser(user)
      setScreen('feed')
    } catch {
      haptic([100])
      setErrors({ nickname: t('general.error', lang as Lang) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 safe-top">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center gap-5"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Image
              src="/assets/sunflower-logo.png"
              alt="Sunflower"
              width={60}
              height={60}
              className="mx-auto mb-2"
            />
          </motion.div>
          <h1 className="text-xl font-bold text-green-900">
            {t('reg.title', lang as Lang)}
          </h1>
          <p className="text-xs text-green-600 mt-1 leading-relaxed">
            {t('reg.subtitle', lang as Lang)}
          </p>
        </div>

        {/* Avatar preview */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <button
            type="button"
            onClick={() => {
              haptic([20])
              setLocalAvatar((prev) => (prev + 1) % 6)
            }}
            className="flex flex-col items-center gap-1 group"
          >
            <BumpkinAvatar avatarIndex={avatarIndex} size="lg" showRing />
            <span className="text-[10px] text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Tap to change
            </span>
          </button>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Nickname */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-green-800">
              {t('reg.nickname', lang as Lang)}
            </Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('reg.nickname.placeholder', lang as Lang)}
              className={`rounded-xl border-green-200 bg-white/90 focus:border-green-400 h-11 ${
                errors.nickname ? 'border-red-300' : ''
              }`}
              maxLength={20}
              autoComplete="off"
            />
            {errors.nickname && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 text-xs text-red-500"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.nickname}
              </motion.p>
            )}
          </div>

          {/* Player ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-green-800">
              {t('reg.playerId', lang as Lang)}
            </Label>
            <Input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder={t('reg.playerId.placeholder', lang as Lang)}
              className={`rounded-xl border-green-200 bg-white/90 focus:border-green-400 h-11 ${
                errors.playerId ? 'border-red-300' : ''
              }`}
              autoComplete="off"
            />
            {errors.playerId && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 text-xs text-red-500"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.playerId}
              </motion.p>
            )}
          </div>

          {/* Submit */}
          <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-base font-bold shadow-lg shadow-green-600/25 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="animate-pulse">{t('general.loading', lang as Lang)}</span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('reg.button', lang as Lang)}
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}

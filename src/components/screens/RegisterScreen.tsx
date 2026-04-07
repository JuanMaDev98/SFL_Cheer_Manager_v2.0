'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import type { Lang } from '@/lib/i18n'

type Step = 'input' | 'loading' | 'error' | 'confirm'

interface SflLandInfo {
  id: string
  username: string
}

export default function RegisterScreen() {
  const { lang, setUser, setScreen } = useAppStore()
  const [step, setStep] = useState<Step>('input')
  const [farmId, setFarmId] = useState('')
  const [error, setError] = useState('')
  const [landInfo, setLandInfo] = useState<SflLandInfo | null>(null)
  const [avatarIndex] = useState(Math.floor(Math.random() * 6))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  const handleVerify = async () => {
    if (!farmId || !/^\d+$/.test(farmId)) {
      setError(t('login.farmId.error', lang as Lang))
      haptic([50, 50, 50])
      return
    }

    haptic([50])
    setError('')
    setStep('loading')

    try {
      const res = await fetch(
        `https://sfl.world/api/v1/land/info/farm_id/${farmId}`,
        { headers: { Accept: 'application/json' } }
      )

      if (!res.ok) throw new Error('not_found')

      const data = await res.json()
      const username = data.username

      if (!username || username === 'undefined') {
        throw new Error('no_username')
      }

      haptic([50, 100, 50])
      setLandInfo({ id: farmId, username })
      setStep('confirm')
    } catch {
      haptic([100])
      setError(t('login.error.notFound', lang as Lang))
      setStep('error')
    }
  }

  const handleConfirm = async () => {
    if (!landInfo) return
    haptic([50])
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: landInfo.username,
          playerId: landInfo.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to register')

      const user = await res.json()
      haptic([50, 100, 50])
      setUser(user)
      setScreen('feed')
    } catch {
      haptic([100])
      setError(t('general.error', lang as Lang))
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    haptic([20])
    setLandInfo(null)
    setStep('input')
    setFarmId('')
    setError('')
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
            {t('login.title', lang as Lang)}
          </h1>
          <p className="text-xs text-green-600 mt-1 leading-relaxed">
            {t('login.subtitle', lang as Lang)}
          </p>
        </div>

        {/* Step: Input farm_id */}
        {step === 'input' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerify()
            }}
            className="w-full flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-green-800">
                {t('login.farmId', lang as Lang)}
              </Label>
              <Input
                value={farmId}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, '')
                  setFarmId(v)
                  setError('')
                }}
                placeholder={t('login.farmId.placeholder', lang as Lang)}
                className={`rounded-xl border-green-200 bg-white/90 focus:border-green-400 h-11 ${
                  error ? 'border-red-300' : ''
                }`}
                inputMode="numeric"
                autoComplete="off"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-xs text-red-500"
                >
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </motion.p>
              )}
            </div>

            <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
              <Button
                type="submit"
                disabled={farmId.length === 0}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-base font-bold shadow-lg shadow-green-600/25 disabled:opacity-60"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {t('login.button', lang as Lang)}
              </Button>
            </motion.div>
          </form>
        )}

        {/* Step: Loading */}
        {step === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-4 py-8"
          >
            <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full" />
            <p className="text-sm text-green-600 animate-pulse">
              {t('login.loading', lang as Lang)}
            </p>
          </motion.div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 w-full text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              className="w-full h-12 rounded-2xl border-green-300 text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('login.confirm.back', lang as Lang)}
            </Button>
          </motion.div>
        )}

        {/* Step: Confirm — solo muestra username */}
        {step === 'confirm' && landInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center gap-5"
          >
            <BumpkinAvatar avatarIndex={avatarIndex} size="lg" showRing />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-4"
            >
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                <h2 className="text-lg font-bold text-green-900">
                  {t('login.confirm.title', lang as Lang)}
                </h2>
                <p className="text-xs text-green-600">
                  {t('login.confirm.subtitle', lang as Lang)}
                </p>
              </div>

              {/* Username no editable */}
              <div className="rounded-xl border-2 border-green-200 bg-white/90 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-1">
                  {t('login.confirm.username', lang as Lang)}
                </p>
                <p className="text-xl font-bold text-green-900">
                  {landInfo.username}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full h-13 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-base font-bold shadow-lg shadow-green-600/25 disabled:opacity-60"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('login.confirm.button', lang as Lang)}
                  </Button>
                </motion.div>
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  className="w-full h-10 text-green-600 hover:text-green-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('login.confirm.back', lang as Lang)}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

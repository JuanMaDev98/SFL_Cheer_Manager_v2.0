'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, AlertCircle, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'
import type { Lang } from '@/lib/i18n'

type LinkState = 'idle' | 'loading' | 'success' | 'error'

export default function LinkTelegramScreen() {
  const { setScreen, setTelegramLinked, lang } = useAppStore()
  const [state, setState] = useState<LinkState>('idle')

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  const handleLink = async () => {
    haptic([50])
    setState('loading')

    // Simulate Telegram WebApp auth
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate success
    haptic([50, 100, 50])
    setTelegramLinked(true)
    setState('success')

    await new Promise((resolve) => setTimeout(resolve, 800))
    setScreen('register')
  }

  const handleSkip = () => {
    haptic([20])
    setScreen('register')
  }

  const handleRetry = () => {
    setState('idle')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 safe-top">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm"
          >
            {/* Animated Logo */}
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/assets/sunflower-logo.png"
                  alt="Sunflower Helpers"
                  width={120}
                  height={120}
                  className="drop-shadow-xl"
                />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-24 h-3 bg-yellow-300/40 rounded-full blur-lg" />
              </motion.div>
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-green-900"
            >
              {t('link.title', lang as Lang)}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-green-700 leading-relaxed"
            >
              {t('link.subtitle', lang as Lang)}
            </motion.p>

            {/* Link Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full"
            >
              <Button
                onClick={handleLink}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-base font-bold shadow-lg shadow-green-600/25 transition-all duration-200"
              >
                <Send className="w-5 h-5 mr-2" />
                {t('link.button', lang as Lang)}
              </Button>
            </motion.div>

            {/* Skip */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={handleSkip}
              className="text-sm text-green-500 hover:text-green-700 underline underline-offset-4 transition-colors"
            >
              {t('link.skip', lang as Lang)}
            </motion.button>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <SunflowerSpinner size="lg" loadingText={t('link.loading', lang as Lang)} />
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500" />
            </motion.div>
            <p className="text-lg font-bold text-green-700">
              {t('link.success', lang as Lang)}
            </p>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-400" />
            <p className="text-sm text-red-600">
              {t('link.error', lang as Lang)}
            </p>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="rounded-xl border-green-300 text-green-700 hover:bg-green-50"
            >
              {t('general.retry', lang as Lang)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

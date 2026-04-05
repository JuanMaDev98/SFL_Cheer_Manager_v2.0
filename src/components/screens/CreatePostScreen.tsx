'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import HelperCounter from '@/components/shared/HelperCounter'
import type { Lang } from '@/lib/i18n'

const CATEGORIES = [
  { key: 'cleaning', emoji: '🧹', labelKey: 'create.cleaning' },
  { key: 'cooking', emoji: '🍲', labelKey: 'create.cooking' },
  { key: 'monument', emoji: '⚡', labelKey: 'create.monument' },
  { key: 'fruit', emoji: '💚', labelKey: 'create.fruit' },
]

export default function CreatePostScreen() {
  const { lang, user, setScreen, addPost, setShowConfetti, setLoading, isLoading } = useAppStore()
  const [farmId, setFarmId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('cleaning')
  const [helpersNeeded, setHelpersNeeded] = useState(10)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!farmId.trim()) errs.farmId = lang === 'es' ? 'ID de granja requerido' : 'Farm ID required'
    if (!title.trim() || title.length < 5) errs.title = lang === 'es' ? 'Mínimo 5 caracteres' : 'Min 5 characters'
    if (!message.trim() || message.length < 10) errs.message = lang === 'es' ? 'Mínimo 10 caracteres' : 'Min 10 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) {
      haptic([50, 50, 50])
      return
    }

    haptic([50])
    setLoading(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          farmId: farmId.trim(),
          category,
          helpersNeeded,
          ownerId: user.id,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const post = await res.json()

      haptic([50, 100, 50])
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3500)

      addPost(post)
      setScreen('feed')
    } catch {
      haptic([100])
      setErrors({ title: t('general.error', lang as Lang) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('feed')}
            className="rounded-xl h-9 w-9 p-0 hover:bg-green-100"
          >
            <ArrowLeft className="w-5 h-5 text-green-700" />
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <h1 className="text-sm font-bold text-green-900">
              {t('create.title', lang as Lang)}
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto scrollbar-farm">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5"
        >
          {/* Farm ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-green-800">
              {t('create.farm-id', lang as Lang)}
            </Label>
            <Input
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              placeholder="#789"
              className={`rounded-xl border-green-200 bg-white/90 focus:border-green-400 h-11 ${errors.farmId ? 'border-red-300' : ''}`}
              maxLength={20}
            />
            {errors.farmId && (
              <p className="text-xs text-red-500">{errors.farmId}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-green-800">
              {t('create.post-title', lang as Lang)}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'es' ? '¡Ayuda en mi Cooking Pot Expert!' : 'Help with my Cooking Pot Expert!'}
              className={`rounded-xl border-green-200 bg-white/90 focus:border-green-400 h-11 ${errors.title ? 'border-red-300' : ''}`}
              maxLength={80}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-green-800">
              {t('create.message', lang as Lang)}
            </Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === 'es' ? 'Describe qué necesitas y ofrece reciprocidad...' : 'Describe what you need and offer reciprocity...'}
              className={`w-full min-h-[100px] rounded-xl border ${errors.message ? 'border-red-300' : 'border-green-200'} bg-white/90 focus:border-green-400 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none`}
              maxLength={300}
            />
            <div className="flex justify-between">
              {errors.message && (
                <p className="text-xs text-red-500">{errors.message}</p>
              )}
              <p className="text-[10px] text-green-400 ml-auto">{message.length}/300</p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-green-800">
              {t('create.category', lang as Lang)}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ key, emoji, labelKey }) => (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptic([20])
                    setCategory(key)
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border
                    ${category === key
                      ? 'bg-green-600 text-white border-green-600 shadow-md'
                      : 'bg-white/90 text-green-700 border-green-200 hover:border-green-400'
                    }
                  `}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs leading-tight">
                    {t(labelKey, lang as Lang).split(' ').slice(1).join(' ')}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Helpers Needed Slider */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-green-800">
              {t('create.helpers-needed', lang as Lang)}: <span className="text-yellow-600">{helpersNeeded}</span>
            </Label>
            <Slider
              value={[helpersNeeded]}
              onValueChange={([v]) => setHelpersNeeded(v)}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-green-400">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Preview Card */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
              {lang === 'es' ? 'Vista previa' : 'Preview'}
            </p>
            <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BumpkinAvatar avatarIndex={user?.avatarIndex || 0} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-green-900">{user?.nickname || 'Tu Nick'}</p>
                      <p className="text-[10px] text-green-600">{t('general.farm', lang as Lang)} #{farmId || '...'}</p>
                    </div>
                  </div>
                  <HelperCounter helpersCount={0} helpersNeeded={helpersNeeded} size="sm" showLabel={false} />
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-bold text-green-900">
                    {title || (lang === 'es' ? 'Título del post...' : 'Post title...')}
                  </p>
                  <p className="text-xs text-green-700/70 mt-0.5 line-clamp-2">
                    {message || (lang === 'es' ? 'Descripción...' : 'Description...')}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full badge-cleaning">
                    {CATEGORIES.find(c => c.key === category)?.emoji} {t(CATEGORIES.find(c => c.key === category)?.labelKey || 'create.cleaning', lang as Lang).split(' ').slice(1).join(' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit */}
          <motion.div whileTap={{ scale: 0.97 }} className="pb-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-green-900 text-base font-bold shadow-lg shadow-yellow-400/25 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="animate-pulse">{t('general.loading', lang as Lang)}</span>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t('create.submit', lang as Lang)}
                </>
              )}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  )
}

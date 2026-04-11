'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Edit3, Heart, HandHelping, MessageCircle, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/useAppStore'
import { logout } from '@/components/shared/TelegramGate'
import { t } from '@/lib/i18n'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'
import type { Lang } from '@/lib/i18n'

export default function ProfileScreen() {
  const { user, lang, setUser, setScreen, setTelegramLinked, isTelegramLinked, setShowConfetti } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPlayerId, setEditPlayerId] = useState('')
  const [joinedPosts, setJoinedPosts] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  useEffect(() => {
    // Fetch joined posts count (posts where user is a helper but not owner)
    const fetchJoined = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch('/api/posts?limit=50')
        if (res.ok) {
          const data = await res.json()
          const count = data.posts.filter((p: any) =>
            p.helpers?.some((h: any) => h.userId === user.id)
          ).length
          setJoinedPosts(count)
        }
      } catch {}
      setIsLoading(false)
    }
    fetchJoined()
  }, [user])

  const handleEdit = () => {
    if (!user) return
    setEditNickname(user.nickname)
    setEditPlayerId(user.playerId)
    setIsEditing(true)
    haptic([20])
  }

  const handleSave = async () => {
    if (!user || !editNickname.trim() || !editPlayerId.trim()) return
    haptic([50])
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user.telegramId || `manual_${Date.now()}`,
          nickname: editNickname.trim(),
          playerId: editPlayerId.trim(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUser(updated)
        haptic([50, 100, 50])
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }
    } catch {}
    setIsEditing(false)
  }

  const handleLogout = () => {
    haptic([50])
    logout()
  }

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <SunflowerSpinner />
      </div>
    )
  }

  const stats = [
    {
      icon: HandHelping,
      label: t('profile.helpers-given', lang as Lang),
      value: user.helpersGiven,
      color: 'text-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
    },
    {
      icon: Heart,
      label: t('profile.helpers-received', lang as Lang),
      value: user.helpersReceived,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
    },
    {
      icon: MessageCircle,
      label: t('profile.joined-chats', lang as Lang),
      value: joinedPosts,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen safe-top">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <User className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-bold text-green-900">
            {t('profile.title', lang as Lang)}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-farm px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto pt-5 flex flex-col gap-5"
        >
          {/* Profile Card */}
          <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <BumpkinAvatar
                    avatarIndex={user.avatarIndex}
                    size="lg"
                    showRing
                  />
                </motion.div>

                {/* Info */}
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-green-700">Nickname</Label>
                      <Input
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="rounded-xl border-green-200 h-10 text-sm"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-green-700">Player ID</Label>
                      <Input
                        value={editPlayerId}
                        onChange={(e) => setEditPlayerId(e.target.value)}
                        className="rounded-xl border-green-200 h-10 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        size="sm"
                        className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {t('general.save', lang as Lang)}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-green-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-green-900">{user.nickname}</h2>
                    <p className="text-xs text-green-500 mt-1 font-mono">{user.playerId}</p>
                    {isTelegramLinked && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Telegram {lang === 'es' ? 'vinculado' : 'linked'}
                      </span>
                    )}
                  </div>
                )}

                {/* Edit button */}
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 text-xs font-semibold gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {t('profile.edit', lang as Lang)}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`rounded-2xl border-0 ${stat.bg} shadow-sm`}>
                  <CardContent className="p-3 flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className={`text-xl font-bold ${stat.color}`}>
                      {isLoading ? '...' : stat.value}
                    </span>
                    <span className="text-[10px] font-semibold text-green-600/70 text-center leading-tight">
                      {stat.label}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Achievements / Level */}
          <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏆</span>
                <h3 className="text-sm font-bold text-green-900">
                  {lang === 'es' ? 'Nivel de Helper' : 'Helper Level'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((user.helpersGiven / 50) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-green-500 mt-1">
                    {user.helpersGiven}/50 {lang === 'es' ? 'para siguiente nivel' : 'to next level'}
                  </p>
                </div>
                <div className="text-2xl">
                  {user.helpersGiven >= 50 ? '🌟' : user.helpersGiven >= 20 ? '🌻' : user.helpersGiven >= 5 ? '🌱' : '🥚'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-green-900 mb-3">
                {lang === 'es' ? 'Actividad Reciente' : 'Recent Activity'}
              </h3>
              <div className="space-y-2.5">
                {[
                  { emoji: '🧹', text: lang === 'es' ? 'Limpiaste 2 farms' : 'Cleaned 2 farms', time: '2h' },
                  { emoji: '🍲', text: lang === 'es' ? 'Cheer en Cooking Pot' : 'Cheered Cooking Pot', time: '5h' },
                  { emoji: '💚', text: lang === 'es' ? 'Love Charm enviado' : 'Love Charm sent', time: '1d' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-base">{activity.emoji}</span>
                    <p className="text-xs text-green-700 flex-1">{activity.text}</p>
                    <span className="text-[10px] text-green-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <motion.div whileTap={{ scale: 0.97 }} className="pb-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('profile.logout', lang as Lang)}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

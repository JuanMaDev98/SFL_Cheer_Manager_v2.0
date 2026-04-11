'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Trash2, CheckCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppStore, type FarmPost } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import HelperCounter from '@/components/shared/HelperCounter'
import type { Lang } from '@/lib/i18n'

type Tab = 'active' | 'completed'

export default function MyPostsScreen() {
  const { user, lang, setCurrentPost, setScreen, removePost } = useAppStore()
  const [posts, setPosts] = useState<FarmPost[]>([])
  const [tab, setTab] = useState<Tab>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch('/api/posts?limit=50')
        if (res.ok && !cancelled) {
          const data = await res.json()
          const myPosts = data.posts.filter((p: FarmPost) => p.ownerId === user.id)
          setPosts(myPosts)
        }
      } catch {} finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const handleDelete = async () => {
    if (!deleteId) return
    haptic([50])
    try {
      await fetch(`/api/posts/${deleteId}?userId=${user?.id}`, { method: 'DELETE' })
      removePost(deleteId)
      setPosts((prev) => prev.filter((p) => p.id !== deleteId))
    } catch {}
    setDeleteId(null)
  }

  const filtered = posts.filter((p) =>
    tab === 'active' ? p.isActive : !p.isActive || p.helpersCount >= p.helpersNeeded
  )

  return (
    <div className="flex flex-col min-h-screen safe-top">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-100 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold text-green-900">
              {t('myposts.title', lang as Lang)}
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(['active', 'completed'] as Tab[]).map((tabKey) => (
              <motion.button
                key={tabKey}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptic([20])
                  setTab(tabKey)
                }}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200
                  ${tab === tabKey
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-green-900 shadow-sm'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }
                `}
              >
                {tabKey === 'active' ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {t(`myposts.${tabKey}`, lang as Lang)}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  tab === tabKey ? 'bg-green-900/20 text-green-900' : 'bg-green-200/50 text-green-600'
                }`}>
                  {posts.filter((p) =>
                    tabKey === 'active' ? p.isActive : !p.isActive || p.helpersCount >= p.helpersNeeded
                  ).length}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-farm px-4 pb-24">
        <div className="max-w-md mx-auto pt-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <SunflowerSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <div className="text-5xl">📝</div>
              <p className="text-sm text-green-600 font-medium">
                {t('myposts.empty', lang as Lang)}
              </p>
              <Button
                onClick={() => setScreen('create-post')}
                className="rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold"
              >
                + {t('feed.create', lang as Lang)}
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col gap-3">
                {filtered.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -200 }}
                  >
                    <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm overflow-hidden">
                      <CardContent className="p-4">
                        {/* Post content as a compact card */}
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setCurrentPost(post)
                            setScreen('post-detail')
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <BumpkinAvatar avatarIndex={post.owner?.avatarIndex || 0} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-green-900 truncate">{post.title}</p>
                                <p className="text-[10px] text-green-600">
                                  {t('general.farm', lang as Lang)} #{post.farmId.slice(-6)}
                                </p>
                              </div>
                            </div>
                            <HelperCounter
                              helpersCount={post.helpersCount}
                              helpersNeeded={post.helpersNeeded}
                              size="sm"
                              showLabel={false}
                            />
                          </div>
                          <p className="mt-2 text-xs text-green-700/70 line-clamp-2">{post.message}</p>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-green-100">
                          <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <Users className="w-3 h-3" />
                            <span>{post.helpersCount}/{post.helpersNeeded}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-green-200 text-green-600">
                              {post.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(post.id)}
                            className="rounded-lg h-7 w-7 p-0 hover:bg-red-50 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('detail.remove', lang as Lang)}</DialogTitle>
            <DialogDescription>
              {lang === 'es' ? '¿Estás seguro? Esta acción no se puede deshacer.' : 'Are you sure? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
              {t('general.cancel', lang as Lang)}
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              {t('detail.remove', lang as Lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setScreen('create-post')}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-400/30 flex items-center justify-center text-green-900 font-bold text-2xl"
      >
        +
      </motion.button>
    </div>
  )
}

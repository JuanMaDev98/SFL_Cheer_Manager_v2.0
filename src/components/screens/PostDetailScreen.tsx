'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, UserPlus, PartyPopper, Trash2, Edit3,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { useAppStore, type ChatMessage } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import BumpkinAvatar from '@/components/shared/BumpkinAvatar'
import HelperCounter from '@/components/shared/HelperCounter'
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'
import type { Lang } from '@/lib/i18n'

const categoryConfig: Record<string, { emoji: string; badgeClass: string; labelKey: string }> = {
  cleaning: { emoji: '🧹', badgeClass: 'badge-cleaning', labelKey: 'create.cleaning' },
  cooking: { emoji: '🍲', badgeClass: 'badge-cooking', labelKey: 'create.cooking' },
  monument: { emoji: '⚡', badgeClass: 'badge-monument', labelKey: 'create.monument' },
  fruit: { emoji: '💚', badgeClass: 'badge-fruit', labelKey: 'create.fruit' },
}

const QUICK_EMOJIS = ['🌻', '🧹', '⚡', '💚', '🎉', '🤝', '💪']

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostDetailScreen() {
  const {
    currentPost, setCurrentPost, user, lang, goBack,
    messages, setMessages, addMessage, setShowConfetti,
    addPost, removePost, updatePost,
    setLoading, isLoading,
  } = useAppStore()

  const [chatInput, setChatInput] = useState('')
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [newHelpersNeeded, setNewHelpersNeeded] = useState(10)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const post = currentPost
  const isOwner = post?.ownerId === user?.id
  const hasJoined = post?.helpers?.some((h) => h.userId === user?.id)
  const isFull = post ? post.helpersCount >= post.helpersNeeded : false
  const cat = post ? categoryConfig[post.category] || categoryConfig.cleaning : null

  const haptic = (pattern: number[]) => {
    try { navigator.vibrate?.(pattern) } catch {}
  }

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!post) return
    try {
      const res = await fetch(`/api/posts/${post.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {}
  }, [post, setMessages])

  // Fetch post detail
  const fetchPost = useCallback(async () => {
    if (!post) return
    try {
      const res = await fetch(`/api/posts/${post.id}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentPost(data)
      }
    } catch {}
  }, [post, setCurrentPost])

  useEffect(() => {
    fetchMessages()
    fetchPost()
    intervalRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchMessages, fetchPost])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle join
  const handleJoin = async () => {
    if (!post || !user || hasJoined || isFull) return
    haptic([50])
    setIsJoining(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        haptic([50, 100, 50])
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
        fetchPost()
        fetchMessages()
      }
    } catch {
      haptic([100])
    } finally {
      setIsJoining(false)
    }
  }

  // Handle send cheer
  const handleCheer = () => {
    haptic([50, 100, 50])
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3500)
  }

  // Handle send message
  const handleSendMessage = async (text?: string) => {
    const content = text || chatInput
    if (!content.trim() || !post || !user) return
    haptic([20])
    setIsSending(true)

    try {
      const res = await fetch(`/api/posts/${post.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          nickname: user.nickname,
          content: content.trim(),
        }),
      })
      if (res.ok) {
        const msg = await res.json()
        addMessage(msg)
        setChatInput('')
      }
    } catch {} finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleDelete = async () => {
    if (!post) return
    try {
      await fetch(`/api/posts/${post.id}?userId=${user?.id}`, { method: 'DELETE' })
      removePost(post.id)
      setShowDeleteDialog(false)
      goBack()
    } catch {}
  }

  // Handle update helpers
  const handleUpdateHelpers = async () => {
    if (!post) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, helpersNeeded: newHelpersNeeded }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentPost(data)
        setShowAdminPanel(false)
      }
    } catch {}
  }

  // Handle edit message
  const handleEditMessage = async () => {
    if (!post || !editMessage.trim()) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message: editMessage.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentPost(data)
        setShowEditDialog(false)
      }
    } catch {}
  }

  if (!post) {
    return (
      <div className="flex justify-center py-20">
        <SunflowerSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-green-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="rounded-xl h-9 w-9 p-0 hover:bg-green-100"
          >
            <ArrowLeft className="w-5 h-5 text-green-700" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-green-900 truncate">{post.title}</h1>
            <p className="text-[10px] text-green-500">
              #{post.farmId}
            </p>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="rounded-xl h-9 w-9 p-0 hover:bg-green-100"
            >
              <Edit3 className="w-4 h-4 text-green-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-farm">
        <div className="max-w-md mx-auto px-4 pt-4 pb-24">
          {/* Post info card */}
          <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm mb-4">
            <CardContent className="p-4">
              {/* Owner info */}
              <div className="flex items-center gap-3 mb-3">
                <BumpkinAvatar
                  avatarIndex={post.owner.avatarIndex}
                  nickname={post.owner.nickname}
                  size="md"
                  showRing={isOwner}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-green-900">
                      {post.owner.nickname}
                    </p>
                    {isOwner && (
                      <span className="text-xs">{t('detail.owner-badge', lang as Lang)}</span>
                    )}
                  </div>
                  <p className="text-xs text-green-500">
                    {t('general.farm', lang as Lang)} #{post.farmId}
                  </p>
                </div>
              </div>

              {/* Category badge */}
              {cat && (
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${cat.badgeClass}`}>
                  {cat.emoji} {t(cat.labelKey, lang as Lang)}
                </span>
              )}

              {/* Cooking Pot Badge */}
              {(post.hasBasicCookingPot || post.hasExpertCookingPot || post.hasAdvancedCookingPot) && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-xs font-semibold text-green-700">
                    {lang === 'es' ? 'Cooking Pot activo' : 'Cooking Pot active'}
                  </span>
                  <div className="flex -space-x-1">
                    {post.hasBasicCookingPot && (
                      <img src="/assets/monuments/basic_cooking_pot.webp" alt="Basic" className="w-8 h-8 object-contain" />
                    )}
                    {post.hasExpertCookingPot && (
                      <img src="/assets/monuments/expert_cooking_pot.webp" alt="Expert" className="w-8 h-8 object-contain" />
                    )}
                    {post.hasAdvancedCookingPot && (
                      <img src="/assets/monuments/advanced_cooking_pot.webp" alt="Advanced" className="w-8 h-8 object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <p className="text-sm text-green-800 leading-relaxed mb-4">
                {post.message}
              </p>

              {/* Helper counter */}
              <div className="flex items-center justify-center mb-3">
                <HelperCounter
                  helpersCount={post.helpersCount}
                  helpersNeeded={post.helpersNeeded}
                  size="lg"
                />
              </div>

              {/* Status message */}
              {isFull && (
                <p className="text-center text-sm font-bold text-green-600">
                  {t('detail.full', lang as Lang)}
                </p>
              )}
              {!isFull && post.helpersCount < 3 && (
                <p className="text-center text-sm font-bold text-red-500">
                  {t('detail.urgent', lang as Lang)}
                </p>
              )}

              {/* Helpers list */}
              {post.helpers && post.helpers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-2">
                    {t('detail.helpers-remaining', lang as Lang)} ({post.helpersNeeded - post.helpersCount})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.helpers.map((helper) => (
                      <BumpkinAvatar
                        key={helper.id}
                        avatarIndex={helper.user.avatarIndex}
                        nickname={helper.user.nickname}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex flex-col gap-2">
                {!isOwner && (
                  <Button
                    onClick={handleJoin}
                    disabled={hasJoined || isFull || isJoining}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-md disabled:opacity-60"
                  >
                    {hasJoined ? (
                      <>
                        <PartyPopper className="w-4 h-4 mr-2" />
                        {t('detail.joined', lang as Lang)}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {isJoining ? t('general.loading', lang as Lang) : t('detail.join-btn', lang as Lang)}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleCheer}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-yellow-300 text-yellow-700 hover:bg-yellow-50 font-bold"
                >
                  <PartyPopper className="w-4 h-4 mr-2" />
                  {t('detail.cheer-btn', lang as Lang)}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin panel */}
          <AnimatePresence>
            {showAdminPanel && isOwner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <Card className="rounded-2xl border-yellow-200 bg-yellow-50/80">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <p className="text-xs font-bold text-yellow-800">🔧 Admin Tools</p>
                    <div className="space-y-1">
                      <Label className="text-xs">Helpers needed: {newHelpersNeeded}</Label>
                      <Slider
                        value={[newHelpersNeeded]}
                        onValueChange={([v]) => setNewHelpersNeeded(v)}
                        min={1}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      {isOwner && (
                        <>
                          <Button
                            size="sm"
                            onClick={handleUpdateHelpers}
                            className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-yellow-900 text-xs font-bold"
                          >
                            {t('detail.update', lang as Lang)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditMessage(post.message)
                              setShowEditDialog(true)
                            }}
                            variant="outline"
                            className="rounded-xl border-yellow-300 text-yellow-700 text-xs font-bold"
                          >
                            {t('detail.edit-msg', lang as Lang)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            variant="outline"
                            className="rounded-xl border-red-300 text-red-600 text-xs font-bold ml-auto"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {t('detail.remove', lang as Lang)}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat section */}
          <Card className="rounded-2xl border-green-200 bg-white/90 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-green-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-900">
                  Chat
                </span>
                <span className="text-[10px] text-green-500">({messages.length})</span>
              </div>

              {/* Messages */}
              <div className="max-h-72 overflow-y-auto scrollbar-farm p-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-green-400 py-6">
                    No messages yet. Be the first! 🌻
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.userId === user?.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 ${
                            isMine ? 'bubble-mine' : 'bubble-other'
                          }`}
                        >
                          {!isMine && (
                            <p className="text-[10px] font-bold opacity-70 mb-0.5">
                              {msg.nickname}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-[9px] opacity-50 mt-0.5 text-right">
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick emojis */}
              <div className="px-3 py-1.5 border-t border-green-50 flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendMessage(emoji)}
                    className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center text-sm transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-green-100 flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={t('detail.type-msg', lang as Lang)}
                  className="flex-1 rounded-xl border-green-200 bg-green-50/50 h-10 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isSending}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white h-10 w-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('detail.remove', lang as Lang)}</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              {t('general.cancel', lang as Lang)}
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              {t('detail.remove', lang as Lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit message dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('detail.edit-msg', lang as Lang)}</DialogTitle>
          </DialogHeader>
          <textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className="w-full min-h-[100px] rounded-xl border border-green-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              {t('general.cancel', lang as Lang)}
            </Button>
            <Button onClick={handleEditMessage} className="rounded-xl bg-green-600 hover:bg-green-700">
              {t('general.save', lang as Lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}




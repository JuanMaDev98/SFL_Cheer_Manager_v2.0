'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Clock, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, type FarmPost } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import BumpkinAvatar from './BumpkinAvatar'
import HelperCounter from './HelperCounter'
import { categoryConfig } from '@/lib/categoryConfig'
import type { Lang } from '@/lib/i18n'

function timeAgo(dateStr: string, lang: Lang): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return lang === 'es' ? 'ahora' : 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

interface PostCardProps {
  post: FarmPost
  compact?: boolean
}

const PostCardInner = function PostCardInner({ post, compact = false }: PostCardProps) {
  const { setCurrentPost, setScreen, lang } = useAppStore()
  const cat = categoryConfig[post.category] || categoryConfig['help-x-help']

  const handleOpen = () => {
    setCurrentPost(post)
    setScreen('post-detail')
  }

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPost(post)
    setScreen('post-detail')
  }

  return (
    <Card
      className="rounded-2xl border-green-200 bg-white/90 backdrop-blur-sm shadow-sm cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-md active:shadow-sm active:scale-[0.99] active:opacity-90"
      onClick={handleOpen}
    >
      <CardContent className="p-4">
        {/* Top row: avatar + info + counter */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <BumpkinAvatar
              avatarIndex={post.owner.avatarIndex}
              nickname={!compact ? post.owner.nickname : undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-900 truncate">
                {post.owner.nickname}
              </p>
              <p className="text-[10px] text-green-600">
                {t('general.farm', lang as Lang)} #{post.farmId}
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

        {/* Title + category + cooking pot badge */}
        <div className="mt-3 flex items-start gap-2">
          <h3 className="text-base font-bold text-green-900 leading-tight flex-1">
            {post.title}
          </h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cat.badgeClass}`}>
            {cat.emoji} {compact ? post.category : t(cat.labelKey, lang as Lang)} {cat.secondEmoji || cat.emoji}
          </span>
        </div>

        {/* Cooking Pot Badge */}
        {post.hasCookingPot && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs">🍳</span>
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              {post.cookingPotType || 'Cooking Pot'}
            </span>
            <span className="text-[10px] text-orange-500">
              ({lang === 'es' ? 'puede dar comida' : 'can give food'})
            </span>
          </div>
        )}

        {/* Message preview */}
        {!compact && (
          <p className="mt-1.5 text-sm text-green-700/80 line-clamp-2 leading-relaxed">
            {post.message}
          </p>
        )}

        {/* Bottom row: time + join button */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(post.createdAt, lang as Lang)}</span>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 h-7 gap-1"
            onClick={handleJoin}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t('feed.join', lang as Lang)}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize to prevent re-renders when parent re-renders with same props
const PostCard = memo(PostCardInner)
export default PostCard


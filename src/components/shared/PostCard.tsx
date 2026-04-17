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

  const hasCookingPot = (post.hasBasicCookingPot || post.hasExpertCookingPot || post.hasAdvancedCookingPot) && post.category !== 'cheer-x-cheer'

  return (
    <Card
      className="rounded-xl border-green-200 bg-white/90 backdrop-blur-sm shadow-sm cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-md active:shadow-sm active:scale-[0.99] active:opacity-90"
      onClick={handleOpen}
    >
      <CardContent className="p-3 gap-2 flex flex-col">
        {/* Top row: avatar + nickname + farmId + counter + badges */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: avatar + name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <BumpkinAvatar
              avatarIndex={post.owner.avatarIndex}
              size="xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-bold text-green-900 truncate">
                  {post.owner.nickname}
                </span>
                <span className="text-[10px] text-green-500">
                  #{post.farmId}
                </span>
                {/* Category badge — show both emojis only for combo category (help-and-cheer) */}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.badgeClass}`}>
                  {cat.emoji}{cat.secondEmoji && post.category === 'help-and-cheer' ? ` ${cat.secondEmoji}` : ''}
                </span>
                {/* Cooking pot icons — with colored badge background */}
                {hasCookingPot && (
                  <div className="flex items-center gap-0.5">
                    {post.hasBasicCookingPot && (
                      <span className="bg-yellow-50 rounded-full p-0.5" title="Basic Cooking Pot">
                        <img src="/assets/monuments/basic_cooking_pot.webp" alt="" className="w-4 h-4 object-contain" />
                      </span>
                    )}
                    {post.hasExpertCookingPot && (
                      <span className="bg-orange-50 rounded-full p-0.5" title="Expert Cooking Pot">
                        <img src="/assets/monuments/expert_cooking_pot.webp" alt="" className="w-4 h-4 object-contain" />
                      </span>
                    )}
                    {post.hasAdvancedCookingPot && (
                      <span className="bg-red-50 rounded-full p-0.5" title="Advanced Cooking Pot">
                        <img src="/assets/monuments/advanced_cooking_pot.webp" alt="" className="w-4 h-4 object-contain" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: helper counter */}
          <HelperCounter
            helpersCount={post.helpersCount}
            helpersNeeded={post.helpersNeeded}
            size="sm"
            showLabel={false}
          />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-green-900 leading-tight line-clamp-2">
          {post.title}
        </h3>

        {/* Message preview — only if not compact */}
        {!compact && post.message && (
          <p className="text-xs text-green-700/70 line-clamp-1 leading-relaxed">
            {post.message}
          </p>
        )}

        {/* Bottom row: time + join */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1 text-[10px] text-green-400">
            <Clock className="w-2.5 h-2.5" />
            <span>{timeAgo(post.createdAt, lang as Lang)}</span>
          </div>
          <Button
            size="sm"
            className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold px-2 py-1 h-6 gap-1"
            onClick={handleJoin}
          >
            <MessageCircle className="w-2.5 h-2.5" />
            {t('feed.join', lang as Lang)}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const PostCard = memo(PostCardInner)
export default PostCard

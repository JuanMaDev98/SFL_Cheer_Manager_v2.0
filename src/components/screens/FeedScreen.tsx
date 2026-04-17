'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore, type PostFilter } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import PostCard from '@/components/shared/PostCard'
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'
import LanguageToggle from '@/components/shared/LanguageToggle'
import type { Lang } from '@/lib/i18n'

const filters: { key: PostFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'feed.all' },
  { key: 'urgent', labelKey: 'feed.urgent' },
  { key: 'almost-full', labelKey: 'feed.almost-full' },
  { key: 'cooking', labelKey: 'feed.cooking' },
]

export default function FeedScreen() {
  const { posts, setPosts, filter, setFilter, lang, setScreen, isLoading, setLoading, setTotalPosts } = useAppStore()
  const [page, setPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Stable fetch that reads posts from ref to avoid dep loops
  const postsRef = useRef(posts)
  postsRef.current = posts

  const fetchPosts = useCallback(async (pageNum: number = 1, currentFilter: PostFilter = 'all', append: boolean = false) => {
    try {
      const res = await fetch(`/api/posts?filter=${currentFilter}&page=${pageNum}&limit=10`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      if (append) {
        setPosts([...postsRef.current, ...data.posts])
      } else {
        setPosts(data.posts)
      }
      setTotalPosts(data.total)
      setHasMore(data.posts.length >= 10 && pageNum < Math.ceil(data.total / 10))
      return true
    } catch {
      return false
    }
  }, [setPosts, setTotalPosts])

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setPage(1)
      await fetchPosts(1, filter, false)
      if (!cancelled) {
        setLoading(false)
        setInitialized(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [filter, fetchPosts, setLoading])

  // Auto-refresh every 30s (silent, no loading state)
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      await fetchPosts(1, filter, false)
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [filter, fetchPosts])

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 150 && hasMore && !isLoading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage, filter, true)
    }
  }, [page, hasMore, isLoading, filter, fetchPosts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setPage(1)
    await fetchPosts(1, filter, false)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-100 px-4 pt-3 pb-2">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              <h1 className="text-lg font-bold text-green-900">
                {t('feed.title', lang as Lang)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="rounded-lg h-8 w-8 p-0 hover:bg-green-100"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filters.map(({ key, labelKey }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(key)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                  ${filter === key
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-green-900 shadow-sm'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }
                `}
              >
                {t(labelKey, lang as Lang)}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-farm px-4 pb-24"
      >
        <div className="max-w-md mx-auto pt-3">
          {/* First load: show spinner */}
          {!initialized && (
            <div className="flex justify-center py-16">
              <SunflowerSpinner />
            </div>
          )}

          {/* Empty state */}
          {initialized && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="text-5xl">🌻</div>
              <p className="text-sm text-green-600 font-medium">
                {t('feed.no-posts', lang as Lang)}
              </p>
            </div>
          )}

          {/* Posts list — plain div, no AnimatePresence */}
          {initialized && posts.length > 0 && (
            <div className="flex flex-col gap-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Load more indicator */}
          {hasMore && posts.length > 0 && (
            <div className="flex justify-center py-6">
              <SunflowerSpinner size="sm" />
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-green-400 py-6">
              — {posts.length} posts —
            </p>
          )}
        </div>
      </div>

      {/* FAB - Create Post */}
      {initialized && (
        <motion.div
          className="fixed bottom-20 right-4 z-30 max-w-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
        >
          <Button
            onClick={() => setScreen('create-post')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-green-900 shadow-lg shadow-yellow-400/30 transition-all duration-200"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}

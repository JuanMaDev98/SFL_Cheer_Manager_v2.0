'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import type { Lang } from '@/lib/i18n'

interface AdData {
  id: string
  textEs: string
  textEn: string
  link: string
}

interface AdBannerProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export default function AdBanner({ scrollRef, className = '' }: AdBannerProps) {
  const { lang } = useAppStore()
  const [isVisible, setIsVisible] = useState(true)
  const [isHidden, setIsHidden] = useState(false)
  const [currentAd, setCurrentAd] = useState<AdData | null>(null)
  const lastScrollY = useRef(0)

  // Load random ad on mount
  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await fetch('/ads/list.json')
        if (!res.ok) return
        const { ads } = await res.json()
        if (ads && ads.length > 0) {
          const randomAd = ads[Math.floor(Math.random() * ads.length)]
          setCurrentAd(randomAd)
        }
      } catch {
        // Silently fail - banner stays hidden
      }
    }
    loadAd()
  }, [])

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentY = scrollRef?.current
        ? scrollRef.current.scrollTop
        : window.scrollY
      const scrollingDown = currentY > lastScrollY.current
      lastScrollY.current = currentY

      if (scrollingDown && currentY > 60 && !isHidden) {
        setIsVisible(false)
      }
      if (!scrollingDown && currentY < 20 && !isVisible && !isHidden) {
        setIsVisible(true)
      }
    }

    const el = scrollRef?.current
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true })
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll)
      } else {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isVisible, isHidden, scrollRef])

  const handleAdClick = () => {
    if (currentAd?.link) {
      window.open(currentAd.link, '_blank')
    }
  }

  if (isHidden || !currentAd) return null

  const adText = lang === 'es' ? currentAd.textEs : currentAd.textEn

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`overflow-hidden bg-gradient-to-r from-yellow-100 to-yellow-50 border-b border-yellow-200 ${className}`}
        >
          <div
            className="relative max-w-md mx-auto px-4 py-2 cursor-pointer"
            onClick={handleAdClick}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsHidden(true)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-yellow-200/60 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5 text-yellow-600" />
            </button>

            {/* Ad content - clickable */}
            <div className="flex items-center justify-center gap-2 py-1 pr-8">
              <div className="bg-yellow-200/60 rounded px-4 py-1.5 text-center">
                <span className="text-xs text-yellow-800 font-medium">
                  {adText}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

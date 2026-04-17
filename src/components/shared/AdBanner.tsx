'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type AdData } from '@/store/useAppStore'

interface AdBannerProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export default function AdBanner({ scrollRef, className = '' }: AdBannerProps) {
  const { lang, currentAd, setCurrentAd, isAdHidden, setAdHidden } = useAppStore()
  const lastScrollY = useRef(0)
  const hasLoadedAd = useRef(false)

  // Load ad only once when component mounts and there's no ad yet
  useEffect(() => {
    if (hasLoadedAd.current) return
    hasLoadedAd.current = true

    if (!currentAd) {
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
          // Silently fail
        }
      }
      loadAd()
    }
  }, [currentAd, setCurrentAd])

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentY = scrollRef?.current
        ? scrollRef.current.scrollTop
        : window.scrollY
      const scrollingDown = currentY > lastScrollY.current
      lastScrollY.current = currentY
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
  }, [scrollRef])

  const handleAdClick = () => {
    if (currentAd?.link) {
      window.open(currentAd.link, '_blank')
    }
  }

  if (isAdHidden || !currentAd) return null

  const adText = lang === 'es' ? currentAd.textEs : currentAd.textEn
  const buttonText = lang === 'es' ? currentAd.buttonTextEs : currentAd.buttonTextEn

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`overflow-hidden bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200 ${className}`}
      >
        <div className="relative max-w-sm mx-auto px-3 py-2">
          {/* Close button */}
          <button
            onClick={() => setAdHidden(true)}
            className="absolute right-1 top-1 p-1 rounded-full hover:bg-yellow-200/60 transition-colors z-10"
          >
            <X className="w-3 h-3 text-yellow-600" />
          </button>

          {/* Ad text */}
          <p className="text-xs text-yellow-800 font-medium text-center mb-2 pr-5">
            {adText}
          </p>

          {/* Button */}
          <button
            onClick={handleAdClick}
            className="w-full py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
            style={{ backgroundColor: currentAd.buttonColor }}
          >
            {buttonText}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

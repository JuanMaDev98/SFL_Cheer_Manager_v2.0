'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

interface AdData {
  id: string
  textEs: string
  textEn: string
  buttonTextEs: string
  buttonTextEn: string
  buttonColor: string
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
        // Silently fail
      }
    }
    loadAd()
  }, [])

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
  const buttonText = lang === 'es' ? currentAd.buttonTextEs : currentAd.buttonTextEn

  return (
    <AnimatePresence>
      {isVisible && (
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
              onClick={() => setIsHidden(true)}
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
      )}
    </AnimatePresence>
  )
}

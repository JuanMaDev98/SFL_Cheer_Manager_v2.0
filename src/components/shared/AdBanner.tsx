'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdBannerProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export default function AdBanner({ scrollRef, className = '' }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const scrollElement = scrollRef?.current ?? window

    const handleScroll = () => {
      const currentY = scrollRef?.current
        ? scrollRef.current.scrollTop
        : window.scrollY
      const scrollingDown = currentY > lastScrollY.current
      lastScrollY.current = currentY

      // Hide when scrolling down past banner
      if (scrollingDown && currentY > 60 && !isHidden) {
        setIsVisible(false)
      }
      // Show when scrolling back to top
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

  if (isHidden) return null

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
          <div className="relative max-w-md mx-auto px-4 py-2">
            {/* Close button */}
            <button
              onClick={() => setIsHidden(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-yellow-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-yellow-600" />
            </button>

            {/* Banner content placeholder */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="bg-yellow-200/60 rounded px-4 py-1.5 text-center">
                <span className="text-xs text-yellow-800 font-medium">
                  📢 Tu anuncio aquí — contacta para publicar
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

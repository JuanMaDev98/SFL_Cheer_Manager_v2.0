'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdBannerProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export default function AdBanner({ scrollRef, className = '' }: AdBannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
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

      // Collapse when scrolling down past banner height
      if (scrollingDown && currentY > 80 && !isCollapsed) {
        setIsCollapsed(true)
      }
      // Expand when scrolling up
      if (!scrollingDown && currentY < 40 && isCollapsed) {
        setIsCollapsed(false)
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
  }, [isCollapsed, scrollRef])

  if (isHidden) return null

  return (
    <AnimatePresence initial={false}>
      {!isCollapsed ? (
        // Full banner
        <motion.div
          key="full"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`overflow-hidden bg-gradient-to-r from-yellow-100 to-yellow-50 border-b border-yellow-200 ${className}`}
        >
          <div className="relative max-w-md mx-auto px-4 py-2">
            {/* Collapse button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-yellow-200/60 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5 text-yellow-600" />
            </button>

            {/* Close button */}
            <button
              onClick={() => setIsHidden(true)}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-yellow-200/60 transition-colors"
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
      ) : (
        // Collapsed mini bar
        <motion.div
          key="collapsed"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`sticky top-0 z-40 bg-gradient-to-r from-yellow-100 to-yellow-50 border-b border-yellow-200 ${className}`}
        >
          <div className="max-w-md mx-auto px-4 py-1.5">
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1.5 w-full justify-center"
            >
              <div className="bg-yellow-200/60 rounded px-3 py-0.5">
                <span className="text-xs text-yellow-800 font-medium">📢 Anuncio</span>
              </div>
              <ChevronDown className="w-3 h-3 text-yellow-600" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

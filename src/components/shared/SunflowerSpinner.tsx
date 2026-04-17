'use client'

import { useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'

interface SunflowerSpinnerProps {
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SunflowerSpinner({ loadingText, size = 'md' }: SunflowerSpinnerProps) {
  const lang = useAppStore((s) => s.lang)
  const rendered = useRef(false)

  // Guard against React StrictMode double-render
  if (rendered.current) return null
  rendered.current = true

  const sizeMap = {
    sm: { img: 40, text: 'text-xs' },
    md: { img: 56, text: 'text-sm' },
    lg: { img: 80, text: 'text-base' },
  }

  const { img, text } = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* 3 dancing girls aligned horizontally */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <img
            key={i}
            src="/assets/loading-gifs/dancing_girl.gif"
            alt=""
            width={img}
            height={img}
            className="object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
      </div>
      {loadingText ? (
        <p className={`${text} font-medium text-green-700 animate-pulse`}>
          {loadingText}
        </p>
      ) : (
        <p className={`${text} font-medium text-green-700 animate-pulse`}>
          {t('general.loading', lang)}
        </p>
      )}
    </div>
  )
}

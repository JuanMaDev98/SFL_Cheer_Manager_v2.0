'use client'

import Image from 'next/image'
import { t } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'

interface SunflowerSpinnerProps {
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SunflowerSpinner({ loadingText, size = 'md' }: SunflowerSpinnerProps) {
  const lang = useAppStore((s) => s.lang)

  const sizeMap = {
    sm: { img: 48, text: 'text-xs' },
    md: { img: 80, text: 'text-sm' },
    lg: { img: 120, text: 'text-base' },
  }

  const { img, text } = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="animate-sunflower-spin">
          <Image
            src="/assets/sunflower-logo.png"
            alt="Sunflower"
            width={img}
            height={img}
            className="drop-shadow-lg"
          />
        </div>
        <div className="absolute inset-0 animate-sunflower-pulse">
          <div
            className="rounded-full bg-yellow-300/20 blur-xl"
            style={{ width: img, height: img }}
          />
        </div>
      </div>
      {loadingText && (
        <p className={`${text} font-medium text-green-700 animate-pulse`}>
          {loadingText}
        </p>
      )}
      {!loadingText && (
        <p className={`${text} font-medium text-green-700 animate-pulse`}>
          {t('general.loading', lang)}
        </p>
      )}
    </div>
  )
}

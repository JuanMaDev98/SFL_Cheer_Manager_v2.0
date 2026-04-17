'use client'

import { Globe } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Lang } from '@/lib/i18n'

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useAppStore()

  const handleClick = () => {
    const newLang = lang === 'es' ? 'en' : 'es'
    setLang(newLang)
    // Force re-render for Telegram webview
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-telegram-redirect]').forEach(el => {
        (el as HTMLElement).style.display = 'none'
        requestAnimationFrame(() => { (el as HTMLElement).style.display = '' })
      })
    })
  }

  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-colors active:scale-95 ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === 'es' ? 'EN' : 'ES'}
    </button>
  )
}

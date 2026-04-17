'use client'

import { Globe } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useAppStore()

  const handleLang = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLang(lang === 'es' ? 'en' : 'es')
  }

  return (
    <button
      type="button"
      onClick={handleLang}
      onTouchEnd={handleLang}
      style={{ touchAction: 'manipulation' }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 active:scale-95 transition-all ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === 'es' ? 'EN' : 'ES'}
    </button>
  )
}

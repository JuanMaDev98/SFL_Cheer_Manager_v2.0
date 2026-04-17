'use client'

import { Home, FileText, User } from 'lucide-react'
import { useAppStore, type Screen } from '@/store/useAppStore'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

const tabs: { screen: Screen; icon: typeof Home; labelKey: string }[] = [
  { screen: 'feed', icon: Home, labelKey: 'nav.home' },
  { screen: 'my-posts', icon: FileText, labelKey: 'nav.my-posts' },
  { screen: 'profile', icon: User, labelKey: 'nav.profile' },
]

export default function BottomNav() {
  const { screen, setScreen, lang } = useAppStore()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-auto max-w-md">
        <div className="flex items-end justify-between px-2 pb-1 pt-2">
          {/* Spacer to balance layout */}
          <div className="w-12" />
          <div className="flex items-center gap-1 rounded-2xl bg-white/90 backdrop-blur-md border border-green-200 px-3 py-1.5 shadow-lg">
            {tabs.map(({ screen: tabScreen, icon: Icon, labelKey }) => {
              const isActive = screen === tabScreen
              return (
                <button
                  key={tabScreen}
                  onClick={() => setScreen(tabScreen)}
                  className={`
                    flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-t from-yellow-400 to-yellow-300 shadow-md scale-105'
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-green-900' : ''}`}
                  />
                  <span
                    className={`text-[10px] font-semibold ${
                      isActive ? 'text-green-900' : 'text-green-600'
                    }`}
                  >
                    {t(labelKey, lang as Lang)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Spacer to balance layout */}
          <div className="w-12" />
        </div>
      </div>
    </div>
  )
}

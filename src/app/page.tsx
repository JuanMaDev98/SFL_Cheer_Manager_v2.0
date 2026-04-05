'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import FarmBackground from '@/components/shared/FarmBackground'
import BottomNav from '@/components/shared/BottomNav'
import ConfettiEffect from '@/components/shared/ConfettiEffect'
import LinkTelegramScreen from '@/components/screens/LinkTelegramScreen'
import RegisterScreen from '@/components/screens/RegisterScreen'
import FeedScreen from '@/components/screens/FeedScreen'
import PostDetailScreen from '@/components/screens/PostDetailScreen'
import CreatePostScreen from '@/components/screens/CreatePostScreen'
import MyPostsScreen from '@/components/screens/MyPostsScreen'
import ProfileScreen from '@/components/screens/ProfileScreen'

const NAV_SCREENS = ['feed', 'my-posts', 'profile', 'post-detail'] as const

export default function SunflowerApp() {
  const { screen, user, showConfetti, setShowConfetti, setUser, setTelegramLinked, setScreen } = useAppStore()

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sunflower_user')
      const linked = localStorage.getItem('sunflower_telegram')
      if (saved) {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        setScreen('feed')
      }
      if (linked === 'true') {
        setTelegramLinked(true)
      }
    } catch {
      // Ignore parse errors
    }
  }, [setUser, setTelegramLinked, setScreen])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('sunflower_user', JSON.stringify(user))
    }
  }, [user])

  const showNav = NAV_SCREENS.includes(screen as any)

  const renderScreen = () => {
    switch (screen) {
      case 'link-telegram':
        return <LinkTelegramScreen />
      case 'register':
        return <RegisterScreen />
      case 'feed':
        return <FeedScreen />
      case 'post-detail':
        return <PostDetailScreen />
      case 'create-post':
        return <CreatePostScreen />
      case 'my-posts':
        return <MyPostsScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <FeedScreen />
    }
  }

  return (
    <FarmBackground>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav />}

      <ConfettiEffect
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </FarmBackground>
  )
}

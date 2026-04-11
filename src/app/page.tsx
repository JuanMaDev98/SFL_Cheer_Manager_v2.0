'use client'

import { useEffect, useState } from 'react'
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
import SunflowerSpinner from '@/components/shared/SunflowerSpinner'

const NAV_SCREENS = ['feed', 'my-posts', 'profile', 'post-detail'] as const

export default function SunflowerApp() {
  const { screen, user, showConfetti, setShowConfetti, setUser, setScreen, needsLogout } = useAppStore()
  const [isRestoring, setIsRestoring] = useState(true)

  // Restore session on mount — fast, no API call
  useEffect(() => {
    function restore() {
      // If needsLogout flag is set, go to register
      if (needsLogout) {
        setScreen('register')
        setIsRestoring(false)
        return
      }

      // Try to restore from localStorage
      const saved = localStorage.getItem('sunflower_user')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.playerId) {
            setUser(parsed)
            setScreen('feed')
            setIsRestoring(false)
            return
          }
        } catch {
          // corrupted data, ignore
        }
      }

      // No session — go to register
      setScreen('register')
      setIsRestoring(false)
    }

    // Small delay to let Zustand persist hydrate
    const timer = setTimeout(restore, 50)
    return () => clearTimeout(timer)
  }, [needsLogout, setUser, setScreen])

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

  if (isRestoring) {
    return (
      <FarmBackground>
        <div className="flex items-center justify-center min-h-screen">
          <SunflowerSpinner size="lg" />
        </div>
      </FarmBackground>
    )
  }

  return (
    <FarmBackground>
      {renderScreen()}

      {showNav && <BottomNav />}

      <ConfettiEffect
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </FarmBackground>
  )
}
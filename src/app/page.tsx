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
  const { screen, showConfetti, setShowConfetti } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Show spinner only on first mount before hydration
  if (!mounted) {
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
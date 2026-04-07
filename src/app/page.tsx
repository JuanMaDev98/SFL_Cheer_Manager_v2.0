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
  const { screen, user, showConfetti, setShowConfetti, setUser, setTelegramLinked, setScreen } = useAppStore()
  const [isRestoring, setIsRestoring] = useState(true)

  // Restore session on mount — auto-login if playerId is saved
  useEffect(() => {
    async function restoreSession() {
      try {
        const saved = localStorage.getItem('sunflower_user')
        const linked = localStorage.getItem('sunflower_telegram')

        if (saved) {
          const parsed = JSON.parse(saved)

          // Silently re-validate user exists in DB by playerId
          if (parsed.playerId) {
            const res = await fetch(`/api/users?playerId=${parsed.playerId}`)
            if (res.ok) {
              const dbUser = await res.json()
              if (dbUser && dbUser.id) {
                setUser(parsed)
                setScreen('feed')
                if (linked === 'true') setTelegramLinked(true)
                setIsRestoring(false)
                return
              }
            }
          }
        }

        // No valid session — go to register
        setScreen('register')
      } catch {
        setScreen('register')
      } finally {
        setIsRestoring(false)
      }
    }

    restoreSession()
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

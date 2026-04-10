import { create } from 'zustand'

export type Screen = 'link-telegram' | 'register' | 'feed' | 'post-detail' | 'create-post' | 'my-posts' | 'profile'
export type PostFilter = 'all' | 'urgent' | 'almost-full' | 'cooking'
export type Lang = 'es' | 'en'

export interface PostHelper {
  id: string
  userId: string
  postId: string
  status: string
  createdAt: string
  user: {
    id: string
    nickname: string
    avatarIndex: number
  }
}

export interface ChatMessage {
  id: string
  postId: string
  userId: string
  nickname: string
  content: string
  createdAt: string
}

export interface FarmPost {
  id: string
  title: string
  message: string
  farmId: string
  category: string
  helpersNeeded: number
  helpersCount: number
  isActive: boolean
  ownerId: string
  owner: {
    id: string
    nickname: string
    avatarIndex: number
  }
  helpers?: PostHelper[]
  chatMessages?: ChatMessage[]
  _count?: {
    helpers: number
    chatMessages: number
  }
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  telegramId?: string
  nickname: string
  playerId: string
  avatarIndex: number
  helpersGiven: number
  helpersReceived: number
}

interface AppState {
  // Navigation
  screen: Screen
  previousScreen: Screen | null
  setScreen: (screen: Screen) => void
  goBack: () => void

  // User
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  telegramUser: { id: number; first_name: string; username?: string } | null
  setTelegramUser: (user: { id: number; first_name: string; username?: string } | null) => void
  isTelegramLinked: boolean
  setTelegramLinked: (linked: boolean) => void

  // Posts
  posts: FarmPost[]
  currentPost: FarmPost | null
  filter: PostFilter
  setPosts: (posts: FarmPost[]) => void
  setCurrentPost: (post: FarmPost | null) => void
  setFilter: (filter: PostFilter) => void
  addPost: (post: FarmPost) => void
  removePost: (id: string) => void
  updatePost: (id: string, data: Partial<FarmPost>) => void

  // Chat
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void

  // UI State
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  showConfetti: boolean
  setShowConfetti: (show: boolean) => void

  // Language
  lang: Lang
  setLang: (lang: Lang) => void

  // Total count for pagination
  totalPosts: number
  setTotalPosts: (total: number) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  screen: 'link-telegram',
  previousScreen: null,
  setScreen: (screen) => set({ previousScreen: get().screen, screen }),
  goBack: () => {
    const prev = get().previousScreen
    if (prev) set({ screen: prev, previousScreen: null })
    else set({ screen: 'feed' })
  },

  // User
  user: null,
  setUser: (user) => set({ user }),
  telegramUser: null,
  setTelegramUser: (user) => set({ telegramUser: user }),
  isTelegramLinked: false,
  setTelegramLinked: (linked) => set({ isTelegramLinked: linked }),

  // Posts
  posts: [],
  currentPost: null,
  filter: 'all',
  setPosts: (posts) => set({ posts }),
  setCurrentPost: (post) => set({ currentPost: post }),
  setFilter: (filter) => set({ filter }),
  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  removePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
  updatePost: (id, data) =>
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
      currentPost: s.currentPost?.id === id ? { ...s.currentPost, ...data } : s.currentPost,
    })),

  // Chat
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  // UI State
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  showConfetti: false,
  setShowConfetti: (show) => set({ showConfetti: show }),

  // Language
  lang: 'es',
  setLang: (lang) => set({ lang }),

  // Total count
  totalPosts: 0,
  setTotalPosts: (total) => set({ totalPosts: total }),
}))

'use client'

const EMOJIS = ['🌻', '🧑‍🌾', '🐣', '🌾', '🎃', '🌻']
const BG_COLORS = [
  'bg-yellow-400',
  'bg-green-500',
  'bg-amber-400',
  'bg-lime-500',
  'bg-orange-400',
  'bg-emerald-500',
]

interface BumpkinAvatarProps {
  avatarIndex?: number
  nickname?: string
  size?: 'sm' | 'md' | 'lg'
  showRing?: boolean
}

export default function BumpkinAvatar({
  avatarIndex = 0,
  nickname,
  size = 'md',
  showRing = false,
}: BumpkinAvatarProps) {
  const idx = avatarIndex % 6
  const emoji = EMOJIS[idx]
  const bgColor = BG_COLORS[idx]

  const sizeMap = {
    sm: { container: 'w-8 h-8 text-base', ring: 'ring-2 ring-green-400', nick: 'text-[10px]' },
    md: { container: 'w-12 h-12 text-xl', ring: 'ring-2 ring-green-400', nick: 'text-xs' },
    lg: { container: 'w-20 h-20 text-3xl', ring: 'ring-3 ring-green-400', nick: 'text-sm' },
  }

  const { container, ring, nick } = sizeMap[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          ${container} ${bgColor} ${showRing ? ring : ''}
          rounded-full flex items-center justify-center
          shadow-md select-none
          transition-transform duration-200 hover:scale-110
        `}
      >
        <span className="drop-shadow-sm">{emoji}</span>
      </div>
      {nickname && (
        <span className={`${nick} font-semibold text-green-800 text-center max-w-[80px] truncate`}>
          {nickname}
        </span>
      )}
    </div>
  )
}

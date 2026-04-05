'use client'

interface HelperCounterProps {
  helpersCount: number
  helpersNeeded: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function HelperCounter({
  helpersCount,
  helpersNeeded,
  size = 'md',
  showLabel = true,
}: HelperCounterProps) {
  const percentage = helpersNeeded > 0 ? (helpersCount / helpersNeeded) * 100 : 0
  const isFull = helpersCount >= helpersNeeded
  const isUrgent = percentage > 0 && percentage < 30
  const isAlmostFull = percentage >= 70

  const color = isFull
    ? '#22c55e'
    : isAlmostFull
      ? '#22c55e'
      : isUrgent
        ? '#ef4444'
        : '#eab308'

  const sizeMap = {
    sm: { svg: 44, stroke: 4, text: 'text-xs' },
    md: { svg: 64, stroke: 5, text: 'text-sm' },
    lg: { svg: 100, stroke: 7, text: 'text-xl' },
  }

  const { svg, stroke, text } = sizeMap[size]
  const radius = (svg - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${isUrgent && !isFull ? 'animate-bounce-soft' : ''}`}>
        <svg width={svg} height={svg} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={svg / 2}
            cy={svg / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={svg / 2}
            cy={svg / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="progress-circle-transition"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${text} font-bold`} style={{ color }}>
            {helpersCount}
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-gray-500">
              /{helpersNeeded}
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          {isFull ? (
            <span className="text-xs font-semibold text-green-600">🎉 ¡Completo!</span>
          ) : isUrgent ? (
            <span className="text-xs font-semibold text-red-500">🔥 ¡Urgente!</span>
          ) : isAlmostFull ? (
            <span className="text-xs font-semibold text-yellow-600">⏳ Casi lleno</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

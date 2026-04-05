'use client'

import Image from 'next/image'

export default function FarmBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-green-50 via-green-100/80 to-green-50" />

      {/* Farm pattern overlay */}
      <div className="fixed inset-0 farm-pattern" />

      {/* Background image with low opacity */}
      <div className="fixed inset-0">
        <Image
          src="/assets/farm-bg.png"
          alt=""
          fill
          className="object-cover opacity-[0.04]"
          priority
        />
      </div>

      {/* Gradient overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/70" />

      {/* Floating sunflower decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] right-[5%] text-4xl opacity-10 animate-float" style={{ animationDelay: '0s' }}>
          🌻
        </div>
        <div className="absolute top-[25%] left-[3%] text-3xl opacity-[0.08] animate-float" style={{ animationDelay: '1s' }}>
          🌾
        </div>
        <div className="absolute top-[55%] right-[8%] text-2xl opacity-[0.08] animate-float" style={{ animationDelay: '2s' }}>
          🌻
        </div>
        <div className="absolute bottom-[30%] left-[8%] text-3xl opacity-[0.06] animate-float" style={{ animationDelay: '0.5s' }}>
          🌻
        </div>
        <div className="absolute top-[40%] left-[15%] text-xl opacity-[0.06] animate-float" style={{ animationDelay: '1.5s' }}>
          🌻
        </div>
        <div className="absolute bottom-[15%] right-[12%] text-2xl opacity-[0.07] animate-float" style={{ animationDelay: '2.5s' }}>
          🌾
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

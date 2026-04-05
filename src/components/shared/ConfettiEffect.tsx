'use client'

import { useEffect, useRef } from 'react'

interface ConfettiEffectProps {
  show: boolean
  onComplete?: () => void
}

const COLORS = ['#facc15', '#f97316', '#22c55e', '#fbbf24', '#a3e635', '#fb923c', '#fde047']

interface Particle {
  x: number
  y: number
  color: string
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: 'circle' | 'rect' | 'sunflower'
}

export default function ConfettiEffect({ show, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    if (!show || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create particles
    const particles: Particle[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: (['circle', 'rect', 'sunflower'] as const)[Math.floor(Math.random() * 3)],
      })
    }
    particlesRef.current = particles

    let startTime = Date.now()
    const DURATION = 3000

    function animate() {
      const elapsed = Date.now() - startTime
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onComplete?.()
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const fadeOut = elapsed > DURATION - 800 ? (DURATION - elapsed) / 800 : 1

      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY
        p.speedY += 0.05 // gravity
        p.rotation += p.rotationSpeed
        p.opacity = fadeOut

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
        } else if (p.shape === 'rect') {
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          // Sunflower shape
          ctx.fillStyle = p.color
          const petalCount = 6
          const petalSize = p.size / 2
          for (let j = 0; j < petalCount; j++) {
            const angle = (j / petalCount) * Math.PI * 2
            ctx.beginPath()
            ctx.ellipse(
              Math.cos(angle) * petalSize * 0.6,
              Math.sin(angle) * petalSize * 0.6,
              petalSize * 0.5,
              petalSize * 0.25,
              angle,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
          // Center
          ctx.beginPath()
          ctx.arc(0, 0, petalSize * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = '#92400e'
          ctx.fill()
        }

        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

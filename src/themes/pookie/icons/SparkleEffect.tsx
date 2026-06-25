import { useEffect, useRef } from 'react'

export function SparkleEffect({ color = 'rgba(255,213,79,0.6)' }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    }
    resize()
    
    let observer: ResizeObserver | null = null;
    try {
      observer = new ResizeObserver(resize);
      if (canvas.parentElement) observer.observe(canvas.parentElement);
    } catch (e) {
      console.warn("ResizeObserver is not constructible. Using window resize listener instead.", e);
      window.addEventListener('resize', resize);
    }

    interface Sparkle {
      x: number; y: number; size: number
      opacity: number; rotation: number
      life: number; maxLife: number
    }

    const sparkles: Sparkle[] = []
    let frame = 0
    let animId: number

    const spawnSparkle = () => ({
      x:        Math.random() * canvas.width,
      y:        Math.random() * canvas.height,
      size:     3 + Math.random() * 8,
      opacity:  0,
      rotation: Math.random() * Math.PI * 2,
      life:     0,
      maxLife:  60 + Math.random() * 60,
    })

    // Pre-populate
    for (let i = 0; i < 30; i++) {
      const s = spawnSparkle()
      s.life = Math.random() * s.maxLife
      sparkles.push(s)
    }

    const draw4Star = (x: number, y: number, size: number, opacity: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      // 4-pointed star
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        const outer = { x: Math.cos(angle) * size, y: Math.sin(angle) * size }
        const innerAngle = angle + Math.PI / 4
        const inner = { x: Math.cos(innerAngle) * size * 0.15, y: Math.sin(innerAngle) * size * 0.15 }
        if (i === 0) ctx.moveTo(outer.x, outer.y)
        else ctx.lineTo(outer.x, outer.y)
        ctx.lineTo(inner.x, inner.y)
      }
      ctx.closePath()

      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
      grd.addColorStop(0, `rgba(255,255,255,${opacity})`)
      grd.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${opacity})`))
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fill()

      ctx.restore()
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      // Spawn new sparkle every 8 frames
      if (frame % 8 === 0) sparkles.push(spawnSparkle())

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i]
        s.life++
        const progress = s.life / s.maxLife
        s.opacity = progress < 0.3
          ? progress / 0.3
          : (1 - progress) / 0.7
        s.rotation += 0.02

        draw4Star(s.x, s.y, s.size, s.opacity * 0.7, s.rotation)

        if (s.life >= s.maxLife) sparkles.splice(i, 1)
      }

      // Keep max 50
      while (sparkles.length > 50) sparkles.shift()

      animId = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      cancelAnimationFrame(animId)
      if (observer) {
        observer.disconnect()
      } else {
        window.removeEventListener('resize', resize)
      }
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', width:'100%', height:'100%' }}
      aria-hidden="true"
    />
  )
}

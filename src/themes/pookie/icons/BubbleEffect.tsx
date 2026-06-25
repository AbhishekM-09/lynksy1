import { useEffect, useRef } from 'react'

export function BubbleEffect({ color = 'rgba(255,255,255,0.3)' }: { color?: string }) {
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

    interface Bubble {
      x: number; y: number; r: number
      speedY: number; speedX: number
      opacity: number; wobble: number
      wobbleSpeed: number; wobblePhase: number
    }

    const bubbles: Bubble[] = Array.from({ length: 20 }, () => ({
      x:           Math.random() * canvas.width,
      y:           canvas.height + Math.random() * 200,
      r:           8 + Math.random() * 20,
      speedY:      0.4 + Math.random() * 0.8,
      speedX:      (Math.random() - 0.5) * 0.5,
      opacity:     0.1 + Math.random() * 0.25,
      wobble:      3 + Math.random() * 5,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobblePhase: Math.random() * Math.PI * 2,
    }))

    let animId: number

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      bubbles.forEach((b, i) => {
        b.y -= b.speedY
        b.wobblePhase += b.wobbleSpeed
        const wobbleX = b.x + Math.sin(b.wobblePhase) * b.wobble

        if (b.y < -b.r * 2) {
          bubbles[i] = {
            x:           Math.random() * canvas.width,
            y:           canvas.height + b.r,
            r:           8 + Math.random() * 20,
            speedY:      0.4 + Math.random() * 0.8,
            speedX:      (Math.random() - 0.5) * 0.5,
            opacity:     0.1 + Math.random() * 0.25,
            wobble:      3 + Math.random() * 5,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobblePhase: Math.random() * Math.PI * 2,
          }
          return
        }

        // Bubble body
        ctx.beginPath()
        ctx.arc(wobbleX, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${b.opacity})`)
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Inner highlight
        ctx.beginPath()
        ctx.arc(wobbleX - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.6})`
        ctx.fill()

        // Subtle fill
        const grd = ctx.createRadialGradient(wobbleX, b.y, 0, wobbleX, b.y, b.r)
        grd.addColorStop(0,   color.replace(/[\d.]+\)$/, `${b.opacity * 0.15})`))
        grd.addColorStop(0.7, color.replace(/[\d.]+\)$/, `${b.opacity * 0.05})`))
        grd.addColorStop(1,   'transparent')
        ctx.beginPath()
        ctx.arc(wobbleX, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      })

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

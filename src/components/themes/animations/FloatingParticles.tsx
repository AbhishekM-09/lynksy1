import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDir: number;
  rotation: number;
  rotationSpeed: number;
}

interface FloatingParticlesProps {
  color?: string;
  count?: number;
  shape?: 'circle' | 'diamond' | 'cross';
}

export function FloatingParticles({
  color = 'rgba(255,107,0,0.4)',
  count = 25,
  shape = 'circle',
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    
    let observer: ResizeObserver | null = null;
    try {
      observer = new ResizeObserver(resize);
      if (canvas.parentElement) observer.observe(canvas.parentElement);
    } catch (e) {
      console.warn("ResizeObserver is not constructible. Using window resize listener instead.", e);
      window.addEventListener('resize', resize);
    }

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 1.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -(Math.random() * 0.4 + 0.1),
      opacity: Math.random() * 0.5 + 0.2,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    let animId: number;

    const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      if (shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
      } else if (shape === 'cross') {
        const t = size * 0.3;
        ctx.beginPath();
        ctx.rect(x - t, y - size, t * 2, size * 2);
        ctx.rect(x - size, y - t, size * 2, t * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.opacity += p.opacityDir * 0.004;

        if (p.opacity >= 0.7) p.opacityDir = -1;
        if (p.opacity <= 0.05) p.opacityDir = 1;

        // Wrap around edges
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        drawShape(ctx, 0, 0, p.size);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      cancelAnimationFrame(animId);
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
    };
  }, [color, count, shape]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  );
}

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface StarFieldProps {
  color?: string;
  count?: number;
}

export function StarField({ color = 'rgba(168,85,247,0.8)', count = 80 }: StarFieldProps) {
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

    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // Shooting stars
    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
    let frame = 0;
    let animId: number;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Spawn shooting star every ~4 seconds
      if (frame % 240 === 0 && Math.random() > 0.3) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          vx: 6 + Math.random() * 4,
          vy: 2 + Math.random() * 3,
          life: 0,
          maxLife: 40 + Math.random() * 20,
        });
      }

      // Draw stars
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        const alpha = star.opacity * (0.4 + 0.6 * twinkle);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.fill();

        // Soft glow on bigger stars
        if (star.r > 1.0) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
          const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3);
          grd.addColorStop(0, color.replace(/[\d.]+\)$/, `${alpha * 0.4})`));
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.fill();
        }
      });

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const prog = s.life / s.maxLife;
        const alpha = prog < 0.2 ? prog * 5 : (1 - prog) * 1.25;
        const tailLen = 60 * (1 - prog * 0.5);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tailLen / 6, s.y - s.vy * tailLen / 6);
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tailLen / 6, s.y - s.vy * tailLen / 6);
        grad.addColorStop(0, color.replace(/[\d.]+\)$/, `${Math.min(alpha, 1)})`));
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (s.life >= s.maxLife) shootingStars.splice(i, 1);
      }

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
  }, [color, count]);

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

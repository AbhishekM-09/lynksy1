import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  size: number;
  opacity: number;
  swayOffset: number;
  swaySpeed: number;
  color: string;
}

export function CherryBlossoms() {
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

    const petalColors = ['#FFB7C5', '#FF9BB3', '#FFC4D0', '#FFAABB', '#FFD0DA'];

    const createPetal = (canvas: HTMLCanvasElement): Petal => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.06,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: Math.random() * 1.5 + 0.8,
      size: Math.random() * 8 + 5,
      opacity: Math.random() * 0.7 + 0.3,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
    });

    const petals: Petal[] = Array.from({ length: 18 }, () => {
      const p = createPetal(canvas);
      p.y = Math.random() * canvas.height;
      return p;
    });

    let t = 0;
    let animId: number;

    const drawPetal = (ctx: CanvasRenderingContext2D, p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // Petal shape (teardrop)
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.6, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.5, -p.size * 0.8, -p.size * 0.5, 0, -p.size);

      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grd.addColorStop(0, '#FFFFFF');
      grd.addColorStop(0.4, p.color);
      grd.addColorStop(1, p.color + 'AA');
      ctx.fillStyle = grd;
      ctx.fill();

      // Vein line
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.lineTo(0, p.size * 0.8);
      ctx.strokeStyle = 'rgba(255,150,170,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;

      petals.forEach((p, i) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(t * p.swaySpeed + p.swayOffset) * 0.8;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 30) {
          petals[i] = createPetal(canvas);
        }

        drawPetal(ctx, p);
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
  }, []);

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

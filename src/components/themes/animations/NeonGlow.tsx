import React, { useEffect, useRef } from 'react';

interface NeonGlowProps {
  color?: string;
}

export function NeonGlow({ color = '#00FF88' }: NeonGlowProps) {
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

    // Grid lines
    const gridSize = 60;
    let offset = 0;
    let animId: number;

    // Glitch effect state
    let glitchTimer = 0;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset = (offset + 0.4) % gridSize;
      glitchTimer++;

      // Perspective grid (floor)
      ctx.save();
      const horizonY = canvas.height * 0.65;

      // Vertical lines
      const vanishX = canvas.width / 2;
      for (let i = -20; i <= 20; i++) {
        const startX = vanishX + i * gridSize * 8;
        const perspX = vanishX + i * gridSize;

        ctx.beginPath();
        ctx.moveTo(perspX, horizonY);
        ctx.lineTo(startX, canvas.height + 100);

        const alpha = Math.max(0, 0.3 - Math.abs(i) * 0.015);
        ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.stroke();
      }

      // Horizontal lines
      for (let j = 0; j < 12; j++) {
        const progress = (j / 12 + offset / gridSize / 12) % 1;
        const y = horizonY + (canvas.height - horizonY + 100) * Math.pow(progress, 1.8);
        const alpha = progress * 0.35;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.stroke();
      }

      ctx.restore();

      // Scanlines overlay
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, y, canvas.width, 1);
      }

      // Glitch flash every ~5 seconds
      if (glitchTimer % 300 < 3) {
        ctx.fillStyle = color + '08';
        ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2 + Math.random() * 4);
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
  }, [color]);

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

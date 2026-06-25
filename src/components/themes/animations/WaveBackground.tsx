import React, { useEffect, useRef } from 'react';

interface WaveBackgroundProps {
  color?: string;
}

export function WaveBackground({ color = 'rgba(14,165,233,0.15)' }: WaveBackgroundProps) {
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

    let t = 0;
    let animId: number;

    const waves = [
      { amplitude: 40, frequency: 0.008, speed: 0.015, yOffset: 0.5, alpha: 0.5 },
      { amplitude: 30, frequency: 0.012, speed: 0.020, yOffset: 0.55, alpha: 0.35 },
      { amplitude: 50, frequency: 0.006, speed: 0.010, yOffset: 0.45, alpha: 0.25 },
      { amplitude: 25, frequency: 0.016, speed: 0.025, yOffset: 0.6, alpha: 0.2 },
    ];

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * wave.yOffset
            + Math.sin(x * wave.frequency + t * wave.speed) * wave.amplitude
            + Math.sin(x * wave.frequency * 1.5 + t * wave.speed * 0.8) * (wave.amplitude * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${wave.alpha})`);
        ctx.fill();
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

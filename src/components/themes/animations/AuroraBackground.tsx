import React from 'react';

export function AuroraBackground() {
  return (
    <div className="aurora-container" aria-hidden="true">
      {/* Animated gradient blobs */}
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
      <div className="aurora-noise" />

      <style>{`
        .aurora-container {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          mix-blend-mode: screen;
        }

        .aurora-blob-1 {
          width: 200%; height: 200%;
          background: radial-gradient(circle, #00FFAA 0%, transparent 70%);
          top: -100%; left: -100%;
          animation: auroraDrift1 12s ease-in-out infinite;
        }
        .aurora-blob-2 {
          width: 180%; height: 180%;
          background: radial-gradient(circle, #4B8EFF 0%, transparent 70%);
          top: -20%; right: -80%;
          animation: auroraDrift2 15s ease-in-out infinite;
        }
        .aurora-blob-3 {
          width: 150%; height: 150%;
          background: radial-gradient(circle, #AA00FF 0%, transparent 70%);
          bottom: -50%; left: -20%;
          animation: auroraDrift3 10s ease-in-out infinite;
        }
        .aurora-blob-4 {
          width: 120%; height: 120%;
          background: radial-gradient(circle, #00DDFF 0%, transparent 70%);
          top: 20%; left: 20%;
          animation: auroraDrift4 18s ease-in-out infinite;
        }

        .aurora-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        @keyframes auroraDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(10%,-10%) scale(1.1); }
          66%      { transform: translate(-5%,15%) scale(0.95); }
        }
        @keyframes auroraDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-15%,10%) scale(1.15); }
          80%      { transform: translate(10%,-15%) scale(0.9); }
        }
        @keyframes auroraDrift3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(15%,-5%) scale(1.1); }
        }
        @keyframes auroraDrift4 {
          0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
          25%      { transform: translate(-10%,10%) scale(1.2) rotate(90deg); }
          50%      { transform: translate(10%,-15%) scale(0.9) rotate(180deg); }
          75%      { transform: translate(15%,5%) scale(1.1) rotate(270deg); }
        }
      `}</style>
    </div>
  );
}

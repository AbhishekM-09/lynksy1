import React from 'react'

interface LogoMarkProps {
  className?: string
  size?: number | string
}

export function LogoMark({ className = '', size = '100%' }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        {/* Sleek, premium 3D/glossy linear gradients mirroring the logo image */}
        
        {/* Left Link: Vivid Royal Blue to Sapphire Indigo */}
        <linearGradient id="logoLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="40%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Right Link: Violet Purple to Vibrant Magenta */}
        <linearGradient id="logoRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BC38EE" />
          <stop offset="60%" stopColor="#812AD6" />
          <stop offset="100%" stopColor="#6314BB" />
        </linearGradient>

        {/* Bottom Link: Electric Blue-Purple Transition */}
        <linearGradient id="logoBottomGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Elegant drop shadow to make the interlocking loops jump in 3D */}
        <filter id="logoShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="2" dy="5" stdDeviation="5.5" floodColor="#0D0814" floodOpacity="0.45" />
        </filter>

        {/* Highlight mask for glossy, high-end reflection overlay */}
        <linearGradient id="logoGlint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 
        The brand logo is composed of three interlocking key link structures forming a "Y".
        Each link is placed and rotated precisely to replicate the geometry and overlap seamlessly.
      */}

      {/* Group centered on a 300x300 canvas */}
      <g transform="translate(150, 150)">
        
        {/* 1. Bottom Link Cap (Drawn first to sit in the background of left/right links) */}
        <g transform="translate(0, 52)" filter="url(#logoShadow)">
          <rect
            x="-21"
            x-padding="0"
            y="-52"
            width="42"
            height="104"
            rx="21"
            fill="none"
            stroke="url(#logoBottomGrad)"
            strokeWidth="16.5"
            strokeLinecap="round"
          />
        </g>

        {/* 2. Left Link Cap (Angled at -43 degrees, sits over bottom link to lock it) */}
        <g transform="translate(-41, -21) rotate(-43)" filter="url(#logoShadow)">
          <rect
            x="-21"
            y="-52"
            width="42"
            height="104"
            rx="21"
            fill="none"
            stroke="url(#logoLeftGrad)"
            strokeWidth="16.5"
            strokeLinecap="round"
          />
        </g>

        {/* 3. Right Link Cap (Angled at 43 degrees, carries the signature growth arrow) */}
        <g transform="translate(41, -21) rotate(43)" filter="url(#logoShadow)">
          {/* Main Loop structure */}
          <rect
            x="-21"
            y="-52"
            width="42"
            height="104"
            rx="21"
            fill="none"
            stroke="url(#logoRightGrad)"
            strokeWidth="16.5"
            strokeLinecap="round"
          />

          {/* Premium Integrated Gloss/Matte White Branding Arrow */}
          <g transform="translate(0, -6)">
            {/* Arrow Shaft (curves down-left inside the right capsule) */}
            <path
              d="M -9, 14 C -3, 8 3, -1 6, -18"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Solid, sharp white arrowhead pointing elegantly up-right */}
            <path
              d="M -3, -24 L 11, -24 L 11, -10 L 4.5, -17.5 Z"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
          </g>
        </g>

        {/* 4. Overlap Interlock Patch (Redraws an arc of the bottom link to weave it over the right link) */}
        <g transform="translate(0, 52)">
          {/* We only draw the upper top-left arc segment of the bottom loop to complete the weave */}
          <path
            d="M -21, -30 A 21,21 0 0,1 21,-30"
            fill="none"
            stroke="url(#logoBottomGrad)"
            strokeWidth="16.5"
            strokeLinecap="round"
            opacity="1"
          />
        </g>
      </g>
    </svg>
  )
}

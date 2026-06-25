import React from 'react'
import { motion } from 'motion/react'

export const RainbowBackground: React.FC<{ speed?: number }> = ({ speed = 1 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Moving Gradient Base */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundImage: [
            'linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
            'linear-gradient(45deg, #9400D3, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082)',
            'linear-gradient(45deg, #4B0082, #9400D3, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF)',
          ]
        }}
        transition={{ duration: 8 / speed, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Floating Rainbow Blobs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px] opacity-15"
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: (15 + Math.random() * 10) / speed,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: 300 + Math.random() * 200,
            height: 300 + Math.random() * 200,
            background: `linear-gradient(${Math.random() * 360}deg, #FF0000, #FFFF00, #0000FF)`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Subtle Prism Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.1),transparent)]" />
    </div>
  )
}

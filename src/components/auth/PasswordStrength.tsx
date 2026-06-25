import { motion, AnimatePresence } from 'motion/react'
import { checkPasswordStrength } from '@/utils/authHelpers'

interface Props { password: string }

export function PasswordStrength({ password }: Props) {
  if (!password) return null

  const strength = checkPasswordStrength(password)
  const segments = [0, 1, 2, 3]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-2"
      >
        {/* Strength bar */}
        <div className="flex gap-1 mb-1.5">
          {segments.map(i => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i < strength.score
                  ? strength.color
                  : '#E5E7EB',
              }}
            />
          ))}
        </div>

        {/* Label + suggestion */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: strength.color }}>
            {strength.label}
          </span>
          {strength.suggestions[0] && (
            <span className="text-[10px] text-[#9A8F84]">
              {strength.suggestions[0]}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

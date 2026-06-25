import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, X } from 'lucide-react'

interface Props {
  message: string
  onDismiss?: () => void
}

export function AuthAlert({ message, onDismiss }: Props) {
  if (!message) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex items-start gap-3 p-3.5 rounded-xl border border-red-100 bg-red-50/50"
      >
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
        <p className="flex-1 text-sm font-medium leading-snug text-red-700">
          {message}
        </p>
        {onDismiss && (
          <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} className="text-red-500" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

import React from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  username: string
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isLoading, username }: ConfirmDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-6 sm:p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-2">
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-ink font-syne">Delete Account?</h3>
          
          <div className="space-y-2">
            <p className="text-sm text-muted leading-relaxed">
              This action is <span className="text-red-600 font-bold uppercase">permanent</span>. You will lose your username <span className="font-bold text-ink">@{username}</span>, all your links, products, and analytics forever.
            </p>
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest">
              There is no going back.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-6">
            <button 
              onClick={onClose}
              className="btn-secondary py-3.5 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Back
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

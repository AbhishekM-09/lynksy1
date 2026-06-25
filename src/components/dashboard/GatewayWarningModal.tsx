import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wallet, X, ArrowRight, ShieldAlert } from 'lucide-react'

interface GatewayWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onRedirect: () => void
}

export function GatewayWarningModal({ isOpen, onClose, onRedirect }: GatewayWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-6 sm:p-8 border border-cream-3"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-muted hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange/10 text-orange rounded-3xl flex items-center justify-center mb-2">
                <Wallet size={32} />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-ink font-syne uppercase tracking-tight">Gateway Required</h3>
              
              <div className="space-y-3 font-sans">
                <p className="text-sm text-muted leading-relaxed">
                  To start selling and managing digital products, you must first connect an active <strong className="text-ink">Razorpay Payment Gateway</strong> under your settings.
                </p>
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center gap-3 text-left">
                  <ShieldAlert className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 font-bold leading-normal uppercase tracking-wider">
                     DIRECT SETTLEMENTS REQUIRE YOUR MERCHANT ACCOUNT TO CAPTURE PAYMENTS SAFELY.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                <button 
                  onClick={onClose}
                  className="w-full py-4 border-2 border-cream-3 text-muted hover:text-ink hover:bg-cream-1 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={onRedirect}
                  className="w-full py-4 bg-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange/20 active:scale-95"
                >
                  <span>Connect Gateway</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

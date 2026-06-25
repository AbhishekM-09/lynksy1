import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/formatters'
import { LogoMark } from '@/components/ui/LogoMark'

export function Navbar() {
  const { isAuthenticated } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', path: '/#features' },
    { name: 'Templates', path: '/examples' },
    { name: 'Pricing', path: '/pricing' },
  ]

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ease-in-out px-4 sm:px-10 bg-white/95 backdrop-blur-xl border-b border-ink/5 shadow-sm",
          scrolled ? "py-3" : "py-4 sm:py-5"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 group-hover:scale-[1.08] group-hover:rotate-3 duration-300 transition-all flex items-center justify-center shrink-0">
              <LogoMark size="100%" />
            </div>
            <div className="flex items-center">
              <span className="text-base sm:text-lg font-black font-syne tracking-tight leading-none text-ink">
                Lynksy<span className="text-orange">.</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm sm:text-base font-semibold tracking-wide transition-all relative group font-outfit text-ink/60 hover:text-ink"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-orange hover:bg-orange-hover hover:scale-[1.02] active:scale-[0.98] px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm rounded-full shadow-lg shadow-orange/20 transition-all text-white font-semibold flex items-center gap-1.5 font-outfit"
              >
                Dashboard
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            ) : (
              <div className="flex items-center gap-4 sm:gap-8">
                <Link 
                  to="/login" 
                  className="hidden sm:block text-xs sm:text-sm font-semibold hover:text-orange transition-colors text-ink font-outfit"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-orange hover:bg-orange-hover hover:scale-[1.02] active:scale-[0.98] px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm rounded-full shadow-lg shadow-orange/20 transition-all text-white font-semibold font-outfit"
                >
                  Join Free
                </Link>
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="md:hidden p-2 rounded-xl transition-colors text-ink hover:bg-black/5"
                >
                  <Menu size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[340px] bg-[#FDFBF7] z-[80] p-6 sm:p-8 border-l border-[#E2DAD0]/80 shadow-2xl flex flex-col md:hidden overflow-hidden rounded-l-[32px] sm:rounded-l-[40px]"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.06),transparent_60%)] pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform">
                      <LogoMark size="100%" />
                    </div>
                    <span className="text-base font-black font-syne tracking-tight text-ink">
                      Lynksy<span className="text-orange">.</span>
                    </span>
                  </Link>
                  <button 
                    onClick={() => setIsMenuOpen(false)} 
                    className="w-10 h-10 rounded-full bg-white border border-[#E2DAD0]/60 flex items-center justify-center text-muted hover:text-orange hover:border-orange hover:rotate-90 duration-300 transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="space-y-4 flex-1">
                  <p className="text-[10px] font-black tracking-widest text-muted/60 uppercase mb-4 ml-1">Navigation</p>
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <Link 
                          to={link.path} 
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-4 px-2 border-b border-[#E2DAD0]/40 text-2xl font-black text-ink hover:text-orange transition-colors font-syne"
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions & Footer */}
                <div className="pt-6 border-t border-[#E2DAD0]/60 space-y-3 relative z-10 mt-auto">
                  {isAuthenticated ? (
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full h-12 rounded-2xl bg-orange text-white flex items-center justify-center font-bold shadow-lg shadow-orange/20 active:scale-95 hover:bg-orange-hover duration-300 transition-all gap-2"
                    >
                      Go to Dashboard
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full h-12 rounded-2xl bg-white border border-[#E2DAD0]/80 flex items-center justify-center font-bold text-ink hover:bg-cream-2 duration-300 transition-all"
                      >
                        Log in
                      </Link>
                      <Link 
                        to="/signup" 
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full h-12 rounded-2xl bg-orange text-white flex items-center justify-center font-bold shadow-lg shadow-orange/20 active:scale-95 hover:bg-orange-hover duration-300 transition-all"
                      >
                        Start creating today
                      </Link>
                    </>
                  )}
                  <p className="text-[10px] font-black tracking-widest text-muted/40 uppercase text-center pt-2">Lynksy © 2026</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  LayoutDashboard, BarChart3, Link2, Palette, Settings, LogOut, 
  X, User as UserIcon, ShoppingBag, CreditCard,
  ExternalLink, Mail, Shield, Scissors
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { signOutUser } from '@/firebase/auth'
import { PLAN_INFO } from '@/constants/plans'
import { cn, getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'
import { LogoMark } from '@/components/ui/LogoMark'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Link2, label: 'Links', path: '/dashboard/links' },
  { icon: Scissors, label: 'URL Shortener', path: '/dashboard/url-shortener' },
  { icon: ShoppingBag, label: 'Store', path: '/dashboard/store' },
  { icon: Mail, label: 'Audience & Leads', path: '/dashboard/emails' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Palette, label: 'Appearance', path: '/dashboard/appearance' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: CreditCard, label: 'Billing', path: '/pricing' },
  { icon: UserIcon, label: 'View Profile', path: '/PROFILE_LINK' },
]

export function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024)

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    clearAuth()
    navigate('/')
  }

  const plan = user?.plan || 'FREE'
  const planInfo = PLAN_INFO[plan]

  const activeNavItems = React.useMemo(() => {
    const items = navItems.filter(item => item.path !== '/PROFILE_LINK')
    if (user?.email?.toLowerCase() === 'abhimattikopp9845@gmail.com') {
      items.push({ icon: Shield, label: 'Admin Panel', path: '/admin' })
    }
    return items
  }, [user])

  const sidebarVariants = {
    hidden: { x: -260, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 120,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial={isDesktop ? "visible" : "hidden"}
        animate={isDesktop || sidebarOpen ? "visible" : "hidden"}
        className={cn(
          "fixed inset-y-0 left-0 bg-[#111111] w-[260px] z-50 flex flex-col border-r border-white/5 lg:z-30",
          !isDesktop && !sidebarOpen && "pointer-events-none"
        )}
      >
        <div className="p-4 lg:p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center shrink-0">
              <LogoMark size="100%" />
            </div>
            <div className="flex items-center min-w-0">
              <span className="text-sm lg:text-base font-black text-white font-syne tracking-tight leading-none truncate">
                Lynksy<span className="text-orange">.</span>
              </span>
            </div>
          </div>
          <button 
            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 shrink-0" 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <motion.div variants={itemVariants} className="px-5 my-6">
          <div 
            className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-4 flex items-center gap-3 border border-white/5 relative group overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => {
              window.open(`/${user?.username}`, '_blank')
              setSidebarOpen(false)
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="w-12 h-12 rounded-2xl bg-ink-3 p-0.5 border border-white/10 overflow-hidden shrink-0 relative z-10">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-sm font-black text-white rounded-[14px]"
                  style={{ background: getFallbackAvatarGradient(user?.displayName || user?.username || 'U') }}
                >
                  {getFallbackAvatarInitials(user?.displayName || user?.username || 'U')}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden relative z-10">
              <p className="text-xs font-bold text-white truncate font-syne group-hover:text-orange transition-colors">
                {user?.displayName || 'Creator'}
              </p>
              <div className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full inline-block mt-1",
                plan === 'FREE' ? "bg-muted/20 text-muted" : plan === 'PRO' ? "bg-orange/20 text-orange" : "bg-purple-500/20 text-purple-400"
              )}>
                {planInfo.badge}
              </div>
            </div>
            <ExternalLink size={12} className="text-white/20 group-hover:text-orange transition-colors relative z-10" />
          </div>
        </motion.div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar py-2">
          {activeNavItems.map((item) => {
            return (
              <motion.div key={item.label} variants={itemVariants}>
                <NavLink
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all relative group overflow-hidden border-l-4",
                    isActive 
                      ? "border-orange bg-white/[0.06] text-white font-medium" 
                      : "border-transparent text-white/40 hover:text-white hover:bg-white/5 active:scale-95"
                  )}
                >
                  <item.icon size={18} className={cn("shrink-0 transition-all duration-300", "group-hover:scale-110 group-active:scale-90")} />
                  <span className="text-sm font-medium tracking-normal">{item.label}</span>
                  

                </NavLink>
              </motion.div>
            )
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 pt-2 space-y-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-3 w-full text-white/40 hover:text-red-400 transition-all text-sm font-medium tracking-normal group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Log out
          </button>
        </div>
      </motion.aside>
    </>
  )
}

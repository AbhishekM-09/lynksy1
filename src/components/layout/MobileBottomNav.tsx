import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  LayoutDashboard, Link2, BarChart3, Palette, Settings
} from 'lucide-react'
import { cn } from '@/utils/formatters'

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Link2, label: 'Links', path: '/dashboard/links' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Palette, label: 'Design', path: '/dashboard/appearance' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
]

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-6 left-6 right-6 h-[68px] bg-ink/90 backdrop-blur-xl border border-white/10 lg:hidden z-50 flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] pb-safe overflow-hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative group",
            isActive ? "text-orange" : "text-white/30"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-500 relative",
                isActive ? "bg-orange/10 scale-110" : "scale-100 group-hover:bg-white/5 active:scale-90"
              )}>
                <item.icon size={18} strokeWidth={isActive ? 3 : 2} className="relative z-10" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-orange/20 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                isActive ? "opacity-100 translate-y-0 text-orange" : "opacity-0 translate-y-2"
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

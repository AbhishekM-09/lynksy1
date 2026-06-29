import { useLocation } from 'react-router-dom'
import { Menu, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { toast } from 'react-hot-toast'
import { getUserUrls } from '@/utils/planUtils'

export function TopBar() {
  const { user } = useAuthStore()
  const { setSidebarOpen } = useUIStore()
  const location = useLocation()

  const { actual: profileUrl, display: displayUrl } = getUserUrls(user)

  const pageTitle = {
    '/dashboard': 'Overview',
    '/dashboard/links': 'Link Editor',
    '/dashboard/url-shortener': 'URL Shortener',
    '/dashboard/store': 'Store',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/appearance': 'Appearance',
    '/dashboard/settings': 'Settings',
  }[location.pathname] || 'Dashboard'

  const copyUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    toast.success('Link copied to clipboard!')
  }

  const daysLeft = user?.planExpiresAt 
    ? Math.ceil((user.planExpiresAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : Infinity

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-cream-3 px-2 sm:px-10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 text-muted hover:text-ink transition-all active:scale-90 flex items-center justify-center bg-cream/50 rounded-xl"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xs sm:text-xl font-black text-ink leading-tight font-syne tracking-widest uppercase">{pageTitle}</h2>
          <div className="lg:hidden text-[9px] text-muted flex items-center gap-1 font-black lowercase tracking-wider opacity-40">
            {displayUrl}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        {/* Mobile View Live Page and Copy capsule */}
        <div className="flex md:hidden items-center gap-1 bg-cream/50 border border-cream-3 rounded-xl p-1 shadow-sm">
          <button 
            onClick={copyUrl} 
            className="p-1.5 text-muted hover:text-orange hover:bg-white rounded-lg transition-all active:scale-90" 
            title="Copy Link"
          >
            <Copy size={13} />
          </button>
          <div className="w-[1px] h-3 bg-cream-3" />
          <a 
            href={profileUrl} 
            target="_blank" 
            className="p-1.5 text-muted hover:text-orange hover:bg-white rounded-lg transition-all active:scale-90 flex items-center justify-center"
            title="View Live Page"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3 bg-cream/40 border border-cream-3 rounded-xl px-4 py-2 hover:bg-cream/60 transition-colors group">
          <span className="text-xs text-ink/60 font-bold group-hover:text-ink transition-colors">{displayUrl}</span>
          <div className="w-[1px] h-3 bg-cream-3" />
          <div className="flex items-center gap-1.5">
            <button 
              onClick={copyUrl} 
              className="p-1.5 text-muted hover:text-orange hover:bg-white rounded-lg transition-all" 
              title="Copy Link"
            >
              <Copy size={14} />
            </button>
            <a 
              href={profileUrl} 
              target="_blank" 
              className="p-1.5 text-muted hover:text-orange hover:bg-white rounded-lg transition-all"
              title="View Live Page"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>



        {daysLeft <= 3 && (
          <div className="hidden xl:flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
            <AlertCircle size={14} />
            {daysLeft <= 0 ? 'Plan expired' : `Expires in ${daysLeft}d`}
          </div>
        )}
      </div>
    </header>
  )
}

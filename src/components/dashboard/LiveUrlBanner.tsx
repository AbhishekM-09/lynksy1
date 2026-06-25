import { Copy, ExternalLink, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { User } from '@/types'
import { motion } from 'motion/react'
import { getUserUrls } from '@/utils/planUtils'

interface LiveUrlBannerProps {
  user: User | null
}

export function LiveUrlBanner({ user }: LiveUrlBannerProps) {
  const { actual: profileUrl, display: displayUrl } = getUserUrls(user)

  const copyUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    toast.success('Live URL copied!')
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-ink rounded-3xl p-4 sm:p-6 shadow-xl border border-white/5 relative overflow-hidden mb-8"
    >
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#6366F1]/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none hidden sm:block">
        <Sparkles size={120} className="text-white" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Now</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white font-syne mb-1 truncate tracking-tight">{displayUrl}</h2>
        <p className="text-white/40 text-[10px] font-medium mb-5 max-w-[200px] sm:max-w-none leading-relaxed">Your personal corner of the internet is ready.</p>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={copyUrl}
            className="flex-1 bg-white/10 text-white h-10 sm:h-12 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Copy size={14} />
            Copy
          </button>
          <a 
            href={profileUrl}
            target="_blank"
            className="flex-1 bg-[#6366F1] text-white h-10 sm:h-12 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-[#4F46E5] shadow-lg shadow-[#6366F1]/20 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            View Page
          </a>
        </div>
      </div>
    </motion.div>
  )
}

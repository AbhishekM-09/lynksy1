import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getAnalytics, getLinks } from '@/firebase/firestore'
import { getShortLinks } from '@/firebase/shortLinks'
import { usePlan } from '@/hooks/usePlan'
import { StatCard } from '@/components/dashboard/StatCard'
import { LiveUrlBanner } from '@/components/dashboard/LiveUrlBanner'
import { PlanGate } from '@/components/ui/PlanGate'
import { 
  Eye, TrendingUp, Zap, Link2 as LinkIcon, 
  Plus, Palette, MousePointer2, PieChart,
  Calendar, Sun, Cloud, Moon, Scissors,
  Youtube, Instagram, Twitter, Linkedin, Github, Facebook, MessageCircle, Mail, Phone, Smartphone, FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link as LinkType, AnalyticsData } from '@/types'
import { motion } from 'motion/react'
import { cn } from '@/utils/formatters'

const getLinkDetails = (l: LinkType) => {
  const type_lower = (l.type || '').toUpperCase()
  const url_lower = (l.url || '').toLowerCase()

  if (type_lower === 'WHATSAPP' || url_lower.includes('wa.me') || url_lower.includes('whatsapp.com')) {
    return { icon: MessageCircle, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' }
  }
  if (type_lower === 'YOUTUBE' || url_lower.includes('youtube.com') || url_lower.includes('youtu.be')) {
    return { icon: Youtube, bg: 'bg-red-500/10 text-red-500 border-red-500/10' }
  }
  if (type_lower === 'INSTAGRAM' || url_lower.includes('instagram.com')) {
    return { icon: Instagram, bg: 'bg-pink-500/10 text-pink-500 border-pink-500/10' }
  }
  if (type_lower === 'EMAIL' || url_lower.startsWith('mailto:')) {
    return { icon: Mail, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/10' }
  }
  if (type_lower === 'PHONE' || url_lower.startsWith('tel:')) {
    return { icon: Phone, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' }
  }
  if (type_lower === 'UPI' || url_lower.includes('upi:')) {
    return { icon: Smartphone, bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10' }
  }
  if (type_lower === 'FORM') {
    return { icon: FileText, bg: 'bg-purple-500/10 text-purple-500 border-purple-500/10' }
  }
  if (url_lower.includes('twitter.com') || url_lower.includes('x.com')) {
    return { icon: Twitter, bg: 'bg-sky-400/10 text-sky-400 border-sky-400/10' }
  }
  if (url_lower.includes('linkedin.com')) {
    return { icon: Linkedin, bg: 'bg-blue-600/10 text-blue-600 border-blue-600/10' }
  }
  if (url_lower.includes('github.com')) {
    return { icon: Github, bg: 'bg-zinc-800/10 text-zinc-800 border-zinc-800/10' }
  }
  if (url_lower.includes('facebook.com')) {
    return { icon: Facebook, bg: 'bg-blue-700/10 text-blue-700 border-blue-700/10' }
  }

  return { icon: LinkIcon, bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10' }
}

export default function DashboardHome() {
  const { user } = useAuthStore()
  const { plan, limits } = usePlan()
  
  const [range, setRange] = useState(7)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [links, setLinks] = useState<LinkType[]>([])
  
  const [shortLinksCount, setShortLinksCount] = useState(0)
  const [shortLinksClicks, setShortLinksClicks] = useState(0)

  useEffect(() => {
    if (!user?.uid) return
    
    const load = async () => {
      try {
        if (!data) {
          setLoading(true)
        }
        const [stats, userLinks] = await Promise.all([
          getAnalytics(user.uid, range).catch(e => { 
            console.error('Analytics stats error:', e); 
            return null; 
          }),
          getLinks(user.uid).catch(e => { 
            console.error('Dashboard links load error:', e); 
            return []; 
          })
        ])
        setData(stats)
        setLinks(userLinks)

        if (user.plan === 'PRO_PLUS') {
          const shorties = await getShortLinks(user.uid).catch(e => {
            console.error('Dashboard short link load error:', e);
            return [];
          })
          setShortLinksCount(shorties.length)
          setShortLinksClicks(shorties.reduce((acc, curr) => acc + (curr.clicks || 0), 0))
        }
      } catch (e) {
        console.error('Parallel load error:', e)
      } finally {
        setLoading(false)
      }
    }
    
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, range])

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'morning', icon: Sun }
    if (hour < 17) return { text: 'afternoon', icon: Cloud }
    return { text: 'evening', icon: Moon }
  }

  const ChartGate = ({ children }: { children: React.ReactNode }) => {
    if (plan === 'FREE') return <>{children}</>
    return <PlanGate feature="analyticsHistory">{children}</PlanGate>
  }

  const timeOfDay = getTimeOfDay()

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-syne text-ink mb-1 flex items-center gap-3">
          Good {timeOfDay.text}, {user?.firstName}! <timeOfDay.icon className="text-[#6366F1]" size={24} />
        </h1>
        <p className="text-muted text-sm font-medium flex items-center gap-2">
          <Calendar size={14} className="text-[#6366F1]" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <LiveUrlBanner user={user} />

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          label="Page Views" 
          value={data?.totalViews || 0} 
          icon={Eye} 
          isLoading={loading} 
        />
        <StatCard 
          label="Link Clicks" 
          value={data?.totalClicks || 0} 
          icon={TrendingUp} 
          isLoading={loading} 
        />
        <StatCard 
          label="CTR" 
          value={data?.ctr || 0} 
          suffix="%"
          icon={Zap} 
          isLoading={loading} 
        />
        <StatCard 
          label="Active Links" 
          value={links.filter(l => l.isActive).length} 
          suffix={`/${limits.maxLinks === 999 ? '∞' : limits.maxLinks}`}
          icon={LinkIcon} 
          isLoading={loading} 
          isAlert={links.filter(l => l.isActive).length > limits.maxLinks}
          description={links.filter(l => l.isActive).length > limits.maxLinks ? `⚠️ Hidden: Max limit of ${limits.maxLinks} exceeded.` : "Active links live on public profile"}
        />
      </div>

      {user?.plan === 'PRO_PLUS' && (
        <div className="bg-gradient-to-r from-purple-900/10 to-indigo-900/15 border border-purple-500/25 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 text-[9px] font-black uppercase tracking-widest border border-purple-500/10 inline-block">
                Premium Active Card
              </span>
            </div>
            <h3 className="text-base font-black text-ink font-syne tracking-tight flex items-center gap-2">
              <Scissors size={18} className="text-purple-600" />
              URL Shortener Insights
            </h3>
            <p className="text-xs text-muted">Create custom short links & study traffic patterns with 0% commission.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Total Links</span>
              <p className="text-xl font-black text-ink">{shortLinksCount}</p>
            </div>
            <div className="w-[1px] h-8 bg-zinc-200 hidden sm:block" />
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Short Clicks</span>
              <p className="text-xl font-black text-ink">{shortLinksClicks}</p>
            </div>
            
            <Link 
              to="/dashboard/url-shortener" 
              className="bg-ink hover:bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all active:scale-95 text-center w-full md:w-auto"
            >
              Shortener Hub
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink">Performance</h3>
              <p className="text-xs text-muted">Views vs Clicks over the last {range} days</p>
            </div>
            {plan !== 'FREE' && (
              <div className="flex items-center gap-1 bg-cream-3 p-1 rounded-xl">
                {[7, 30, 90].map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                      range === r 
                        ? "bg-white text-ink shadow-sm" 
                        : "text-muted hover:text-ink"
                    )}
                  >
                    {r === 365 ? '1Y' : `${r}D`}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full">
            <ChartGate>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.dailyChart || []}>
                  <defs>
                    <linearGradient id="colorViewsHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClicksHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9A8F84', fontWeight: 600 }}
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    minTickGap={30}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      backgroundColor: '#18181B', 
                      borderColor: '#27272A',
                      color: '#FFFFFF',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#6366F1" 
                    fillOpacity={1} 
                    fill="url(#colorViewsHome)" 
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366F1' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorClicksHome)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#10B981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartGate>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <Link to="/dashboard/links" className="card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-[#6366F1] transition-all group h-full">
            <div className="p-4 bg-cream-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-[#6366F1] transition-all transform group-hover:scale-110">
              <Plus size={24} />
            </div>
            <div>
              <span className="text-sm font-black text-ink block mb-1">Add Link</span>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Expand your bio</p>
            </div>
          </Link>
          <Link to="/dashboard/appearance" className="card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-[#6366F1] transition-all group h-full">
            <div className="p-4 bg-cream-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-[#6366F1] transition-all transform group-hover:scale-110">
              <Palette size={24} />
            </div>
            <div>
              <span className="text-sm font-black text-ink block mb-1">Themes</span>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Style your page</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <PlanGate feature="analyticsHistory">
          <div className="card">
            <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
              <MousePointer2 size={18} className="text-[#6366F1]" />
              Top Performing Links
            </h3>
            <div className="space-y-4">
              {[...links]
                .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
                .slice(0, 5)
                .map((l, i) => {
                  const details = getLinkDetails(l)
                  const IconComp = details.icon
                  return (
                    <div key={l.id} className="flex items-center gap-4">
                      {l.emoji ? (
                        <div className="w-10 h-10 bg-cream-3 border border-cream-2 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-sm">
                          {l.emoji}
                        </div>
                      ) : (
                        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 hover:scale-105", details.bg)}>
                          <IconComp size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-bold text-ink truncate mr-2">{l.title}</p>
                          <div className="py-1 px-2.5 bg-cream-3 rounded-full flex items-center gap-1.5" title="Total Clicks">
                            <MousePointer2 size={10} className="text-muted" />
                            <span className="text-xs font-black text-ink leading-none">{l.clickCount || 0}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-cream-3 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(((l.clickCount || 0) / (data?.totalClicks || 1)) * 100, 100)}%` }}
                             transition={{ duration: 1, delay: i * 0.1 }}
                             className="h-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5]"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </PlanGate>

        {plan === 'FREE' && (
          <div className="card h-full flex flex-col justify-center items-center text-center p-12">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-full mb-6">
              <PieChart size={32} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">Want deeper insights?</h3>
            <p className="text-sm text-muted mb-8 max-w-xs">
              See exactly which cities your visitors are coming from and what devices they use.
            </p>
            <Link to="/pricing" className="btn-primary w-full max-w-[200px]">Unlock Pro+</Link>
          </div>
        )}
      </div>
    </div>
  )
}


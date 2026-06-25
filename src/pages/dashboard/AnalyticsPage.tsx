import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getAnalytics, getDetailedEvents } from '@/firebase/firestore'
import { StatCard } from '@/components/dashboard/StatCard'
import { PlanGate } from '@/components/ui/PlanGate'
import { 
  BarChart2, MousePointer2, Users, Globe,
  Download, Info, MapPin, Smartphone, Loader2, Sparkles
} from 'lucide-react'
import { motion } from 'motion/react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts'
import { cn } from '@/utils/formatters'
import { toast } from 'react-hot-toast'

import { usePlan } from '@/hooks/usePlan'

import { AnalyticsData } from '@/types'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const { plan } = usePlan()
  
  const [range, setRange] = useState(7)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [activeMetric, setActiveMetric] = useState<'views' | 'clicks'>('views')
  const [exporting, setExporting] = useState(false)

  const handleExportCSV = async () => {
    if (!user?.uid) return
    setExporting(true)
    const exportToast = toast.loading('Generating detailed CSV report...')
    try {
      const events = await getDetailedEvents(user.uid, range)
      if (!events || events.length === 0) {
        toast.error('No analytics events found in the selected range to export.', { id: exportToast })
        return
      }

      // Headers: Type, Timestamp (UTC), Local Date/Time, Device, Browser, Region, Target (Link ID / Referer), Link Title
      const headers = [
        'Event Type',
        'Timestamp (UTC)',
        'Local Date & Time',
        'Device Type',
        'Browser',
        'Region / Country',
        'Link ID or Referer Source',
        'Link Title'
      ]

      const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""')
        return `"${clean}"`
      }

      const rows = events.map(e => {
        let localTimeStr = 'Unknown'
        try {
          localTimeStr = new Date(e.dateStr).toLocaleString()
        } catch {
          // ignore
        }

        return [
          e.type,
          e.dateStr,
          localTimeStr,
          e.device,
          e.browser,
          e.region,
          e.refererOrLink,
          e.linkTitle || ''
        ].map(val => escapeCSV(String(val))).join(',')
      })

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `lynksy_detailed_analytics_${range}d_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Detailed CSV report downloaded successfully!', { id: exportToast })
    } catch (err) {
      console.error('Export CSV error:', err)
      toast.error('Failed to export detailed CSV report.', { id: exportToast })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    getAnalytics(user.uid, range)
      .then(res => {
        setData(res)
      })
      .catch(err => {
        console.error('Analytics load error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user?.uid, range])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: { color: string; name: string; value: number }[], label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181B] p-4 rounded-2xl shadow-2xl border border-zinc-800 backdrop-blur-md">
          <p className="text-[10px] font-black text-[#818CF8] uppercase tracking-widest mb-3">{label}</p>
          <div className="space-y-2">
            {payload.map((p, i: number) => (
              <div key={i} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full ring-4 ring-white/5" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-bold text-white/60">{p.name}</span>
                </div>
                <span className="text-xs font-black text-white tabular-nums">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const deviceDataRaw = data?.devices || []
  const deviceData = deviceDataRaw.length > 0 
    ? deviceDataRaw.map((d: { device: string; count: number }) => ({
        name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
        value: Math.round((d.count / (data?.totalViews || 1)) * 100),
        color: d.device === 'mobile' ? '#6366F1' : d.device === 'desktop' ? '#10B981' : '#9A8F84'
      }))
    : [
        { name: 'No data', value: 100, color: '#f0f0f0' }
      ]

  const sourceData = data?.sources || []

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-syne text-ink">Analytics</h1>
          <p className="text-xs text-muted">Deep dive into your page performance</p>
        </div>
        {plan !== 'FREE' && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-cream-3 overflow-x-auto no-scrollbar">
            {[7, 30, 90].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap uppercase tracking-widest",
                  range === r ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20" : "text-muted hover:text-ink hover:bg-cream-1"
                )}
              >
                {r} DAYS
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Overview Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          label="Total Views" 
          value={data?.totalViews || 0} 
          icon={Users} 
          isLoading={loading}
          trend={data?.viewsTrend || 0}
          description="Total visits to your public link profile"
        />
        <StatCard 
          label="Total Clicks" 
          value={data?.totalClicks || 0} 
          icon={MousePointer2} 
          isLoading={loading}
          trend={data?.clicksTrend || 0}
          description="Total clicks across all your active links"
        />
        <StatCard 
          label="Avg. CTR" 
          value={data?.ctr || 0} 
          suffix="%" 
          icon={BarChart2} 
          isLoading={loading} 
          description="Total Clicks divided by Unique Visitors"
        />
        <StatCard 
          label="Unique Visitors" 
          value={data?.uniqueVisitors || 0} 
          icon={Globe} 
          isLoading={loading} 
          description="Distinct individual users who loaded your page"
        />
      </motion.div>

      {/* CTR Explanation Info Card */}
      {data?.ctr !== undefined && data.ctr > 100 && (
        <motion.div 
          variants={item}
          className="bg-indigo-500/5 border border-indigo-500/15 rounded-3xl p-5 sm:p-6 text-ink flex items-start gap-4 shadow-sm"
        >
          <Sparkles className="h-5 w-5 text-[#6366F1] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-xs sm:text-sm text-[#6366F1] uppercase tracking-wider">Understanding Your CTR ({data.ctr}%)</h5>
            <p className="text-xs text-muted font-medium leading-relaxed">
              Your Click-Through Rate (CTR) represents total clicks divided by unique visitors. Because highly engaged single visitors can, and often do, click multiple links or buttons during a single visit, your CTR can easily go above 100%! A high CTR like yours represents fantastic audience engagement.
            </p>
          </div>
        </motion.div>
      )}


      <motion.div variants={item} className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 card overflow-hidden group/chart">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div className="flex items-center p-1 bg-cream-1 rounded-2xl border border-cream-3">
              <button 
                onClick={() => setActiveMetric('views')}
                className={cn(
                  "px-6 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl",
                  activeMetric === 'views' 
                    ? "bg-ink text-white shadow-xl shadow-ink/20 scale-105" 
                    : "text-muted hover:text-ink"
                )}
              >
                Views
              </button>
              <button 
                onClick={() => setActiveMetric('clicks')}
                className={cn(
                  "px-6 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl",
                  activeMetric === 'clicks' 
                    ? "bg-ink text-white shadow-xl shadow-ink/20 scale-105" 
                    : "text-muted hover:text-ink"
                )}
              >
                Clicks
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 mr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Clicks</span>
                </div>
              </div>
              <button 
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex items-center gap-2 text-[10px] font-black text-muted hover:text-ink hover:border-[#6366F1]/30 disabled:opacity-50 transition-all px-4 py-2 border-2 border-cream-2 rounded-xl active:scale-95"
              >
                {exporting ? (
                  <Loader2 size={14} className="animate-spin text-[#6366F1]" />
                ) : (
                  <Download size={14} />
                )}
                {exporting ? 'EXPORTING...' : 'EXPORT CSV'}
              </button>
            </div>
          </div>
          
          <div className="h-[350px] -mx-3">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart 
                data={data?.dailyChart || []} 
                margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
              >
                 <defs>
                   <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                     <stop offset="40%" stopColor="#6366F1" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                     <stop offset="40%" stopColor="#10B981" stopOpacity={0.05}/>
                     <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f0ea" />
                 <XAxis 
                   dataKey="date" 
                   axisLine={false} 
                   tickLine={false} 
                   dy={10}
                   tick={{ fontSize: 10, fill: '#9A8F84', fontWeight: 700 }}
                   tickFormatter={(v) => {
                     const date = new Date(v)
                     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                   }}
                   minTickGap={40}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: '#9A8F84', fontWeight: 700 }}
                   width={40}
                 />
                 <Tooltip 
                   content={<CustomTooltip />}
                   cursor={{ stroke: '#6366F1', strokeWidth: 2, strokeDasharray: '6 6' }}
                   animationDuration={300}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="views" 
                   stroke="#6366F1"
                   fillOpacity={1}
                   fill="url(#colorViews)"
                   strokeWidth={4}
                   name="Views"
                   hide={activeMetric === 'clicks'}
                   animationDuration={1500}
                   activeDot={{ r: 6, strokeWidth: 0, fill: '#6366F1' }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="clicks" 
                   stroke="#10B981" 
                   fillOpacity={1} 
                   fill="url(#colorClicks)"
                   strokeWidth={4}
                   name="Clicks"
                   hide={activeMetric === 'views'}
                   animationDuration={1500}
                   activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                 />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources - Locked for Free */}
        <div className="card border-0 bg-ink text-white shadow-2xl relative overflow-hidden group/sources">
          {/* Subtle background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold font-syne mb-1">Traffic Sources</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Where they find you</p>
            </div>
            <Info size={14} className="text-white/20" />
          </div>
          
          <PlanGate feature="analyticsHistory">
            <div className="space-y-5 relative z-10">
              {sourceData.length > 0 ? sourceData.map((s: { source: string; count: number }, i: number) => (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">{s.source}</span>
                      <span className="text-base font-black tabular-nums">{s.count.toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-bold text-[#818CF8] tabular-nums">{Math.round((s.count / (data?.totalViews || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / (data?.totalViews || 1)) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        s.source === 'Instagram' ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                        s.source === 'YouTube' ? "bg-red-600" :
                        s.source === 'Twitter/X' ? "bg-white/80" :
                        s.source === 'WhatsApp' ? "bg-green-500" : "bg-[#6366F1]"
                      )} 
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Globe className="mx-auto text-white/5 mb-4" size={48} />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Awaiting visitors...</p>
                </div>
              )}
            </div>
          </PlanGate>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="card relative overflow-hidden group/devices">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/devices:scale-110 transition-transform duration-500">
            <Smartphone size={120} className="text-ink" />
          </div>
          
          <h3 className="text-lg font-bold text-ink mb-2">Devices</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-10">Access platform breakdown</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
            <div className="h-[200px] w-[200px] shrink-0 relative">
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-black text-muted uppercase tracking-wider">Total</span>
                 <span className="text-xl font-black text-ink">{data?.totalViews.toLocaleString()}</span>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                   <Pie
                     data={deviceData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={90}
                     paddingAngle={8}
                     dataKey="value"
                     stroke="none"
                   >
                     {deviceData.map((entry: { color: string }, index: number) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     content={({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
                       if (active && payload && payload.length) {
                         const data = payload[0].payload;
                         return (
                           <div className="bg-ink p-3 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
                             <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{data.name}</p>
                             <p className="text-base font-black text-white tabular-nums">{data.value}%</p>
                           </div>
                         );
                       }
                       return null;
                     }}
                   />
                 </RePieChart>
               </ResponsiveContainer>
            </div>
            
            <div className="grid gap-3 w-full">
               {deviceDataRaw.length > 0 ? deviceData.map((d: { name: string; color: string; value: number }, i: number) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-cream-1 border border-transparent hover:border-cream-3 transition-all group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full ring-4 ring-cream-3/30" style={{ backgroundColor: d.color }} />
                      <span className="text-xs font-bold text-ink">{d.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-ink">{d.value}%</span>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">
                        {Math.round((d.value / 100) * (data?.totalViews || 0)).toLocaleString()} views
                      </span>
                    </div>
                 </div>
               )) : (
                 <p className="text-xs text-muted text-center py-6">Awaiting more data...</p>
               )}
            </div>
          </div>
        </div>

        {/* Top Locations - Locked for Free */}
        {plan !== 'FREE' && (
          <div className="card relative overflow-hidden group/locations">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/locations:scale-110 transition-transform duration-500">
              <Globe size={120} className="text-ink" />
            </div>
            <PlanGate feature="premiumInsight">
              <h3 className="text-lg font-bold text-ink mb-2">Top Locations</h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-8">Visitor geographical distribution</p>
              
              <div className="grid gap-5 relative z-10">
                {(data?.regions || []).length > 0 ? data!.regions.map((l: { region: string; count: number }, i: number) => (
                  <div key={i} className="flex items-center gap-4 group/loc">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366F1] group-hover/loc:bg-[#6366F1] group-hover/loc:text-white transition-all">
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-black text-ink uppercase tracking-tight">{l.region}</span>
                        <div className="text-right">
                          <span className="text-xs font-black text-ink">{l.count.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-muted ml-1.5 uppercase">views</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-cream-2 rounded-full overflow-hidden">
                         <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(l.count / (data?.totalViews || 1) * 100)}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-[#6366F1] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <MapPin className="mx-auto text-cream-3 mb-4 animate-bounce" size={32} />
                    <p className="text-xs text-muted font-bold uppercase tracking-widest">Wanderlust in progress...</p>
                  </div>
                )}
              </div>
            </PlanGate>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

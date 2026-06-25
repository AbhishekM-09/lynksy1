import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  CheckCircle2, Download, AlertCircle, 
  Clock, ShieldCheck, Loader2,
  FileIcon, FileText, ImageIcon, Music, Video, Archive
} from 'lucide-react'
import { verifyDownloadToken, getSignedDownloadUrl, incrementDownloadCount } from '@/firebase/store'
import { DownloadToken } from '@/types/store'
import { formatFileSize, maskEmail } from '@/utils/storeUtils'
import { cn } from '@/utils/formatters'
import { format } from 'date-fns'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function DownloadSuccess() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<DownloadToken | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const checkToken = async () => {
      if (!token) return
      try {
        const result = await verifyDownloadToken(token)
        if ('error' in result) {
          setError(result.error)
        } else {
          setData(result)
        }
      } catch (e) {
        console.error(e)
        setError('An unexpected error occurred verifying your download.')
      } finally {
        setLoading(false)
      }
    }
    checkToken()
  }, [token])

  const handleDownload = async () => {
    if (!data || isDownloading) return
    setIsDownloading(true)
    try {
      // 1. Get a fresh signed URL
      const signedUrl = await getSignedDownloadUrl(data.fileUrl)
      
      // 2. Trigger download - using a method that's less likely to be blocked
      // and handles cross-origin better by not relying solely on .download attribute
      const link = document.createElement('a')
      link.href = signedUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      // Note: .download won't work cross-origin unless CORS is set, 
      // but it doesn't hurt to keep it for same-origin cases.
      link.setAttribute('download', data.fileName)
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup with small delay to ensure trigger happened
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      
      // 3. Mark as downloaded
      await incrementDownloadCount(data.token)
      
      // 4. Update local count
      setData({ ...data, downloadCount: data.downloadCount + 1 })
      
      toast.success('Starting download...')
    } catch (e) {
      console.error(e)
      const message = e instanceof Error ? e.message : 'Failed to generate download link'
      toast.error(message)
    } finally {
      setIsDownloading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return ImageIcon
    if (['mp3', 'wav', 'aac'].includes(ext || '')) return Music
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return Video
    if (['zip', 'rar', '7z'].includes(ext || '')) return Archive
    if (ext === 'pdf') return FileText
    return FileIcon
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="font-syne font-black uppercase tracking-[0.2em] text-muted text-[10px]">Verifying Purchase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6">
           <AlertCircle className="text-red-500" size={40} />
        </div>
        <h1 className="font-syne font-black text-3xl uppercase tracking-tighter mb-4">{error}</h1>
        <p className="text-muted max-w-sm mb-8 leading-relaxed">
          The link might have expired or you've reached the maximum number of download attempts allowed for this purchase.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link to="/" className="bg-ink text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all hover:bg-orange">Contact Support</Link>
            <Link to="/" className="text-xs font-black uppercase tracking-widest text-muted hover:text-ink">Back to Lynksy</Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const Icon = getFileIcon(data.fileName)
  const remainingPercent = ((data.maxDownloads - data.downloadCount) / data.maxDownloads) * 100

  return (
    <div className="min-h-screen bg-cream selection:bg-green-500 selection:text-white flex items-center justify-center p-4 lg:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05),transparent)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl shadow-green-500/5 p-8 lg:p-16 text-center border border-cream-3 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-32 h-32 bg-green-500/10 blur-3xl rounded-full" />
        
        <div className="w-20 h-20 bg-green-500 text-white rounded-[1.75rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/20">
          <CheckCircle2 size={40} />
        </div>

        <h1 className="font-syne font-black text-3xl lg:text-4xl text-ink uppercase tracking-tighter mb-2">Purchase Verified ✓</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-12">Verified for {maskEmail(data.buyerEmail)}</p>

        {/* Download Card */}
        <div className="bg-cream-1 rounded-[2.5rem] p-8 border-2 border-green-500/10 relative group">
           <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
           
           <div className="flex flex-col items-center relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-cream-3">
                 <Icon className="text-green-500" size={32} />
              </div>
              
              <h2 className="font-syne font-black text-xl text-ink mb-1">{data.fileName}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-8">Digital Product • {formatFileSize(data.fileSize || 0)}</p>

              <button
                onClick={handleDownload}
                disabled={isDownloading || data.downloadCount >= data.maxDownloads}
                className={cn(
                  "w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                  data.downloadCount >= data.maxDownloads 
                    ? "bg-muted/20 text-muted cursor-not-allowed shadow-none"
                    : "bg-green-500 text-white shadow-green-500/20 hover:bg-green-600"
                )}
              >
                {isDownloading ? (
                   <Loader2 className="animate-spin" size={20} />
                ) : data.downloadCount >= data.maxDownloads ? (
                   'Limit Reached'
                ) : (
                   <Download size={20} />
                )}
                {isDownloading ? 'Fetching File...' : data.downloadCount >= data.maxDownloads ? 'No Downloads Left' : 'Download File'}
              </button>

              {/* Progress and expiry info */}
              <div className="w-full mt-8 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                    <span>Downloads: {data.downloadCount} / {data.maxDownloads}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full",
                        data.downloadCount >= data.maxDownloads ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    )}>
                        {data.maxDownloads - data.downloadCount} Left
                    </span>
                 </div>
                 <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-cream-3">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${remainingPercent}%` }}
                        className={cn(
                            "h-full transition-all duration-1000",
                            remainingPercent < 34 ? "bg-red-500" : remainingPercent < 67 ? "bg-amber-400" : "bg-green-500"
                        )}
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-cream-3 rounded-2xl flex items-center gap-3 text-left">
                <Clock className="text-orange" size={20} />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Expires</p>
                    <p className="text-[11px] font-bold text-ink">{format(data.expiresAt.toDate(), 'PPp')}</p>
                </div>
            </div>
            <div className="p-4 bg-white border border-cream-3 rounded-2xl flex items-center gap-3 text-left">
                <ShieldCheck className="text-blue-500" size={20} />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Safety</p>
                    <p className="text-[11px] font-bold text-ink">Verified Link</p>
                </div>
            </div>
        </div>

        <p className="mt-12 text-[10px] text-muted font-black uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
            Locked for safety. Your download link is specific to this device and browser session. <br/>
            Need help? Contact the creator or <span className="text-orange">support@lynksy.app</span>
        </p>

        <div className="mt-12 pt-12 border-t border-cream-3">
            <Link to="/" className="text-xs font-black uppercase tracking-widest text-orange hover:text-orange-hover">
                ← Go to Lynksy
            </Link>
        </div>
      </motion.div>
    </div>
  )
}

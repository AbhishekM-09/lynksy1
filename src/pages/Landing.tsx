import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Instagram, Youtube, Twitter, Linkedin, 
  Link as LinkIcon, IndianRupee, Palette, Smartphone, 
  BarChart3, Heart, Link2, ShoppingBag, ArrowUpRight, 
  X, Check, UserPlus, LayoutDashboard, Share2, 
  Languages, MessageCircle, ChevronDown, Star, FileText,
  Zap, Shield, Lock, ShoppingCart, Download, Wifi, Battery,
  Mail, MapPin, ChevronLeft, ChevronRight,
  Search, TrendingUp, Sliders, Box, Camera, Music, BookOpen,
  Video, Brush, Code, QrCode, Send, Copy, Sparkles
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SEO } from '@/components/common/SEO'
import { toast } from 'react-hot-toast'

// ─── CUSTOM CONSTANTS & TESTIMONIALS ──────────────────────────────────

const TESTIMONIALS_1 = [
  { name: "Priya Sharma", handle: "@priyacreates", tag: "Instagram • Food", text: "I made ₹24,000 in UPI tips in my very first month! Just shared my Lynksy URL in bio and fans started tipping instantly.", initials: "PS", grad: "from-pink-500 to-orange-400" },
  { name: "Arjun Mehta", handle: "@arjunvlogs", tag: "YouTube • Travel", text: "The state-wise analytics changed my strategy. I found out 68% of my viewers are from Tier-2 cities and curated custom local content for them.", initials: "AM", grad: "from-blue-500 to-cyan-400" },
  { name: "Sneha Roy", handle: "@snehastyled", tag: "Instagram • Fashion", text: "The Gemini AI wrote a profile bio in 10 seconds better than anything I could write. Incredible premium output. Absolutely love the themes!", initials: "SR", grad: "from-purple-500 to-pink-500" },
  { name: "Vikram Dutt", handle: "@vikramlive", tag: "Gaming • Live", text: "I sold my lightroom presets pack to over 400 people using my Lynksy digital store. 0% platform fee means I keep every single rupee.", initials: "VD", grad: "from-emerald-500 to-teal-400" }
]

const TESTIMONIALS_2 = [
  { name: "Meera Kapoor", handle: "@meerabakes", tag: "Instagram • Baker", text: "The regional language translate is a huge lifesaver! My Hindi-speaking audience interacts 40% more with localized labels.", initials: "MK", grad: "from-amber-400 to-orange-500" },
  { name: "Rahul Trivedi", handle: "@rahultech", tag: "YouTube • Tech", text: "Set up my custom branded domain in 5 minutes flat. Page performance is extremely rapid even on slower 4G Indian connections.", initials: "RT", grad: "from-zinc-700 to-zinc-900" },
  { name: "Divya Patel", handle: "@divyacooks", tag: "Instagram • Food", text: "Switched from Linktree and won't go back. The direct UPI tips model is super neat. Followers pay in 2 taps directly into my bank account.", initials: "DP", grad: "from-rose-400 to-pink-600" },
  { name: "Karan Singh", handle: "@karansounds", tag: "Spotify • Artist", text: "Being able to add music players, instant WhatsApp links, and UPI payments in one single dashboard makes monetizing as a musician incredibly easy.", initials: "KS", grad: "from-green-400 to-emerald-600" }
]

const FAQ_ITEMS = [
  { q: "Is Lynksy really free forever?", a: "Yes! The Free plan has no time limit. You get up to 5 links, 2 beautiful default themes, basic analytics, and limited AI tool usage permanently free, no credit card required. Only upgrade to Pro/Pro+ when you need premium custom themes and advanced monetization." },
  { q: "How does the direct UPI payment tip jar work?", a: "Under Pro and Pro+ plans, you can add an instant UPI Tip Jar. Visitors pay directly using any app like GPay, PhonePe, Paytm, or Amazon Pay in 2 taps. Payments route straight into your bank account via your custom UPI ID without middleman holding times. Both Pro and Pro+ plans feature a flat 0% zero-commission rate." },
  { q: "What is the Creator Store?", a: "Our premium store allows Pro+ creators to publish and sell high-quality digital products like PDFs, presets, templates, or eBooks. Your buyers pay via Razorpay and receive their files instantly via automatic, anti-piracy secure custom download tokens. The Pro+ plan features a flat 0% zero-commission rate!" },
  { q: "Can I connect my own custom domain?", a: "Yes! Pro+ users can hook up their own custom Web domains (e.g., yourname.com, yoursite.in) with instant configurations. We generate automated free SSL certificates and deploy pages across super-fast Cloud CDNs for stellar mobile rendering times." },
  { q: "What analytics metrics do I receive?", a: "Free tracks fundamental clicks and page views. Pro gives deep daily timeline charts and mobile vs. desktop device trends. Pro+ adds deep state-by-state heatmaps for India, comprehensive referral sources (like YouTube, WhatsApp, Instagram), hourly peak trends, and an automated weekly AI analysis report." },
  { q: "How does the built-in Gemini AI generator work?", a: "We utilize official Google Gemini SDKs server-side to generate creative profile briefs. Type a brief description of your niche, select your visual tone, and get 3 engaging bio proposals instantly. Pro grants 50 uses/mo; Pro+ provides infinite generations." },
  { q: "Can I customize my page username and handle?", a: "Absolutely. You can edit your username at any point inside your Settings dashboard. Your old lynksy.app/@old username path is released instantly so other creators can register it, so make sure to update your social bio credentials promptly." },
  { q: "What themes are supported globally?", a: "We support 22 design styles. Free users access classical Minimal & Saffron looks. Pro unlocks 8 static designs like Midnight and Ocean. Pro+ gets all 22 theme options including advanced animated Pookie themes with beautiful graphics and custom visual backdrops!" },
  { q: "What security and privacy guards do you apply?", a: "Everything runs on Google Cloud Firestore and secure Firebase OAuth servers. All user database records are protected by rules and strict encrypted connections. We never sell your personal data or tracking analytics metrics to third-party providers." },
  { q: "How do I securely upgrade my account plan?", a: "Head to your internal Creator Dashboard → Billing to review the various upgrade items. Payments are handled via secure Razorpay checkout portals. You can instantly execute UPI transfers, credit card payments, or net-banking, and premium features unlock in real-time." }
]

// ─── MAIN LANDING PAGE COMPONENT ──────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;
      if (maxScrollLeft <= 0) return;
      const progress = scrollLeft / maxScrollLeft;
      const index = Math.min(Math.round(progress * 4), 4);
      setActiveDot(index);
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    setIsCurrentlyDragging(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.scrollBehavior = 'auto'; // Disable smooth scrolling during manual drag
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      setIsCurrentlyDragging(false);
      if (scrollRef.current) {
        scrollRef.current.style.scrollBehavior = 'smooth'; // Restore smooth scroll behavior
      }
    }
  };

  const [finalEmail, setFinalEmail] = useState('')
  const [finalEmailError, setFinalEmailError] = useState('')
  const [showcaseTab, setShowcaseTab] = useState<'analytics' | 'links' | 'store'>('store')
  
  // Landing page dedicated Digital Store simulation state
  const sandboxRef = useRef<HTMLDivElement>(null)
  const [landingStoreCheckout, setLandingStoreCheckout] = useState<{ name: string; price: number; type: string } | null>(null)
  const [landingStoreStep, setLandingStoreStep] = useState<'form' | 'processing' | 'success'>('form')
  const [landingStoreEmail, setLandingStoreEmail] = useState('fan_buddy@gmail.com')
  const [landingStoreCategory, setLandingStoreCategory] = useState<string>('all')
  const [landingStoreSearch, setLandingStoreSearch] = useState('')

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalEmail) {
      setFinalEmailError('Please enter your email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(finalEmail)) {
      setFinalEmailError('Please enter a valid email address')
      return
    }
    setFinalEmailError('')
    navigate(`/signup?email=${encodeURIComponent(finalEmail)}`)
  }

  return (
    <div className="bg-cream selection:bg-orange/30 overflow-x-hidden text-zinc-900 font-sans">
      <SEO 
        title="India's Smartest Link-in-Bio Platform"
        description="Lynksy helps Indian creators consolidate content, accept direct UPI tips, and sell digital store merchandise from one single beautiful link."
        keywords="link in bio, linktree india, upi tips, creator monetization, direct upi payments, lynksy"
      />
      <Navbar />

      {/* INJECT MARQUEE AND FLOAT CSS KEYFRAMES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          display: flex;
          width: max-content;
          animation: marquee-left 35s linear infinite;
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marquee-right 32s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
        @keyframes float-p1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-p2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes float-p3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes float-p4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }
        .animate-float-1 { animation: float-p1 4s ease-in-out infinite; }
        .animate-float-2 { animation: float-p2 5s ease-in-out infinite; }
        .animate-float-3 { animation: float-p3 4.5s ease-in-out infinite; }
        .animate-float-4 { animation: float-p4 4.2s ease-in-out infinite; }
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 35px rgba(255,107,0,0.15); }
          50% { box-shadow: 0 0 55px rgba(255,107,0,0.3); }
        }
        .glow-pulse { animation: subtle-glow 3.5s infinite ease-in-out; }
      `}} />

      {/* ─── SECTION 2: HERO SECTION ────────────────────────────────── */}
      <section className="relative min-h-[95svh] flex items-center justify-center pt-36 sm:pt-44 lg:pt-48 pb-24 overflow-hidden bg-gradient-to-b from-[#06040A] via-[#090615] to-[#0A0713] text-white">
        {/* Background Decorative Cosmic Glows */}
        <div className="absolute top-[-150px] left-[-150px] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.12)_0%,transparent_70%)] pointer-events-none z-0 animate-pulse duration-5000" />
        <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)] pointer-events-none z-0" />
        <div className="absolute bottom-[-150px] left-[30%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
        
        {/* Subtle Background Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 w-full text-left">
          {/* Hero Left content block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            {/* Display Headings with custom pairings */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[4.8rem] xl:text-[5.4rem] font-black text-white leading-[1.05] tracking-tight max-w-4xl font-archivo [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] text-center lg:text-left mx-auto lg:mx-0 uppercase">
              One link for everything you create.
            </h1>

            {/* Subtitle paragraph with the elegant vertical light-gray glowing bar on the left */}
            <div className="flex items-stretch justify-center lg:justify-start gap-4 pl-1 text-center lg:text-left mx-auto lg:mx-0">
              <div className="w-[3px] bg-gradient-to-b from-[#38BDF8] to-[#EC4899] rounded-full opacity-60 shrink-0 hidden lg:block" />
              <p className="text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed font-sans">
                Create a stunning link in bio page, share everything that matters and grow your audience effortlessly.
              </p>
            </div>

            {/* Core Feature Badges (Horizontal Row Layout) */}
            <div className="grid grid-cols-2 justify-items-center justify-center sm:flex sm:flex-wrap sm:justify-center lg:justify-center gap-x-6 gap-y-4 pt-2 w-full">
              {/* Feature 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#38BDF8] flex items-center justify-center shadow-[0_4px_12px_rgba(56,189,248,0.1)] shrink-0">
                  <Link2 size={16} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white font-sans">Custom</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Link Pages</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#34D399] flex items-center justify-center shadow-[0_4px_12px_rgba(52,211,153,0.1)] shrink-0">
                  <BarChart3 size={16} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white font-sans">Advanced</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Analytics</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FB923C] flex items-center justify-center shadow-[0_4px_12px_rgba(251,146,60,0.1)] shrink-0">
                  <Palette size={16} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white font-sans">Fully</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Customizable</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.1)] shrink-0">
                  <Shield size={16} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white font-sans">Secure &</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Reliable</p>
                </div>
              </div>
            </div>

            {/* CTA Button Row closely mirroring reference uploaded screenshot */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-[#2563EB] via-[#9333EA] to-[#EC4899] hover:opacity-95 text-white font-extrabold text-[11px] px-6 py-3.5 rounded-full transition-all shadow-[0_8px_32px_rgba(139,92,246,0.35)] flex items-center justify-between gap-4 shrink-0 uppercase tracking-wider font-sans group w-full sm:w-auto"
              >
                <span>Create Your Link Page</span>
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-indigo-650 shadow-md group-hover:translate-x-1 transition-transform shrink-0">
                  <ArrowUpRight size={14} className="text-indigo-600" />
                </span>
              </button>

              <button 
                onClick={() => navigate('/examples')}
                className="bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white font-extrabold text-[11px] px-6 py-3.5 rounded-full transition-all duration-300 flex items-center justify-between gap-4 shrink-0 uppercase tracking-wider font-sans group w-full sm:w-auto"
              >
                <span>View Templates</span>
                <span className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform shrink-0">
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400 pl-[1px]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            </div>


          </motion.div>

          {/* Hero Right Mockup with Premium Custom Creator Bio Layout */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-5 flex justify-center relative w-full max-w-sm mx-auto"
          >
            {/* Cosmic Loop Orbit Background Glow lines */}
            <div className="absolute inset-0 -m-8 pointer-events-none z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-indigo-500/10 rotate-[30deg] skew-y-[12deg]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[430px] h-[430px] rounded-full border border-dashed border-pink-500/5 rotate-[45deg]" />
              <div className="absolute top-[10%] right-[-10%] w-[120px] h-[120px] bg-indigo-600/10 rounded-full blur-[80px]" />
            </div>

            {/* Handwritten Curvature Loop Arrow */}
            <div className="absolute top-[20%] left-[-28px] w-24 h-20 opacity-55 hidden xl:block select-none pointer-events-none z-10">
              <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
                <path
                  d="M 10 55 C 25 15, 55 10, 82 38 C 92 48, 95 38, 85 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 80 22 L 87 23 L 83 30"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Float Card: Total Clicks glassmorphic card */}
            <div className="absolute left-[-110px] bottom-[15%] bg-[#0f0a21]/90 border border-indigo-500/30 rounded-2xl p-4.5 w-44 backdrop-blur-md text-left shadow-[0_12px_40px_rgba(0,0,0,0.65)] select-none z-25 hidden sm:block animate-float-1">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Total Clicks</span>
              <div className="text-2xl font-black text-white mt-0.5 font-mono leading-none">12.5K</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] text-emerald-400 font-bold flex items-center">▲ 24.5%</span>
                <span className="text-[8px] text-[#A5B4FC]/60 font-medium font-sans">vs last 7 days</span>
              </div>
              
              {/* Glow wavy graph trend line */}
              <div className="mt-3.5 h-10 w-full overflow-visible">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 35 Q 20 25 40 28 T 80 12 T 100 5"
                    fill="none"
                    stroke="#EC4899"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="opacity-40 blur-sm"
                  />
                  <path
                    d="M 0 35 Q 20 25 40 28 T 80 12 T 100 5"
                    fill="none"
                    stroke="url(#sparklineGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="50%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Floating 3D Link Icon Object */}
            <div className="absolute right-[-45px] top-[14%] w-14 h-14 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#9333EA] p-[1px] shadow-[0_8px_25px_rgba(236,72,153,0.35)] flex items-center justify-center animate-float-3 z-10">
              <div className="w-full h-full rounded-full bg-[#0C071C]/90 flex items-center justify-center text-pink-400 hover:text-white transition-colors">
                <Link2 size={18} />
              </div>
            </div>

            {/* Floating 3D Rocket Object */}
            <div className="absolute right-[-35px] bottom-[18%] w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] p-[1.5px] shadow-[0_8px_25px_rgba(59,130,246,0.35)] flex items-center justify-center animate-float-4 z-10">
              <div className="w-full h-full rounded-full bg-[#030A12]/92 flex items-center justify-center text-cyan-400">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 2.5 1 4.5 2.5 6L18 4.5C16.5 3 14.5 2 12 2Z" />
                  <path d="M18 4.5 22 8.5 14.5 16H8V9.5L15.5 2Z" />
                  <path d="m16 8 2 2" />
                  <path d="m9 15-2 2" />
                </svg>
              </div>
            </div>

            {/* Phone Frame Housing */}
            <div className="relative w-[300px] h-[605px] bg-[#0c0c0e]/95 border-[8px] border-zinc-800 rounded-[38px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col pt-12 px-4 shrink-0 select-none z-10 transition-transform duration-500 hover:scale-[1.01]">
              {/* Sleek edge reflection */}
              <div className="absolute inset-y-0 left-[-40px] w-12 bg-white/[0.03] skew-x-[-15deg] pointer-events-none z-25" />
              
              {/* Physical side keys modeling */}
              <div className="absolute left-[-11px] top-24 w-[3px] h-10 bg-zinc-700 rounded-l" />
              <div className="absolute left-[-11px] top-38 w-[3px] h-10 bg-zinc-700 rounded-l" />
              <div className="absolute right-[-11px] top-28 w-[3px] h-14 bg-zinc-700 rounded-r" />

              {/* Float live pill block at topmost notches */}
              <div className="absolute top-3.5 left-4.5 z-20 flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/15 px-2.5 py-0.5 rounded-full select-none">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                <span className="text-[7.5px] font-mono text-[#34D399] font-black uppercase tracking-wider">LIVE</span>
              </div>

              {/* Notch camera island wrapper */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-black rounded-full z-20 flex items-center justify-center border border-zinc-800/10">
                <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-[#090615] rounded-full" />
                </div>
              </div>

              {/* Profile Card Header Bio details */}
              <div className="text-center shrink-0 flex flex-col items-center pt-2">
                {/* Center Image Avatar of the custom creator with gradient stroke border as shown in screenshot */}
                <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-xl relative cursor-pointer hover:scale-[1.03] transition-transform">
                  <div className="w-full h-full rounded-full bg-[#0E0C1B] border border-black flex items-center justify-center font-black text-white text-xl font-syne select-none">
                    RD
                  </div>
                  {/* Verified check badge aligned on bottom right */}
                  <span className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-[#3B82F6] text-white rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-lg" title="Verified Creator">
                    <Check size={10} className="stroke-[3.5] text-white" />
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1 mt-3">
                  <p className="text-sm font-black font-syne text-white leading-none">Rohan Dev</p>
                  <Check size={10} className="text-blue-450 stroke-[3.5]" />
                </div>
                
                <p className="text-[8.5px] text-zinc-500 font-mono mt-1 font-semibold flex items-center justify-center gap-0.5">
                  <MapPin size={9} /> Bengaluru, India
                </p>
                <p className="text-[9px] text-[#A5B4FC] font-extrabold mt-1.5 tracking-wide uppercase">Tech | Lifestyle | Content Creator</p>
                
                <p className="text-[9.5px] text-zinc-350 mt-2 px-1 leading-normal font-sans">
                  Turning ideas into content that inspires.
                </p>

                {/* Social communication linkages on rounded cards */}
                <div className="flex justify-center gap-2 mt-[11px] select-none">
                  <button onClick={() => toast.success('Demo: Youtube Link')} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200" title="Youtube Channels font-sans">
                    <Youtube size={13} />
                  </button>
                  <button onClick={() => toast.success('Demo: Instagram Link')} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200" title="Instagram Profile">
                    <Instagram size={13} />
                  </button>
                  <button onClick={() => toast.success('Demo: Twitter Link')} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200" title="Twitter Handle">
                    <Twitter size={13} />
                  </button>
                  <button onClick={() => toast.success('Demo: LinkedIn Link')} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200" title="LinkedIn Business">
                    <Linkedin size={13} />
                  </button>
                </div>
              </div>

              {/* Styled interactive Links block exactly matching the items listed in reference uploaded screenshot */}
              <div className="flex-1 mt-6 overflow-y-auto no-scrollbar space-y-2.5 pb-4">
                {[
                  { title: "Check out my new video", sub: "YouTube Link", ic: <Youtube size={12} className="text-white" />, containerBg: "bg-red-650/15 text-red-400 border-red-500/10", iconBg: "bg-red-500" },
                  { title: "My Digital Products", sub: "Store Link", ic: <ShoppingBag size={12} className="text-white" />, containerBg: "bg-purple-650/15 text-purple-400 border-purple-500/10", iconBg: "bg-purple-500" },
                  { title: "Instagram", sub: "Social Link", ic: <Instagram size={12} className="text-white" />, containerBg: "bg-pink-650/15 text-pink-400 border-pink-500/10", iconBg: "bg-pink-500" },
                  { title: "WhatsApp Me", sub: "Chat Link", ic: <MessageCircle size={12} className="text-white" />, containerBg: "bg-emerald-650/15 text-emerald-400 border-emerald-500/10", iconBg: "bg-emerald-500" },
                  { title: "Collaborations", sub: "Sponsors Link", ic: <Mail size={12} className="text-white" />, containerBg: "bg-sky-650/15 text-sky-400 border-sky-500/15", iconBg: "bg-sky-500" }
                ].map((node, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      toast.success(`Redirecting to: lynksy.app/@rohandev -> ${node.title}`);
                    }}
                    className={`p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.08] flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.iconBg}`}>
                        {node.ic}
                      </div>
                      <div className="text-left font-sans">
                        <p className="text-[10px] font-bold text-white leading-none tracking-tight font-sans">{node.title}</p>
                        <p className="text-[8px] text-zinc-400 mt-1 font-sans">{node.sub}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={11} className="text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>

              {/* Mini subtle footer credit */}
              <div className="py-2.5 text-[7px] tracking-[0.2em] text-zinc-700 uppercase font-black text-center shrink-0 font-sans flex items-center justify-center gap-1">
                <Zap size={7} className="text-zinc-700" /> powered by lynksy
              </div>
            </div>

            {/* Float bouncing arrow helper below mockup */}
            <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 opacity-30 select-none pointer-events-none animate-bounce font-sans z-20">
              <span className="text-[7px] tracking-widest uppercase font-extrabold text-white font-sans">EXPAND</span>
              <ChevronDown size={11} className="text-white" />
            </div>
          </motion.div>
        </div>
      </section>



      {/* ─── SECTION 4: HOW IT WORKS (3 STEPS) ───────────────────────── */}
      <section className="bg-[#F8F7F4] py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
            Live in under 3 minutes.
          </h2>
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto">
            Design your workspace page, add your social channels, customize presets, and share your bio web link. It's that direct.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative">
          {[
            { num: "01", icon: UserPlus, title: "1. Create Account", desc: "Build your handle in 30 seconds. Claim your secure web bio URL instantly (e.g., lynksy.app/@yourname). No payment verification loops.", label: "✓ Free Forever" },
            { num: "02", icon: LayoutDashboard, title: "2. Build Link Layout", desc: "Populate social anchors, portfolio elements, payment tips, or premium store merchandise. Refine custom graphics and theme layouts in real-time.", label: "✓ Instant phone preview" },
            { num: "03", icon: Share2, title: "3. Share & Monetize", desc: "Embed your Lynksy web link inside social handles, description boxes, and networks. Gather zero-fee UPI payments and measure traffic streams.", label: "✓ Auto analytical graphs" }
          ].map((step, idx) => (
            <div key={idx} className="relative bg-white border border-zinc-200/60 p-8 rounded-3xl hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFF3EA] flex items-center justify-center text-orange">
                    <step.icon size={22} />
                  </div>
                  <span className="font-syne font-black text-4xl text-zinc-200">{step.num}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 font-syne tracking-tight mb-2">{step.title}</h3>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{step.label}</span>
                <span className="text-[10px] font-black text-orange">STEP {step.num} →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 5: FEATURES DEEP DIVE ──────────────────────────── */}
      <section className="bg-[#FAF9F6] py-24 px-6 relative z-10 border-t border-zinc-200/40 text-center">
        <div className="max-w-4xl mx-auto space-y-4 mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
            Everything you need to share, grow & monetize.
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto font-sans leading-relaxed">
            Lynksy gives you all the tools to create stunning link pages, track performance and build your personal brand without pricing hurdles.
          </p>
        </div>

        {/* Beautiful high quality Bento Grid containing 5 customizable focus cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {/* Card 1: Custom Link Pages */}
          <div className="bg-white border border-zinc-200/50 p-7.5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Link2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-syne text-zinc-900 mb-1">Custom Link Pages</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">Create a beautiful, branded link in bio page in minutes.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Advanced Analytics */}
          <div className="bg-white border border-zinc-200/50 p-7.5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-syne text-zinc-900 mb-1">Advanced Analytics</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">Track clicks, views and audience in real-time.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Fully Customizable */}
          <div className="bg-white border border-zinc-200/50 p-7.5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-syne text-zinc-900 mb-1">Fully Customizable</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">Make it yours with themes, colors, fonts & more.</p>
              </div>
            </div>
          </div>

          {/* Card 4: Monetize Easily (2/3 width or balanced on desktop grid) */}
          <div className="bg-white border border-zinc-200/50 p-7.5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1.5">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <IndianRupee size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold font-syne text-zinc-900 mb-1">Monetize Easily</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">Sell digital products, accept tips & grow your income.</p>
              </div>
            </div>
          </div>

          {/* Card 5: Pro + Secure */}
          <div className="bg-white border border-zinc-200/50 p-7.5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300 lg:col-span-1.5">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-orange/10 text-orange flex items-center justify-center animate-pulse">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-syne text-zinc-900 mb-1">Pro + Secure</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">Powerful, fast and 100% secure platform.</p>
              </div>
            </div>
          </div>

        </div>
      </section>
      <section className="bg-[#FAF9F6] pb-24 pt-4 px-6 relative z-10 border-b border-zinc-200/30">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Description Side */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6 max-w-xl mx-auto lg:mx-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-[1.1] max-w-md mx-auto lg:mx-0">
              Charming & Beautiful Animated Themes.
            </h2>
            <p className="text-xs md:text-sm text-[#52525B] leading-relaxed max-w-sm font-sans mx-auto lg:mx-0">
              Pick from our collection of delightful sweet layouts, bubblegum vibes, and gorgeous background animations. Style your digital home perfectly.
            </p>
            <div className="flex justify-center lg:justify-start">
              <button 
                onClick={() => navigate('/examples')}
                className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-xl transition-all shadow duration-200 flex items-center gap-1.5 inline-block cursor-pointer font-sans"
              >
                Explore Templates <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Phone Slides preview exactly duplicating target mockup screens layout */}
          <div className="lg:col-span-7 w-full min-w-0 overflow-hidden space-y-3">
            {/* Scroll navigation overlay buttons */}
            <div className="flex justify-end items-center mb-1 px-1">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm hover:shadow active:scale-90 transition-all cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm hover:shadow active:scale-90 transition-all cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Swipable scroll container */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={`flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar touch-pan-x cursor-grab select-none w-full ${isCurrentlyDragging ? 'cursor-grabbing' : 'snap-x'}`}
            >
              
              {/* Phone 1: Aisha Sen (Pookie - Strawberry Milk) */}
              <div 
                className="w-[165px] md:w-[178px] h-[285px] md:h-[315px] rounded-[28px] border-4 border-zinc-900 shadow-md p-3 shrink-0 flex flex-col items-center select-none text-center relative pointer-events-none overflow-hidden snap-center"
                style={{ background: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)' }}
              >
                {/* Floating Heart & Sparkle Accents */}
                <Heart size={10} className="absolute top-2 left-3 opacity-35 text-pink-500" />
                <Heart size={10} className="absolute bottom-6 right-4 opacity-35 text-pink-500 fill-pink-500" />
                <Sparkles size={8} className="absolute top-1/2 left-2 opacity-25 text-pink-500" />
                
                <div className="w-9 h-9 rounded-full border-2 border-pink-300 mt-2 flex items-center justify-center bg-pink-100 font-bold text-pink-600 text-[10px] shadow-sm">
                  AS
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] font-black font-syne text-[#C2185B]">Aisha Sen</span>
                  <Sparkles size={8} className="text-[#E91E8C]" />
                </div>
                <span className="text-[6.5px] text-[#AD1457] font-mono mt-0.5">@aishapink</span>
                
                <div className="w-full space-y-1.5 mt-4 flex-1">
                  <div className="text-[7.5px] font-bold text-[#880E4F] bg-white/70 border border-[#FFA3B7]/40 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(255,105,140,0.06)]">
                    My Makeup Favs
                  </div>
                  <div className="text-[7.5px] font-bold text-[#880E4F] bg-white/70 border border-[#FFA3B7]/40 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(255,105,140,0.06)]">
                    Cozy Vlogs
                  </div>
                  <div className="text-[7.5px] font-bold text-[#880E4F] bg-white/70 border border-[#FFA3B7]/40 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(255,105,140,0.06)]">
                    Support My Work Box
                  </div>
                </div>
                <div className="text-[6px] text-[#E91E8C]/60 font-black font-mono mt-2 uppercase tracking-wide animate-pulse flex items-center justify-center gap-0.5">
                  <Link2 size={6} /> lynksy.app
                </div>
              </div>

              {/* Phone 2: Siddharth Roy (Pookie - Cloud Nine) */}
              <div 
                className="w-[165px] md:w-[178px] h-[285px] md:h-[315px] rounded-[28px] border-4 border-zinc-900 shadow-md p-3 shrink-0 flex flex-col items-center select-none text-center relative pointer-events-none overflow-hidden snap-center"
                style={{ background: 'linear-gradient(180deg, #E8F4FD 0%, #EDE7F6 100%)' }}
              >
                {/* Floating Sparks Background */}
                <Sparkles size={11} className="absolute top-4 right-2 opacity-30 text-blue-400" />
                <Star size={11} className="absolute bottom-10 left-3 opacity-30 text-blue-400 fill-blue-400" />
                
                <div className="w-9 h-9 rounded-full border-2 border-blue-200 mt-2 flex items-center justify-center bg-blue-50 font-bold text-blue-600 text-[10px] shadow-sm">
                  SR
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] font-black font-syne text-[#1565C0]">Siddharth Roy</span>
                  <span className="text-blue-400 text-[8px]">✓</span>
                </div>
                <span className="text-[6.5px] text-[#1976D2] font-mono mt-0.5">@siddharth_clouds</span>
                
                <div className="w-full space-y-1.5 mt-4 flex-1">
                  <div className="text-[7.5px] font-bold text-[#0D47A1] bg-white/75 border border-[#B0D8FF]/40 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(144,190,255,0.08)] flex items-center justify-center gap-1">
                    Listen to Lo-Fi <Music size={9} />
                  </div>
                  <div className="text-[7.5px] font-bold text-[#0D47A1] bg-white/75 border border-[#B0D8FF]/40 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(144,190,255,0.08)]">
                    Sponsor Podcast
                  </div>
                  <div className="text-[7.5px] font-bold text-[#0D47A1] bg-white/75 border border-[#B0D8FF]/40 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(144,190,255,0.08)]">
                    Free Notion Hub
                  </div>
                </div>
                <div className="text-[6px] text-[#42A5F5]/60 font-black font-mono mt-2 uppercase tracking-wide flex items-center justify-center gap-0.5">
                  <Link2 size={6} /> lynksy.app
                </div>
              </div>

              {/* Phone 3: Kabir Dev (Animated - Aurora Borealis) */}
              <div 
                className="w-[165px] md:w-[178px] h-[285px] md:h-[315px] rounded-[28px] border-4 border-zinc-900 shadow-md p-3 shrink-0 flex flex-col items-center select-none text-center relative pointer-events-none overflow-hidden snap-center"
                style={{ background: 'linear-gradient(135deg, #050515 0%, #0d2818 60%, #1a0d33 100%)' }}
              >
                {/* Glowing Aurora overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,220,180,0.15)_0%,transparent_60%)]" />
                <Sparkles size={10} className="absolute top-2 right-4 opacity-25 text-emerald-400" />
                
                <div className="w-9 h-9 rounded-full border-2 border-emerald-400 mt-2 flex items-center justify-center bg-black/40 font-bold text-white text-[10px] shadow-sm">
                  KD
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] font-black font-syne text-white">Kabir Dev</span>
                  <span className="text-emerald-400 text-[8px]">✓</span>
                </div>
                <span className="text-[6.5px] text-emerald-300/70 font-mono mt-0.5">@kabirtech</span>
                
                <div className="w-full space-y-1.5 mt-4 flex-1">
                  <div className="text-[7.5px] font-bold text-white bg-white/5 border border-white/10 py-1.5 rounded-full hover:border-[#6366F1]/50 backdrop-blur-md flex items-center justify-center gap-1">
                    Dev Portfolio <Code size={9} />
                  </div>
                  <div className="text-[7.5px] font-bold text-white bg-white/5 border border-white/10 py-1.5 rounded-full hover:border-[#6366F1]/50 backdrop-blur-md">
                    GitHub Workspace
                  </div>
                  <div className="text-[7.5px] font-bold text-white bg-white/5 border border-white/10 py-1.5 rounded-full hover:border-[#6366F1]/50 backdrop-blur-md">
                    Dev Newsletter
                  </div>
                </div>
                <div className="text-[6px] text-emerald-400/40 font-black font-mono mt-2 uppercase tracking-wide flex items-center justify-center gap-0.5">
                  <Link2 size={6} /> lynksy.app
                </div>
              </div>

              {/* Phone 4: Zoya Sen (Animated - Cosmic Purple) */}
              <div 
                className="w-[165px] md:w-[178px] h-[285px] md:h-[315px] rounded-[28px] border-4 border-zinc-900 shadow-md p-3 shrink-0 flex flex-col items-center select-none text-center relative pointer-events-none overflow-hidden snap-center"
                style={{ background: 'linear-gradient(135deg, #07000F 0%, #1A0033 100%)' }}
              >
                {/* Floating Cosmic Stars overlay */}
                <Sparkles size={9} className="absolute top-3 left-4 opacity-50 text-[#A855F7]" />
                <Star size={9} className="absolute bottom-8 right-3 opacity-50 text-[#A855F7] fill-[#A855F7]" />
                
                <div className="w-9 h-9 rounded-full border-2 border-[#A855F7] mt-2 flex items-center justify-center bg-[#1D082A] font-bold text-white text-[10px] shadow-sm">
                  ZS
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] font-black font-syne text-[#E9D5FF]">Zoya Sen</span>
                  <Sparkles size={8} className="text-[#A855F7]" />
                </div>
                <span className="text-[6.5px] text-[#A855F7]/80 font-mono mt-0.5">@zoyasounds</span>
                
                <div className="w-full space-y-1.5 mt-4 flex-1">
                  <div className="text-[7.5px] font-bold text-[#E9D5FF] bg-[#A855F7]/10 border border-[#A855F7]/30 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(168,85,247,0.15)]">
                    Listen on Spotify
                  </div>
                  <div className="text-[7.5px] font-bold text-[#E9D5FF] bg-[#A855F7]/10 border border-[#A855F7]/30 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(168,85,247,0.15)] flex items-center justify-center gap-1">
                    Tour Venue Tickets <FileText size={9} />
                  </div>
                  <div className="text-[7.5px] font-bold text-[#E9D5FF] bg-[#A855F7]/10 border border-[#A855F7]/30 py-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(168,85,247,0.15)]">
                    Exclusive Merch Shop
                  </div>
                </div>
                <div className="text-[6px] text-[#A855F7]/50 font-black font-mono mt-2 uppercase tracking-wide flex items-center justify-center gap-0.5">
                  <Link2 size={6} /> lynksy.app
                </div>
              </div>

              {/* Phone 5: Rohan Mehra (Pookie - Matcha Latte) */}
              <div 
                className="w-[165px] md:w-[178px] h-[285px] md:h-[315px] rounded-[28px] border-4 border-zinc-900 shadow-md p-3 shrink-0 flex flex-col items-center select-none text-center relative pointer-events-none overflow-hidden snap-center"
                style={{ background: 'linear-gradient(160deg, #F1F8E9 0%, #E8F5E9 100%)' }}
              >
                {/* Floating sage leaves */}
                <Sparkles size={10} className="absolute top-3 left-2 opacity-40 text-emerald-600" />
                <Star size={10} className="absolute bottom-6 right-3 opacity-40 text-emerald-600" />
                
                <div className="w-9 h-9 rounded-full border-2 border-[#AED581] mt-2 flex items-center justify-center bg-white font-bold text-[#2E7D32] text-[10px] shadow-sm">
                  RM
                </div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] font-black font-syne text-[#2E7D32]">Rohan Mehra</span>
                  <span className="text-[#8BC34A] text-[8px]">✓</span>
                </div>
                <span className="text-[6.5px] text-[#558B2F] font-mono mt-0.5">@rohanmatcha</span>
                
                <div className="w-full space-y-1.5 mt-4 flex-1">
                  <div className="text-[7.5px] font-bold text-[#1B5E20] bg-white/80 border border-[#8BC34A]/30 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(104,159,56,0.06)] flex items-center justify-center gap-1">
                    My Book Recs <BookOpen size={9} />
                  </div>
                  <div className="text-[7.5px] font-bold text-[#1B5E20] bg-white/80 border border-[#8BC34A]/30 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(104,159,56,0.06)]">
                    Mindful Journal
                  </div>
                  <div className="text-[7.5px] font-bold text-[#1B5E20] bg-white/80 border border-[#8BC34A]/30 py-1.5 rounded-[14px] shadow-[0_2px_8px_rgba(104,159,56,0.06)] flex items-center justify-center gap-1">
                    Support via Coffee <Heart size={9} className="fill-emerald-800 text-emerald-800" />
                  </div>
                </div>
                <div className="text-[6px] text-[#558B2F]/60 font-black font-mono mt-2 uppercase tracking-wide flex items-center justify-center gap-0.5">
                  <Link2 size={6} /> lynksy.app
                </div>
              </div>

            </div>

            {/* Slider Dots indicators exactly reflecting target design page state */}
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span 
                  key={idx}
                  className={`h-1.5 transition-all duration-300 rounded-full inline-block ${activeDot === idx ? 'w-3 bg-[#7C3AED]' : 'w-1.5 bg-zinc-300'}`} 
                />
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 6: INDIA FIRST ────────────────────────────────── */}
      <section className="bg-[#F0EDE8] py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Columns Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
              Built natively<br/>for Indian content creators.
            </h2>
            <p className="text-sm md:text-base text-zinc-600 max-w-xl">
              Most social link indexers cater strictly to foreign audiences and transaction systems. Lynksy is engineered from ground zero around direct Indian UPI architectures, native language preferences, and optimized network states.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {[
                { icon: IndianRupee, title: "UPI Direct Pay System", desc: "No Stripe logins or foreign currency setup needed. Instant direct settlements inside India's direct bank gateway." },
                { icon: Languages, title: "Regionalized Local Scripts", desc: "Connect natively with people via local localized interface styles designed for multiple languages." },
                { icon: MessageCircle, title: "Telegraph & WhatsApp First", desc: "Optimize your community outreach pipelines via custom direct messaging link anchors." },
                { icon: Smartphone, title: "Low Connectivity Performance", desc: "Under 1.2 seconds page load speeds on standard mobile connection states." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-orange/10 border border-orange/15 flex items-center justify-center text-orange shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div className="text-left font-sans">
                    <h4 className="text-sm font-bold text-zinc-900 font-syne">{item.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Columns: High Fidelity Direct Transaction Flow Graphic Card */}
          <div className="lg:col-span-5 bg-[#111111] p-8 md:p-10 rounded-3xl relative overflow-hidden text-white flex flex-col justify-between min-h-[400px]">
            {/* Watermark Rupee overlay */}
            <IndianRupee className="absolute bottom-[-40px] right-[-40px] w-64 h-64 opacity-[0.03] select-none pointer-events-none text-white" />

            <div className="space-y-4 relative z-10 text-left">
              <span className="text-[10px] font-black text-orange tracking-widest uppercase border-l-2 border-orange pl-2">Zero-commission Direct Payouts</span>
              <h3 className="text-xl md:text-2xl font-extrabold font-syne text-white tracking-tight leading-tight">Instant settlements straight to your Indian savings account.</h3>
            </div>

            {/* Step flow representation */}
            <div className="space-y-4.5 mt-8 relative z-10 text-left font-sans">
              {[
                { nr: "01", title: "Direct Tip Scan", desc: "Your fans tap support and scan your dynamic UPI QR code on our profile preview." },
                { nr: "02", title: "Instant Bank Routing", desc: "NPCI network processes the secure transition instantly, completely omitting platform holds." },
                { nr: "03", title: "Direct Credit Settlement", desc: "100% of the funds reach your local bank account instantly. No middleman fees." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-orange/10 border border-orange/20 text-orange font-bold text-xs flex items-center justify-center shrink-0">
                    {step.nr}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{step.title}</h4>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5 leading-normal">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10.5px] text-orange tracking-wide mt-6 font-semibold">✓ Supported across all standard Indian banking UPI gateways.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: LIVE DEMO / PRODUCT SHOWCASE ─────────────────── */}
      <section className="bg-[#F8F7F4] py-24 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
            Take complete control.
          </h2>
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto">
            Manage your profiles, adjust colors, audit buyer analytics, and curate link nodes from one unified cockpit dashboard.
          </p>
        </div>

        {/* Display Tabs Controls */}
        <div className="flex justify-center gap-2 max-w-xl mx-auto mb-10 overflow-x-auto pb-2 no-scrollbar text-xs font-bold whitespace-nowrap">
          {[
            { id: 'analytics', label: "Analytics Board", icon: <BarChart3 size={13} className="shrink-0" /> },
            { id: 'links', label: "Link Manager", icon: <Link2 size={13} className="shrink-0" /> },
            { id: 'store', label: "Creator Store", icon: <ShoppingBag size={13} className="shrink-0" /> }
          ].map(tb => (
            <button 
              key={tb.id} 
              onClick={() => setShowcaseTab(tb.id as 'analytics' | 'links' | 'store')}
              className={`px-5 py-3 rounded-full transition-all border duration-200 flex items-center justify-center gap-1.5 ${showcaseTab === tb.id ? 'bg-[#111111] text-white border-zinc-900 shadow' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}`}
            >
              {tb.icon}
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* Layout Browser Chrome Shell representing full Dashboard Mockup */}
        <div className="max-w-5xl mx-auto bg-[#111111] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col text-left">
          {/* Mock Browser Header Bar */}
          <div className="bg-zinc-950 p-4 border-b border-zinc-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-500 rounded-full px-12 py-1 flex items-center gap-1.5 min-w-0 truncate select-all">
              <span>lynksy.app/dashboard/</span>
              <span className="text-white font-bold">{showcaseTab}</span>
            </div>
            <span className="w-4 h-4 invisible" />
          </div>

          <div className="grid md:grid-cols-4 min-h-[350px]">
            {/* Sidebar Mockup (Minified on mobile) */}
            <div className="bg-zinc-950 border-r border-zinc-900 p-5 space-y-6 hidden md:block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="font-syne font-black text-white tracking-tight block text-sm normal-case">Lynksy.</span>
              <div className="space-y-3.5 pt-4">
                <div className={`p-2 rounded-lg flex items-center gap-2 ${showcaseTab === 'analytics' ? 'bg-orange/10 text-orange font-bold' : ''}`}><BarChart3 size={12} /> Analytics</div>
                <div className={`p-2 rounded-lg flex items-center gap-2 ${showcaseTab === 'links' ? 'bg-orange/10 text-orange font-bold' : ''}`}><Link2 size={12} /> Link Creator</div>
                <div className={`p-2 rounded-lg flex items-center gap-2 ${showcaseTab === 'store' ? 'bg-orange/10 text-orange font-bold' : ''}`}><ShoppingBag size={12} /> Creator Store</div>
                <div className="p-2 rounded-lg flex items-center gap-2 hover:text-white transition-colors cursor-not-allowed"><Palette size={12} /> Styles</div>
              </div>
            </div>

            {/* Showcase Main Section representation */}
            <div className="md:col-span-3 bg-zinc-900 p-6 md:p-8 text-white relative flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {showcaseTab === 'analytics' && (
                  <motion.div key="analytics" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-bold font-syne">Realtime Metrics Dashboard</h4>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">● CAPTURING STREAM</span>
                    </div>
                    {/* Mock Graph Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                      {[
                        { l: "Visitor Count", v: "14,841", c: "+14%" },
                        { l: "Tip Conversions", v: "842 Clicks", c: "+22%" },
                        { l: "Page CTR Rate", v: "8.45%", c: "Optimal" },
                        { l: "Earnings Dispatched", v: "₹42,850", c: "Disbursed" }
                      ].map((card, i) => (
                        <div key={i} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                          <p className="text-[8.5px] text-zinc-500 uppercase font-black tracking-widest">{card.l}</p>
                          <p className="text-base font-bold mt-1 font-mono">{card.v}</p>
                          <span className="text-[8px] text-emerald-400 mt-1.5 block">{card.c}</span>
                        </div>
                      ))}
                    </div>
                    {/* India State Analytics */}
                    <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-orange">India State Traffic Split (Tier Breakdown)</p>
                      <div className="space-y-1.5 pt-2 text-[10.5px] font-mono">
                        <div>
                          <div className="flex justify-between text-zinc-400 mb-1"><span>Maharashtra</span><span>42% • Mumbai / Pune</span></div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="w-[42%] h-full bg-orange" /></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-zinc-400 mb-1"><span>Karnataka</span><span>28% • Bengaluru / Mysuru</span></div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="w-[28%] h-full bg-orange" /></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showcaseTab === 'links' && (
                  <motion.div key="links" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-bold font-syne">Drag & Sort Link Nodes</h4>
                      <Link to="/signup" className="text-[10px] bg-orange hover:bg-orange-hover px-3 py-1.5 rounded-full text-white font-bold transition-colors">Add Custom Node +</Link>
                    </div>
                    {/* Mock Sort List */}
                    <div className="space-y-2 max-w-xl text-[11.5px] font-semibold">
                      {[
                        { title: "Latest YouTube Travel Vlog - Sikkim Roadtrip", cl: "4.8K Hits", on: true },
                        { title: "Direct Creator Lightroom Presets Store URL", cl: "1.2K Hits", on: true },
                        { title: "Support my artwork - direct UPI Tips Jar portal", cl: "921 Paid", on: true }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 px-4 py-3 border border-zinc-800 rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-700 cursor-grab font-mono font-black text-sm">⋮⋮</span>
                            <div>
                              <p className="text-white font-bold">{item.title}</p>
                              <span className="text-[8px] text-zinc-500 font-mono mt-0.5 block">{item.cl}</span>
                            </div>
                          </div>
                          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${item.on ? 'bg-orange' : 'bg-zinc-800'}`}>
                            <div className="w-3.5 h-3.5 bg-white rounded-full translate-x-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {showcaseTab === 'store' && (
                  <motion.div key="store" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-bold font-syne">Instant Creator Merchandise Shop</h4>
                      <span className="text-[10px] bg-[#7C3AED]/20 text-[#C084FC] px-3 py-1 rounded-full border border-[#7C3AED]/30 font-semibold font-mono">0% COMMISSIONS BILLINGS</span>
                    </div>
                    {/* Store logs table */}
                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="grid grid-cols-4 bg-zinc-950 p-2 text-zinc-500 font-extrabold uppercase text-[8.5px] tracking-wider rounded-lg">
                        <span>Merchandise</span><span>Status</span><span>Sales metrics</span><span>Earnings</span>
                      </div>
                      {[
                        { n: "Preset Collection Vol 1", s: "Active", sl: "194 Downloads", e: "₹58,006" },
                        { n: "Creator eBook Guide.pdf", s: "Active", sl: "411 Downloads", e: "₹40,689" },
                        { n: "Overlays Asset Pack", s: "Pending Files", sl: "0 Sales", e: "₹0" }
                      ].map((it, i) => (
                        <div key={i} className="grid grid-cols-4 p-2 bg-zinc-950/40 border border-zinc-800/40 rounded-lg items-center">
                          <span className="text-white font-bold font-sans truncate pr-1">{it.n}</span>
                          <span className={it.s === 'Active' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{it.s}</span>
                          <span className="text-zinc-400">{it.sl}</span>
                          <span className="text-orange font-bold font-mono">{it.e}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="p-3 bg-zinc-950 border border-zinc-800 text-[10.5px] text-zinc-500 rounded-xl flex items-center justify-between gap-4 mt-6">
                <span className="flex items-center gap-1.5"><Zap size={12} className="text-orange" /> Setup Razorpay APIs and direct UPI Tip anchors instantaneously.</span>
                <Link to="/signup" className="text-white font-bold underline shrink-0 hover:text-orange">Create Store Now →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7B: DEDICATED CREATOR STORE ─────────────────────── */}
      <section className="bg-[#FAF9F5] relative py-28 px-6 overflow-hidden border-t border-zinc-200/50 z-10 text-left">
        {/* Modern decorative backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
        <div className="absolute -top-24 -left-20 w-[450px] h-[450px] bg-orange/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-[#7C3AED]/3 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Subheader */}
          <div className="max-w-3xl mx-auto text-center space-y-5 mb-16 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-extrabold font-syne text-zinc-900 tracking-tight leading-tight text-center animate-fade-in">
              Sell digital products.<br />
              <span className="bg-gradient-to-r from-orange to-[#7C3AED] bg-clip-text text-transparent underline decoration-orange/20">Keep 100% of your earnings.</span>
            </h2>
            <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto leading-relaxed text-center">
              No middleman escrows, payment thresholds, or hidden deductions. Sell preset libraries, guidebooks, custom boards, or raw source packages with automated link dispatches. UPI settlements land instantly in your bank account.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* Top: Digital Store - Ananya Sen's Store card (Full Width) */}
            <div className="bg-gradient-to-b from-white to-[#FDFCFA] border border-zinc-200/80 rounded-[36px] p-6 lg:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] text-left relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange/10 to-transparent pointer-events-none rounded-full blur-3xl" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar with verified badge marker helper */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-purple-600 p-[2px] shadow-sm hover:rotate-3 transition-transform duration-300">
                      <div className="w-full h-full bg-[#F3F4F6] rounded-[14px] flex items-center justify-center font-black text-zinc-900 text-base font-sans select-none">
                        AS
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Verified Creator">
                      <Check size={10} className="stroke-[3.5]" />
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black font-syne text-zinc-900 tracking-tight">Ananya Sen's Store</h4>
                      <span className="text-[8px] bg-orange/10 text-orange font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-orange/15 font-mono">PRO</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 font-semibold">@ananya_design • Digital Goods Shop</p>
                  </div>
                </div>
              </div>

              {/* Digital Showcase catalogue Header */}
              <div className="pt-6 border-t border-zinc-150/80 flex flex-col gap-6 w-full">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-zinc-800" size={20} />
                  <h2 className="text-xl font-black text-zinc-900 font-syne uppercase tracking-tight">All Products</h2>
                </div>

                {/* Filters and Search/Sorting Row styling */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left: Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100/60 border border-zinc-200/50 rounded-2xl w-fit">
                    {[
                      { id: 'all', n: 'ALL' },
                      { id: 'preset', n: 'PRESET' },
                      { id: 'ebook', n: 'EBOOK' },
                      { id: 'audio', n: 'AUDIO' },
                      { id: 'course', n: 'COURSE' },
                      { id: 'art', n: 'ART / CREATIVE' },
                      { id: 'template', n: 'TEMPLATE' },
                      { id: 'other', n: 'OTHER' }
                    ].map((tab) => {
                      const isActive = landingStoreCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setLandingStoreCategory(tab.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-250 ${
                            isActive
                              ? 'bg-[#5856D6] text-white shadow-md'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          {tab.n}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right: Search & Sorting selector */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={landingStoreSearch}
                        onChange={(e) => setLandingStoreSearch(e.target.value)}
                        className="pl-9 pr-3.5 py-2 w-full bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-zinc-400 transition"
                      />
                    </div>

                    <div className="relative inline-flex items-center w-full sm:w-auto">
                      <select 
                        disabled
                        className="appearance-none bg-white border border-zinc-200 rounded-full pl-4.5 pr-9 py-2 w-full sm:w-auto text-xs font-bold text-zinc-700 outline-none cursor-default"
                      >
                        <option>Newest</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                    </div>
                  </div>
                </div>

                {/* Curated Grid of products showcasing various digital product formats (Smaller Compact Card Sizes!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-5 pt-2">
                  {[
                    {
                      id: 'sunset-lut',
                      name: 'Sunset Bliss Presets Pack',
                      price: 199,
                      tag: 'PRESET / FILTER',
                      category: 'preset',
                      desc: 'Warm pastel aesthetic Lightroom Mobile & Desktop LUT filters.',
                      rating: '4.9',
                      sales: '1.2k SOLD',
                      bg: '#FFF0EA',
                      status: 'LIVE',
                      iconName: 'Camera',
                      iconColor: 'text-orange',
                    },
                    {
                      id: 'lofi-audio',
                      name: 'Lofi Chill Hop Sessions',
                      price: 299,
                      tag: 'AUDIO / SOUND',
                      category: 'audio',
                      desc: '10 premium royalty-free ambient background audio loops for streams.',
                      rating: '4.8',
                      sales: '350 SOLD',
                      bg: '#F5EFFF',
                      status: 'LIVE',
                      iconName: 'Music',
                      iconColor: 'text-purple-600',
                    },
                    {
                      id: 'blueprint-pdf',
                      name: 'Link-in-Bio Secret Blueprint Guide',
                      price: 399,
                      tag: 'PDF / GUIDE',
                      category: 'ebook',
                      desc: 'Pre-made scalable brand pitching templates and sponsorship spreadsheets.',
                      rating: '4.9',
                      sales: '1.4k SOLD',
                      bg: '#FFFBF0',
                      status: 'LIVE',
                      iconName: 'FileText',
                      iconColor: 'text-amber-600',
                    }
                  ].filter(p => {
                    const matchesCategory = landingStoreCategory === 'all' || p.category === landingStoreCategory;
                    const matchesSearch = p.name.toLowerCase().includes(landingStoreSearch.toLowerCase()) || 
                                          p.desc.toLowerCase().includes(landingStoreSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).map((prod) => {
                    return (
                      <div 
                        key={prod.id}
                        onClick={() => {
                          setLandingStoreCheckout({ name: prod.name, price: prod.price, type: prod.tag });
                          setLandingStoreStep('form');
                          if (sandboxRef.current) {
                            sandboxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                          toast.success(`Selected "${prod.name}" for checkout simulation!`);
                        }}
                        className="bg-white rounded-3xl border border-zinc-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.012)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:border-orange/25 transition-all duration-300 flex flex-col overflow-hidden text-left relative group cursor-pointer active:scale-[0.99] select-none"
                      >
                        {/* Top Preview Stage (Smaller & Use Lucide icons instead of Emoji!) */}
                        <div 
                          className="h-32 w-full flex items-center justify-center relative rounded-t-[22px]"
                          style={{ backgroundColor: prod.bg }}
                        >
                          {/* Pill label */}
                          <div className="absolute top-3.5 left-3.5 bg-zinc-800/10 text-zinc-700 backdrop-blur-md text-[8px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-sans">
                            {prod.tag}
                          </div>

                          {/* Lucide Icon Center */}
                          <div className={`${prod.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                            {(() => {
                              const getProductIcon = (iconName: string) => {
                                switch (iconName) {
                                  case 'Box': return Box;
                                  case 'Sliders': return Sliders;
                                  case 'Camera': return Camera;
                                  case 'Music': return Music;
                                  case 'FileText': return FileText;
                                  case 'BookOpen': return BookOpen;
                                  case 'Video': return Video;
                                  case 'Brush': return Brush;
                                  case 'Code': return Code;
                                  default: return Box;
                                }
                              };
                              const IconComp = getProductIcon(prod.iconName);
                              return <IconComp size={30} className="stroke-[1.75]" />;
                            })()}
                          </div>

                          {/* Status Badge */}
                          <div className={`absolute bottom-3.5 left-3.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            prod.status === 'LIVE' ? 'bg-[#00C853] text-white' : 'bg-zinc-850 text-white'
                          }`}>
                            {prod.status}
                          </div>
                        </div>

                        {/* Bottom card content (Smaller Compact padding and layout) */}
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-extrabold text-zinc-900 text-xs md:text-sm leading-tight transition-colors group-hover:text-orange">
                            {prod.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 font-medium mt-1 min-h-[1.375rem] line-clamp-2">
                            {prod.desc}
                          </p>

                          <div className="h-[1px] bg-zinc-150/80 my-3" />

                          {/* Star Ratings & Sold counts mockup rows */}
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400/80 mb-3 px-0.5 font-sans">
                            <span className="flex items-center gap-1">
                              <Star size={10} className="fill-zinc-400 text-zinc-400" /> {prod.rating}
                            </span>
                            <span className="flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-150 font-mono text-[8px]">
                              <Download size={10} className="text-zinc-400" /> {prod.sales}
                            </span>
                          </div>

                          {/* Price Row details and absolute nonclickable button element */}
                          <div className="flex items-center justify-between mt-auto pt-1">
                            <span className="text-lg font-black text-[#5856D6] font-syne">
                              ₹{prod.price}
                            </span>
                            <button
                              type="button"
                              className="text-[9px] font-sans font-black uppercase tracking-widest px-3.5 py-2 rounded-lg bg-[#5856D6] hover:bg-orange text-white shadow-sm transition-all"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange/[0.04] to-purple-500/[0.04] border border-orange/15 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div className="flex items-start gap-3 text-[11px] text-zinc-700 text-left">
                  <Shield size={16} className="text-orange shrink-0 mt-0.5" />
                  <span className="font-semibold leading-normal">Direct Settlement Guard active. Zero platform commission gets deducted. Direct UPI to bank transfer.</span>
                </div>
                <Link to="/signup" className="text-xs bg-orange hover:bg-orange-hover text-white px-4.5 py-2.5 rounded-xl font-bold uppercase shrink-0 transition-colors text-center shadow-md shadow-orange/10">Setup Store</Link>
              </div>
            </div>

            {/* Bottom: Store Live Simulation Section (UPI Sandbox & Skip Stripe features side-by-side) */}
            <div ref={sandboxRef} className="scroll-mt-24 pt-8 border-t border-zinc-200/50">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
                <h3 className="text-2xl md:text-3xl font-extrabold font-sans text-zinc-900 tracking-tight leading-tight">
                  Checkout Experience Live Simulation
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
                  Try the checkout flow for yourself! Select any of Ananya's packages above to load the secure direct UPI tip engine simulator below.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                
                {/* Simulated Mobile Device with UPI payment process */}
                <div className="lg:col-span-5 space-y-4 max-w-md mx-auto w-full">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange rounded-full animate-pulse" />
                      UPI Sandbox Console
                    </span>
                    <span className="text-[9px] bg-neutral-200/85 text-neutral-700 border border-neutral-300 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      LIVE SIMULATOR
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {landingStoreCheckout ? (
                      <motion.div
                        key="checkout"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.07)] text-zinc-900 relative overflow-hidden"
                      >
                        <span className="absolute bottom-[-30px] right-[-35px] text-[160px] opacity-[0.04] select-none pointer-events-none text-orange font-black">₹</span>

                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100">
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                            <Wifi size={10} className="text-zinc-450" />
                            <span>5G LTE</span>
                          </div>
                          <div className="w-20 h-4 bg-zinc-50 rounded-full border border-zinc-200 flex items-center justify-center text-[7.5px] text-zinc-500 font-mono">
                            <span>● Simulator</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                            <span>98%</span>
                            <Battery size={12} className="text-emerald-500" />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-start border-b border-zinc-100 pb-5">
                          <div>
                            <span className="text-[8px] bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{landingStoreCheckout.type}</span>
                            <h4 className="text-sm font-black font-sans mt-2 text-zinc-900 leading-tight">{landingStoreCheckout.name}</h4>
                          </div>
                          <button 
                            onClick={() => {
                              setLandingStoreCheckout(null);
                              setLandingStoreStep('form');
                            }}
                            className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 p-1.5 rounded-full transition-colors shrink-0"
                            title="Close simulation"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {landingStoreStep === 'form' && (
                          <div className="pt-6 space-y-5">
                            <div className="bg-orange/5 border border-orange/15 rounded-2xl p-4 flex items-start gap-2.5">
                              <Smartphone size={15} className="text-orange shrink-0 mt-0.5 animate-pulse" />
                              <p className="text-[10.5px] text-zinc-600 leading-normal text-left">
                                Test active payouts direct bank settlements. Enter an email to verify sandbox dispatch.
                              </p>
                            </div>
                            
                            <div className="space-y-2 text-left">
                              <label className="text-[8px] font-black uppercase tracking-widest text-orange block">Buyer Email Address</label>
                              <input 
                                type="email" 
                                value={landingStoreEmail}
                                onChange={(e) => setLandingStoreEmail(e.target.value)}
                                placeholder="buyer@example.com"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-orange outline-none transition-all font-semibold focus:ring-4 focus:ring-orange/10 font-sans"
                              />
                            </div>

                            <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-xl flex items-center justify-between">
                              <span className="text-xs text-zinc-500 font-semibold">Price:</span>
                              <span className="text-base font-black text-zinc-900 font-mono flex items-center gap-0.5">
                                <IndianRupee size={11} className="text-orange" />
                                {landingStoreCheckout.price}.00
                              </span>
                            </div>

                            <button
                              onClick={async () => {
                                setLandingStoreStep('processing');
                                await new Promise(r => setTimeout(r, 1600));
                                setLandingStoreStep('success');
                              }}
                              className="w-full py-3 bg-orange hover:bg-orange-hover text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_12px_28px_-6px_rgba(99,102,241,0.25)] active:scale-[0.98]"
                            >
                              <IndianRupee size={12} /> Settle with UPI Simulator
                            </button>
                          </div>
                        )}

                        {landingStoreStep === 'processing' && (
                          <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="flex items-center justify-center">
                              <svg className="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                                 <circle className="spinner-path" fill="none" strokeWidth="6" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
                              </svg>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs font-extrabold text-zinc-900 font-sans">Routing peer-to-peer UPI transfer...</p>
                              <p className="text-[9.5px] text-zinc-500">Direct instant settlement. Commission cut: 0% loss.</p>
                            </div>
                          </div>
                        )}

                        {landingStoreStep === 'success' && (
                          <div className="pt-2 space-y-4 text-center">
                            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                              <Check size={18} className="stroke-[3]" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black font-sans text-zinc-900">Transaction Succeeded!</h4>
                              <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
                                The file delivery bundle was dispatched to <strong className="text-orange font-bold font-mono">{landingStoreEmail}</strong>.
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                toast.success(`Downloaded simulated bundle of "${landingStoreCheckout.name}"`);
                              }}
                              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-805 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-200"
                            >
                              <Download size={12} className="text-orange" /> Download Package (.zip)
                            </button>

                            <div className="bg-zinc-50 text-left rounded-xl border border-zinc-200 text-[10px]">
                              <div className="bg-zinc-100 px-3 py-1.5 border-b border-zinc-200 flex justify-between items-center font-mono">
                                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">UPI RECEIPT</span>
                                <span className="text-[8px] text-emerald-600 font-bold">SETTLED</span>
                              </div>
                              <div className="p-3 space-y-1 font-mono text-zinc-500">
                                <div className="flex justify-between">
                                  <span>ID:</span>
                                  <span className="text-zinc-800">LKR-STORE-58A2B9</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Commission:</span>
                                  <span className="text-emerald-600 font-bold">0% (₹0)</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setLandingStoreCheckout(null);
                                setLandingStoreStep('form');
                              }}
                              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-semibold transition-all"
                            >
                              Simulate another purchase
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle-sandbox"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white border border-zinc-200 p-8 rounded-[32px] text-center text-zinc-500 flex flex-col items-center justify-center min-h-[300px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4 text-[#5856D6]">
                          <ShoppingCart size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">Sandbox Idle</h4>
                        <p className="text-[11px] text-zinc-500 mt-2 text-center max-w-[220px] leading-relaxed">
                          Click "Buy Now" on any product in Ananya's catalogue above to simulate live checkout settlements instantly.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Left/Right features layout: "Skip Stripe configurations. Settle locally in 2 taps." */}
                <div className="lg:col-span-7 text-left space-y-6">
                  <div className="p-6 md:p-8 bg-white border border-zinc-200 rounded-3xl text-left text-zinc-900 relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)]">
                    <div className="absolute bottom-[-45px] right-[-35px] opacity-[0.015] select-none pointer-events-none text-[#7C3AED]">
                      <ShoppingCart size={240} className="stroke-[1]" />
                    </div>

                    <h3 className="text-lg md:text-xl font-extrabold font-sans text-zinc-900 leading-tight">Skip complicated setup procedures. Direct UPI Payouts.</h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      Most social catalog page builders rely on foreign setups with multi-day payout holds and hefty transaction fees. Lynksy establishes high-performance local shop layers connected to your own banking QR setup instantly.
                    </p>

                    <div className="space-y-5 pt-6 text-left">
                      {[
                        { icon: Shield, title: "Automated Digital Dispatches", desc: "Buyers immediately receive highly secure temporary download tokens in their inbox the second NPIC clears the settlement." },
                        { icon: Zap, title: "Pay-What-You-Want Support Mode", desc: "Configure threshold payouts allowing passionate supporters to specify custom tip bounds during checkout." },
                        { icon: Lock, title: "Anti-Leak Link Protections", desc: "Set automatic download link limits by total click count or active expiry hours to safeguard your valuable intellectual products." }
                      ].map((feat, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                          <div className="w-8.5 h-8.5 rounded-xl bg-orange/15 border border-orange/20 text-orange flex items-center justify-center shrink-0 group-hover:bg-orange group-hover:text-white transition-all duration-300">
                            <feat.icon size={14} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-zinc-800 group-hover:text-zinc-900 transition-colors">{feat.title}</h4>
                            <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-normal">{feat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-150 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium font-sans">Setup in under 2 minutes.</span>
                      <Link to="/signup" className="text-orange text-[11px] font-extrabold flex items-center gap-1.5 group font-sans uppercase tracking-wider">
                        Sign up instantly <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7C: PREMIUM CREATOR POWER UTILITIES ─────────────────── */}
      <section className="bg-gradient-to-b from-[#f4f4f6] to-white py-28 px-6 relative z-10 text-zinc-900 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-black font-syne tracking-tight leading-none text-zinc-900 uppercase select-text">
              Premium Creator Engines
            </h2>
            <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Powerful built-in features including direct UPI tipping, live audience email lists, and custom shortened links to supercharge your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* CARD 1: INSTANT UPI TIP ENGINE */}
            <div id="upi-tip-builder-card" className="bg-white border border-zinc-200 rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden h-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] text-zinc-900">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange/10 border border-orange/20 text-orange flex items-center justify-center">
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-sans text-zinc-900 uppercase leading-none">UPI Tipping</h3>
                      <span className="text-[11px] text-zinc-500 mt-1 block">commission-free fan support</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">0% GATEWAY FEES</span>
                </div>

                <div className="h-[1px] bg-zinc-200" />

                <div className="space-y-4.5 pointer-events-none opacity-90">
                  {/* Amount Preset buttons */}
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Select Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['20', '100', '250'].map(val => (
                        <div
                          key={val}
                          className="py-2 px-1 text-center rounded-xl text-xs font-bold bg-zinc-50 border border-zinc-200 text-zinc-600 font-mono"
                        >
                          ₹{val}
                        </div>
                      ))}
                      <div className="py-2 px-1 text-center rounded-xl text-xs font-bold bg-orange text-white border border-orange font-mono">
                        ₹50
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Custom Amount</label>
                      <input
                        type="text"
                        disabled
                        value="₹50"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Creator Identifier</label>
                      <input
                        type="text"
                        disabled
                        value="Rohan Dev"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Support Message</label>
                      <textarea
                        rows={2}
                        disabled
                        value="Thanks for the awesome content!"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-700 resize-none font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full bg-orange text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 pointer-events-none cursor-default"
                  >
                    <QrCode size={13} /> Generate QR Tipping Code
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4.5 mt-8 flex items-center justify-between text-[11px] font-sans font-medium text-zinc-400">
                <span>0% third-party gateway cuts</span>
                <span>Direct Bank Transfer</span>
              </div>
            </div>

            {/* CARD 2: LEAD COLLECTION & FAN DATABASE */}
            <div id="leads-collection-card" className="bg-white border border-zinc-200 rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden h-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] text-zinc-900">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-600/20 text-purple-600 flex items-center justify-center">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-sans text-zinc-900 uppercase leading-none">Fan Leads</h3>
                      <span className="text-[11px] text-zinc-500 mt-1 block">Live subscriber database</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-purple-50 text-purple-600 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">INTEGRATED</span>
                </div>

                <div className="h-[1px] bg-zinc-200" />

                <div className="space-y-4 pointer-events-none opacity-90">
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Subscriber Name</label>
                      <input
                        type="text"
                        disabled
                        placeholder="John Doe"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-bold placeholder-zinc-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Email Address</label>
                      <input
                        type="email"
                        disabled
                        placeholder="john.doe@example.com"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-bold placeholder-zinc-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 pointer-events-none cursor-default"
                  >
                    <Send size={13} /> Subscribe & Store Lead
                  </button>
                </div>

                {/* Simulated Recent database display but light themed and static */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3 text-zinc-700 pointer-events-none select-none">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black tracking-widest text-[#7C3AED] uppercase flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
                      Live Feed Mockup
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10.5px] font-mono">
                    <div className="flex justify-between items-center bg-white border border-zinc-200/60 rounded-lg p-2">
                      <span className="text-zinc-800 font-bold">Subscriber #1</span>
                      <span className="text-[#7C3AED] font-bold">sub***@example.com</span>
                    </div>
                    <div className="flex justify-between items-center bg-white border border-zinc-200/60 rounded-lg p-2">
                      <span className="text-zinc-800 font-bold">Subscriber #2</span>
                      <span className="text-[#7C3AED] font-bold">fan***@example.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4.5 mt-8 flex items-center justify-between text-[11px] font-sans font-medium text-zinc-400">
                <span>Stored within active firestore</span>
                <span>Simultaneous synchronization</span>
              </div>
            </div>

            {/* CARD 3: LINK SHORTENER STUDIO */}
            <div id="link-shortener-card" className="bg-white border border-zinc-200 rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden h-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] text-zinc-900">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-sans">
                      <LinkIcon size={18} className="text-[#7C3AED]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-sans text-zinc-900 uppercase leading-none">Short Links</h3>
                      <span className="text-[11px] text-zinc-500 mt-1 block">Live alias dispatcher engine</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">ACTIVE LINKER</span>
                </div>

                <div className="h-[1px] bg-zinc-200" />

                <div className="space-y-4 pointer-events-none opacity-90">
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Target Long URL</label>
                      <input
                        type="text"
                        disabled
                        value="instagram.com/my_profile"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Custom Alias (Optional)</label>
                      <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 font-sans">
                        <span className="text-zinc-400 font-mono text-xs tracking-tight">lynksy.app/</span>
                        <input
                          type="text"
                          disabled
                          value="my-social"
                          className="flex-1 bg-transparent border-none py-1.5 px-1 text-xs text-zinc-800 font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full bg-[#7C3AED] text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 pointer-events-none cursor-default"
                  >
                    <Sparkles size={13} /> Shorten Target URL
                  </button>
                </div>

                {/* Successful Redirection mockup output block - light themed and static */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4.5 space-y-3 text-center text-zinc-700 pointer-events-none select-none">
                  <p className="text-[10px] text-zinc-500 font-bold block">Generated Shortlink Mockup</p>
                  
                  <div className="bg-white border border-zinc-200 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-[11px] font-sans font-bold text-zinc-900 truncate">
                      lynksy.app/my-social
                    </span>
                    <div className="w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400">
                      <Copy size={12} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4.5 mt-8 flex items-center justify-between text-[11px] font-sans font-medium text-zinc-400">
                <span>Tested redirections allowed</span>
                <span>Global endpoint routers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 8: PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="bg-[#111111] py-24 px-6 relative z-10 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-white tracking-tight leading-none">
            Simple flat pricing. Zero surprises.
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto">
            Choose a plan that fits your creator stage. Secure transactions processed without high middleman fees.
          </p>
        </div>

        {/* 3 Pricing cards grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-stretch pt-4">
          {/* FREE PLAN */}
          <div className="bg-zinc-900 border border-zinc-800/80 p-8 rounded-3xl flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-xs font-extrabold tracking-widest text-zinc-500 uppercase">FREE STARTER</span>
              <h3 className="text-3xl font-black font-syne">₹0</h3>
              <p className="text-xs text-white/45 leading-relaxed">Perfect layout to structure fundamental social redirects.</p>
              <div className="h-[1px] bg-zinc-800/80" />
              <ul className="space-y-3.5 text-xs text-white/60 text-left font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Up to 5 active links</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> 2 basic theme templates</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Standard Indian fonts</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Basic analytics (7 days)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> WhatsApp button integration</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Limited AI tool usage</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Lynksy branding tag</li>
                <li className="flex items-center gap-2 text-white/20"><X size={14} className="shrink-0" /> Remove Lynksy branding</li>
                <li className="flex items-center gap-2 text-white/20"><X size={14} className="shrink-0" /> Accept UPI tips (Tip Jar)</li>
                <li className="flex items-center gap-2 text-white/20"><X size={14} className="shrink-0" /> Lead collection (Email list)</li>
                <li className="flex items-center gap-2 text-white/20"><X size={14} className="shrink-0" /> Sell digital products (Shop)</li>
              </ul>
            </div>
            <Link to="/signup" className="mt-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase text-center rounded-xl transition-all font-sans block">Get Started Free</Link>
          </div>

          {/* PRO PLAN */}
          <div className="bg-white border-2 border-orange p-8 rounded-3xl text-zinc-900 transform md:scale-[1.03] flex flex-col justify-between shadow-2xl relative">
            <span className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-orange text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 justify-center">
              <Star size={8} className="fill-white text-white" /> RECOMMENDED PACK
            </span>
            <div className="space-y-6">
              <span className="text-xs font-extrabold tracking-widest text-orange uppercase block">PRO CREATOR</span>
              <h3 className="text-3xl font-black font-syne text-zinc-900">
                ₹199<span className="text-xs text-zinc-500 font-medium">/mo</span>
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Perfect configuration to expand creator identity and accept UPI Tips.</p>
              <div className="h-[1px] bg-zinc-200" />
              <ul className="space-y-3.5 text-xs text-zinc-600 text-left font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Unlimited active links</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> 8 premium theme templates</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Advanced analytics (30 days)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Remove Lynksy branding</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Accept UPI tips (0% fee)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Lead collection (Email list)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> 50 AI generations / mo</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Custom link thumbnails</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Priority email support</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Sell digital products (Up to 10)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-orange shrink-0" /> Digital Store Platform Fee: 0%</li>
                <li className="flex items-center gap-2 text-zinc-350"><X size={14} className="shrink-0" /> Custom branded domain</li>
              </ul>
            </div>
            <Link to="/signup?plan=PRO" className="mt-8 py-3.5 bg-orange hover:bg-orange-hover text-white text-xs font-black uppercase text-center rounded-xl transition-all font-sans block shadow-md">Upgrade Pro Portal</Link>
          </div>

          {/* PRO+ PLAN */}
          <div className="bg-purple-900/10 border border-purple-500/40 p-8 rounded-3xl flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-xs font-extrabold tracking-widest text-purple-400 uppercase">PRO+ CREATOR</span>
              <h3 className="text-3xl font-black font-syne text-purple-300">
                ₹399<span className="text-xs text-white/45 font-medium">/mo</span>
              </h3>
              <p className="text-xs text-white/45 leading-relaxed">Complete suite designed around digital storefront distributions and zero-fee UPI.</p>
              <div className="h-[1px] bg-zinc-800/80" />
              <ul className="space-y-3.5 text-xs text-white/60 text-left font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Everything in Pro plan</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> 20+ luxury & animated themes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Full lifetime analytics</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Unlimited AI tool usage</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Accept UPI tips (0% fee)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Sell digital products (Unlimited)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Digital Store Platform Fee: 0%</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Lead collection (Email list)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Connect custom domain</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Advanced link scheduling</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> Verified profile badge</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400 shrink-0" /> URL shortener feature</li>
              </ul>
            </div>
            <Link to="/signup?plan=PRO_PLUS" className="mt-8 py-3 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black uppercase text-center rounded-xl transition-all font-sans block shadow">Upgrade Pro+ Portal</Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: DETAILED FEATURE COMPARISON TABLE ────────────── */}
      <section className="bg-[#F8F7F4] py-24 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4 mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
            Deep feature comparison
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto">
            Review detailed capabilities across each registration plan to determine your creator path.
          </p>
        </div>

        {/* Comparison table panel */}
        <div className="max-w-5xl mx-auto bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-50 text-[10.5px] text-zinc-500 font-extrabold uppercase tracking-widest border-b border-zinc-200">
                  <th className="p-5 w-[40%]">Core Feature Matrix</th>
                  <th className="p-5 text-center">Free Plan</th>
                  <th className="p-5 text-center text-orange">Pro Plan</th>
                  <th className="p-5 text-center text-purple-600">Pro+ Plan</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700 divide-y divide-zinc-100">
                {/* Customization section */}
                <tr className="bg-zinc-50/50 text-[8.5px] font-extrabold uppercase text-zinc-400 tracking-wider"><td colSpan={4} className="px-5 py-2">LAYOUTS & STYLES</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Total Custom Links</td><td className="p-5 text-center">Up to 5 active links</td><td className="p-5 text-center text-orange font-bold">Unlimited active links</td><td className="p-5 text-center text-purple-600 font-bold">Unlimited active links</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Handcrafted Themes</td><td className="p-5 text-center">2 basic theme templates</td><td className="p-5 text-center">8 premium theme templates</td><td className="p-5 text-center">20+ luxury & animated themes</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Remove Platform Branding</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Connect Custom Domain</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Integrated URL Shortener</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>

                {/* Monetization section */}
                <tr className="bg-zinc-50/50 text-[8.5px] font-extrabold uppercase text-zinc-400 tracking-wider"><td colSpan={4} className="px-5 py-2">MONETIZATION & SUBSCRIBERS</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Direct UPI Tip Jar</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold">Accept UPI tips (0% fee)</td><td className="p-5 text-center text-emerald-500 font-bold">Accept UPI tips (0% fee)</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Creator Store Digital Shop</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold">Sell digital products (Up to 10)</td><td className="p-5 text-center text-emerald-500 font-bold">Sell digital products (Unlimited)</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Secure Token Anti-Piracy Delivery</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Lead Collection (Email list)</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Welcome Email Automation</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td></tr>

                {/* Analytics */}
                <tr className="bg-zinc-50/50 text-[8.5px] font-extrabold uppercase text-zinc-400 tracking-wider"><td colSpan={4} className="px-5 py-2">DATA ANALYTICS HISTORY</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Data Analytics Duration</td><td className="p-5 text-center">Basic analytics (7 days)</td><td className="p-5 text-center">Advanced analytics (30 days)</td><td className="p-5 text-center text-purple-600 font-bold">Full lifetime analytics</td></tr>
                <tr><td className="p-5 font-bold text-zinc-900">Traffic location splits (India States)</td><td className="p-5 text-center text-zinc-300"><X size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold"><Check size={14} className="mx-auto" /></td><td className="p-5 text-center text-emerald-500 font-bold">Interactive Heatmaps</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: TESTIMONIALS (SLIDING MARQUEE) ──────────────── */}
      <section className="bg-[#111111] py-24 overflow-hidden relative z-10 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-white tracking-tight leading-none">
            Loved by top Indian creators.
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto">
            Read stories from creative professionals who trust Lynksy with their social reach and monetization needs.
          </p>
        </div>

        {/* Marquee Wrapper Row 1 (Left Direction) */}
        <div className="relative flex overflow-hidden py-1">
          {/* Edge Shadows */}
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#111111] to-transparent z-10" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#111111] to-transparent z-10" />

          <div className="animate-marquee-left">
            {[...TESTIMONIALS_1, ...TESTIMONIALS_1].map((item, idx) => (
              <div key={idx} className="bg-[#18181b] border border-zinc-800 rounded-3xl p-6 w-[310px] mx-2 shrink-0 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-orange"><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /></div>
                  <p className="text-xs text-white/70 leading-relaxed font-sans font-medium">"{item.text}"</p>
                </div>
                <div className="flex items-center gap-3.5 mt-6 border-t border-zinc-800/85 pt-4">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${item.grad} flex items-center justify-center font-bold text-xs`}>{item.initials}</div>
                  <div className="font-sans leading-none">
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <span className="text-[9px] text-zinc-400 block mt-1">{item.handle} • {item.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Wrapper Row 2 (Right Direction) */}
        <div className="relative flex overflow-hidden py-1 mt-4">
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#111111] to-transparent z-10" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#111111] to-transparent z-10" />

          <div className="animate-marquee-right">
            {[...TESTIMONIALS_2, ...TESTIMONIALS_2].map((item, idx) => (
              <div key={idx} className="bg-[#18181b] border border-zinc-800 rounded-3xl p-6 w-[310px] mx-2 shrink-0 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-orange"><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /><Star size={12} className="fill-orange" /></div>
                  <p className="text-xs text-white/70 leading-relaxed font-sans font-medium">"{item.text}"</p>
                </div>
                <div className="flex items-center gap-3.5 mt-6 border-t border-zinc-800/85 pt-4">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${item.grad} flex items-center justify-center font-bold text-xs`}>{item.initials}</div>
                  <div className="font-sans leading-none">
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <span className="text-[9px] text-zinc-400 block mt-1">{item.handle} • {item.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 11: FAQ ACCORDION ───────────────────────────────── */}
      <section className="bg-[#F8F7F4] py-24 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold font-syne text-zinc-900 tracking-tight leading-none">
            Answers to your questions.
          </h2>
        </div>

        {/* Collapsible FAQ Accordion items */}
        <div className="max-w-3xl mx-auto space-y-3.5 text-left font-sans">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx
            return (
              <div key={idx} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center bg-white hover:bg-zinc-50/50 transition-colors"
                >
                  <span className="text-sm md:text-base font-extrabold font-syne text-zinc-900 pr-4">{item.q}</span>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-zinc-100"
                    >
                      <div className="p-6 text-xs md:text-sm text-zinc-500 leading-relaxed font-sans select-text">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── SECTION 12: FINAL CALL-TO-ACTION ────────────────────────── */}
      <section className="bg-gradient-to-r from-orange to-[#7C3AED] py-28 px-6 relative overflow-hidden z-10 text-white text-center">
        {/* Background blobs decor */}
        <div className="absolute top-[-100px] left-[-80px] w-80 h-80 bg-black/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-60px] w-64 h-64 bg-black/5 rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black font-syne tracking-tight leading-none text-white">Your audience is waiting.</h2>
          <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto font-medium">
            Formulate your free workspace in 2 minutes. Consolidate your outreach networks and receive commissions-free UPI donations.
          </p>

          {/* Email Signup block */}
          <form onSubmit={handleFinalSubmit} className="max-w-md mx-auto pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch bg-transparent sm:bg-white p-0 sm:p-1.5 rounded-2xl sm:rounded-full overflow-hidden sm:shadow-xl gap-3 sm:gap-0">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={finalEmail} 
                onChange={(e) => setFinalEmail(e.target.value)}
                className="flex-1 bg-white sm:bg-transparent px-5 py-3.5 sm:py-3 text-sm text-zinc-900 font-bold placeholder:text-zinc-400 outline-none focus:ring-0 min-w-0 rounded-2xl sm:rounded-none shadow-lg sm:shadow-none"
              />
              <button type="submit" className="bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider px-6 py-4 sm:py-3.5 rounded-2xl sm:rounded-full transition-colors whitespace-nowrap shrink-0 shadow-lg sm:shadow-none">
                Join Free Now
              </button>
            </div>
            {finalEmailError && <p className="text-xs font-bold text-black border bg-white/20 px-3 py-1 rounded inline-block">{finalEmailError}</p>}
          </form>

          {/* Micro triggers */}
          <p className="text-[11px] text-white/60"> Already registered? <Link to="/login" className="underline font-bold text-white hover:text-black">Sign in to workspace →</Link></p>

          {/* Platform channels branding ticker */}
          <div className="border-t border-white/10 pt-10 mt-14">
            <p className="text-[10px] text-white/40 tracking-widest uppercase font-bold mb-5">Your links for every relevant platform</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-xs font-bold text-white/60">
              <span className="flex items-center gap-1.5"><Instagram size={14} /> Instagram</span>
              <span className="flex items-center gap-1.5"><Youtube size={14} /> YouTube</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={14} /> WhatsApp</span>
              <span className="flex items-center gap-1.5"><FileText size={14} /> Presets</span>
              <span className="flex items-center gap-1.5"><Linkedin size={14} /> LinkedIn</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 13: FOOTER ──────────────────────────────────────── */}
      <footer className="bg-[#111111] text-white/40 py-16 px-6 relative z-10 border-t border-white/5 font-sans">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="text-orange" size={24} />
              <h2 className="text-lg font-bold font-syne text-white tracking-tight leading-none">Lynksy<span className="text-orange">.</span></h2>
            </div>
            <p className="text-xs leading-relaxed max-w-xs select-text">
              India's absolute smartest direct link-in-bio platform engineered specifically to coordinate content sharing and local digital monetization formats.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition-colors"><Instagram size={18} /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube size={18} /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter size={18} /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          <div className="space-y-4 font-medium text-xs">
            <h4 className="text-[10px] font-black text-white/50 tracking-widest uppercase">Platforms</h4>
            <ul className="space-y-3">
              <li><Link to="/examples" className="hover:text-white transition-colors">Visual Themes Gallery</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Packages</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Access Free Handle</Link></li>
            </ul>
          </div>

          <div className="space-y-4 font-medium text-xs">
            <h4 className="text-[10px] font-black text-white/50 tracking-widest uppercase">Legal Directives</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Principles & Logs</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-white transition-colors">User Agreements & Rules</Link></li>
            </ul>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <h4 className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-1">Built with <Heart size={10} className="text-red-500 fill-red-500" /> in India</h4>
            <p className="text-[11px] leading-relaxed">© {new Date().getFullYear()} Lynksy Systems. All national transaction portals are secured sandbox environments.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

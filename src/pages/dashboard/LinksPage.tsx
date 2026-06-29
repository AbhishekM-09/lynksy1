import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getLinks, createLink, updateLink, deleteLink, reorderLinks, updateUser, getActiveProducts, incrementAiUsage } from '@/firebase/firestore'
import { uploadAvatar, deleteAvatar } from '@/firebase/storage'
import { getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'
import { usePlan } from '@/hooks/usePlan'
import { PhonePreview } from '@/components/links/PhonePreview'
import { Modal } from '@/components/ui/Modal'
import { LinkSchema } from '@/utils/validators'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided } from '@hello-pangea/dnd'
import { 
  Plus, Smartphone, Link2, Youtube, Instagram, MessageCircle, Linkedin,
  Trash2, GripVertical, Settings, Pin, Sparkles, Loader2,
  Lock, BarChart3, Ghost, Twitter, Stars, AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'motion/react'
import type { Link, User, Product } from '@/types'
import { getIconForUrl } from '@/utils/linkUtils'
import { Timestamp } from 'firebase/firestore'
import { generateBioOptions } from '@/services/aiService'

const DraggableComp = Draggable as React.ComponentType<Record<string, unknown>>;

const getPlatformStyle = (url: string) => {
  const normalized = (url || '').toLowerCase();
  
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
    return {
      gradient: 'linear-gradient(135deg, #FF4B4B 0%, #E60000 100%)',
      glow: 'rgba(230, 0, 0, 0.15)',
      color: '#FF0000',
      label: 'YouTube'
    };
  }
  if (normalized.includes('instagram.com')) {
    return {
      gradient: 'linear-gradient(135deg, #FF3F7C 0%, #D82B93 50%, #F57C00 100%)',
      glow: 'rgba(216, 43, 147, 0.15)',
      color: '#E4405F',
      label: 'Instagram'
    };
  }
  if (normalized.includes('wa.me') || normalized.includes('whatsapp.com')) {
    return {
      gradient: 'linear-gradient(135deg, #4AE083 0%, #17A94E 100%)',
      glow: 'rgba(23, 169, 78, 0.15)',
      color: '#25D366',
      label: 'WhatsApp'
    };
  }
  if (normalized.includes('twitter.com') || normalized.includes('x.com')) {
    return {
      gradient: 'linear-gradient(135deg, #222222 0%, #0F0F0F 100%)',
      glow: 'rgba(15, 15, 15, 0.25)',
      color: '#111111',
      label: 'X / Twitter'
    };
  }
  if (normalized.includes('upi:') || normalized.includes('bharatpe') || normalized.includes('phonepe') || normalized.includes('gpay') || normalized.includes('paytm')) {
    return {
      gradient: 'linear-gradient(135deg, #6C3FA2 0%, #4B2779 100%)',
      glow: 'rgba(108, 63, 162, 0.15)',
      color: '#6B3FA0',
      label: 'UPI Tip'
    };
  }
  if (normalized.includes('spotify.com') || normalized.includes('spotify')) {
    return {
      gradient: 'linear-gradient(135deg, #1ED760 0%, #159C42 100%)',
      glow: 'rgba(21, 156, 66, 0.15)',
      color: '#1ED760',
      label: 'Spotify'
    };
  }
  if (normalized.includes('linkedin.com')) {
    return {
      gradient: 'linear-gradient(135deg, #0077B5 0%, #004B73 100%)',
      glow: 'rgba(0, 119, 181, 0.15)',
      color: '#0077B5',
      label: 'LinkedIn'
    };
  }
  if (normalized.includes('github.com')) {
    return {
      gradient: 'linear-gradient(135deg, #333333 0%, #1A1A1A 100%)',
      glow: 'rgba(0, 0, 0, 0.15)',
      color: '#333333',
      label: 'GitHub'
    };
  }
  if (normalized.includes('discord.com') || normalized.includes('discord.gg')) {
    return {
      gradient: 'linear-gradient(135deg, #5865F2 0%, #3F48B5 100%)',
      glow: 'rgba(88, 101, 242, 0.15)',
      color: '#5865F2',
      label: 'Discord'
    };
  }
  if (normalized.includes('t.me') || normalized.includes('telegram.org')) {
    return {
      gradient: 'linear-gradient(135deg, #33A9E5 0%, #1771A9 100%)',
      glow: 'rgba(51, 169, 229, 0.15)',
      color: '#33A9E5',
      label: 'Telegram'
    };
  }
  if (normalized.includes('@') || normalized.includes('mailto:')) {
    return {
      gradient: 'linear-gradient(135deg, #378EFA 0%, #1A5CC2 100%)',
      glow: 'rgba(26, 92, 194, 0.15)',
      color: '#378EFA',
      label: 'Email'
    };
  }
  // Default is Website Indigo Gradient
  return {
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
    glow: 'rgba(79, 70, 229, 0.15)',
    color: '#4F46E5',
    label: 'Website'
  };
};

export default function LinksPage() {
  const { user, updateUserField } = useAuthStore()
  const { plan, limits, openUpgradeModal } = usePlan()
  
  const [links, setLinks] = useState<Link[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const activeLinksCount = links.filter(l => l.isActive).length
  const limitExceeded = activeLinksCount > limits.maxLinks
  const [activeTab, setActiveTab] = useState<'links' | 'profile'>('links')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const lastUserUidRef = useRef<string | null>(null)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1280)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Real-time profile draft for preview
  const [profileDraft, setProfileDraft] = useState({
    displayName: user?.displayName || '',
    avatarUrl: user?.avatarUrl || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    instagramHandle: user?.instagramHandle || '',
    youtubeHandle: user?.youtubeHandle || '',
    twitterHandle: user?.twitterHandle || '',
    linkedinHandle: user?.linkedinHandle || '',
    upiId: user?.upiId || '',
    upiEnabled: user?.upiEnabled !== undefined ? user?.upiEnabled : true,
    upiTitle: user?.upiTitle || '',
    upiDescription: user?.upiDescription || '',
    upiDefaultAmount: user?.upiDefaultAmount || '',
    upiDisplayName: user?.upiDisplayName || '',
    upiGoalEnabled: user?.upiGoalEnabled || false,
    upiGoalTitle: user?.upiGoalTitle || '',
    upiGoalTarget: user?.upiGoalTarget || '',
    upiGoalRaised: user?.upiGoalRaised || '',
  })

  useEffect(() => {
    if (!user?.uid) return
    getLinks(user.uid).then(res => {
      setLinks(res)
    })
    getActiveProducts(user.uid).then(res => {
      setProducts(res)
      setLoading(false)
    })
  }, [user?.uid])

  useEffect(() => {
    if (user) {
      if (!lastUserUidRef.current || lastUserUidRef.current !== user.uid) {
        lastUserUidRef.current = user.uid
        setProfileDraft({
          displayName: user.displayName || '',
          avatarUrl: user.avatarUrl || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          instagramHandle: user.instagramHandle || '',
          youtubeHandle: user.youtubeHandle || '',
          twitterHandle: user.twitterHandle || '',
          linkedinHandle: user.linkedinHandle || '',
          upiId: user.upiId || '',
          upiEnabled: user.upiEnabled !== undefined ? user.upiEnabled : true,
          upiTitle: user.upiTitle || '',
          upiDescription: user.upiDescription || '',
          upiDefaultAmount: user.upiDefaultAmount || '',
          upiDisplayName: user.upiDisplayName || '',
          upiGoalEnabled: user.upiGoalEnabled || false,
          upiGoalTitle: user.upiGoalTitle || '',
          upiGoalTarget: user.upiGoalTarget || '',
          upiGoalRaised: user.upiGoalRaised || '',
        })
      }
    } else {
      lastUserUidRef.current = null
    }
  }, [user])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !user) return
    
    const reordered = Array.from(links)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    
    setLinks(reordered)
    
    const updatePayload = reordered.map((l, i) => ({ id: (l as Link).id, position: i }))
    try {
      await reorderLinks(user.uid, updatePayload)
    } catch {
      toast.error('Failed to save order')
    }
  }

  const handleAddLink = async (data: Partial<Link>) => {
    if (!user) return
    if (links.length >= limits.maxLinks) {
      if (plan === 'FREE') {
        openUpgradeModal('maxLinks')
      } else {
        toast.error('Maximum link limit reached for your plan.')
      }
      return
    }

    try {
      const id = await createLink(user.uid, {
        title: data.title || '',
        url: data.url || '',
        type: data.type || 'URL',
        description: data.description || '',
        emoji: data.emoji || '',
        position: links.length,
        isActive: true,
        isPinned: false,
        showFrom: null,
        showUntil: null,
        thumbnailUrl: null,
        utmSource: data.utmSource || '',
        utmMedium: data.utmMedium || '',
        utmCampaign: data.utmCampaign || '',
      })
      const newLink: Link = { 
        id, 
        title: data.title || '', 
        url: data.url || '', 
        type: data.type || 'URL',
        description: data.description || '',
        emoji: data.emoji || '',
        clickCount: 0, 
        isActive: true, 
        isPinned: false, 
        position: links.length,
        thumbnailUrl: null,
        showFrom: null,
        showUntil: null,
        utmSource: data.utmSource || '',
        utmMedium: data.utmMedium || '',
        utmCampaign: data.utmCampaign || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      setLinks([...links, newLink])
      if (data.type === 'UPI' || data.type === 'upi_tip') {
        await updateUser(user.uid, { upiEnabled: true })
        updateUserField({ upiEnabled: true })
        setProfileDraft(prev => ({ ...prev, upiEnabled: true }))
      }
      setModalOpen(false)
      toast.success('Link added! Set it live now.')
    } catch {
      toast.error('Failed to add link')
    }
  }

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    if (!user) return
    try {
      await updateLink(user.uid, id, data)
      const toggledLink = links.find(l => l.id === id)
      if (toggledLink && (toggledLink.type === 'UPI' || toggledLink.type === 'upi_tip') && data.isActive !== undefined) {
        const isNowActive = data.isActive
        await updateUser(user.uid, { upiEnabled: isNowActive })
        updateUserField({ upiEnabled: isNowActive })
        setProfileDraft(prev => ({ ...prev, upiEnabled: isNowActive }))
      }
      setLinks(links.map(l => l.id === id ? { ...l, ...data } : l))
      if (modalOpen) setModalOpen(false)
      toast.success('Updated')
    } catch {
      toast.error('Update failed')
    }
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => setConfirmDeleteId(current => current === id ? null : current), 3000);
      return;
    }
    
    try {
      const deletedLink = links.find(l => l.id === id)
      await deleteLink(user.uid, id)
      setLinks(prev => prev.filter(l => l.id !== id))
      if (deletedLink && (deletedLink.type === 'UPI' || deletedLink.type === 'upi_tip')) {
        await updateUser(user.uid, { upiEnabled: false })
        updateUserField({ upiEnabled: false })
        setProfileDraft(prev => ({ ...prev, upiEnabled: false }))
      }
      setConfirmDeleteId(null)
      toast.success('Link deleted')
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete link')
    }
  }

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-8 relative pb-24 xl:pb-0 xl:h-[calc(100vh-140px)] xl:overflow-hidden">
      {/* Editor Side */}
      <div className="space-y-6 sm:space-y-8 xl:h-full xl:overflow-y-auto xl:pr-3 pb-24 no-scrollbar">
        <div className="flex items-center gap-2 sm:gap-4 border-b border-cream-3 overflow-x-auto no-scrollbar scroll-smooth snap-x -mx-2 px-2 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setActiveTab('links')}
            className={`pb-4 px-4 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap snap-start ${
              activeTab === 'links' ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Links
            {activeTab === 'links' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-4 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap snap-start ${
              activeTab === 'profile' ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Profile Editor
            {activeTab === 'profile' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'links' ? (
            <motion.div 
              key="links"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { setEditingLink(null); setModalOpen(true) }}
                  className="btn-primary w-full py-4 text-base"
                >
                  <Plus size={20} /> Add New Link
                </button>

                <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 md:grid-cols-7 gap-2 pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  <button onClick={() => { setEditingLink({ title: 'WhatsApp Me', url: 'https://wa.me/', type: 'WHATSAPP' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-green-500 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-green-50 text-green-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <MessageCircle size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">WhatsApp</span>
                  </button>
                  
                  <button onClick={() => { setEditingLink({ title: 'YouTube', url: 'https://youtube.com/', type: 'YOUTUBE' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-red-500 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Youtube size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">YouTube</span>
                  </button>

                  <button onClick={() => { setEditingLink({ title: 'Instagram', url: 'https://instagram.com/', type: 'INSTAGRAM' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-pink-500 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Instagram size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">Instagram</span>
                  </button>

                  <button onClick={() => { setEditingLink({ title: 'Snapchat', url: 'https://snapchat.com/add/', type: 'URL' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-yellow-500 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Ghost size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">Snapchat</span>
                  </button>

                  <button onClick={() => { setEditingLink({ title: 'Twitter (X)', url: 'https://x.com/', type: 'URL' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-black hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-slate-50 text-slate-800 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Twitter size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">Twitter (X)</span>
                  </button>

                  <button onClick={() => { setEditingLink({ title: 'LinkedIn', url: 'https://linkedin.com/in/', type: 'URL' } as Partial<Link> as Link); setModalOpen(true) }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Linkedin size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink">LinkedIn</span>
                  </button>

                  <button onClick={() => { 
                      if (!limits.canUseUPI) return openUpgradeModal('canUseUPI')
                      setEditingLink({ title: 'Support via UPI', url: 'upi://pay', type: 'UPI' } as Partial<Link> as Link); setModalOpen(true) 
                    }} className="group relative shrink-0 w-24 sm:w-auto bg-white border border-cream-3 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-purple-600 hover:shadow-lg hover:-translate-y-1 text-center min-h-[88px] sm:min-h-[96px]">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Smartphone size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-ink flex items-center justify-center gap-0.5 whitespace-nowrap">
                      UPI Tip {!limits.canUseUPI && <Lock size={8} className="text-muted/65 shrink-0" />}
                    </span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-cream-3 shadow-sm shimmer" />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {limitExceeded && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-600 text-sm flex items-center gap-2">
                          ⚠️ Plan Limits Exceeded ({activeLinksCount}/{limits.maxLinks} Active Links)
                        </h4>
                        <p className="text-xs text-muted leading-relaxed font-semibold">
                          Your current plan only supports up to <strong>{limits.maxLinks}</strong> active links. The last <strong>{activeLinksCount - limits.maxLinks}</strong> active links are hidden on your profile page.
                        </p>
                      </div>
                      {plan === 'FREE' && (
                        <button 
                          onClick={() => openUpgradeModal('maxLinks')}
                          className="btn-primary py-2.5 px-5 h-10 text-xs shrink-0 self-start sm:self-auto uppercase tracking-wider bg-ink hover:bg-ink-3 text-white"
                        >
                          Upgrade Plan
                        </button>
                      )}
                    </div>
                  )}

                  {(() => {
                    let activeCount = 0;
                    return (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="links">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                              <AnimatePresence mode="popLayout" initial={false}>
                                {links.map((link, index) => {
                                  let currentActiveIndex = -1;
                                  if (link.isActive) {
                                    currentActiveIndex = activeCount;
                                    activeCount++;
                                  }
                                  const isLinkOverLimit = link.isActive && currentActiveIndex >= limits.maxLinks;
                                  const pStyle = getPlatformStyle(link.url);

                                  return (
                                    <DraggableComp key={link.id} draggableId={link.id} index={index}>
                                      {(provided: DraggableProvided) => (
                                        <motion.div 
                                          layout
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95 }}
                                          whileHover={{ y: -4 }}
                                          transition={{ 
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 28
                                          }}
                                          ref={provided.innerRef} 
                                          {...provided.draggableProps} 
                                          className={`group bg-white rounded-[28px] border transition-all duration-300 relative overflow-hidden ${
                                            isLinkOverLimit 
                                              ? 'border-red-200 bg-red-50/10 hover:border-red-300 shadow-sm' 
                                              : link.isActive 
                                                ? 'border-cream-3/60 shadow-[0_4px_24px_rgba(13,10,8,0.02)] hover:shadow-[0_20px_48px_-12px_rgba(13,10,8,0.08)]' 
                                                : 'border-dashed border-cream-3 bg-[#F7F3EE]/40 opacity-75'
                                          }`}
                                          style={{
                                            // Dynamic subtle platform brand glow on hover
                                            boxShadow: link.isActive ? `0 4px 24px rgba(13,10,8,0.02)` : undefined
                                          }}
                                        >
                                          {/* Refined subtle border overlay */}
                                          <div className="absolute inset-px rounded-[27px] border border-white/40 pointer-events-none" />

                                          <div className="relative p-5 sm:p-6 pr-4 sm:pr-8">
                                            {/* Reorder Grip handle aligned vertically */}
                                            <div {...provided.dragHandleProps} className="absolute left-1.5 top-1/2 -translate-y-1/2 p-2 text-muted-2 hover:text-ink cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 animate-fade">
                                              <GripVertical size={16} />
                                            </div>

                                            <div className="flex items-start sm:items-center gap-4 ml-6 sm:ml-6">
                                              {/* Beautiful colorful platform icon with frosted glass overlay */}
                                              <div 
                                                className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm transition-transform duration-500 group-hover:scale-105 p-0.5"
                                                style={{
                                                  background: link.isActive ? pStyle.gradient : '#EBE6DF',
                                                  boxShadow: link.isActive ? `0 8px 16px ${pStyle.glow}` : 'none'
                                                }}
                                              >
                                                {/* High refraction glassmorphism frosted inner ring */}
                                                <div className="absolute inset-px rounded-[14px] bg-white/10 backdrop-blur-[3px] border border-white/20 pointer-events-none" />

                                                <div className="relative z-10 w-full h-full flex items-center justify-center text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.15)]">
                                                  {link.thumbnailUrl ? (
                                                    <img src={link.thumbnailUrl} className="w-full h-full object-cover rounded-[14px]" alt="" />
                                                  ) : (
                                                    React.createElement(getIconForUrl(link.url), { size: 22, strokeWidth: 1.75 })
                                                  )}
                                                </div>
                                              </div>

                                              {/* Title, URL and tags */}
                                              <div className="flex-1 min-w-0 font-sans">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1 max-w-full">
                                                  <h4 className="font-bold text-ink truncate text-base sm:text-lg leading-tight">
                                                    {link.title}
                                                  </h4>
                                                  
                                                  {link.isPinned && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-orange/10 text-orange rounded-full text-[8px] font-black uppercase tracking-wider shrink-0">
                                                      <Pin size={8} fill="currentColor" className="rotate-45" />
                                                      PINNED
                                                    </span>
                                                  )}
                                                  {((link.type === 'UPI' && !limits.canUseUPI) || (link.type === 'FORM' && !limits.canCollectEmails)) && (
                                                    <span className="bg-red-50 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wider shrink-0 leading-none">
                                                      LOCKED
                                                    </span>
                                                  )}
                                                  {link.clickCount !== undefined && link.clickCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-[#F7F3EE] border border-cream-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-ink/75 tracking-wider shrink-0 leading-none hover:bg-cream-2 transition-colors">
                                                      <BarChart3 size={9} className="text-orange" />
                                                      {link.clickCount} CLICKS
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-xs text-muted truncate max-w-full mt-1 block">
                                                  {link.url}
                                                </p>
                                              </div>

                                              {/* Active switch slider */}
                                              <div className="flex items-center shrink-0 self-center">
                                                <button 
                                                  onClick={() => handleUpdateLink(link.id, { isActive: !link.isActive })}
                                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out outline-none focus:ring-4 focus:ring-ink/15 ${
                                                    link.isActive 
                                                      ? 'bg-ink shadow-[0_4px_12px_rgba(24,24,27,0.25)]' 
                                                      : 'bg-muted-2/60'
                                                  }`}
                                                >
                                                  <span 
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                                                      link.isActive ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                  />
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* secondary actions: edit, pin & delete */}
                                          <div className="px-5 pb-5 pt-2 border-t border-cream-2/40 ml-12 sm:ml-16 mr-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <button 
                                                type="button" 
                                                onClick={() => { setEditingLink(link); setModalOpen(true) }} 
                                                className="h-8 px-2.5 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-ink-2 uppercase tracking-wider bg-[#F7F3EE] hover:bg-cream-3 hover:text-ink transition-all rounded-lg border border-transparent"
                                              >
                                                <Settings size={12} strokeWidth={2.25} /> Edit Link
                                              </button>
                                              <button 
                                                type="button" 
                                                onClick={() => { handleUpdateLink(link.id, { isPinned: !link.isPinned }) }} 
                                                className={`h-8 px-2.5 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all rounded-lg border ${
                                                  link.isPinned 
                                                    ? 'text-ink border-ink/20 bg-ink/5' 
                                                    : 'text-muted border-transparent bg-transparent hover:bg-[#F7F3EE]'
                                                }`}
                                              >
                                                <Pin size={12} className={link.isPinned ? 'rotate-45 text-ink' : ''} />
                                                {link.isPinned ? 'Unpin' : 'Pin'}
                                              </button>
                                            </div>

                                            <button 
                                              type="button"
                                              onClick={(e) => handleDelete(link.id, e)} 
                                              className={`h-8 px-2.5 transition-all rounded-lg flex items-center gap-1.5 border leading-none ${
                                                confirmDeleteId === link.id 
                                                  ? 'bg-red-500 text-white border-red-500 px-3.5 font-black text-[9px]' 
                                                  : 'text-muted hover:text-red-500 border-transparent hover:bg-red-50'
                                              }`}
                                            >
                                              <Trash2 size={12} />
                                              {confirmDeleteId === link.id ? (
                                                <span className="text-[9px] font-black uppercase tracking-wider">Confirm</span>
                                              ) : (
                                                <span className="hidden sm:inline text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Delete</span>
                                              )}
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </DraggableComp>
                                  );
                                })}
                              </AnimatePresence>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    );
                  })()}
                </div>
              )}

              {links.length === 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 border-2 border-dashed border-cream-3 rounded-3xl"
                >
                  <div className="w-16 h-16 bg-cream-3 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Link2 size={32} />
                  </div>
                  <h3 className="font-bold text-ink">No links yet</h3>
                  <p className="text-muted text-xs">Add your first link to get started.</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileEditor draft={profileDraft} setDraft={setProfileDraft} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Side */}
      <div className="hidden xl:block xl:sticky xl:top-0 self-start">
        {isDesktop && <PhonePreview user={{ ...user, ...profileDraft } as User} links={links} products={products} />}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <LinkFormModal 
          isOpen={modalOpen} 
          onClose={() => { setModalOpen(false); setEditingLink(null) }} 
          onSubmit={editingLink?.id ? (data) => handleUpdateLink(editingLink.id, data) : handleAddLink}
          initialData={editingLink}
        />
      )}
    </div>
  )
}

function ProfileEditor({ draft, setDraft }: { draft: Partial<User>, setDraft: (d: Partial<User>) => void }) {
  const { user, updateUserField } = useAuthStore()
  const { plan, limits, gate } = usePlan()
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiOptions, setAiOptions] = useState<string[]>([])
  const [showAiOptions, setShowAiOptions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleGenerateBio = async () => {
    if (!user) return
    
    // Check monthly limit
    const aiUsed = user.aiBiosUsedThisMonth || 0
    if (aiUsed >= limits.maxAiBios && plan !== 'PRO_PLUS') {
      gate('aiPerMonth', () => {}) // Using gate with 'aiPerMonth' but referring to bio limit
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('AI is crafting your bio...')
    try {
      const options = await generateBioOptions(user.category || 'Creator', user.username)
      setAiOptions(options)
      setShowAiOptions(true)
      
      // Update usage count in DB
      await incrementAiUsage(user.uid, user, 'bio')
      updateUserField({ aiBiosUsedThisMonth: (user.aiBiosUsedThisMonth || 0) + 1 })
      
      toast.success('Generated 3 styles for you!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate. Try again later.', { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectBio = (bio: string) => {
    setDraft({ ...draft, bio: bio.slice(0, 200) })
    setShowAiOptions(false)
    toast.success('Bio applied!')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    const loadingToast = toast.loading('Syncing profile across Lynksy...')
    try {
      const updateData = {
        displayName: draft.displayName || '',
        bio: draft.bio || '',
        location: draft.location || '',
        website: draft.website || '',
        avatarUrl: draft.avatarUrl || '',
        instagramHandle: draft.instagramHandle || '',
        youtubeHandle: draft.youtubeHandle || '',
        twitterHandle: draft.twitterHandle || '',
        linkedinHandle: draft.linkedinHandle || '',
        upiId: draft.upiId || '',
        upiEnabled: draft.upiEnabled !== undefined ? draft.upiEnabled : true,
        upiTitle: draft.upiTitle || '',
        upiDescription: draft.upiDescription || '',
        upiDefaultAmount: draft.upiDefaultAmount || '',
        upiDisplayName: draft.upiDisplayName || '',
        upiGoalEnabled: draft.upiGoalEnabled || false,
        upiGoalTitle: draft.upiGoalTitle || '',
        upiGoalTarget: draft.upiGoalTarget || '',
        upiGoalRaised: draft.upiGoalRaised || '',
      }

      await updateUser(user.uid, updateData)
      updateUserField(updateData)
      
      toast.success('Everything is synced!', { id: loadingToast })
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Sync failed. Please try a smaller image.', { id: loadingToast })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Allow up to 2MB as supported by the storage module
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    const toastId = toast.loading('Uploading profile picture...')
    setIsSaving(true)
    try {
      const downloadUrl = await uploadAvatar(user.uid, file)
      
      // Update Firestore document immediately to persist after refresh
      await updateUser(user.uid, { avatarUrl: downloadUrl })
      updateUserField({ avatarUrl: downloadUrl })
      
      setDraft({ ...draft, avatarUrl: downloadUrl })
      toast.success('Profile picture updated successfully!', { id: toastId })
    } catch (err) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload profile picture'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user) return

    const toastId = toast.loading('Removing profile picture...')
    setIsSaving(true)
    try {
      // Physically delete the avatar file from Firebase Storage
      await deleteAvatar(user.uid)

      // Update Firestore database and app state
      await updateUser(user.uid, { avatarUrl: '' })
      updateUserField({ avatarUrl: '' })
      setDraft({ ...draft, avatarUrl: '' })
      
      toast.success('Profile picture removed successfully!', { id: toastId })
    } catch (err) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove profile picture'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-10">
      {/* Basic Info */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-ink mb-1">Basic Info</h3>
          <p className="text-xs text-muted">Update your display name and bio.</p>
        </div>
        
        <div className="grid gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cream-2 border-2 border-orange/10 flex items-center justify-center overflow-hidden shadow-inner relative group cursor-pointer shrink-0"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              {draft.avatarUrl ? (
                <img src={draft.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-black text-white"
                  style={{ background: getFallbackAvatarGradient(draft.displayName || user?.username || 'U') }}
                >
                  {getFallbackAvatarInitials(draft.displayName || user?.username || 'U')}
                </div>
              )}
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">Change</div>
            </div>
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="label-text">Profile Name</label>
                <input 
                  className="input-field" 
                  value={draft.displayName} 
                  onChange={e => setDraft({...draft, displayName: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] bg-ink text-white font-bold py-1.5 px-3 rounded-lg hover:bg-ink/80 transition-all flex items-center gap-1"
                >
                  Change picture
                </button>
                {draft.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSaving}
                    className="text-[11px] text-red-500 hover:text-red-700 font-bold border border-red-500/20 hover:border-red-500/40 rounded-lg py-1.5 px-3 bg-red-50/50 hover:bg-red-50 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <label className="label-text mb-0">Bio</label>
                <button 
                  type="button" 
                  onClick={handleGenerateBio}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-ink text-white rounded-full hover:bg-ink/80 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} className="text-orange" />}
                  <span className="text-[9px] font-black uppercase tracking-wider">Generate with AI</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {plan !== 'PRO_PLUS' && (
                  <span className="text-[9px] font-bold text-muted uppercase">
                    {user?.aiBiosUsedThisMonth || 0}/{limits.maxAiBios} AI Bios
                  </span>
                )}
                <span className={`text-[10px] font-bold ${draft.bio && draft.bio.length > 180 ? 'text-red-500' : 'text-muted'}`}>
                  {draft.bio?.length || 0}/200
                </span>
              </div>
            </div>
            
            <AnimatePresence>
              {showAiOptions && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4 space-y-2"
                >
                  <div className="p-3 bg-cream-2 rounded-xl border border-orange/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase tracking-widest text-orange flex items-center gap-1">
                        <Sparkles size={8} /> AI Options
                      </span>
                      <button 
                        type="button"
                        onClick={() => setShowAiOptions(false)}
                        className="text-[8px] font-bold text-muted hover:text-ink"
                      >
                        CLOSE
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {aiOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectBio(opt)}
                          className="text-left p-2.5 bg-white border border-cream-3 rounded-lg text-[11px] text-ink hover:border-orange transition-all hover:shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea 
              className="textarea-field h-24"
              value={draft.bio}
              onChange={e => setDraft({...draft, bio: e.target.value.slice(0, 200)})}
              placeholder="Tell your story or use AI to craft one..."
            />
          </div>
        </div>
      </section>

      {/* Location & Links */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-ink mb-1">Contact & Location</h3>
          <p className="text-xs text-muted">Let people know where you're based.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Location</label>
            <input className="input-field" value={draft.location} onChange={e => setDraft({...draft, location: e.target.value})} placeholder="Ex: Mumbai, MH" />
          </div>
          <div>
            <label className="label-text">Personal Website</label>
            <input className="input-field" value={draft.website} onChange={e => setDraft({...draft, website: e.target.value})} placeholder="https://" />
          </div>
        </div>
      </section>

      {/* Socials */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-ink mb-1">Social Media</h3>
          <p className="text-xs text-muted">Drop your handles to show icons on your page.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0"><Instagram size={18} /></span>
            <input className="input-field" value={draft.instagramHandle} onChange={e => setDraft({...draft, instagramHandle: e.target.value})} placeholder="instagram_handle" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0"><Youtube size={18} /></span>
            <input className="input-field" value={draft.youtubeHandle} onChange={e => setDraft({...draft, youtubeHandle: e.target.value})} placeholder="youtube_channel" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0"><Linkedin size={18} /></span>
            <input className="input-field" value={draft.linkedinHandle} onChange={e => setDraft({...draft, linkedinHandle: e.target.value})} placeholder="linkedin_username" />
          </div>
        </div>
      </section>

      {/* UPI Tip Jar Settings */}
      <section className="space-y-6 pt-4 border-t border-cream-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
              UPI Tip Jar
            </h3>
            <p className="text-xs text-muted">Receive direct support/tips from your audience directly to your bank account (0% commission).</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-ink">Enable Tip Jar</span>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, upiEnabled: !draft.upiEnabled })}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange/50"
              style={{ backgroundColor: draft.upiEnabled ? '#FF6B00' : '#E4E4E7' }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{ transform: draft.upiEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
              />
            </button>
          </div>
        </div>

        <div className="p-5 bg-cream/30 border border-cream-3 rounded-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">UPI ID (VPA) <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field"
                value={draft.upiId || ''}
                onChange={e => setDraft({ ...draft, upiId: e.target.value })}
                placeholder="Ex: yourname@upi"
              />
              <p className="text-[10px] text-muted mt-1">Leave blank or toggle off to completely remove the UPI Tip Jar from your profile page.</p>
            </div>

            <div>
              <label className="label-text">Custom Support Message</label>
              <input
                type="text"
                className="input-field"
                value={draft.upiDescription || ''}
                onChange={e => setDraft({ ...draft, upiDescription: e.target.value })}
                placeholder="Ex: Send a Sweet Tip"
              />
            </div>
          </div>

          {/* Premium/Pro UPI features */}
          {(plan === 'PRO' || plan === 'PRO_PLUS') ? (
            <div className="border-t border-cream-3 pt-4 space-y-4">
              <span className="text-[9px] font-black uppercase tracking-wider text-orange flex items-center gap-1.5 bg-orange/5 w-max px-2 py-0.5 rounded-md">
                <Sparkles size={10} /> Pro Customizations Active
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Merchant / Display Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={draft.upiDisplayName || ''}
                    onChange={e => setDraft({ ...draft, upiDisplayName: e.target.value })}
                    placeholder="Ex: Alice Baker"
                  />
                  <p className="text-[10px] text-muted mt-1">Shows up in the UPI app during verification.</p>
                </div>

                <div>
                  <label className="label-text">Default Suggested Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={draft.upiDefaultAmount || ''}
                    onChange={e => setDraft({ ...draft, upiDefaultAmount: e.target.value })}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-cream-3 pt-4 text-center pb-2">
              <p className="text-xs text-muted flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-orange" />
                Want to custom-brand your Tip Jar and set custom default amounts? 
                <button type="button" onClick={() => openUpgradeModal && openUpgradeModal()} className="text-orange font-bold hover:underline">Go Pro</button>
              </p>
            </div>
          )}

          {/* Pro Plus Only: Goals progress bar tracker */}
          {plan === 'PRO_PLUS' ? (
            <div className="border-t border-cream-3 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 w-max px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-purple-100">
                  <Stars size={10} /> Pro+ Support Goal Tracking
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-cream-3 text-orange focus:ring-orange"
                    checked={draft.upiGoalEnabled || false}
                    onChange={e => setDraft({ ...draft, upiGoalEnabled: e.target.checked })}
                  />
                  <span className="text-xs font-bold text-ink">Enable Goal Target</span>
                </label>
              </div>

              {draft.upiGoalEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                  <div>
                    <label className="label-text">Goal / Campaign Title</label>
                    <input
                      type="text"
                      className="input-field"
                      value={draft.upiGoalTitle || ''}
                      onChange={e => setDraft({ ...draft, upiGoalTitle: e.target.value })}
                      placeholder="Ex: Buy me a MacBook Pro"
                    />
                  </div>
                  <div>
                    <label className="label-text">Target Amount (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={draft.upiGoalTarget || ''}
                      onChange={e => setDraft({ ...draft, upiGoalTarget: e.target.value })}
                      placeholder="Ex: 150000"
                    />
                  </div>
                  <div>
                    <label className="label-text font-black text-emerald-600">Amount Raised (₹)</label>
                    <input
                      type="number"
                      className="input-field border-emerald-200 focus:border-emerald-500 bg-emerald-50/10 text-emerald-700 font-bold"
                      value={draft.upiGoalRaised || ''}
                      onChange={e => setDraft({ ...draft, upiGoalRaised: e.target.value })}
                      placeholder="Ex: 45000"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : plan === 'PRO' ? (
            <div className="border-t border-cream-3 pt-4 text-center pb-2">
              <p className="text-xs text-muted flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-purple-500" />
                Want to display interactive Tip jar Progress Goal trackers? 
                <button type="button" onClick={() => openUpgradeModal && openUpgradeModal()} className="text-purple-600 font-bold hover:underline">Get PRO+</button>
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <button disabled={isSaving} className="btn-primary w-full h-14">
        {isSaving ? <Loader2 className="animate-spin" size={24} /> : 'Save Profile Details'}
      </button>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <div className="text-center p-2 space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 border border-red-100 animate-pulse">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-ink">Remove profile picture?</h4>
            <p className="text-sm text-muted">This will delete your photo and revert to your fallback initials with colorful background gradient.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-cream-2 text-[14px] font-bold text-ink hover:bg-cream-3 border border-sand/40 rounded-xl py-2.5 transition-all text-center"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false)
                handleDeleteAvatar()
              }}
              className="flex-1 bg-red-500 text-[14px] font-bold text-white hover:bg-red-650 rounded-xl py-2.5 transition-all text-center"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
    </form>
  )
}


interface LinkFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Link>) => void
  initialData: Link | null
}

function LinkFormModal({ isOpen, onClose, onSubmit, initialData }: LinkFormModalProps) {
  const { gate, can, plan } = usePlan()
  const thumbnailRef = React.useRef<HTMLInputElement>(null)
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Partial<Link>>({
    resolver: zodResolver(LinkSchema)
  })

  const watchThumbnail = watch('thumbnailUrl')

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      toast.error('Image must be less than 500KB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setValue('thumbnailUrl', reader.result as string)
      toast.success('Thumbnail added')
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Prepare initial values
        const formatted = {
          ...initialData,
          showFrom: (initialData.showFrom as Timestamp | null)?.toDate ? (initialData.showFrom as Timestamp).toDate().toISOString().split('T')[0] : (initialData.showFrom as unknown as string || ''),
          showUntil: (initialData.showUntil as Timestamp | null)?.toDate ? (initialData.showUntil as Timestamp).toDate().toISOString().split('T')[0] : (initialData.showUntil as unknown as string || ''),
          utmSource: initialData.utmSource || '',
          utmMedium: initialData.utmMedium || '',
          utmCampaign: initialData.utmCampaign || '',
          upiId: initialData.upiId || '',
          displayName: initialData.displayName || '',
          defaultAmount: initialData.defaultAmount !== undefined ? String(initialData.defaultAmount) : '',
          upiGoalEnabled: initialData.upiGoalEnabled || false,
          upiGoalTitle: initialData.upiGoalTitle || '',
          upiGoalTarget: initialData.upiGoalTarget !== undefined ? String(initialData.upiGoalTarget) : '',
          upiGoalRaised: initialData.upiGoalRaised !== undefined ? String(initialData.upiGoalRaised) : '',
        }
        reset(formatted)
      } else {
        reset({ 
          title: '', 
          url: '', 
          description: '', 
          type: 'URL', 
          isActive: true, 
          isPinned: false, 
          utmSource: '', 
          utmMedium: '', 
          utmCampaign: '',
          showFrom: '',
          showUntil: '',
          upiId: '',
          displayName: '',
          defaultAmount: '',
          upiGoalEnabled: false,
          upiGoalTitle: '',
          upiGoalTarget: '',
          upiGoalRaised: '',
        })
      }
    }
  }, [isOpen, initialData, reset])

  const handleModalSubmit = (data: Record<string, unknown>) => {
    const payload = {
      ...data,
      showFrom: data.showFrom ? Timestamp.fromDate(new Date(data.showFrom as string)) : null,
      showUntil: data.showUntil ? Timestamp.fromDate(new Date(data.showUntil as string)) : null,
    }

    if (payload.type === 'UPI' || payload.type === 'upi_tip') {
      payload.url = payload.url || `upi://pay?pa=${payload.upiId || ''}`
      if (payload.defaultAmount !== undefined && payload.defaultAmount !== '') {
        payload.defaultAmount = Number(payload.defaultAmount)
      } else {
        payload.defaultAmount = 50
      }
      
      if (payload.upiGoalTarget !== undefined && payload.upiGoalTarget !== '') {
        payload.upiGoalTarget = Number(payload.upiGoalTarget)
      } else {
        payload.upiGoalTarget = 0
      }
      if (payload.upiGoalRaised !== undefined && payload.upiGoalRaised !== '') {
        payload.upiGoalRaised = Number(payload.upiGoalRaised)
      } else {
        payload.upiGoalRaised = 0
      }
    }

    // Remove read-only or auto-generated fields just in case
    const safePayload = { ...payload } as Record<string, unknown>;
    delete safePayload.id;
    delete safePayload.clickCount;
    delete safePayload.lastClickedAt;
    delete safePayload.createdAt;
    delete safePayload.updatedAt;

    onSubmit(safePayload as Partial<Link>)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Small delay to allow keyboard to start appearing and layout to shift
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const currentType = watch('type')
  const isUpi = currentType === 'UPI' || currentType === 'upi_tip'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? 'Edit Link' : 'Add New Link'}>
      <form onSubmit={handleSubmit(handleModalSubmit)} className="space-y-6">
        <div className="space-y-4">
          {isUpi ? (
            <>
              <div>
                <label className="label-text">UPI ID *</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: abhishek@oksbi, user@paytm" 
                  {...register('upiId')} 
                  onFocus={handleFocus}
                />
                {errors.upiId && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.upiId.message as string}</p>}
              </div>

              <div>
                <label className="label-text">DISPLAY NAME</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: Abhishek" 
                  {...register('displayName')} 
                  onFocus={handleFocus}
                />
                {errors.displayName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.displayName.message as string}</p>}
              </div>

              <div>
                <label className="label-text">DEFAULT TIP AMOUNT (₹)</label>
                <input 
                  type="text"
                  className="input-field text-xs font-bold" 
                  placeholder="Ex: 50" 
                  {...register('defaultAmount')} 
                  onFocus={handleFocus}
                />
                {errors.defaultAmount && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.defaultAmount.message as string}</p>}
              </div>

              <div>
                <label className="label-text">CUSTOM BUTTON TEXT</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: Buy Me a Coffee ❤️" 
                  {...register('title')} 
                  onFocus={handleFocus}
                />
                {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.title.message as string}</p>}
              </div>

              {/* Premium Support Goal config */}
              <div className="border border-cream-2 rounded-2xl p-4 bg-cream-1/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-ink flex items-center gap-1.5">
                      🏆 Support Goals Config (Pro+)
                    </h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Let users see your progress & reward targets</p>
                  </div>
                  {plan === 'PRO_PLUS' ? (
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      {...register('upiGoalEnabled')}
                    />
                  ) : (
                    <span 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase cursor-pointer" 
                      onClick={() => gate('canUseUPI', () => {})}
                    >
                      Unlock with Pro+
                    </span>
                  )}
                </div>

                {watch('upiGoalEnabled') && plan === 'PRO_PLUS' && (
                  <div className="space-y-3 pt-2 border-t border-cream-2">
                    <div>
                      <label className="label-text text-[10px]">GOAL TITLE / PURPOSE</label>
                      <input 
                        className="input-field" 
                        placeholder="Ex: New Stream Mic, Equipment Funding" 
                        {...register('upiGoalTitle')} 
                        onFocus={handleFocus}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-text text-[10px]">TARGET GOAL AMOUNT (₹)</label>
                        <input 
                          type="text"
                          className="input-field" 
                          placeholder="Ex: 10000" 
                          {...register('upiGoalTarget')} 
                          onFocus={handleFocus}
                        />
                      </div>
                      <div>
                        <label className="label-text text-[10px]">CURRENTLY RAISED (₹)</label>
                        <input 
                          type="text"
                          className="input-field" 
                          placeholder="Ex: 6800" 
                          {...register('upiGoalRaised')} 
                          onFocus={handleFocus}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label-text">TITLE</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: New YouTube Video" 
                  {...register('title')} 
                  onFocus={handleFocus}
                />
                {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.title.message as string}</p>}
              </div>

              <div>
                <label className="label-text">URL</label>
                <input 
                  className="input-field" 
                  placeholder="https://..." 
                  {...register('url')} 
                  onFocus={handleFocus}
                />
                {errors.url && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.url.message as string}</p>}
              </div>

              <div>
                <label className="label-text">DESCRIPTION (OPTIONAL)</label>
                <input 
                  className="input-field text-xs font-bold" 
                  placeholder="Subtitle or extra context..." 
                  {...register('description')} 
                  onFocus={handleFocus}
                />
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Image Section */}
        <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="label-text mb-0">THUMBNAIL IMAGE</label>
              {!can('canCustomThumbnails') && (
                 <span className="bg-orange/10 text-orange text-[8px] font-black px-2 py-0.5 rounded-full uppercase">PRO</span>
               )}
            </div>
            
            <div className="flex items-center gap-4">
               <div 
                 onClick={() => {
                   if (!can('canCustomThumbnails')) return gate('canCustomThumbnails', () => {})
                   thumbnailRef.current?.click()
                 }}
                 className="w-16 h-16 rounded-xl bg-cream-2 border border-cream-3 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange transition-all relative group/thumb shadow-inner"
               >
                  {watchThumbnail ? (
                    <img src={watchThumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Plus size={20} className="text-muted" />
                  )}
                  {watchThumbnail && (
                     <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                       <span className="text-white text-[8px] font-black uppercase tracking-widest">Change</span>
                     </div>
                  )}
               </div>
               
               <div className="flex flex-col gap-1">
                 {watchThumbnail ? (
                   <button 
                     type="button" 
                     onClick={() => setValue('thumbnailUrl', null)}
                     className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1"
                   >
                     <Trash2 size={12} /> Remove
                   </button>
                 ) : (
                   <div className="text-[10px] text-muted font-bold uppercase tracking-widest">
                     Square image recommended
                   </div>
                 )}
               </div>
               
               <input 
                 type="file" 
                 ref={thumbnailRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={handleThumbnailChange} 
               />
            </div>
        </div>

        {/* Pro Features Section */}
        <div className="border-t border-cream-3 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink">Advanced Settings</h4>
            {!can('canSchedule') && (
              <span className="bg-orange/10 text-orange text-[8px] font-black px-2 py-0.5 rounded-full uppercase">PRO</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <label className="label-text">SHOW FROM</label>
              <input 
                type="date" 
                className="input-field text-xs" 
                {...register('showFrom')}
                onFocus={(e) => {
                  handleFocus(e);
                  if (!can('canSchedule')) gate('canSchedule', () => {});
                }}
              />
              {!can('canSchedule') && <div className="absolute inset-x-0 bottom-0 top-6 cursor-pointer" onClick={() => gate('canSchedule', () => {})} />}
            </div>
            <div className="relative group">
              <label className="label-text">SHOW UNTIL</label>
              <input 
                type="date" 
                className="input-field text-xs" 
                {...register('showUntil')}
                onFocus={(e) => {
                  handleFocus(e);
                  if (!can('canSchedule')) gate('canSchedule', () => {});
                }}
              />
              {!can('canSchedule') && <div className="absolute inset-x-0 bottom-0 top-6 cursor-pointer" onClick={() => gate('canSchedule', () => {})} />}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div>
                <label className="label-text text-[9px]">UTM SOURCE</label>
                <input 
                  className="input-field text-xs" 
                  placeholder="source" 
                  {...register('utmSource')} 
                  onFocus={(e) => {
                    handleFocus(e);
                    if (!can('canSchedule')) gate('canSchedule', () => {});
                  }}
                />
             </div>
             <div>
                <label className="label-text text-[9px]">UTM MEDIUM</label>
                <input 
                  className="input-field text-xs" 
                  placeholder="medium" 
                  {...register('utmMedium')} 
                  onFocus={(e) => {
                    handleFocus(e);
                    if (!can('canSchedule')) gate('canSchedule', () => {});
                  }}
                />
             </div>
             <div>
                <label className="label-text text-[9px]">UTM CAMP.</label>
                <input 
                  className="input-field text-xs" 
                  placeholder="camp" 
                  {...register('utmCampaign')} 
                  onFocus={(e) => {
                    handleFocus(e);
                    if (!can('canSchedule')) gate('canSchedule', () => {});
                  }}
                />
             </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onClose} className="flex-1 btn-outline h-12 uppercase text-xs font-bold border-cream-3">Cancel</button>
          <button type="submit" className="flex-1 btn-primary h-12 uppercase text-xs font-bold">Save Link</button>
        </div>
      </form>
    </Modal>
  )
}


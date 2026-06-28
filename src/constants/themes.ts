import type { Theme, PlanType } from '@/types'

export const THEMES: Theme[] = [
  // --- BASIC THEMES (FREE) ---
  {
    id: 'snow-white', name: 'Snow White', requiredPlan: 'FREE',
    bgColor: '#FFFFFF', textColor: '#0F172A', accentColor: '#1E293B',
    cardBg: '#F8FAFC', borderColor: '#E2E8F0', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
  },
  {
    id: 'saffron', name: 'Saffron', requiredPlan: 'FREE',
    bgColor: '#FDFCFB', textColor: '#2D2824', accentColor: '#E67E22',
    cardBg: '#FFFFFF', borderColor: '#F3EFE9', buttonStyle: 'filled',
    preview: 'linear-gradient(135deg, #FDFCFB 0%, #FAD9C1 100%)',
  },

  // --- PREMIUM STATIC THEMES (PRO) ---
  {
    id: 'midnight-black', name: 'Midnight Black', requiredPlan: 'PRO',
    bgColor: '#000000', textColor: '#FFFFFF', accentColor: '#3B82F6',
    cardBg: '#111111', borderColor: 'rgba(255,255,255,0.1)', buttonStyle: 'filled',
    preview: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
  },
  {
    id: 'royal-purple', name: 'Royal Purple', requiredPlan: 'PRO',
    bgColor: '#1E1B4B', textColor: '#F5F3FF', accentColor: '#A855F7',
    cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(168,85,247,0.2)', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)',
  },
  {
    id: 'ocean-blue', name: 'Ocean Blue', requiredPlan: 'PRO',
    bgColor: '#082F49', textColor: '#F0F9FF', accentColor: '#0EA5E9',
    cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(14,165,233,0.2)', buttonStyle: 'filled',
    preview: 'linear-gradient(135deg, #082F49 0%, #0369A1 100%)',
  },
  {
    id: 'rose-gold', name: 'Rose Gold', requiredPlan: 'PRO',
    bgColor: '#451A03', textColor: '#FFEDD5', accentColor: '#FB923C',
    cardBg: 'rgba(251,146,60,0.05)', borderColor: 'rgba(251,146,60,0.2)', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #451A03 0%, #9A3412 100%)',
  },
  {
    id: 'emerald-glass', name: 'Emerald Glass', requiredPlan: 'PRO',
    bgColor: '#064E3B', textColor: '#ECFDF5', accentColor: '#10B981',
    cardBg: 'rgba(255,255,255,0.1)', borderColor: 'rgba(16,185,129,0.3)', buttonStyle: 'soft',
    isGlass: true, cardTransparency: 0.1, blurAmount: 10,
    preview: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
  },
  {
    id: 'sunset-orange', name: 'Sunset Orange', requiredPlan: 'PRO',
    bgColor: '#7C2D12', textColor: '#FFF7ED', accentColor: '#F97316',
    cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(249,115,22,0.2)', buttonStyle: 'filled',
    preview: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)',
  },
  {
    id: 'dark-neon', name: 'Dark Neon', requiredPlan: 'PRO',
    bgColor: '#000000', textColor: '#FFFFFF', accentColor: '#22D3EE',
    cardBg: '#050505', borderColor: '#22D3EE', buttonStyle: 'outline',
    preview: 'linear-gradient(135deg, #000000 0%, #050505 100%)',
  },

  // --- ULTRA-PREMIUM ANIMATED THEMES (PRO+) ---
  {
    id: 'aurora-borealis', name: 'Aurora Borealis', requiredPlan: 'PRO', isAnimated: true, animationType: 'aurora',
    bgColor: '#080818', textColor: '#FFFFFF', accentColor: '#6366F1',
    cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(120,220,180,0.2)', buttonStyle: 'pill',
    avatarRing: '3px solid transparent', avatarGlow: '0 0 30px rgba(120,220,180,0.4)',
    avatarRingAnimation: 'aurora-ring', nameGlow: '0 0 20px rgba(120,220,180,0.4)',
    preview: 'linear-gradient(135deg, #080818 0%, #0d2818 50%, #1a0d33 100%)',
  },
  {
    id: 'midnight-gold', name: 'Midnight Gold', requiredPlan: 'PRO', isAnimated: true, animationType: 'particles',
    bgColor: '#0A0800', textColor: '#D4AF37', accentColor: '#D4AF37',
    cardBg: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.3)', buttonStyle: 'filled',
    avatarRing: '3px solid #D4AF37', avatarGlow: '0 0 30px rgba(212,175,55,0.5)',
    avatarRingAnimation: 'gold-pulse', nameGlow: '0 0 15px rgba(212,175,55,0.4)',
    preview: 'linear-gradient(135deg, #0A0800 0%, #1A1508 100%)',
  },
  {
    id: 'rose-glass', name: 'Rose Glass', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'petals',
    bgColor: '#C44569', textColor: '#FFFFFF', accentColor: '#FFFFFF',
    cardBg: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', buttonStyle: 'pill',
    isGlass: true, cardTransparency: 0.15, blurAmount: 15,
    avatarRing: '3px solid rgba(255,255,255,0.8)', avatarGlow: '0 0 30px rgba(255,255,255,0.3)',
    avatarRingAnimation: 'glass-ring',
    buttonTextColor: '#C44569',
    preview: 'linear-gradient(135deg, #FF6B9D 0%, #E8527A 100%)',
  },
  {
    id: 'cosmic-purple', name: 'Cosmic Purple', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'stars',
    bgColor: '#07000F', textColor: '#E9D5FF', accentColor: '#A855F7',
    cardBg: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #A855F7', avatarGlow: '0 0 30px rgba(168,85,247,0.5)',
    avatarRingAnimation: 'cosmic-pulse', nameGlow: '0 0 20px rgba(168,85,247,0.4)',
    preview: 'linear-gradient(135deg, #07000F 0%, #1A0033 100%)',
  },
  {
    id: 'saffron-royal', name: 'Saffron Royal', requiredPlan: 'PRO', isAnimated: true, animationType: 'particles',
    bgColor: '#1A0800', textColor: '#FF8C00', accentColor: '#FF6B00',
    cardBg: 'rgba(255,107,0,0.05)', borderColor: 'rgba(255,107,0,0.3)', buttonStyle: 'filled',
    avatarRing: '4px solid #FF6B00', avatarGlow: '0 0 30px rgba(255,107,0,0.6)',
    avatarRingAnimation: 'royal-ring', nameGlow: '0 0 20px rgba(255,140,0,0.5)',
    preview: 'linear-gradient(135deg, #1A0800 0%, #3D1505 100%)',
  },
  {
    id: 'ocean-depth', name: 'Ocean Depth', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'waves',
    bgColor: '#001020', textColor: '#BAE6FD', accentColor: '#0EA5E9',
    cardBg: 'rgba(14,165,233,0.05)', borderColor: 'rgba(14,165,233,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #0EA5E9', avatarGlow: '0 0 30px rgba(14,165,233,0.5)',
    avatarRingAnimation: 'wave-ring', nameGlow: '0 0 15px rgba(14,165,233,0.4)',
    preview: 'linear-gradient(135deg, #001020 0%, #002040 100%)',
  },
  {
    id: 'cherry-blossom', name: 'Cherry Blossom', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'petals',
    bgColor: '#FDF2F8', textColor: '#831843', accentColor: '#EC4899',
    cardBg: 'rgba(255,255,255,0.7)', borderColor: 'rgba(236,72,153,0.2)', buttonStyle: 'pill',
    avatarRing: '3px solid #EC4899', avatarGlow: '0 0 30px rgba(236,72,153,0.3)',
    avatarRingAnimation: 'ring-pulse',
    preview: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
  },
  {
    id: 'carbon-neon', name: 'Carbon Neon', requiredPlan: 'PRO', isAnimated: true, animationType: 'neon',
    bgColor: '#050505', textColor: '#00FF88', accentColor: '#00FF88',
    cardBg: 'rgba(0,0,0,0.8)', borderColor: 'rgba(0,255,136,0.3)', buttonStyle: 'outline',
    avatarRing: '3px solid #00FF88', avatarGlow: '0 0 30px rgba(0,255,136,0.6)',
    avatarRingAnimation: 'neon-pulse', nameGlow: '0 0 20px rgba(0,255,136,0.5)',
    preview: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
  },
  {
    id: 'ivory-elegance', name: 'Ivory Elegance', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'particles',
    bgColor: '#FDFCFB', textColor: '#1C1813', accentColor: '#C084FC',
    cardBg: 'rgba(255,255,255,0.9)', borderColor: 'rgba(192,132,252,0.2)', buttonStyle: 'soft',
    avatarRing: '3px solid #C084FC', avatarGlow: '0 0 20px rgba(192,132,252,0.3)',
    avatarRingAnimation: 'crystal-ring',
    preview: 'linear-gradient(135deg, #FDFCFB 0%, #F5F0EA 100%)',
  },
  {
    id: 'sunset-boulevard', name: 'Sunset Boulevard', requiredPlan: 'PRO', isAnimated: true, animationType: 'aurora',
    bgColor: '#451A03', textColor: '#FFF7ED', accentColor: '#F97316',
    cardBg: 'rgba(255,255,255,0.1)', borderColor: 'rgba(249,115,22,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #F97316', avatarGlow: '0 0 30px rgba(249,115,22,0.4)',
    avatarRingAnimation: 'gold-pulse',
    preview: 'linear-gradient(135deg, #451A03 0%, #EA580C 100%)',
  },
  {
    id: 'forest-zen', name: 'Forest Zen', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'particles',
    bgColor: '#064E3B', textColor: '#ECFDF5', accentColor: '#10B981',
    cardBg: 'rgba(255,255,255,0.08)', borderColor: 'rgba(16,185,129,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #10B981', avatarGlow: '0 0 30px rgba(16,185,129,0.4)',
    avatarRingAnimation: 'glass-ring',
    preview: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
  },
  {
    id: 'crystal-clear', name: 'Crystal Clear', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'particles',
    bgColor: '#EFF6FF', textColor: '#1E40AF', accentColor: '#3B82F6',
    cardBg: 'rgba(255,255,255,0.7)', borderColor: 'rgba(59,130,246,0.3)', buttonStyle: 'pill',
    isGlass: true, cardTransparency: 0.7, blurAmount: 20,
    avatarRing: '3px solid #3B82F6', avatarGlow: '0 0 30px rgba(59,130,246,0.3)',
    avatarRingAnimation: 'crystal-ring',
    preview: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)',
  },
  {
    id: 'love-birds', name: 'Love Birds', requiredPlan: 'PRO', isAnimated: true, animationType: 'hearts',
    bgColor: '#FFF5F7', textColor: '#BE185D', accentColor: '#F472B6',
    cardBg: 'rgba(255,255,255,0.8)', borderColor: 'rgba(244,114,182,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #F472B6', avatarGlow: '0 0 20px rgba(244,114,182,0.3)',
    avatarRingAnimation: 'ring-pulse',
    preview: 'linear-gradient(135deg, #FFF5F7 0%, #FCE7F3 100%)',
  },
  {
    id: 'underwater', name: 'Underwater', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'bubbles',
    bgColor: '#0C4A6E', textColor: '#E0F2FE', accentColor: '#38BDF8',
    cardBg: 'rgba(255,255,255,0.1)', borderColor: 'rgba(56,189,248,0.3)', buttonStyle: 'pill',
    isGlass: true, cardTransparency: 0.1, blurAmount: 10,
    avatarRing: '3px solid #38BDF8', avatarGlow: '0 0 30px rgba(56,189,248,0.4)',
    avatarRingAnimation: 'wave-ring',
    preview: 'linear-gradient(135deg, #0C4A6E 0%, #075985 100%)',
  },
  {
    id: 'forest-glow', name: 'Forest Glow', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'fireflies',
    bgColor: '#052E16', textColor: '#DCFCE7', accentColor: '#22C55E',
    cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(34,197,94,0.3)', buttonStyle: 'pill',
    avatarRing: '3px solid #EAB308', avatarGlow: '0 0 30px rgba(234,179,8,0.5)',
    avatarRingAnimation: 'gold-pulse',
    preview: 'linear-gradient(135deg, #052E16 0%, #064E3B 100%)',
  },
  {
    id: 'pride-rainbow', name: 'Pride Rainbow', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'rainbow',
    bgColor: '#171717', textColor: '#FFFFFF', accentColor: '#FFFFFF',
    cardBg: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', buttonStyle: 'pill',
    isGlass: true, cardTransparency: 0.1, blurAmount: 20,
    avatarRing: '3px solid #FFFFFF', avatarGlow: '0 0 40px rgba(255,255,255,0.3)',
    avatarRingAnimation: 'glass-ring',
    buttonTextColor: '#000000',
    preview: 'linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
  },
  {
    id: 'cloudy-day', name: 'Cloudy Day', requiredPlan: 'PRO_PLUS', isAnimated: true, animationType: 'clouds',
    bgColor: '#F0F9FF', textColor: '#0369A1', accentColor: '#0EA5E9',
    cardBg: 'rgba(255,255,255,0.8)', borderColor: 'rgba(14,165,233,0.2)', buttonStyle: 'pill',
    avatarRing: '3px solid #FFFFFF', avatarGlow: '0 0 20px rgba(14,165,233,0.2)',
    avatarRingAnimation: 'glass-ring',
    preview: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
  },

  // --- POOKIE STYLE THEMES (PRO) ---
  {
    id: 'strawberry-milk', name: 'Strawberry Milk', requiredPlan: 'PRO_PLUS',
    bgColor: '#FFF0F3', textColor: '#C2185B', accentColor: '#FF4081',
    cardBg: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,163,183,0.4)', buttonStyle: 'pill',
    preview: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 40%, #FFCCD8 100%)',
  },
  {
    id: 'cloud-nine', name: 'Cloud Nine', requiredPlan: 'PRO_PLUS',
    bgColor: '#E8F4FD', textColor: '#1565C0', accentColor: '#42A5F5',
    cardBg: 'rgba(255,255,255,0.85)', borderColor: 'rgba(176,216,255,0.5)', buttonStyle: 'pill',
    preview: 'linear-gradient(180deg, #E8F4FD 0%, #F0F8FF 40%, #EDE7F6 100%)',
  },
  {
    id: 'bubblegum-pop', name: 'Bubblegum Pop', requiredPlan: 'PRO_PLUS',
    bgColor: '#FF6EC7', textColor: '#FFFFFF', accentColor: '#D81B60',
    cardBg: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #FF6EC7 0%, #FF9FD8 30%, #C89EFF 65%)',
  },
  {
    id: 'butter-yellow', name: 'Butter Yellow', requiredPlan: 'PRO_PLUS',
    bgColor: '#FFFDE7', textColor: '#E65100', accentColor: '#FFC107',
    cardBg: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,213,79,0.4)', buttonStyle: 'pill',
    preview: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9C4 40%, #FFFDE7 100%)',
  },
  {
    id: 'matcha-latte', name: 'Matcha Latte', requiredPlan: 'PRO_PLUS',
    bgColor: '#F1F8E9', textColor: '#2E7D32', accentColor: '#8BC34A',
    cardBg: 'rgba(255,255,255,0.84)', borderColor: 'rgba(139,195,74,0.35)', buttonStyle: 'pill',
    preview: 'linear-gradient(160deg, #F1F8E9 0%, #E8F5E9 40%, #DCEDC8 100%)',
  },
  {
    id: 'baby-blue-sky', name: 'Baby Blue Sky', requiredPlan: 'PRO_PLUS',
    bgColor: '#E3F2FD', textColor: '#0D47A1', accentColor: '#42A5F5',
    cardBg: 'rgba(255,255,255,0.8)', borderColor: 'rgba(100,181,246,0.35)', buttonStyle: 'pill',
    preview: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
  },
  {
    id: 'candy-floss', name: 'Candy Floss', requiredPlan: 'PRO_PLUS',
    bgColor: '#FCE4EC', textColor: '#880E4F', accentColor: '#F06292',
    cardBg: 'rgba(255,255,255,0.75)', borderColor: 'rgba(240,98,146,0.3)', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 20%, #EDE7F6 50%)',
  },
  {
    id: 'peach-boba', name: 'Peach Boba', requiredPlan: 'PRO_PLUS',
    bgColor: '#FFF3E0', textColor: '#BF360C', accentColor: '#FF7043',
    cardBg: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,138,101,0.35)', buttonStyle: 'pill',
    preview: 'linear-gradient(160deg, #FFF3E0 0%, #FFE0B2 35%, #FFCCBC 70%)',
  },
  {
    id: 'lavender-dreams', name: 'Lavender Dreams', requiredPlan: 'PRO_PLUS',
    bgColor: '#F3E5F5', textColor: '#4A148C', accentColor: '#AB47BC',
    cardBg: 'rgba(255,255,255,0.8)', borderColor: 'rgba(186,104,200,0.35)', buttonStyle: 'pill',
    preview: 'linear-gradient(160deg, #F3E5F5 0%, #EDE7F6 40%, #CE93D8 100%)',
  },
  {
    id: 'y2k-glitter', name: 'Y2K Glitter', requiredPlan: 'PRO_PLUS',
    bgColor: '#F8F0FF', textColor: '#5B009E', accentColor: '#FF40FF',
    cardBg: 'rgba(255,255,255,0.72)', borderColor: 'transparent', buttonStyle: 'pill',
    preview: 'linear-gradient(135deg, #F8F0FF 0%, #FFF0F8 25%, #E8D0FF 100%)',
  },
]

export const getTheme = (id: string, plan: PlanType = 'FREE'): Theme => {
  const theme = THEMES.find(t => t.id === id) ?? THEMES.find(t => t.id === 'snow-white')!
  
  // If plan is provided, ensure theme is allowed for that plan
  if (plan === 'FREE' && theme.requiredPlan !== 'FREE') {
    return THEMES.find(t => t.id === 'snow-white')!
  }

  if (plan === 'PRO' && theme.requiredPlan === 'PRO_PLUS') {
    return THEMES.find(t => t.id === 'snow-white')!
  }
  
  return theme
}

export const getAvailableThemes = (plan: PlanType): Theme[] => {
  if (plan === 'PRO_PLUS') return THEMES
  if (plan === 'PRO') return THEMES.filter(t => t.requiredPlan !== 'PRO_PLUS')
  return THEMES.filter(t => t.requiredPlan === 'FREE')
}

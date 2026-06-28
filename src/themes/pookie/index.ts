export interface PookieTheme {
  id: string
  name: string
  emoji: string
  vibe: string                  // Short description
  requiredPlan: 'PRO' | 'PRO_PLUS'

  // Colors
  pageBg: string                // CSS background
  pageBg2: string               // Secondary bg for gradient
  cardBg: string                // Link button background
  cardBgHover: string
  cardBorder: string
  cardShadow: string
  cardShadowHover: string
  cardRadius: string            // Always very rounded

  // Text
  nameColor: string
  nameFont: string              // Cute rounded font
  handleColor: string
  bioColor: string

  // Buttons
  btnTextColor: string
  btnFont: string

  // Avatar
  avatarRingColors: string[]    // Gradient ring colors
  avatarGlow: string
  avatarBlobColor: string       // Soft blob behind avatar

  // Social icons
  socialBg: string
  socialBgHover: string
  socialIconColor: string
  socialBorder: string

  // Background
  floatingIcons: FloatingIconConfig[]
  bgEffect: 'bubbles' | 'sparkles' | 'clouds' | 'petals' | 'stars' | 'none'
  bgEffectColor: string

  // Accent
  accentColor: string           // Primary accent
  accentGlow: string            // Glow version of accent
  secondaryAccent: string       // Secondary pop color

  // Branding
  brandingColor: string
}

interface FloatingIconConfig {
  icon: string                  // Emoji
  count: number                 // How many
  size: [number, number]        // [min, max] in px
  opacity: [number, number]     // [min, max]
  speed: [number, number]       // [min, max] seconds per cycle
  blur?: boolean                // Soft blur for depth
}

// ─── ALL 10 POOKIE THEMES ─────────────────────────────────────

export const POOKIE_THEMES: PookieTheme[] = [

  // ── 1. STRAWBERRY MILK ────────────────────────────────────
  {
    id: 'strawberry-milk',
    name: 'Strawberry Milk',
    emoji: '🍓',
    vibe: 'Sweet & dreamy',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 40%, #FFF0F3 100%)',
    pageBg2: '#FFCCD8',
    cardBg: 'rgba(255,255,255,0.80)',
    cardBgHover: 'rgba(255,255,255,0.95)',
    cardBorder: '1.5px solid rgba(255,163,183,0.4)',
    cardShadow: '0 4px 20px rgba(255,105,140,0.12), 0 1px 4px rgba(255,105,140,0.08)',
    cardShadowHover: '0 12px 40px rgba(255,105,140,0.25), 0 4px 12px rgba(255,105,140,0.15)',
    cardRadius: '24px',

    nameColor: '#C2185B',
    nameFont: "'Syne', sans-serif",
    handleColor: '#E91E8C',
    bioColor: '#AD1457',

    btnTextColor: '#880E4F',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#FF8FAB', '#FF4081', '#FF80AB'],
    avatarGlow: '0 0 30px rgba(255,64,129,0.4), 0 0 60px rgba(255,143,171,0.2)',
    avatarBlobColor: 'rgba(255,143,171,0.15)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#FF8FAB',
    socialIconColor: '#E91E8C',
    socialBorder: '1.5px solid rgba(255,143,171,0.3)',

    floatingIcons: [
      { icon: '🍓', count: 8,  size: [16,28], opacity: [0.2,0.5], speed: [8,14] },
      { icon: '🌸', count: 10, size: [14,22], opacity: [0.15,0.4], speed: [10,18], blur: true },
      { icon: '💗', count: 7,  size: [12,20], opacity: [0.2,0.45], speed: [7,12] },
      { icon: '🌟', count: 6,  size: [10,16], opacity: [0.15,0.35], speed: [9,15], blur: true },
      { icon: '✨', count: 12, size: [8,14],  opacity: [0.1,0.3],  speed: [6,10] },
    ],
    bgEffect: 'petals',
    bgEffectColor: 'rgba(255,143,171,0.3)',

    accentColor: '#FF4081',
    accentGlow: 'rgba(255,64,129,0.35)',
    secondaryAccent: '#FF8FAB',
    brandingColor: 'rgba(233,30,140,0.35)',
  },

  // ── 2. CLOUD NINE ─────────────────────────────────────────
  {
    id: 'cloud-nine',
    name: 'Cloud Nine',
    emoji: '☁️',
    vibe: 'Soft & floaty',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(180deg, #E8F4FD 0%, #F0F8FF 40%, #EDE7F6 100%)',
    pageBg2: '#D4E8F8',
    cardBg: 'rgba(255,255,255,0.85)',
    cardBgHover: 'rgba(255,255,255,0.97)',
    cardBorder: '1.5px solid rgba(176,216,255,0.5)',
    cardShadow: '0 4px 24px rgba(144,190,255,0.15), 0 1px 4px rgba(144,190,255,0.1)',
    cardShadowHover: '0 16px 48px rgba(144,190,255,0.3), 0 4px 16px rgba(144,190,255,0.15)',
    cardRadius: '28px',

    nameColor: '#1565C0',
    nameFont: "'Syne', sans-serif",
    handleColor: '#42A5F5',
    bioColor: '#1976D2',

    btnTextColor: '#0D47A1',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#90CAF9', '#42A5F5', '#E1BEE7'],
    avatarGlow: '0 0 30px rgba(144,202,249,0.5), 0 0 60px rgba(225,190,231,0.2)',
    avatarBlobColor: 'rgba(144,202,249,0.2)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#90CAF9',
    socialIconColor: '#1976D2',
    socialBorder: '1.5px solid rgba(144,202,249,0.3)',

    floatingIcons: [
      { icon: '☁️', count: 6,  size: [30,55], opacity: [0.12,0.28], speed: [15,25], blur: true },
      { icon: '⭐', count: 10, size: [12,20], opacity: [0.2,0.45],  speed: [8,14] },
      { icon: '🌙', count: 4,  size: [16,26], opacity: [0.15,0.3],  speed: [12,20], blur: true },
      { icon: '💜', count: 6,  size: [10,18], opacity: [0.15,0.35], speed: [9,15] },
      { icon: '🫧', count: 8,  size: [8,16],  opacity: [0.1,0.25],  speed: [7,12] },
    ],
    bgEffect: 'clouds',
    bgEffectColor: 'rgba(144,202,249,0.25)',

    accentColor: '#42A5F5',
    accentGlow: 'rgba(66,165,245,0.35)',
    secondaryAccent: '#CE93D8',
    brandingColor: 'rgba(66,165,245,0.35)',
  },

  // ── 3. BUBBLEGUM POP ──────────────────────────────────────
  {
    id: 'bubblegum-pop',
    name: 'Bubblegum Pop',
    emoji: '🫧',
    vibe: 'Bold & bubbly',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(135deg, #FF6EC7 0%, #FF9FD8 30%, #C89EFF 65%, #FF6EC7 100%)',
    pageBg2: '#FF80CC',
    cardBg: 'rgba(255,255,255,0.18)',
    cardBgHover: 'rgba(255,255,255,0.28)',
    cardBorder: '1.5px solid rgba(255,255,255,0.35)',
    cardShadow: '0 4px 20px rgba(0,0,0,0.1)',
    cardShadowHover: '0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.4)',
    cardRadius: '50px',

    nameColor: '#FFFFFF',
    nameFont: "'Syne', sans-serif",
    handleColor: 'rgba(255,255,255,0.75)',
    bioColor: 'rgba(255,255,255,0.8)',

    btnTextColor: '#FFFFFF',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#FFFFFF', '#FFD6F0', '#FFFFFF'],
    avatarGlow: '0 0 30px rgba(255,255,255,0.5), 0 0 80px rgba(255,110,199,0.3)',
    avatarBlobColor: 'rgba(255,255,255,0.15)',

    socialBg: 'rgba(255,255,255,0.18)',
    socialBgHover: 'rgba(255,255,255,0.35)',
    socialIconColor: '#FFFFFF',
    socialBorder: '1.5px solid rgba(255,255,255,0.3)',

    floatingIcons: [
      { icon: '🫧', count: 12, size: [14,30], opacity: [0.15,0.4], speed: [6,12] },
      { icon: '💖', count: 8,  size: [12,22], opacity: [0.2,0.5],  speed: [8,14] },
      { icon: '🍬', count: 6,  size: [14,24], opacity: [0.15,0.35], speed: [10,16] },
      { icon: '⭐', count: 10, size: [8,16],  opacity: [0.2,0.45], speed: [5,10] },
      { icon: '🦄', count: 4,  size: [18,28], opacity: [0.15,0.3], speed: [12,20] },
    ],
    bgEffect: 'bubbles',
    bgEffectColor: 'rgba(255,255,255,0.3)',

    accentColor: '#D81B60',
    accentGlow: 'rgba(216,27,96,0.4)',
    secondaryAccent: '#FFD6F0',
    brandingColor: 'rgba(255,255,255,0.45)',
  },

  // ── 4. BUTTER YELLOW ──────────────────────────────────────
  {
    id: 'butter-yellow',
    name: 'Butter Yellow',
    emoji: '🌻',
    vibe: 'Sunny & happy',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9C4 40%, #FFFDE7 100%)',
    pageBg2: '#FFF176',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBgHover: 'rgba(255,255,255,0.96)',
    cardBorder: '1.5px solid rgba(255,213,79,0.4)',
    cardShadow: '0 4px 20px rgba(255,193,7,0.15), 0 1px 4px rgba(255,193,7,0.1)',
    cardShadowHover: '0 12px 40px rgba(255,193,7,0.28), 0 4px 12px rgba(255,193,7,0.15)',
    cardRadius: '22px',

    nameColor: '#E65100',
    nameFont: "'Syne', sans-serif",
    handleColor: '#FF8F00',
    bioColor: '#BF360C',

    btnTextColor: '#4E2400',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#FFD54F', '#FFCA28', '#FFE082'],
    avatarGlow: '0 0 30px rgba(255,213,79,0.55), 0 0 60px rgba(255,193,7,0.25)',
    avatarBlobColor: 'rgba(255,236,179,0.35)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#FFD54F',
    socialIconColor: '#F57F17',
    socialBorder: '1.5px solid rgba(255,213,79,0.35)',

    floatingIcons: [
      { icon: '🌻', count: 7,  size: [16,28], opacity: [0.18,0.4], speed: [10,18] },
      { icon: '⭐', count: 12, size: [10,18], opacity: [0.2,0.5],  speed: [6,12] },
      { icon: '🍋', count: 5,  size: [14,22], opacity: [0.15,0.35], speed: [12,20], blur: true },
      { icon: '☀️', count: 4,  size: [18,30], opacity: [0.12,0.28], speed: [15,25], blur: true },
      { icon: '💛', count: 8,  size: [10,18], opacity: [0.15,0.35], speed: [8,14] },
    ],
    bgEffect: 'sparkles',
    bgEffectColor: 'rgba(255,213,79,0.4)',

    accentColor: '#FFC107',
    accentGlow: 'rgba(255,193,7,0.4)',
    secondaryAccent: '#FF7043',
    brandingColor: 'rgba(255,143,0,0.4)',
  },

  // ── 5. MATCHA LATTE ───────────────────────────────────────
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    emoji: '🍵',
    vibe: 'Calm & cozy',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(160deg, #F1F8E9 0%, #E8F5E9 40%, #F1F8E9 100%)',
    pageBg2: '#DCEDC8',
    cardBg: 'rgba(255,255,255,0.84)',
    cardBgHover: 'rgba(255,255,255,0.97)',
    cardBorder: '1.5px solid rgba(139,195,74,0.35)',
    cardShadow: '0 4px 20px rgba(104,159,56,0.12), 0 1px 4px rgba(104,159,56,0.08)',
    cardShadowHover: '0 12px 40px rgba(104,159,56,0.22), 0 4px 12px rgba(104,159,56,0.12)',
    cardRadius: '20px',

    nameColor: '#2E7D32',
    nameFont: "'Syne', sans-serif",
    handleColor: '#558B2F',
    bioColor: '#388E3C',

    btnTextColor: '#1B5E20',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#AED581', '#8BC34A', '#C5E1A5'],
    avatarGlow: '0 0 28px rgba(139,195,74,0.45), 0 0 56px rgba(139,195,74,0.2)',
    avatarBlobColor: 'rgba(197,225,165,0.3)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#AED581',
    socialIconColor: '#558B2F',
    socialBorder: '1.5px solid rgba(139,195,74,0.3)',

    floatingIcons: [
      { icon: '🍃', count: 10, size: [14,24], opacity: [0.18,0.42], speed: [10,18] },
      { icon: '🍵', count: 4,  size: [16,24], opacity: [0.12,0.28], speed: [14,22], blur: true },
      { icon: '🌿', count: 8,  size: [12,20], opacity: [0.15,0.35], speed: [12,20] },
      { icon: '✨', count: 10, size: [8,14],  opacity: [0.12,0.3],  speed: [6,10] },
      { icon: '🌱', count: 6,  size: [12,18], opacity: [0.15,0.35], speed: [10,16], blur: true },
    ],
    bgEffect: 'none',
    bgEffectColor: 'rgba(139,195,74,0.2)',

    accentColor: '#8BC34A',
    accentGlow: 'rgba(139,195,74,0.4)',
    secondaryAccent: '#CDDC39',
    brandingColor: 'rgba(85,139,47,0.35)',
  },

  // ── 6. BABY BLUE SKY ──────────────────────────────────────
  {
    id: 'baby-blue-sky',
    name: 'Baby Blue Sky',
    emoji: '🌙',
    vibe: 'Dreamy & peaceful',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 50%, #E8EAF6 100%)',
    pageBg2: '#90CAF9',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBgHover: 'rgba(255,255,255,0.95)',
    cardBorder: '1.5px solid rgba(100,181,246,0.35)',
    cardShadow: '0 4px 20px rgba(30,136,229,0.12), 0 1px 4px rgba(30,136,229,0.08)',
    cardShadowHover: '0 12px 40px rgba(30,136,229,0.22), 0 4px 12px rgba(30,136,229,0.12)',
    cardRadius: '26px',

    nameColor: '#0D47A1',
    nameFont: "'Syne', sans-serif",
    handleColor: '#1976D2',
    bioColor: '#1565C0',

    btnTextColor: '#0D47A1',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#64B5F6', '#42A5F5', '#90CAF9'],
    avatarGlow: '0 0 30px rgba(100,181,246,0.5), 0 0 60px rgba(100,181,246,0.2)',
    avatarBlobColor: 'rgba(144,202,249,0.25)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#64B5F6',
    socialIconColor: '#1565C0',
    socialBorder: '1.5px solid rgba(100,181,246,0.3)',

    floatingIcons: [
      { icon: '🌙', count: 5,  size: [16,28], opacity: [0.15,0.35], speed: [12,20], blur: true },
      { icon: '⭐', count: 12, size: [8,18],  opacity: [0.2,0.5],   speed: [6,12] },
      { icon: '💙', count: 6,  size: [12,20], opacity: [0.15,0.35], speed: [8,14] },
      { icon: '🌟', count: 8,  size: [10,18], opacity: [0.15,0.4],  speed: [7,13] },
      { icon: '❄️', count: 6,  size: [12,20], opacity: [0.1,0.25],  speed: [10,18], blur: true },
    ],
    bgEffect: 'stars',
    bgEffectColor: 'rgba(100,181,246,0.5)',

    accentColor: '#42A5F5',
    accentGlow: 'rgba(66,165,245,0.4)',
    secondaryAccent: '#7986CB',
    brandingColor: 'rgba(25,118,210,0.35)',
  },

  // ── 7. CANDY FLOSS ────────────────────────────────────────
  {
    id: 'candy-floss',
    name: 'Candy Floss',
    emoji: '🍭',
    vibe: 'Sweet swirls',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 20%, #EDE7F6 50%, #E3F2FD 80%, #FCE4EC 100%)',
    pageBg2: '#F48FB1',
    cardBg: 'rgba(255,255,255,0.75)',
    cardBgHover: 'rgba(255,255,255,0.92)',
    cardBorder: '1.5px solid rgba(240,98,146,0.3)',
    cardShadow: '0 4px 20px rgba(240,98,146,0.12), 0 1px 4px rgba(240,98,146,0.08)',
    cardShadowHover: '0 12px 40px rgba(240,98,146,0.25), 0 4px 12px rgba(240,98,146,0.12)',
    cardRadius: '30px',

    nameColor: '#880E4F',
    nameFont: "'Syne', sans-serif",
    handleColor: '#AD1457',
    bioColor: '#C2185B',

    btnTextColor: '#4A148C',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#F48FB1', '#CE93D8', '#90CAF9'],
    avatarGlow: '0 0 30px rgba(244,143,177,0.5), 0 0 60px rgba(206,147,216,0.25)',
    avatarBlobColor: 'rgba(244,143,177,0.2)',

    socialBg: 'rgba(255,255,255,0.65)',
    socialBgHover: '#F48FB1',
    socialIconColor: '#AD1457',
    socialBorder: '1.5px solid rgba(244,143,177,0.3)',

    floatingIcons: [
      { icon: '🍭', count: 6,  size: [14,24], opacity: [0.18,0.4], speed: [10,18] },
      { icon: '🌈', count: 4,  size: [20,34], opacity: [0.1,0.25], speed: [15,25], blur: true },
      { icon: '💝', count: 8,  size: [10,20], opacity: [0.15,0.4], speed: [8,14] },
      { icon: '🦄', count: 4,  size: [18,28], opacity: [0.12,0.28], speed: [12,20] },
      { icon: '✨', count: 12, size: [8,14],  opacity: [0.15,0.4], speed: [5,10] },
    ],
    bgEffect: 'sparkles',
    bgEffectColor: 'rgba(244,143,177,0.35)',

    accentColor: '#F06292',
    accentGlow: 'rgba(240,98,146,0.4)',
    secondaryAccent: '#CE93D8',
    brandingColor: 'rgba(173,20,87,0.35)',
  },

  // ── 8. PEACH BOBA ─────────────────────────────────────────
  {
    id: 'peach-boba',
    name: 'Peach Boba',
    emoji: '🧋',
    vibe: 'Trendy & refreshing',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(160deg, #FFF3E0 0%, #FFE0B2 35%, #FFCCBC 70%, #FFF3E0 100%)',
    pageBg2: '#FFAB76',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBgHover: 'rgba(255,255,255,0.96)',
    cardBorder: '1.5px solid rgba(255,138,101,0.35)',
    cardShadow: '0 4px 20px rgba(255,112,67,0.12), 0 1px 4px rgba(255,112,67,0.08)',
    cardShadowHover: '0 12px 40px rgba(255,112,67,0.25), 0 4px 12px rgba(255,112,67,0.12)',
    cardRadius: '22px',

    nameColor: '#BF360C',
    nameFont: "'Syne', sans-serif",
    handleColor: '#E64A19',
    bioColor: '#D84315',

    btnTextColor: '#4E1F00',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#FFAB76', '#FF8A65', '#FFB74D'],
    avatarGlow: '0 0 28px rgba(255,138,101,0.5), 0 0 56px rgba(255,171,118,0.22)',
    avatarBlobColor: 'rgba(255,204,188,0.35)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#FFAB76',
    socialIconColor: '#E64A19',
    socialBorder: '1.5px solid rgba(255,138,101,0.3)',

    floatingIcons: [
      { icon: '🧋', count: 5,  size: [16,26], opacity: [0.15,0.35], speed: [12,20] },
      { icon: '🍑', count: 7,  size: [14,24], opacity: [0.18,0.42], speed: [10,18] },
      { icon: '🌸', count: 8,  size: [12,20], opacity: [0.15,0.38], speed: [8,14], blur: true },
      { icon: '💫', count: 10, size: [8,16],  opacity: [0.15,0.4],  speed: [6,10] },
      { icon: '🍊', count: 5,  size: [12,20], opacity: [0.12,0.28], speed: [12,18], blur: true },
    ],
    bgEffect: 'bubbles',
    bgEffectColor: 'rgba(255,138,101,0.25)',

    accentColor: '#FF7043',
    accentGlow: 'rgba(255,112,67,0.4)',
    secondaryAccent: '#FFB74D',
    brandingColor: 'rgba(230,74,25,0.35)',
  },

  // ── 9. LAVENDER DREAMS ────────────────────────────────────
  {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    emoji: '🦋',
    vibe: 'Magical & soft',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(160deg, #F3E5F5 0%, #EDE7F6 40%, #E8EAF6 80%, #F3E5F5 100%)',
    pageBg2: '#CE93D8',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBgHover: 'rgba(255,255,255,0.95)',
    cardBorder: '1.5px solid rgba(186,104,200,0.35)',
    cardShadow: '0 4px 20px rgba(156,39,176,0.1), 0 1px 4px rgba(156,39,176,0.07)',
    cardShadowHover: '0 12px 40px rgba(156,39,176,0.22), 0 4px 12px rgba(156,39,176,0.12)',
    cardRadius: '26px',

    nameColor: '#4A148C',
    nameFont: "'Syne', sans-serif",
    handleColor: '#7B1FA2',
    bioColor: '#6A1B9A',

    btnTextColor: '#311B92',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#CE93D8', '#AB47BC', '#E1BEE7'],
    avatarGlow: '0 0 30px rgba(206,147,216,0.5), 0 0 60px rgba(186,104,200,0.22)',
    avatarBlobColor: 'rgba(225,190,231,0.3)',

    socialBg: 'rgba(255,255,255,0.7)',
    socialBgHover: '#CE93D8',
    socialIconColor: '#7B1FA2',
    socialBorder: '1.5px solid rgba(186,104,200,0.3)',

    floatingIcons: [
      { icon: '🦋', count: 6,  size: [16,28], opacity: [0.18,0.4], speed: [10,18] },
      { icon: '💜', count: 8,  size: [10,18], opacity: [0.15,0.38], speed: [8,14] },
      { icon: '🌸', count: 8,  size: [12,20], opacity: [0.15,0.35], speed: [10,16], blur: true },
      { icon: '✨', count: 12, size: [8,14],  opacity: [0.12,0.32], speed: [6,10] },
      { icon: '🌙', count: 4,  size: [14,22], opacity: [0.12,0.28], speed: [12,20], blur: true },
    ],
    bgEffect: 'petals',
    bgEffectColor: 'rgba(206,147,216,0.3)',

    accentColor: '#AB47BC',
    accentGlow: 'rgba(171,71,188,0.4)',
    secondaryAccent: '#7986CB',
    brandingColor: 'rgba(123,31,162,0.35)',
  },

  // ── 10. Y2K GLITTER ───────────────────────────────────────
  {
    id: 'y2k-glitter',
    name: 'Y2K Glitter',
    emoji: '✨',
    vibe: 'Retro cyber cute',
    requiredPlan: 'PRO_PLUS',

    pageBg: 'linear-gradient(135deg, #F8F0FF 0%, #FFF0F8 25%, #F0F8FF 50%, #FFF8F0 75%, #F8F0FF 100%)',
    pageBg2: '#E8D0FF',
    cardBg: 'rgba(255,255,255,0.72)',
    cardBgHover: 'rgba(255,255,255,0.90)',
    cardBorder: '1.5px solid transparent',
    cardShadow: '0 4px 20px rgba(138,43,226,0.12), 0 1px 4px rgba(255,105,180,0.1)',
    cardShadowHover: '0 12px 40px rgba(138,43,226,0.22), 0 4px 12px rgba(255,105,180,0.15)',
    cardRadius: '20px',

    nameColor: '#5B009E',
    nameFont: "'Syne', sans-serif",
    handleColor: '#B800A4',
    bioColor: '#7B00C0',

    btnTextColor: '#3D0080',
    btnFont: "'Plus Jakarta Sans', sans-serif",

    avatarRingColors: ['#FF80FF', '#80FFFF', '#FFFF80', '#FF80FF'],
    avatarGlow: '0 0 30px rgba(255,128,255,0.5), 0 0 60px rgba(128,255,255,0.25)',
    avatarBlobColor: 'rgba(232,208,255,0.35)',

    socialBg: 'rgba(255,255,255,0.65)',
    socialBgHover: 'linear-gradient(135deg, #FF80FF, #80FFFF)',
    socialIconColor: '#7B00C0',
    socialBorder: '1.5px solid rgba(184,0,164,0.25)',

    floatingIcons: [
      { icon: '💎', count: 8,  size: [12,22], opacity: [0.2,0.5],  speed: [7,12] },
      { icon: '⭐', count: 14, size: [8,16],  opacity: [0.2,0.55], speed: [5,9]  },
      { icon: '💿', count: 4,  size: [18,28], opacity: [0.12,0.28], speed: [12,18], blur: true },
      { icon: '🌀', count: 4,  size: [16,26], opacity: [0.1,0.25], speed: [14,22], blur: true },
      { icon: '✨', count: 16, size: [6,14],  opacity: [0.2,0.55], speed: [4,8]  },
      { icon: '🦋', count: 5,  size: [14,22], opacity: [0.15,0.35], speed: [10,16] },
    ],
    bgEffect: 'sparkles',
    bgEffectColor: 'rgba(255,128,255,0.4)',

    accentColor: '#FF40FF',
    accentGlow: 'rgba(255,64,255,0.45)',
    secondaryAccent: '#40FFFF',
    brandingColor: 'rgba(184,0,164,0.35)',
  },
]

export const getPookieTheme = (id: string): PookieTheme =>
  POOKIE_THEMES.find(t => t.id === id) ?? POOKIE_THEMES[0]

export const getPookieThemesByPlan = (plan: string): PookieTheme[] => {
  if (plan === 'PRO' || plan === 'PRO_PLUS') return POOKIE_THEMES
  return []
}

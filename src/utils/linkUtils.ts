import { 
  Instagram, Youtube, Twitter, Linkedin, Github, 
  MessageCircle, Link2, LucideIcon, 
  Smartphone, Music2, Facebook, Ghost
} from 'lucide-react'

export interface PlatformConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  pattern: RegExp;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    pattern: /instagram\.com/i
  },
  {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    pattern: /youtube\.com|youtu\.be/i
  },
  {
    name: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    pattern: /twitter\.com|x\.com/i
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0077B5',
    pattern: /linkedin\.com/i
  },
  {
    name: 'GitHub',
    icon: Github,
    color: '#333',
    pattern: /github\.com/i
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    pattern: /wa\.me|whatsapp\.com/i
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    pattern: /facebook\.com/i
  },
  {
    name: 'TikTok',
    icon: Music2,
    color: '#000000',
    pattern: /tiktok\.com/i
  },
  {
    name: 'Snapchat',
    icon: Ghost,
    color: '#FFFC00',
    pattern: /snapchat\.com/i
  },
  {
    name: 'UPI',
    icon: Smartphone,
    color: '#6B3FA0',
    pattern: /upi:|bharatpe|phonepe|gpay/i
  }
]

export const getPlatformConfig = (url: string): PlatformConfig | undefined => {
  if (!url) return undefined;
  return PLATFORMS.find(p => p.pattern.test(url));
}

export const getIconForUrl = (url: string) => {
  const config = getPlatformConfig(url);
  return config ? config.icon : Link2;
}

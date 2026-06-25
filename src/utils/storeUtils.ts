// Format paise to INR display
export function formatPrice(paise: number): string {
  if (paise === 0) return 'Free'
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

// Product category display info
export const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  preset:   { label: 'Preset / Filter',  icon: '🎨', color: '#FF6B00' },
  ebook:    { label: 'eBook / Guide',    icon: '📖', color: '#3B82F6' },
  template: { label: 'Template',         icon: '📄', color: '#8B5CF6' },
  course:   { label: 'Course / Tutorial',icon: '🎓', color: '#10B981' },
  music:    { label: 'Music / Audio',    icon: '🎵', color: '#EC4899' },
  art:      { label: 'Art / Illustration',icon: '🖼️', color: '#F59E0B' },
  other:    { label: 'Other',            icon: '📦', color: '#6B7280' },
}

// Star rating display
export function getStarDisplay(rating: number): string {
  const full    = Math.floor(rating)
  const half    = rating % 1 >= 0.5 ? 1 : 0
  const empty   = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

// Mask email for privacy in reviews
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const masked = user[0] + '***' + (user.length > 1 ? user.slice(-1) : '')
  return `${masked}@${domain}`
}

// Check if download link is valid
export function isDownloadValid(expiresAt: Date, downloadCount: number, maxDownloads: number): boolean {
  return expiresAt > new Date() && downloadCount < maxDownloads
}

// Generate receipt ID
export function generateReceiptId(uid: string): string {
  return `lk_${uid.slice(0, 6)}_${Date.now()}`
}

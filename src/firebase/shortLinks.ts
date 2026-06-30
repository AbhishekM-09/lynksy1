import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, increment, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { handleFirestoreError, OperationType } from './firestore'
import { ShortLink } from '@/types'

// Check if an alias/shortCode already exists
export async function isAliasAvailable(shortCode: string): Promise<boolean> {
  const normalized = shortCode.trim().toLowerCase()
  const q = query(collection(db, 'short_links'), where('shortCode', '==', normalized))
  try {
    const snap = await getDocs(q)
    return snap.empty
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'short_links')
    return false
  }
}

// Create a new ShortLink
export async function createShortLink(
  userId: string, 
  originalUrl: string, 
  shortCode: string
): Promise<ShortLink> {
  const linkId = doc(collection(db, 'short_links')).id
  const cleanCode = shortCode.trim().toLowerCase()
  
  const newLink: ShortLink = {
    id: linkId,
    userId,
    originalUrl: originalUrl.trim(),
    shortCode: cleanCode,
    clicks: 0,
    uniqueVisitors: 0,
    createdAt: Timestamp.now(), // fallback for local UI state
    active: true,
    devices: {},
    browsers: {},
    countries: {},
    referrers: {},
    firstClick: null,
    lastClick: null
  }

  try {
    // Save to Firestore with actual serverTimestamp
    await setDoc(doc(db, 'short_links', linkId), {
      ...newLink,
      createdAt: serverTimestamp()
    })
    return newLink
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `short_links/${linkId}`)
    throw error
  }
}

// Fetch all short links for a specific user
export async function getShortLinks(userId: string): Promise<ShortLink[]> {
  const q = query(
    collection(db, 'short_links'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  try {
    const snap = await getDocs(q)
    const links: ShortLink[] = []
    snap.forEach((docSnap) => {
      links.push({ id: docSnap.id, ...docSnap.data() } as ShortLink)
    })
    return links
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'short_links')
    return []
  }
}

// Fetch all short links for admin panel
export async function getAllShortLinks(): Promise<ShortLink[]> {
  const q = query(collection(db, 'short_links'), orderBy('createdAt', 'desc'))
  try {
    const snap = await getDocs(q)
    const links: ShortLink[] = []
    snap.forEach((docSnap) => {
      links.push({ id: docSnap.id, ...docSnap.data() } as ShortLink)
    })
    return links
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'short_links')
    return []
  }
}

// Toggle short link active status
export async function toggleShortLinkActive(linkId: string, active: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'short_links', linkId), { active })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `short_links/${linkId}`)
    throw error
  }
}

// Delete a short link
export async function deleteShortLink(linkId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'short_links', linkId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `short_links/${linkId}`)
    throw error
  }
}

// Fetch short link by its code (visitor lookup)
export async function getShortLinkByCode(shortCode: string): Promise<ShortLink | null> {
  const cleanCode = shortCode.trim().toLowerCase()
  const q = query(
    collection(db, 'short_links'), 
    where('shortCode', '==', cleanCode),
    where('active', '==', true),
    limit(1)
  )
  try {
    const snap = await getDocs(q)
    if (snap.empty) return null
    const docSnap = snap.docs[0]
    return { id: docSnap.id, ...docSnap.data() } as ShortLink
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'short_links')
    return null
  }
}

// Increment click, track analytics
export async function recordShortLinkClick(
  shortLink: ShortLink, 
  tracking: { 
    device: string, 
    browser: string, 
    country: string, 
    referrer: string, 
    isUnique: boolean 
  }
): Promise<void> {
  const ref = doc(db, 'short_links', shortLink.id)
  const clickId = doc(collection(db, 'short_links', shortLink.id, 'clicks')).id

  const updateFields: Record<string, unknown> = {
    clicks: increment(1) as unknown,
    lastClick: serverTimestamp()
  }

  if (!shortLink.firstClick) {
    updateFields.firstClick = serverTimestamp()
  }

  if (tracking.isUnique) {
    updateFields.uniqueVisitors = increment(1)
  }

  // Safely normalize object keys before paths to prevent dot-notation injection or nesting issues
  const safeDevice = tracking.device.replace(/\./g, '_') || 'unknown'
  const safeBrowser = tracking.browser.replace(/\./g, '_') || 'unknown'
  const safeCountry = tracking.country.replace(/\./g, '_') || 'unknown'
  const safeReferrer = tracking.referrer.replace(/\./g, '_') || 'direct'

  updateFields[`devices.${safeDevice}`] = increment(1)
  updateFields[`browsers.${safeBrowser}`] = increment(1)
  updateFields[`countries.${safeCountry}`] = increment(1)
  updateFields[`referrers.${safeReferrer}`] = increment(1)

  try {
    // Atomic update of aggregate analytics fields
    await updateDoc(ref, updateFields)
    
    // Add raw click log document
    await setDoc(doc(db, 'short_links', shortLink.id, 'clicks', clickId), {
      device: tracking.device,
      browser: tracking.browser,
      country: tracking.country,
      referrer: tracking.referrer,
      timestamp: serverTimestamp(),
      isUnique: tracking.isUnique
    }, { isInsertOnly: true })
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `short_links/${shortLink.id}/clicks/${clickId}`)
  }
}

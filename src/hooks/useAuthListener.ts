import { useEffect, useRef } from 'react'
import { onAuthChange } from '@/firebase/auth'
import { checkAndUpdatePlanExpiry, updateUser } from '@/firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { initAuthPersistence } from '@/firebase/auth'
import type { User } from '@/types'
import toast from 'react-hot-toast'

export function useAuthListener() {
  const {
    setUser, setFirebaseUid, setLoading,
    clearAuth, user: currentUser
  } = useAuthStore()

  const initialized = useRef(false)
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    // Set persistence on first run
    if (!initialized.current) {
      initialized.current = true
      initAuthPersistence().catch(console.warn)
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        clearAuth()
        setLoading(false)
        return
      }

      // FIX: Always reload user on auth state change
      // This ensures emailVerified and email are fresh
      try {
        await firebaseUser.reload()
      } catch (err) {
        // Reload can fail if offline — continue anyway
        console.warn('Silent user reload failed on auth state change:', err)
      }

      setFirebaseUid(firebaseUser.uid)

      const providerId = firebaseUser.providerData?.[0]?.providerId
      const isSocialUser = providerId === 'google.com' || providerId === 'github.com' || providerId === 'apple.com'
      const providerName = isSocialUser ? (providerId?.replace('.com', '') || 'google') : null

      try {
        let user: User | null = null

        try {
          // Check + enforce plan expiry
          user = await checkAndUpdatePlanExpiry(firebaseUser.uid)

          if (!user) {
            // Firebase user exists but no Firestore doc
            // This can happen during signup between Firebase create and Firestore create
            // Wait briefly and retry once
            await new Promise(r => setTimeout(r, 1500))
            const retry = await checkAndUpdatePlanExpiry(firebaseUser.uid)
            if (retry) {
              user = retry
            }
          }
        } catch (err) {
          console.warn('getDoc/plan check failed in Auth Listener (client offline?), attempting cache or fallback:', err)
          
          // 1. Try to get retrieve user from cache directly
          try {
            const { getDocFromCache, doc } = await import('firebase/firestore')
            const { db } = await import('@/firebase/config')
            const snap = await getDocFromCache(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) {
              user = snap.data() as User
            }
          } catch (cacheErr) {
            console.warn('Failed to retrieve user from cache:', cacheErr)
          }

          // 2. If still null and likely offline, construct a basic fallback
          if (!user) {
            const { Timestamp } = await import('firebase/firestore')
            user = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.email?.split('@')[0] || 'offline_user',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Offline Creator',
              firstName: 'Creator',
              lastName: '',
              bio: 'Offline mode active. Connection with database is currently unavailable.',
              avatarUrl: firebaseUser.photoURL || null,
              category: 'Other',
              location: '',
              website: '',
              instagramHandle: '',
              youtubeHandle: '',
              twitterHandle: '',
              spotifyUrl: '',
              linkedinHandle: '',
              plan: 'FREE',
              planType: 'Monthly',
              planStartedAt: null,
              planExpiresAt: null,
              themeId: 'snow-white',
              accentColor: '#1C1813',
              bgColor: '#FFFFFF',
              buttonStyle: 'filled',
              isActive: true,
              isVerified: false,
              onboardingDone: true,
              usernameChangeCount: 0,
              aiUsedThisMonth: 0,
              aiBiosUsedThisMonth: 0,
              aiResetAt: Timestamp.now(),
              authProviders: firebaseUser.providerData?.map(p => p.providerId) || [],
            }
          }
        }

        if (!user) {
          clearAuth()
          setLoading(false)
          return
        }

        // Sync email verification to isVerified, emailVerified, and provider on user doc
        const shouldSyncVerify = (firebaseUser.emailVerified || isSocialUser) && 
          (!user.isVerified || !user.emailVerified || user.provider !== providerName)

        if (shouldSyncVerify) {
          try {
            await updateUser(firebaseUser.uid, { 
              isVerified: true, 
              emailVerified: true,
              provider: providerName 
            })
            user = { 
              ...user, 
              isVerified: true, 
              emailVerified: true,
              provider: providerName 
            }
          } catch (e) {
            console.warn('Sync isVerified in auth listener failed:', e)
          }
        }

        // Notify if plan expired
        const prevUser = currentUserRef.current
        if (prevUser && prevUser.plan !== 'FREE' && user.plan === 'FREE') {
          toast.error('Your Pro plan expired. Moved to Free plan.', { duration: 5000 })
        }

        setUser(user)
        setLoading(false)

      } catch (error) {
        console.error('Auth listener error:', error)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [clearAuth, setFirebaseUid, setLoading, setUser])
}

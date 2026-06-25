import { useEffect } from 'react'
import { onAuthChange } from '@/firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { checkAndUpdatePlanExpiry } from '@/firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import type { User } from '@/types'

export function useAuth() {
  const setUser = useAuthStore(state => state.setUser)
  const setLoading = useAuthStore(state => state.setLoading)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const setFirebaseUid = useAuthStore(state => state.setFirebaseUid)

  useEffect(() => {
    let unsubUser: (() => void) | null = null

    const unsubAuth = onAuthChange(async (fbUser) => {
      // Clean up previous user listener
      if (unsubUser) {
        unsubUser()
        unsubUser = null
      }

      if (!fbUser) { 
        clearAuth()
        return 
      }
      
      setFirebaseUid(fbUser.uid)
      setLoading(true)

      // Listen to the user document in real-time
      unsubUser = onSnapshot(doc(db, 'users', fbUser.uid), async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User
            
            // Only check plan expiry once when first loading or if plan was Pro
            if (userData.plan !== 'FREE' && userData.planExpiresAt) {
              const now = new Date()
              if (userData.planExpiresAt.toDate() < now) {
                const updatedUser = await checkAndUpdatePlanExpiry(fbUser.uid)
                if (updatedUser) {
                  toast.error('Your Pro plan has expired. Moved to Free.')
                  setUser(updatedUser)
                  return
                }
              }
            }
            
            setUser(userData)
          } else {
            // User doc doesn't exist yet (maybe in the middle of signup)
            setLoading(false)
          }
        } catch (err) {
          console.error('Error in user snapshot handler:', err)
          setLoading(false)
        }
      }, (err) => {
        console.error('Firestore user snap error:', err)
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      if (unsubUser) unsubUser()
    }
  }, [setUser, setLoading, clearAuth, setFirebaseUid])

  return useAuthStore()
}

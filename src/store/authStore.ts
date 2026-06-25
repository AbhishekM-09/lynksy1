import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, PlanType } from '@/types'

import { Timestamp } from 'firebase/firestore'

interface AuthState {
  user: User | null
  firebaseUid: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isUnlocked: boolean
  setUser: (user: User | null) => void
  setFirebaseUid: (uid: string | null) => void
  setLoading: (v: boolean) => void
  setUnlocked: (v: boolean) => void
  updatePlan: (plan: PlanType, expiresAt: Timestamp | null) => void
  updateUserField: (data: Partial<User>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, firebaseUid: null, isLoading: true, isAuthenticated: false, isUnlocked: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, isUnlocked: user?.settings?.pinEnabled ? false : true }),
      setFirebaseUid: (uid) => set({ firebaseUid: uid, isAuthenticated: !!uid }),
      setLoading: (v) => set({ isLoading: v }),
      setUnlocked: (v) => set({ isUnlocked: v }),
      updatePlan: (plan, planExpiresAt) => set(s => ({ user: s.user ? { ...s.user, plan, planExpiresAt } : null })),
      updateUserField: (data) => set(s => ({ user: s.user ? { ...s.user, ...data } : null })),
      clearAuth: () => set({ user: null, firebaseUid: null, isAuthenticated: false, isLoading: false, isUnlocked: true }),
    }),
    {
      name: 'lynksy-auth',
      partialize: (s) => ({ firebaseUid: s.firebaseUid }),
    }
  )
)

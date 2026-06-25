import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  upgradeModalOpen: boolean
  upgradeFeature: string
  setSidebarOpen: (v: boolean) => void
  openUpgradeModal: (feature: string) => void
  closeUpgradeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  upgradeModalOpen: false,
  upgradeFeature: '',
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  openUpgradeModal: (feature) => set({ upgradeModalOpen: true, upgradeFeature: feature }),
  closeUpgradeModal: () => set({ upgradeModalOpen: false, upgradeFeature: '' }),
}))

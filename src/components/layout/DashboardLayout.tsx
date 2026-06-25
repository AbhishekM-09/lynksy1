import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuthStore } from '@/store/authStore'
import { PinModal } from '../dashboard/PinModal'
import { toast } from 'react-hot-toast'
import { Lock } from 'lucide-react'

import { EmailVerifyBanner } from '../auth/EmailVerifyBanner'
import { SubscriptionWarningBanner } from '../dashboard/SubscriptionWarningBanner'

export function DashboardLayout() {
  const { user, isUnlocked, setUnlocked } = useAuthStore()

  const handleUnlock = (pin: string) => {
    if (pin === user?.settings?.pinCode) {
      setUnlocked(true)
      toast.success('Dashboard unlocked')
    } else {
      toast.error('Invalid PIN')
    }
  }

  const showLock = user?.settings?.pinEnabled && !isUnlocked

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] min-w-0 w-full overflow-x-hidden">
        <EmailVerifyBanner />
        <SubscriptionWarningBanner />
        <TopBar />
        <main className="flex-1 px-2 py-4 pb-8 lg:p-8 lg:pb-8 max-w-6xl mx-auto w-full">
          {showLock ? (
            <div className="h-[60vh] flex items-center justify-center">
               <div className="text-center">
                  <div className="w-16 h-16 bg-orange/10 text-orange rounded-3xl flex items-center justify-center mx-auto mb-4">
                     <Lock size={32} />
                  </div>
                  <h2 className="text-2xl font-bold font-syne text-ink mb-2">Dashboard Locked</h2>
                  <p className="text-muted text-sm mb-6">Enter your security PIN to continue</p>
                  <button 
                    onClick={() => {}} // PIN modal is handled by showLock state elsewhere or we just show it directly
                    className="hidden"
                  />
               </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={!!showLock}
        onClose={() => {}} // Cannot close until unlocked
        mode="verify"
        onComplete={handleUnlock}
        userName={user?.username || ''}
      />
    </div>
  )
}

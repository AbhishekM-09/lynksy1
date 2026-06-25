import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthListener } from '@/hooks/useAuthListener'
import { useAuthStore } from '@/store/authStore'
import { Cursor } from '@/components/ui/Cursor'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'
import { Spinner } from '@/components/ui/Spinner'
import { ScrollToTop } from '@/components/utils/ScrollToTop'

// Lazy load pages for better performance
const Landing         = lazy(() => import('@/pages/Landing'))
const Login           = lazy(() => import('@/pages/Login'))
const Signup          = lazy(() => import('@/pages/Signup'))
const Onboarding      = lazy(() => import('@/pages/Onboarding'))
const ForgotPassword  = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword   = lazy(() => import('@/pages/ResetPassword'))
const Pricing         = lazy(() => import('@/pages/Pricing'))
const Examples        = lazy(() => import('@/pages/Examples'))
const PublicProfile   = lazy(() => import('@/pages/PublicProfile'))
const NotFound        = lazy(() => import('@/pages/NotFound'))
const DashboardHome   = lazy(() => import('@/pages/dashboard/DashboardHome'))
const LinksPage       = lazy(() => import('@/pages/dashboard/LinksPage'))
const AnalyticsPage   = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
const AppearancePage  = lazy(() => import('@/pages/dashboard/AppearancePage'))
const SettingsPage    = lazy(() => import('@/pages/dashboard/SettingsPage'))
const StoreDashboard  = lazy(() => import('@/pages/dashboard/StoreDashboard'))
const EmailCollectionPage = lazy(() => import('@/pages/dashboard/EmailCollectionPage'))
const URLShortener    = lazy(() => import('@/pages/dashboard/URLShortener'))
const GoRedirect      = lazy(() => import('@/pages/GoRedirect'))
const DownloadSuccess = lazy(() => import('@/pages/DownloadSuccess'))
const PublicStore     = lazy(() => import('@/pages/PublicStore'))
const PrivacyPolicy   = lazy(() => import('@/pages/PrivacyPolicy'))
const TermsConditions = lazy(() => import('@/pages/TermsConditions'))
const AdminDashboard  = lazy(() => import('@/pages/admin/AdminDashboard'))
const PaymentSuccess  = lazy(() => import('@/pages/PaymentSuccess'))
const PaymentFailed   = lazy(() => import('@/pages/PaymentFailed'))
const AuthCallback    = lazy(() => import('@/pages/AuthCallback'))
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Spinner size="lg" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><Spinner size="lg" /></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If authenticated but no profile yet, wait unless on onboarding
  if (!user && isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><Spinner size="lg" /></div>
  }

  if (!user && !isLoading) {
    // Authenticated but no Firestore doc? Send to onboarding to create one
    if (location.pathname !== '/onboarding') {
       return <Navigate to="/onboarding" replace />
    }
    return <>{children}</>
  }

  // Force onboarding if not done
  if (!user.onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Redirect away from onboarding if already done
  if (user.onboardingDone && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><Spinner size="lg" /></div>
  }

  const isUserAdmin = user?.email?.toLowerCase() === 'abhimattikopp9845@gmail.com'

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isUserAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-cream"><Spinner size="lg" /></div>
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  useAuthListener() // Initialize auth listener

  const host = window.location.hostname
  const mainDomains = ['localhost', 'lynksy.app', 'www.lynksy.app']
  
  // App core pages should never be hijacked by custom domain rendering rules
  const path = window.location.pathname.toLowerCase()
  const isMainAppPath = [
    '/dashboard',
    '/login',
    '/signup',
    '/pricing',
    '/onboarding',
    '/examples',
    '/privacy-policy',
    '/privacy',
    '/terms-conditions',
    '/terms',
    '/forgot-password',
    '/reset-password',
    '/admin',
    '/u/',
    '/go/',
    '/payment-success',
    '/payment-failed'
  ].some(p => path.startsWith(p))

  const isMainDomain = mainDomains.includes(host) || 
                       host.includes('run.app') || 
                       host.includes('aistudio') || 
                       host.includes('google') ||
                       host.includes('.onrender.com') ||
                       isMainAppPath

  // Domain-based routing logic
  const searchParams = new URLSearchParams(window.location.search)
  const testDomain = searchParams.get('domain')

  if (!isMainDomain || testDomain) {
    const parts = host.split('.')
    let username = ''

    // Subdomain detection (e.g. user.lynksy.app)
    const isSubdomain = host.includes('lynksy.app') && parts.length > 2 && parts[0] !== 'www'
    if (isSubdomain) {
      username = parts[0]
    }
    
    const customDomain = testDomain || (!isSubdomain && !mainDomains.includes(host) && !host.includes('run.app') && !host.includes('.onrender.com') ? host : '')

    if (username || customDomain) {
      return (
        <>
          <ScrollToTop />
          <Cursor />
          <Toaster position="bottom-right" />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/store" element={<PublicStore usernameFromProp={username} customDomain={customDomain} />} />
              <Route path="/download/:token" element={<DownloadSuccess />} />
              <Route path="/" element={<PublicProfile usernameFromHost={username} customDomain={customDomain} />} />
              {/* Handle legacy /username/store paths on custom domains by redirecting to /store */}
              <Route path="/:u/store" element={<Navigate to="/store" replace />} />
              <Route path="*" element={<PublicProfile usernameFromHost={username} customDomain={customDomain} />} />
            </Routes>
          </Suspense>
        </>
      )
    }
  }

  return (
    <>
      <ScrollToTop />
      <Cursor />
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#0D0A08', color: '#fff', borderRadius: '12px', padding: '14px 18px', fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' },
        success: { iconTheme: { primary: '#1A7A50', secondary: '#fff' }},
        error:   { iconTheme: { primary: '#C0392B', secondary: '#fff' }},
      }} />
      <UpgradeModal />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment-failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />

          {/* Auth — redirect if already logged in */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login"           element={<PublicOnlyRoute><Login  /></PublicOnlyRoute>} />
          <Route path="/signup"          element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPassword  /></PublicOnlyRoute>} />

          {/* Admin — Protected */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Onboarding — needs auth, no onboarding yet */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Dashboard — protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="url-shortener" element={<URLShortener />} />
            <Route path="store" element={<StoreDashboard />} />
            <Route path="emails" element={<EmailCollectionPage />} />
            <Route path="store/products" element={<StoreDashboard />} />
            <Route path="store/orders" element={<StoreDashboard />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Secure Redirection System */}
          <Route path="/go/:shortCode" element={<GoRedirect />} />

          {/* Store Access & Downloads */}
          <Route path="/download/:token" element={<DownloadSuccess />} />
          <Route path="/u/:username/store" element={<PublicStore />} />
          <Route path="/:username/store" element={<PublicStore />} />

          {/* Public creator pages — ALWAYS last */}
          <Route path="/u/:username" element={<PublicProfile />} />
          
          {/* Support short URLs for all users (FREE: lynksy.app/user) */}
          <Route path="/:username" element={<PublicProfile />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Shield, CheckCircle2, Info, Mail, 
  ExternalLink, ChevronRight, Bookmark
} from 'lucide-react'

// Layout/sections setup for Table of Contents
const SECTIONS = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'info-we-collect', label: '2. Information We Collect' },
  { id: 'cookies', label: '3. Cookies & Tracking' },
  { id: 'how-we-use', label: '4. How We Use Information' },
  { id: 'data-sharing', label: '5. Data Sharing' },
  { id: 'data-security', label: '6. Data Security' },
  { id: 'user-rights', label: '7. Your Rights' },
  { id: 'disclaimers', label: '8. Product & Email Disclaimers' },
  { id: 'third-party', label: '9. Third-Party Services' },
  { id: 'childrens-privacy', label: '10. Children\'s Privacy' },
  { id: 'contact', label: '11. Changes & Contact' }
]

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160 // offset for sticky header

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: 'smooth'
      })
      setActiveSection(id)
    }
  }

  return (
    <div className="min-h-screen bg-cream font-outfit selection:bg-orange/20 selection:text-orange text-ink">
      {/* Navbar */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-b border-cream-3 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black font-syne tracking-tight text-ink">
              Lynksy<span className="text-orange">.</span>
            </span>
          </Link>
          <Link 
            to="/" 
            className="text-sm font-semibold flex items-center gap-2 text-ink/65 hover:text-orange transition-all font-outfit"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        {/* Banner Hero */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 border-b border-cream-3">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange/10 rounded-full text-orange font-semibold text-xs mb-4">
                <Shield size={14} />
                <span>Lynksy Trust & Safety Center</span>
              </div>
              <h1 id="page-title" className="text-4xl lg:text-5xl font-black font-syne text-ink leading-tight tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-ink/60 mt-3 text-base sm:text-lg max-w-2xl font-light">
                We are committed to helping you understand how we collect, store, share, and protect your personal information on Lynksy.
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted font-mono">Last Updated</span>
              <span className="block text-sm font-semibold text-ink font-mono mt-1">June 10, 2026</span>
            </div>
          </div>
        </div>

        {/* Content Section with Sticky Sidebar Grid */}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12">
          
          {/* Sticky Left Sidebar Navigation */}
          <aside id="legal-sidebar" className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-cream-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 font-mono flex items-center gap-2">
                  <Bookmark size={12} className="text-orange animate-pulse" /> Table of Contents
                </h3>
                <nav className="flex flex-col gap-1.5" aria-label="Table of Contents">
                  {SECTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`text-left text-[13px] py-1.5 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between group ${
                        activeSection === sec.id
                          ? 'bg-orange/10 text-orange font-bold pl-4'
                          : 'text-ink/60 hover:text-ink hover:bg-neutral-100/50'
                      }`}
                    >
                      <span>{sec.label}</span>
                      <ChevronRight 
                        size={12} 
                        className={`transition-all duration-300 ${
                          activeSection === sec.id 
                            ? 'opacity-100 translate-x-0 text-orange' 
                            : 'opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0'
                        }`}
                      />
                    </button>
                  ))}
                </nav>
              </div>

              <div className="bg-orange/5 rounded-2xl p-5 border border-orange/10 space-y-3">
                <h4 className="text-xs font-bold text-orange uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} /> Legal Guarantee
                </h4>
                <p className="text-xs text-ink/70 leading-relaxed font-normal">
                  Your trust is essential. Lynksy never sells, rents, or monetizes your personal data or your page visitors' records for third-party ad targeting.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Main Detailed content */}
          <article id="legal-body" className="lg:col-span-8 xl:col-span-9 prose max-w-none space-y-16 text-[15px] sm:text-base leading-relaxed text-ink/85">
            
            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Introduction</h2>
              </div>
              <p>
                Welcome to <strong>Lynksy</strong> ("we," "our," "us," or "the Platform"). Lynksy is a comprehensive creator-first system designed to enable customizable link-in-bio landing pages, digital storefronts, email subscriber acquisition, analytics, URL shortening, and peer-to-peer donation integrations.
              </p>
              <p>
                We appreciate the trust you place in us to safeguard your personal space and interaction history. This Privacy Policy outlines exactly how we manage personal data belonging to both <strong>Creators</strong> (who construct profile links, host storefronts, or distribute custom pages) and <strong>Visitors</strong> (the audience members who view Lynksy pages, purchase products, click links, or subscribe to email updates).
              </p>
              <p>
                By creating an account, clicking links, or visiting any web page within the <code>lynksy.app</code> domain, you agree to the collection, usage, and disclosures described in this document.
              </p>
            </section>

            {/* Section 2 */}
            <section id="info-we-collect" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Information We Collect</h2>
              </div>
              <p>
                We gather information to keep our platform secure, verify payments, enable custom creations, and report detailed traffic insights to creators.
              </p>

              <div className="space-y-4 pt-2">
                <div className="bg-cream/50 p-5 rounded-2xl border border-cream-3">
                  <h3 className="text-lg font-bold font-syne text-ink mb-2">A. Account Information (Creators)</h3>
                  <p className="text-sm text-ink/75 mb-3">When you register or update your account, we securely collect:</p>
                  <ul className="list-disc pl-5 text-sm text-ink/80 space-y-1.5">
                    <li><strong>Name:</strong> To identify you as the profile owner.</li>
                    <li><strong>Email Address:</strong> Used for credentials verification, sign-in flows (via Firebase Auth), reset passwords, and system communications.</li>
                    <li><strong>Username:</strong> Custom string which dictates your public profile url (e.g., <code>lynksy.app/yourname</code>).</li>
                    <li><strong>Profile Information:</strong> Any bios, custom taglines, display pictures, avatars, or background styles you chose.</li>
                  </ul>
                </div>

                <div className="bg-cream/50 p-5 rounded-2xl border border-cream-3">
                  <h3 className="text-lg font-bold font-syne text-ink mb-2">B. User Content & Customizations</h3>
                  <p className="text-sm text-ink/75 mb-3">Any text, media, assets, or elements you publish on your public link page are stored programmatically:</p>
                  <ul className="list-disc pl-5 text-sm text-ink/80 space-y-1.5">
                    <li><strong>Profile Photos:</strong> Saved securely in our storage bucket.</li>
                    <li><strong>Social Links & Custom Links:</strong> The URLs, labels, thumbnail icons, and orders of your custom redirection targets.</li>
                    <li><strong>Custom Pages:</strong> Multi-tab landing designs or portfolios published through our editor.</li>
                    <li><strong>Digital Products:</strong> Product descriptions, files, download items, names, images, prices, and inventory targets you list for public sale.</li>
                    <li><strong>Uploaded Content:</strong> Any other digital banners, assets, pdfs, or multimedia uploaded to our interface.</li>
                  </ul>
                </div>

                <div className="bg-cream/50 p-5 rounded-2xl border border-cream-3">
                  <h3 className="text-lg font-bold font-syne text-ink mb-2">C. Payment Information & Gateways</h3>
                  <div className="flex gap-3 bg-white p-4 rounded-xl border border-orange-border mb-3">
                    <Info className="text-orange shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      <strong>Critical Guarantee:</strong> Lynksy does not store complete card details. Payments are securely processed through Razorpay and other integrated payment gateway providers.
                    </p>
                  </div>
                  <p className="text-sm text-ink/75">
                    We collect metadata regarding subscription cycles, total currency amounts, transaction status, order identifiers, and payment hashes to fulfill your upgraded client status and database synchronizations.
                  </p>
                </div>

                <div className="bg-cream/50 p-5 rounded-2xl border border-cream-3">
                  <h3 className="text-lg font-bold font-syne text-ink mb-2">D. Analytics Information (Visitor Statistics)</h3>
                  <p className="text-sm text-ink/75 mb-3">
                    To show creators how many clicks and impressions their page obtains, we capture automated traffic details:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-ink/80 space-y-1.5">
                    <li><strong>Device Information:</strong> Hardware model, operating system version, screen resolution, and language settings.</li>
                    <li><strong>Browser Information:</strong> Browser type (Safari, Chrome, Firefox, etc.) and versions.</li>
                    <li><strong>IP Address:</strong> Standard internet communication string, processed anonymized for approximate geolocation estimations (city/country level).</li>
                    <li><strong>Usage Analytics & Click Tracking:</strong> Timestamps when visitors enter custom bios, click specific call-to-actions, or download attached store items.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="cookies" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">3</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Cookies & Tracking</h2>
              </div>
              <p>
                Cookies are small files saved securely inside your local browser. Lynksy incorporates essential cookies, local web storages, and session trackers to keep you logged in to your dashboard across multiple page refreshes.
              </p>
              <p>
                We use cookies and local storage tokens to remember your preferences (e.g. customized widgets), save dashboard settings, and perform critical safety diagnostics. You can disable cookies directly through your individual browser controls, but please note that some essential workspace sections (like links editing or dashboard insights) might fail to load properly without session flags enabled.
              </p>
            </section>

            {/* Section 4 */}
            <section id="how-we-use" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">4</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">How We Use Information</h2>
              </div>
              <p>
                The information we collect is strictly applied to deliver a fast, reliable, and functional link hosting experience. In details, compiled data is used to:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Provide Services</h4>
                    <p className="text-xs text-ink/70 mt-1">Serve your high-performance custom bio pages to the public, process payments, and verify downloads.</p>
                  </div>
                </div>
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Improve the Platform</h4>
                    <p className="text-xs text-ink/70 mt-1">Diagnose latency over-peaks, optimize server response, and streamline the dashboard experience.</p>
                  </div>
                </div>
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Customer Support</h4>
                    <p className="text-xs text-ink/70 mt-1">Investigate account errors, fix page linkings, and resolve custom domain connection warnings.</p>
                  </div>
                </div>
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Security & Verification</h4>
                    <p className="text-xs text-ink/70 mt-1">Combat spam, fraudulent redirects, illegal digital products, or automated phishing pages.</p>
                  </div>
                </div>
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Analytics and Stats</h4>
                    <p className="text-xs text-ink/70 mt-1">Aggregate visitor page-views so creators can examine geographical traffic and reach metrics.</p>
                  </div>
                </div>
                <div className="p-4 bg-cream/30 rounded-xl border border-cream-3 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-orange shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">Communication</h4>
                    <p className="text-xs text-ink/70 mt-1">Deliver email receipts, updates on features, security alerts, and responsive support notices.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="data-sharing" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">5</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Data Sharing & Disclosure</h2>
              </div>
              <p className="font-semibold text-ink">
                Lynksy has a strict zero-ad-monetization approach: we never sell, lease, or monetize your personal details or audience details to ad platforms.
              </p>
              <p>
                We only disclose necessary elements of your details to trusted infrastructure providers and third-party vendors required to power our application:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
                <li><strong>Payment Providers:</strong> Your purchase, token, or billing parameters are processed completely and securely through <strong>Razorpay</strong> to process payment or unlock SaaS features (such as Pro plan upgrades).</li>
                <li><strong>Cloud Service Providers:</strong> Our files, database collections, configurations, user credentials, and systems are safely stored on secure hosting nodes, primarily <strong>Firebase</strong> (Google Cloud Platform) and Google server assets.</li>
                <li><strong>Legal Authorities:</strong> If explicitly instructed by courts, enforcement operations, or national laws (such as Indian IT policies), we may share logs or accounts to comply with valid legal processes.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="data-security" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">6</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Data Security</h2>
              </div>
              <p>
                Securing your storefront, customer profiles, and dashboard data is a priority. We employ advanced technology to verify logins and track sessions:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
                <li><strong>Encryption:</strong> All transmissions between your browser and our server are encrypted over HTTPS (Secure Socket Layer / TLS protocols v1.3).</li>
                <li><strong>Authentication:</strong> Account creations and sessions are protected via Firebase Authentication, ensuring securely managed passwords and tokens.</li>
                <li><strong>Database Security:</strong> We write detailed Firestore security rules matching strict validation checks to prevent unauthorized clients from editing other users' profile documents.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">7</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Your Rights</h2>
              </div>
              <p>
                Regardless of your country of residence, We provide seamless digital tools so you are always in charge of your personal space:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-ink/80 pt-2">
                <div className="p-4 bg-orange/5 rounded-2xl border border-orange/10">
                  <span className="font-bold block mb-1 text-orange">Access Your Data</span>
                  <p>You can check and download all database information connected to your active link pages, custom stats, and store templates in your dashboard settings.</p>
                </div>
                <div className="p-4 bg-orange/5 rounded-2xl border border-orange/10">
                  <span className="font-bold block mb-1 text-orange">Edit Your Data</span>
                  <p>You can instantly modify layouts, details, titles, images, digital store products, pricing, bio descriptions, and linked targets inside the dashboard.</p>
                </div>
                <div className="p-4 bg-orange/5 rounded-2xl border border-orange/10">
                  <span className="font-bold block mb-1 text-orange">Delete Your Account</span>
                  <p>You can shut down your profile dashboard directly, removing all public link pages instantly from the public internet indices.</p>
                </div>
                <div className="p-4 bg-orange/5 rounded-2xl border border-orange/10">
                  <span className="font-bold block mb-1 text-orange">Request Data Removal</span>
                  <p>You can contact our systems compliance division to manually scratch all server backup caches or file histories assigned to your email.</p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="disclaimers" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">8</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Product & Email Disclaimers</h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-cream rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-2">Creator Email Collection Disclaimer</h3>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Creators utilizing Lynksy's integrated landing page newsletter form, lead magnets, or customer collection panels are solely responsible for obtaining explicit audience consent. They must comply with applicable electronic marketing and privacy laws (such as GDPR, CAN-SPAM, and local telecom communications guidance). Lynksy provides the technical database capture mechanisms only, behaving as an intermediary processor.
                  </p>
                </div>

                <div className="p-5 bg-cream rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-2">Digital Product Stores Disclaimer</h3>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Lynksy facilitates digital file listings, direct checkout portals, and instant client fulfillment. Lynksy acts solely as an engine provider and platform. We are never responsible or liable for any file contents, creator-generated imagery, legal compliance of products, intellectual property of attachments, or financial transaction refund disputes between individual buyers and sellers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="third-party" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">9</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Third-Party Services</h2>
              </div>
              <p>
                To maintain standard operational states, our services integrate external software environments:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-cream rounded-2xl border border-cream-3 text-center space-y-2">
                  <span className="font-bold block text-ink">Firebase</span>
                  <p className="text-ink/70">Database, auth tokens, file cloud buckets, and cloud computation hosting.</p>
                </div>
                <div className="p-4 bg-cream rounded-2xl border border-cream-3 text-center space-y-2">
                  <span className="font-bold block text-ink">Razorpay</span>
                  <p className="text-ink/70">Secure subscription processing, payment routing, and customer checkouts.</p>
                </div>
                <div className="p-4 bg-cream rounded-2xl border border-cream-3 text-center space-y-2">
                  <span className="font-bold block text-ink">Google Analytics</span>
                  <p className="text-ink/70">Performance logging, traffic patterns modeling, and operational load diagnostics.</p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="childrens-privacy" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">10</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Children's Privacy</h2>
              </div>
              <p>
                We do not knowingly list, target, or collect identifiers from minors. Users must be at least 13 years old to open or operate a dashboard. If you believe your child has registered or uploaded personal details to Lynksy, please contact our support desk immediately and we will delete the data files.
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">11</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Changes & Contact</h2>
              </div>
              <p>
                We reserve the right to modify this safety layout to follow structural standards. If material variations occur, we will post an update flag directly within key settings areas or notify you via email broadcasts.
              </p>

              <div className="p-6 bg-ink rounded-2xl text-white space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-orange" size={20} />
                  <h3 className="text-lg font-bold font-syne my-0">Get In Touch</h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed my-0">
                  If you have queries regarding server configurations, data corrections, rules compliance, or Razorpay payment operations, reach out directly:
                </p>
                <div className="pt-2">
                  <a 
                    href="mailto:support@lynksy.app" 
                    className="inline-flex items-center gap-1.5 text-orange font-bold text-base hover:underline underline-offset-4 decoration-2"
                  >
                    support@lynksy.app <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </section>

          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-cream-3 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted space-y-3">
          <p className="font-medium">© 2026 Lynksy Platform. Modern legal documentation suite for Indian creators.</p>
          <div className="flex justify-center gap-4 text-ink/50">
            <Link to="/privacy" className="hover:text-orange font-semibold">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-orange font-semibold">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

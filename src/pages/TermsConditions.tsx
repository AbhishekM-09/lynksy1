import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Scale, CheckCircle2, Mail, 
  ExternalLink, ChevronRight, Bookmark, AlertTriangle
} from 'lucide-react'

// Layout/sections setup for Table of Contents
const SECTIONS = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'eligibility', label: '2. Eligibility & Requirements' },
  { id: 'accounts', label: '3. User Accounts & Security' },
  { id: 'services', label: '4. Platform Services' },
  { id: 'subscriptions', label: '5. Subscriptions' },
  { id: 'payments', label: '6. Payments & Refunds' },
  { id: 'responsibilities', label: '7. Prohibited Responsibilities' },
  { id: 'creator-relations', label: '8. Digital Shop & Leads' },
  { id: 'domains-shortener', label: '9. Domains & Shortener' },
  { id: 'suspension-ip', label: '10. Suspension & IP Rights' },
  { id: 'liability', label: '11. Liability & Governing Law' },
  { id: 'contact', label: '12. Contact Support' }
]

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState('acceptance')

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
                <Scale size={14} />
                <span>Lynksy Legal Terms & Service</span>
              </div>
              <h1 id="page-title" className="text-4xl lg:text-5xl font-black font-syne text-ink leading-tight tracking-tight">
                Terms of Service
              </h1>
              <p className="text-ink/60 mt-3 text-base sm:text-lg max-w-2xl font-light">
                Please read these terms carefully before accessing or using the Lynksy creator ecosystem.
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
                  <Bookmark size={12} className="text-orange animate-pulse" /> Content Navigation
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
                  <Scale size={14} /> Compliance Note
                </h4>
                <p className="text-xs text-ink/70 leading-relaxed font-normal">
                  These SaaS terms are compliant with Indian IT Guidelines policies, electronic messaging safeguards, consumer protection regulations, and Razorpay standard operational criteria.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Main Detailed content */}
          <article id="legal-body" className="lg:col-span-8 xl:col-span-9 prose max-w-none space-y-16 text-[15px] sm:text-base leading-relaxed text-ink/85">
            
            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Acceptance of Terms</h2>
              </div>
              <p>
                Welcome to <strong>Lynksy</strong> ("we," "our," "us," or "the Platform"). By accessing, registering, opening or operating an account, purchasing premium utilities, or visiting pages hosted under the <code>lynksy.app</code> domain, you agree to be legally bound by these Terms & Conditions.
              </p>
              <p>
                These Terms of Service outline a binding mutual contract between Lynksy and yourself. If you do not agree, consent, or align with all content listed within this document, you are strictly disallowed from accessing our platform services or utilizing our creators' dashboards.
              </p>
            </section>

            {/* Section 2 */}
            <section id="eligibility" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Eligibility & Requirements</h2>
              </div>
              <p>
                To maintain safe services, we require all registering users to satisfy these eligibility guidelines at all times:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-sm text-ink/80">
                <li><strong>Age Requirement:</strong> You must be at least <strong>13 years old</strong> to open, manage, or operate a public link page with Lynksy. If you are under 18, you may only use Lynksy services under strict supervision of parents or legal guardians.</li>
                <li><strong>Accurate Profiles Information:</strong> You agree to provide true, accurate, updated, and sound contact credentials (including names and emails) of yourself when setting up profiles. Information found to be false, simulated, or deliberately deceptive constitutes grounds for immediate suspension.</li>
                <li><strong>Account Security Safeguards:</strong> You must maintain complete passwords and credentials. You agree to notify us immediately at support if unauthorized usage of your dashboard occurs.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">3</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">User Accounts & Security</h2>
              </div>
              <p>
                Your registration gives you a limited, non-exclusive license to operate a custom link-in-bio hub. You are fully responsible for all interactions, changes, customer products, lists, settings adjustments, downloads, and page redirection URLs that occur under your specific credentials.
              </p>
              <p>
                Lynksy uses <strong>Firebase Authentication</strong> to verify your account identity. You represent that you will not transfer, lease, sell, or delegate access keys or system credentials to anyone else. We are not liable for direct or indirect system failures, theft, or data removals resulting from weak login strings or credential sharing.
              </p>
            </section>

            {/* Section 4 */}
            <section id="services" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">4</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Platform Services</h2>
              </div>
              <p>
                Lynksy delivers several high-fidelity SaaS tools for online creators. Specifically, our platform includes:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 text-xs text-ink/80 pt-2">
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Custom Link-in-Bio Landing Pages</span>
                  <p>Design a bespoke landing profile, hosting customized bio details, media files, design layouts, social banners, and target redirection buttons.</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Dynamic Conversion Analytics</span>
                  <p>Obtain traffic summaries reporting total click records, device specifications, and localized audience stats securely from your dashboard.</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Integrated Email Collection Forms</span>
                  <p>Add email intake forms to capture newsletters inquiries, leads, updates, or contact registrations directly into clean export files.</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Digital Product Stores & Delivery</span>
                  <p>Upload digital assets (PDFs, files, graphics, templates, courses) and collect payments to trigger instant download links for purchasers.</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Fast URL Shortener Features</span>
                  <p>Shrink lengthy URLs to clean, optimized short tracking links to manage social media copy and external campaigns beautifully.</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-2xl border border-cream-3">
                  <span className="font-extrabold text-ink block mb-1">Custom Domains Name Linking</span>
                  <p>Map your own custom root domain or subdomains (such as <code>links.yourbrand.com</code>) to point smoothly to your Lynksy pages.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="subscriptions" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">5</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Subscriptions</h2>
              </div>
              <p>
                To cater to varied scales, Lynksy features structured subscription plans:
              </p>
              
              <div className="border border-cream-3 rounded-2xl overflow-hidden bg-cream/30 text-xs mb-4">
                <div className="bg-ink text-white p-3 font-semibold grid grid-cols-3 text-center">
                  <span>Plan Type</span>
                  <span>Fee Scheme</span>
                  <span>Target Audiences</span>
                </div>
                <div className="grid grid-cols-3 text-center p-3 border-b border-cream-3">
                  <span className="font-bold text-ink">Free</span>
                  <span>₹0 / Forever</span>
                  <span className="text-ink/65">Standard link hubs, basic analytics, email collection forms.</span>
                </div>
                <div className="grid grid-cols-3 text-center p-3 border-b border-cream-3 bg-white">
                  <span className="font-bold text-orange">Pro</span>
                  <span>₹199 / Month</span>
                  <span className="text-ink/65">Advanced styles, complete analytics, sell digital products store (up to 5 products).</span>
                </div>
                <div className="grid grid-cols-3 text-center p-3 bg-white">
                  <span className="font-bold text-orange font-black">Pro+</span>
                  <span>₹399 / Month</span>
                  <span className="text-ink/65">Unlimited stores, priority uploads, fast shorteners, custom domain linking.</span>
                </div>
              </div>

              <div className="bg-orange/5 p-4 rounded-xl border border-orange-border text-xs text-ink/80 space-y-2">
                <p><strong>Auto-Renewals:</strong> Subscriptions renew according to the billing cycle selected (e.g. Monthly) until explicitly cancelled inside settings.</p>
                <p><strong>Premium Subscription Expiration & Policy:</strong> If your premium subscription expires or a payment fails: (1) premium specific features (such as custom domains mapping or digital store access) may be instantly disabled; (2) your stored data files and link parameters remain securely available in a locked free state according to our platform retention policies.</p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="payments" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">6</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Payments & Refunds</h2>
              </div>
              <p>
                Billing and fee collection for Lynksy Pro and Pro+ plans are processed securely:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
                <li><strong>Razorpay Gateway:</strong> All payments, transactions routing, token authorizations, and processing are fulfilled securely through <strong>Razorpay</strong>. We do not store complete credit card, CVV, or authentication strings.</li>
                <li><strong>Refund Policy:</strong> Subscription payments are generally <strong>non-refundable</strong> except where explicitly required by local law (e.g. clear compliance mandates or billing mistakes on our server).</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="responsibilities" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">7</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Prohibited Responsibilities</h2>
              </div>
              <p>
                To maintain standard operations, you agree not to perform or permit prohibited activities. You may not:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 text-xs font-normal">
                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex gap-3 text-red-900">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold block mb-1 text-red-800">Upload Illegal Contents</span>
                    <p className="leading-normal">Do not host, link to, or distribute hate speech, pornography, defamation, copyright infringements, or violent media.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex gap-3 text-red-900">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold block mb-1 text-red-800">Distribute Malware</span>
                    <p className="leading-normal">Do not attach files, links, scripts, or templates that contain trojans, spyware, ransomware, or phishing scripts.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex gap-3 text-red-900">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold block mb-1 text-red-800">Conduct Fraud & Phishing</span>
                    <p className="leading-normal">Do not impersonate brands, entities, celebrities, banks, or run fake investments and deceptive links.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex gap-3 text-red-900">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold block mb-1 text-red-800">Abuse The Systems</span>
                    <p className="leading-normal">Do not run denial of service attacks, automated scrapers, brute force credentials, or spoof system parameters.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="creator-relations" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">8</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Digital Shop & Leads</h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-cream/75 rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-1.5 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-orange" /> Digital Products Compliance
                  </h3>
                  <p className="text-xs text-ink/80 leading-relaxed mb-3">
                    Creators utilizing our storefront system are strictly, and exclusively, responsible for all aspects of their digital items:
                  </p>
                  <ul className="list-disc pl-5 text-[11px] text-ink/70 space-y-1">
                    <li>Establishing accurate product quality, software descriptions, and preview images.</li>
                    <li>Fulfilling functional download delivery files securely.</li>
                    <li>Processing individual refunds, tax charges, and local customer support inquiries.</li>
                  </ul>
                  <p className="text-[11px] text-ink/80 font-semibold mb-0">
                    Lynksy is an intermediary engine and digital platform; we assume absolutely no responsibility or legal liability for the quality, delivery, or legality of creator-sold files.
                  </p>
                </div>

                <div className="p-5 bg-cream/75 rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-1.5 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-orange" /> Lead Capture & Emails Marketing
                  </h3>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Creators operating email harvesting forms agree to obtain clear, documented, opt-in consent before initiating marketing broadcasts or newsletter campaigns. You remain completely liable for violating digital messaging codes (such as Indian Telecom rules or international CAN-SPAM laws).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="domains-shortener" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">9</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Domains & Shortener</h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-cream/75 rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-2">Custom Domains Management</h3>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Lynksy enables mapping customizable domains (e.g., <code>urls.yourbrand.in</code>) using DNS configurations. Users are solely responsible for buying, configuring, renewing, and ensuring accurate DNS records target values towards our system hosting points. We are not liable for external registrar fee failures or DNS misconfigurations that render your custom URLs inaccessible.
                  </p>
                </div>

                <div className="p-5 bg-cream/75 rounded-2xl border border-cream-3">
                  <h3 className="text-base font-bold font-syne text-ink mb-2">URL Shortening Guidelines</h3>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    You agree not to compress or shorten links pointing to: malware downloads, deceptive scams, phishing platforms, fraudulent crypto networks, copyright-violating directories, or adult resources. Link shortening targets are scanned by our safety checkers; violation will cause instant, irreversible termination.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="suspension-ip" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">10</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Suspension & IP Rights</h2>
              </div>

              <div className="space-y-4">
                <p>
                  <strong>Account Suspension & Disconnections:</strong> We reserve the right to review dashboard activities, verify safety, and temporarily or permanently suspend accounts that infringe these terms, fail safety compliance, or receive abuse complaints from visitors.
                </p>
                <p>
                  <strong>Intellectual Property & Licensing:</strong> All proprietary engines, UI templates, codebase compilers, themes, structural configurations, database schemas, logo designs, icons, trademarks, and backend code remain the exclusive property of Lynksy. Your account grants a limited workspace permission — you may not copy, reverse engineer, scrape, or extract elements of our technology.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="liability" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">11</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Liability & Governing Law</h2>
              </div>
              <p className="uppercase text-xs font-bold text-ink tracking-wide">
                Limitation of Liability & Warrants Disclaimer (AS-IS):
              </p>
              <div className="bg-neutral-100 p-5 rounded-2xl border border-cream-3 text-xs font-mono text-ink/80 leading-relaxed">
                LYNKSY SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANT ABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. TO THE MAXIMUM EXTENT PERMITTED BY INDIAN LAWS, LYNKSY, ITS DIRECTORS, EMPLOYEES, AND PARTNERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR CUSTOMER RELATION LOSSES ARISING OUT OF SERVICE INTERRUPTIONS.
              </div>
              <p className="mt-4">
                <strong>Governing Law & Jurisdiction:</strong> These Terms and Conditions shall be interpreted, governed, and adjudicated by the laws of <strong>India</strong>. Any disputes, complaints, or litigations shall fall under the exclusive jurisdiction of the courts located in India.
              </p>
            </section>

            {/* Section 12 */}
            <section id="contact" className="scroll-mt-28 bg-white p-6 sm:p-10 rounded-3xl border border-cream-3 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-sm">12</span>
                <h2 className="text-2xl font-bold font-syne text-ink my-0">Contact Support</h2>
              </div>
              <p>
                If you have questions about these Terms, need assistance with subscriptions, need to file copyright appeals, or wish to delete your account, reach out directly:
              </p>

              <div className="p-6 bg-ink rounded-2xl text-white space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-orange" size={20} />
                  <h3 className="text-lg font-bold font-syne my-0">Submit Inquiries</h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed my-0">
                  Our compliance support desk is active to assist with subscription issues, domain routing queries, and Razorpay payment details checking.
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

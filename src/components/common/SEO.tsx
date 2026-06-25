import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  ogUrl?: string
}

export function SEO({ 
  title, 
  description, 
  keywords, 
  ogTitle, 
  ogDescription, 
  ogImage,
  ogType = 'website',
  ogUrl
}: SEOProps) {
  const defaultTitle = 'Lynksy — One Link. Every Possibility.'
  const defaultDesc = "India's smartest link-in-bio platform. Accept UPI tips, sell digital products, and grow your audience — all from one link."
  const defaultKeywords = 'link in bio, linktree india, upi, creator tools, instagram bio'

  const fullTitle = title ? `${title} | Lynksy` : defaultTitle

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta name="keywords" content={keywords || defaultKeywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || title || defaultTitle} />
      <meta property="og:description" content={ogDescription || description || defaultDesc} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title || defaultTitle} />
      <meta name="twitter:description" content={ogDescription || description || defaultDesc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  )
}

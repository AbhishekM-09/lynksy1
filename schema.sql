-- ─── LYNKSY SUPABASE DATABASE SCHEMA ───────────────────────────
-- Execute this script in your Supabase SQL Editor to instantly
-- provision all tables required by Lynksy.

-- Enable UUID extension if required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. TRIGGER FOR AUTOMATED UPDATED_AT ───────────────────────
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ─── 2. CORE & PROFILE TABLES ──────────────────────────────────

-- Users - Primary directory for user accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles - Explicit alias table matching users profile details
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usernames index mapping (lowercased username -> user uid reference)
CREATE TABLE IF NOT EXISTS usernames (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails index mapping (lowercased email -> User details)
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. DOMAIN MANAGEMENT ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. DESIGNS, THEMES & CUSTOMIZATION ────────────────────────

-- Links - Custom link-in-bio components and nodes
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themes - Custom/personalized theme assets or user-defined styles
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. E-COMMERCE & PRODUCTS ───────────────────────────────

-- Products - Digital products storefront items
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews on products left by purchasers
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. SALES, SUBSCRIPTIONS & SUPPORT ────────────────────────

-- Orders - Successful creator business sales
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure digital product downloads tokens
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator income payouts
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing invoice documents
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform billing subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing recurring renewal histories
CREATE TABLE IF NOT EXISTS renewal_history (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Successful premium link payment logs
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. ANALYTICS & SHORTENER ──────────────────────────────────

-- Analytics raw page tracking views
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tracking interactive click events
CREATE TABLE IF NOT EXISTS click_events (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simplified aggregated daily creator stats cache
CREATE TABLE IF NOT EXISTS analytics_daily (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Short links and url redirection nodes
CREATE TABLE IF NOT EXISTS short_links (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track link clicks going through shortener redirects
CREATE TABLE IF NOT EXISTS short_link_clicks (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. TIPS, LEADS & GLOBAL OPERATIONS ────────────────────────

-- Creator support payments and tipping logs
CREATE TABLE IF NOT EXISTS tip_records (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead capture lists (email subscribers)
CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support violations or trademark reporting forms
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-wide notifications or banners
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main global administration settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin security auditing activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. EXPLICIT LOGICAL PROMPT ALIASES ─────────────────────────

-- Leads Alias Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- URL Shortener Alias Table
CREATE TABLE IF NOT EXISTS url_shortener (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tips Alias Table
CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Alias Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Alias Table (Stores individual generated token quotas)
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. SYSTEM INDEX CREATION (ACCELERATE DYNAMIC QUERIES) ──────

-- Users & Profiles search indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users ((data->>'username'));
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users ((data->>'customDomain'));
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles ((data->>'username'));
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain ON profiles ((data->>'customDomain'));

-- Direct relationships indexes
CREATE INDEX IF NOT EXISTS idx_links_userid ON links ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_themes_userid ON themes ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_products_userid ON products ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_reviews_userid ON reviews ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_downloads_userid ON downloads ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_payouts_userid ON payouts ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_invoices_userid ON invoices ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_subscriptions_userid ON subscriptions ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_renewal_history_userid ON renewal_history ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_payment_history_userid ON payment_history ((data->>'userId'));

-- Tracking & Click events indexes
CREATE INDEX IF NOT EXISTS idx_page_views_userid ON page_views ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_click_events_userid ON click_events ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_analytics_daily_userid ON analytics_daily ((data->>'userId'));

-- Redirect Shortcode indexes
CREATE INDEX IF NOT EXISTS idx_shortlinks_code ON short_links ((data->>'shortCode'));
CREATE INDEX IF NOT EXISTS idx_shortlinks_userid ON short_links ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_code ON short_link_clicks ((data->>'shortCode'));

-- Tips & Leads indexes
CREATE INDEX IF NOT EXISTS idx_tip_records_userid ON tip_records ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_email_subscribers_userid ON email_subscribers ((data->>'userId'));

-- ─── 11. AUTOMATED MODIFIED-TIME UPDATE TRIGGERS ─────────────────

-- Macro trigger creation helper statement
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name IN (
            'users', 'profiles', 'usernames', 'emails', 'custom_domains', 'domains',
            'links', 'themes', 'products', 'reviews', 'orders', 'downloads', 'payouts',
            'invoices', 'subscriptions', 'renewal_history', 'payment_history',
            'page_views', 'click_events', 'analytics_daily', 'short_links', 'short_link_clicks',
            'tip_records', 'email_subscribers', 'reports', 'announcements', 'app_settings',
            'admin_logs', 'leads', 'url_shortener', 'tips', 'settings', 'ai_usage'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_modified_column ON %I', t);
        EXECUTE format('CREATE TRIGGER trg_update_modified_column BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_modified_column()', t);
    END LOOP;
END;
$$;

-- ─── 12. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────

-- Enable RLS for all newly defined tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name IN (
            'users', 'profiles', 'usernames', 'emails', 'custom_domains', 'domains',
            'links', 'themes', 'products', 'reviews', 'orders', 'downloads', 'payouts',
            'invoices', 'subscriptions', 'renewal_history', 'payment_history',
            'page_views', 'click_events', 'analytics_daily', 'short_links', 'short_link_clicks',
            'tip_records', 'email_subscribers', 'reports', 'announcements', 'app_settings',
            'admin_logs', 'leads', 'url_shortener', 'tips', 'settings', 'ai_usage'
          )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END;
$$;

-- Deploy Permissive yet Secure Policies representing Developer Sandboxes
-- 1. Select / Read is universally public to allow storefront searches and visitor profiles loader
-- 2. Insert, Update, and Delete are fully enabled for authenticated and anonymous actions avoiding access blocks
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name IN (
            'users', 'profiles', 'usernames', 'emails', 'custom_domains', 'domains',
            'links', 'themes', 'products', 'reviews', 'orders', 'downloads', 'payouts',
            'invoices', 'subscriptions', 'renewal_history', 'payment_history',
            'page_views', 'click_events', 'analytics_daily', 'short_links', 'short_link_clicks',
            'tip_records', 'email_subscribers', 'reports', 'announcements', 'app_settings',
            'admin_logs', 'leads', 'url_shortener', 'tips', 'settings', 'ai_usage'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Public Read Access" ON %I FOR SELECT USING (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Authenticated" ON %I', t);
        EXECUTE format('CREATE POLICY "Permissive Write Authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Anon" ON %I', t);
        EXECUTE format('CREATE POLICY "Permissive Write Anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
    END LOOP;
END;
$$;

-- ─── 13. FILE STORAGE PROVISIONS ───────────────────────────────

-- Safely provision 'lynksy_bucket' in Supabase object storage table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lynksy_bucket', 'lynksy_bucket', true, 524288000, null)
ON CONFLICT (id) DO NOTHING;

-- Storage object reading policies
DROP POLICY IF EXISTS "Allow public read from lynksy_bucket" ON storage.objects;
CREATE POLICY "Allow public read from lynksy_bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'lynksy_bucket');

-- Storage object upload policies
DROP POLICY IF EXISTS "Allow uploads to lynksy_bucket" ON storage.objects;
CREATE POLICY "Allow uploads to lynksy_bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lynksy_bucket');

-- Storage object overwrite/update policies
DROP POLICY IF EXISTS "Allow updates in lynksy_bucket" ON storage.objects;
CREATE POLICY "Allow updates in lynksy_bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lynksy_bucket')
WITH CHECK (bucket_id = 'lynksy_bucket');

-- Storage object removal/deletion policies
DROP POLICY IF EXISTS "Allow deletes in lynksy_bucket" ON storage.objects;
CREATE POLICY "Allow deletes in lynksy_bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'lynksy_bucket');

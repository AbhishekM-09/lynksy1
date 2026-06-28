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

-- Deploy Production-Grade Secure policies with full compatibility.
-- First, define the administrator check helper function.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN (auth.jwt()->>'email')::text = 'abhimattikopp9845@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- Drop all permissive sandbox policies on all 33 tables to prepare for production rules.
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
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Authenticated" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Anon" ON %I', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Select Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Insert Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Update Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Delete Policy" ON %I', t);
    END LOOP;
END;
$$;

-- ─── SECTION 1: PUBLIC READ, OWNER WRITE TABLES ──────────────────

-- 1. users
CREATE POLICY "Select Policy" ON users FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON users FOR UPDATE USING (id = auth.uid()::text OR public.is_admin()) WITH CHECK (id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON users FOR DELETE USING (id = auth.uid()::text OR public.is_admin());

-- 2. profiles
CREATE POLICY "Select Policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON profiles FOR UPDATE USING (id = auth.uid()::text OR public.is_admin()) WITH CHECK (id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON profiles FOR DELETE USING (id = auth.uid()::text OR public.is_admin());

-- 3. usernames
CREATE POLICY "Select Policy" ON usernames FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON usernames FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON usernames FOR UPDATE USING ((data->>'uid') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'uid') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON usernames FOR DELETE USING ((data->>'uid') = auth.uid()::text OR public.is_admin());

-- 4. emails
CREATE POLICY "Select Policy" ON emails FOR SELECT USING ((data->>'uid') = auth.uid()::text OR id = auth.jwt()->>'email' OR public.is_admin());
CREATE POLICY "Insert Policy" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON emails FOR UPDATE USING ((data->>'uid') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'uid') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON emails FOR DELETE USING ((data->>'uid') = auth.uid()::text OR public.is_admin());

-- 5. custom_domains
CREATE POLICY "Select Policy" ON custom_domains FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON custom_domains FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON custom_domains FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON custom_domains FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 6. domains
CREATE POLICY "Select Policy" ON domains FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON domains FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON domains FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON domains FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 7. links
CREATE POLICY "Select Policy" ON links FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON links FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON links FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON links FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 8. themes
CREATE POLICY "Select Policy" ON themes FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON themes FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON themes FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON themes FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 9. products
CREATE POLICY "Select Policy" ON products FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON products FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON products FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON products FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 10. reviews
CREATE POLICY "Select Policy" ON reviews FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON reviews FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON reviews FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 11. short_links
CREATE POLICY "Select Policy" ON short_links FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON short_links FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON short_links FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON short_links FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 12. url_shortener
CREATE POLICY "Select Policy" ON url_shortener FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON url_shortener FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON url_shortener FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON url_shortener FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());


-- ─── SECTION 2: PRIVATE READ, OWNER/ADMIN MANAGE TABLES ──────────

-- 13. orders
CREATE POLICY "Select Policy" ON orders FOR SELECT USING (
    (data->>'userId') = auth.uid()::text OR 
    (data->>'creatorId') = auth.uid()::text OR 
    (data->>'buyerEmail') = auth.jwt()->>'email' OR 
    public.is_admin()
);
CREATE POLICY "Insert Policy" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON orders FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON orders FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 14. downloads
CREATE POLICY "Select Policy" ON downloads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = (downloads.data->>'orderId') 
          AND (
              (orders.data->>'userId') = auth.uid()::text OR 
              (orders.data->>'creatorId') = auth.uid()::text OR 
              (orders.data->>'buyerEmail') = auth.jwt()->>'email'
          )
    ) OR public.is_admin()
);
CREATE POLICY "Insert Policy" ON downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON downloads FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON downloads FOR DELETE USING (public.is_admin());

-- 15. payouts
CREATE POLICY "Select Policy" ON payouts FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON payouts FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON payouts FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON payouts FOR DELETE USING (public.is_admin());

-- 16. invoices
CREATE POLICY "Select Policy" ON invoices FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON invoices FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON invoices FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON invoices FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 17. subscriptions
CREATE POLICY "Select Policy" ON subscriptions FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON subscriptions FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON subscriptions FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON subscriptions FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 18. renewal_history
CREATE POLICY "Select Policy" ON renewal_history FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON renewal_history FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON renewal_history FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON renewal_history FOR DELETE USING (public.is_admin());

-- 19. payment_history
CREATE POLICY "Select Policy" ON payment_history FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON payment_history FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON payment_history FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON payment_history FOR DELETE USING (public.is_admin());

-- 20. page_views
CREATE POLICY "Select Policy" ON page_views FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON page_views FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON page_views FOR DELETE USING (public.is_admin());

-- 21. click_events
CREATE POLICY "Select Policy" ON click_events FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON click_events FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON click_events FOR DELETE USING (public.is_admin());

-- 22. analytics_daily
CREATE POLICY "Select Policy" ON analytics_daily FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON analytics_daily FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON analytics_daily FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON analytics_daily FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 23. short_link_clicks
CREATE POLICY "Select Policy" ON short_link_clicks FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON short_link_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON short_link_clicks FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON short_link_clicks FOR DELETE USING (public.is_admin());

-- 24. tip_records
CREATE POLICY "Select Policy" ON tip_records FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON tip_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON tip_records FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON tip_records FOR DELETE USING (public.is_admin());

-- 25. tips
CREATE POLICY "Select Policy" ON tips FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON tips FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON tips FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON tips FOR DELETE USING (public.is_admin());

-- 26. email_subscribers
CREATE POLICY "Select Policy" ON email_subscribers FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON email_subscribers FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON email_subscribers FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 27. leads
CREATE POLICY "Select Policy" ON leads FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON leads FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON leads FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 28. reports
CREATE POLICY "Select Policy" ON reports FOR SELECT USING (public.is_admin());
CREATE POLICY "Insert Policy" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON reports FOR DELETE USING (public.is_admin());

-- 29. announcements
CREATE POLICY "Select Policy" ON announcements FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON announcements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON announcements FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON announcements FOR DELETE USING (public.is_admin());

-- 30. app_settings
CREATE POLICY "Select Policy" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON app_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON app_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON app_settings FOR DELETE USING (public.is_admin());

-- 31. admin_logs
CREATE POLICY "Select Policy" ON admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Insert Policy" ON admin_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON admin_logs FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON admin_logs FOR DELETE USING (public.is_admin());

-- 32. settings
CREATE POLICY "Select Policy" ON settings FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON settings FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON settings FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON settings FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 33. ai_usage
CREATE POLICY "Select Policy" ON ai_usage FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON ai_usage FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON ai_usage FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON ai_usage FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

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

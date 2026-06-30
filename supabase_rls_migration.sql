-- ─── LYNKSY PRODUCTION-GRADE SUPABASE SECURITY MIGRATION ──────────
-- Target: Supabase PostgreSQL Database (Production Environment)
-- Description: Drops existing development permissive policies, creates a helper
--              function for administrative operations, and implements strict
--              Row Level Security (RLS) on all 33 database tables.
-- Author: Senior Supabase Database Architect and Security Engineer
-- Date: 2026-06-25

-- ─── 1. REGISTER ADMINISTRATIVE SECURITY FUNCTIONS ──────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    -- Authorizes the system administrator email for platform analytics and oversight
    RETURN (auth.jwt()->>'email')::text = 'abhimattikopp9845@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- ─── 2. PURGE PREVIOUS PERMISSIVE POLICIES ─────────────────────────
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
        -- Remove standard sandbox development policies
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Authenticated" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Write Anon" ON %I', t);
        
        -- Remove legacy policy matches to avoid collision
        EXECUTE format('DROP POLICY IF EXISTS "Select Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Insert Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Update Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Delete Policy" ON %I', t);
    END LOOP;
END;
$$;


-- ─── 3. DEFINE FINE-GRAINED PRODUCTION SECURITY RULES ────────────────

-- ─── SECTION 3.1: PUBLIC READ, OWNER/ADMIN WRITE (Storefront & Profile Tables) ───

-- 1. users (Profile data)
CREATE POLICY "Select Policy" ON users FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON users FOR UPDATE USING (id = auth.uid()::text OR public.is_admin()) WITH CHECK (id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON users FOR DELETE USING (id = auth.uid()::text OR public.is_admin());

-- 2. profiles (Explicit profile mirror)
CREATE POLICY "Select Policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON profiles FOR UPDATE USING (id = auth.uid()::text OR public.is_admin()) WITH CHECK (id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON profiles FOR DELETE USING (id = auth.uid()::text OR public.is_admin());

-- 3. usernames (Username allocation registry)
CREATE POLICY "Select Policy" ON usernames FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON usernames FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON usernames FOR UPDATE USING ((data->>'uid') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'uid') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON usernames FOR DELETE USING ((data->>'uid') = auth.uid()::text OR public.is_admin());

-- 4. emails (Email registration registry)
CREATE POLICY "Select Policy" ON emails FOR SELECT USING ((data->>'uid') = auth.uid()::text OR id = auth.jwt()->>'email' OR public.is_admin());
CREATE POLICY "Insert Policy" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON emails FOR UPDATE USING ((data->>'uid') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'uid') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON emails FOR DELETE USING ((data->>'uid') = auth.uid()::text OR public.is_admin());

-- 5. custom_domains (User custom domain mapping)
CREATE POLICY "Select Policy" ON custom_domains FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON custom_domains FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON custom_domains FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON custom_domains FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 6. domains (Platform domain mapping)
CREATE POLICY "Select Policy" ON domains FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON domains FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON domains FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON domains FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 7. links (Link-in-bio redirect targets)
CREATE POLICY "Select Policy" ON links FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON links FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON links FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete Policy" ON links FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 8. themes (Creator personalized themes)
CREATE POLICY "Select Policy" ON themes FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON themes FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON themes FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON themes FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 9. products (Digital products catalogs)
CREATE POLICY "Select Policy" ON products FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON products FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON products FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON products FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 10. reviews (Product checkout buyer reviews)
CREATE POLICY "Select Policy" ON reviews FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON reviews FOR INSERT WITH CHECK (true); -- Public reviews submission
CREATE POLICY "Update Policy" ON reviews FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON reviews FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 11. short_links (URL Shortener records)
CREATE POLICY "Select Policy" ON short_links FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON short_links FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON short_links FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete Policy" ON short_links FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 12. url_shortener (URL Shortener alias mapping table)
CREATE POLICY "Select Policy" ON url_shortener FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON url_shortener FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON url_shortener FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON url_shortener FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());


-- ─── SECTION 3.2: PRIVATE READ, OWNER/ADMIN MANAGE TABLES (Transactions, Analytics & Private Logs) ───

-- 13. orders (Sales transactions registry)
CREATE POLICY "Select Policy" ON orders FOR SELECT USING (
    (data->>'userId') = auth.uid()::text OR 
    (data->>'creatorId') = auth.uid()::text OR 
    (data->>'buyerEmail') = auth.jwt()->>'email' OR 
    public.is_admin()
); -- Open Select restricted to authorized owners, authenticated buyers, and administrators
CREATE POLICY "Insert Policy" ON orders FOR INSERT WITH CHECK (true); -- Public guest checkout
CREATE POLICY "Update Policy" ON orders FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON orders FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 14. downloads (Secure file download token logs)
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
); -- Verification token queries restricted to authorized owners, authenticated buyers, and administrators
CREATE POLICY "Insert Policy" ON downloads FOR INSERT WITH CHECK (true); -- Order complete creates tokens
CREATE POLICY "Update Policy" ON downloads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete Policy" ON downloads FOR DELETE USING (public.is_admin());

-- 15. payouts (Creator withdrawal records)
CREATE POLICY "Select Policy" ON payouts FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON payouts FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON payouts FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON payouts FOR DELETE USING (public.is_admin());

-- 16. invoices (Billing receipt documents)
CREATE POLICY "Select Policy" ON invoices FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON invoices FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON invoices FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON invoices FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 17. subscriptions (Creator premium plan subscription records)
CREATE POLICY "Select Policy" ON subscriptions FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON subscriptions FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON subscriptions FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON subscriptions FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 18. renewal_history (Subscription renewal historical traces)
CREATE POLICY "Select Policy" ON renewal_history FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON renewal_history FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON renewal_history FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON renewal_history FOR DELETE USING (public.is_admin());

-- 19. payment_history (SaaS credit card records)
CREATE POLICY "Select Policy" ON payment_history FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON payment_history FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON payment_history FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON payment_history FOR DELETE USING (public.is_admin());

-- 20. page_views (Link-in-bio analytics counters)
CREATE POLICY "Select Policy" ON page_views FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON page_views FOR INSERT WITH CHECK (true); -- Unsigned visitor tracking
CREATE POLICY "Update Policy" ON page_views FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON page_views FOR DELETE USING (public.is_admin());

-- 21. click_events (Link-in-bio click analytics trackers)
CREATE POLICY "Select Policy" ON click_events FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON click_events FOR INSERT WITH CHECK (true); -- Unsigned visitor tracking
CREATE POLICY "Update Policy" ON click_events FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON click_events FOR DELETE USING (public.is_admin());

-- 22. analytics_daily (Daily metrics summary matrices)
CREATE POLICY "Select Policy" ON analytics_daily FOR SELECT USING (true);
CREATE POLICY "Insert Policy" ON analytics_daily FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON analytics_daily FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete Policy" ON analytics_daily FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 23. short_link_clicks (Short links analytics traces)
CREATE POLICY "Select Policy" ON short_link_clicks FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON short_link_clicks FOR INSERT WITH CHECK (true); -- Anonymous clicks tracking
CREATE POLICY "Update Policy" ON short_link_clicks FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON short_link_clicks FOR DELETE USING (public.is_admin());

-- 24. tip_records (Creator support tips logs)
CREATE POLICY "Select Policy" ON tip_records FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON tip_records FOR INSERT WITH CHECK (true); -- Public visitor tips
CREATE POLICY "Update Policy" ON tip_records FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON tip_records FOR DELETE USING (public.is_admin());

-- 25. tips (Tipping records alias table)
CREATE POLICY "Select Policy" ON tips FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON tips FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON tips FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON tips FOR DELETE USING (public.is_admin());

-- 26. email_subscribers (Creator newsletter listing)
CREATE POLICY "Select Policy" ON email_subscribers FOR SELECT USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON email_subscribers FOR INSERT WITH CHECK (true); -- Public signup form
CREATE POLICY "Update Policy" ON email_subscribers FOR UPDATE USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'creatorId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON email_subscribers FOR DELETE USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin());

-- 27. leads (Newsletter listing alias table)
CREATE POLICY "Select Policy" ON leads FOR SELECT USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Policy" ON leads FOR UPDATE USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'creatorId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON leads FOR DELETE USING ((data->>'creatorId') = auth.uid()::text OR public.is_admin());

-- 28. reports (DMCA / Copyright / Scam submissions)
CREATE POLICY "Select Policy" ON reports FOR SELECT USING (public.is_admin());
CREATE POLICY "Insert Policy" ON reports FOR INSERT WITH CHECK (true); -- Guest report submissions
CREATE POLICY "Update Policy" ON reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON reports FOR DELETE USING (public.is_admin());

-- 29. announcements (Global administrative alerts)
CREATE POLICY "Select Policy" ON announcements FOR SELECT USING (true); -- Read-only public announcement bars
CREATE POLICY "Insert Policy" ON announcements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON announcements FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON announcements FOR DELETE USING (public.is_admin());

-- 30. app_settings (Global SaaS system parameters)
CREATE POLICY "Select Policy" ON app_settings FOR SELECT USING (true); -- Read-only public parameters (e.g. system operational flags)
CREATE POLICY "Insert Policy" ON app_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON app_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON app_settings FOR DELETE USING (public.is_admin());

-- 31. admin_logs (System admin security trails)
CREATE POLICY "Select Policy" ON admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Insert Policy" ON admin_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Update Policy" ON admin_logs FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Delete Policy" ON admin_logs FOR DELETE USING (public.is_admin());

-- 32. settings (Platform system overrides / user custom setting maps)
CREATE POLICY "Select Policy" ON settings FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON settings FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON settings FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON settings FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());

-- 33. ai_usage (Gemini usage allowances tracking)
CREATE POLICY "Select Policy" ON ai_usage FOR SELECT USING ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Insert Policy" ON ai_usage FOR INSERT WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Update Policy" ON ai_usage FOR UPDATE USING ((data->>'userId') = auth.uid()::text OR public.is_admin()) WITH CHECK ((data->>'userId') = auth.uid()::text OR public.is_admin());
CREATE POLICY "Delete Policy" ON ai_usage FOR DELETE USING ((data->>'userId') = auth.uid()::text OR public.is_admin());


-- ─── SECTION 4: TRIGGER-BASED FIELD-LEVEL UPDATE CHECKS ──────────

-- Trigger and check function for short_links updates
CREATE OR REPLACE FUNCTION check_short_link_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If owner or admin, allow any change
  IF (NEW.data->>'userId') = auth.uid()::text OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise, only allow updating the analytics/click fields.
  IF (OLD.data - ARRAY['clicks', 'lastClick', 'firstClick', 'uniqueVisitors', 'devices', 'browsers', 'countries', 'referrers']) = 
     (NEW.data - ARRAY['clicks', 'lastClick', 'firstClick', 'uniqueVisitors', 'devices', 'browsers', 'countries', 'referrers']) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized update to restricted fields on short_links';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_short_link_update ON short_links;
CREATE TRIGGER trg_check_short_link_update
BEFORE UPDATE ON short_links
FOR EACH ROW
EXECUTE FUNCTION check_short_link_update();


-- Trigger and check function for downloads updates
CREATE OR REPLACE FUNCTION check_downloads_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If admin, allow any change
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise, only allow updating the downloadCount field.
  IF (OLD.data - 'downloadCount') = (NEW.data - 'downloadCount') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized update to restricted fields on downloads';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_downloads_update ON downloads;
CREATE TRIGGER trg_check_downloads_update
BEFORE UPDATE ON downloads
FOR EACH ROW
EXECUTE FUNCTION check_downloads_update();


-- Trigger and check function for links updates (allowing public clickCount increments)
CREATE OR REPLACE FUNCTION check_links_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If owner or admin, allow any change
  IF (NEW.data->>'userId') = auth.uid()::text OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise, only allow updating clickCount and lastClickedAt
  IF (OLD.data - ARRAY['clickCount', 'lastClickedAt']) = 
     (NEW.data - ARRAY['clickCount', 'lastClickedAt']) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized update to restricted fields on links';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_links_update ON links;
CREATE TRIGGER trg_check_links_update
BEFORE UPDATE ON links
FOR EACH ROW
EXECUTE FUNCTION check_links_update();


-- Trigger and check function for analytics_daily updates (allowing public aggregate views/clicks counts)
CREATE OR REPLACE FUNCTION check_analytics_daily_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If owner or admin, allow any change
  IF (NEW.data->>'userId') = auth.uid()::text OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise, only allow updating views, clicks, updatedAt, date, and userId
  IF (OLD.data - ARRAY['views', 'clicks', 'updatedAt', 'date']) = 
     (NEW.data - ARRAY['views', 'clicks', 'updatedAt', 'date']) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized update to restricted fields on analytics_daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_analytics_daily_update ON analytics_daily;
CREATE TRIGGER trg_check_analytics_daily_update
BEFORE UPDATE ON analytics_daily
FOR EACH ROW
EXECUTE FUNCTION check_analytics_daily_update();


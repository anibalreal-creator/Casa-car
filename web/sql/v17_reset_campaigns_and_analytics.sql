
-- v18 patch: compatibilidad con bases existentes
-- asegura columnas mínimas en profiles y subscriptions antes del seed owner/admin
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'basic';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Casa-Car v17 reset limpio de campañas + analítica
-- Ejecutar este script en Supabase SQL Editor.
-- Hace backup lógico de campañas viejas, recrea ad_campaigns con UUID limpio,
-- reconstruye funciones RPC de métricas y deja tablas de presencia listas.

create extension if not exists pgcrypto;

-- 0) backup ligero de campañas viejas si existe la tabla actual
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns'
  ) THEN
    BEGIN
      EXECUTE 'drop table if exists ad_campaigns_legacy_backup';
      EXECUTE 'create table ad_campaigns_legacy_backup as table ad_campaigns';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo crear backup lógico de ad_campaigns: %', SQLERRM;
    END;
  END IF;
END $$;

-- 1) borrar funciones viejas que puedan depender de campaign_id bigint/uuid mezclado
DROP FUNCTION IF EXISTS increment_campaign_impression(uuid);
DROP FUNCTION IF EXISTS increment_campaign_click(uuid);
DROP FUNCTION IF EXISTS increment_campaign_impression(text);
DROP FUNCTION IF EXISTS increment_campaign_click(text);

-- 2) recrear tabla ad_campaigns limpia y consistente
DROP TABLE IF EXISTS ad_campaigns CASCADE;
CREATE TABLE ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  contact_email text,
  contact_phone text,
  contact_name text,
  title text,
  description text,
  plan_key text,
  slot_key text,
  banner_url text,
  destination_url text,
  cta_text text,
  mercadopago_status text DEFAULT 'pending',
  mercadopago_payment_id text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  status text DEFAULT 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id ON ad_campaigns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_slot_key ON ad_campaigns(slot_key);

-- 3) trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ad_campaigns_updated_at ON ad_campaigns;
CREATE TRIGGER trg_ad_campaigns_updated_at
BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 4) funciones RPC robustas (sin campaign_id viejo)
CREATE OR REPLACE FUNCTION increment_campaign_impression(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ad_campaigns
     SET impressions = COALESCE(impressions, 0) + 1,
         updated_at = now()
   WHERE id = p_campaign_id;
END $$;

CREATE OR REPLACE FUNCTION increment_campaign_click(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ad_campaigns
     SET clicks = COALESCE(clicks, 0) + 1,
         updated_at = now()
   WHERE id = p_campaign_id;
END $$;

-- 5) presencia / analítica en vivo
CREATE TABLE IF NOT EXISTS presence_heartbeats (
  session_key text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_authenticated boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  path text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence_heartbeats(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence_heartbeats(user_id, last_seen_at DESC);

CREATE OR REPLACE FUNCTION cleanup_presence_heartbeats()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM presence_heartbeats
   WHERE last_seen_at < now() - interval '2 days';
$$;

-- 6) favoritos / suscripciones / pagos compatibles SaaS
-- (las columnas también se refuerzan arriba para compatibilidad con tablas existentes)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'basic',
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'listing',
  reference_id uuid,
  mp_preference_id text,
  status text DEFAULT 'pending',
  amount numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- 7) RLS sólido
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns own read" ON ad_campaigns;
CREATE POLICY "campaigns own read" ON ad_campaigns FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "campaigns own write" ON ad_campaigns;
CREATE POLICY "campaigns own write" ON ad_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "campaigns own update" ON ad_campaigns;
CREATE POLICY "campaigns own update" ON ad_campaigns FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "campaigns own delete" ON ad_campaigns;
CREATE POLICY "campaigns own delete" ON ad_campaigns FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites own read" ON favorites;
CREATE POLICY "favorites own read" ON favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites own write" ON favorites;
CREATE POLICY "favorites own write" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites own delete" ON favorites;
CREATE POLICY "favorites own delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions own read" ON subscriptions;
CREATE POLICY "subscriptions own read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "payments own read" ON payments;
CREATE POLICY "payments own read" ON payments FOR SELECT USING (auth.uid() = user_id);

-- presencia: sólo service role o backend
DROP POLICY IF EXISTS "presence service only select" ON presence_heartbeats;
CREATE POLICY "presence service only select" ON presence_heartbeats FOR SELECT USING (false);
DROP POLICY IF EXISTS "presence service only write" ON presence_heartbeats;
CREATE POLICY "presence service only write" ON presence_heartbeats FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "presence service only update" ON presence_heartbeats;
CREATE POLICY "presence service only update" ON presence_heartbeats FOR UPDATE USING (false);

-- 8) owner seed: admin + owner plan
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE lower(email) = 'anibalreal@hotmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = excluded.email;

INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, metadata)
SELECT id, 'owner', 'active', now(), now() + interval '10 years', jsonb_build_object('source','v17_reset')
FROM auth.users
WHERE lower(email) = 'anibalreal@hotmail.com'
ON CONFLICT DO NOTHING;

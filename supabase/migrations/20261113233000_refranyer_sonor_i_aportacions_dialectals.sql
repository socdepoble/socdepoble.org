-- ═══════════════════════════════════════════════════════════════════════════
-- 20261113233000_refranyer_sonor_i_aportacions_dialectals.sql
-- Onada R23 · «La Veu de Sóc de Poble»: Refranyer Comarcal i Aportacions Orals
--
-- Additiva, transaccional i idempotent. NO aplicada a cap base remota:
-- l'aplica el Mestre.
-- Fortificació alineada amb tractor-rls.mjs (R1..R8) i doctrina RGPD:
--   · RLS activada des del primer instant en totes les taules públiques.
--   · Zero `USING (true)` o `WITH CHECK (true)`.
--   · Consentiment RGPD explícit (`consentiment_arxiu_obert = true`) i data
--     `consentiment_acceptat_at` obligatòria SENSE `DEFAULT now()` automàtic.
--   · Sostres físics estrictes de longitud, durada (<= 15 s) i mida (<= 2 MB).
--
-- Verificació posterior (lectura):
--   select to_regclass('public.refranys_poble') is not null as te_refranys_poble,
--          to_regclass('public.aportacions_veu_poble') is not null as te_aportacions_veu;
--
-- Com tornar enrere (Onada R24.2): primer la de 20261114023000 si s'ha
-- aplicada, i després, en una transacció,
--   drop table if exists public.aportacions_veu_poble;
--   drop table if exists public.refranys_poble;
-- Es perden les aportacions i els refranys que s'hi hagen escrit des de
-- l'aplicació (el client torna a l'emmagatzematge local honest).
-- ═══════════════════════════════════════════════════════════════════════════

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

CREATE TABLE IF NOT EXISTS public.refranys_poble (
  id text PRIMARY KEY CHECK (char_length(id) <= 80 AND char_length(btrim(id)) BETWEEN 3 AND 80),
  categoria text NOT NULL CHECK (categoria IN (
    'camp-olivera',
    'oratge-aigua',
    'taula-rebost',
    'saviesa-convivencia'
  )),
  text_refrany text NOT NULL CHECK (char_length(text_refrany) <= 280 AND char_length(btrim(text_refrany)) BETWEEN 4 AND 280),
  comarca text NOT NULL CHECK (char_length(comarca) <= 120 AND char_length(btrim(comarca)) BETWEEN 2 AND 120),
  poble text CHECK (poble IS NULL OR char_length(poble) <= 120),
  veu_suggerida text CHECK (veu_suggerida IS NULL OR veu_suggerida IN (
    'gina_valencia',
    'arnau_valencia',
    'berta_valencia',
    'lluc_valencia',
    'emma_occidental',
    'elia_central',
    'olga_balear',
    'auto_navegador'
  )),
  explicacio_i18n jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(explicacio_i18n) = 'object'),
  estat text NOT NULL DEFAULT 'pendent' CHECK (estat IN ('pendent', 'publicat', 'retirat')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refranys_poble ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS refranys_poble_lectura_publicats ON public.refranys_poble;
CREATE POLICY refranys_poble_lectura_publicats
  ON public.refranys_poble
  FOR SELECT
  USING (estat = 'publicat');

-- Onada R24.2 · Cap privilegi per defecte de Supabase (TRUNCATE, REFERENCES,
-- TRIGGER…) no hi queda: primer es revoca tot i després només lectura.
REVOKE ALL ON TABLE public.refranys_poble FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.refranys_poble TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_refranys_poble_categoria_estat
  ON public.refranys_poble (categoria, estat);


CREATE TABLE IF NOT EXISTS public.aportacions_veu_poble (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipus text NOT NULL CHECK (tipus IN ('refrany_audio', 'variant_isoglossa')),
  refrany_id text CHECK (refrany_id IS NULL OR char_length(refrany_id) <= 80),
  pregunta_id text CHECK (pregunta_id IS NULL OR char_length(pregunta_id) <= 80),
  text_aportat text NOT NULL CHECK (char_length(text_aportat) <= 280 AND char_length(btrim(text_aportat)) BETWEEN 2 AND 280),
  poble_comarca text NOT NULL CHECK (char_length(poble_comarca) <= 120 AND char_length(btrim(poble_comarca)) BETWEEN 2 AND 120),
  audio_storage_path text CHECK (audio_storage_path IS NULL OR char_length(audio_storage_path) <= 255),
  audio_mime text CHECK (audio_mime IS NULL OR audio_mime IN (
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav'
  )),
  durada_segons numeric(4, 1) CHECK (durada_segons IS NULL OR (durada_segons > 0 AND durada_segons <= 15)),
  mida_bytes integer CHECK (mida_bytes IS NULL OR (mida_bytes > 0 AND mida_bytes <= 2097152)),
  consentiment_arxiu_obert boolean NOT NULL CHECK (consentiment_arxiu_obert = true),
  consentiment_versio text NOT NULL CHECK (consentiment_versio = 'cc-by-sa-4.0-v1'),
  consentiment_acceptat_at timestamptz NOT NULL,
  estat_moderacio text NOT NULL DEFAULT 'pendent' CHECK (estat_moderacio IN ('pendent', 'aprovat', 'rebutjat')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aportacions_veu_poble ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aportacions_veu_poble_select ON public.aportacions_veu_poble;
CREATE POLICY aportacions_veu_poble_select
  ON public.aportacions_veu_poble
  FOR SELECT
  USING (estat_moderacio = 'aprovat' OR auth.uid() = user_id);

DROP POLICY IF EXISTS aportacions_veu_poble_insert ON public.aportacions_veu_poble;
CREATE POLICY aportacions_veu_poble_insert
  ON public.aportacions_veu_poble
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND consentiment_arxiu_obert = true
    AND estat_moderacio = 'pendent'
  );

DROP POLICY IF EXISTS aportacions_veu_poble_delete_autor ON public.aportacions_veu_poble;
CREATE POLICY aportacions_veu_poble_delete_autor
  ON public.aportacions_veu_poble
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Onada R24.2 (Gauntlet del paquet de producció; D-codex_sql_port-3c) · anon i
-- authenticated només lligen les columnes públiques d'una aportació aprovada
-- (o de les pròpies, per la RLS): mai user_id (l'autoria), audio_storage_path
-- (el camí del fitxer pot portar l'id del compte) ni consentiment_acceptat_at.
-- La RLS d'autoria no necessita el privilegi de columna, i el client només
-- torna id, estat_moderacio i created_at de l'INSERT. El REVOKE de taula també
-- lleva els permisos de columna d'una passada anterior i els privilegis per
-- defecte de Supabase, i els GRANT els tornen: repetible.
REVOKE ALL ON TABLE public.aportacions_veu_poble FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, tipus, refrany_id, pregunta_id, text_aportat, poble_comarca, audio_mime, durada_segons,
  mida_bytes, consentiment_versio, estat_moderacio, created_at)
  ON TABLE public.aportacions_veu_poble TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.aportacions_veu_poble TO authenticated;

CREATE INDEX IF NOT EXISTS idx_aportacions_veu_poble_estat
  ON public.aportacions_veu_poble (estat_moderacio, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_aportacions_veu_poble_user
  ON public.aportacions_veu_poble (user_id, created_at DESC);

commit;

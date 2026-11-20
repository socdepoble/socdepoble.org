-- R32.17 · Reserva immutable d'una clau de reposició, sense executar compres.
-- Instal·lació local/producció explícita. No elimina ni recicla claus per caducitat.
-- Requisits: esquema canònic towns, town_memberships, auth.uid(), is_town_member.
-- Concurrència: índex únic + segona ordre SQL amb snapshot renovat a READ COMMITTED.
-- A REPEATABLE READ/SERIALIZABLE, 40001 exigeix reintentar la transacció sencera.
BEGIN;
SELECT pg_catalog.pg_advisory_xact_lock(1935960372, 1732170003);

CREATE TABLE IF NOT EXISTS public.inventari_reserves_cicle (
  reserva_id pg_catalog.uuid NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  tenant_id pg_catalog.uuid NOT NULL REFERENCES public.towns(id),
  magatzem_id pg_catalog.text NOT NULL,
  article_id pg_catalog.text NOT NULL,
  cicle_id pg_catalog.text NOT NULL,
  quantitat pg_catalog.int8 NOT NULL CHECK (quantitat BETWEEN 1 AND 9007199254740991),
  creada_per pg_catalog.uuid NOT NULL,
  creada_el pg_catalog.timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  CONSTRAINT inventari_reserves_cicle_pkey PRIMARY KEY (reserva_id),
  CONSTRAINT inventari_reserves_cicle_scope_key UNIQUE (tenant_id, magatzem_id, article_id, cicle_id)
);

-- No adopta una taula homònima amb tipus, propietari, clau única o trigger aliens.
-- La identitat de l’índex és part del contracte: un UUID afegit a la clau anul·laria la deduplicació.
DO $sdp_guard$
DECLARE v_columnes pg_catalog.text[]; v_tipus pg_catalog.oid[]; v_not_null pg_catalog.bool;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    WHERE c.oid = 'public.inventari_reserves_cicle'::pg_catalog.regclass
      AND c.relkind = 'r' AND c.relowner = (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname = CURRENT_USER)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'SDP-R3217-SCHEMA: propietari o classe inesperats';
  END IF;
  SELECT pg_catalog.array_agg(a.attname::pg_catalog.text ORDER BY a.attnum),
      pg_catalog.array_agg(a.atttypid ORDER BY a.attnum),pg_catalog.bool_and(a.attnotnull)
    INTO v_columnes,v_tipus,v_not_null FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass AND a.attnum > 0 AND NOT a.attisdropped;
  IF v_columnes IS DISTINCT FROM ARRAY['reserva_id','tenant_id','magatzem_id','article_id','cicle_id','quantitat','creada_per','creada_el']::pg_catalog.text[]
    OR v_tipus IS DISTINCT FROM ARRAY['pg_catalog.uuid'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.uuid'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.text'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.text'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.text'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.int8'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.uuid'::pg_catalog.regtype::pg_catalog.oid,'pg_catalog.timestamptz'::pg_catalog.regtype::pg_catalog.oid]
    OR v_not_null IS DISTINCT FROM true
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_index i ON i.indexrelid = c.conindid
      WHERE c.conrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass
        AND c.conname = 'inventari_reserves_cicle_scope_key' AND c.contype = 'u'
        AND c.conkey = ARRAY[2,3,4,5]::pg_catalog.int2[] AND NOT c.condeferrable AND c.convalidated
        AND i.indisunique AND i.indisvalid AND i.indisready AND i.indnkeyatts = 4 AND i.indnatts = 4
        AND i.indpred IS NULL AND i.indexprs IS NULL
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_index i ON i.indexrelid = c.conindid
      WHERE c.conrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass
        AND c.conname = 'inventari_reserves_cicle_pkey' AND c.contype = 'p'
        AND c.conkey = ARRAY[1]::pg_catalog.int2[] AND NOT c.condeferrable AND c.convalidated
        AND i.indisunique AND i.indisvalid AND i.indisready AND i.indnkeyatts = 1 AND i.indnatts = 1
        AND i.indpred IS NULL AND i.indexprs IS NULL
    )
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass AND NOT t.tgisinternal)
    -- Gauntlet v1.2.14 R2b · El DROP posterior només pot llevar un CHECK: una restricció homònima d'un altre tipus
    -- (p. ex. un NOT NULL amb nom, PG ≥ 18) és una preimatge aliena.
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint c WHERE c.conrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass
      AND c.conname = 'inventari_reserves_cicle_ids_check' AND c.contype <> 'c')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid = 'public.inventari_reserves_cicle'::pg_catalog.regclass AND p.polname <> 'inventari_reserves_cicle_lectura')
  THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'SDP-R3217-SCHEMA: preimatge incompatible';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid = pg_catalog.to_regprocedure('public.reserva_reposicio_inventari(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8)')
      AND p.proowner <> (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname = CURRENT_USER)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'SDP-R3217-SCHEMA: propietari de funcio inesperat';
  END IF;
END
$sdp_guard$;

-- Gauntlet v1.2.14 R2 · El CHECK dels identificadors es renova sempre, també sobre una taula ja instal·lada:
-- CREATE TABLE IF NOT EXISTS no el tocaria, i una instal·lació d'un kit anterior conservaria el vell en silenci.
-- Si alguna fila existent el viola, l'ALTER falla i la transacció sencera es desfà (fail-closed).
ALTER TABLE public.inventari_reserves_cicle
  DROP CONSTRAINT IF EXISTS inventari_reserves_cicle_ids_check,
  ADD CONSTRAINT inventari_reserves_cicle_ids_check CHECK (
    pg_catalog.char_length(magatzem_id) BETWEEN 1 AND 160 AND pg_catalog.btrim(magatzem_id) <> ''
    AND magatzem_id = pg_catalog.normalize(magatzem_id, 'NFC') AND magatzem_id !~ '[[:cntrl:]]'
    AND magatzem_id !~ E'[\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890-\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\U000110BD\\U000110CD\\U00013430-\\U0001343F\\U0001BCA0-\\U0001BCA3\\U0001D173-\\U0001D17A\\U000E0001\\U000E0020-\\U000E007F]' AND magatzem_id !~ E'^[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]|[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]$'
    AND pg_catalog.char_length(article_id) BETWEEN 1 AND 160 AND pg_catalog.btrim(article_id) <> ''
    AND article_id = pg_catalog.normalize(article_id, 'NFC') AND article_id !~ '[[:cntrl:]]'
    AND article_id !~ E'[\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890-\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\U000110BD\\U000110CD\\U00013430-\\U0001343F\\U0001BCA0-\\U0001BCA3\\U0001D173-\\U0001D17A\\U000E0001\\U000E0020-\\U000E007F]' AND article_id !~ E'^[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]|[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]$'
    AND pg_catalog.char_length(cicle_id) BETWEEN 1 AND 160 AND pg_catalog.btrim(cicle_id) <> ''
    AND cicle_id = pg_catalog.normalize(cicle_id, 'NFC') AND cicle_id !~ '[[:cntrl:]]'
    AND cicle_id !~ E'[\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890-\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\U000110BD\\U000110CD\\U00013430-\\U0001343F\\U0001BCA0-\\U0001BCA3\\U0001D173-\\U0001D17A\\U000E0001\\U000E0020-\\U000E007F]' AND cicle_id !~ E'^[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]|[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]$'
  );

ALTER TABLE public.inventari_reserves_cicle ENABLE ROW LEVEL SECURITY;
-- Gauntlet v1.2.14 R2b · Idempotent: una instal·lació del kit anterior amb FORCE torna a la convenció del catàleg.
ALTER TABLE public.inventari_reserves_cicle NO FORCE ROW LEVEL SECURITY;
-- Gauntlet v1.2.14 · Sense FORCE, com la resta de taules del catàleg: el propietari (la RPC definer) no depén de tindre
-- BYPASSRLS; la resta de rols queden sota RLS.
REVOKE ALL ON TABLE public.inventari_reserves_cicle FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.inventari_reserves_cicle TO authenticated;
DROP POLICY IF EXISTS inventari_reserves_cicle_lectura ON public.inventari_reserves_cicle;
CREATE POLICY inventari_reserves_cicle_lectura ON public.inventari_reserves_cicle
  FOR SELECT TO authenticated USING (private.is_town_member(tenant_id));

CREATE OR REPLACE FUNCTION public.reserva_reposicio_inventari(
  p_tenant_id pg_catalog.uuid, p_magatzem_id pg_catalog.text,
  p_article_id pg_catalog.text, p_cicle_id pg_catalog.text, p_quantitat pg_catalog.int8
) RETURNS pg_catalog.jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $sdp_reserva$
DECLARE
  v_actor pg_catalog.uuid := auth.uid();
  v_admin pg_catalog.uuid;
  v_reserva public.inventari_reserves_cicle%ROWTYPE;
  v_creada pg_catalog.bool := false;
BEGIN
  IF v_actor IS NULL OR p_tenant_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'SDP-R3217-AUTH: sessio i poble obligatoris';
  END IF;
  -- Manté vigent l'autorització fins al commit: una baixa/retirada d'admin espera.
  SELECT m.user_id INTO v_admin FROM public.town_memberships m
    WHERE m.town_id = p_tenant_id AND m.user_id = v_actor AND m.role = 'admin'
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'SDP-R3217-AUTH: administracio del poble requerida';
  END IF;
  IF p_quantitat IS NULL OR p_quantitat < 1 OR p_quantitat > 9007199254740991
    OR EXISTS (SELECT 1 FROM pg_catalog.unnest(ARRAY[p_magatzem_id,p_article_id,p_cicle_id]) AS ids(valor)
      WHERE valor IS NULL OR pg_catalog.char_length(valor) NOT BETWEEN 1 AND 160
        OR pg_catalog.btrim(valor) = '' OR valor <> pg_catalog.normalize(valor, 'NFC') OR valor ~ '[[:cntrl:]]'
        -- Gauntlet v1.2.14 · Ni format invisible (Unicode Cf, també els astrals) ni espais Unicode als extrems: el contracte del client JS.
        OR valor ~ E'[\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890-\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\U000110BD\\U000110CD\\U00013430-\\U0001343F\\U0001BCA0-\\U0001BCA3\\U0001D173-\\U0001D17A\\U000E0001\\U000E0020-\\U000E007F]' OR valor ~ E'^[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]|[\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000 ]$')
  THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SDP-R3217-INPUT: ids canonics i unitats enteres segures requerits';
  END IF;
  INSERT INTO public.inventari_reserves_cicle (reserva_id,tenant_id,magatzem_id,article_id,cicle_id,quantitat,creada_per,creada_el)
    VALUES (pg_catalog.gen_random_uuid(),p_tenant_id,p_magatzem_id,p_article_id,p_cicle_id,p_quantitat,v_actor,pg_catalog.clock_timestamp())
    ON CONFLICT ON CONSTRAINT inventari_reserves_cicle_scope_key DO NOTHING
    RETURNING * INTO v_reserva;
  v_creada := FOUND;
  IF NOT v_creada THEN
    -- Una ordre separada veu el commit que ha desbloquejat l'INSERT anterior.
    SELECT r.* INTO STRICT v_reserva FROM public.inventari_reserves_cicle r
      WHERE r.tenant_id = p_tenant_id AND r.magatzem_id = p_magatzem_id
        AND r.article_id = p_article_id AND r.cicle_id = p_cicle_id;
    IF v_reserva.quantitat <> p_quantitat THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SDP-R3217-CONFLICT: mateixa clau amb quantitat divergent';
    END IF;
  END IF;
  RETURN pg_catalog.jsonb_build_object('esquema','sdp.inventari.reserva.v1',
    'reserva_id',v_reserva.reserva_id,'tenant_id',v_reserva.tenant_id,
    'magatzem_id',v_reserva.magatzem_id,'article_id',v_reserva.article_id,
    'cicle_id',v_reserva.cicle_id,'quantitat',v_reserva.quantitat,'creada',v_creada);
END
$sdp_reserva$;
REVOKE ALL ON FUNCTION public.reserva_reposicio_inventari(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserva_reposicio_inventari(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8) TO authenticated;
COMMENT ON FUNCTION public.reserva_reposicio_inventari(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8)
  IS 'R32.17: reserva immutable tenant/magatzem/article/cicle. creada=false mai autoritza una compra repetida. No executa la compra externa ni recicla claus.';
COMMIT;

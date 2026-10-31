-- Lot 3 · sdp-xat-v1 real (P-256, una identitat per persona).
-- Requerix 2610290400 i la cadena de Xat/adjunts anterior. No activa cap flag.
-- Signatures ECDSA i contingut dels sobres: els verifiquen els clients.
-- Només el Mestre aplica SQL en una branca de Supabase després de revisar-lo.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
BEGIN
  IF to_regprocedure('private.xat_b64(text,integer)') IS NULL
     OR to_regprocedure('private.xat_participant_vigent(uuid,uuid)') IS NULL
     OR to_regprocedure('private.xat_origen_admes()') IS NULL
     OR to_regclass('public.xat_adjunts') IS NULL
     OR to_regclass('public.xat_claus_usuari') IS NULL THEN
    RAISE EXCEPTION 'SDP-XAT-900: falta la cadena anterior del Xat.';
  END IF;
  -- public ha de ser de confiança per a SET search_path = public, pg_temp.
  IF has_schema_privilege('authenticated', 'public', 'CREATE')
     OR has_schema_privilege('anon', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'SDP-XAT-900: public permet CREATE a rols del client; revisar privilegis.';
  END IF;
END $$;

ALTER TABLE public.xat_missatges ADD COLUMN IF NOT EXISTS xifrat jsonb;
-- La FK resposta_a pot passar a NULL en una purga; l’AAD conserva l’id original.
ALTER TABLE public.xat_missatges ADD COLUMN IF NOT EXISTS resposta_a_xifrada uuid;
ALTER TABLE public.xat_fils ADD COLUMN IF NOT EXISTS epoca_actual integer NOT NULL DEFAULT 0;
ALTER TABLE public.xat_fils ADD COLUMN IF NOT EXISTS cap_epoca_hash text;
ALTER TABLE public.xat_fils ADD COLUMN IF NOT EXISTS e2ee_des_de_seq bigint;
ALTER TABLE public.xat_adjunts ADD COLUMN IF NOT EXISTS xifrat boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF (SELECT atttypid FROM pg_attribute WHERE attrelid='public.xat_fils'::regclass AND attname='cap_epoca_hash') <> 'text'::regtype
     OR (SELECT atttypid FROM pg_attribute WHERE attrelid='public.xat_missatges'::regclass AND attname='xifrat') <> 'jsonb'::regtype THEN
    RAISE EXCEPTION 'SDP-XAT-900: columnes incompatibles amb el contracte del Lot 2.';
  END IF;
END $$;

-- Límit de bytes abans de descodificar; ajuda privada sense EXECUTE de client.
CREATE OR REPLACE FUNCTION private.xat_lot3_b64(p text, p_bytes integer DEFAULT NULL)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
BEGIN
  IF p IS NULL OR length(p) > 32768 THEN
    RAISE EXCEPTION 'SDP-XAT-040: codificació invàlida.' USING errcode='22023';
  END IF;
  RETURN private.xat_b64(p, p_bytes);
END $$;

-- Es reutilitza la mateixa forma estricta del candidat del Lot 2, ara durable.
CREATE OR REPLACE FUNCTION private.xat_sobre_format_v1_valid(p_sobre jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE v text; b bytea; n integer;
BEGIN
  IF NOT coalesce(jsonb_typeof(p_sobre)='object',false) THEN RETURN false; END IF;
  IF NOT coalesce(octet_length(p_sobre::text)<=32768
    AND p_sobre ?& ARRAY['v','epoca','iv','ct','kid','tf']
    AND p_sobre - ARRAY['v','epoca','iv','ct','kid','tf']='{}'::jsonb
    AND p_sobre->'v'='1'::jsonb AND jsonb_typeof(p_sobre->'epoca')='number'
    AND p_sobre->>'epoca' ~ '^[1-9][0-9]{0,9}$'
    AND (p_sobre->>'epoca')::numeric BETWEEN 1 AND 2147483647,false) THEN RETURN false; END IF;
  FOREACH v IN ARRAY ARRAY['iv','kid','tf','ct'] LOOP
    IF jsonb_typeof(p_sobre->v) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
    b := private.xat_lot3_b64(p_sobre->>v); n := octet_length(b);
    IF (v='iv' AND n<>12) OR (v='kid' AND n<>16) OR (v='tf' AND n<>32)
       OR (v='ct' AND (n NOT BETWEEN 272 AND 16400 OR (n-16)%256<>0)) THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.xat_missatges'::regclass AND conname='xat_missatges_sobre_lot3') THEN
    ALTER TABLE public.xat_missatges ADD CONSTRAINT xat_missatges_sobre_lot3 CHECK (coalesce(
      (versio_xifrat=0 AND xifrat IS NULL) OR
      (versio_xifrat=1 AND text IS NULL AND tipus='text' AND
        ((esborrat_al IS NOT NULL AND xifrat IS NULL) OR (esborrat_al IS NULL AND private.xat_sobre_format_v1_valid(xifrat)))),false)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.xat_fils'::regclass AND conname='xat_fils_marques_lot3') THEN
    ALTER TABLE public.xat_fils ADD CONSTRAINT xat_fils_marques_lot3 CHECK (coalesce(
      (epoca_actual=0 AND cap_epoca_hash IS NULL AND e2ee_des_de_seq IS NULL) OR
      (epoca_actual BETWEEN 1 AND 2147483647 AND cap_epoca_hash IS NOT NULL
        AND octet_length(private.xat_lot3_b64(cap_epoca_hash,32))=32 AND e2ee_des_de_seq>0),false)) NOT VALID;
  END IF;
END $$;
ALTER TABLE public.xat_missatges VALIDATE CONSTRAINT xat_missatges_sobre_lot3;
ALTER TABLE public.xat_fils VALIDATE CONSTRAINT xat_fils_marques_lot3;
-- Si el candidat del Lot 2 es va fer durable, el substituïx la guarda ja
-- validada de dalt, que també contempla les làpides sense conservar el xifrat.
ALTER TABLE public.xat_missatges DROP CONSTRAINT IF EXISTS xat_missatges_sobre_format_lot2;

CREATE TABLE IF NOT EXISTS public.xat_epoques (
  fil_id uuid NOT NULL REFERENCES public.xat_fils(id) ON DELETE CASCADE,
  epoca integer NOT NULL CHECK (epoca>0), declaracio bytea NOT NULL, firma bytea NOT NULL,
  hash bytea NOT NULL, paquet_hash bytea NOT NULL, prev_hash bytea, autor_id uuid NOT NULL,
  autor_kid bytea NOT NULL, motiu smallint NOT NULL CHECK (motiu BETWEEN 1 AND 9),
  creat_al timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(fil_id,epoca),
  CHECK(octet_length(declaracio) BETWEEN 360 AND 16935 AND octet_length(firma)=64
    AND octet_length(hash)=32 AND octet_length(paquet_hash)=32 AND octet_length(autor_kid)=16
    AND (epoca=1)=(prev_hash IS NULL) AND (prev_hash IS NULL OR octet_length(prev_hash)=32))
);
CREATE UNIQUE INDEX IF NOT EXISTS xat_epoques_hash ON public.xat_epoques(fil_id,hash);
CREATE TABLE IF NOT EXISTS public.xat_epoques_membres (
  fil_id uuid NOT NULL, epoca integer NOT NULL, usuari_id uuid NOT NULL,
  kid bytea NOT NULL CHECK(octet_length(kid)=16), rol smallint NOT NULL CHECK(rol BETWEEN 0 AND 2),
  PRIMARY KEY(fil_id,epoca,usuari_id),
  FOREIGN KEY(fil_id,epoca) REFERENCES public.xat_epoques(fil_id,epoca) ON DELETE CASCADE
);
-- Sense FK a auth.users en el roster: una baixa ha de fer invàlida l’època,
-- no esborrar-ne la prova i donar-la per bona.
CREATE TABLE IF NOT EXISTS public.xat_claus_fil (
  fil_id uuid NOT NULL, epoca integer NOT NULL, destinatari_id uuid NOT NULL,
  destinatari_kid bytea NOT NULL CHECK(octet_length(destinatari_kid)=16),
  emissor_id uuid NOT NULL, enc bytea NOT NULL CHECK(octet_length(enc)=65 AND get_byte(enc,0)=4),
  ct bytea NOT NULL CHECK(octet_length(ct)=48), creat_al timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(fil_id,epoca,destinatari_id),
  FOREIGN KEY(fil_id,epoca,destinatari_id) REFERENCES public.xat_epoques_membres(fil_id,epoca,usuari_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.xat_reembolcalls (
  fil_id uuid NOT NULL, epoca integer NOT NULL, destinatari_id uuid NOT NULL,
  destinatari_kid bytea NOT NULL CHECK(octet_length(destinatari_kid)=16), emissor_id uuid NOT NULL,
  enc bytea NOT NULL CHECK(octet_length(enc)=65 AND get_byte(enc,0)=4), ct bytea NOT NULL CHECK(octet_length(ct)=48),
  creat_al timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(fil_id,epoca,destinatari_id,destinatari_kid),
  FOREIGN KEY(fil_id,epoca,destinatari_id) REFERENCES public.xat_epoques_membres(fil_id,epoca,usuari_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS xat_sobres_destinatari ON public.xat_claus_fil(destinatari_id,fil_id,epoca);
CREATE INDEX IF NOT EXISTS xat_reembolcalls_destinatari ON public.xat_reembolcalls(destinatari_id,fil_id,epoca);

CREATE TABLE IF NOT EXISTS private.xat_cohort_e2ee (
  usuari_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  afegit_al timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS private.xat_configuracio_e2ee (
  id boolean PRIMARY KEY DEFAULT true CHECK(id), general boolean NOT NULL DEFAULT false,
  pausa boolean NOT NULL DEFAULT false
);
INSERT INTO private.xat_configuracio_e2ee(id) VALUES(true) ON CONFLICT DO NOTHING;

ALTER TABLE public.xat_epoques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xat_epoques_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xat_claus_fil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xat_reembolcalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.xat_cohort_e2ee ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.xat_configuracio_e2ee ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xat_epoques, public.xat_epoques_membres, public.xat_claus_fil, public.xat_reembolcalls FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.xat_epoques, public.xat_epoques_membres, public.xat_claus_fil, public.xat_reembolcalls TO authenticated;
GRANT SELECT,DELETE ON public.xat_epoques, public.xat_epoques_membres, public.xat_claus_fil, public.xat_reembolcalls TO service_role;
REVOKE ALL ON private.xat_cohort_e2ee,private.xat_configuracio_e2ee FROM PUBLIC,anon,authenticated,service_role;

-- No es combinen silenciosament polítiques d’una altra implementació.
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_policies p WHERE
    (p.schemaname='public' AND p.tablename IN ('xat_epoques','xat_epoques_membres','xat_claus_fil','xat_reembolcalls')
      AND (p.tablename,p.policyname) NOT IN (('xat_epoques','xat_epoques_lectura_lot3'),('xat_epoques_membres','xat_epoques_membres_lectura_lot3'),('xat_claus_fil','xat_sobres_propis_lot3'),('xat_reembolcalls','xat_reembolcalls_propis_lot3')))
    OR (p.schemaname='private' AND p.tablename IN ('xat_cohort_e2ee','xat_configuracio_e2ee'))) THEN
    RAISE EXCEPTION 'SDP-XAT-900: polítiques desconegudes a les taules noves; cal reconciliar-les.';
  END IF;
END $$;

DROP POLICY IF EXISTS xat_epoques_lectura_lot3 ON public.xat_epoques;
CREATE POLICY xat_epoques_lectura_lot3 ON public.xat_epoques FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND private.es_participant(fil_id));
DROP POLICY IF EXISTS xat_epoques_membres_lectura_lot3 ON public.xat_epoques_membres;
CREATE POLICY xat_epoques_membres_lectura_lot3 ON public.xat_epoques_membres FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND private.es_participant(fil_id));
DROP POLICY IF EXISTS xat_sobres_propis_lot3 ON public.xat_claus_fil;
CREATE POLICY xat_sobres_propis_lot3 ON public.xat_claus_fil FOR SELECT TO authenticated
  USING (destinatari_id=(SELECT auth.uid()) AND private.es_participant(fil_id));
DROP POLICY IF EXISTS xat_reembolcalls_propis_lot3 ON public.xat_reembolcalls;
CREATE POLICY xat_reembolcalls_propis_lot3 ON public.xat_reembolcalls FOR SELECT TO authenticated
  USING (destinatari_id=(SELECT auth.uid()) AND private.es_participant(fil_id));

CREATE OR REPLACE FUNCTION private.xat_e2ee_exigix(p_fil uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid := (SELECT auth.uid());
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'SDP-XAT-001: cal iniciar sessió.' USING errcode='42501'; END IF;
  IF NOT private.xat_origen_admes() THEN RAISE EXCEPTION 'SDP-XAT-045: origen no admés.' USING errcode='42501'; END IF;
  IF p_fil IS NULL OR NOT private.es_participant(p_fil) THEN RAISE EXCEPTION 'SDP-XAT-006: no eres membre actiu.' USING errcode='42501'; END IF;
  RETURN u;
END $$;

-- Abast real del client: les entitats esperen equip signat (fase F3).
CREATE OR REPLACE FUNCTION private.xat_e2ee_abast(p_fil uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce((SELECT f.subjecte_tipus IS NULL AND f.org_id IS NULL
    AND (f.tipus='grup' OR (f.tipus='directe'
      AND (SELECT count(*) FROM public.xat_participants p WHERE p.fil_id=f.id)=2))
    AND NOT EXISTS(SELECT 1 FROM public.xat_participants p WHERE p.fil_id=f.id
      AND p.usuari_id='11111111-1a1a-0000-0000-000000000000'::uuid)
    FROM public.xat_fils f WHERE f.id=p_fil),false)
$$;

-- Qui crida ja té el fil i el roster bloquejats. No es verifica ECDSA en SQL.
CREATE OR REPLACE FUNCTION private.xat_obri_epoca_intern(p_fil uuid,p_jo uuid,p_epoca jsonb)
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
#variable_conflict use_variable
DECLARE
  f public.xat_fils%rowtype; k public.xat_claus_usuari%rowtype; existent public.xat_epoques%rowtype;
  d bytea; firma bytea; h bytea; ph bytea; e bigint; n integer; tipus integer; motiu integer;
  i integer; o integer; u uuid; anterior uuid; kid bytea; rol integer; s jsonb; enc bytea; ct bytea;
  antic_rol integer; es_admin boolean;
BEGIN
  SELECT * INTO f FROM public.xat_fils WHERE id=p_fil;
  IF NOT private.xat_e2ee_abast(p_fil) THEN RAISE EXCEPTION 'SDP-XAT-032: fil fora d’abast.' USING errcode='22023'; END IF;
  IF NOT coalesce(jsonb_typeof(p_epoca)='object',false) OR octet_length(p_epoca::text)>100000
     OR NOT p_epoca ?& ARRAY['epoca','declaracio','firma','sobres']
     OR p_epoca-ARRAY['epoca','declaracio','firma','sobres']<>'{}'::jsonb
     OR jsonb_typeof(p_epoca->'sobres') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'SDP-XAT-034: paquet d’època invàlid.' USING errcode='22023';
  END IF;
  d:=private.xat_lot3_b64(p_epoca->>'declaracio'); firma:=private.xat_lot3_b64(p_epoca->>'firma',64);
  h:=sha256(d); ph:=sha256(convert_to(p_epoca::text,'UTF8')); -- només idempotència, no firma del protocol
  SELECT * INTO existent FROM public.xat_epoques WHERE fil_id=p_fil AND hash=h;
  IF FOUND THEN
    IF existent.autor_id<>p_jo OR existent.paquet_hash<>ph THEN RAISE EXCEPTION 'SDP-XAT-008: reintent diferent.' USING errcode='42501'; END IF;
    RETURN existent.epoca;
  END IF;
  IF octet_length(d) NOT BETWEEN 360 AND 16935 THEN RAISE EXCEPTION 'SDP-XAT-034: declaració invàlida.' USING errcode='22023'; END IF;
  e:=private.xat_u32(d,21); n:=get_byte(d,293)*256+get_byte(d,294); tipus:=get_byte(d,25); motiu:=get_byte(d,220);
  IF n NOT BETWEEN 1 AND 256 OR e NOT BETWEEN 1 AND 2147483647 OR octet_length(d)<>295+65*n
     OR substring(d FROM 1 FOR 5)<>'\x5344504501'::bytea OR substring(d FROM 6 FOR 16)<>private.xat_uuid16(p_fil)
     OR substring(d FROM 59 FOR 16)<>private.xat_uuid16(p_jo)
     OR tipus<>(CASE WHEN f.tipus='directe' THEN 1 ELSE 3 END)
     OR motiu NOT BETWEEN 1 AND 9 OR (e=1)<>(motiu=1)
     OR substring(d FROM 262 FOR 32)<>decode(repeat('00',32),'hex')
     OR get_byte(d,221)<>0 OR get_byte(d,222)>31
     OR jsonb_typeof(p_epoca->'epoca') IS DISTINCT FROM 'number'
     OR p_epoca->'epoca'<>to_jsonb(e) THEN
    RAISE EXCEPTION 'SDP-XAT-034: declaració invàlida.' USING errcode='22023';
  END IF;
  IF e<>f.epoca_actual::bigint+1 OR substring(d FROM 27 FOR 32)<>
     coalesce(CASE WHEN f.cap_epoca_hash IS NOT NULL THEN private.xat_lot3_b64(f.cap_epoca_hash,32) END,decode(repeat('00',32),'hex')) THEN
    RAISE EXCEPTION 'SDP-XAT-030: el cap de l’època ha canviat.' USING errcode='40001';
  END IF;
  IF e=1 AND NOT private.xat_e2ee_permes(p_fil) THEN RAISE EXCEPTION 'SDP-XAT-039: activació no autoritzada.' USING errcode='42501'; END IF;
  SELECT * INTO k FROM public.xat_claus_usuari WHERE usuari_id=p_jo AND retirada_al IS NULL;
  IF NOT FOUND OR substring(d FROM 75 FOR 16)<>k.kid OR substring(d FROM 91 FOR 65)<>k.sig_pub
     OR substring(d FROM 156 FOR 65)<>k.dh_pub THEN RAISE EXCEPTION 'SDP-XAT-033: clau activa incorrecta.' USING errcode='42501'; END IF;
  SELECT m.rol INTO antic_rol FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=f.epoca_actual AND m.usuari_id=p_jo;
  IF e>1 AND NOT FOUND THEN RAISE EXCEPTION 'SDP-XAT-035: l’autor no pertany a l’època anterior.' USING errcode='42501'; END IF;
  SELECT p.rol IN ('propietari','admin') INTO es_admin FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.usuari_id=p_jo;
  IF tipus=3 AND e=1 AND NOT es_admin THEN RAISE EXCEPTION 'SDP-XAT-035: la gènesi de grup requerix administració.' USING errcode='42501'; END IF;
  IF (SELECT count(*) FROM public.xat_epoques x WHERE x.fil_id=p_fil AND x.creat_al>now()-interval '24 hours')>=200
     OR (motiu=7 AND (SELECT count(*) FROM public.xat_epoques x WHERE x.fil_id=p_fil AND x.autor_id=p_jo AND x.motiu=7 AND x.creat_al>now()-interval '24 hours')>=3) THEN
    RAISE EXCEPTION 'SDP-XAT-042: massa rotacions.' USING errcode='42900';
  END IF;
  IF jsonb_array_length(p_epoca->'sobres')<>n OR
     (SELECT count(*) FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.visible_fins_seq IS NULL
        AND private.xat_participant_vigent(p_fil,p.usuari_id))<>n THEN
    RAISE EXCEPTION 'SDP-XAT-035: roster o sobres incomplets.' USING errcode='22023';
  END IF;
  IF tipus=1 AND n<>2 THEN RAISE EXCEPTION 'SDP-XAT-035: el directe requerix dos membres.' USING errcode='22023'; END IF;
  INSERT INTO public.xat_epoques(fil_id,epoca,declaracio,firma,hash,paquet_hash,prev_hash,autor_id,autor_kid,motiu)
    VALUES(p_fil,e,d,firma,h,ph,CASE WHEN f.cap_epoca_hash IS NOT NULL THEN private.xat_lot3_b64(f.cap_epoca_hash,32) END,p_jo,k.kid,motiu);
  FOR i IN 0..n-1 LOOP
    o:=295+65*i; u:=encode(substring(d FROM o+1 FOR 16),'hex')::uuid;
    kid:=substring(d FROM o+17 FOR 16); rol:=get_byte(d,o+32);
    IF anterior IS NOT NULL AND u<=anterior THEN RAISE EXCEPTION 'SDP-XAT-034: roster no canònic.' USING errcode='22023'; END IF;
    anterior:=u;
    IF rol NOT BETWEEN 0 AND 2 OR u='11111111-1a1a-0000-0000-000000000000'::uuid
       OR NOT private.xat_participant_vigent(p_fil,u)
       OR NOT EXISTS(SELECT 1 FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.usuari_id=u AND p.visible_fins_seq IS NULL AND p.com_org_id IS NULL
         AND rol=CASE WHEN tipus=1 THEN 0 WHEN p.rol='propietari' THEN 2 WHEN p.rol='admin' THEN 1 ELSE 0 END)
       OR NOT EXISTS(SELECT 1 FROM public.xat_claus_usuari x WHERE x.usuari_id=u AND x.kid=kid AND x.retirada_al IS NULL) THEN
      RAISE EXCEPTION 'SDP-XAT-035: membre, rol o clau incorrectes.' USING errcode='42501';
    END IF;
    -- Un directe conserva els dos membres; en grup només l’administració
    -- de l’època anterior pot afegir persones o canviar rols.
    IF e>1 AND NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=f.epoca_actual AND m.usuari_id=u AND (tipus=1 OR m.rol=rol))
       AND (tipus=1 OR coalesce(antic_rol,0)=0) THEN
      RAISE EXCEPTION 'SDP-XAT-035: transició de membres no autoritzada.' USING errcode='42501';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(p_epoca->'sobres') a(v) WHERE a.v->>'receptor'=u::text)<>1 THEN
      RAISE EXCEPTION 'SDP-XAT-035: falta o es repetix un sobre.' USING errcode='22023';
    END IF;
    SELECT a.v INTO s FROM jsonb_array_elements(p_epoca->'sobres') a(v) WHERE a.v->>'receptor'=u::text;
    IF NOT s ?& ARRAY['receptor','kidReceptor','enc','ct'] OR s-ARRAY['receptor','kidReceptor','enc','ct']<>'{}'::jsonb
       OR private.xat_lot3_b64(s->>'kidReceptor',16)<>kid THEN RAISE EXCEPTION 'SDP-XAT-035: sobre incorrecte.' USING errcode='22023'; END IF;
    enc:=private.xat_lot3_b64(s->>'enc',65); ct:=private.xat_lot3_b64(s->>'ct',48);
    IF get_byte(enc,0)<>4 OR substring(d FROM o+34 FOR 32)<>sha256(enc||ct) THEN
      RAISE EXCEPTION 'SDP-XAT-035: sobre no vinculat a la declaració.' USING errcode='22023';
    END IF;
    INSERT INTO public.xat_epoques_membres VALUES(p_fil,e,u,kid,rol);
    INSERT INTO public.xat_claus_fil(fil_id,epoca,destinatari_id,destinatari_kid,emissor_id,enc,ct) VALUES(p_fil,e,u,kid,p_jo,enc,ct);
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=e AND m.usuari_id=p_jo AND m.kid=k.kid)
     OR (e>1 AND tipus=1 AND EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=f.epoca_actual
       AND NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres nou WHERE nou.fil_id=p_fil AND nou.epoca=e AND nou.usuari_id=m.usuari_id))) THEN
    RAISE EXCEPTION 'SDP-XAT-035: roster incorrecte.' USING errcode='42501';
  END IF;
  UPDATE public.xat_fils SET epoca_actual=e,cap_epoca_hash=private.xat_b64_enc(h),e2ee_des_de_seq=coalesce(e2ee_des_de_seq,ultim_seq+1) WHERE id=p_fil;
  RETURN e;
END $$;

CREATE OR REPLACE FUNCTION public.xat_obri_epoca(p_fil_id uuid,p_epoca_nova jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid:=private.xat_e2ee_exigix(p_fil_id); e integer;
BEGIN
  PERFORM private.xat_e2ee_bloqueja(p_fil_id);
  e:=private.xat_obri_epoca_intern(p_fil_id,u,p_epoca_nova);
  RETURN jsonb_build_object('epoca',e,'hash',(SELECT private.xat_b64_enc(x.hash) FROM public.xat_epoques x WHERE x.fil_id=p_fil_id AND x.epoca=e));
END $$;

CREATE OR REPLACE FUNCTION public.xat_estat_xifrat(p_fils uuid[])
RETURNS TABLE(fil_id uuid,epoca integer,cap text,e2ee_des_de_seq bigint,abast boolean,declaracio text,sobre jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE f uuid;
BEGIN
  IF p_fils IS NULL OR cardinality(p_fils) NOT BETWEEN 1 AND 256 THEN RAISE EXCEPTION 'SDP-XAT-009: llista de fils invàlida.' USING errcode='22023'; END IF;
  FOREACH f IN ARRAY p_fils LOOP PERFORM private.xat_e2ee_exigix(f); END LOOP;
  RETURN QUERY SELECT x.id,x.epoca_actual,x.cap_epoca_hash,x.e2ee_des_de_seq,private.xat_e2ee_abast(x.id),private.xat_b64_enc(e.declaracio),
    CASE WHEN s.destinatari_id IS NOT NULL THEN jsonb_build_object('epoca',s.epoca,'receptor',s.destinatari_id,'kidReceptor',private.xat_b64_enc(s.destinatari_kid),'enc',private.xat_b64_enc(s.enc),'ct',private.xat_b64_enc(s.ct)) END
    FROM public.xat_fils x LEFT JOIN public.xat_epoques e ON e.fil_id=x.id AND e.epoca=x.epoca_actual
    LEFT JOIN public.xat_claus_fil s ON s.fil_id=x.id AND s.epoca=x.epoca_actual AND s.destinatari_id=(SELECT auth.uid())
    WHERE x.id=ANY(p_fils);
END $$;

CREATE OR REPLACE FUNCTION public.xat_epoques_del_fil(p_fil_id uuid,p_des_de integer)
RETURNS TABLE(epoca integer,declaracio text,firma text,autor_id uuid,creat_al timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM private.xat_e2ee_exigix(p_fil_id);
  IF p_des_de IS NULL OR p_des_de<0 THEN RAISE EXCEPTION 'SDP-XAT-009: cursor invàlid.' USING errcode='22023'; END IF;
  RETURN QUERY SELECT e.epoca,private.xat_b64_enc(e.declaracio),private.xat_b64_enc(e.firma),e.autor_id,e.creat_al FROM public.xat_epoques e WHERE e.fil_id=p_fil_id AND e.epoca>p_des_de ORDER BY e.epoca;
END $$;

CREATE OR REPLACE FUNCTION public.xat_meus_sobres(p_fil_id uuid,p_epoques integer[])
RETURNS TABLE(epoca integer,receptor uuid,kid_receptor text,enc text,ct text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid:=private.xat_e2ee_exigix(p_fil_id);
BEGIN
  IF p_epoques IS NULL OR cardinality(p_epoques)>4096 OR EXISTS(SELECT 1 FROM unnest(p_epoques) e WHERE e IS NULL OR e<1) THEN
    RAISE EXCEPTION 'SDP-XAT-009: llista d’èpoques invàlida.' USING errcode='22023';
  END IF;
  RETURN QUERY SELECT s.epoca,s.destinatari_id,private.xat_b64_enc(s.destinatari_kid),private.xat_b64_enc(s.enc),private.xat_b64_enc(s.ct)
    FROM public.xat_claus_fil s WHERE s.fil_id=p_fil_id AND s.epoca=ANY(p_epoques) AND s.destinatari_id=u ORDER BY s.epoca;
  -- Els reembolcalls es conserven separats: no substituïxen l’envHash firmat
  -- original, que el client actual comprova en aplicaEpoca.
END $$;

CREATE OR REPLACE FUNCTION public.xat_envia_xifrat(p_id uuid,p_fil_id uuid,p_resposta_a uuid,p_xifrat jsonb,p_epoca_nova jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid:=private.xat_e2ee_exigix(p_fil_id); m public.xat_missatges%rowtype; e integer;
BEGIN
  IF p_id IS NULL OR NOT private.xat_sobre_format_v1_valid(p_xifrat) THEN RAISE EXCEPTION 'SDP-XAT-009: missatge invàlid.' USING errcode='22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('xat:missatge:'||p_id::text,0));
  PERFORM pg_advisory_xact_lock(hashtext(u::text)); -- mateix ordre que el rate limit vigent
  PERFORM private.xat_e2ee_bloqueja(p_fil_id);
  IF NOT private.xat_e2ee_abast(p_fil_id) THEN RAISE EXCEPTION 'SDP-XAT-032: fil fora d’abast.' USING errcode='22023'; END IF;
  SELECT * INTO m FROM public.xat_missatges WHERE id=p_id;
  IF FOUND THEN
    IF m.fil_id<>p_fil_id OR m.usuari_id<>u OR m.versio_xifrat<>1 OR m.xifrat IS DISTINCT FROM p_xifrat OR m.resposta_a_xifrada IS DISTINCT FROM p_resposta_a THEN
      RAISE EXCEPTION 'SDP-XAT-008: identificador d’un altre enviament.' USING errcode='42501';
    END IF;
    IF p_epoca_nova IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.xat_epoques x WHERE x.fil_id=p_fil_id
      AND x.epoca=(m.xifrat->>'epoca')::integer AND x.paquet_hash=sha256(convert_to(p_epoca_nova::text,'UTF8'))) THEN
      RAISE EXCEPTION 'SDP-XAT-008: gènesi diferent en el reintent.' USING errcode='42501';
    END IF;
    RETURN private.xat_e2ee_json_missatge(p_id);
  END IF;
  IF p_epoca_nova IS NOT NULL THEN PERFORM private.xat_obri_epoca_intern(p_fil_id,u,p_epoca_nova); END IF;
  SELECT epoca_actual INTO e FROM public.xat_fils WHERE id=p_fil_id;
  IF e<1 OR (p_xifrat->>'epoca')::integer<>e THEN RAISE EXCEPTION 'SDP-XAT-030: època canviada.' USING errcode='40001'; END IF;
  IF NOT private.xat_epoca_vigent_valida(p_fil_id,e) THEN RAISE EXCEPTION 'SDP-XAT-036: cal rotar l’època.' USING errcode='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres em WHERE em.fil_id=p_fil_id AND em.epoca=e AND em.usuari_id=u AND em.kid=private.xat_lot3_b64(p_xifrat->>'kid',16)) THEN
    RAISE EXCEPTION 'SDP-XAT-033: kid incorrecte.' USING errcode='42501';
  END IF;
  IF p_resposta_a IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.xat_missatges r WHERE r.id=p_resposta_a AND r.fil_id=p_fil_id AND private.seq_visible(r.fil_id,r.seq) AND (r.caduca_al IS NULL OR r.caduca_al>now())) THEN
    RAISE EXCEPTION 'SDP-XAT-009: cita no visible.' USING errcode='22023';
  END IF;
  INSERT INTO public.xat_missatges(id,fil_id,usuari_id,text,tipus,resposta_a,resposta_a_xifrada,metadades,es_ia,com_org_id,versio_xifrat,xifrat)
    VALUES(p_id,p_fil_id,u,NULL,'text',p_resposta_a,p_resposta_a,'{}'::jsonb,false,NULL,1,p_xifrat) RETURNING * INTO m;
  UPDATE public.xat_participants p SET llegit_fins_seq=greatest(p.llegit_fins_seq,m.seq),rebut_fins_seq=greatest(p.rebut_fins_seq,m.seq) WHERE p.fil_id=p_fil_id AND p.usuari_id=u;
  RETURN private.xat_e2ee_json_missatge(p_id);
END $$;

CREATE OR REPLACE FUNCTION public.xat_reembolcalla(p_fil_id uuid,p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
#variable_conflict use_variable
DECLARE u uuid:=private.xat_e2ee_exigix(p_fil_id); i jsonb; e integer; receptor uuid; kid bytea; enc bytea; ct bytea; antic public.xat_reembolcalls%rowtype; total integer:=0;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR octet_length(p_items::text)>100000 OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 256 THEN
    RAISE EXCEPTION 'SDP-XAT-009: reembolcalls invàlids.' USING errcode='22023';
  END IF;
  PERFORM private.xat_e2ee_bloqueja(p_fil_id);
  FOR i IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(i) IS DISTINCT FROM 'object' OR NOT i ?& ARRAY['epoca','receptor','kidReceptor','enc','ct'] OR i-ARRAY['epoca','receptor','kidReceptor','enc','ct']<>'{}'::jsonb
       OR jsonb_typeof(i->'epoca') IS DISTINCT FROM 'number' OR i->>'epoca' !~ '^[1-9][0-9]{0,9}$' OR (i->>'epoca')::numeric>2147483647 THEN
      RAISE EXCEPTION 'SDP-XAT-009: reembolcall invàlid.' USING errcode='22023';
    END IF;
    e:=(i->>'epoca')::integer;
    BEGIN receptor:=(i->>'receptor')::uuid; EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'SDP-XAT-009: receptor invàlid.' USING errcode='22023'; END;
    kid:=private.xat_lot3_b64(i->>'kidReceptor',16); enc:=private.xat_lot3_b64(i->>'enc',65); ct:=private.xat_lot3_b64(i->>'ct',48);
    -- Contracte conservador: només recuperar el sobre propi d’una època
    -- de la qual ja s’era membre; mai concedir historial a membres nous.
    IF receptor IS DISTINCT FROM u OR get_byte(enc,0)<>4
       OR NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil_id AND m.epoca=e AND m.usuari_id=u)
       OR NOT EXISTS(SELECT 1 FROM public.xat_claus_usuari k WHERE k.usuari_id=u AND k.kid=kid AND k.retirada_al IS NULL) THEN
      RAISE EXCEPTION 'SDP-XAT-035: concessió d’historial no autoritzada.' USING errcode='42501';
    END IF;
    SELECT * INTO antic FROM public.xat_reembolcalls r WHERE r.fil_id=p_fil_id AND r.epoca=e AND r.destinatari_id=u AND r.destinatari_kid=kid;
    IF FOUND THEN
      IF antic.enc<>enc OR antic.ct<>ct THEN RAISE EXCEPTION 'SDP-XAT-008: reembolcall ja fixat.' USING errcode='42501'; END IF;
    ELSE
      INSERT INTO public.xat_reembolcalls(fil_id,epoca,destinatari_id,destinatari_kid,emissor_id,enc,ct) VALUES(p_fil_id,e,u,kid,u,enc,ct);
    END IF;
    total:=total+1;
  END LOOP;
  RETURN jsonb_build_object('acceptats',total);
END $$;

CREATE OR REPLACE FUNCTION public.xat_demana_xifrat(p_fil_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid:=private.xat_e2ee_exigix(p_fil_id);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(u::text)); PERFORM private.xat_e2ee_bloqueja(p_fil_id);
  IF NOT private.xat_e2ee_abast(p_fil_id) THEN RAISE EXCEPTION 'SDP-XAT-032: fil fora d’abast.' USING errcode='22023'; END IF;
  IF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)>0 OR EXISTS(SELECT 1 FROM public.xat_missatges m WHERE m.fil_id=p_fil_id AND m.usuari_id=u AND m.metadades ? 'invitacioXifrat' AND m.creat_al>now()-interval '24 hours') THEN RETURN false; END IF;
  INSERT INTO public.xat_missatges(id,fil_id,usuari_id,text,tipus,metadades,es_ia)
    VALUES(gen_random_uuid(),p_fil_id,u,'Actualitza l’app de Sóc de Poble per preparar els xats privats xifrats.','sistema',jsonb_build_object('invitacioXifrat',true),false);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.xat_e2ee_permes(p_fil uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT NOT c.pausa AND (c.general OR NOT EXISTS(
    SELECT 1 FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.visible_fins_seq IS NULL
      AND private.xat_participant_vigent(p_fil,p.usuari_id)
      AND NOT EXISTS(SELECT 1 FROM private.xat_cohort_e2ee co WHERE co.usuari_id=p.usuari_id)))
  FROM private.xat_configuracio_e2ee c WHERE c.id
$$;

-- La baixa/rotació d’una sola clau deixa de validar l’època sencera.
CREATE OR REPLACE FUNCTION private.xat_epoca_vigent_valida(p_fil uuid,p_epoca integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS(SELECT 1 FROM public.xat_epoques e WHERE e.fil_id=p_fil AND e.epoca=p_epoca)
    AND NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=p_epoca
      AND (NOT private.xat_participant_vigent(p_fil,m.usuari_id)
        OR NOT EXISTS(SELECT 1 FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.usuari_id=m.usuari_id AND p.visible_fins_seq IS NULL)
        OR NOT EXISTS(SELECT 1 FROM public.xat_claus_usuari k WHERE k.usuari_id=m.usuari_id AND k.kid=m.kid AND k.retirada_al IS NULL)))
    AND NOT EXISTS(SELECT 1 FROM public.xat_participants p WHERE p.fil_id=p_fil AND p.visible_fins_seq IS NULL
      AND private.xat_participant_vigent(p_fil,p.usuari_id)
      AND NOT EXISTS(SELECT 1 FROM public.xat_epoques_membres m WHERE m.fil_id=p_fil AND m.epoca=p_epoca AND m.usuari_id=p.usuari_id))
$$;

CREATE OR REPLACE FUNCTION private.xat_e2ee_bloqueja(p_fil uuid)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('xat:claus:'||p_fil::text,0));
  PERFORM 1 FROM public.xat_fils f WHERE f.id=p_fil FOR UPDATE;
  PERFORM 1 FROM public.xat_participants p WHERE p.fil_id=p_fil ORDER BY p.usuari_id FOR SHARE;
  PERFORM 1 FROM public.town_memberships t JOIN public.xat_fils f ON f.tenant_id=t.town_id
    JOIN public.xat_participants p ON p.fil_id=f.id AND p.usuari_id=t.user_id WHERE f.id=p_fil ORDER BY t.user_id FOR SHARE OF t;
  PERFORM 1 FROM public.xat_claus_usuari k JOIN public.xat_participants p ON p.usuari_id=k.usuari_id
    WHERE p.fil_id=p_fil AND k.retirada_al IS NULL ORDER BY k.usuari_id FOR SHARE OF k;
  PERFORM private.xat_e2ee_exigix(p_fil);
END $$;

CREATE OR REPLACE FUNCTION private.xat_e2ee_json_missatge(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('id',m.id,'fil_id',m.fil_id,'seq',m.seq,'usuari_id',m.usuari_id,
    'autor_nom',coalesce(p.full_name,'Veí'),'cos',m.text,'tipus',m.tipus,'resposta_a',CASE WHEN m.versio_xifrat=1 THEN m.resposta_a_xifrada ELSE m.resposta_a END,
    'editat_al',m.editat_al,'esborrat_al',m.esborrat_al,'metadades',m.metadades,'es_ia',m.es_ia,
    'com_org_id',m.com_org_id,'creat_al',m.creat_al,'xifrat',m.xifrat)
  FROM public.xat_missatges m LEFT JOIN public.profiles p ON p.id=m.usuari_id WHERE m.id=p_id
$$;

-- INICI ACABAMENT GENERAT · els cossos de compatibilitat es conserven de les fonts congelades.
-- Canvi MIME coordinat: es substituïxen només les dues constraints del baseline.
ALTER TABLE public.xat_adjunts DROP CONSTRAINT IF EXISTS xat_adjunts_mime_check;
ALTER TABLE public.xat_adjunts DROP CONSTRAINT IF EXISTS xat_adjunts_check;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.xat_adjunts'::regclass AND conname='xat_adjunts_format_lot3') THEN
    ALTER TABLE public.xat_adjunts ADD CONSTRAINT xat_adjunts_format_lot3 CHECK(coalesce(
      (xifrat AND mime='application/octet-stream' AND durada_ms IS NULL) OR
      (NOT xifrat AND mime IN ('image/webp','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')
        AND ((mime LIKE 'image/%' AND durada_ms IS NULL) OR (mime LIKE 'video/%' AND durada_ms BETWEEN 1 AND 10000)
          OR (mime LIKE 'audio/%' AND durada_ms>0))),false));
  END IF;
END $$;
UPDATE storage.buckets SET public=false,file_size_limit=20000000,
  allowed_mime_types=ARRAY['image/webp','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg','application/octet-stream']
  WHERE id='xat_adjunts';

CREATE OR REPLACE FUNCTION private.xat_maxim_adjunt(p_mime text) returns bigint
language sql immutable SET search_path = public, pg_temp as $$
  select (case
    when p_mime in ('image/webp', 'image/jpeg') then 2000000
    when p_mime in ('audio/mp4', 'audio/webm', 'audio/ogg') then 3000000
    when p_mime = 'application/octet-stream' then 20000000
    when p_mime in ('video/mp4', 'video/webm', 'video/quicktime') then 20000000
  end)::bigint;
$$;

CREATE OR REPLACE FUNCTION public.xat_reserva_adjunt(p_id uuid, p_fil_id uuid, p_bytes bigint, p_mime text, p_durada_ms integer default null)
returns jsonb language plpgsql volatile security definer SET search_path = public, pg_temp as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; v_total bigint; v_caduc uuid;
  v_pendents integer; v_recents integer; v_pujat boolean;
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  if not private.es_participant(p_fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil.' using errcode = '42501'; end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'comunitat') then
    raise exception 'SDP-XAT-011: esta comunitat no admet missatges directes.' using errcode = '42501';
  end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'canal')
    and not private.es_admin_del_fil(p_fil_id) then
    raise exception 'SDP-XAT-011: només els administradors poden escriure.' using errcode = '42501';
  end if;

  IF p_mime='application/octet-stream' THEN
    PERFORM private.xat_e2ee_exigix(p_fil_id);
    IF NOT private.xat_e2ee_abast(p_fil_id) OR p_durada_ms IS NOT NULL THEN RAISE EXCEPTION 'SDP-XAT-032: adjunt fora d’abast.' USING errcode='22023'; END IF;
    IF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)=0 AND NOT private.xat_e2ee_permes(p_fil_id) THEN
      RAISE EXCEPTION 'SDP-XAT-039: activació no autoritzada.' USING errcode='42501';
    END IF;
  ELSIF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)>0 THEN
    RAISE EXCEPTION 'SDP-XAT-031: el fil requerix adjunts xifrats.' USING errcode='42501';
  END IF;
  -- F12 · Format i mida del tipus abans de cap pany.
  if p_id is null or p_bytes is null or p_bytes < 64 or private.xat_maxim_adjunt(p_mime) is null then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if p_bytes > private.xat_maxim_adjunt(p_mime) then
    raise exception 'SDP-XAT-020: el fitxer passa del sostre del seu tipus.' using errcode = '23514';
  end if;
  -- Un sol lock per persona, també si puja a dos fils o des de dos dispositius.
  perform pg_advisory_xact_lock(hashtextextended('xat:quota:' || v_jo::text, 0));
  -- La sonda de Storage no pren cap pany (F1) i només admet reserves de menys
  -- de 15 minuts; esta neteja, les d'una hora sense objecte. Si una pujada
  -- lenta encara és en curs, el disparador la fa fallar (R1).
  for v_caduc in select id from public.xat_adjunts
    where usuari_id = v_jo and not publicat and creat_al < now() - interval '1 hour' for update
  loop
    delete from public.xat_adjunts cad where cad.id = v_caduc and not cad.publicat
      and not exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = cad.id::text);
  end loop;
  select * into a from public.xat_adjunts where id = p_id for update;
  if found then
    if a.cancellant then raise exception 'SDP-XAT-021: este adjunt s’està descartant.' using errcode = '22023'; end if;
    if a.usuari_id <> v_jo or a.fil_id <> p_fil_id or a.bytes <> p_bytes or a.mime <> p_mime
      or a.durada_ms is distinct from p_durada_ms then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    v_pujat := exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text);
    -- El reintent sense objecte renova la finestra de pujada.
    if not a.publicat and not v_pujat then
      update public.xat_adjunts set creat_al = now() where id = p_id;
    end if;
  else
    -- Gauntlet 261022_0225 (crítica Claude), F2 · Un objecte orfe (compte o
    -- fil esborrat) o ja a la cua de purga no el torna a adoptar ningú.
    if exists (select 1 from public.xat_missatges where id = p_id)
      or exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text)
      or exists (select 1 from private.purga_storage_pendent where bucket_id = 'xat_adjunts' and nom = p_id::text) then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    -- Gauntlet 261022_0225 (crítica Claude), F3 i revisió R4 i R5 · Deu
    -- pendents com a molt, amb codi propi (esperar no ajuda: cal enviar-ne o
    -- descartar-ne), i seixanta adjunts vius reservats en l'última hora (una
    -- reserva cancel·lada no compta perquè no deixa res).
    select count(*) filter (where not publicat), count(*) filter (where creat_al > now() - interval '1 hour')
      into v_pendents, v_recents from public.xat_adjunts where usuari_id = v_jo;
    if v_pendents >= 10 then
      raise exception 'SDP-XAT-022: tens massa fitxers pendents d’enviar.' using errcode = '42900';
    end if;
    if v_recents >= 60 then
      raise exception 'SDP-XAT-429: has reservat massa fitxers en poc de temps.' using errcode = '42900';
    end if;
    select coalesce(sum(bytes), 0) + private.xat_bytes_en_purga(v_jo) into v_total from public.xat_adjunts where usuari_id = v_jo;
    if v_total + p_bytes > 20000000 then
      raise exception 'SDP-XAT-020: quota de 20 MB esgotada.' using errcode = '23514';
    end if;
    insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms, xifrat)
      values(p_id, v_jo, p_fil_id, p_bytes, p_mime, p_durada_ms, p_mime='application/octet-stream') returning * into a;
    v_pujat := false;
  end if;
  return jsonb_build_object('ruta', p_id::text, 'pujat', v_pujat);
end;
$$;

CREATE OR REPLACE FUNCTION public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid default null)
returns jsonb language plpgsql volatile security definer SET search_path = public, pg_temp as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; m public.xat_missatges%rowtype; v_tipus text;
  v_versio text; v_peu text := nullif(btrim(p_text), '');
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  select * into a from public.xat_adjunts where id = p_id and usuari_id = v_jo for update;
  if not found or a.cancellant or not private.es_participant(a.fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil o l’adjunt s’ha descartat.' using errcode = '42501'; end if;
  IF a.xifrat OR (SELECT epoca_actual FROM public.xat_fils WHERE id=a.fil_id)>0 THEN RAISE EXCEPTION 'SDP-XAT-031: cal la RPC d’adjunt xifrat.' USING errcode='42501'; END IF;
  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));
  if not a.publicat then
    -- Gauntlet 261022_0225 (crítica Claude), F1 i F2 · L'escriptura final de
    -- Storage: de qui ha reservat, posterior a la reserva, amb la mida i el
    -- MIME exactes. La versió trobada és l'única que es podrà llegir.
    select o.version into v_versio from storage.objects o
      where o.bucket_id = 'xat_adjunts' and o.name = p_id::text
        and o.owner_id = v_jo::text and o.created_at >= a.creat_al
        and lower(btrim(split_part(o.metadata->>'mimetype', ';', 1))) = a.mime
        and case when jsonb_typeof(o.metadata->'size') = 'number'
          then (o.metadata->>'size')::numeric = a.bytes else false end;
    if not found then
      raise exception 'SDP-XAT-021: falta confirmar el fitxer.' using errcode = '22023';
    end if;
    if exists (select 1 from public.xat_missatges where id = p_id) then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    -- Reutilitza permisos, seq, límit de freqüència i autoria canònics.
    -- Gauntlet 261022_0225 (crítica Claude), F13 · xat_envia vol text; sense
    -- peu, el missatge es queda amb text null i el client en pinta l'etiqueta
    -- traduïda: cap «Foto» en valencià desat al servidor.
    perform public.xat_envia(p_id, a.fil_id, 'text', coalesce(v_peu, '-'), p_resposta_a, '{}'::jsonb);
    v_tipus := case when a.mime like 'image/%' then 'imatge' when a.mime like 'video/%' then 'video' else 'veu' end;
    update public.xat_missatges set tipus = v_tipus, text = v_peu,
      metadades = jsonb_build_object('adjunt', jsonb_build_object('id', a.id, 'bytes', a.bytes, 'mime', a.mime, 'duradaMs', a.durada_ms))
      where id = p_id;
    update public.xat_adjunts set publicat = true, versio = v_versio where id = p_id;
  end if;
  select * into m from public.xat_missatges where id = p_id and usuari_id = v_jo;
  return jsonb_build_object('id', m.id, 'seq', m.seq, 'usuari_id', m.usuari_id, 'cos', m.text, 'tipus', m.tipus,
    'resposta_a', m.resposta_a, 'metadades', m.metadades, 'com_org_id', m.com_org_id, 'creat_al', m.creat_al,
    'autor_nom', coalesce((select name from public.organizations where id = m.com_org_id), (select full_name from public.profiles where id = v_jo), 'Veí'));
end;
$$;

CREATE OR REPLACE FUNCTION private.xat_escriptura_final() returns trigger
language plpgsql security definer SET search_path = public, pg_temp as $$
declare a public.xat_adjunts%rowtype;
begin

  IF NOT (coalesce(new.metadata,'{}'::jsonb) ? 'size') THEN
    IF (SELECT auth.uid()) IS NULL OR NOT private.xat_pujable_adjunt(new.name,new.metadata) THEN
      RAISE EXCEPTION 'SDP-XAT-021: sonda sense autorització.' USING errcode='42501';
    END IF;
    RETURN new;
  END IF;
  select * into a from public.xat_adjunts where id = private.xat_id_de_ruta(new.name) for update;
  if not found or a.publicat or a.cancellant
    or a.creat_al <= now()-interval '15 minutes'
    or not private.xat_participant_vigent(a.fil_id,a.usuari_id)
    or not exists(select 1 from public.xat_participants p where p.fil_id=a.fil_id and p.usuari_id=a.usuari_id and p.visible_fins_seq is null) or new.owner_id is distinct from a.usuari_id::text
    or lower(btrim(split_part(new.metadata->>'mimetype', ';', 1))) is distinct from a.mime
    or (case when jsonb_typeof(new.metadata->'size') = 'number'
      then (new.metadata->>'size')::numeric <> a.bytes else true end) then
    raise exception 'SDP-XAT-021: el fitxer no coincidix amb la reserva.' using errcode = '22023';
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION private.xat_llegible_adjunt(p_ruta text) returns boolean
language sql stable security definer SET search_path = public, pg_temp as $$
  select exists (select 1 from public.xat_adjunts a
    left join public.xat_missatges m on m.id = a.id
    where a.id = private.xat_id_de_ruta(p_ruta)
      and private.es_participant(a.fil_id)
      and ((not a.publicat and a.usuari_id = (select auth.uid()))
        or (a.publicat and m.esborrat_al is null and (m.caduca_al is null or m.caduca_al > now())
          and private.es_participant(a.fil_id) and private.seq_visible(a.fil_id, m.seq)
          and exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts'
            and o.name = p_ruta and o.version is not distinct from a.versio))));
$$;

-- Frontera pròpia encara que hi haja altres polítiques permissives al node.
DROP POLICY IF EXISTS xat_lot3_storage_lectura ON storage.objects;
CREATE POLICY xat_lot3_storage_lectura ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (bucket_id<>'xat_adjunts' OR ((SELECT auth.uid()) IS NOT NULL
    AND coalesce(storage.operation(),'') NOT IN ('storage.object.list','storage.object.list_v2','storage.s3.object.list') AND private.xat_llegible_adjunt(name)));
DROP POLICY IF EXISTS xat_lot3_storage_pujada ON storage.objects;
CREATE POLICY xat_lot3_storage_pujada ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id<>'xat_adjunts' OR ((SELECT auth.uid()) IS NOT NULL AND private.xat_pujable_adjunt(name,metadata)));

CREATE OR REPLACE FUNCTION public.xat_publica_adjunt_xifrat(p_id uuid,p_resposta_a uuid,p_xifrat jsonb,p_epoca_nova jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid:=(SELECT auth.uid()); a public.xat_adjunts%rowtype; v_versio text; resultat jsonb;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'SDP-XAT-001: cal iniciar sessió.' USING errcode='42501'; END IF;
  SELECT * INTO a FROM public.xat_adjunts WHERE id=p_id AND usuari_id=u FOR UPDATE;
  IF NOT FOUND OR a.cancellant THEN RAISE EXCEPTION 'SDP-XAT-006: reserva absent.' USING errcode='42501'; END IF;
  PERFORM private.xat_e2ee_exigix(a.fil_id);
  IF NOT a.xifrat OR a.mime<>'application/octet-stream' OR a.durada_ms IS NOT NULL THEN RAISE EXCEPTION 'SDP-XAT-009: reserva no xifrada.' USING errcode='22023'; END IF;
  SELECT o.version INTO v_versio FROM storage.objects o WHERE o.bucket_id='xat_adjunts' AND o.name=p_id::text
    AND o.owner_id=u::text AND o.created_at>=a.creat_al AND o.version IS NOT NULL
    AND lower(btrim(split_part(o.metadata->>'mimetype',';',1)))=a.mime
    AND CASE WHEN jsonb_typeof(o.metadata->'size')='number' THEN (o.metadata->>'size')::numeric=a.bytes ELSE false END
    AND (NOT a.publicat OR o.version=a.versio) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SDP-XAT-021: objecte definitiu no confirmat.' USING errcode='22023'; END IF;
  resultat:=public.xat_envia_xifrat(p_id,a.fil_id,p_resposta_a,p_xifrat,p_epoca_nova);
  UPDATE public.xat_adjunts SET publicat=true,versio=v_versio WHERE id=p_id;
  RETURN resultat;
END $$;

CREATE OR REPLACE FUNCTION private.xat_missatges_e2ee()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE e integer;
BEGIN
  SELECT epoca_actual INTO e FROM public.xat_fils WHERE id=new.fil_id FOR UPDATE;
  IF TG_OP='UPDATE' THEN
    IF old.versio_xifrat=1 AND new.resposta_a IS NOT NULL AND new.resposta_a IS DISTINCT FROM old.resposta_a THEN
      RAISE EXCEPTION 'SDP-XAT-037: resposta immutable.' USING errcode='42501';
    END IF;
    IF old.versio_xifrat=1 AND (new.fil_id,new.id,new.usuari_id,new.versio_xifrat,new.text,new.tipus,new.com_org_id,new.resposta_a_xifrada,new.metadades,new.es_ia)
      IS DISTINCT FROM (old.fil_id,old.id,old.usuari_id,old.versio_xifrat,old.text,old.tipus,old.com_org_id,old.resposta_a_xifrada,old.metadades,old.es_ia) THEN
      RAISE EXCEPTION 'SDP-XAT-037: missatge xifrat immutable.' USING errcode='42501';
    END IF;
    IF old.versio_xifrat=1 THEN
      IF old.esborrat_al IS NOT NULL AND (new.esborrat_al IS DISTINCT FROM old.esborrat_al OR new.xifrat IS NOT NULL) THEN
        RAISE EXCEPTION 'SDP-XAT-037: una làpida no es restaura.' USING errcode='42501';
      END IF;
      IF new.esborrat_al IS NOT NULL THEN
        new.xifrat:=NULL; -- elimina el xifrat també de SELECT directe; no es torna a publicar
      ELSIF new.xifrat IS DISTINCT FROM old.xifrat THEN
        RAISE EXCEPTION 'SDP-XAT-037: missatge xifrat immutable.' USING errcode='42501';
      END IF;
    END IF;
    IF old.versio_xifrat=0 AND e>0 AND (new.versio_xifrat<>0 OR new.xifrat IS NOT NULL OR (new.text IS NOT NULL AND new.text IS DISTINCT FROM old.text)) THEN
      RAISE EXCEPTION 'SDP-XAT-031: no es pot editar en clar.' USING errcode='42501';
    END IF;
    RETURN new;
  END IF;
  IF e>0 AND new.versio_xifrat<>1 THEN RAISE EXCEPTION 'SDP-XAT-031: este fil ja és xifrat.' USING errcode='42501'; END IF;
  IF new.versio_xifrat=1 THEN
    IF new.resposta_a_xifrada IS DISTINCT FROM new.resposta_a THEN
      RAISE EXCEPTION 'SDP-XAT-009: referència criptogràfica incoherent.' USING errcode='22023';
    END IF;
    IF NOT private.xat_sobre_format_v1_valid(new.xifrat) OR (new.xifrat->>'epoca')::integer IS DISTINCT FROM e THEN
      RAISE EXCEPTION 'SDP-XAT-030: època incorrecta.' USING errcode='40001';
    END IF;
    IF NOT private.xat_epoca_vigent_valida(new.fil_id,e) THEN RAISE EXCEPTION 'SDP-XAT-036: cal rotar.' USING errcode='40001'; END IF;
  END IF;
  RETURN new;
END $$;
DROP TRIGGER IF EXISTS xat_missatges_e2ee ON public.xat_missatges;
CREATE TRIGGER xat_missatges_e2ee BEFORE INSERT OR UPDATE ON public.xat_missatges FOR EACH ROW EXECUTE FUNCTION private.xat_missatges_e2ee();

CREATE OR REPLACE FUNCTION private.xat_fils_e2ee_apegalos()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF new.epoca_actual<old.epoca_actual OR new.epoca_actual>old.epoca_actual::bigint+1
     OR (old.cap_epoca_hash IS NOT NULL AND (new.cap_epoca_hash IS NULL OR (new.epoca_actual=old.epoca_actual AND new.cap_epoca_hash IS DISTINCT FROM old.cap_epoca_hash)))
     OR (old.e2ee_des_de_seq IS NOT NULL AND new.e2ee_des_de_seq IS DISTINCT FROM old.e2ee_des_de_seq)
     OR (old.epoca_actual>0 AND (new.tipus,new.org_id,new.interlocutor_id,new.subjecte_tipus,new.subjecte_id) IS DISTINCT FROM (old.tipus,old.org_id,old.interlocutor_id,old.subjecte_tipus,old.subjecte_id)) THEN
    RAISE EXCEPTION 'SDP-XAT-038: rebaixa o reclassificació del fil.' USING errcode='42501';
  END IF;
  RETURN new;
END $$;
DROP TRIGGER IF EXISTS xat_fils_e2ee_apegalos ON public.xat_fils;
CREATE TRIGGER xat_fils_e2ee_apegalos BEFORE UPDATE ON public.xat_fils FOR EACH ROW EXECUTE FUNCTION private.xat_fils_e2ee_apegalos();

CREATE OR REPLACE FUNCTION private.xat_e2ee_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN RAISE EXCEPTION 'SDP-XAT-037: registre d’època immutable.' USING errcode='42501'; END $$;
DROP TRIGGER IF EXISTS xat_epoques_immutable ON public.xat_epoques;
CREATE TRIGGER xat_epoques_immutable BEFORE UPDATE ON public.xat_epoques FOR EACH ROW EXECUTE FUNCTION private.xat_e2ee_immutable();
DROP TRIGGER IF EXISTS xat_roster_immutable ON public.xat_epoques_membres;
CREATE TRIGGER xat_roster_immutable BEFORE UPDATE ON public.xat_epoques_membres FOR EACH ROW EXECUTE FUNCTION private.xat_e2ee_immutable();
DROP TRIGGER IF EXISTS xat_sobres_immutable ON public.xat_claus_fil;
CREATE TRIGGER xat_sobres_immutable BEFORE UPDATE ON public.xat_claus_fil FOR EACH ROW EXECUTE FUNCTION private.xat_e2ee_immutable();
DROP TRIGGER IF EXISTS xat_reembolcalls_immutable ON public.xat_reembolcalls;
CREATE TRIGGER xat_reembolcalls_immutable BEFORE UPDATE ON public.xat_reembolcalls FOR EACH ROW EXECUTE FUNCTION private.xat_e2ee_immutable();

DROP FUNCTION IF EXISTS public.xat_historial(uuid,bigint,integer);
CREATE OR REPLACE FUNCTION public.xat_historial(
  p_fil_id       uuid,
  p_abans_de_seq bigint  default null,
  p_limit        integer default 50
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  com_org_id  uuid,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz,
  xifrat jsonb
)
language plpgsql
stable
security definer
SET search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 50);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or v_limit < 1 or v_limit > 100
     or (p_abans_de_seq is not null and p_abans_de_seq < 1) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select * from (
      select
        m.id,
        m.fil_id,
        m.seq,
        m.usuari_id,
        coalesce(o.name, pr.full_name, 'Veí')::text as autor_nom,
        m.com_org_id,
        m.text as cos,
        m.tipus,
        CASE WHEN m.versio_xifrat=1 THEN m.resposta_a_xifrada ELSE m.resposta_a END AS resposta_a,
        m.editat_al,
        m.esborrat_al,
        m.metadades,
        m.es_ia,
        m.creat_al,
        m.xifrat
      from public.xat_missatges m
      left join public.profiles pr on pr.id = m.usuari_id
      left join public.organizations o on o.id = m.com_org_id
      where m.fil_id = p_fil_id
        and m.seq > v_des_de
        and (v_fins is null or m.seq <= v_fins)
        and (p_abans_de_seq is null or m.seq < p_abans_de_seq)
        and (m.caduca_al is null or m.caduca_al > now())
      order by m.seq desc
      limit v_limit
    ) sub
    order by sub.seq asc;
end;
$$;

DROP FUNCTION IF EXISTS public.xat_nous(uuid,bigint,integer);
CREATE OR REPLACE FUNCTION public.xat_nous(
  p_fil_id         uuid,
  p_despres_de_seq bigint,
  p_limit          integer default 100
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  com_org_id  uuid,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz,
  xifrat jsonb
)
language plpgsql
stable
security definer
SET search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 100);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or p_despres_de_seq is null or p_despres_de_seq < 0
     or v_limit < 1 or v_limit > 500 then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.fil_id,
      m.seq,
      m.usuari_id,
      coalesce(o.name, pr.full_name, 'Veí')::text as autor_nom,
        m.com_org_id,
      m.text as cos,
      m.tipus,
      CASE WHEN m.versio_xifrat=1 THEN m.resposta_a_xifrada ELSE m.resposta_a END AS resposta_a,
      m.editat_al,
      m.esborrat_al,
      m.metadades,
      m.es_ia,
      m.creat_al,
        m.xifrat
    from public.xat_missatges m
    left join public.profiles pr on pr.id = m.usuari_id
      left join public.organizations o on o.id = m.com_org_id
    where m.fil_id = p_fil_id
      and m.seq > greatest(v_des_de, p_despres_de_seq)
      and (v_fins is null or m.seq <= v_fins)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq asc
    limit v_limit;
end;
$$;

DROP FUNCTION IF EXISTS public.xat_fils_meus(uuid);
CREATE OR REPLACE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint
)
language plpgsql volatile security definer SET search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
  select f.id, om.user_id, f.org_id, 'admin' from public.xat_fils f
  join public.organization_memberships om on om.organization_id = f.org_id and om.tenant_id = f.tenant_id
  where f.tenant_id = p_tenant_id and f.interlocutor_id is not null
    and f.interlocutor_id <> (select auth.uid())
    and om.user_id = (select auth.uid()) and om.role in ('owner', 'admin')
  on conflict (fil_id, usuari_id) do nothing;

  return query select f.id, f.tipus, f.titol,
    coalesce(f.imatge_url, costat.dades -> 0 ->> 'avatarUrl'), f.actualitzat_al,
    coalesce(costat.noms, array[]::text[]), u.text, u.creat_al, u.usuari_id,
    f.ultim_seq, jo.llegit_fins_seq, jo.rebut_fins_seq,
    coalesce((select min(p.llegit_fins_seq) from public.xat_participants p
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)), 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus, f.epoca_actual, f.cap_epoca_hash, f.e2ee_des_de_seq
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral (
    select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'tipus', c.tipus,
      'avatarUrl', c.avatar_url, 'slug', c.slug) order by c.nom) as dades,
      array_agg(c.nom order by c.nom) as noms
    from (
      select o.id, o.name as nom, 'entitat'::text as tipus, o.logo_url as avatar_url, o.slug
      where o.id is not null and jo.com_org_id is null
      union all
      select pr.id, coalesce(pr.full_name, 'Veí'), 'persona'::text, pr.avatar_url, null::text
      from public.xat_participants p join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;

CREATE OR REPLACE FUNCTION public.xat_verifica_prerequisits_e2ee()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE t text; v record; f text[]:=ARRAY[]::text[]; v_oid oid;
BEGIN
  FOREACH t IN ARRAY ARRAY['public.xat_fils','public.xat_participants','public.xat_missatges','public.xat_adjunts','public.xat_claus_usuari','public.xat_llibretes','public.xat_cercles_recuperacio','public.xat_avals_recuperacio','public.xat_peticions_recuperacio','public.xat_verificacions_recuperacio','public.xat_alliberaments_recuperacio','public.xat_epoques','public.xat_epoques_membres','public.xat_claus_fil','public.xat_reembolcalls','private.xat_cohort_e2ee','private.xat_configuracio_e2ee','private.xat_origens_xifrat','private.xat_ritme_claus','storage.objects']::text[] LOOP
    IF NOT coalesce((SELECT c.relrowsecurity FROM pg_class c WHERE c.oid=to_regclass(t)),false) THEN f:=array_append(f,'taula_o_rls:'||t); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES ('public.xat_publica_identitat(text,text,text,text,jsonb)',ARRAY['p_kid_anterior','p_declaracio','p_autofirma','p_firma_continuitat','p_copia']::text[]),('public.xat_la_meua_identitat()',ARRAY[]::text[]),('public.xat_desa_frase(text,jsonb)',ARRAY['p_kid','p_frase']::text[]),('public.xat_claus_de(uuid[])',ARRAY['p_usuaris']::text[]),('public.xat_desa_llibreta(bigint,jsonb)',ARRAY['p_comptador','p_llibreta']::text[]),('public.xat_la_meua_llibreta()',ARRAY[]::text[]),('public.xat_canvia_rk(text,text,jsonb,jsonb)',ARRAY['p_kid','p_hash_copia','p_copia','p_llibreta']::text[]),('public.xat_estat_xifrat(uuid[])',ARRAY['p_fils']::text[]),('public.xat_epoques_del_fil(uuid,integer)',ARRAY['p_fil_id','p_des_de']::text[]),('public.xat_meus_sobres(uuid,integer[])',ARRAY['p_fil_id','p_epoques']::text[]),('public.xat_obri_epoca(uuid,jsonb)',ARRAY['p_fil_id','p_epoca_nova']::text[]),('public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb)',ARRAY['p_id','p_fil_id','p_resposta_a','p_xifrat','p_epoca_nova']::text[]),('public.xat_reembolcalla(uuid,jsonb)',ARRAY['p_fil_id','p_items']::text[]),('public.xat_demana_xifrat(uuid)',ARRAY['p_fil_id']::text[]),('public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb)',ARRAY['p_id','p_resposta_a','p_xifrat','p_epoca_nova']::text[]),('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)',ARRAY['p_id','p_fil_id','p_bytes','p_mime','p_durada_ms']::text[]),('public.xat_cancella_reserva(uuid)',ARRAY['p_id']::text[]),('public.xat_llegix_adjunt(uuid)',ARRAY['p_id']::text[]),('public.xat_historial(uuid,bigint,integer)',ARRAY['p_fil_id','p_abans_de_seq','p_limit']::text[]),('public.xat_nous(uuid,bigint,integer)',ARRAY['p_fil_id','p_despres_de_seq','p_limit']::text[]),('public.xat_fils_meus(uuid)',ARRAY['p_tenant_id']::text[])) AS x(sig,noms) LOOP
    v_oid:=to_regprocedure(v.sig);
    IF v_oid IS NULL THEN f:=array_append(f,'rpc:'||v.sig);
    ELSE
      IF has_function_privilege('anon',v_oid,'EXECUTE') OR NOT has_function_privilege('authenticated',v_oid,'EXECUTE') THEN f:=array_append(f,'acl:'||v.sig); END IF;
      IF coalesce((SELECT p.proargnames[1:p.pronargs] FROM pg_proc p WHERE p.oid=v_oid),ARRAY[]::text[]) IS DISTINCT FROM v.noms THEN f:=array_append(f,'parametres:'||v.sig); END IF;
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['private.xat_e2ee_exigix(uuid)','private.xat_e2ee_abast(uuid)','private.xat_obri_epoca_intern(uuid,uuid,jsonb)','public.xat_obri_epoca(uuid,jsonb)','public.xat_estat_xifrat(uuid[])','public.xat_epoques_del_fil(uuid,integer)','public.xat_meus_sobres(uuid,integer[])','public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb)','public.xat_reembolcalla(uuid,jsonb)','public.xat_demana_xifrat(uuid)','private.xat_e2ee_permes(uuid)','private.xat_epoca_vigent_valida(uuid,integer)','private.xat_e2ee_bloqueja(uuid)','private.xat_e2ee_json_missatge(uuid)','public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)','public.xat_publica_adjunt(uuid,text,uuid)','private.xat_escriptura_final()','private.xat_llegible_adjunt(text)','public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb)','private.xat_missatges_e2ee()','private.xat_fils_e2ee_apegalos()','private.xat_e2ee_immutable()','public.xat_historial(uuid,bigint,integer)','public.xat_nous(uuid,bigint,integer)','public.xat_fils_meus(uuid)']::text[] LOOP
    IF NOT coalesce((SELECT p.prosecdef AND p.proconfig @> ARRAY['search_path=public, pg_temp'] FROM pg_proc p WHERE p.oid=to_regprocedure(t)),false) THEN f:=array_append(f,'definer_path:'||t); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES
    ('public.xat_missatges','xat_missatges_e2ee'),('public.xat_fils','xat_fils_e2ee_apegalos'),
    ('public.xat_missatges','xat_missatges_seq'),('public.xat_missatges','trg_rate_limit_xat'),
    ('public.xat_missatges','xat_missatges_exigix_normes'),('storage.objects','xat_escriptura_final')) AS x(taula,nom)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_trigger tr WHERE tr.tgrelid=to_regclass(v.taula) AND tr.tgname=v.nom AND tr.tgenabled='O') THEN f:=array_append(f,'trigger:'||v.nom); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES ('public.xat_missatges','xifrat','jsonb'),('public.xat_missatges','resposta_a_xifrada','uuid'),
    ('public.xat_fils','epoca_actual','integer'),('public.xat_fils','cap_epoca_hash','text'),('public.xat_fils','e2ee_des_de_seq','bigint'),('public.xat_adjunts','xifrat','boolean')) AS x(taula,columna,tipus)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass(v.taula) AND a.attname=v.columna AND NOT a.attisdropped AND a.atttypid=to_regtype(v.tipus)) THEN f:=array_append(f,'columna:'||v.taula||'.'||v.columna); END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['public.xat_epoques','public.xat_epoques_membres','public.xat_claus_fil','public.xat_reembolcalls'] LOOP
    IF has_table_privilege('anon',t,'SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated',t,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN f:=array_append(f,'privilegis_taula:'||t); END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_policies p WHERE p.schemaname='public'
    AND p.tablename IN ('xat_epoques','xat_epoques_membres','xat_claus_fil','xat_reembolcalls')
    AND (p.tablename,p.policyname) NOT IN (('xat_epoques','xat_epoques_lectura_lot3'),('xat_epoques_membres','xat_epoques_membres_lectura_lot3'),('xat_claus_fil','xat_sobres_propis_lot3'),('xat_reembolcalls','xat_reembolcalls_propis_lot3'))) THEN
    f:=array_append(f,'politiques_desconegudes');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets b WHERE b.id='xat_adjunts' AND NOT b.public AND b.file_size_limit=20000000 AND 'application/octet-stream'=ANY(b.allowed_mime_types)) THEN f:=array_append(f,'bucket'); END IF;
  IF has_schema_privilege('authenticated','public','CREATE') OR has_schema_privilege('anon','public','CREATE') THEN f:=array_append(f,'schema_public_no_fiable'); END IF;
  RETURN jsonb_build_object('contracte','sdp-xat-v1','preparat_sql',cardinality(f)=0,'faltants',to_jsonb(f),
    'general',(SELECT general FROM private.xat_configuracio_e2ee WHERE id),'flag_client_modificat',false,
    'entitats_habilitades',false,'grups_requerixen_alineacio_client',true,'requereix_ordre_del_mestre',true);
END $$;

REVOKE ALL ON FUNCTION private.xat_lot3_b64(text,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_sobre_format_v1_valid(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_exigix(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_abast(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_obri_epoca_intern(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.xat_obri_epoca(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_obri_epoca(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_estat_xifrat(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_estat_xifrat(uuid[]) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_epoques_del_fil(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_epoques_del_fil(uuid,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_meus_sobres(uuid,integer[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_meus_sobres(uuid,integer[]) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_reembolcalla(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_reembolcalla(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_demana_xifrat(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_demana_xifrat(uuid) TO authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_permes(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_epoca_vigent_valida(uuid,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_bloqueja(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_json_missatge(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_maxim_adjunt(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_publica_adjunt(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_publica_adjunt(uuid,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION private.xat_escriptura_final() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_llegible_adjunt(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION private.xat_missatges_e2ee() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_fils_e2ee_apegalos() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.xat_e2ee_immutable() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.xat_historial(uuid,bigint,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_historial(uuid,bigint,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_nous(uuid,bigint,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_nous(uuid,bigint,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_fils_meus(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_fils_meus(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_verifica_prerequisits_e2ee() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xat_verifica_prerequisits_e2ee() TO service_role;
REVOKE ALL ON FUNCTION public.xat_historial(uuid,bigint,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.xat_historial(uuid,bigint,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_nous(uuid,bigint,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.xat_nous(uuid,bigint,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.xat_fils_meus(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.xat_fils_meus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.xat_llegible_adjunt(text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;

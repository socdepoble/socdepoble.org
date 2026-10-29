-- ============================================================================
-- 261029_0400 · P1-12 i IDEA-48 (disseny_final_e2ee.md v1.1.0, §7.2 primera
-- fila, §7.3, §7.4 i §7.9; esmenes_qa_261029.md §13.1 R3, R5, R8 i R9;
-- auditoria Codex 261029_0340 E2EE-I03; pla 261029_0216, T7) · E2EE-1a: les
-- claus del xat xifrat d'extrem a extrem, la còpia de recuperació, la frase,
-- la llibreta de seguretat i el contracte de dades de la recuperació social
--
-- QUÈ FA:
--   1. Guardes, abans de tocar res (SDP-XAT-900, avorta): public.xat_participants
--      i private.es_participant(uuid) (2609272200) existixen, i la cadena
--      pendent és aplicada fins a 2610282100 (public.xat_adjunts de 2610220240
--      i public.desa_el_meu_usuari de 2610282100), com mana el disseny (§7.1).
--   2. Ajudes de codificació a private, pures (IMMUTABLE) i sense cap permís
--      per al client: xat_b64 (base64url canònic, sense farciment, amb la
--      mida exacta si es demana; SDP-XAT-040 si no), xat_b64_enc, xat_uuid16,
--      xat_u32 (u32 big-endian, per a E2EE-1b) i xat_jwk_punt (la pública
--      efímera d'HPKE com a JWK estricte de 4 claus: kty, crv, x i y; mai d).
--   3. public.xat_claus_usuari (IF NOT EXISTS): el registre només d'afegir de
--      les identitats (declaració SDPK de 175 bytes, les dues públiques de 65
--      bytes, kid de 16 bytes recalculat al servidor, autofirma, continuïtat)
--      amb la còpia xifrada de la identitat (backup_privat_ct, 241 bytes) i
--      l'embolcall de la RK amb la frase (backup_rk_ct, 48 bytes; sal, IV,
--      iteracions de 600.000 a 10.000.000 i versió de la llista). Un sol
--      registre actiu per persona (índex únic parcial xat_claus_usuari_activa);
--      mai la IAIA. El disparador xat_claus_usuari_immobil no deixa reescriure
--      cap pública ni cap retirada (SDP-XAT-038): només es retira i es renova
--      la còpia. Cap columna porta la RK ni cap privada en clar.
--   4. public.xat_llibretes: la llibreta de seguretat xifrada de cada persona
--      (una fila per persona, comptador estrictament creixent, firma de 64
--      bytes de la clau activa).
--   5. El contracte de dades d'IDEA-48 (les RPC arriben a F7; esmenes R5 i
--      R8): xat_cercles_recuperacio (declaració amb versió, k = 3 exacte, n
--      de 3 a 255; un sol cercle vigent per persona, índex únic
--      xat_cercles_recuperacio_vigent), xat_avals_recuperacio (aval de 49
--      bytes, x únic dins del repartiment), xat_peticions_recuperacio
--      (màquina d'estats; clau forana al cercle; creat_ms i caduca_ms bigint
--      exactes, caducitat de 2 h com a molt; el SDPN sencer de 61 bytes lligat
--      al compte, al kid i a la petició, admés en qualsevol estat),
--      xat_verificacions_recuperacio (intents SAS, 3 com a molt) i
--      xat_alliberaments_recuperacio (113 bytes, un per amic i x únic).
--   6. Totes les taules noves de public: RLS activa, REVOKE ALL a public,
--      anon, authenticated i service_role, i només GRANT SELECT, DELETE a
--      service_role (patró 2610220240): cap lectura directa des del client,
--      tot passa per les RPC.
--   7. Orígens admesos (defensa en profunditat, §7.3): private.xat_origens_xifrat
--      amb https://socdepoble.org, capacitor://localhost i https://localhost, i
--      private.xat_origen_admes(), que llig l'Origin de request.headers (el
--      que PostgREST exposa) i torna fals davant de qualsevol capçalera que no
--      siga JSON. La llista la manté el Mestre des del SQL Editor.
--   8. private.xat_ritme_claus i private.xat_ritme_claus_compta: una fila per
--      canvi de frase o de RK que arriba al límit, finestra de 24 h per
--      persona i acció (10 cada 24 h, §7.4); la neteja és a cada crida.
--   9. Les RPC d'E2EE-1a (§7.4), totes SECURITY DEFINER amb search_path buit,
--      revocades a public i anon i donades només a authenticated; sessió
--      (SDP-XAT-001) i origen admés (SDP-XAT-045) sempre primer; un sol
--      rellotge per crida (v_ara := now(), el de la transacció; mai
--      clock_timestamp) i el pany consultiu xat:identitat:<usuari> abans de
--      la fila activa (ordre de panys de §7.5):
--      · xat_publica_identitat(kid_anterior, declaracio, autofirma,
--        firma_continuitat, copia): comprova la forma SDPK, que el compte de
--        dins és el propi i que el kid anterior de dins és el que es diu;
--        recalcula el kid; COMPARAR-I-CANVIAR amb la fila activa (si l'actiu no
--        és el kid anterior esperat, SDP-XAT-041 i el client restaura); la
--        mateixa declaració ja activa torna el kid sense tocar res (resposta
--        perduda); límits de 5 publicacions cada 24 h i, sense continuïtat, 1
--        cada 24 h i 3 cada 30 dies (SDP-XAT-042); la còpia és obligatòria
--        (decisió 2 del Mestre, SDP-XAT-043); retira l'activa (i en buida la
--        còpia), retira el cercle vigent d'IDEA-48 (retirat_al, avals
--        esborrats, peticions obertes a caducada; esmena R9) i publica la nova
--        amb la còpia, tot en la mateixa transacció.
--      · xat_la_meua_identitat(): l'activa i la història pròpies, amb la còpia
--        només a l'activa.
--      · xat_desa_frase(kid, frase): rk_ct, rk_iv, sal, iteracions i llista
--        nous per a l'activa pròpia (SDP-XAT-033 si el kid no és l'actiu);
--        10 cada 24 h.
--      · xat_claus_de(usuaris[]): públiques i història, SENSE còpies, només de
--        les persones amb qui es compartix algun fil (private.es_participant)
--        i d'una mateixa; d'1 a 256 identificadors (SDP-XAT-009). Qui no
--        compartix cap fil no torna cap fila: el mateix que no tindre clau.
--      · xat_desa_llibreta(comptador, llibreta) i xat_la_meua_llibreta(): la
--        llibreta pròpia, firmada per la clau activa (SDP-XAT-033); el
--        comptador ha de ser estrictament major que el desat (SDP-XAT-044,
--        reintentable: el client torna a llegir).
--      · xat_canvia_rk(kid, hash_copia, copia, llibreta): el nivell 3 de
--        §5.6.5 (esmena R3): COMPARAR-I-CANVIAR sobre el SHA-256 de la còpia
--        viva (SDP-XAT-046 si ha canviat en un altre aparell) i, en UNA sola
--        transacció, substituïx la còpia i l'embolcall de la frase, desa la
--        llibreta tornada a xifrar amb la K_ll nova (Codex E2EE-I03; el
--        comptador també estrictament major, SDP-XAT-044) i retira el cercle
--        vigent (esmena R9); 10 cada 24 h. Torna el hash de la còpia nova.
--
-- QUÈ NO FA:
--   · No toca xat_envia ni cap funció, taula, política ni disparador que ja
--     existisca: xat_fils, xat_missatges, xat_adjunts i les lectures són
--     d'E2EE-1b; fer complir als fils activats, d'E2EE-1c; l'activació
--     general, d'E2EE-F2c. Els clients d'ara no veuen cap canvi.
--   · No crea cap política: les taules noves no tenen cap lectura directa.
--   · No desa cap RK, cap privada ni cap frase en clar: només xifrats i
--     públiques. El servidor no pot obrir cap còpia.
--   · No verifica cap signatura ECDSA (Postgres no en fa): la forma sí, la
--     criptografia la fan els clients (§7.9, notes).
--   · No crea les RPC d'IDEA-48 (xat_publica_cercle, peticions, SAS,
--     alliberaments, «No sóc jo»): són de F7. Només el contracte de dades, i
--     la retirada del cercle en canviar de kid o de RK (esmena R9).
--   · No posa cap límit del servidor a la llibreta fora del comptador: el
--     client la desa com a molt cada 5 minuts (§5.5).
--   · Cap nom de persona ni cap dada de producció.
--
-- CODIS (els nous respecte al repositori; 030..039 queden per a E2EE-1b/1c):
--   SDP-XAT-001 (42501) cal la sessió iniciada.
--   SDP-XAT-009 (22023) paràmetre invàlid.
--   SDP-XAT-033 (42501) el kid no és la clau activa del compte.
--   SDP-XAT-038 (42501) una clau publicada no es pot reescriure (disparador).
--   SDP-XAT-040 (22023) codificació o clau pública invàlida.
--   SDP-XAT-041 (40001) la clau del compte ha canviat en un altre aparell
--     (comparar-i-canviar de la identitat): restaurar.
--   SDP-XAT-042 (42900) massa canvis seguits (identitat, frase o RK).
--   SDP-XAT-043 (22023) declaració de clau invàlida o còpia que falta o no
--     té la forma.
--   SDP-XAT-044 (40001) la llibreta del servidor és més nova (comptador):
--     tornar a llegir i reintentar. Codi nou (el disseny el deixava lliure).
--   SDP-XAT-045 (42501) origen no admés.
--   SDP-XAT-046 (40001) la còpia ha canviat en un altre aparell
--     (comparar-i-canviar de xat_canvia_rk). Codi nou, següent lliure.
--   SDP-XAT-900 (avorta) falta la cadena pendent; no es toca res.
--
-- Depén de: 2609080000 (private, pgcrypto), 2609080100 (xat_participants),
-- 2609272200 (private.es_participant), 2610220240 (xat_adjunts: la cadena
-- d'adjunts) i 2610282100 (l'última de la cadena pendent, §7.1).
--
-- ABANS D'APLICAR-LA (lectura; el resultat s'ha de guardar):
--   1. select pg_catalog.to_regclass('public.xat_participants'), pg_catalog.to_regprocedure('private.es_participant(uuid)'),
--        pg_catalog.to_regclass('public.xat_adjunts'), pg_catalog.to_regprocedure('public.desa_el_meu_usuari(text)');
--      (cap nul; si no, SDP-XAT-900).
--   2. select n.nspname, c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
--       where c.relname in ('xat_claus_usuari', 'xat_llibretes', 'xat_cercles_recuperacio', 'xat_avals_recuperacio',
--         'xat_peticions_recuperacio', 'xat_verificacions_recuperacio', 'xat_alliberaments_recuperacio',
--         'xat_origens_xifrat', 'xat_ritme_claus');
--      (cap fila: les taules són noves; una de prèvia amb una altra forma fa
--      que els IF NOT EXISTS la deixen com està i cal revisar-la a mà).
--   3. select n.nspname, p.proname from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
--       where p.proname like 'xat\_%' and p.proname in ('xat_publica_identitat', 'xat_la_meua_identitat', 'xat_desa_frase',
--         'xat_claus_de', 'xat_desa_llibreta', 'xat_la_meua_llibreta', 'xat_canvia_rk', 'xat_origen_admes', 'xat_b64');
--      (cap fila).
--
-- DESPRÉS D'APLICAR-LA (lectura):
--   select c.relname, c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relname in ('xat_claus_usuari', 'xat_llibretes', 'xat_cercles_recuperacio',
--      'xat_avals_recuperacio', 'xat_peticions_recuperacio', 'xat_verificacions_recuperacio', 'xat_alliberaments_recuperacio');
--   (7 files, totes true)
--   select r.rolname, has_table_privilege(r.rolname, 'public.xat_claus_usuari', 'select')
--     from (values ('anon'), ('authenticated')) as r(rolname);
--   (false i false)
--   select origen from private.xat_origens_xifrat order by 1;
--   (capacitor://localhost, https://localhost, https://socdepoble.org)
--   select private.xat_b64_enc(private.xat_b64('AQID', 3));  (AQID)
--   Si cal un origen més (un node de prova), només el Mestre:
--      insert into private.xat_origens_xifrat (origen) values ('https://<node>') on conflict do nothing;
--
-- VERIFICACIÓ MANUAL AMB DUES SESSIONS (en una base de prova, mai en la de
-- producció): una persona A amb sessió i sense cap clau publicada; D1 i D2
-- dues declaracions SDPK vàlides d'A amb kid anterior a zeros, amb la seua
-- autofirma i la seua còpia (les fa el client o xifratXatFormats.js). En dues
-- finestres de psql obertes alhora, amb l'Origin de la llista:
--   Sessió 1: begin;
--             select set_config('request.jwt.claims', '{"sub":"<A>","role":"authenticated"}', true);
--             select set_config('request.headers', '{"origin":"https://socdepoble.org"}', true);
--             set local role authenticated;
--             select * from public.xat_publica_identitat(null, '<D1>', '<autofirma1>', null, '<copia1>'::jsonb);
--             (no confirmes encara)
--   Sessió 2: begin; (els mateixos set_config i set local role)
--             select * from public.xat_publica_identitat(null, '<D2>', '<autofirma2>', null, '<copia2>'::jsonb);
--             (es queda esperant el pany xat:identitat:<A>)
--   Sessió 1: commit;
--   Sessió 2: rep SDP-XAT-041 (la fila activa ja és la de D1); rollback;
--   I la frase: la sessió 2 crida xat_desa_frase amb el kid de D1 i una frase
--   nova mentre la sessió 1 fa el mateix sense confirmar: la segona espera i
--   acaba; la fila porta l'última; les dues compten per al límit de 10.
--
-- Idempotent (IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS, ON
-- CONFLICT DO NOTHING) i en una sola transacció. Va després de 2610282100 i
-- abans d'E2EE-1b. L'ordre amb el client és lliure: sense la migració, les
-- RPC absents són NO-DISPONIBLE i el client no xifra res. La inversa és al
-- final del fitxer, en un bloc comentat, i només esborra el que esta migració
-- crea. La prova estàtica és src/data/supabase/xatE2ee.migracio.test.js;
-- l'execució de veres (dues vegades i la inversa) la va fer la línia a
-- PGlite 0.3.16, fora del repositori; la de dues sessions és del Mestre.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Guardes ─────────────────────────────────────────────────────────────
do $$
begin
  if pg_catalog.to_regclass('public.xat_participants') is null
     or pg_catalog.to_regprocedure('private.es_participant(uuid)') is null
     or pg_catalog.to_regclass('public.xat_adjunts') is null
     or pg_catalog.to_regprocedure('public.desa_el_meu_usuari(text)') is null then
    raise exception 'SDP-XAT-900: falta la cadena pendent (fins a 2610282100); no es toca res.';
  end if;
end
$$;

-- ── 1 · Codificació (pures, sense definer; cap permís per al client) ────────
-- base64url sense farciment i canònic: tornar a codificar ha de donar la
-- mateixa cadena. p_bytes, si es dona, és la mida exacta esperada.
create or replace function private.xat_b64(p text, p_bytes integer default null)
returns bytea language plpgsql immutable set search_path = '' as $$
declare v bytea;
begin
  if p is null or p !~ '^[A-Za-z0-9_-]+$' or length(p) % 4 = 1 then
    raise exception 'SDP-XAT-040: codificació invàlida.' using errcode = '22023';
  end if;
  v := decode(translate(p, '-_', '+/') || repeat('=', (4 - length(p) % 4) % 4), 'base64');
  if (p_bytes is not null and octet_length(v) <> p_bytes)
     or rtrim(translate(encode(v, 'base64'), E'+/\n', '-_'), '=') <> p then
    raise exception 'SDP-XAT-040: codificació invàlida.' using errcode = '22023';
  end if;
  return v;
end
$$;
create or replace function private.xat_b64_enc(p bytea) returns text
language sql immutable set search_path = '' as $$
  select rtrim(translate(encode(p, 'base64'), E'+/\n', '-_'), '=');
$$;
create or replace function private.xat_uuid16(p uuid) returns bytea
language sql immutable set search_path = '' as $$
  select decode(replace(p::text, '-', ''), 'hex');
$$;
-- Llig un u32 big-endian; el desplaçament és en base 0, com get_byte.
create or replace function private.xat_u32(p bytea, p_d integer) returns bigint
language sql immutable set search_path = '' as $$
  select (get_byte(p, p_d)::bigint << 24) | (get_byte(p, p_d + 1)::bigint << 16)
       | (get_byte(p, p_d + 2)::bigint << 8) | get_byte(p, p_d + 3)::bigint;
$$;
-- La pública efímera d'HPKE com a JWK estricte: només kty, crv, x i y; mai d.
create or replace function private.xat_jwk_punt(p jsonb) returns bytea
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'SDP-XAT-040: clau pública invàlida.' using errcode = '22023';
  end if;
  if not coalesce((select count(*) from jsonb_object_keys(p)) = 4
       and p->>'kty' = 'EC' and p->>'crv' = 'P-256' and p ? 'x' and p ? 'y', false) then
    raise exception 'SDP-XAT-040: clau pública invàlida.' using errcode = '22023';
  end if;
  return '\x04'::bytea || private.xat_b64(p->>'x', 32) || private.xat_b64(p->>'y', 32);
end
$$;
-- La forma de la còpia (o de la frase sola): les claus exactes, iteracions i
-- llista com a nombres enters dins del rang que el servidor accepta (§5.1).
create or replace function private.xat_copia_forma(p jsonb, p_claus text[]) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'SDP-XAT-043: falta la còpia de recuperació.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p)) <> cardinality(p_claus) or not (p ?& p_claus)
     or jsonb_typeof(p->'iteracions') is distinct from 'number'
     or jsonb_typeof(p->'llista') is distinct from 'number'
     or (p->>'iteracions') !~ '^[0-9]{6,8}$' or (p->>'llista') !~ '^[0-9]{1,5}$' then
    raise exception 'SDP-XAT-043: còpia de recuperació invàlida.' using errcode = '22023';
  end if;
  if (p->>'iteracions')::integer not between 600000 and 10000000
     or (p->>'llista')::integer not between 1 and 32767 then
    raise exception 'SDP-XAT-043: còpia de recuperació invàlida.' using errcode = '22023';
  end if;
end
$$;
revoke execute on function private.xat_b64(text, integer), private.xat_b64_enc(bytea),
  private.xat_uuid16(uuid), private.xat_u32(bytea, integer), private.xat_jwk_punt(jsonb),
  private.xat_copia_forma(jsonb, text[])
  from public, anon, authenticated;

-- ── 2 · Registre de claus i còpia (blindatge 2 de MarIA) ────────────────────
create table if not exists public.xat_claus_usuari (
  kid bytea primary key,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  sig_pub bytea not null,
  dh_pub bytea not null,
  declaracio bytea not null,
  autofirma bytea not null,
  kid_anterior bytea,
  firma_continuitat bytea,
  creat_al timestamptz not null default now(),
  retirada_al timestamptz,
  backup_privat_ct bytea, backup_iv bytea,
  backup_rk_ct bytea, backup_rk_iv bytea, backup_sal bytea,
  backup_kdf text, backup_iteracions integer, backup_llista smallint, backup_al timestamptz,
  constraint xat_claus_usuari_forma check (coalesce(
    octet_length(kid) = 16
    and usuari_id <> '11111111-1a1a-0000-0000-000000000000'::uuid
    and octet_length(sig_pub) = 65 and get_byte(sig_pub, 0) = 4
    and octet_length(dh_pub) = 65 and get_byte(dh_pub, 0) = 4
    and octet_length(declaracio) = 175 and octet_length(autofirma) = 64
    and (kid_anterior is null or octet_length(kid_anterior) = 16)
    and (firma_continuitat is null
         or (octet_length(firma_continuitat) = 64 and kid_anterior is not null)), false)),
  constraint xat_claus_usuari_copia check (coalesce(
    (retirada_al is not null and backup_privat_ct is null and backup_rk_ct is null)
    or (retirada_al is null
        and octet_length(backup_privat_ct) = 241 and octet_length(backup_iv) = 12
        and octet_length(backup_rk_ct) = 48 and octet_length(backup_rk_iv) = 12
        and octet_length(backup_sal) = 16 and backup_kdf = 'PBKDF2-HMAC-SHA256'
        and backup_iteracions between 600000 and 10000000 and backup_llista >= 1
        and backup_al is not null), false))
);
create unique index if not exists xat_claus_usuari_activa
  on public.xat_claus_usuari (usuari_id) where retirada_al is null;
create index if not exists xat_claus_usuari_usuari_creat
  on public.xat_claus_usuari (usuari_id, creat_al);
alter table public.xat_claus_usuari enable row level security;
revoke all on table public.xat_claus_usuari from public, anon, authenticated, service_role;
grant select, delete on table public.xat_claus_usuari to service_role;

-- Les públiques no es canvien mai; només es retira i es renova la còpia.
create or replace function private.xat_claus_usuari_immobil() returns trigger
language plpgsql volatile security definer set search_path = '' as $$
begin
  if (new.kid, new.usuari_id, new.sig_pub, new.dh_pub, new.declaracio, new.autofirma,
      new.kid_anterior, new.firma_continuitat, new.creat_al)
     is distinct from (old.kid, old.usuari_id, old.sig_pub, old.dh_pub, old.declaracio,
      old.autofirma, old.kid_anterior, old.firma_continuitat, old.creat_al)
     or (old.retirada_al is not null and new.retirada_al is distinct from old.retirada_al) then
    raise exception 'SDP-XAT-038: una clau publicada no es pot reescriure.' using errcode = '42501';
  end if;
  return new;
end
$$;
revoke execute on function private.xat_claus_usuari_immobil() from public, anon, authenticated;
drop trigger if exists xat_claus_usuari_immobil on public.xat_claus_usuari;
create trigger xat_claus_usuari_immobil before update on public.xat_claus_usuari
  for each row execute function private.xat_claus_usuari_immobil();

-- ── 3 · Llibreta de seguretat (§5.5) ────────────────────────────────────────
create table if not exists public.xat_llibretes (
  usuari_id uuid primary key references auth.users(id) on delete cascade,
  kid bytea not null, comptador bigint not null, iv bytea not null, ct bytea not null,
  firma bytea not null, actualitzat_al timestamptz not null default now(),
  constraint xat_llibretes_forma check (coalesce(octet_length(kid) = 16 and comptador >= 1
    and octet_length(iv) = 12 and octet_length(ct) between 32 and 262144 and octet_length(firma) = 64, false))
);
alter table public.xat_llibretes enable row level security;
revoke all on table public.xat_llibretes from public, anon, authenticated, service_role;
grant select, delete on table public.xat_llibretes to service_role;

-- ── 4 · Contracte de dades d'IDEA-48 (les RPC arriben a F7) ─────────────────
-- Esmenat 261029 (QA-S02..QA-S06, §5.6; segona passada R5 i R8): declaració
-- amb versió i k = 3 exacte; un sol cercle vigent per persona; fragment
-- canònic de 33 B (aval de 49 B, alliberament de 113 B); màquina d'estats de
-- la petició, amb clau forana al cercle, caducitat en mil·lisegons exactes (la
-- de T i d'info_L) i el SDPN sencer en qualsevol estat; intents SAS. El sostre
-- de 8 alliberaments per petició i els límits d'intent del servidor els aplica
-- la RPC de F7 (no caben en un CHECK).
create table if not exists public.xat_cercles_recuperacio (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  repartiment_id uuid not null, kid bytea not null, versio integer not null,
  k smallint not null, n smallint not null,
  declaracio bytea not null, firma bytea not null,
  creat_al timestamptz not null default now(), retirat_al timestamptz,
  primary key (usuari_id, repartiment_id),
  constraint xat_cercles_recuperacio_forma check (coalesce(octet_length(kid) = 16 and versio >= 1
    and k = 3 and n between k and 255 and octet_length(declaracio) = 83 + 97 * n
    and octet_length(firma) = 64, false))
);
-- Un sol cercle vigent per persona: un canvi de kid o de RK el retira (§5.4, §5.6.5).
create unique index if not exists xat_cercles_recuperacio_vigent
  on public.xat_cercles_recuperacio (usuari_id) where retirat_al is null;
create table if not exists public.xat_avals_recuperacio (
  usuari_id uuid not null, repartiment_id uuid not null,
  amic_id uuid not null references auth.users(id) on delete cascade,
  amic_kid bytea not null, x smallint not null, enc_jwk jsonb not null, ct bytea not null,
  creat_al timestamptz not null default now(),
  primary key (usuari_id, repartiment_id, amic_id),
  unique (usuari_id, repartiment_id, x),
  foreign key (usuari_id, repartiment_id)
    references public.xat_cercles_recuperacio (usuari_id, repartiment_id) on delete cascade,
  constraint xat_avals_recuperacio_forma check (coalesce(octet_length(amic_kid) = 16 and x between 1 and 255
    and octet_length(ct) = 49 and octet_length(private.xat_jwk_punt(enc_jwk)) = 65, false))
);
create table if not exists public.xat_peticions_recuperacio (
  id uuid primary key, usuari_id uuid not null references auth.users(id) on delete cascade,
  repartiment_id uuid not null, kid bytea not null, epk bytea not null,
  estat text not null default 'oberta',
  -- «No sóc jo»: el SDPN sencer (61 B) i la firma, en qualsevol estat (disputa, §5.6.4).
  no_soc_jo_sdpn bytea, no_soc_jo_firma bytea, no_soc_jo_al timestamptz,
  creat_al timestamptz not null default now(),
  -- Mil·lisegons exactes: caduca_ms és l'u64 de T i d'info_L; cap timestamptz no l'arredonix.
  creat_ms bigint not null, caduca_ms bigint not null, tancat_al timestamptz,
  foreign key (usuari_id, repartiment_id)
    references public.xat_cercles_recuperacio (usuari_id, repartiment_id) on delete cascade,
  constraint xat_peticions_recuperacio_forma check (coalesce(
    octet_length(epk) = 65 and get_byte(epk, 0) = 4 and octet_length(kid) = 16
    and estat in ('oberta', 'completada', 'cancellada', 'no_soc_jo', 'caducada')
    and creat_ms > 0 and caduca_ms > creat_ms and caduca_ms <= creat_ms + 7200000
    and (no_soc_jo_sdpn is null) = (no_soc_jo_firma is null)
    and (no_soc_jo_sdpn is null) = (no_soc_jo_al is null)
    and (no_soc_jo_sdpn is null
         or (octet_length(no_soc_jo_sdpn) = 61 and octet_length(no_soc_jo_firma) = 64
             and substring(no_soc_jo_sdpn from 1 for 5) = '\x5344504e01'::bytea
             and substring(no_soc_jo_sdpn from 6 for 16) = private.xat_uuid16(usuari_id)
             and substring(no_soc_jo_sdpn from 22 for 16) = kid
             and substring(no_soc_jo_sdpn from 38 for 16) = private.xat_uuid16(id)))
    and (estat <> 'no_soc_jo' or no_soc_jo_sdpn is not null)
    and (estat = 'oberta') = (tancat_al is null), false))
);
create index if not exists xat_peticions_recuperacio_cercle
  on public.xat_peticions_recuperacio (usuari_id, repartiment_id, estat);
create table if not exists public.xat_verificacions_recuperacio (
  peticio_id uuid not null references public.xat_peticions_recuperacio(id) on delete cascade,
  amic_id uuid not null references auth.users(id) on delete cascade,
  intent smallint not null, compromis bytea not null, nonce_amic bytea, nonce_peticio bytea,
  estat text not null default 'compromes', creat_al timestamptz not null default now(),
  primary key (peticio_id, amic_id, intent),
  constraint xat_verificacions_recuperacio_forma check (coalesce(intent between 1 and 3
    and octet_length(compromis) = 32
    and estat in ('compromes', 'resposta', 'revelat', 'confirmat', 'rebutjat', 'caducat')
    and (nonce_amic is null or octet_length(nonce_amic) = 32)
    and (nonce_peticio is null or (octet_length(nonce_peticio) = 32 and nonce_amic is not null))
    and (estat not in ('resposta', 'revelat', 'confirmat') or nonce_amic is not null)
    and (estat not in ('revelat', 'confirmat') or nonce_peticio is not null), false))
);
create table if not exists public.xat_alliberaments_recuperacio (
  peticio_id uuid not null references public.xat_peticions_recuperacio(id) on delete cascade,
  amic_id uuid not null references auth.users(id) on delete cascade,
  repartiment_id uuid not null, x smallint not null, intent smallint not null,
  enc_jwk jsonb not null, ct bytea not null, creat_al timestamptz not null default now(),
  primary key (peticio_id, amic_id),
  unique (peticio_id, x),
  foreign key (peticio_id, amic_id, intent)
    references public.xat_verificacions_recuperacio (peticio_id, amic_id, intent),
  constraint xat_alliberaments_recuperacio_forma check (coalesce(x between 1 and 255
    and octet_length(ct) = 113 and octet_length(private.xat_jwk_punt(enc_jwk)) = 65, false))
);
alter table public.xat_cercles_recuperacio enable row level security;
alter table public.xat_avals_recuperacio enable row level security;
alter table public.xat_peticions_recuperacio enable row level security;
alter table public.xat_verificacions_recuperacio enable row level security;
alter table public.xat_alliberaments_recuperacio enable row level security;
revoke all on table public.xat_cercles_recuperacio from public, anon, authenticated, service_role;
revoke all on table public.xat_avals_recuperacio from public, anon, authenticated, service_role;
revoke all on table public.xat_peticions_recuperacio from public, anon, authenticated, service_role;
revoke all on table public.xat_verificacions_recuperacio from public, anon, authenticated, service_role;
revoke all on table public.xat_alliberaments_recuperacio from public, anon, authenticated, service_role;
grant select, delete on table public.xat_cercles_recuperacio to service_role;
grant select, delete on table public.xat_avals_recuperacio to service_role;
grant select, delete on table public.xat_peticions_recuperacio to service_role;
grant select, delete on table public.xat_verificacions_recuperacio to service_role;
grant select, delete on table public.xat_alliberaments_recuperacio to service_role;

-- ── 5 · Orígens admesos (defensa en profunditat; la llista la manté el Mestre)
create table if not exists private.xat_origens_xifrat (origen text primary key);
insert into private.xat_origens_xifrat (origen)
  values ('https://socdepoble.org'), ('capacitor://localhost'), ('https://localhost')
  on conflict do nothing;
alter table private.xat_origens_xifrat enable row level security;
revoke all on table private.xat_origens_xifrat from public, anon, authenticated, service_role;
-- L'Origin que PostgREST posa a request.headers (minúscules). Un navegador no
-- el deixa falsificar (IS-06); una capçalera que no és JSON val com a absent.
create or replace function private.xat_origen_admes() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_h jsonb;
begin
  begin
    v_h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return false;
  end;
  return exists (select 1 from private.xat_origens_xifrat o where o.origen = v_h ->> 'origin');
end
$$;
revoke execute on function private.xat_origen_admes() from public, anon, authenticated;

-- ── 6 · Ritme per persona i acció (10 cada 24 h, §7.4) ──────────────────────
create table if not exists private.xat_ritme_claus (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  accio text not null,
  al timestamptz not null,
  constraint xat_ritme_claus_accio check (accio in ('frase', 'rk'))
);
create index if not exists xat_ritme_claus_usuari_accio_al
  on private.xat_ritme_claus (usuari_id, accio, al);
alter table private.xat_ritme_claus enable row level security;
revoke all on table private.xat_ritme_claus from public, anon, authenticated, service_role;
-- Qui crida ja té el pany xat:identitat:<usuari>; p_ara és el rellotge de la crida.
create or replace function private.xat_ritme_claus_compta(p_usuari uuid, p_accio text, p_ara timestamptz, p_maxim integer)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_n integer;
begin
  delete from private.xat_ritme_claus r
   where r.usuari_id = p_usuari and r.accio = p_accio and r.al <= p_ara - interval '24 hours';
  select count(*) into v_n from private.xat_ritme_claus r where r.usuari_id = p_usuari and r.accio = p_accio;
  if v_n >= p_maxim then
    raise exception 'SDP-XAT-042: massa canvis seguits; torna-ho a provar demà.' using errcode = '42900';
  end if;
  insert into private.xat_ritme_claus (usuari_id, accio, al) values (p_usuari, p_accio, p_ara);
end
$$;
revoke execute on function private.xat_ritme_claus_compta(uuid, text, timestamptz, integer) from public, anon, authenticated;

-- ── 7 · RPC · xat_publica_identitat (comparar-i-canviar; §4.3, §7.4, §7.5) ──
-- SDPK v1 (base 1): màgia 1-5, usuari 6-21, sigPub 22-86, dhPub 87-151,
-- kidAnterior 152-167 (o zeros), u64be(creatMs) 168-175.
create or replace function public.xat_publica_identitat(p_kid_anterior text, p_declaracio text,
  p_autofirma text, p_firma_continuitat text, p_copia jsonb)
returns table (kid text)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
  v_ara timestamptz := now();
  v_d bytea;
  v_ant bytea;
  v_cont bytea;
  v_autofirma bytea;
  v_actiu bytea;
  v_sig bytea;
  v_dh bytea;
  v_kid bytea;
  v_repartiment uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  if v_jo = '11111111-1a1a-0000-0000-000000000000'::uuid then
    raise exception 'SDP-XAT-043: declaració de clau invàlida.' using errcode = '22023';
  end if;
  v_d := private.xat_b64(p_declaracio, 175);
  v_autofirma := private.xat_b64(p_autofirma, 64);
  v_ant := case when p_kid_anterior is null then null else private.xat_b64(p_kid_anterior, 16) end;
  v_cont := case when p_firma_continuitat is null then null else private.xat_b64(p_firma_continuitat, 64) end;
  v_sig := substring(v_d from 22 for 65);
  v_dh := substring(v_d from 87 for 65);
  if substring(v_d from 1 for 5) <> '\x5344504b01'::bytea
     or substring(v_d from 6 for 16) <> private.xat_uuid16(v_jo)
     or get_byte(v_sig, 0) <> 4 or get_byte(v_dh, 0) <> 4
     or substring(v_d from 152 for 16) <> coalesce(v_ant, '\x00000000000000000000000000000000'::bytea)
     or (v_cont is not null and v_ant is null) then
    raise exception 'SDP-XAT-043: declaració de clau invàlida.' using errcode = '22023';
  end if;
  v_kid := substring(sha256('\x5344504901'::bytea || private.xat_uuid16(v_jo) || v_sig || v_dh) from 1 for 16);
  -- Sense còpia no hi ha clau (decisió 2 del Mestre): la forma abans de tocar res.
  perform private.xat_copia_forma(p_copia, array['ct', 'iv', 'rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);
  -- Comparar i canviar: dues pestanyes o dos aparells no poden deixar una frase que no obri res.
  perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));
  select k.kid into v_actiu from public.xat_claus_usuari k
   where k.usuari_id = v_jo and k.retirada_al is null for update;
  -- Resposta perduda: la mateixa declaració, ja activa, és un èxit sense cap canvi.
  if v_actiu = v_kid then
    return query select private.xat_b64_enc(v_kid);
    return;
  end if;
  if v_actiu is distinct from v_ant then
    raise exception 'SDP-XAT-041: la clau del compte ha canviat en un altre aparell; restaura-la.' using errcode = '40001';
  end if;
  if (select count(*) from public.xat_claus_usuari k
       where k.usuari_id = v_jo and k.creat_al > v_ara - interval '24 hours') >= 5
     or (v_cont is null and v_ant is not null and (
          (select count(*) from public.xat_claus_usuari k where k.usuari_id = v_jo
             and k.kid_anterior is not null and k.firma_continuitat is null
             and k.creat_al > v_ara - interval '24 hours') >= 1
       or (select count(*) from public.xat_claus_usuari k where k.usuari_id = v_jo
             and k.kid_anterior is not null and k.firma_continuitat is null
             and k.creat_al > v_ara - interval '30 days') >= 3)) then
    raise exception 'SDP-XAT-042: massa canvis de clau; espera o restaura amb la frase.' using errcode = '42900';
  end if;
  update public.xat_claus_usuari k set retirada_al = v_ara,
    backup_privat_ct = null, backup_iv = null, backup_rk_ct = null, backup_rk_iv = null,
    backup_sal = null, backup_kdf = null, backup_iteracions = null, backup_llista = null, backup_al = null
  where k.usuari_id = v_jo and k.retirada_al is null;
  -- Esmena R9: el cercle d'IDEA-48 va lligat al kid; un kid nou el retira en la mateixa transacció.
  update public.xat_cercles_recuperacio c set retirat_al = v_ara
   where c.usuari_id = v_jo and c.retirat_al is null
  returning c.repartiment_id into v_repartiment;
  if v_repartiment is not null then
    delete from public.xat_avals_recuperacio a where a.usuari_id = v_jo and a.repartiment_id = v_repartiment;
    update public.xat_peticions_recuperacio p set estat = 'caducada', tancat_al = v_ara
     where p.usuari_id = v_jo and p.repartiment_id = v_repartiment and p.estat = 'oberta';
  end if;
  insert into public.xat_claus_usuari (kid, usuari_id, sig_pub, dh_pub, declaracio, autofirma,
    kid_anterior, firma_continuitat, creat_al, backup_privat_ct, backup_iv, backup_rk_ct, backup_rk_iv,
    backup_sal, backup_kdf, backup_iteracions, backup_llista, backup_al)
  values (v_kid, v_jo, v_sig, v_dh, v_d, v_autofirma, v_ant, v_cont, v_ara,
    private.xat_b64(p_copia->>'ct', 241), private.xat_b64(p_copia->>'iv', 12),
    private.xat_b64(p_copia->>'rk_ct', 48), private.xat_b64(p_copia->>'rk_iv', 12),
    private.xat_b64(p_copia->>'sal', 16), 'PBKDF2-HMAC-SHA256',
    (p_copia->>'iteracions')::integer, (p_copia->>'llista')::smallint, v_ara);
  return query select private.xat_b64_enc(v_kid);
end
$$;
revoke execute on function public.xat_publica_identitat(text, text, text, text, jsonb) from public, anon;
grant execute on function public.xat_publica_identitat(text, text, text, text, jsonb) to authenticated;

-- ── 8 · RPC · xat_la_meua_identitat (l'activa i la història pròpies) ────────
create or replace function public.xat_la_meua_identitat()
returns table (kid text, sig_pub text, dh_pub text, declaracio text, autofirma text, kid_anterior text,
  firma_continuitat text, creat_al timestamptz, retirada_al timestamptz, copia jsonb)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  return query
  select private.xat_b64_enc(k.kid), private.xat_b64_enc(k.sig_pub), private.xat_b64_enc(k.dh_pub),
    private.xat_b64_enc(k.declaracio), private.xat_b64_enc(k.autofirma), private.xat_b64_enc(k.kid_anterior),
    private.xat_b64_enc(k.firma_continuitat), k.creat_al, k.retirada_al,
    case when k.retirada_al is null and k.backup_privat_ct is not null then jsonb_build_object(
      'ct', private.xat_b64_enc(k.backup_privat_ct), 'iv', private.xat_b64_enc(k.backup_iv),
      'rk_ct', private.xat_b64_enc(k.backup_rk_ct), 'rk_iv', private.xat_b64_enc(k.backup_rk_iv),
      'sal', private.xat_b64_enc(k.backup_sal), 'kdf', k.backup_kdf,
      'iteracions', k.backup_iteracions, 'llista', k.backup_llista, 'al', k.backup_al) end
  from public.xat_claus_usuari k
  where k.usuari_id = v_jo
  order by k.creat_al, k.kid;
end
$$;
revoke execute on function public.xat_la_meua_identitat() from public, anon;
grant execute on function public.xat_la_meua_identitat() to authenticated;

-- ── 9 · RPC · xat_desa_frase (frase nova sense canviar d'identitat, D-07) ───
create or replace function public.xat_desa_frase(p_kid text, p_frase jsonb)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare
  v_jo uuid := (select auth.uid());
  v_ara timestamptz := now();
  v_kid bytea;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  v_kid := private.xat_b64(p_kid, 16);
  perform private.xat_copia_forma(p_frase, array['rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);
  perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));
  perform 1 from public.xat_claus_usuari k
   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null for update;
  if not found then
    raise exception 'SDP-XAT-033: la teua clau no és l''activa.' using errcode = '42501';
  end if;
  perform private.xat_ritme_claus_compta(v_jo, 'frase', v_ara, 10);
  update public.xat_claus_usuari k
     set backup_rk_ct = private.xat_b64(p_frase->>'rk_ct', 48), backup_rk_iv = private.xat_b64(p_frase->>'rk_iv', 12),
         backup_sal = private.xat_b64(p_frase->>'sal', 16), backup_iteracions = (p_frase->>'iteracions')::integer,
         backup_llista = (p_frase->>'llista')::smallint, backup_al = v_ara
   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null;
  return true;
end
$$;
revoke execute on function public.xat_desa_frase(text, jsonb) from public, anon;
grant execute on function public.xat_desa_frase(text, jsonb) to authenticated;

-- ── 10 · RPC · xat_claus_de (públiques i història, sense còpies; CS-24) ─────
create or replace function public.xat_claus_de(p_usuaris uuid[])
returns table (usuari_id uuid, kid text, sig_pub text, dh_pub text, declaracio text, autofirma text,
  kid_anterior text, firma_continuitat text, creat_al timestamptz, retirada_al timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  if p_usuaris is null or cardinality(p_usuaris) not between 1 and 256 then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  return query
  select k.usuari_id, private.xat_b64_enc(k.kid), private.xat_b64_enc(k.sig_pub),
    private.xat_b64_enc(k.dh_pub), private.xat_b64_enc(k.declaracio), private.xat_b64_enc(k.autofirma),
    private.xat_b64_enc(k.kid_anterior), private.xat_b64_enc(k.firma_continuitat), k.creat_al, k.retirada_al
  from public.xat_claus_usuari k
  where k.usuari_id = any (p_usuaris)
    -- Només de qui compartix algun fil amb qui pregunta (i d'una mateixa).
    and (k.usuari_id = v_jo or exists (
      select 1 from public.xat_participants jo
      join public.xat_participants ell on ell.fil_id = jo.fil_id and ell.usuari_id = k.usuari_id
      where jo.usuari_id = v_jo and private.es_participant(jo.fil_id)))
  order by k.usuari_id, k.creat_al, k.kid;
end
$$;
revoke execute on function public.xat_claus_de(uuid[]) from public, anon;
grant execute on function public.xat_claus_de(uuid[]) to authenticated;

-- ── 11 · RPC · xat_desa_llibreta i xat_la_meua_llibreta (§5.5) ──────────────
create or replace function public.xat_desa_llibreta(p_comptador bigint, p_llibreta jsonb)
returns bigint language plpgsql volatile security definer set search_path = '' as $$
declare
  v_jo uuid := (select auth.uid());
  v_ara timestamptz := now();
  v_kid bytea;
  v_ct bytea;
  v_actual bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  if p_comptador is null or p_comptador < 1 or jsonb_typeof(p_llibreta) is distinct from 'object' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p_llibreta)) <> 4
     or not (p_llibreta ?& array['kid', 'iv', 'ct', 'firma']) then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  v_kid := private.xat_b64(p_llibreta->>'kid', 16);
  v_ct := private.xat_b64(p_llibreta->>'ct');
  if octet_length(v_ct) not between 32 and 262144 then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));
  perform 1 from public.xat_claus_usuari k
   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null for share;
  if not found then
    raise exception 'SDP-XAT-033: la teua clau no és l''activa.' using errcode = '42501';
  end if;
  select l.comptador into v_actual from public.xat_llibretes l where l.usuari_id = v_jo for update;
  if found and v_actual >= p_comptador then
    raise exception 'SDP-XAT-044: la llibreta del servidor és més nova; torna-la a llegir.' using errcode = '40001';
  end if;
  insert into public.xat_llibretes (usuari_id, kid, comptador, iv, ct, firma, actualitzat_al)
  values (v_jo, v_kid, p_comptador, private.xat_b64(p_llibreta->>'iv', 12), v_ct,
    private.xat_b64(p_llibreta->>'firma', 64), v_ara)
  on conflict (usuari_id) do update
    set kid = excluded.kid, comptador = excluded.comptador, iv = excluded.iv, ct = excluded.ct,
        firma = excluded.firma, actualitzat_al = excluded.actualitzat_al;
  return p_comptador;
end
$$;
revoke execute on function public.xat_desa_llibreta(bigint, jsonb) from public, anon;
grant execute on function public.xat_desa_llibreta(bigint, jsonb) to authenticated;

create or replace function public.xat_la_meua_llibreta()
returns table (kid text, comptador bigint, iv text, ct text, firma text, actualitzat_al timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  return query
  select private.xat_b64_enc(l.kid), l.comptador, private.xat_b64_enc(l.iv), private.xat_b64_enc(l.ct),
    private.xat_b64_enc(l.firma), l.actualitzat_al
  from public.xat_llibretes l
  where l.usuari_id = v_jo;
end
$$;
revoke execute on function public.xat_la_meua_llibreta() from public, anon;
grant execute on function public.xat_la_meua_llibreta() to authenticated;

-- ── 12 · RPC · xat_canvia_rk (nivell 3 de §5.6.5; esmena R3 i Codex E2EE-I03)
-- p_hash_copia: el SHA-256 (base64url) de la backup_privat_ct viva que
-- l'aparell ha llegit; p_copia: {ct, iv, rk_ct, rk_iv, sal, iteracions,
-- llista} sota la RK nova; p_llibreta: {comptador, kid, iv, ct, firma} tornada
-- a xifrar amb la K_ll nova. Tot o res.
create or replace function public.xat_canvia_rk(p_kid text, p_hash_copia text, p_copia jsonb, p_llibreta jsonb)
returns table (hash_copia text, comptador bigint)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
  v_ara timestamptz := now();
  v_kid bytea;
  v_hash bytea;
  v_viva bytea;
  v_ct bytea;
  v_lct bytea;
  v_comptador bigint;
  v_actual bigint;
  v_repartiment uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.xat_origen_admes() then
    raise exception 'SDP-XAT-045: els xats privats només es preparen a l''app o a socdepoble.org.' using errcode = '42501';
  end if;
  v_kid := private.xat_b64(p_kid, 16);
  v_hash := private.xat_b64(p_hash_copia, 32);
  perform private.xat_copia_forma(p_copia, array['ct', 'iv', 'rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);
  if jsonb_typeof(p_llibreta) is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_llibreta)) <> 5
     or not (p_llibreta ?& array['comptador', 'kid', 'iv', 'ct', 'firma'])
     or jsonb_typeof(p_llibreta->'comptador') is distinct from 'number'
     or (p_llibreta->>'comptador') !~ '^[0-9]{1,18}$' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  v_comptador := (p_llibreta->>'comptador')::bigint;
  v_lct := private.xat_b64(p_llibreta->>'ct');
  -- La llibreta la firma la mateixa clau activa que es renova.
  if v_comptador < 1 or private.xat_b64(p_llibreta->>'kid', 16) <> v_kid
     or octet_length(v_lct) not between 32 and 262144 then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));
  select k.backup_privat_ct into v_viva from public.xat_claus_usuari k
   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null for update;
  if not found then
    raise exception 'SDP-XAT-033: la teua clau no és l''activa.' using errcode = '42501';
  end if;
  -- Comparar i canviar sobre la còpia viva: cap estat amb la còpia i el cercle de RK diferents.
  if v_viva is null or sha256(v_viva) <> v_hash then
    raise exception 'SDP-XAT-046: la còpia ha canviat en un altre aparell; torna a començar el canvi.' using errcode = '40001';
  end if;
  perform private.xat_ritme_claus_compta(v_jo, 'rk', v_ara, 10);
  select l.comptador into v_actual from public.xat_llibretes l where l.usuari_id = v_jo for update;
  if found and v_actual >= v_comptador then
    raise exception 'SDP-XAT-044: la llibreta del servidor és més nova; torna-la a llegir.' using errcode = '40001';
  end if;
  v_ct := private.xat_b64(p_copia->>'ct', 241);
  update public.xat_claus_usuari k
     set backup_privat_ct = v_ct, backup_iv = private.xat_b64(p_copia->>'iv', 12),
         backup_rk_ct = private.xat_b64(p_copia->>'rk_ct', 48), backup_rk_iv = private.xat_b64(p_copia->>'rk_iv', 12),
         backup_sal = private.xat_b64(p_copia->>'sal', 16), backup_iteracions = (p_copia->>'iteracions')::integer,
         backup_llista = (p_copia->>'llista')::smallint, backup_al = v_ara
   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null;
  insert into public.xat_llibretes (usuari_id, kid, comptador, iv, ct, firma, actualitzat_al)
  values (v_jo, v_kid, v_comptador, private.xat_b64(p_llibreta->>'iv', 12), v_lct,
    private.xat_b64(p_llibreta->>'firma', 64), v_ara)
  on conflict (usuari_id) do update
    set kid = excluded.kid, comptador = excluded.comptador, iv = excluded.iv, ct = excluded.ct,
        firma = excluded.firma, actualitzat_al = excluded.actualitzat_al;
  -- Esmena R9: una RK nova retira el cercle vell en la mateixa transacció.
  update public.xat_cercles_recuperacio c set retirat_al = v_ara
   where c.usuari_id = v_jo and c.retirat_al is null
  returning c.repartiment_id into v_repartiment;
  if v_repartiment is not null then
    delete from public.xat_avals_recuperacio a where a.usuari_id = v_jo and a.repartiment_id = v_repartiment;
    update public.xat_peticions_recuperacio p set estat = 'caducada', tancat_al = v_ara
     where p.usuari_id = v_jo and p.repartiment_id = v_repartiment and p.estat = 'oberta';
  end if;
  return query select private.xat_b64_enc(sha256(v_ct)), v_comptador;
end
$$;
revoke execute on function public.xat_canvia_rk(text, text, jsonb, jsonb) from public, anon;
grant execute on function public.xat_canvia_rk(text, text, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;

-- ============================================================================
-- INVERSA (no s'executa amb la migració: el Mestre la copia sencera, sense
-- els «-- », si cal desfer-la). Només esborra el que esta migració crea; cap
-- taula ni funció d'abans no es toca. Si public.xat_claus_usuari ja té files,
-- esborrar-les és perdre còpies de recuperació de persones de veres: decisió
-- del Mestre, no d'un agent. Ordre: les RPC, el ritme, els orígens, les
-- taules d'IDEA-48 (filles abans que mares), la llibreta, el registre amb el
-- seu disparador i, al final, les ajudes de codificació (els CHECK d'IDEA-48
-- les usen).
-- begin;
-- drop function if exists public.xat_canvia_rk(text, text, jsonb, jsonb);
-- drop function if exists public.xat_la_meua_llibreta();
-- drop function if exists public.xat_desa_llibreta(bigint, jsonb);
-- drop function if exists public.xat_claus_de(uuid[]);
-- drop function if exists public.xat_desa_frase(text, jsonb);
-- drop function if exists public.xat_la_meua_identitat();
-- drop function if exists public.xat_publica_identitat(text, text, text, text, jsonb);
-- drop function if exists private.xat_ritme_claus_compta(uuid, text, timestamptz, integer);
-- drop table if exists private.xat_ritme_claus;
-- drop function if exists private.xat_origen_admes();
-- drop table if exists private.xat_origens_xifrat;
-- drop table if exists public.xat_alliberaments_recuperacio;
-- drop table if exists public.xat_verificacions_recuperacio;
-- drop table if exists public.xat_peticions_recuperacio;
-- drop table if exists public.xat_avals_recuperacio;
-- drop table if exists public.xat_cercles_recuperacio;
-- drop table if exists public.xat_llibretes;
-- drop trigger if exists xat_claus_usuari_immobil on public.xat_claus_usuari;
-- drop function if exists private.xat_claus_usuari_immobil();
-- drop table if exists public.xat_claus_usuari;
-- drop function if exists private.xat_copia_forma(jsonb, text[]);
-- drop function if exists private.xat_jwk_punt(jsonb);
-- drop function if exists private.xat_u32(bytea, integer);
-- drop function if exists private.xat_uuid16(uuid);
-- drop function if exists private.xat_b64_enc(bytea);
-- drop function if exists private.xat_b64(text, integer);
-- notify pgrst, 'reload schema';
-- commit;
-- ============================================================================

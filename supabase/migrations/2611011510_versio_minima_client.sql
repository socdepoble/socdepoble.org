-- ============================================================================
-- 261101_1510 · P0-23 (BOT-A2; Gauntlet Claude 261025_1705) · La versió
-- mínima de l'app nativa que el node encara servix
--
-- Procedència: el pegat versio.patch del torn 261025_1705 (la migració s'hi
-- deia 2610251930), rebasat a l'assalt 261101 amb un nom nou perquè no vaja
-- per davant de migracions que el node remot ja pot tindre aplicades.
--
-- PER QUÈ: cap mecanisme no obligava a actualitzar l'app de les botigues.
-- Quan el servidor canvia una regla que un binari vell no sap complir
-- (2610241400 exigix les normes '2026-10-24' i el build 1 només sap acceptar
-- les '2026-10-20'), l'app instal·lada continua oberta, però ja no pot
-- publicar ni xatejar i no sap dir per què. Amb esta funció, l'app nativa
-- (src/natiu/entrada.jsx) pregunta en arrencar quina és la versió mínima de
-- la seua plataforma i, si la seua (VERSIO_CLIENT_NATIU, src/data/contracte.js)
-- és més vella, pinta una pantalla que demana actualitzar-la, amb l'enllaç
-- de la botiga i el de la web.
--
-- QUÈ FA:
--   1. public.versio_minima_client(p_plataforma text) → jsonb: per a 'ios' i
--      'android', { "versio_minima": enter, "enllac": text https o null };
--      per a qualsevol altra plataforma (la web, WordPress, null), null.
--      Els valors viuen al cos de la funció: pujar el mínim vol dir tornar a
--      crear-la en una migració nova, com private.versio_normes_vigent()
--      (2610241400). LANGUAGE sql, STABLE, SECURITY INVOKER (no llig cap
--      taula: no li cal cap privilegi) i el search_path buit.
--   2. L'executen anon i authenticated: l'app la crida abans de tindre
--      sessió. Primer el revoke a tots els rols i després un grant explícit.
--
-- QUÈ NO FA:
--   · No protegix el build 1 (TestFlight 1.0.0 (1) i l'AAB 1.0.0+1): no porta
--     el codi de la porta. Per al build 1 només hi ha les palanques de les
--     botigues (fer caducar el build de TestFlight i retirar l'APK beta).
--   · No bloqueja res al servidor: és només una pregunta. Si l'app no hi
--     arriba (sense xarxa, la funció absent, un error), entra igual
--     (fail-open). Les regles noves les exigix cada migració (2610241400).
--   · La web i el connector de WordPress no la pregunten mai.
--   · Cap taula, cap política, cap dada personal, del poble ni de la sessió:
--     dues constants per plataforma.
--
-- CODIS: cap. No llança: una plataforma desconeguda torna null.
--
-- Depén de: res.
--
-- ORDRE (decisió del Mestre): independent de 2610241400. Amb el mínim a 2
-- (VERSIO_CLIENT_NATIU = 2) no deixa fora ningú: el build 1 no pregunta res
-- i el build 2 entra. Es pot aplicar en qualsevol moment, en l'ordre
-- alfabètic de supabase/README.md; l'única condició és que vaja abans de la
-- primera migració que apuge el mínim. 2610241400 manté la seua (després del
-- build 2 als provadors, P0-21), i esta porta no la canvia. L'enllaç
-- d'iOS queda null fins que se sàpiga l'adreça de l'App Store (l'app només
-- hi ensenya la web); el d'Android és el de Google Play del paquet
-- org.socdepoble.app. Per a
-- deixar fora un build N més endavant: una migració nova que torne a crear
-- esta funció amb el mínim N+1 i l'enllaç on es baixa, quan el build N+1 ja
-- hi siga. Mai un mínim més alt que el VERSIO_CLIENT_NATIU del codi que s'ha
-- publicat: l'app nova es bloquejaria ella mateixa
-- (src/data/supabase/versioMinimaClient.migracio.test.js ho guarda, i
-- scripts/botigues/puja-*.mjs només pugen un --build igual a la constant).
-- Verificació posterior (lectura):
--   select public.versio_minima_client('ios'), public.versio_minima_client('android'), public.versio_minima_client('web');
--   (els dos objectes, amb versio_minima 2, i null).
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · La versió mínima de cada plataforma ─────────────────────────────────
create or replace function public.versio_minima_client(p_plataforma text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object('versio_minima', v.versio_minima, 'enllac', v.enllac)
    from (values
      ('ios', 2, null::text),
      ('android', 2, 'https://play.google.com/store/apps/details?id=org.socdepoble.app')
    ) as v (plataforma, versio_minima, enllac)
   where v.plataforma = p_plataforma;
$$;

-- ── 2 · Qui la pot cridar ───────────────────────────────────────────────────
revoke all on function public.versio_minima_client(text) from public, anon, authenticated, service_role;
grant execute on function public.versio_minima_client(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;

-- ============================================================================
-- 261018_1800 · Pla 261018_1605 · Tasca 1 (D2) · El perfil d'una persona naix
-- públic: profiles.is_public passa a tindre `default true`
-- Ordre del Mestre (18-10-2026; pla
-- 261018_1605_pla_implementacio_perfil_public_multimedia_i_poble.md, Tasca 1):
-- la fitxa d'una persona és pública per defecte, perquè el veïnat la puga
-- trobar, i la persona la pot fer privada quan vulga.
--
-- PER QUÈ NOMÉS EL DEFAULT:
--   · «Públic» d'una persona és public.profiles.is_public. La columna naix
--     `boolean default false` (2609110600 i 2610042350), i les tres funcions
--     que alcen la fila pròpia (el trigger d'alta handle_new_user, la
--     reparació completa_la_meua_alta i l'RPC que crea una organització, que
--     també alça la fila de qui la crea) no hi escriuen is_public: la fila pren
--     el default. Canviar el default les cobrix totes tres sense redefinir-ne
--     cap.
--   · profiles.visibility no es toca: el seu CHECK (visibility = 'private',
--     2609080000) continua igual, i la política de l'alta continua exigint
--     'private'. La publicació d'una persona la diu is_public, no visibility.
--   · Cap backfill: les fitxes que ja existixen es queden com estan. Una
--     persona que no ha publicat la seua fitxa no la troba publicada l'endemà
--     sense haver-ho triat. El client ja tracta un is_public absent com a
--     públic (perfilCamps.fitxaPublicada, la fila de reserva d'auth.js).
--
-- QUÈ FA (només public.profiles):
--   1. `alter column is_public set default true`. Cap dada, cap fila, cap
--      restricció, cap permís, cap política, cap funció. En una base
--      desfasada sense la columna (vegeu 2610042350 al catàleg), la sentència
--      falla i la transacció sencera no canvia res: primer cal la columna.
--
-- Fora d'abast: cap UPDATE de files, cap canvi del CHECK de visibility, cap
-- funció redefinida, cap columna nova, cap permís. Idempotent: una segona
-- execució no canvia res.
--
-- Revisada i NO aplicada a cap base de dades. L'aplica el Mestre, mai un
-- agent, DESPRÉS de les pendents del supabase/README.md, en ordre alfabètic.
-- No espera cap client nou: el client publicat no envia is_public en l'alta.
-- Abans d'aplicar-la, executeu a l'editor SQL esta consulta de només lectura
-- i guardeu-ne el resultat (és el que permet desfer-la):
--   1. El default vigent de la columna:
--      select column_name, column_default, is_nullable from information_schema.columns
--       where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_public';
-- Després d'aplicar-la, la mateixa consulta ha de dir `column_default = true`.
-- Per a desfer-la (si la consulta deia false):
--   alter table public.profiles alter column is_public set default false;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.profiles alter column is_public set default true;

notify pgrst, 'reload schema';
commit;

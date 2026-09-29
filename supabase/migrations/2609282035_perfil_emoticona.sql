-- ============================================================================
-- 260928_2035 · T66 · L'emoticona de la fitxa de la persona (profiles.icon)
-- Ordre del Mestre (260928): en edició, l'espai central de la barra taronja
-- del Perfil és un botó que tria l'emoticona de la fitxa, i la tria es desa
-- al servidor amb l'autodesament de la resta de camps.
--
--   1. public.profiles.icon: text, admet null (null = sense emoticona). És el
--      mateix camp cru `icon` dels documents: un sol emoji, com diu emojiSol
--      (src/utils/emoji.js). Postgres no té \p{Emoji}: la forma la valida el
--      client en desar i la torna a aplicar en llegir; ací només la llargària.
--   2. CHECK profiles_icon_llargaria: char_length(icon) <= 16 punts de codi.
--      Les seqüències RGI més llargues en fan uns 10; el límit posa fita a una
--      cadena ZWJ abusiva. Font única al client: src/data/limitsText.js
--      (MAXIM_EMOTICONA); src/data/limitsText.test.js llig este fitxer.
--   3. Permís de columna per a l'UPDATE de la fitxa pròpia. La lectura ja la
--      dona el SELECT de taula d'authenticated (260908_0000). Les polítiques
--      «profiles update own» (260911_0600) i «profiles sense baixa»
--      (260926_1500) ja limiten l'UPDATE a la fila pròpia i fora de la baixa.
--      Cap vista ni RPC exposa profiles columna a columna: no se'n refà cap.
--
-- Fora d'abast, com a deute declarat: les organitzacions i els agents (la
-- seua fitxa continua sense emoticona al servidor), la baixa (les funcions de
-- baixa i de cancel·lació no la retiren ni la tornen, igual que copyright) i
-- les notes.
--
-- Additiva i idempotent: es pot tornar a executar. Cap taula, política ni
-- funció noves. Revisada i NO aplicada a cap base de dades: s'ha d'aplicar
-- DESPRÉS de 2609281500 i ABANS de publicar el client. Sense ella, el desat
-- de l'emoticona queda en quarantena al dispositiu amb l'avís «Este camp
-- encara no té columna» (PGRST204) i no es perd.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columna ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists icon text;

-- ── 2 · CHECK de la llargària ───────────────────────────────────────────────
-- Es torna a crear sencer a cada execució: una segona passada deixa la
-- mateixa restricció, amb el mateix nom.
alter table public.profiles
  drop constraint if exists profiles_icon_llargaria;
alter table public.profiles
  add constraint profiles_icon_llargaria check (char_length(icon) <= 16);

-- ── 3 · Permís de columna ───────────────────────────────────────────────────
grant update (icon) on table public.profiles to authenticated;

notify pgrst, 'reload schema';
commit;

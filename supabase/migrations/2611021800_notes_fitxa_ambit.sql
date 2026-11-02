-- ============================================================================
-- 261102_1800 · IDEA-61 (T0, prompt 261102_1532; carril L1) · Notes: la fitxa
-- d'àmbit del Flux Universal de Publicació (Mur <-> Mercat · Compartir cotxe ·
-- Treball · Habitatge)
--
-- PER QUÈ: una nota del Bloc pot ser una fitxa d'un àmbit vertical (mercat,
-- vehicle, treball o habitatge). El client (src/sections/notes/NotesContext.jsx
-- · publishNote) la projecta al payload de section_submissions amb el
-- contracte src/utils/publicacioUniversal.js; però la fitxa de l'esborrany ha
-- de viure a la nota, com l'emoticona (icon, 2609282035 al perfil; T47b a la
-- nota) i la data (publish_date), perquè «Actualitzar al Mur» i el canvi
-- d'estat (Disponible / Reservat / Complet / Tancat) tornen a publicar el
-- payload sencer amb el mateix id.
--
-- QUÈ FA:
--   1. public.notes.fitxa jsonb (null a les notes de sempre): un sol objecte
--      { ambit, estat, dades }, amb el CHECK lleuger notes_fitxa_objecte
--      (null o jsonb_typeof = 'object'). La forma de dins la coacciona el
--      client en escriure-la i en llegir-la (coaccionaAmbit: àmbit tancat,
--      estat tancat, dades només amb els camps de l'àmbit i primitius); ací
--      només es garantix que és un objecte, com notes.origen (2609272100).
--   2. El comentari de la columna.
--
-- QUÈ NO FA:
--   · Cap política, permís, índex, funció, disparador ni backfill:
--     authenticated ja té INSERT i UPDATE sobre la taula sencera (2609140000)
--     i les quatre polítiques de propietari continuen manant.
--   · No toca section_submissions: la fitxa publicada viu al payload jsonb de
--     la fila de 'mur' o de 'mercat' (cap section_id nou).
--   · No valida els camps de dins: ho fa el client i, fins que s'aplique, la
--     columna opcional queda en quarantena al dispositiu
--     (src/data/supabase/columnesOpcionals.js, PGRST204), sense perdre res.
--
-- Depén de: 2609140000 (public.notes).
-- ORDRE: additiva i idempotent; en qualsevol moment després de 2609140000.
-- Abans (lectura), ha de donar fals:
--   select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'fitxa') as te_fitxa;
-- Verificació posterior (lectura):
--   select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'fitxa') as te_fitxa, exists (select 1 from pg_constraint where conname = 'notes_fitxa_objecte') as te_check;
--   (cert i cert).
-- Per a desfer-la: alter table public.notes drop column if exists fitxa;
-- La prova estàtica és src/data/supabase/notesFitxa.migracio.test.js.
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.notes
  add column if not exists fitxa jsonb
    constraint notes_fitxa_objecte check (fitxa is null or jsonb_typeof(fitxa) = 'object');

comment on column public.notes.fitxa is
  'IDEA-61 · La fitxa d''àmbit d''una nota del Flux Universal de Publicació: {ambit: mercat | vehicle | treball | habitatge, estat: disponible | reservat | complet | tancat, dades: els camps de l''àmbit}. Null a les notes de sempre.';

notify pgrst, 'reload schema';
commit;

-- ============================================================================
-- 260927_2100 · Notes: l'origen d'una nota connectada (Lògica d'Usuari, T5)
-- Prompt 260927_1925_prompt_logica_usuari (actualització de requisits T5).
--
-- Una connexió («Connectar» sobre un element d'altri) és una nota del MAS de
-- qui connecta. La nota recorda d'on ve a `origen`:
--   { "tipus": "connexio", "sectionId", "itemId", "titol",
--     "autorId", "autorNom", "autorTipus", "ruta" }
-- i per això l'editor canvia «Publicar» per «Compartir» encara que la nota
-- canvie de carpeta. El client (src/data/origenNota.js) neteja i acota cada
-- camp abans d'enviar-lo; ací només es garantix la forma.
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260914_0000
-- (taula notes) aplicada. Cap permís nou: authenticated ja té INSERT i UPDATE
-- sobre la taula sencera, i les quatre polítiques de propietari continuen
-- manant. Revisada i NO aplicada a cap base de dades.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.notes
  add column if not exists origen jsonb
    constraint notes_origen_objecte check (origen is null or jsonb_typeof(origen) = 'object');

comment on column public.notes.origen is
  'D''on ve una nota connectada (T5): {tipus: connexio, sectionId, itemId, titol, autorId, autorNom, autorTipus, ruta}. Null a les notes pròpies.';

notify pgrst, 'reload schema';
commit;

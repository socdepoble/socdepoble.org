-- P0-75 / IDEA-206 · Esquema i RPC de Referència del Brain de Saviesa del Node 0
-- URI lògiques sanejades (saber://...) sense exposar rutes físiques privades i amb revocació explícita d'anon.
begin;

create or replace function public.llista_inventari_brain_node0(
  p_branca_id text default 'totes',
  p_cerca text default ''
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'branques', coalesce((select jsonb_agg(b order by b.ordre) from public.branques_saber b where b.activa = true), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'branca_id', d.branca_id,
          'tipus_document', d.tipus_document,
          'titol', d.titol,
          'autoria', d.autoria,
          'poble', d.poble,
          'estat', d.estat,
          'metriques', d.metriques,
          'ubicacio_node0', regexp_replace(d.ubicacio_node0, '^(_gestoria_de_poble|_menjar_i_beure_de_poble|_cultura_de_poble|_wiki_de_poble)/', 'saber://'),
          'ruta_app', d.ruta_app
        ) order by d.ordre
      )
      from public.inventari_brain_node0 d
      where (p_branca_id = 'totes' or d.branca_id = p_branca_id)
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.llista_inventari_brain_node0(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.llista_inventari_brain_node0(text, text) TO authenticated, service_role;

commit;

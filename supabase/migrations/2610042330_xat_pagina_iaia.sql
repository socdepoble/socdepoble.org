-- ============================================================================
-- 261004_2330 · Ruta canònica del xat de la pàgina /iaia
-- Correcció posterior a 2609282100_xat_de_pagina.sql; no reescriu la història.
-- Revisada i NO aplicada a cap base de dades. Depén de la migració de pàgina
-- i de les seues dependències. No substituïx la condició de moderació prèvia.
--
-- private.xat_subjecte conserva literalment les branques i permisos previs,
-- amb /iaia a la llista tancada del client. Només l'entrada antiga exacta /ia
-- és un àlies: tant /ia com /iaia resolen clau i ruta /iaia abans del bloqueig
-- de la RPC existent. No s'accepta cap prefix, ruta privada ni ruta del client.
--
-- La fila antiga es reanomena dins d'una transacció, preservant id, missatges,
-- seq, participants i permisos. Si un poble ja té dos fils (/ia i /iaia) del
-- mateix tipus, SDP-XAT-014 avorta TOTA la migració: fusionar histories o
-- marques requereix un pla explícit; ací no es tria ni s'esborra cap fil.
-- El CHECK posterior impedeix que una RPC antiga encara en vol recree /ia.
-- La ruta i el títol es refresquen; una URI antiga acabada en /ia passa a
-- /iaia. Si superaria 600 caràcters, queda null com en la RPC existent.
-- Additiva i idempotent. Cap alta de participant, política o RPC pública nova.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- Impedeix inserts/updates concurrents mentre es comprova i canvia la clau.
lock table public.xat_fils in share row exclusive mode;

do $$
begin
  if exists (
    select 1 from public.xat_fils f
    where f.subjecte_tipus = 'pagina' and f.subjecte_id in ('/ia', '/iaia')
    group by f.tenant_id, f.tipus
    having count(*) > 1
  ) then
    raise exception 'SDP-XAT-014: hi ha dos fils per a la pàgina canònica.' using errcode = '23505';
  end if;
end;
$$;

-- Només metadades del subjecte: no canvia id, titol del fil, seq ni autoria.
update public.xat_fils f
   set subjecte_id = '/iaia',
       subjecte_ruta = '/iaia',
       subjecte_titol = 'L''ànima de la iaia',
       subjecte_uri = case
         when f.subjecte_uri like 'https://%/ia' then
           case when char_length(f.subjecte_uri) <= 598
             then regexp_replace(f.subjecte_uri, '/ia$', '/iaia') else null end
         else f.subjecte_uri end
 where f.subjecte_tipus = 'pagina' and f.subjecte_id in ('/ia', '/iaia')
   and (f.subjecte_id is distinct from '/iaia'
     or f.subjecte_ruta is distinct from '/iaia'
     or f.subjecte_titol is distinct from 'L''ànima de la iaia'
     or f.subjecte_uri like 'https://%/ia');

-- Una execució antiga que resolgué /ia abans del commit no pot duplicar el fil.
alter table public.xat_fils
  drop constraint if exists xat_fils_pagina_iaia_canonica;
alter table public.xat_fils
  add constraint xat_fils_pagina_iaia_canonica check (
    subjecte_tipus is distinct from 'pagina' or subjecte_id is distinct from '/ia'
  );

create or replace function private.xat_subjecte(p_tenant_id uuid, p_tipus text, p_id text)
returns table (clau text, titol text, org_id uuid, ruta text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_clau  text;
  v_titol text;
  v_org   uuid;
  v_tram  text;
begin
  if p_tipus in ('entitat', 'grup') then
    select o.id::text, o.name::text, o.id into v_clau, v_titol, v_org
    from public.organizations o
    where o.tenant_id = p_tenant_id and (o.id::text = p_id or o.slug = p_id)
      and (o.kind = 'group') = (p_tipus = 'grup')
      and (o.visibility = 'public' or private.is_organization_member(o.id))
    limit 1;
  elsif p_tipus = 'poble' then
    -- La clau és l'id; la ruta, el slug, que és com /pobles/:id coneix els pobles.
    select t.id::text, t.name::text, coalesce(t.slug, t.id::text) into v_clau, v_titol, v_tram
    from public.towns t
    where t.id::text = p_id or t.slug = p_id
    limit 1;
    if v_clau is null then
      select p_id, coalesce(e ->> 'name', e ->> 'title') into v_clau, v_titol
      from public.app_content c
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.payload) = 'array' then c.payload else '[]'::jsonb end) e
      where c.tenant_id = p_tenant_id and c.key = 'towns' and e ->> 'id' = p_id
      limit 1;
    end if;
  elsif p_tipus in ('publicacio', 'producte', 'esdeveniment', 'multimedia') then
    select s.id::text, s.title::text into v_clau, v_titol
    from public.section_submissions s
    where s.tenant_id = p_tenant_id and s.id::text = p_id
      and s.section_id = case p_tipus when 'publicacio' then 'mur' when 'producte' then 'mercat'
        when 'esdeveniment' then 'events' else 'multimedia' end
    limit 1;
    if v_clau is null then
      select p_id, coalesce(e ->> 'title', e ->> 'name') into v_clau, v_titol
      from public.app_content c
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.payload) = 'array' then c.payload else '[]'::jsonb end) e
      where c.tenant_id = p_tenant_id
        and c.key = case p_tipus when 'publicacio' then 'feedPosts' when 'producte' then 'marketItems'
          when 'esdeveniment' then 'events' else 'mediaItems' end
        and e ->> 'id' = p_id
      limit 1;
    end if;
  elsif p_tipus = 'pagina' then
    -- PAGINES_AMB_XAT (src/data/contracte.js), amb els mateixos títols.
    select pg.cami, pg.nom into v_clau, v_titol
    from (values
      ('/mur', 'Mur'),
      ('/mercat', 'Mercat'),
      ('/pobles', 'Pobles'),
      ('/multimedia', 'Multimèdia'),
      ('/dispositius', 'Dispositius'),
      ('/disseny', 'Disseny'),
      ('/wikidepoble', 'Wiki de Poble'),
      ('/projecte', 'El projecte'),
      ('/constitucio', 'Constitució'),
      ('/iaia', 'L''ànima de la iaia'),
      ('/roadmap', 'Full de ruta'),
      ('/versions', 'Versions'),
      ('/legal', 'Legal i privacitat')
    ) as pg (cami, nom)
    where pg.cami = case when p_id = '/ia' then '/iaia' else p_id end;
  end if;
  if v_clau is null then
    return;
  end if;
  v_tram := coalesce(v_tram, v_clau);
  return query select v_clau, v_titol, v_org,
    case
      when p_tipus = 'pagina' then v_clau
      when v_tram !~ '^[A-Za-z0-9._~-]{1,200}$' then null
      else (case p_tipus when 'entitat' then '/empresa/' when 'grup' then '/grup/' when 'poble' then '/pobles/'
        when 'publicacio' then '/mur/' when 'producte' then '/mercat/' when 'esdeveniment' then '/events/'
        when 'multimedia' then '/multimedia/' end) || v_tram
    end;
end;
$$;
revoke execute on function private.xat_subjecte(uuid, text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;

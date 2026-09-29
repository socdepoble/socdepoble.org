-- Fortificació T4: retirar i restaurar icon/copyright amb el compte.
-- Mateixes signatures i permisos que F1; no altera la purga.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.demana_baixa(p_motiu text default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_perfil  public.profiles;
  v_baixa   private.baixes;
  v_dies    integer;
  v_retirat jsonb;
  v_meta    jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;

  select * into v_baixa from private.baixes b where b.user_id = v_uid;
  if found then
    return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                              'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', true);
  end if;

  select * into v_perfil from public.profiles p where p.id = v_uid for update;

  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
    from private.ajustos a where a.clau = 'dies_quarantena_baixa';
  exception when invalid_text_representation then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 30);

  -- Les claus personals de cada publicació pròpia (signada com a persona) es
  -- guarden a la instantània abans de retirar-les: cancela_baixa les torna.
  select coalesce(jsonb_object_agg(s.id::text, (
           select jsonb_object_agg(e.key, e.value)
           from jsonb_each(s.payload) e
           where e.key = any (private.claus_personals_payload(s.payload, v_perfil.full_name)))), '{}'::jsonb)
    into v_retirat
  from public.section_submissions s
  where s.owner_user_id = v_uid
    and s.author_org_id is null
    and cardinality(private.claus_personals_payload(s.payload, v_perfil.full_name)) > 0;

  -- GoTrue en guarda una còpia a user_metadata (updateProfile hi escriu el nom,
  -- la foto i la bio; Google, name i picture): sense retirar-la, el nom
  -- sobreviuria a l'anonimització. També va a la instantània.
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into v_meta
  from auth.users u
  cross join lateral jsonb_each(case when jsonb_typeof(u.raw_user_meta_data) = 'object'
                                     then u.raw_user_meta_data else '{}'::jsonb end) e
  where u.id = v_uid
    and e.key = any (array['full_name', 'name', 'avatar_url', 'picture', 'bio', 'icon', 'copyright']);

  insert into private.baixes (user_id, demanada_al, purga_prevista_al, instantania, motiu)
  values (
    v_uid, now(), now() + make_interval(days => v_dies),
    jsonb_build_object(
      'perfil', jsonb_build_object('full_name', v_perfil.full_name, 'avatar_url', v_perfil.avatar_url,
                                   'bio', v_perfil.bio, 'lema', v_perfil.lema,
                                   'icon', v_perfil.icon, 'copyright', v_perfil.copyright,
                                   'presentacio_html', v_perfil.presentacio_html,
                                   'hero_url', v_perfil.hero_url, 'is_public', v_perfil.is_public),
      'publicacions', v_retirat,
      'metadades', v_meta),
    nullif(left(btrim(coalesce(p_motiu, '')), 500), ''))
  returning * into v_baixa;

  -- Anonimització immediata. membres_del_poble ja no la mostra (baixa_demanada_at).
  update public.profiles
     set full_name = 'Veïna que se n''ha anat',
         avatar_url = null, bio = '', lema = '', presentacio_html = '', hero_url = null,
         icon = null, copyright = '',
         is_public = false, baixa_demanada_at = v_baixa.demanada_al
   where id = v_uid;

  -- La còpia de GoTrue, fora. Millor esforç: si el rol propietari no pot
  -- escriure a auth.users, la baixa continua i ho diu el registre.
  begin
    update auth.users u
       set raw_user_meta_data = u.raw_user_meta_data - array['full_name', 'name', 'avatar_url', 'picture', 'bio', 'icon', 'copyright']
     where u.id = v_uid
       and jsonb_typeof(u.raw_user_meta_data) = 'object';
  exception when insufficient_privilege then
    raise notice 'SDP-BAIXA-021: sense permís per a netejar les metadades de GoTrue de %.', v_uid;
  end;

  -- Publicacions personals: fora les claus personals. El trigger d'autor
  -- reescriu author_name amb el nom anònim. Les signades per una entitat són
  -- de l'entitat i no es toquen.
  update public.section_submissions s
     set payload = s.payload - private.claus_personals_payload(s.payload, v_perfil.full_name)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  -- Tancament de sessions (millor esforç; el client fa a més logout global).
  begin
    delete from auth.sessions where user_id = v_uid;
  exception when insufficient_privilege or undefined_table then
    null;
  end;

  return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                            'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', false);
end;
$$;
revoke execute on function public.demana_baixa(text) from public, anon;
grant execute on function public.demana_baixa(text) to authenticated;

-- Idempotent: sense cap baixa pendent, l'estat desitjat ja es complix.
create or replace function public.cancela_baixa()
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
  v_p   jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid for update;
  if not found then
    return jsonb_build_object('cancelada', true);
  end if;
  v_p := coalesce(v_b.instantania -> 'perfil', '{}'::jsonb);

  update public.profiles p
     set full_name = coalesce(nullif(btrim(v_p ->> 'full_name'), ''), p.full_name),
         avatar_url = v_p ->> 'avatar_url',
         bio = coalesce(v_p ->> 'bio', ''),
         lema = coalesce(v_p ->> 'lema', ''),
         presentacio_html = coalesce(v_p ->> 'presentacio_html', ''),
         hero_url = v_p ->> 'hero_url',
         icon = v_p ->> 'icon',
         copyright = coalesce(v_p ->> 'copyright', ''),
         is_public = coalesce((v_p ->> 'is_public')::boolean, false),
         baixa_demanada_at = null
   where p.id = v_uid;

  -- Torna a GoTrue el nom, la foto i la bio que la baixa li va retirar.
  if jsonb_typeof(v_b.instantania -> 'metadades') = 'object' and v_b.instantania -> 'metadades' <> '{}'::jsonb then
    begin
      update auth.users u
         set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || (v_b.instantania -> 'metadades')
       where u.id = v_uid;
    exception when insufficient_privilege then
      raise notice 'SDP-BAIXA-022: sense permís per a restaurar les metadades de GoTrue de %.', v_uid;
    end;
  end if;

  -- Torna les claus retirades i el trigger d'autor torna a signar amb el nom.
  update public.section_submissions s
     set payload = s.payload || coalesce(v_b.instantania -> 'publicacions' -> (s.id::text), '{}'::jsonb)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  delete from private.baixes where user_id = v_uid;
  return jsonb_build_object('cancelada', true);
end;
$$;
revoke execute on function public.cancela_baixa() from public, anon;
grant execute on function public.cancela_baixa() to authenticated;


-- Completar les baixes ja en quarantena, conservant la instantània original.
update private.baixes b set instantania = jsonb_set(b.instantania, '{perfil}',
  jsonb_build_object('icon', p.icon, 'copyright', p.copyright) || coalesce(b.instantania->'perfil', '{}'::jsonb))
from public.profiles p where p.id = b.user_id;
update private.baixes b set instantania = jsonb_set(b.instantania, '{metadades}',
  (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
   from jsonb_each(case when jsonb_typeof(u.raw_user_meta_data) = 'object'
     then u.raw_user_meta_data else '{}'::jsonb end) e
   where e.key in ('icon', 'copyright')) || coalesce(b.instantania->'metadades', '{}'::jsonb))
from auth.users u where u.id = b.user_id;
update auth.users u set raw_user_meta_data = u.raw_user_meta_data - array['icon', 'copyright']
where jsonb_typeof(u.raw_user_meta_data) = 'object'
  and exists (select 1 from private.baixes b where b.user_id=u.id);
update public.profiles p set icon = null, copyright = ''
where exists (select 1 from private.baixes b where b.user_id=p.id);
notify pgrst, 'reload schema';
commit;

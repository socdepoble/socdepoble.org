-- R21.1 v2 · Mur de poble: dues lectures i actes de publicació independents.
-- Additiva sobre R21.1 + R21.6. Cap crida externa ni escriptura remota.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
do $$ begin
 if to_regclass('public.bloquejos') is null or to_regclass('private.baixes') is null
  or to_regclass('public.cua_purga_storage_ugc') is null or to_regclass('storage.objects') is null
  or not exists(select 1 from information_schema.columns where table_schema='public' and table_name='notes' and column_name='status')
  or (select count(*) from information_schema.columns where table_schema='public' and table_name='profiles'
      and column_name in ('avatar_url','hero_url','presentacio_html'))<>3 then
  raise exception using errcode='55000',message='SDP-MUR-DEPENDENCY: aplica abans moderació, cicle Notes, perfil F1 i cua Storage canònics.';
 end if;
end $$;


-- Les constàncies impedixen ressuscitar un UUID; després de la baixa no
-- retenen la identitat de la persona. Els UUID d'acte no es reutilitzen.
alter table private.mur_publicacions_revocades alter column owner_user_id drop not null;
alter table private.mur_revocacions_notes alter column owner_user_id drop not null;
update private.mur_publicacions_revocades r set owner_user_id=null
 where owner_user_id is not null and not exists(select 1 from auth.users u where u.id=r.owner_user_id);
update private.mur_revocacions_notes r set owner_user_id=null
 where owner_user_id is not null and not exists(select 1 from auth.users u where u.id=r.owner_user_id);
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='private.mur_publicacions_revocades'::regclass and conname='mur_revocades_owner_fk') then
    alter table private.mur_publicacions_revocades add constraint mur_revocades_owner_fk
      foreign key(owner_user_id) references auth.users(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='private.mur_revocacions_notes'::regclass and conname='mur_notes_owner_fk') then
    alter table private.mur_revocacions_notes add constraint mur_notes_owner_fk
      foreign key(owner_user_id) references auth.users(id) on delete set null;
  end if;
end $$;

create table if not exists private.mur_actes_notes (
  act_id uuid primary key,
  note_id uuid references public.notes(id) on delete set null,
  tenant_id uuid not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_note_revision integer not null,
  retired_at timestamptz,
  created_at timestamptz not null default now()
);
alter table private.mur_actes_notes enable row level security;
revoke all on private.mur_actes_notes from public, anon, authenticated, service_role;
create unique index if not exists mur_actes_notes_un_actiu on private.mur_actes_notes(note_id) where retired_at is null;
delete from private.mur_revocacions_notes r where not exists(select 1 from public.notes n where n.id=r.note_id);
-- Les notes prèvies amb vincle verificat obtenen el mateix rebut de retirada.
insert into private.mur_actes_notes(act_id,note_id,tenant_id,owner_user_id,created_note_revision)
select distinct on(s.id) s.id,n.id,n.tenant_id,n.owner_user_id,n.revision
from public.notes n join public.section_submissions s on s.id=n.published_submission_id
  and s.tenant_id=n.tenant_id and s.owner_user_id=n.owner_user_id
where n.is_published and not exists(select 1 from private.mur_actes_notes a where a.note_id=n.id and a.retired_at is null)
order by s.id,n.id on conflict do nothing;

create table if not exists private.mur_operacions_notes (
  operation_id uuid primary key,
  act_id uuid not null,
  note_id uuid references public.notes(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  confirmed_revision integer not null,
  created_at timestamptz not null default now()
);
alter table private.mur_operacions_notes enable row level security;
revoke all on private.mur_operacions_notes from public,anon,authenticated,service_role;

create or replace function private.mur_desvincula_compte()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 update private.mur_actes_notes set note_id=null where owner_user_id=old.id;
 update private.mur_operacions_notes set note_id=null where owner_user_id=old.id;
 delete from private.mur_revocacions_notes where owner_user_id=old.id;
 return old;
end;
$$;
revoke all on function private.mur_desvincula_compte() from public,anon,authenticated,service_role;
drop trigger if exists sdp_mur_desvincula_compte on auth.users;
create trigger sdp_mur_desvincula_compte before delete on auth.users
 for each row execute function private.mur_desvincula_compte();

create or replace function private.mur_actor_bloqueja(p_owner uuid,p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.bloquejos b
    where b.bloquejador=auth.uid() and ((p_org is null and b.bloquejat_persona=p_owner)
      or (p_org is not null and b.bloquejat_entitat=p_org)));
$$;
revoke all on function private.mur_actor_bloqueja(uuid,uuid) from public, anon, authenticated, service_role;

-- R22 · Qui llig l'autoria d'un poble: sessió amb compte actiu i padró.
-- És la mateixa condició que separa les dues lectures de llig_mur_membres.
create or replace function private.mur_lector_ric(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and p_tenant is not null
    and private.copub_compte_actiu(auth.uid()) and private.is_town_member(p_tenant);
$$;
revoke all on function private.mur_lector_ric(uuid) from public, anon, authenticated, service_role;

-- R22 · Bloqueig opac per UUID de publicació. Qui no llig l'autoria guarda
-- a public.bloquejos una fila pròpia de tipus 'publicacio', sense identitat;
-- l'autor resolt només viu en una taula privada que cap client llig ni
-- exporta. Les files de persona i entitat no canvien.
alter table public.bloquejos add column if not exists publicacio_id uuid;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.bloquejos'::regclass
      and conname='bloquejos_tipus_valid' and pg_get_constraintdef(oid) like '%publicacio%') then
    alter table public.bloquejos drop constraint if exists bloquejos_tipus_valid;
    alter table public.bloquejos add constraint bloquejos_tipus_valid
      check (bloquejat_tipus in ('persona','entitat','publicacio'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.bloquejos'::regclass
      and conname='bloquejos_un_sol_bloquejat' and pg_get_constraintdef(oid) like '%publicacio%') then
    alter table public.bloquejos drop constraint if exists bloquejos_un_sol_bloquejat;
    alter table public.bloquejos add constraint bloquejos_un_sol_bloquejat check (
      (bloquejat_tipus='persona' and bloquejat_persona is not null and bloquejat_entitat is null and publicacio_id is null)
      or (bloquejat_tipus='entitat' and bloquejat_entitat is not null and bloquejat_persona is null and publicacio_id is null)
      or (bloquejat_tipus='publicacio' and publicacio_id is not null and bloquejat_persona is null and bloquejat_entitat is null));
  end if;
end $$;
create index if not exists bloquejos_publicacio on public.bloquejos(bloquejador,publicacio_id) where publicacio_id is not null;
-- Només bloqueja_publicacio_mur crea una fila opaca: sense autor privat no
-- amagaria res, i un client no pot triar l'autor d'una fila opaca.
drop policy if exists "r21_v2 bloqueig opac per RPC" on public.bloquejos;
create policy "r21_v2 bloqueig opac per RPC" on public.bloquejos as restrictive for insert to authenticated
  with check (bloquejat_tipus<>'publicacio' and publicacio_id is null);

create table if not exists private.mur_bloquejos_opacs (
  bloqueig_id uuid primary key references public.bloquejos(id) on delete cascade,
  bloquejador uuid not null references auth.users(id) on delete cascade,
  bloquejat_persona uuid references auth.users(id) on delete cascade,
  bloquejat_entitat uuid references public.organizations(id) on delete cascade,
  tenant_ids uuid[] not null default '{}'::uuid[],
  constraint mur_bloquejos_opacs_un_sol check (num_nonnulls(bloquejat_persona,bloquejat_entitat)=1),
  constraint mur_bloquejos_opacs_no_autobloqueig check (bloquejat_persona is distinct from bloquejador),
  constraint mur_bloquejos_opacs_persona_unic unique(bloquejador,bloquejat_persona),
  constraint mur_bloquejos_opacs_entitat_unic unique(bloquejador,bloquejat_entitat)
);
alter table private.mur_bloquejos_opacs enable row level security;
revoke all on private.mur_bloquejos_opacs from public, anon, authenticated, service_role;
-- R22 (ronda 3) · Els pobles de les publicacions que qui bloqueja ha
-- bloquejat d'eixa autoria. Si després entra al padró d'un d'eixos pobles,
-- el bloqueig continua valent-hi (vegeu private.mur_bloqueig_opac). Una
-- aplicació anterior d'esta migració sense la columna la rep del UUID
-- públic de la fila visible, si la publicació encara existix.
alter table private.mur_bloquejos_opacs add column if not exists tenant_ids uuid[] not null default '{}'::uuid[];
update private.mur_bloquejos_opacs o set tenant_ids=array[s.tenant_id]
 from public.bloquejos b join public.section_submissions s on s.id=b.publicacio_id
 where b.id=o.bloqueig_id and cardinality(o.tenant_ids)=0;

-- Si l'autor desapareix (baixa o entitat esborrada), la fila visible també.
create or replace function private.mur_bloqueig_opac_orfe()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 delete from public.bloquejos where id=old.bloqueig_id and bloquejat_tipus='publicacio';
 return old;
end;
$$;
revoke all on function private.mur_bloqueig_opac_orfe() from public, anon, authenticated, service_role;
drop trigger if exists sdp_mur_bloqueig_opac_orfe on private.mur_bloquejos_opacs;
create trigger sdp_mur_bloqueig_opac_orfe after delete on private.mur_bloquejos_opacs
 for each row execute function private.mur_bloqueig_opac_orfe();

-- Un bloqueig opac filtra les lectures sense autoria. En un poble on qui mira
-- ja llig l'autoria només s'aplica si és el poble d'una publicació bloquejada:
-- allí ja pot llegir qui la firma, i amagar-la no revela res. En els altres
-- pobles on llig l'autoria no s'aplica: comparar-les delataria qui l'ha escrita.
-- R22 (ronda 3) · Abans deixava d'aplicar-se quan qui bloqueja entrava al
-- padró del poble de la publicació, i la llista el continuava mostrant.
create or replace function private.mur_bloqueig_opac(p_owner uuid,p_org uuid,p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from private.mur_bloquejos_opacs o
    where o.bloquejador=auth.uid() and ((p_org is null and o.bloquejat_persona=p_owner)
      or (p_org is not null and o.bloquejat_entitat=p_org))
      and (p_tenant=any(o.tenant_ids) or not private.mur_lector_ric(p_tenant)));
$$;
revoke all on function private.mur_bloqueig_opac(uuid,uuid,uuid) from public, anon, authenticated, service_role;

-- L'autoria resolta d'una denúncia per UUID feta per qui no llig l'autoria.
-- public.denuncies guarda autor null per a eixa persona (també a l'exportació).
create table if not exists private.mur_denuncies_autoria (
  denuncia_id uuid primary key references public.denuncies(id) on delete cascade,
  autor_tipus text not null check (autor_tipus in ('persona','entitat')),
  autor_id text not null check (char_length(autor_id) between 1 and 200)
);
alter table private.mur_denuncies_autoria enable row level security;
revoke all on private.mur_denuncies_autoria from public, anon, authenticated, service_role;

create or replace function private.mur_membre_llegeix(p_fila public.section_submissions)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and private.copub_compte_actiu(auth.uid())
    and private.is_town_member(p_fila.tenant_id) and p_fila.deleted_at is null
    and (p_fila.owner_user_id=auth.uid() or (
      p_fila.section_id in ('mur','mercat','events','multimedia')
      and p_fila.visibility='public' and p_fila.moderation_state='visible'
      and private.mur_public_eligible(p_fila.payload)
      and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=p_fila.id)
      and not private.mur_actor_bloqueja(p_fila.owner_user_id,p_fila.author_org_id)
      and not private.mur_bloqueig_opac(p_fila.owner_user_id,p_fila.author_org_id,p_fila.tenant_id)));
$$;
revoke all on function private.mur_membre_llegeix(public.section_submissions) from public, anon, authenticated, service_role;
grant execute on function private.mur_membre_llegeix(public.section_submissions) to authenticated;
-- RLS també protegix el SELECT que usa Node 0. Cap JOIN de perfils privats.
grant select on public.section_submissions to authenticated;
revoke select on public.section_submissions from public, anon;
drop policy if exists "r21_v2 anon sense cru" on public.section_submissions;
create policy "r21_v2 anon sense cru" on public.section_submissions as restrictive for select to anon using(false);
drop policy if exists "owner read section_submissions" on public.section_submissions;
drop policy if exists "public read section_submissions" on public.section_submissions;
drop policy if exists "r21_v2 membres lectura" on public.section_submissions;
create policy "r21_v2 membres lectura" on public.section_submissions for select to authenticated
  using (private.mur_membre_llegeix(section_submissions));
drop policy if exists "r21_v2 frontera membres" on public.section_submissions;
create policy "r21_v2 frontera membres" on public.section_submissions as restrictive for select to authenticated
  using (private.mur_membre_llegeix(section_submissions));

create or replace function private.mur_titol_anon(p_title text,p_payload jsonb)
returns text language sql immutable set search_path = '' as $$
 select private.mur_text_public(case when p_payload->>'type'='compartit'
  and (p_payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia')
   or p_payload#>>'{origen,sectionId}'='perfil') then 'Recurs compartit' else p_title end);
$$;
revoke all on function private.mur_titol_anon(text,jsonb) from public,anon,authenticated,service_role;

create or replace function private.mur_payload_membres(p_payload jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare clean jsonb:=p_payload; origin jsonb:='{}'; k text; content text; is_profile boolean;
begin
 if p_payload->>'type' is distinct from 'compartit' or jsonb_typeof(p_payload->'origen') is distinct from 'object' then return p_payload; end if;
 is_profile:=p_payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or p_payload#>>'{origen,sectionId}'='perfil';
 foreach k in array array['tipus','sectionId','itemId','objecte','ruta','url','lloc','titol','drets'] loop
  if jsonb_typeof(p_payload->'origen'->k)='string' then
   origin:=origin||jsonb_build_object(k,case when k='titol' and is_profile then 'Perfil compartit' else p_payload->'origen'->>k end);
  end if;
 end loop;
 clean:=jsonb_set(clean,'{origen}',origin);
 if jsonb_typeof(clean->'content')='string' then
  -- Només el paràgraf exacte que generava connexions.js, amb enllaç o strong.
  -- Es conserva el cos manual i el copyright, sense substituir noms arbitraris.
  content:=regexp_replace(clean->>'content',
   '<p(?:[[:space:]][^>]*?)??>[[:space:]]*?(?:Compartit|Element connectat)[[:space:]][^<]*?:[[:space:]]*?<(?:a|strong)(?:[[:space:]][^>]*?)??>.*?</(?:a|strong)>[.]??[[:space:]]*?</p[[:space:]]*?>',
   '<p>Recurs compartit.</p>','gis');
  clean:=jsonb_set(clean,'{content}',to_jsonb(content));
 end if;
 if is_profile then clean:=clean||jsonb_build_object('title','Perfil compartit','subtitle','','description',''); end if;
 return clean;
end;
$$;
revoke all on function private.mur_payload_membres(jsonb) from public,anon,authenticated,service_role;

create or replace function private.mur_fila_membre(p_fila public.section_submissions)
returns jsonb language sql stable set search_path = '' as $$
 select to_jsonb(p_fila)||jsonb_build_object('payload',private.mur_payload_membres(p_fila.payload));
$$;
revoke all on function private.mur_fila_membre(public.section_submissions) from public,anon,authenticated,service_role;

-- El mateix sanejament governa escriptures antigues i SELECT cru autenticat.
create or replace function private.mur_saneja_compartit()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 new.payload:=private.mur_payload_membres(new.payload);
 if new.payload->>'type'='compartit' and (new.payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or new.payload#>>'{origen,sectionId}'='perfil') then
  new.title:='Perfil compartit'; new.description:='';
 end if;
 return new;
end;
$$;
revoke all on function private.mur_saneja_compartit() from public,anon,authenticated,service_role;
drop trigger if exists sdp_mur_saneja_compartit on public.section_submissions;
create trigger sdp_mur_saneja_compartit before insert or update on public.section_submissions
 for each row execute function private.mur_saneja_compartit();
-- El CHECK d'autoria canònic depén de auth.uid() i també s'executa en un
-- UPDATE de manteniment que no canvia author_org_id. Conservem la definició
-- exacta en la mateixa transacció amb pany exclusiu; cap client la pot vore
-- retirada, i les escriptures concurrents esperen. No s'afegix cap bypass.
do $$
declare original_check text; validated boolean;
begin
 if exists(select 1 from public.section_submissions s where s.payload->>'type'='compartit' and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
  and (s.payload is distinct from private.mur_payload_membres(s.payload)
   or ((s.payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or s.payload#>>'{origen,sectionId}'='perfil') and (s.title<>'Perfil compartit' or s.description is distinct from '')))) then
  select pg_get_constraintdef(oid),convalidated into original_check,validated from pg_constraint
   where conrelid='public.section_submissions'::regclass and conname='section_submissions_autoria_org_valida';
  if original_check is null or validated then
   raise exception using errcode='55000',message='SDP-MUR-DEPENDENCY: revisa la definició canònica NOT VALID del CHECK d’autoria abans del backfill.';
  end if;
  alter table public.section_submissions drop constraint section_submissions_autoria_org_valida;
  update public.section_submissions s set payload=private.mur_payload_membres(s.payload),
 title=case when s.payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or s.payload#>>'{origen,sectionId}'='perfil' then 'Perfil compartit' else s.title end,
 description=case when s.payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or s.payload#>>'{origen,sectionId}'='perfil' then '' else s.description end
 where s.payload->>'type'='compartit' and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
  and (s.payload is distinct from private.mur_payload_membres(s.payload)
   or ((s.payload#>>'{origen,objecte}' in ('persona','entitat','grup','ia') or s.payload#>>'{origen,sectionId}'='perfil') and (s.title<>'Perfil compartit' or s.description is distinct from '')));
  execute 'alter table public.section_submissions add constraint section_submissions_autoria_org_valida '||original_check;
 end if;
end $$;

-- R22 (dades-05) · p_nomes_projeccions: només les files amb marca de catàleg
-- pública vàlida (la mateixa private.mur_cataleg_public del DTO anònim), dins
-- del WHERE i, per tant, abans del LIMIT, a les dues branques. Per defecte
-- (false) la lectura no canvia. La signatura de sis arguments es retira: dues
-- variants farien ambigua la crida posicional de Node 0.
drop function if exists public.llig_mur_membres(uuid,text,integer,timestamptz,uuid,uuid[]);
create or replace function public.llig_mur_membres(
 p_tenant_id uuid default null,p_section_id text default null,p_limit integer default 200,
 p_before_created_at timestamptz default null,p_before_id uuid default null,p_ids uuid[] default null,
 p_nomes_projeccions boolean default false
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_files jsonb;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='SDP-MUR-AUTH: cal una sessió.'; end if;
 if not private.copub_compte_actiu(auth.uid()) or not (
   (p_tenant_id is not null and private.is_town_member(p_tenant_id))
   or (p_tenant_id is null and exists(select 1 from public.town_memberships m where m.user_id=auth.uid()))) then
  select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) into v_files from (
   select s.id,s.tenant_id,s.section_id,private.mur_titol_anon(s.title,s.payload) as title,
    private.mur_text_public(case when s.payload->>'type'='compartit' then '' else s.description end) as description,
    private.mur_text_public(case when s.payload->>'type'='compartit' then ''
     when jsonb_typeof(s.payload->'content')='string' then s.payload->>'content' else '' end) as public_content,
    s.created_at,s.updated_at,c.catalog_font,c.catalog_id,c.catalog_destins,c.destinacio_workspace
   from public.section_submissions s cross join lateral private.mur_cataleg_public(s.payload) c
   where s.section_id in ('mur','mercat','events','multimedia') and s.visibility='public'
    and s.moderation_state='visible' and s.deleted_at is null and private.mur_public_eligible(s.payload)
    and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
    and not private.mur_actor_bloqueja(s.owner_user_id,s.author_org_id)
    and not private.mur_bloqueig_opac(s.owner_user_id,s.author_org_id,s.tenant_id)
    and (p_tenant_id is null or s.tenant_id=p_tenant_id) and (p_section_id is null or s.section_id=p_section_id)
    and (p_ids is null or s.id=any(p_ids))
    and (not p_nomes_projeccions or c.catalog_font is not null)
    and ((p_before_created_at is null and p_before_id is null)
     or (p_before_created_at is not null and p_before_id is not null and (s.created_at,s.id)<(p_before_created_at,p_before_id)))
   order by s.created_at desc,s.id desc limit greatest(1,least(coalesce(p_limit,50),51))
  ) p;
  return jsonb_build_object('lectura','public','files',v_files);
 end if;
 select coalesce(jsonb_agg(private.mur_fila_membre(x::public.section_submissions) order by x.created_at desc,x.id desc),'[]'::jsonb) into v_files from (
  select s.* from public.section_submissions s cross join lateral private.mur_cataleg_public(s.payload) c
  where private.mur_membre_llegeix(s)
    and s.section_id in ('mur','mercat','events','multimedia')
    and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
    and private.mur_public_eligible(s.payload)
    and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
    and not private.mur_actor_bloqueja(s.owner_user_id,s.author_org_id)
    and not private.mur_bloqueig_opac(s.owner_user_id,s.author_org_id,s.tenant_id)
    and (p_tenant_id is null or s.tenant_id=p_tenant_id)
    and (p_section_id is null or s.section_id=p_section_id)
    and (p_ids is null or s.id=any(p_ids))
    and (not p_nomes_projeccions or c.catalog_font is not null)
    and ((p_before_created_at is null and p_before_id is null)
      or (p_before_created_at is not null and p_before_id is not null and (s.created_at,s.id)<(p_before_created_at,p_before_id)))
  order by s.created_at desc,s.id desc limit greatest(1,least(coalesce(p_limit,50),51))
 ) x;
 return jsonb_build_object('lectura','membre','files',v_files);
end;
$$;
revoke all on function public.llig_mur_membres(uuid,text,integer,timestamptz,uuid,uuid[],boolean) from public,anon,authenticated,service_role;
grant execute on function public.llig_mur_membres(uuid,text,integer,timestamptz,uuid,uuid[],boolean) to authenticated;

create or replace function private.mur_es_isbn(p_text text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare digits text; total integer:=0; i integer; v integer;
begin
 if p_text !~* '^ISBN(?:-1[03])?[[:space:]:]+' then return false; end if;
 digits:=regexp_replace(regexp_replace(p_text,'^ISBN(?:-1[03])?[[:space:]:]+','','i'),'[ -]','','g');
 if digits ~ '^(978|979)[0-9]{10}$' then
  for i in 1..13 loop total:=total+substr(digits,i,1)::integer*case when i%2=0 then 3 else 1 end; end loop;
  return total%10=0;
 elsif digits ~ '^[0-9]{9}[0-9Xx]$' then
  for i in 1..10 loop v:=case when upper(substr(digits,i,1))='X' then 10 else substr(digits,i,1)::integer end;
   total:=total+v*(11-i); end loop;
  return total%11=0;
 end if;
 return false;
end;
$$;
revoke all on function private.mur_es_isbn(text) from public,anon,authenticated,service_role;

-- Quatre passades amb tots els quantificadors no voraços: conserven el
-- text entre blocs. Cap bucle rescaneja el prefix per cada etiqueta HTML.
-- R22 · Els tokens es classifiquen i es tornen a unir per conjunts
-- (string_agg ordenat), i les marques es restauren en una sola passada:
-- cap concatenació caràcter a caràcter ni cap replace per marca, cost lineal.
create or replace function private.mur_text_public(p_text text)
returns text language plpgsql immutable set search_path = pg_catalog, public as $$
declare
 net text := replace(replace(left(coalesce(p_text,''),100000),chr(1),''),chr(2),'');
 block_tag text; saved text[];
begin
 foreach block_tag in array array['script','style','iframe','object'] loop
  net:=regexp_replace(net,'<'||block_tag||'(?:[[:space:]/][^>]*?)??>.*?</'||block_tag||'[[:space:]]*?>','','gis');
  net:=regexp_replace(net,'<'||block_tag||'(?:[[:space:]/][^>]*?)??>.*$','','is');
 end loop;
 net:=regexp_replace(net,'<[^>]*>','','g');
 net:=regexp_replace(net,'[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}','[contacte omés]','gi');
 net:=regexp_replace(net,'[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}','[identificador omés]','gi');
 net:=regexp_replace(net,'(https?://|data:|sdp-media:|tel:|mailto:|(?:www\.)?(?:wa\.me|t\.me)/)[^[:space:]<>]+','[recurs omés]','gi');
 -- Protegim únicament dates reals, rangs d'any i ISBN etiquetats. Després
 -- tots els candidats telefònics passen una sola substitució global. Les
 -- marques es numeren 1..n en ordre, com abans.
 select coalesce(string_agg(tros,'' order by ordinal),''),
        coalesce(array_agg(token order by ordinal) filter (where conserva),array[]::text[])
   into net,saved
 from (
  select ordinal,conserva,parts[1] as token,
   case when conserva then chr(1)||(count(*) filter (where conserva) over (order by ordinal))::text||chr(2)
    else coalesce(parts[1],parts[2]) end as tros
  from (
   select parts,ordinal,(parts[1] is not null and (private.mur_es_data_iso(parts[1])
     or (parts[1] ~ '^[12][0-9]{3}-[12][0-9]{3}$' and left(parts[1],4)::integer<=right(parts[1],4)::integer)
     or private.mur_es_isbn(parts[1]))) as conserva
   -- La segona alternativa pren el caràcter i el tram següent que no pot
   -- començar cap candidat (ni dígit ni «ISBN»): el mateix resultat que un
   -- caràcter per token, amb molts menys tokens en text pla.
   from regexp_matches(net,
    '(?<![[:alnum:]])([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{4}-[0-9]{4}|ISBN(?:-1[03])?[[:space:]:]+(?:[0-9][ -]?){9,12}[0-9Xx])(?![[:alnum:]])|(.(?:[^0-9Ii]|[Ii](?!SBN))*)','gis')
    with ordinality as tokens(parts,ordinal)
  ) classificats
 ) numerats;
 -- Primer el candidat telefònic complet: una decimal al mig no en pot
 -- consumir només el sufix i deixar sis dígits privats visibles.
 net:=regexp_replace(net,'(?<![[:alnum:]])[+]?(?:[[:digit:]][[:space:]()./_-]{0,3}){7,}[[:digit:]](?![[:alnum:]])','[contacte omés]','g');
 net:=regexp_replace(net,'(?<![[:digit:]])[-+]?[[:digit:]]{1,3}[.,][[:digit:]]{4,}(?![[:digit:]])','[coordenada omesa]','g');
 net:=regexp_replace(net,'[-+]?[[:digit:]]{1,3}[[:space:]]*°[^[:alpha:]<>\n]{0,30}(?:[NSEWO]|$)','[coordenada omesa]','gi');
 if cardinality(saved)>0 then
  select coalesce(string_agg(case when parts[1] is not null
     then coalesce(saved[parts[1]::integer],chr(1)||parts[1]||chr(2)) else parts[2] end,'' order by ordinal),'')
    into net
   from regexp_matches(net,chr(1)||'([0-9]{1,6})'||chr(2)||'|('||chr(1)||'|[^'||chr(1)||']+)','g')
    with ordinality as marques(parts,ordinal);
 end if;
 return net;
end;
$$;
revoke all on function private.mur_text_public(text) from public, anon, authenticated, service_role;

-- Una compartició antiga pot haver autocitat un perfil privat dins del cos.
-- Sense una separació verificable del text d'usuari, el DTO anònim no el copia.
-- R22 (dades-05) · Amb p_nomes_projeccions, només files amb catalog_font, dins
-- del WHERE (abans del LIMIT). La signatura de cinc arguments de 2611121430 es
-- retira amb els seus GRANT; la nova conserva els noms i els valors per defecte.
drop function if exists public.llig_mur_public(uuid,text,integer,timestamptz,uuid);
create or replace function public.llig_mur_public(
 p_tenant_id uuid default null,p_section_id text default null,p_limit integer default 200,
 p_before_created_at timestamptz default null,p_before_id uuid default null,
 p_nomes_projeccions boolean default false
) returns table(id uuid,tenant_id uuid,section_id text,title text,description text,public_content text,created_at timestamptz,updated_at timestamptz,catalog_font text,catalog_id text,catalog_destins text[],destinacio_workspace text)
language sql stable security definer set search_path = '' as $$
 select s.id,s.tenant_id,s.section_id,private.mur_titol_anon(s.title,s.payload),private.mur_text_public(case when s.payload->>'type'='compartit' then '' else s.description end),
  private.mur_text_public(case when s.payload->>'type'='compartit' then ''
    when jsonb_typeof(s.payload->'content')='string' then s.payload->>'content' else '' end),
  s.created_at,s.updated_at,c.catalog_font,c.catalog_id,c.catalog_destins,c.destinacio_workspace
 from public.section_submissions s cross join lateral private.mur_cataleg_public(s.payload) c
 where s.section_id in ('mur','mercat','events','multimedia')
  and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
  and private.mur_public_eligible(s.payload)
  and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
  and not private.mur_actor_bloqueja(s.owner_user_id,s.author_org_id)
  and not private.mur_bloqueig_opac(s.owner_user_id,s.author_org_id,s.tenant_id)
  and exists(select 1 from public.towns t where t.id=s.tenant_id)
  and (p_tenant_id is null or s.tenant_id=p_tenant_id) and (p_section_id is null or s.section_id=p_section_id)
  and (not p_nomes_projeccions or c.catalog_font is not null)
  and ((p_before_created_at is null and p_before_id is null)
    or (p_before_created_at is not null and p_before_id is not null and (s.created_at,s.id)<(p_before_created_at,p_before_id)))
 order by s.created_at desc,s.id desc limit greatest(1,least(coalesce(p_limit,200),200));
$$;
revoke all on function public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean) to anon,authenticated;

-- Els objectius de moderació s'obtenen per UUID al servidor. El rebut no
-- retorna l'autor ni permet usar un UUID privat o inexistent com a oracle.
-- R22 · Una sessió que no llig l'autoria d'eixe poble tampoc la rep a les
-- seues files: la denúncia es guarda amb autor null i l'autoria resolta va
-- a private.mur_denuncies_autoria (moderació). Anon no llig cap fila.
create or replace function public.denuncia_publicacio_mur(p_id uuid,p_motiu text,p_detall text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s public.section_submissions; v_tipus text; v_autor_tipus text; v_autor_id text; v_opac boolean; v_rebut jsonb;
begin
 select * into s from public.section_submissions x where x.id=p_id
  and x.section_id in ('mur','mercat','events','multimedia') and x.visibility='public'
  and x.moderation_state='visible' and x.deleted_at is null and private.mur_public_eligible(x.payload)
  and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=x.id);
 if not found then raise exception using errcode='22023',message='SDP-MOD-001: publicació no disponible.'; end if;
 v_tipus:=case s.section_id when 'mercat' then 'producte' when 'events' then 'esdeveniment' else 'publicacio' end;
 v_autor_tipus:=case when s.author_org_id is null then 'persona' else 'entitat' end;
 v_autor_id:=coalesce(s.author_org_id,s.owner_user_id)::text;
 v_opac:=auth.uid() is not null and not private.mur_lector_ric(s.tenant_id);
 v_rebut:=public.denuncia_contingut(v_tipus,s.id::text,p_motiu,p_detall,
  case when v_opac then null else v_autor_tipus end,case when v_opac then null else v_autor_id end,null,s.tenant_id);
 if v_opac and v_autor_id is not null then
  -- El disparador de denúncies deixa una sola pendent per persona i objecte.
  insert into private.mur_denuncies_autoria(denuncia_id,autor_tipus,autor_id)
  select d.id,v_autor_tipus,v_autor_id from public.denuncies d
   where d.denunciant=auth.uid() and d.objecte_tipus=v_tipus and d.objecte_id=s.id::text and d.estat='pendent'
  on conflict(denuncia_id) do nothing;
 end if;
 return v_rebut;
end;
$$;
revoke all on function public.denuncia_publicacio_mur(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.denuncia_publicacio_mur(uuid,text,text) to anon,authenticated;

-- R22 · Qui ja llig l'autoria d'eixe poble bloqueja per persona o entitat,
-- com des del perfil. Qui no la llig (Foraster o compte en baixa) rep una
-- fila opaca ('publicacio' + UUID públic) i l'autor queda en privat: cap
-- SELECT, exportació ni rebut no li'l torna.
create or replace function public.bloqueja_publicacio_mur(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s public.section_submissions; v_persona uuid; v_bloqueig uuid;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='SDP-MOD-000: cal una sessió.'; end if;
 select * into s from public.section_submissions x where x.id=p_id
  and x.section_id in ('mur','mercat','events','multimedia') and x.visibility='public'
  and x.moderation_state='visible' and x.deleted_at is null and private.mur_public_eligible(x.payload)
  and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=x.id);
 if not found then raise exception using errcode='22023',message='SDP-MOD-001: publicació no disponible.'; end if;
 v_persona:=case when s.author_org_id is null then s.owner_user_id end;
 if private.mur_lector_ric(s.tenant_id) then
  insert into public.bloquejos(bloquejat_tipus,bloquejat_persona,bloquejat_entitat)
  values(case when s.author_org_id is null then 'persona' else 'entitat' end,v_persona,s.author_org_id) on conflict do nothing;
  return jsonb_build_object('bloquejat',true,'publicacio_id',p_id);
 end if;
 if v_persona=auth.uid() then
  raise exception using errcode='22023',message='SDP-MOD-004: no et pots bloquejar a tu mateix.';
 end if;
 -- Mateix pany que el disparador de bloquejos: un sol bloqueig opac per
 -- autoria. Si la mateixa publicació canvia de signatura, el segon bloqueig
 -- és una fila nova del mateix UUID, i desbloquejar-lo les lleva totes dues.
 perform pg_advisory_xact_lock(hashtextextended('bloquejos:'||auth.uid()::text,0));
 if not exists(select 1 from private.mur_bloquejos_opacs o where o.bloquejador=auth.uid()
    and ((v_persona is not null and o.bloquejat_persona=v_persona) or (s.author_org_id is not null and o.bloquejat_entitat=s.author_org_id))) then
  insert into public.bloquejos(bloquejat_tipus,publicacio_id) values('publicacio',p_id) returning id into v_bloqueig;
  insert into private.mur_bloquejos_opacs(bloqueig_id,bloquejador,bloquejat_persona,bloquejat_entitat,tenant_ids)
  values(v_bloqueig,auth.uid(),v_persona,s.author_org_id,array[s.tenant_id]);
 else
  -- R22 (ronda 3) · La mateixa autoria bloquejada des d'un altre poble: cap
  -- fila visible nova, però el bloqueig també valdrà en eixe poble si qui
  -- bloqueja hi entra al padró.
  update private.mur_bloquejos_opacs o set tenant_ids=o.tenant_ids||s.tenant_id
   where o.bloquejador=auth.uid()
    and ((v_persona is not null and o.bloquejat_persona=v_persona) or (s.author_org_id is not null and o.bloquejat_entitat=s.author_org_id))
    and not (s.tenant_id=any(o.tenant_ids));
 end if;
 return jsonb_build_object('bloquejat',true,'publicacio_id',p_id);
end;
$$;
revoke all on function public.bloqueja_publicacio_mur(uuid) from public,anon,authenticated,service_role;
grant execute on function public.bloqueja_publicacio_mur(uuid) to authenticated;

-- Absència i autoria aliena responen exactament igual i no tombstonen res.
-- La pertinença al padró no és necessària per retirar una publicació pròpia.
create or replace function public.revoca_publicacio_mur(p_id uuid,p_tenant_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare s public.section_submissions; r private.mur_publicacions_revocades; v_note uuid;
begin
 if auth.uid() is null or p_id is null or p_tenant_id is null then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: publicació no disponible per a esta sessió.';
 end if;
 -- Mateix ordre que publicar: nota abans d'acte, inclòs el SET NULL de la FK.
 select note_id into v_note from private.mur_actes_notes where act_id=p_id and owner_user_id=auth.uid();
 if v_note is not null then
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:nota:'||v_note::text,0));
  perform 1 from public.notes where id=v_note for update;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||p_id::text,0));
 select * into r from private.mur_publicacions_revocades where submission_id=p_id;
 if found and r.owner_user_id=auth.uid() and r.tenant_id=p_tenant_id then return true; end if;
 select * into s from public.section_submissions where id=p_id for update;
 if not found or s.owner_user_id is distinct from auth.uid() or s.tenant_id<>p_tenant_id
  or not exists(select 1 from auth.users u where u.id=auth.uid()) then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: publicació no disponible per a esta sessió.';
 end if;
 delete from public.section_submissions where id=p_id;
 return true;
end;
$$;
revoke all on function public.revoca_publicacio_mur(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.revoca_publicacio_mur(uuid,uuid) to authenticated;

create or replace function private.mur_registra_esborrat()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||old.id::text,0));
 insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id)
 values(old.id,old.tenant_id,case when exists(select 1 from auth.users u where u.id=old.owner_user_id) then old.owner_user_id end)
 on conflict do nothing;
 update private.mur_actes_notes set retired_at=coalesce(retired_at,now()) where act_id=old.id;
 if to_regclass('public.xat_fils') is not null then
  update public.xat_fils set titol='Publicació retirada',subjecte_titol=null,subjecte_ruta=null,subjecte_uri=null
  where tenant_id=old.tenant_id and subjecte_id=old.id::text
   and subjecte_tipus in ('publicacio','producte','esdeveniment','multimedia');
 end if;
 return old;
end;
$$;
revoke all on function private.mur_registra_esborrat() from public,anon,authenticated,service_role;

-- Coincidència de ruta completa: a.webp no és una referència a a.webp-extra.
-- Considerem també noms escapats en les URL, sense exposar ni executar-les.
create or replace function private.mur_cita_objecte(p_payload jsonb,p_bucket text,p_nom text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare hay text:=coalesce(p_payload::text,''); raw text; encoded text:=''; bytes bytea:=convert_to(p_nom,'UTF8');
 i integer; v integer; esc text; start_at integer; found_at integer; after_at integer; previous_char text; next_char text;
begin
 if p_bucket is null or p_nom is null or p_nom='' then return false; end if;
 for esc in select distinct m[1] from regexp_matches(hay,'(%[[:xdigit:]]{2})','g') as r(m) loop hay:=replace(hay,esc,upper(esc)); end loop;
 if octet_length(bytes)>0 then for i in 0..octet_length(bytes)-1 loop
  v:=get_byte(bytes,i);
  if v between 65 and 90 or v between 97 and 122 or v between 48 and 57 or v in (45,46,47,95,126) then encoded:=encoded||chr(v);
  else encoded:=encoded||'%'||upper(lpad(to_hex(v),2,'0')); end if;
 end loop; end if;
 foreach raw in array array[p_bucket||'/'||p_nom,p_bucket||'/'||encoded] loop
  start_at:=1;
  loop
   found_at:=strpos(substr(hay,start_at),raw);exit when found_at=0;
   found_at:=found_at+start_at-1;after_at:=found_at+char_length(raw);
   previous_char:=case when found_at>1 then substr(hay,found_at-1,1) else '' end;
   next_char:=substr(hay,after_at,1);
   if previous_char in ('','/','"',':') and next_char in ('','"','?','#',chr(92),' ','<','>') then return true; end if;
   start_at:=after_at;
  end loop;
 end loop;
 return false;
end;
$$;
revoke all on function private.mur_cita_objecte(jsonb,text,text) from public,anon,authenticated,service_role;

-- R22 · Còpia pública creada per a publicar, mai una carpeta d'avatars:
-- · el nom determinista sdp-net-v1-<sha256>.<ext> de promoteToPublic;
-- · R22 (ronda 3) · la còpia de la promoció anterior (fins a c92b906de,
--   13-11-2026), que pujava al bucket públic la mateixa ruta del privat:
--   <poble>/<uid>/notes/<uuid>.<ext>. Des de 977930983 (19-09-2026), la
--   carpeta 'notes' de uploadToStorage va sempre a mitjans_privats; per
--   tant, eixa forma amb tres carpetes al bucket 'mitjans' només la deixa
--   la promoció.
-- La forma de dues carpetes <uid>/notes/<uuid>.<ext> no hi entra: és
-- l'original d'una nota d'abans del 19-09, que uploadToStorage pujava al
-- bucket públic i que la nota cita. Avatars, capçaleres i altres fitxers
-- propis tampoc no ho són.
create or replace function private.mur_es_copia_publica(p_nom text)
returns boolean language sql immutable set search_path = '' as $$
 select coalesce((p_nom ~ '(^|/)sdp-net-v1-[0-9a-f]{64}\.[a-z0-9]{1,8}$'
   or p_nom ~* '^[^/]+/[^/]+/notes/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[^/]*$')
  and p_nom !~ '(^|/)avatars/',false);
$$;
revoke all on function private.mur_es_copia_publica(text) from public,anon,authenticated,service_role;

-- Mateix contracte de conservació de la cua existent, amb rutes exactes i
-- escapades també en les comprovacions del worker.
-- R22 · Una còpia pública que cita un perfil (avatar, capçalera o cos) també
-- es conserva; el perfil propi deixa de comptar quan la baixa ja ha iniciat
-- la purga, com les publicacions pròpies. Els fitxers propis del perfil no
-- són còpies públiques: en una baixa es continuen purgant com fins ara.
-- R22 (ronda 3) · Una nota pròpia que encara cita la còpia també la conserva:
-- entre el 19 i el 23-09-2026 (977930983 a 0ffda7a72), publicar reescrivia
-- dins de la nota (content i hero_image) la referència pública promoguda.
-- Com les publicacions i el perfil propis, deixa de comptar quan la baixa ja
-- ha iniciat la purga. Les notes d'altres persones no conserven res.
-- R22 (ronda 4) · Esta branca només val per al bucket 'mitjans':
-- mur_es_copia_publica només mira el nom, i uploadToStorage puja l'original
-- privat de Notes a 'mitjans_privats' amb la mateixa forma
-- <poble>/<uid>/notes/<uuid>.<ext>. Sense el bucket, la nota pròpia el
-- marcaria referenciat en un esborrat directe d'Auth i no es purgaria mai.
create or replace function private.referencia_storage_ugc(p_bucket text,p_nom text,p_uid uuid)
returns boolean language sql stable set search_path = '' as $$
 select p_bucket<>'xat_adjunts' and (
  exists(select 1 from public.organizations o where private.mur_cita_objecte(
   jsonb_build_object('logo',o.logo_url,'hero',o.hero_url,'html',o.presentacio_html),p_bucket,p_nom))
  or exists(select 1 from public.section_submissions s
   where (s.owner_user_id is distinct from p_uid or s.author_org_id is not null
    or not exists(select 1 from private.baixes b where b.user_id=p_uid and b.purga_fitxers_iniciada_al is not null))
   and private.mur_cita_objecte(s.payload,p_bucket,p_nom))
  or exists(select 1 from public.app_content a
   where a.key in ('feedPosts','marketItems','events','mediaItems','towns','pages')
    and private.mur_cita_objecte(a.payload,p_bucket,p_nom))
  or (p_bucket='mitjans' and private.mur_es_copia_publica(p_nom) and (exists(select 1 from public.profiles p
   where (p.id is distinct from p_uid
     or not exists(select 1 from private.baixes b where b.user_id=p_uid and b.purga_fitxers_iniciada_al is not null))
    and strpos(concat_ws(' ',p.avatar_url,p.hero_url,p.presentacio_html),regexp_replace(p_nom,'^.*/',''))>0
    and private.mur_cita_objecte(jsonb_build_object('avatar',p.avatar_url,'hero',p.hero_url,'html',p.presentacio_html),p_bucket,p_nom))
   or exists(select 1 from public.notes n
   where n.owner_user_id=p_uid
    and not exists(select 1 from private.baixes b where b.user_id=p_uid and b.purga_fitxers_iniciada_al is not null)
    and strpos(to_jsonb(n)::text,regexp_replace(p_nom,'^.*/',''))>0
    and private.mur_cita_objecte(to_jsonb(n),p_bucket,p_nom)))));
$$;
revoke all on function private.referencia_storage_ugc(text,text,uuid) from public,anon,authenticated,service_role;

-- La cua existent comprova objecte/versió/propietari abans del DELETE físic.
-- Només les còpies públiques citades per este acte; mai originals privats.
-- R22 · Mai un avatar ni un altre fitxer propi que el payload també cite
-- (author_avatar, originals de notes d'abans del 19-09): només còpies
-- públiques (sdp-net-v1 i, des de la ronda 3, les de la promoció anterior).
create or replace function private.mur_encua_media_retirada()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 if to_regclass('public.cua_purga_storage_ugc') is not null and to_regclass('storage.objects') is not null then
  insert into public.cua_purga_storage_ugc as existent(user_id,object_id,object_version,bucket_id,nom,referenciat)
  select old.owner_user_id,o.id,o.version,o.bucket_id,o.name,private.referencia_storage_ugc(o.bucket_id,o.name,old.owner_user_id)
   from storage.objects o where o.bucket_id='mitjans' and coalesce(o.owner_id,o.owner::text)=old.owner_user_id::text
    and private.mur_es_copia_publica(o.name)
    and private.mur_cita_objecte(old.payload,'mitjans',o.name)
   order by o.bucket_id,o.name for update of o
  on conflict(bucket_id,nom) do update set referenciat=excluded.referenciat
   where existent.object_id=excluded.object_id and existent.object_version is not distinct from excluded.object_version
    and existent.user_id=excluded.user_id and (existent.ultim_intent_al is null or existent.ultim_intent_al<now()-interval '10 minutes');
 end if;
 return old;
end;
$$;
revoke all on function private.mur_encua_media_retirada() from public,anon,authenticated,service_role;
drop trigger if exists sdp_mur_encua_media on public.section_submissions;
create trigger sdp_mur_encua_media after delete on public.section_submissions
 for each row execute function private.mur_encua_media_retirada();

-- R22 · La guarda de 2611110100, amb una sola excepció. Tornar a publicar la
-- mateixa foto regenera la mateixa còpia sdp-net-v1. Si eixa còpia encara és
-- a Storage, pendent i sense cap reclamació del worker, l'INSERT de la seua
-- propietària no la pot reocupar: arriba a l'índex únic (23505, Storage
-- respon Duplicate) i el client reutilitza els mateixos bytes, en lloc de
-- rebre SDP-PURGA-004 i publicar la referència privada. La fila de la cua
-- (FOR UPDATE) i l'objecte (FOR KEY SHARE) queden bloquejats fins al final
-- de la transacció. Tota la resta de la guarda no canvia.
create or replace function private.guarda_storage_ugc_en_purga()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_propietari text := coalesce(new.owner_id, new.owner::text);
  v_uid uuid;
  v_bucket_anterior text;
  v_nom_anterior text;
  v_duplicat boolean := false;
begin
  if tg_op = 'UPDATE' then
    v_bucket_anterior := old.bucket_id;
    v_nom_anterior := old.name;
    -- Una FK històrica ON DELETE SET NULL pot llevar només `owner` dins
    -- de l'esborrat d'Auth. Mantín les altres columnes i la identitat de
    -- l'objecte si la ruta encara espera el worker.
    if pg_trigger_depth() > 1 and old.owner is not null and new.owner is null
      and (to_jsonb(new) - 'owner' - 'updated_at') = (to_jsonb(old) - 'owner' - 'updated_at')
      and not exists (select 1 from auth.users u where u.id = old.owner)
      and (new.owner_id = old.owner::text or not exists (
        select 1 from public.cua_purga_storage_ugc c
        where c.bucket_id = old.bucket_id and c.nom = old.name and not c.referenciat)) then
      return new;
    end if;
  end if;
  if tg_op = 'INSERT' and new.bucket_id = 'mitjans' and v_propietari is not null
    and private.mur_es_copia_publica(new.name) then
    perform 1 from public.cua_purga_storage_ugc c
      join storage.objects o on o.bucket_id = c.bucket_id and o.name = c.nom and o.id = c.object_id
        and o.version is not distinct from c.object_version
        and coalesce(o.owner_id, o.owner::text) = c.user_id::text
     where c.bucket_id = new.bucket_id and c.nom = new.name and not c.referenciat
       and c.intents = 0 and c.user_id::text = v_propietari
     for update of c for key share of o;
    v_duplicat := found;
  end if;
  if not v_duplicat and (exists (select 1 from public.cua_purga_storage_ugc c
    where (c.bucket_id, c.nom) in ((new.bucket_id, new.name), (v_bucket_anterior, v_nom_anterior))
      and not c.referenciat)
    or exists (select 1 from private.purga_storage_pendent c
      where c.bucket_id = 'xat_adjunts'
        and (c.bucket_id, c.nom) in ((new.bucket_id, new.name), (v_bucket_anterior, v_nom_anterior))
        and not c.referenciat and c.feta_al is null)) then
    raise exception 'SDP-PURGA-004: ruta en procés de purga.' using errcode = '55000';
  end if;

  if new.bucket_id not in ('mitjans', 'mitjans_privats', 'xat_adjunts')
    or v_propietari is null or v_propietari !~ '^[[:xdigit:]]{8}(-[[:xdigit:]]{4}){3}-[[:xdigit:]]{12}$' then
    return new;
  end if;
  v_uid := v_propietari::uuid;
  -- Un UPDATE de Storage ja pot tindre bloquejada la seua fila. No espera
  -- un bloqueig d'Auth que estiga esperant eixa mateixa fila. Qualsevol
  -- bloqueig aliè sobre la fila de la persona es tradueix en un error
  -- reintentable i explicat, no en un 55P03 sense context.
  begin
    perform 1 from auth.users u where u.id = v_uid for key share nowait;
  exception when lock_not_available then
    raise exception 'SDP-PURGA-005: compte en procés de purga o ocupat; torna-ho a provar.' using errcode = '55000';
  end;
  if not found or exists (select 1 from private.baixes b
    where b.user_id = v_uid and b.purga_fitxers_iniciada_al is not null) then
    raise exception 'SDP-PURGA-005: compte en procés de purga.' using errcode = '55000';
  end if;
  return new;
end;
$$;
revoke all on function private.guarda_storage_ugc_en_purga() from public, anon, authenticated, service_role;

-- R22 · Un acte nou que torna a citar una còpia pròpia encuada la conserva.
-- Primer bloqueja l'objecte: si el worker l'estava esborrant, la guarda
-- d'esborrat veu esta cita quan es confirma i refusa el DELETE. Una fila
-- reclamada fa poc no canvia (la mateixa regla de deu minuts que la cua).
create or replace function private.mur_conserva_copies_citades(p_payload jsonb,p_uid uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
 if p_uid is null or p_payload is null then return; end if;
 perform 1 from public.cua_purga_storage_ugc c
   join storage.objects o on o.bucket_id=c.bucket_id and o.name=c.nom and o.id=c.object_id
  where c.bucket_id='mitjans' and c.user_id=p_uid and not c.referenciat
    and private.mur_es_copia_publica(c.nom) and private.mur_cita_objecte(p_payload,'mitjans',c.nom)
  for key share of o;
 update public.cua_purga_storage_ugc c set referenciat=true
  where c.bucket_id='mitjans' and c.user_id=p_uid and not c.referenciat
    and (c.ultim_intent_al is null or c.ultim_intent_al<now()-interval '10 minutes')
    and private.mur_es_copia_publica(c.nom) and private.mur_cita_objecte(p_payload,'mitjans',c.nom)
    and exists(select 1 from storage.objects o where o.bucket_id=c.bucket_id and o.name=c.nom
      and o.id=c.object_id and o.version is not distinct from c.object_version);
end;
$$;
revoke all on function private.mur_conserva_copies_citades(jsonb,uuid) from public,anon,authenticated,service_role;

create or replace function private.mur_nota_estat_veridic()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 if new.status in ('paperera','arxivada') or new.folder_id='paperera' or not new.is_published or new.published_submission_id is null then
  new.is_published:=false; new.published_submission_id:=null;
 elsif not exists(select 1 from public.section_submissions s where s.id=new.published_submission_id
    and s.owner_user_id=new.owner_user_id and s.tenant_id=new.tenant_id) then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: vincle de publicació no disponible.';
 end if;
 return new;
end;
$$;
revoke all on function private.mur_nota_estat_veridic() from public,anon,authenticated,service_role;
drop trigger if exists sdp_mur_nota_estat_veridic on public.notes;
create trigger sdp_mur_nota_estat_veridic before insert or update on public.notes
 for each row execute function private.mur_nota_estat_veridic();

create or replace function private.mur_retira_des_de_nota()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 if tg_op='DELETE' then delete from private.mur_revocacions_notes where note_id=old.id; end if;
 if old.published_submission_id is not null and (tg_op='DELETE' or new.published_submission_id is distinct from old.published_submission_id
    or not new.is_published or new.status in ('paperera','arxivada') or new.folder_id='paperera') then
  delete from public.section_submissions s where s.id=old.published_submission_id
   and s.owner_user_id=old.owner_user_id and s.tenant_id=old.tenant_id;
 end if;
 if tg_op='UPDATE' and new.is_published and new.published_submission_id is not null then
  insert into private.mur_actes_notes(act_id,note_id,tenant_id,owner_user_id,created_note_revision)
  values(new.published_submission_id,new.id,new.tenant_id,new.owner_user_id,new.revision) on conflict do nothing;
 end if;
 return null;
end;
$$;
revoke all on function private.mur_retira_des_de_nota() from public,anon,authenticated,service_role;

-- La nota governa l'acte vinculat; els clients usen la RPC transaccional.
-- Els DELETE/UPDATE crus no poden invertir l'ordre dels panys de nota i acte.
create or replace function private.mur_acte_vinculat(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from private.mur_actes_notes where act_id=p_id and retired_at is null);
$$;
revoke all on function private.mur_acte_vinculat(uuid) from public,anon,authenticated,service_role;
grant execute on function private.mur_acte_vinculat(uuid) to authenticated;
drop policy if exists "r21_v2 edita acte per RPC" on public.section_submissions;
create policy "r21_v2 edita acte per RPC" on public.section_submissions as restrictive for update to authenticated
 using(not private.mur_acte_vinculat(id));
drop policy if exists "r21_v2 retira acte per RPC" on public.section_submissions;
create policy "r21_v2 retira acte per RPC" on public.section_submissions as restrictive for delete to authenticated
 using(not private.mur_acte_vinculat(id));

-- Reparació dels estats heretats, amb els mateixos triggers que una retirada.
update public.notes n set is_published=false,published_submission_id=null
 where ((n.status in ('paperera','arxivada') or n.folder_id='paperera') and (n.is_published or n.published_submission_id is not null))
  or (n.is_published and n.published_submission_id is null)
  or (not n.is_published and n.published_submission_id is not null);

create or replace function public.publica_nota_al_mur(
 p_note_id uuid,p_act_id uuid,p_section_id text,p_payload jsonb,p_expected_revision integer,p_operation_id uuid
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare n public.notes; s public.section_submissions; a private.mur_actes_notes; op private.mur_operacions_notes; v_org uuid; v_payload jsonb; v_title text; v_description text;
begin
 if auth.uid() is null or p_note_id is null or p_act_id is null or p_operation_id is null
   or p_expected_revision is null or p_expected_revision<1 or p_section_id not in ('mur','mercat','events','multimedia')
   or (p_payload is not null and jsonb_typeof(p_payload) is distinct from 'object') then
  raise exception using errcode='22023',message='SDP-MUR-PUBLICACIO: acte de publicació invàlid.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:operacio:'||p_operation_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:nota:'||p_note_id::text,0));
 select * into n from public.notes where id=p_note_id for update;
 if not found or n.owner_user_id is distinct from auth.uid()
  or not private.is_town_member(n.tenant_id) or not private.copub_compte_actiu(auth.uid()) then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: nota no disponible per a esta sessió.';
 end if;
 select * into a from private.mur_actes_notes where act_id=p_act_id;
 -- Consulta de rebut abans del flush CAS: no canvia cap fila ni crea intents.
 if p_payload is null then
  select * into op from private.mur_operacions_notes where operation_id=p_operation_id;
  if not found then
   -- El V1 no tenia rebuts d'operació. La retirada d'un acte legacy verificat
   -- continua demostrable pel ledger propi, sense intentar recrear note.id.
   if p_act_id=p_note_id and a.act_id is not null and a.owner_user_id=auth.uid()
    and a.note_id=n.id and a.tenant_id=n.tenant_id and (a.retired_at is not null
      or exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=p_act_id
        and r.owner_user_id=auth.uid() and r.tenant_id=n.tenant_id)) then
    return jsonb_build_object('publicacio',null,'nota_revision',n.revision,
     'publicada_revision',coalesce((select max(x.confirmed_revision) from private.mur_operacions_notes x
       where x.act_id=p_act_id and x.note_id=n.id and x.owner_user_id=auth.uid()),a.created_note_revision),
     'replay',true,'retirada',true);
   end if;
   return null;
  end if;
  if op.owner_user_id is distinct from auth.uid() or op.note_id is distinct from n.id or op.act_id<>p_act_id then
   raise exception using errcode='42501',message='SDP-MUR-OWNER: operació no disponible per a esta sessió.';
  end if;
  select * into s from public.section_submissions where id=p_act_id and n.published_submission_id=p_act_id and n.is_published;
  if not found then return jsonb_build_object('publicacio',null,'nota_revision',n.revision,'publicada_revision',op.confirmed_revision,'replay',true,'retirada',true); end if;
  return jsonb_build_object('publicacio',to_jsonb(s),'nota_revision',n.revision,'publicada_revision',op.confirmed_revision,'replay',true);
 end if;
 if n.status in ('paperera','arxivada') or n.folder_id='paperera' then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: nota no disponible per a esta sessió.';
 end if;
 select * into a from private.mur_actes_notes where act_id=p_act_id;
 if found and (a.owner_user_id is distinct from auth.uid() or a.note_id<>n.id or a.tenant_id<>n.tenant_id) then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: acte no disponible per a esta sessió.';
 end if;
 if (a.act_id is not null and a.retired_at is not null) or exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=p_act_id) then
  raise exception using errcode='23514',message='SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou.';
 end if;
 -- V1 publicava amb note.id. Només l'acte viu que la migració ha
 -- verificat (ledger, owner, poble i FK actual) pot continuar editant-se.
 -- Un primer POST o un acte retirat continuen exigint un UUID independent.
 if p_act_id=p_note_id and not (a.act_id is not null and a.owner_user_id=auth.uid()
   and a.note_id=n.id and a.tenant_id=n.tenant_id and n.is_published
   and n.published_submission_id=p_act_id and exists(select 1 from public.section_submissions x
    where x.id=p_act_id and x.owner_user_id=auth.uid() and x.tenant_id=n.tenant_id)) then
  raise exception using errcode='22023',message='SDP-MUR-PUBLICACIO: un acte nou necessita un UUID independent de la nota.';
 end if;
 if n.published_submission_id is not null and n.published_submission_id<>p_act_id then
  raise exception using errcode='40001',message='SDP-MUR-REVISION: la nota ja té un acte actiu; recarrega-la.';
 end if;
 select * into op from private.mur_operacions_notes where operation_id=p_operation_id;
 if found then
  if op.owner_user_id is distinct from auth.uid() or op.note_id<>n.id or op.act_id<>p_act_id then
   raise exception using errcode='42501',message='SDP-MUR-OWNER: operació no disponible per a esta sessió.';
  end if;
  select * into s from public.section_submissions where id=p_act_id;
  if found and n.published_submission_id=p_act_id and n.is_published then
   return jsonb_build_object('publicacio',to_jsonb(s),'nota_revision',n.revision,'publicada_revision',op.confirmed_revision,'replay',true);
  end if;
  raise exception using errcode='23514',message='SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou.';
 end if;
 if n.revision<>p_expected_revision then
  raise exception using errcode='40001',message='SDP-MUR-REVISION: la nota ha canviat; recarrega-la.';
 end if;
 if jsonb_typeof(p_payload->'payload')='object' then
  v_payload:=p_payload->'payload'; v_title:=p_payload->>'title'; v_description:=p_payload->>'description';
 else v_payload:=p_payload; v_title:=p_payload->>'title'; v_description:=p_payload->>'description'; end if;
 if p_payload ? 'author_org_id' and nullif(p_payload->>'author_org_id','') is not null then
  begin v_org:=(p_payload->>'author_org_id')::uuid;
  exception when invalid_text_representation then raise exception using errcode='22023',message='SDP-MUR-PUBLICACIO: autoria invàlida.'; end;
 end if;
 v_payload:=(v_payload-array['owner_user_id','ownerUserId','author_org_id','authorOrgId','author_id','author_user_id',
  'author_agent_id','authorAgentId','isSystem','isAvis','is_pinned','pinned_position','autor']::text[])
  ||jsonb_build_object('id',p_act_id,'ownerUserId',auth.uid(),'author_org_id',v_org,'authorOrgId',v_org,'sectionId',p_section_id);
 if not public.pot_signar_com_organitzacio(v_org) or not private.mur_public_eligible(v_payload) then
  raise exception using errcode='42501',message='SDP-MUR-PUBLICACIO: no es pot publicar este contingut.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||p_act_id::text,0));
 select * into s from public.section_submissions where id=p_act_id for update;
 if found then
  if a.act_id is null or s.owner_user_id is distinct from auth.uid() or s.tenant_id<>n.tenant_id then
   raise exception using errcode='42501',message='SDP-MUR-OWNER: acte no disponible per a esta sessió.';
  end if;
  -- R22 · Un acte propi no canvia de secció: el mateix codi que el
  -- disparador d'autoria (idea61-01), també fora de la finestra carregada.
  if s.section_id<>p_section_id then
   raise exception using errcode='22023',message='SDP-SEC-002: una publicació no pot canviar de secció.';
  end if;
  update public.section_submissions set title=coalesce(nullif(v_title,''),n.title),
   description=v_description,payload=v_payload,author_org_id=v_org where id=p_act_id returning * into s;
 else
  insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,author_org_id)
  values(p_act_id,n.tenant_id,auth.uid(),p_section_id,coalesce(nullif(v_title,''),n.title),v_description,v_payload,v_org) returning * into s;
 end if;
 perform private.mur_conserva_copies_citades(s.payload,auth.uid());
 update public.notes set is_published=true,published_submission_id=p_act_id where id=n.id returning * into n;
 insert into private.mur_actes_notes(act_id,note_id,tenant_id,owner_user_id,created_note_revision)
 values(p_act_id,n.id,n.tenant_id,n.owner_user_id,n.revision) on conflict do nothing;
 insert into private.mur_operacions_notes(operation_id,act_id,note_id,owner_user_id,confirmed_revision)
 values(p_operation_id,p_act_id,n.id,auth.uid(),n.revision);
 return jsonb_build_object('publicacio',to_jsonb(s),'nota_revision',n.revision,'publicada_revision',n.revision,'replay',false);
end;
$$;
revoke all on function public.publica_nota_al_mur(uuid,uuid,text,jsonb,integer,uuid) from public,anon,authenticated,service_role;
grant execute on function public.publica_nota_al_mur(uuid,uuid,text,jsonb,integer,uuid) to authenticated;

create or replace function public.revoca_publicacio_de_nota(p_id uuid,p_tenant_id uuid,p_expected_revision integer,p_publicacio_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare n public.notes; a private.mur_actes_notes; v_act uuid;
begin
 if auth.uid() is null or p_id is null or p_tenant_id is null or p_expected_revision is null or p_expected_revision<1 then
  raise exception using errcode='42501',message='SDP-MUR-OWNER: nota no disponible per a esta sessió.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sdp:mur:nota:'||p_id::text,0));
 if p_publicacio_id is not null then
  select * into a from private.mur_actes_notes where act_id=p_publicacio_id and (note_id=p_id or note_id is null)
   and tenant_id=p_tenant_id and owner_user_id=auth.uid();
  if found and a.retired_at is not null then return true; end if;
  if found then v_act:=a.act_id; end if;
 else
  if exists(select 1 from private.mur_revocacions_notes r where r.note_id=p_id and r.expected_revision=p_expected_revision
     and r.owner_user_id=auth.uid() and r.tenant_id=p_tenant_id) then return true; end if;
 end if;
 select * into n from public.notes where id=p_id for update;
 if n.id is null or n.owner_user_id is distinct from auth.uid() or n.tenant_id<>p_tenant_id then
  if v_act is not null then perform public.revoca_publicacio_mur(v_act,p_tenant_id); return true; end if;
  raise exception using errcode='42501',message='SDP-MUR-OWNER: nota no disponible per a esta sessió.';
 end if;
 if p_publicacio_id is not null then
  if v_act is null and n.published_submission_id=p_publicacio_id then v_act:=p_publicacio_id; end if;
  if v_act is null then
   raise exception using errcode='42501',message='SDP-MUR-OWNER: acte no disponible per a esta sessió.';
  end if;
 else
  if n.revision<>p_expected_revision then
   -- Un PATCH d'estat o una edició privada pot haver avançat la revisió.
   -- Resolem l'acte que ja existia en eixa revisió, mai una republicació nova.
   select * into a from private.mur_actes_notes where note_id=p_id and tenant_id=p_tenant_id
    and owner_user_id=auth.uid() and created_note_revision<=p_expected_revision
    order by created_note_revision desc,created_at desc limit 1;
   if not found then raise exception using errcode='40001',message='SDP-MUR-REVISION: la nota ha canviat; recarrega-la.'; end if;
   if a.retired_at is not null then
    insert into private.mur_revocacions_notes(note_id,expected_revision,tenant_id,owner_user_id)
     values(p_id,p_expected_revision,p_tenant_id,auth.uid()) on conflict do nothing;
    return true;
   end if;
   if n.published_submission_id is distinct from a.act_id then
    raise exception using errcode='40001',message='SDP-MUR-REVISION: la nota ha canviat; recarrega-la.';
   end if;
   v_act:=a.act_id;
  else v_act:=n.published_submission_id; end if;
 end if;
 if v_act is not null then perform public.revoca_publicacio_mur(v_act,p_tenant_id); end if;
 if n.published_submission_id is not distinct from v_act then
  update public.notes set is_published=false,published_submission_id=null where id=n.id and is_published;
 end if;
 insert into private.mur_revocacions_notes(note_id,expected_revision,tenant_id,owner_user_id)
 values(p_id,p_expected_revision,p_tenant_id,auth.uid()) on conflict do nothing;
 return true;
end;
$$;
revoke all on function public.revoca_publicacio_de_nota(uuid,uuid,integer,uuid) from public,anon,authenticated,service_role;
grant execute on function public.revoca_publicacio_de_nota(uuid,uuid,integer,uuid) to authenticated;
create or replace function public.revoca_publicacio_de_nota(p_id uuid,p_tenant_id uuid,p_expected_revision integer)
returns boolean language sql volatile security definer set search_path = '' as $$
 select public.revoca_publicacio_de_nota(p_id,p_tenant_id,p_expected_revision,null);
$$;
revoke all on function public.revoca_publicacio_de_nota(uuid,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.revoca_publicacio_de_nota(uuid,uuid,integer) to authenticated;

-- Una política permissiva antiga no pot reobrir la llista anònima. Les
-- descàrregues del bucket públic per URL continuen a través de Storage.
do $$ begin
 if to_regclass('storage.objects') is not null then
  execute 'drop policy if exists "r21_v2 mitjans sense llista anon" on storage.objects';
  execute 'create policy "r21_v2 mitjans sense llista anon" on storage.objects as restrictive for select to anon using (bucket_id <> ''mitjans'')';
  execute 'drop policy if exists "r21_v2 mitjans llista propia" on storage.objects';
  execute 'create policy "r21_v2 mitjans llista propia" on storage.objects as restrictive for select to authenticated using (bucket_id <> ''mitjans'' or coalesce(owner_id,owner::text) = (select auth.uid())::text)';
 end if;
end $$;

-- El subjecte viu respecta la mateixa elegibilitat que el Mur públic.
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
    -- Identitat estable i ruta canònica de cada municipi.
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
      and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
      and private.mur_public_eligible(s.payload)
      and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
    limit 1;
    -- Un UUID de publicació absent o privat no pot reaparéixer pel catàleg.
    if v_clau is null and p_id ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then return; end if;
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
    -- Pàgines amb xat: mateix contracte de rutes.
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


create or replace function private.mur_scrub_subjecte_inactiu()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
 if new.visibility<>'public' or new.moderation_state<>'visible' or new.deleted_at is not null or not private.mur_public_eligible(new.payload) then
  if to_regclass('public.xat_fils') is not null then
   update public.xat_fils set titol='Publicació retirada',subjecte_titol=null,subjecte_ruta=null,subjecte_uri=null
    where tenant_id=new.tenant_id and subjecte_id=new.id::text
    and subjecte_tipus in ('publicacio','producte','esdeveniment','multimedia');
  end if;
 end if;
 return null;
end;
$$;
revoke all on function private.mur_scrub_subjecte_inactiu() from public,anon,authenticated,service_role;
drop trigger if exists sdp_mur_scrub_subjecte on public.section_submissions;
create trigger sdp_mur_scrub_subjecte after update on public.section_submissions
 for each row execute function private.mur_scrub_subjecte_inactiu();
do $$ begin
 if to_regclass('public.xat_fils') is not null then
  update public.xat_fils f set titol='Publicació retirada',subjecte_titol=null,subjecte_ruta=null,subjecte_uri=null
   where f.subjecte_tipus in ('publicacio','producte','esdeveniment','multimedia')
    and f.subjecte_id ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
    and not exists(select 1 from public.section_submissions s where s.tenant_id=f.tenant_id and s.id::text=f.subjecte_id
     and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
     and private.mur_public_eligible(s.payload)
     and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id));
 end if;
end $$;

-- R22 (sql-05 · workspace-05) · Límits de mida en escriure al Mur, el Mercat,
-- l'Agenda i Multimèdia: títol (columna i payload.title) fins a 1.000
-- caràcters, resum (columna i payload.description) fins a 20.000 i cos
-- (payload.content) fins a 100.000, el mateix tall que ja aplica
-- private.mur_text_public. Val per a publica_nota_al_mur i per a l'upsert
-- directe d'una publicació independent, que passen tots dos per esta taula.
-- No és un CHECK: un CHECK, també NOT VALID, rebutjaria qualsevol UPDATE d'una
-- fila antiga més llarga (moderar-la, sanejar-la o canviar-ne l'estat). Ací
-- una fila existent no es trenca: només no pot créixer per damunt del límit, i
-- una fila nova no el pot passar. Les notes privades ('notes') no hi entren.
-- El nom fa que s'execute després dels altres BEFORE, sobre el valor sanejat.
create or replace function private.mur_mides_text(p_title text,p_description text,p_payload jsonb)
returns integer[] language sql immutable set search_path = '' as $$
 select array[char_length(p_title),
  case when jsonb_typeof(p_payload->'title')='string' then char_length(p_payload->>'title') end,
  char_length(p_description),
  case when jsonb_typeof(p_payload->'description')='string' then char_length(p_payload->>'description') end,
  case when jsonb_typeof(p_payload->'content')='string' then char_length(p_payload->>'content') end];
$$;
revoke all on function private.mur_mides_text(text,text,jsonb) from public,anon,authenticated,service_role;

-- SECURITY DEFINER només per a llegir les mides de la fila del mateix id que
-- un upsert (ON CONFLICT DO UPDATE) actualitzarà: el BEFORE INSERT del valor
-- proposat s'executa abans de saber-ho, i sense eixa fila un upsert sense
-- canvis d'una publicació antiga més llarga es rebutjaria. No torna cap dada.
create or replace function private.mur_limita_mida()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
declare
 v_camp constant text[] := array['títol','títol','resum','resum','cos'];
 v_maxim constant integer[] := array[1000,1000,20000,20000,100000];
 v_nou integer[]; v_vell integer[]; i integer;
begin
 v_nou := private.mur_mides_text(new.title,new.description,new.payload);
 if tg_op='UPDATE' then
  if old.section_id in ('mur','mercat','events','multimedia') then
   v_vell := private.mur_mides_text(old.title,old.description,old.payload);
  end if;
 else
  select private.mur_mides_text(s.title,s.description,s.payload) into v_vell from public.section_submissions s
   where s.id=new.id and s.section_id in ('mur','mercat','events','multimedia');
 end if;
 for i in 1..cardinality(v_camp) loop
  if coalesce(v_nou[i],0)>v_maxim[i] and (v_vell is null or coalesce(v_nou[i],0)>coalesce(v_vell[i],0)) then
   raise exception using errcode='22001',
    message=format('SDP-MUR-MIDA: el %s d''una publicació no pot passar de %s caràcters.',v_camp[i],v_maxim[i]);
  end if;
 end loop;
 return new;
end;
$$;
revoke all on function private.mur_limita_mida() from public,anon,authenticated,service_role;
drop trigger if exists section_submissions_limita_mida on public.section_submissions;
create trigger section_submissions_limita_mida before insert or update of title,description,payload,section_id
 on public.section_submissions for each row
 when (new.section_id in ('mur','mercat','events','multimedia'))
 execute function private.mur_limita_mida();
notify pgrst, 'reload schema';
commit;

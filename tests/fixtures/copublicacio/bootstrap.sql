-- Només per a una base PostgreSQL de prova buida i descartable.
-- Després: apliqueu 2609080000, afegiu les columnes del padró R18
-- amb bootstrap-perfils.sql, i apliqueu 2610061448 i 2611111735.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
grant usage on schema auth to anon, authenticated;
create table auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz,
  deleted_at timestamptz,
  banned_until timestamptz,
  raw_user_meta_data jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('aal', nullif(current_setting('request.jwt.claim.aal', true), ''));
$$;

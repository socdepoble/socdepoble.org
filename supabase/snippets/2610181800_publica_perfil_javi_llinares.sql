-- ============================================================================
-- 261018_1800 · Pla 261018_1605 · Tasca 0 (D7) i Tasca 1 · Publica la fitxa
-- remota de la persona pilot (is_public = true), UNA SOLA VEGADA
-- Ordre del Mestre (18-10-2026; pla
-- 261018_1605_pla_implementacio_perfil_public_multimedia_i_poble.md): la fitxa
-- de la persona pilot és pública, com la de la llavor.
--
-- NO ÉS CAP MIGRACIÓ: és un fragment per a l'editor SQL de Supabase. No el
-- llança cap porta ni cap agent: l'executa el Mestre, a mà, DESPRÉS d'aplicar
-- 2610160250_perfil_update_propi.sql (i, si vol, després de
-- 2610181800_alinea_perfil_javi_llinares.sql; no en depén).
--
-- EXECUTEU-LO UNA SOLA VEGADA, a posta. La fitxa privada continua sent una tria
-- voluntària («El compte»): si després la feu privada, una segona execució la
-- tornaria a fer pública. Per això no va amb l'alineació dels buits, que sí que
-- es pot repetir sense desfer res.
--
-- QUÈ FA: is_public = true a la fila de public.profiles del compte de la
-- persona pilot, resolt pel correu confirmat (o amb una identitat de Google),
-- com l'alineació; si no n'hi ha exactament un, avorta sencer (SDP-PILOT-001).
-- Res més: ni visibility (el CHECK només admet 'private', 2609080000) ni cap
-- altra columna. Una fitxa amb la baixa demanada no es toca.
--
-- ABANS, a soles: executeu esta consulta de només lectura i guardeu-ne el
-- resultat (per a desfer-ho, `update public.profiles set is_public = <el
-- d'abans> where id = '<l'id del resultat>';`).
--
--   select p.id, p.is_public, p.baixa_demanada_at
--     from public.profiles p
--     join auth.users u on u.id = p.id
--    where lower(u.email) = 'socdepoblecom@gmail.com';
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare
  v_comptes integer;
begin
  select count(*) into v_comptes
    from auth.users u
   where lower(u.email) = 'socdepoblecom@gmail.com'
     and (u.email_confirmed_at is not null
          or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google'));
  if v_comptes <> 1 then
    raise exception 'SDP-PILOT-001: hi ha % comptes acreditats amb el correu de la persona pilot; no es publica res.', v_comptes;
  end if;
end
$$;

update public.profiles p
   set is_public = true
  from auth.users u
 where u.id = p.id
   and lower(u.email) = 'socdepoblecom@gmail.com'
   and (u.email_confirmed_at is not null
        or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google'))
   and p.baixa_demanada_at is null
   and p.is_public is distinct from true;

commit;

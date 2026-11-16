-- R30 · P1-79 · CAS de la curadoria WordPress; depén de 2611110455.
-- Migració additiva. Cap execució remota automàtica.
-- Un instant nul significa «encara no existix»; mai «sobreescriu qualsevol».
begin;
-- SQL NULL no acredita AAL2: tancament també per a la lectura heretada.
create or replace function private.pot_revisar_importacio_wp()
returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(auth.uid() is not null and auth.jwt()->>'aal'='aal2'
  and (coalesce(private.es_superadmin(),false) or coalesce(private.pot_curar_cultura(),false)),false);
$$;
revoke all on function private.pot_revisar_importacio_wp() from public,anon,authenticated,service_role;
create or replace function public.desa_revisio_editorial_wp_cas(
 p_wp_id integer,p_estat text,p_nota text default '',p_autoria text default 'Sóc de Poble',
 p_desti text default 'mur',p_actualitzat_esperat timestamptz default null
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r public.revisions_editorials_wp; v_nota text:=coalesce(p_nota,'');
 v_autoria text:=coalesce(nullif(btrim(p_autoria),''),'Sóc de Poble'); v_desti text:=coalesce(nullif(btrim(p_desti),''),'mur');
begin
 if not coalesce(private.pot_revisar_importacio_wp(),false) then raise exception 'SDP-WP-REV-403: cal curadoria amb segon factor.' using errcode='42501'; end if;
 if p_wp_id is null or p_wp_id<=0 or p_estat is null or p_estat not in ('pendent_admin','aprovat','amb_observacions')
 or char_length(v_nota)>4000 or char_length(v_autoria)>256 or char_length(v_desti)>64 or v_desti !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 or (p_actualitzat_esperat is not null and not isfinite(p_actualitzat_esperat)) then
  raise exception 'SDP-WP-REV-400: revisió invàlida.' using errcode='22023'; end if;
 -- Serialitza també la primera inserció: no hi ha fila per bloquejar encara.
 perform pg_catalog.pg_advisory_xact_lock(302511,p_wp_id);
 select * into r from public.revisions_editorials_wp where wp_id=p_wp_id for update;
 if found then
  if p_actualitzat_esperat is null or r.actualitzat_a<>p_actualitzat_esperat then
   raise exception 'SDP-WP-REV-409: la revisió ha canviat.' using errcode='40001'; end if;
  update public.revisions_editorials_wp set estat=p_estat,nota=v_nota,autoria=v_autoria,desti=v_desti,
   revisat_per=auth.uid(),actualitzat_a=greatest(clock_timestamp(),r.actualitzat_a+interval '1 microsecond')
   where wp_id=p_wp_id returning * into r;
 else
  if p_actualitzat_esperat is not null then raise exception 'SDP-WP-REV-409: la revisió ja no existix.' using errcode='40001'; end if;
  insert into public.revisions_editorials_wp(wp_id,estat,nota,autoria,desti,revisat_per,actualitzat_a)
   values(p_wp_id,p_estat,v_nota,v_autoria,v_desti,auth.uid(),clock_timestamp()) returning * into r;
 end if;
 return jsonb_build_object('wp_id',r.wp_id,'estat',r.estat,'nota',r.nota,'autoria',r.autoria,'desti',r.desti,'actualitzat_a',r.actualitzat_a);
end $$;
revoke all on function public.desa_revisio_editorial_wp_cas(integer,text,text,text,text,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.desa_revisio_editorial_wp_cas(integer,text,text,text,text,timestamptz) to authenticated;
-- Conserva la signatura antiga. Només pot crear: no és un bypass de CAS.
create or replace function public.desa_revisio_editorial_wp(p_wp_id integer,p_estat text,p_nota text default '',p_autoria text default 'Sóc de Poble',p_desti text default 'mur')
returns jsonb language sql volatile security definer set search_path = '' as $$
 select public.desa_revisio_editorial_wp_cas(p_wp_id,p_estat,p_nota,p_autoria,p_desti,null);
$$;
notify pgrst,'reload schema';
commit;

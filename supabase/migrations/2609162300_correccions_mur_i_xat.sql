-- MIGRACIÓ: Proteccions C1 i C2 (Auditoria Extrema)
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- C1: MUR SUPLANTABLE
-- El trigger de publicacions ha de netejar el payload de camps sensibles
-- per evitar que un atacant injecte un `id` o `created_at` maliciós i 
-- sobreescriga una publicació existent en la vista del frontend (`mergeById`).
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.trg_force_submission_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_author_name text;
begin
  if TG_OP = 'UPDATE' then
    if new.tenant_id != old.tenant_id then
      raise exception 'SDP-SEC-001: tenant_id is immutable';
    end if;
    if new.section_id != old.section_id then
      raise exception 'SDP-SEC-002: section_id is immutable';
    end if;
  end if;

  if new.author_org_id is not null then
    select name into v_author_name from public.organizations where id = new.author_org_id;
  else
    select full_name into v_author_name from public.profiles where id = new.owner_user_id;
  end if;
  
  if v_author_name is not null then
    new.payload = jsonb_set(new.payload, '{author_name}', to_jsonb(v_author_name));
  end if;
  
  -- PROTECCIÓ C1: Purguem qualsevol intent de suplantar les claus d'identitat
  new.payload = new.payload - 'id' - 'created_at' - 'author';
  
  return new;
end;
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- C2: XAT OBERT
-- Qualsevol participant podia afegir qualsevol altre usuari a un fil,
-- permetent a un tercer llegir tot l'historial (C2). 
-- Ara només el creador del fil pot afegir-hi persones.
-- ──────────────────────────────────────────────────────────────────────────────

drop policy if exists "xat_participants_insercio" on public.xat_participants;
create policy "xat_participants_insercio" on public.xat_participants
for insert to authenticated
with check (
  exists (
    select 1 from public.xat_fils t 
    where t.id = fil_id and t.creat_per = auth.uid()
  )
);

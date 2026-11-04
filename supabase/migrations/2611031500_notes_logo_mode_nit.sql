-- IDEA-70 · Variant del logotip de la nota per al mode nit.
-- Additiva: l'autoria i les polítiques RLS no canvien.
-- Depén de: 2609140000_schema_notes.sql i 2610072230_mur_imatges_propies.sql.
-- Idempotent, en una transacció. El trigger existent reutilitza la mateixa
-- funció de neteja, ampliada només amb logo_image_dark (IDEA70-02 de l'auditoria).
-- Preparada al carril 2; pendent d'aplicació i verificació remota.
-- Verificació posterior (lectura):
--   select column_name from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'logo_image_dark';
-- No neteja files existents ni canvia dates o permisos. La regla d'origen
-- continua sent private.mur_imatge_propia; no hi ha cap excepció per al mode nit.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
alter table public.notes add column if not exists logo_image_dark text;
comment on column public.notes.logo_image_dark is
  'Logotip de capçalera per al mode fosc; logo_image continua sent la variant de dia.';

create or replace function private.mur_neteja_imatges(p_payload jsonb, p_origens text[])
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_payload jsonb := p_payload;
  v_clau    text;
  v_llista  jsonb;
begin
  if jsonb_typeof(v_payload) is distinct from 'object' then
    return v_payload;
  end if;

  foreach v_clau in array array['image', 'image_url', 'imageSrc', 'src', 'author_avatar', 'avatar_url', 'avatarUrl', 'logo_image', 'logo_image_dark'] loop
    if not private.mur_imatge_propia(v_payload -> v_clau, p_origens) then
      v_payload := v_payload - v_clau;
    end if;
  end loop;

  if jsonb_typeof(v_payload -> 'images') = 'array' then
    select coalesce(jsonb_agg(e.valor order by e.ordre), '[]'::jsonb)
      into v_llista
    from jsonb_array_elements(v_payload -> 'images') with ordinality as e(valor, ordre)
    where private.mur_imatge_propia(e.valor, p_origens);
    v_payload := jsonb_set(v_payload, '{images}', v_llista);
  elsif v_payload ? 'images' then
    v_payload := v_payload - 'images';
  end if;

  if jsonb_typeof(v_payload -> 'variations') = 'array' then
    select coalesce(jsonb_agg(
             case
               when jsonb_typeof(e.valor) = 'object' and not private.mur_imatge_propia(e.valor -> 'image', p_origens)
                 then e.valor - 'image'
               else e.valor
             end order by e.ordre), '[]'::jsonb)
      into v_llista
    from jsonb_array_elements(v_payload -> 'variations') with ordinality as e(valor, ordre);
    v_payload := jsonb_set(v_payload, '{variations}', v_llista);
  end if;

  return v_payload;
end;
$$;
revoke execute on function private.mur_neteja_imatges(jsonb, text[]) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;

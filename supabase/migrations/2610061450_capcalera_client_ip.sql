-- V-FW-02, V-LOGIN-07: Actualització de la lectura d'IPs (fix estil Vigilante 2.11.8)
create or replace function private.capcalera_client(p_que text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_h jsonb;
  v_xff text;
  v_arr text[];
begin
  begin
    v_h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return null;
  end;
  if v_h is null then
    return null;
  end if;
  if p_que = 'ip' then
    -- Es prefereix cf-connecting-ip (blindat per Cloudflare) o x-real-ip
    if v_h ? 'cf-connecting-ip' then
      return nullif(btrim(v_h ->> 'cf-connecting-ip'), '');
    elsif v_h ? 'x-real-ip' then
      return nullif(btrim(v_h ->> 'x-real-ip'), '');
    elsif v_h ? 'x-forwarded-for' then
      -- Si només hi ha x-forwarded-for, la IP reial afegida per la nostra passarel·la
      -- (Supabase/Vercel) és la DRETA, no l'esquerra (esquerra = falsificable pel visitant).
      v_xff := v_h ->> 'x-forwarded-for';
      v_arr := string_to_array(v_xff, ',');
      return nullif(btrim(v_arr[array_length(v_arr, 1)]), '');
    end if;
    return null;
  elsif p_que = 'ua' then
    return nullif(left(btrim(coalesce(v_h ->> 'user-agent', '')), 300), '');
  end if;
  return null;
end;
$$;

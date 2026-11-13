-- R21.6 · Preserve standalone ISO dates/year ranges without weakening phones.
-- Additive override: never edit the already-deployed R21.1 migration in place.
-- Ambiguous long numeric identifiers remain conservatively redacted.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create or replace function private.mur_es_data_iso(p_text text)
returns boolean language sql immutable set search_path = '' as $$
  select case when p_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    substr(p_text,1,4)::integer between 1 and 9999
    and substr(p_text,6,2)::integer between 1 and 12
    and substr(p_text,9,2)::integer between 1 and
      case substr(p_text,6,2)::integer
        when 2 then 28 + case when substr(p_text,1,4)::integer % 400 = 0
          or (substr(p_text,1,4)::integer % 4 = 0 and substr(p_text,1,4)::integer % 100 <> 0) then 1 else 0 end
        when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30 else 31 end
    else false end;
$$;
revoke all on function private.mur_es_data_iso(text) from public, anon, authenticated, service_role;
create or replace function private.mur_text_public(p_text text)
returns text language plpgsql immutable set search_path = pg_catalog, public as $$
declare net text := left(coalesce(p_text,''),100000);
begin
  net := regexp_replace(net,'<(script|style|iframe|object)[^>]*>.*?</\1[[:space:]]*>','','gis');
  net := regexp_replace(net,'<[^>]*>','','g');
  net := regexp_replace(net,'[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}','[contacte omés]','gi');
  net := regexp_replace(net,'[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}','[identificador omés]','gi');
  net := regexp_replace(net,'(https?://|data:|sdp-media:|tel:|mailto:)[^[:space:]<>]+','[recurs omés]','gi');
  -- Tokenize the original phone candidates and intervening characters once.
  -- Do not use the proposed exact-nine-digit regex: it misses long phones.
  select coalesce(string_agg(case
      when parts[1] is null then parts[2]
      when private.mur_es_data_iso(parts[1])
        or parts[1] ~ '^[0-9]{4}-[0-9]{4}$' then parts[1]
      else '[contacte omés]' end,'' order by ordinal),'') into net
    from regexp_matches(net,'([+]?[[:digit:]][[:digit:] ()-]{7,}[[:digit:]])|(.)','gs')
      with ordinality as tokens(parts,ordinal);
  net := regexp_replace(net,'[-+]?[[:digit:]]{1,3}\.[[:digit:]]{4,}','[coordenada omesa]','g');
  return net;
end;
$$;
revoke all on function private.mur_text_public(text) from public, anon, authenticated, service_role;
commit;

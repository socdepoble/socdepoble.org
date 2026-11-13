-- R21.5 · Repair only app_content key='agents', across its existing tenants.
-- Public canonical payload matches src/data/catalegAgents.js AGENTS_CANONICS.
-- 2026-09-08 is the technical catalogue date already used by identitatsSeed,
-- not a birth date, incorporation date or claim about a real account's creation.
-- Fiction IDs: ae9a9bdb5^:src/data/agentsSeed.js (pre-P0-72 catalogue).
-- Never classify a real person/entity by name or personaKey. Never dedupe extras.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
lock table public.app_content in share row exclusive mode;
do $repair$
declare
  v_canon jsonb := '[{"id":"socdepoble","created_at":"2026-09-08T00:00:00.000Z","name":"Sóc de Poble","role":"Empresa","avatar_url":"/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png","last_message_content":"Benvinguts al portal oficial de Sóc de Poble.","tag":"ENTITAT","type":"COMPANY","color":"bg-indigo-100 text-indigo-600","calendarCategory":"General","lema":"Fem xarxa al territori.","town_name":"La Torre de les Maçanes","short_bio":"El compte oficial i central de tota la infraestructura de socdepoble"},{"id":"0001","created_at":"2026-09-08T00:00:00.000Z","name":"Javi Llinares","role":"La Torre de les Maçanes","avatar_url":"/assets/fotos/javi-llinares-perfil-1200px.jpg","last_message_content":"Ei! Com va això?","tag":"ADMIN","type":"PERSON","color":"bg-orange-100 text-orange-600","calendarCategory":"Desenvolupament","lema":"Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l''Associació El Rentonar, coordine el Projecte Sóc de Poble.","town_name":"La Torre de les Maçanes","short_bio":""},{"id":"11111111-1a1a-0000-0000-000000000000","created_at":"2026-09-08T00:00:00.000Z","name":"IAIA MarIA","role":"Matriarca Digital","avatar_url":"/assets/uploads/brain/iaia_maria_avatar_mobil.webp","last_message_content":"Dignitat, terra i xarxa.","tag":"MASTER","type":"AI","color":"bg-orange-100 text-orange-600","calendarCategory":"General / Personal","lema":"Pensant en global, treballant en local.","town_name":"La Torre de les Maçanes","short_bio":"La intel·ligència artificial que posa ordre al Mas de Sóc de Poble: guarda la memòria de casa i recorda que les coses es fan amb trellat."}]'::jsonb;
  v_legacy text[] := array['11111111-1a1a-0001-0000-000000000001','11111111-1a1a-0001-0000-000000000002','11111111-1a1a-0001-0000-000000000003','11111111-1111-4111-a111-000000000009','11111111-1111-4111-a111-000000000003','11111111-1111-4111-a111-000000000004','11111111-1111-4111-a111-000000000005','11111111-1111-4111-a111-000000000008','11111111-1111-4111-a111-000000000007','11111111-0000-0000-0000-000000000004','11111111-1111-4111-a111-000000000010','11111111-1111-4111-a111-000000000011'];
  -- ECMAScript String.trim whitespace, for parity with the client predicate.
  v_espais text := chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279);
  v_invalides bigint;
  v_row record;
  v_reals jsonb;
  v_payload jsonb;
begin
  -- Abort the complete transaction before changing any tenant. Values and
  -- identities never enter the diagnostic. Guards are generous catalogue
  -- limits, not truncation: 4096 objects and 2 MiB serialized JSONB per row.
  select count(*) into v_invalides from public.app_content c where c.key='agents' and case
    when jsonb_typeof(c.payload) is distinct from 'array' then true
    when octet_length(c.payload::text)>2097152 then true
    when jsonb_array_length(c.payload)>4096 then true
    else exists(select 1 from jsonb_array_elements(c.payload) e where
      jsonb_typeof(e) is distinct from 'object'
      or (e ? 'id' and jsonb_typeof(e->'id') not in('string','null'))
      or (e ? 'name' and jsonb_typeof(e->'name') not in('string','null'))
      or (e ? 'type' and jsonb_typeof(e->'type') not in('string','null')))
    end;
  if v_invalides>0 then
    raise exception 'SDP-AGENTS-001: % fila/es agents amb forma o mida no admesa; cap canvi aplicat.',v_invalides using errcode='22023';
  end if;
  for v_row in select tenant_id,payload from public.app_content where key='agents' order by tenant_id loop
    select coalesce(jsonb_agg(e.value order by e.ordinality),'[]'::jsonb) into v_reals
      from jsonb_array_elements(v_row.payload) with ordinality e(value,ordinality)
      cross join lateral (select case
        when btrim(e.value->>'id',v_espais) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then lower(btrim(e.value->>'id',v_espais)) else e.value->>'id' end as id) normalitzat
      where not exists(select 1 from jsonb_array_elements(v_canon) canonical where canonical->>'id'=normalitzat.id)
        and not coalesce(normalitzat.id=any(v_legacy),false)
        and not coalesce(upper(btrim(e.value->>'type',v_espais)) in('AI','ANIMAL'),false);
    v_payload:=v_canon||v_reals;
    update public.app_content c set payload=v_payload,
      version=case when c.version<2147483647 then c.version+1 else c.version end,updated_at=now()
      where c.tenant_id=v_row.tenant_id and c.key='agents' and c.payload is distinct from v_payload;
  end loop;
end $repair$;
commit;

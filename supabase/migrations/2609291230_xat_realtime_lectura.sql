-- ARQ-D02: rebre avisos de fils propis. Els clients no poden emetre avisos.
-- La taula i el seu RLS pertanyen al servei Realtime, no a esta migració.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$
begin
  if not coalesce((select relrowsecurity from pg_class
    where oid = to_regclass('realtime.messages')), false) then
    raise exception 'Realtime requereix realtime.messages amb RLS actiu';
  end if;
end;
$$;

drop policy if exists xat_avisos_lectura on realtime.messages;
create policy xat_avisos_lectura on realtime.messages
for select to authenticated
using (
  extension = 'broadcast'
  and case
    when (select realtime.topic()) ~ '^xat:f:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then private.es_participant(substring((select realtime.topic()) from 7)::uuid)
    else false
  end
);

commit;

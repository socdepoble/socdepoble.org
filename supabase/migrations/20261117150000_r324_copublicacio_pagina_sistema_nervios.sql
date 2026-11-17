-- R32.4 · La pàgina pública /page/sistema-nervios (lot_01 de Gemini) entra al paquet de copublicació.
-- Depén de 2611111735 (private.recursos_copublicacio_paquet): «una ampliació del paquet afig els IDs
-- a este registre amb la seua pròpia migració». Idempotent; no esborra ni modifica cap fila.
-- NO aplicada a cap base: l'aplica el Mestre, mai un agent.
-- Verificació posterior (lectura):
--   select count(*) as sistema_nervios from private.recursos_copublicacio_paquet where tipus = 'pagina' and recurs_id = 'sistema-nervios';
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

insert into private.recursos_copublicacio_paquet (tipus, recurs_id, origen_clau)
select tipus, unnest(ids), origen_clau
from (values
  ('pagina', array['sistema-nervios'], null)
) as paquet(tipus, ids, origen_clau)
on conflict (tipus, recurs_id) do nothing;

commit;

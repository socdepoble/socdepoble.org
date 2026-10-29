---
type: protocol
status: actiu
description: Permisos SQL explícits segons el contracte d'accés de cada taula i RPC
---
# Regla de Migracions Supabase (Permisos Explícits)

Cada migració declara els permisos segons el contracte d'accés. Crear una taula a `public` no implica exposar-la a `anon` o a `authenticated`. Els `GRANT` i les polítiques RLS són controls diferents: cal revisar tots dos.

## Taules exposades a la Data API

Activa RLS, defineix les polítiques de les operacions admeses i atorga a cada rol només els permisos que necessita el client. `anon` només rep lectura quan el contracte preveu accés públic; `authenticated` no rep tot CRUD per defecte. Els permisos de `service_role` també es declaren segons l'operació prevista, sense copiar un bloc de permisos generals.

## Taules amb accés de client exclusiu per RPC

Activa RLS i revoca l'accés directe a la taula per a `PUBLIC`, `anon`, `authenticated` i `service_role`. No afegisques polítiques o `GRANT` directes de client per resoldre un error de permisos: el client hi entra per les RPC autoritzades.

Després de la revocació, declara només les excepcions de manteniment que exigisca el contracte de cada taula. Per exemple, `xat_adjunts` i les set taules públiques d'E2EE-1a concedixen a `service_role` únicament `SELECT, DELETE`; això no autoritza `INSERT` o `UPDATE` ni obliga a donar esta excepció a altres taules, com les auxiliars privades sense accés directe.

Les RPC que necessiten `SECURITY DEFINER` porten `SET search_path = ''`, noms qualificats i les comprovacions d'identitat, abast i transició del seu contracte. Revoca l'`EXECUTE` de `PUBLIC` i dels rols no admesos per a cada signatura i concedix-lo només als rols previstos. Els helpers privats no reben accés directe de client llevat d'un contracte explícit.

## Revisió de la migració

Comprova conjuntament ACL de taules, RLS/polítiques i permisos de funcions; una prova verda d'un dels tres no acredita els altres. Revisa també les migracions `ALTER TABLE` i `CREATE OR REPLACE FUNCTION` si afecten estos contractes. Les proves estàtiques no acrediten per si soles el comportament transaccional o concurrent d'una base desplegada.

Referències locals del patró RPC: `supabase/migrations/2610220240_xat_adjunts_i_quota.sql` (`xat_adjunts`) i `supabase/migrations/2610290400_xat_e2ee_claus_i_sobres.sql` (claus, còpia, llibreta i dades de recuperació E2EE-1a).

## Vincles

- [[00_BIOS_COGNITIU]]

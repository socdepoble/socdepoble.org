---
type: document
status: esborrany
description: Pla per desacoblar el cercador del xat, indexar entitats públiques i recuperar el padró sense 403
tags:
  - implementacio
visibility: private
reflex: sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:d27ec476-33ff-45fd-8040-2e55010c3344
---
# Pla d'Implementació — Cercador Universal Desacoblat i Resilient

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:d27ec476-33ff-45fd-8040-2e55010c3344 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T18:27:56.186Z |
| Modificació | 2026-10-22T18:32:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (MarIA) |
| Tokens consumits | ~ |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-22T18:27:56.186Z: Creació del pla d'arquitectura arran de la invisibilitat d'empreses públiques («La Figuera», `/empresa/lafiguera`) a `/cerca` i l'error 403 Forbidden («Mode Foraster») al padró de persones (Carmen i Damián).
2026-10-23T01:05:00.000Z: **Incident de regressió de tenant a producció**. En compilar amb `VITE_TENANT_ID=edd2f840...`, la web va mostrar «Cap poble trobat» i contingut buit a Mur i Mercat perquè `app_content` resideix exclusivament a `11111111-2222-3333-4444-555555555555`. S'ha revertit a `1111...` i s'ha redesplegat a Firebase per restablir el servei. S'ajorna la unificació per a demà de matí amb l'auditoria multi-agent de Claude.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)
1. **Absència de font d'entitats públiques**: A `src/sections/search/useCercaGlobal.js` només s'indexen les organitzacions pròpies de la persona connectada (`useIdentitat` -> `listMyOrganizations`). Cap usuari (ni anònim ni veí) pot trobar empreses o associacions públiques com «La Figuera» perquè **no existeix cap consulta a `organization_directory`**.
2. **Col·lapse del Padró per mismatch de Tenant (403 Forbidden)**: El cercador delegava la cerca de persones en `xat.cercaMembres()`. Aquest mètode crida `public.membres_del_poble(p_tenant_id)`. El frontend enviava el `VITE_TENANT_ID` de prova (`11111111-2222-3333-4444-555555555555`). Com els usuaris reals estan a La Torre de les Maçanes (`edd2f840-f4af-414a-821c-ebb8b8b2a80a`), la guarda `private.is_town_member()` llançava excepció `42501` (403 Forbidden). La banner de «Mode Foraster» bloquejava el padró i deixava a 0 Carmen i Damián.
3. **Estat de Supabase SQL**: A la vista `organization_directory` falta afegir `town_name` (migració `2610081401` pendent d'aplicar a la base de dades remota).

### 2. Accions Concretes de Codi (Implementades per Claude)

#### A. Adaptador i Port per a Entitats Públiques
- `src/data/contracte.js` & `src/data/backendPort.js`: Afegit mètode neutral `listPublicOrganizations(filtre, config)` i capacitat `directoriEntitats`.
- `src/data/supabase/organizations.js`: Implementat `listPublicOrganizations` consultant `/rest/v1/organization_directory` amb columnes explícites.
- `src/data/localPerfils.js`: Implementat `listPublicOrganizations` per als modes `seed` i `local`.

#### B. Adaptador de Cerca Global
- `src/sections/search/indexCerca.js`: Adaptador `deOrganitzacio` amb normalització valenciana avançada, ressaltat i rànquing intel·ligent per rellevància.
- `src/sections/search/useCercaGlobal.js`: Font `directori` desacoblada del xat; padró tancat silenciós (sense alertes vermelles de 403 per a forasters).

### 3. Pendent per a Demà de Matí: Resolució Segura del Tenant Partit (Decisió D1)
*Avís de seguretat*: No tocar la base de dades a cegues ni canviar `VITE_TENANT_ID` aïlladament sense Claude i agents d'auditoria.
- **Opcions sobre la taula (per auditar amb Claude)**:
  * **Opció D1-A (Conservadora)**: Mantenir `VITE_TENANT_ID=11111111-2222-3333-4444-555555555555`. Donar d'alta les persones a `town_memberships` per al tenant `1111...` i canviar el nom de la fila a `towns` de «Poble de Llavors» a «La Torre de les Maçanes».
  * **Opció D1-B (Migració completa)**: Moure les 11 taules amb `tenant_id` de `1111...` a `edd2f840...` mitjançant un script SQL transaccional i auditat per Claude amb agents adversarials, comprovant claus foranes i triggers.
- **Protocol d'arrencada matinal**:
  1. Claude generarà els agents d'auditoria per validar l'estat exacte de Supabase.
  2. Execució de les consultes de només lectura (§4 de l'informe Claude `261022_2220_auditoria_claude.md`).
  3. Decisió del Mestre i execució controlada amb comprovació passiva prèvia.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npm test src/sections/search/`: Validar totes les proves unitàries d'indexació i cerca (Comprovat: 60/60 tests verds).
2. `npm test src/data/`: Validar contracte i conformitat del port (Comprovat: verd).
3. Verificació a Producció:
   - `socdepoble.org` restablert amb `VITE_TENANT_ID=1111...` (Pobles, Mur i Mercat visibles).
4. `node tooling/gates/porta-olivera.mjs` -> Escriptori net en 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Mismatch de Tenant**: Canviar el tenant del frontend sense migrar `app_content` buida completament l'aplicació. Mitigació: Prohibit tocar `VITE_TENANT_ID` sense haver migrat o harmonitzat prèviament les dades a Supabase amb verificació prèvia.
- **Inconsistència de Claus Foranes a Supabase**: Moure files entre tenants sense actualitzar les 11 taules trenca `town_memberships` i el xat. Mitigació: L'auditoria matinal de Claude revisarà la integritat referencial abans de cap canvi.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1955_prompt_claude_gemini_cercador_universal]]
- [[261022_2220_auditoria_claude]]


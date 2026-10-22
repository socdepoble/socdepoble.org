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

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)
1. **Absència de font d'entitats públiques**: A `src/sections/search/useCercaGlobal.js` només s'indexen les organitzacions pròpies de la persona connectada (`useIdentitat` -> `listMyOrganizations`). Cap usuari (ni anònim ni veí) pot trobar empreses o associacions públiques com «La Figuera» perquè **no existeix cap consulta a `organization_directory`**.
2. **Col·lapse del Padró per mismatch de Tenant (403 Forbidden)**: El cercador delegava la cerca de persones en `xat.cercaMembres()`. Aquest mètode crida `public.membres_del_poble(p_tenant_id)`. El frontend enviava el `VITE_TENANT_ID` de prova (`11111111-2222-3333-4444-555555555555`). Com els usuaris reals estan a La Torre de les Maçanes (`edd2f840-f4af-414a-821c-ebb8b8b2a80a`), la guarda `private.is_town_member()` llançava excepció `42501` (403 Forbidden). La banner de «Mode Foraster» bloquejava el padró i deixava a 0 Carmen i Damián.
3. **Estat de Supabase SQL**: A la vista `organization_directory` falta afegir `town_name` (migració `2610081401` pendent d'aplicar a la base de dades remota).

### 2. Accions Concretes de Codi

#### A. Adaptador i Port per a Entitats Públiques
- `src/data/contracte.js` & `src/data/backendPort.js`: Afegir mètode neutral `listPublicOrganizations(filtre, config)`.
- `src/data/supabase/organizations.js`: Implementar `listPublicOrganizations` consultant `/rest/v1/organization_directory?select=*`.
- `src/data/localPerfils.js`: Implementar `listPublicOrganizations` per als modes `seed` i `local`.

#### B. Adaptador de Cerca Global
- `src/sections/search/indexCerca.js`:
  * Crear l'adaptador `deOrganitzacio(org, opcions)` que converteix cada fila de `organization_directory` en una entrada tipus `'entitats'` amb títol, meta (poble), extracte (`description` o `lema`), logo i ruta canònica `/empresa/<slug>`.
  * Optimitzar `cercaEntrades` amb normalització valenciana avançada (accents, dièresis, ç, l·l) i rànquing intel·ligent per rellevància.
- `src/sections/search/useCercaGlobal.js`:
  * Afegir la font autònoma `entitatsPubliques` via `listPublicOrganizations`.
  * Desacoblar la fallada de xat: si `cercaMembres` respon 403, no bloquejar ni llançar error alarmista; tractar el padró privat com a buit per a forasters i mantenir la cerca de perfils públics operativa.
  * Harmonitzar `clauCanonica` perquè si una entitat és administrada per l'usuari i alhora està al directori públic, es fusione transparentment sense duplicar fitxes.

#### C. Configuració d'Entorn
- Actualitzar `VITE_TENANT_ID` a `.env.local` i `.env.production.local` amb l'UUID real de La Torre de les Maçanes (`edd2f840-f4af-414a-821c-ebb8b8b2a80a`).

#### D. SQL de Supabase (per al Mestre)
- Proporcionar el script SQL net per actualitzar `organization_directory` amb `town_name` i garantir lectura pública a `anon` i `authenticated`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npm test src/sections/search/`: Validar totes les proves unitàries d'indexació i cerca.
2. `npm test src/data/`: Validar contracte i conformitat del port.
3. Prova d'integració al navegador:
   - `/cerca?q=figuera` -> Troba «La Figuera» amb insígnia d'Entitat/Empresa, logo i enllaç a `/empresa/lafiguera`.
   - `/cerca?q=carmen` i `/cerca?q=damian` -> Troba les seues fitxes de persona.
   - Foraster / Anònim -> Cap error 403 en roig.
4. `node tooling/gates/porta-olivera.mjs` -> Escriptori net en 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Duplicitat d'entitats**: Risc que una empresa isca dues vegades si l'usuari n'és propietari. Mitigació: `clauCanonica` i `ambLaIdentitatPropia` dedupliquen per slug/id abans del rànquing.
- **Rendiment en xarxa**: La càrrega d'entitats públiques es memoritza en caché per àmbit de poble, evitant peticions repetides a cada pulsació de tecla.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1955_prompt_claude_gemini_cercador_universal]]


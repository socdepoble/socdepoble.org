---
type: acta
status: esborrany
description: 'Acta Marmota de tancament de sessió: diagnosi forense de /cerca, actualització de la vista organization_directory a Supabase, alineació de tenant i convocatòria per a Claude i Gemini'
tags:
  - acta
visibility: private
reflex: sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:98be9136-4e6e-4777-93fe-aa94a92434bc
---
# Acta Marmota: Cercador Universal, Desbloqueig SQL de Supabase i Relleu Tècnic

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:98be9136-4e6e-4777-93fe-aa94a92434bc |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T20:08:23.662Z |
| Modificació | 2026-10-22T20:12:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | ~ |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-22T17:40Z:** El Mestre crea l'empresa «La Figuera» (`/empresa/lafiguera`) i detecta que a `/cerca` torna 0 resultats i que cercar persones dona error 403 Forbidden («Mode Foraster»).
- **2026-10-22T17:50Z:** Diagnosi forense d'IAIA MarIA: descobriment que `/cerca` no tenia cap adaptador a `organization_directory` ni a entitats públiques, i que el padró de persones fallava per mismatch del `VITE_TENANT_ID` (poble de proves `11111111-...` vs La Torre de les Maçanes `edd2f840-...`).
- **2026-10-22T18:00Z:** Comprovació de Supabase: detecció que `organization_directory` no tenia la columna `town_name` (error 42703).
- **2026-10-22T18:15Z:** Confecció del script SQL per a la vista `organization_directory` i lliurament al Mestre.
- **2026-10-22T18:25Z:** El Mestre executa el SQL a Supabase amb èxit complet. Verificació per consulta REST confirmant «La Figuera» amb `town_name: 'La Torre de les Maçanes'`.
- **2026-10-22T18:30Z:** Actualització de `VITE_TENANT_ID` a `.env.local` i `.env.production.local` a l'UUID real de La Torre.
- **2026-10-22T18:35Z:** Creació del Pla d'Implementació (`261022_1955_pla_implementacio_cercador_universal.md`) i del Prompt oficial per a Claude Opus 5.5 i Gemini 4 (`261022_1955_prompt_claude_gemini_cercador_universal.md`).
- **2026-10-22T20:10Z:** Lliurament del prompt a Claude Desktop; assessorament sobre sessió neta i tancament d'Acta Marmota per descans i canvi de nanochat.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Diagnòstic Forense Complet
1. **Entitats Públiques Inexistents al Cercador:** `useCercaGlobal.js` només consultava les organitzacions pròpies de la sessió de l'usuari (`listMyOrganizations`). No existia cap adaptador ni consulta a la vista pública `organization_directory`. Tota entitat pública creada al poble era invisible.
2. **Padró Bloquejat amb 403 Forbidden:** La cerca de persones depenia exclusivament de la funció interna del xat `membres_del_poble(p_tenant_id)`. En estar configurat el tenant de proves `11111111-...` al frontend mentre que a la base de dades els usuaris pertanyen a La Torre de les Maçanes (`edd2f840-...`), la guarda de xat (`if not private.is_town_member`) llançava excepció 42501 (403 Forbidden) i mostrava l'alerta de «Mode Foraster», buidant a zero el cens de persones (invisibilitzant Carmen i Damián).

### 2. Desbloqueig SQL i Infraestructura
- **Supabase:** Actualitzada la vista `public.organization_directory` amb suport per a `town_name` i permisos concedits a `anon` i `authenticated`. Verificat en remot via REST API.
- **Variables d'Entorn:** Actualitzat `VITE_TENANT_ID=edd2f840-f4af-414a-821c-ebb8b8b2a80a` tant a `.env.local` com a `.env.production.local`.

### 3. Governança i Documents Oficials de Convocatòria
- **Pla d'Implementació:** `_wiki_de_poble/04_escriptori/261022_1955_pla_implementacio_cercador_universal.md` (aprovat).
- **Prompt Oficial:** `_wiki_de_poble/04_escriptori/261022_1955_prompt_claude_gemini_cercador_universal.md` (lliurat a Claude Opus 5.5).
- **Porta Olivera:** 0 errors; tots els documents vius degudament ancorats.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Relleu a Claude Opus / Gemini 4:**
   - Iniciar nova sessió a Claude Desktop per implementar les tasques T1, T2 i T3 del cercador (adaptador `listPublicOrganizations`, adaptador `deOrganitzacio` a `indexCerca.js`, normalització valenciana avançada i rànquing intel·ligent).
2. **Desplegament a Firebase Hosting (`socdepoble.org`):**
   - Una vegada implementat el cercador o quan es decidisca compilar la versió WebP: `npm run build:web` i deploy.
3. **Sanejament Opcional a Supabase:**
   - Unificar `tenant_id` i `town_name` a la taula `organizations` per a El Rentonar i Sóc de Poble.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261022_1955_pla_implementacio_cercador_universal|261022_1955_pla_implementacio_cercador_universal]]
- [[../90_arxiu_historic/261022_1955_prompt_claude_gemini_cercador_universal|261022_1955_prompt_claude_gemini_cercador_universal]]


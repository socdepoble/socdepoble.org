---
type: document
status: esborrany
description: Segona fase ortogonal d'R17 per amortitzar deute tècnic (P0-20 purga UGC, P1-75 revisions longitudinals, P0-24b capa enrere i vocabulari) amb pre-mastegat del Node 0.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:dcb82779-28cc-43df-a491-9ecd25060302
---
# Pla d'Implementació — Onada R17.2B: Amortització de Deute Tècnic amb Node 0 i Codex

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:dcb82779-28cc-43df-a491-9ecd25060302 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T23:46:23.938Z |
| Modificació | 2026-11-10T23:48:00.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | ~14.000 tokens (Node 0 executant 8 escoles a 0,00 EUR) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-10T23:46:23.938Z:** Esborrany creat després del segellat del `Kit R17.2` per `Codex (GPT-6.1 Sol Ultra)`.
- **2026-11-10T23:48:00.000Z:** Pla aprovat per a l'amortització paral·lela de deute tècnic (`Kit R17.2B` a `/tmp/sdp_codex_r17_2b` + pre-mastegat de 8 blocs al Node 0 en `DOSSIER_NODE0_PREMASTEGAT_DEUTE_TECNIC_R17_PER_FRONTERA.md`) i reorientació realista post-NLnet (`P0-99`: zero despesa en burocràcia NixOS inútil, prioritat 100% a usabilitat veïnal, pobles reals i vies de finançament rural/municipal).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes

1. `Codex (GPT-6.1 Sol Ultra)` ja ha tancat i segellat el `Kit R17.2` (`261111_0012_auditoria_codex.md`, `719` Vitest + `35` Postgres WASM en verd, entrada `242.381 B gzip`) i es troba lliure mentre `Claude` culmina `Kit R17.1A/B` i `Gemini 4 Carbon` culmina `Kit R17.3`.
2. Les 8 escoles d'Ollama al **Node 0 (`192.168.0.23:11434`)** estan generant `../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_DEUTE_TECNIC_R17_PER_FRONTERA.md` (`P0-96`) per avançar solucions de codi real a cost `0,00 €`.
3. Amb el tancament definitiu de la via NLnet (`2026-08-1a6`, correu de Gerben del `09/11/2026`), descartem qualsevol feina artificial per a comitès de protocols teòrics (com empaquetats pesants NixOS sense ús real al poble) i concentrem el 100% del deute tècnic en **seguretat real d'usuari, dades patrimonials vives, accessibilitat, compatibilitat de dispositius rurals i coherència editorial honesta (`P0-98`, `P0-99`)**.

### 2. Repartiment d'Exclusivitat sense Col·lisió (`Kit R17.2B` a `/tmp/sdp_codex_r17_2b`)

- **T1 (`P0-20` · Purga real de fitxers UGC a Storage en eliminar compte):** Migració SQL idempotent `supabase/migrations/2611110100_cua_purga_storage_ugc.sql` + actualització del contracte de baixa a `src/data/` (sense tocar `App.jsx`, `useLocalSandbox.js` ni `AndroidManifest.xml` que són de Claude) + test PGlite/WASM verificant que en donar-se de baixa s'encuen els objectes de `storage.objects` de l'usuari per a purga efectiva.
- **T2 (`P1-75` · Taula i port de revisions longitudinals de patrimoni viu `public.revisions_patrimoni`):** Migració SQL amb RLS estricta + adaptador a `src/data/` per guardar revisions anuals de camp (llavors, arbres monumentals CIEF v232 i receptes) sense acoblar el frontend.
- **T3 (`P0-98` + `P0-99` · Coherència real a `/dispositius` i `/page/fediversity`):** Nota clara de compatibilitat per a telèfons rurals molt antics (`Android <= 4.4` / `iOS <= 9`) arran de la retirada dels xifrats `TLS 1.2 CBC` a Supabase HTTP APIs, i actualització honesta de l'estat de `/page/fediversity` reflectint la resolució de NLnet (`2026-08-1a6`) i que l'arquitectura oberta i federada de Sóc de Poble continua endavant per convicció pròpia al servei dels pobles, sense dependre d'aquell fons.
- **T4 (Higiene de vocabulari en el carril):** Verificar `0` ocurrències noves del vocabulari vetat per `tooling/gates/tractor-vocabulari.mjs` en tots els fitxers tocats pel Kit.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Execució aïllada dins `/tmp/sdp_codex_r17_2b` de `npm run lint`, Vitest focal, proves Postgres WASM de les noves migracions i `npm run build` (`<= 249.912 B gzip`).
2. Dipòsit del Kit segellat amb `SHA-256` a `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/` i auditoria canònica a `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Col·lisió amb Carril 1 (Claude) o Carril 3 (Carbon):** Mitigat al 100% treballant en clon net `/tmp/sdp_codex_r17_2b` i prohibint tocar els 28 fitxers d'Android/Auth/Notes de Claude i els fitxers de Workspaces/Arbres/ReceptaDetail de Carbon.
- **Frontissa de contingut editorial (`pageContent`):** Si es toca `/page/fediversity` o `/dispositius`, deixar indicat al manifest del Kit la comanda exacta `frontissa-contingut.mjs --aprova` perquè l'integrador la valide.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

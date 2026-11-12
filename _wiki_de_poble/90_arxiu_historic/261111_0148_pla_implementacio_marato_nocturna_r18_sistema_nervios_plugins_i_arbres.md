---
type: document
status: esborrany
description: 'Pla canònic d''Onada R18 nocturna (~5h, parada neta 06:45 CET): integració R17, alliberament d''apps en beta desendollables, ressituació d''importació WP d''arbres i fitxes doctorals.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:152f049b-7d2a-42ac-8707-2f317f35001c
---
# Pla d'Implementació — Marató Nocturna R18: Sistema Nerviós Sinàptic, Plugins sobre Nucli Verge i Workspace d'Arbres

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:152f049b-7d2a-42ac-8707-2f317f35001c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:50:38.242Z |
| Modificació | 2026-11-11T00:51:30.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada en conversa 261111 01:38-01:46 CET (Mode Automàtic Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | 24800 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-11T00:50:38.242Z:** Creació del Pla Canònic de la Marató Nocturna `R18` (~5 hores, parada neta garantida a les `06:45 CET`, zero dimonis zombies) sobre `HEAD c07f78b83` (`COMMIT R17a` desplegat en viu a `socdepoble.org` i `socdepoble.cat`) després d'arxivar els 12 documents consumits d'onades anteriors (`porta-olivera.mjs = 0 solts`).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context, Estat de Partida i Sistema Nerviós Sinàptic (`P0-100..P0-103`)

1. **Base viva:** `c07f78b83` (`COMMIT R17a` en viu a `socdepoble.org` i `socdepoble.cat` amb bundle `index-9Sg2E7be.js`).
2. **3 Kits d'Onada R17 ja segellats a disc pendents d'assimilació immediata en `COMMIT R18a`:**
   - `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/` (`Kit R17.2`: `/page/avisador` connectat al Xat, autoria `256` caràcters + `2611110010_autoria_256_caracters.sql`, 149 receptes × 14 al·lèrgens UE).
   - `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/` (`Kit R17.2B`: purga Storage UGC `2611110100`, motor `revisionsPatrimoni` `2611110110`, avís TLS 1.2 CBC a `/dispositius`, transparència post-NLnet a `/page/fediversity`).
   - `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/` (`Kit R17.3`: `102` camins, `64` imatges `.webp` d'arbres 2020, `avisador_vinyeta.webp` a sang, `ReceptaDetailSection.jsx`, `actaRentonar.js`, `NaturaPatrimoniWorkspaceSection.jsx`, `BancLlavorsWorkspaceSection.jsx`).
3. **Sistema Nerviós Sinàptic Nocturn (`../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/ESTAT_SINAPTIC.json`):**
   - **Prohibit cremar tokens amb crons cecs «a lo bèstia»:** El diàleg entre `Claude`, `Codex`, `Gemini Carbon` i les `8 Escoles del Node 0` es governa per canvis d'empremta `SHA-256` registrats a `ESTAT_SINAPTIC.json`.
   - **Bucle Gauntlet Creuat (`MAX_ROUNDS = 3`) i Parada Neta (`DEADLINE = 2026-11-11T06:45:00+01:00`):** Totes les IAs s'auditen adversarialment els Kits les unes a les altres fins assolir `0 P0`, `0 P1` i `ACORD_EXCEL_LENCIA = true`. En complir-se l'acord o les `06:45 CET`, totes s'aturen netament (`0` dimonis zombies, `0` processos infinits).

### 2. Repartiment Ortogonal de Carrils en l'Onada Nocturna `R18`

#### Carril 1 · `Claude Opus 5.5 / Fable 5.2 · Ultracode` (Arbre Viu `socdepoble.org/`)
- **[MODIFY / INTEGRATE] `COMMIT R18a` (`Kit R17.2 + Kit R17.2B + Kit R17.3`):** Assimilar els 3 kits verificats sobre `c07f78b83` preservant intacte `src/utils/useLocalSandbox.js` (`isHydrated` + `sanejaDrets`), regenerant `compile-wiki-to-app.mjs` i validant Vitest + portes per al primer desplegament nocturn de MarIA.
- **[MODIFY / NEW] `src/config/registrePlugins.js` + `src/sections/control/ControlSection.jsx` + `src/apps/plataforma/PortalApps.jsx` (`P0-101`):**
  - Atomització declarativa de plugins sobre el **Nucli Verge (`<= 250.000 B gzip`)**: tots els plugins venen **endollats per defecte** (`enabledByDefault: true`), però cadascun és `100%` desendollable (`React.lazy` + flag declaratiu sense acoblament dur al nucli).
  - Alliberar i mostrar ja al Panell de Control (`/control` i `/app`) totes les eines construïdes (`Avisador d'Incidències i Emergències /page/avisador`, `TPV Cooperatiu /tpv`, `El Rebost /rebost`, `Arbres Emblemàtics i Monumentals /page/arbres-monumentals`, `Receptari Què Dinem? /page/receptes`, `Banc de Llavors i Calendari Agrícola /page/banc-de-llavors`, `Pou de la Neu 3D`, `Bloc de Notes /notes`, `Arbre Genealògic`, `El Rentonar /rentonar`), amb insígnia honesta i nítida **«En proves · Beta oberta»** quan pertoca (`tractor-promesa = 0` infraccions).
- **[INTEGRATE & GAUNTLET] `COMMIT R18b`:** Auditar adversarialment i integrar els Kits `R18.2` (Codex) i `R18.3` (Gemini Carbon) fins tancar `ACORD_EXCEL_LENCIA = true`.

#### Carril 2 · `Codex GPT-6.1 Sol Ultra` (Clon Aïllat `/tmp/sdp_codex_r18` → Kit CAS `261111_kit_codex_r18_workspace_importacio_arbres_i_dades/`)
- **[MODIFY / NEW] `src/sections/patrimoni/NaturaPatrimoniWorkspaceSection.jsx` + `src/sections/profile/admin/BancImportacioEditorial.jsx` + `src/utils/transformadorEditorialWpBlogger.js` (`P0-100` Alineació 100% amb el Mestre):**
  - Unificar l'experiència de 4 columnes (`CONTROL` · `Llibreria de Llibres/Pobles` · `Exemplars Catalogats` · `Portada o Fitxa UniversalPage`) entre `/page/arbres-monumentals` i `/page/receptes` (*Què dinem?* de Pep Cascant).
  - **Zero duplicació d'importació:** Ressituar dins del llibre *«Arbres Emblemàtics i Monumentals de La Torre de les Maçanes»* (com a primera entrada / portada del llibre) **la pròpia pàgina ja importada del WordPress `socdepoble.net`** (`paginesTrilogiaIMoliWp.corpus.json` / `lligArticlesImportatsAmbRevisio()`), connectant `BancImportacioEditorial.jsx` amb un selector de destinació (`Mur`, `Workspace d'Arbres`, `Herbari`, `Pàgina`) perquè el Mestre puga governar i aprendre amb MarIA l'exportació/importació des d'Administració del Sistema.
- **[MODIFY / NEW] `src/data/patrimoni/esquemaDoctoralArbres.js` + `src/sections/patrimoni/FitxaArbreMonumental.jsx` (`P0-100` + `P0-101`):**
  - Elevar les fitxes dels 19 arbres i dissenys del catàleg a **estàndard de Tesi Doctoral universitària importable i exportable** (`Darwin Core TDWG / GBIF` + `CIEF v232 GVA` + `Norma Granada` + `Mattheck VTA` + `Rivas-Martínez`), amb exportació/importació verificada (`JSON-LD sdp.dendrologia.doctoral.v1`, `Darwin Core CSV`, `GeoJSON`, `BibTeX`) i connexió viva amb `revisionsPatrimoni` (`Kit R17.2B`), separant al `10/10` el paquet de dades (`Data Package`) de l'estructura React.
- **[GAUNTLET CREUAT]:** Auditar a fons `Kit R17.3` de Gemini Carbon i la integració `R18a` de Claude, publicant dictamen al Tauler Sinàptic.

#### Carril 3 · `Gemini 4 Carbon (High)` (Clon Aïllat `/private/tmp/sdp_r18_carbon` → Kit CAS `261111_kit_carbon_r18_presentacio_multipoble_panell_i_versions/`)
- **[MODIFY] Portada General Multipoble de `/page/arbres-monumentals` + Unificació Visual amb `/page/receptes` (`P0-100`):**
  - Redactar en les 5 llengües (`ca`, `es`, `en`, `gl`, `eu`) la **Pàgina de Presentació General Multipoble** d'`Arbres Emblemàtics i Monumentals` (retirant la llista plana dels 19 arbres de l'arrel general i explicant com qualsevol poble, ajuntament, escola o associació pot afegir el seu llibre d'arbres a la Llibreria).
  - Polir en Gauntlet Loop multi-contenidor (`@container` a `280px / 380px / 520px / 960px`) la paritat geomètrica entre el Workspace de Receptes (`Què dinem?`), el d'Arbres i les rajoles amb insígnia «En proves · Beta oberta» del Panell de Control.
- **[MODIFY] `/versions`, `/page/sistema-de-disseny` i Llei de Marca d'App Store Connect (`P0-97` + `core-versions-i-notes-llancament`):**
  - Deixar documentada la versió nocturna `Onada R18` en les 5 llengües i assegurar la llei de marca (`Sóc de Poble` intraductible; `Portal de Pobles Connectats` en `ca` i `es`, traduint només el lema en `en`, `gl`, `eu`).
- **[GAUNTLET CREUAT]:** Auditar adversarialment `Kit R17.2`, `Kit R17.2B` i `Kit R18.2` de Codex al Tauler Sinàptic.

#### Carril 4 · `8 Escoles del Node 0` (`192.168.0.23:11434`, `0,00 €`) + `IAIA MarIA`
- **Vigilant Autònom d'Higiene d'Escriptori i Carpetes (`P0-103`)** + **Rondes Gauntlet de Pre-Mastegat i Auditoria Creuada** fins a les `06:30 CET` amb parada neta garantida.

### Bústia de Dubtes i Decisions Resoltes per la Directora (IAIA MarIA)
- **D1 (Resolt):** No es duplica l'article de `socdepoble.net` d'arbres de La Torre fora del circuit d'importació: s'usa la mateixa peça ja importada al corpus de WordPress com a portada del llibre de La Torre dins el `UniversalWorkspace` de `/page/arbres-monumentals`.
- **D2 (Resolt):** `hooks-local.mjs` no es toca; la IAIA MarIA executa `lint`, `build`, `build:wp`, `build:natiu`, `cap sync`, desplegament en viu i `git commit / push` en cada tall validat.
- **D3 (`04:41 CET` · Ordre Suprema Sense Tall Fix):** S'elimina qualsevol parada fixa per hora (`06:45 CET`). Totes les IAs treballen i auditen adversarialment el treball de totes fins que `P0-107`..`P0-118` estiguen 100% acabats i hi haja consens unànime (`ACORD_EXCEL_LENCIA = true`).
- **D4 (`P0-115` + `P0-116` · Autoria de Dos Nivells i Cànon `UniversalWorkspace`):** Portades marc (`/page/arbres-monumentals`, `/page/receptes`, `/page/herbari`, `/page/banc-de-llavors`, `/page/rutes-de-poble`) i la seua card al `/mur` signades per `Sóc de Poble`; cada Llibre desplegable a Columna 1 (`Catàlegs`) i totes les seues fitxes interiors signades pel seu autor real (`El Rentonar` + `Pedro Ferrer Rodríguez` per a les 20 pàgines d'arbres de La Torre; `Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»` per a `Què dinem?`). Tres vistes de Card (`canonica` per defecte, `gran`, `rajola`) documentades a `/disseny`, sangrat `0 px` fins a la vora del frame amb filet interior adaptatiu `inset`, i botó net `+ Afegir catàleg` sense `DestinsCataleg`.
- **D5 (`P0-117` · `/page/receptes` vs `Què dinem?` + `UniversalPage` amb Barra Blava, Slug Compartible i SEO):** Crear presentació marc **`Receptes`** de `Sóc de Poble` (card al `/mur`), passant `Què dinem?` a Llibre desplegable dins `/page/receptes`. Tota pàgina de llibre i tota fitxa individual (`/page/receptes/conserva-de-tomaca`, `/page/arbres-monumentals/<slug>`, etc.) aplica la `UniversalPage` canònica amb barra blava superior fixa d'accions (Compartir/Traduir/Comentaris), URL pròpia amb slug net i SEO dinàmic.
- **D6 (`P0-118` · Laboratori Botànic Fotorealista Doctoral al `Node 0`):** El Mac mini M4 (`192.168.0.23`, Apple M4 24 GB) estudia morfològicament sense errors cada planta de `/page/herbari` i llavor de `/page/banc-de-llavors` sense foto, contrastant fonts científiques i generant localment (100% gratis, sense cridar al Nano) de 3 a 4 variants fotorealistes macro d'estudi doctoral.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npm run lint` (`0` errors, `0` warnings).
2. Portes constitucionals completes: `porta:olivera`, `porta:fitxa`, `porta:pedra-seca`, `porta:inlinestyles`, `porta:vocabulari`, `porta:design-guard`, `porta:tokens`, `porta:promesa` (`P1=0, P3=0`), `porta:frontissa`, `porta:enxufe`, `check:secret-literals`.
3. `npm run build` (`dist/assets/index-*.js <= 250.000 B gzip -9`), `npm run build:natiu && npx cap sync`, i desplegament verificat (`HTTP 200` + mateix hash d'entrada) a `https://socdepoble.org` i `https://socdepoble.cat`.
4. Consens `ACORD_EXCEL_LENCIA = true` signat al Tauler Sinàptic per Claude, Codex, Gemini Carbon i el Node 0, seguit de **Parada Neta (`0` dimonis actius)**.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Col·lisió entre Kits R17 i nous treballs R18:** Mitigat fent que Claude integre primer `R17.2 + R17.2B + R17.3` (`COMMIT R18a`) mentre Codex i Gemini parteixen ja d'un clon amb eixos 3 kits aplicats o sobre les rutes disjuntes assignades.
- **Infracció de `tractor-promesa` en alliberar apps en proves:** Mitigat etiquetant explícitament amb insígnia honesta «En proves · Beta oberta» qualsevol capacitat local/sandbox sense prometre backend inexistent.
- **Processos nocturns infinits:** Mitigat amb `MaxIterations: 6` (`IsDaemon: false`) per al cron de MarIA i `DEADLINE = 06:45 CET` hardcodejat a l'script del Node 0 i als 3 prompts.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

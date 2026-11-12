---
type: informe
status: esborrany
description: Certifica en mode Gauntlet el Kit CAS R17.3 (19 arbres 2020 + CIEF v232, 2 Workspaces Multi-Llibre diferits, Pedra Seca 90°, Acta Rentonar i Dossier FinTech).
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b5e40b1d-7714-484e-8e76-a1b68ac1c863:55d3f698-8f7f-4085-9f9a-41b56b0fd6ce
---
# Auditoria Gauntlet de Gemini 4 Carbon (High) · Onada R17 Carril 3 (Kit R17.3)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b5e40b1d-7714-484e-8e76-a1b68ac1c863:55d3f698-8f7f-4085-9f9a-41b56b0fd6ce |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:38:12.638Z |
| Modificació | 2026-11-11T00:40:00.000Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | Sense comptador de tokens a l'arnés; sessió mesurada de 90 min (2026-11-11 00:07:28 → 01:38 CET), 996 passos (230 torns de raonament, 737 crides a eines, 1 compactació de context), 8.275.785 B a transcript_full.jsonl; baseline t0 Google AI Ultra: 53% setmanal / 98% 5h restant (Overages OFF, 0,00 USD sobrecost marginal; lectura % final pendent a la barra UI del client) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-11-11T00:07:28.000Z` · Obertura de l'execució Gauntlet sobre el clon aïllat `/private/tmp/sdp_r17_carbon` a partir de `HEAD 0027b698d3c25041def6cad2c527d2addc22b8ff` (`COMMIT R16b`, `v1.1.12`), amb l'arbre viu de `socdepoble.org/src/` intacte.
- `2026-11-11T00:36:04.000Z` · Tancament verd de les tasques `T1`–`T6`, portes estàtiques, `21` suites Vitest (`339` proves), `build:web` (`243.334 B gzip -9`) i segellat del Kit CAS `261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020` (`102` camins, `136/136` SHA-256).
- `2026-11-11T00:38:12.638Z` · Esborrany d'auditoria creat amb rebut del circuit documental (`torn_b5e40b1d-7714-484e-8e76-a1b68ac1c863`) vinculat al pla mestre d'Onada R17.
- `2026-11-11T00:40:00.000Z` · Emissió completa de la Matriu de Conformitat i Refutació (MCR), conciliació 3-way amb Carrils 1 i 2, relleu al Llibre Mestre i registre de telemetria.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Condició d'execució i inventari documental (`04_escriptori/`)

L'execució s'ha realitzat exclusivament dins el clon aïllat `/private/tmp/sdp_r17_carbon` sobre el commit base `0027b698d3c25041def6cad2c527d2addc22b8ff`, preservant intacte `socdepoble.org/src/`. S'han llegit sencers tots els documents vius de `_wiki_de_poble/04_escriptori/`: el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`, on la restauració de `P0-75`..`P0-99` ja ha resolt l'anomalia prèvia de truncament), els plans `261110_2334` i `261111_0042`, els tres prompts d'Onada R17 i `R17.2B`, i les auditories `261111_0032_auditoria_claude.md`, `261111_0012_auditoria_codex.md` i `261111_0104_auditoria_codex.md`. Respecte a la taxonomia **4+2 de la Wiki**, només s'han tocat les fitxes canòniques de `_wiki_de_poble/01_ser/` dins el kit (`agents_equip_ia.md`, `03_equip_ia.md`, `04_taula_potencia_models.md`) i la safata viva de `04_escriptori/`, sense llegir ni alterar `90_arxiu_historic/`.

### Síntesi i conciliació amb els Carrils 1 (`Claude`) i 2 (`Codex`)

- **Carril 1 (`Claude` · Kits `R17.1A` i `R17.1B`):** resol l'interceptor natiu d'enllaços de recuperació a Android, `App Links`, `safe-area`, contrast AA del botó de l'ull i la poda del connector WordPress per sota de `2,50 MB`. La comprovació `git merge-file` des de `0027b698d` confirma **fusió 3-way 100% neta (`0` conflictes)** en `src/css/components.css`, `src/css/layout.css` i `_wiki_de_poble/01_ser/agents_equip_ia.md`, i una única concatenació trivial a final de fitxer en `.agents/skills/sdp-pedra-seca/SKILL.md`.
- **Carril 2 (`Codex` · Kits `R17.2` i `R17.2B`):** aporta `candidatsAlergens.js`, els controls de l'Avisador, la purga de Storage en baixa programada (`P0-20`), el registre genèric en memòria `revisionsPatrimoni` (`P1-75`) i les esmenes factibles de TLS/NLnet (`P0-98`, `P0-99`). La fusió 3-way del nostre `Kit R17.3` contra els dos pegats de Codex és **100% neta (`0` conflictes)** en `ReceptesQueDinem.test.jsx`, `pageContent.js` (`anima` vs `dispositius`) i `pageContent.r10.js` (`aiTeler` vs `fediversity`). El mòdul `revisionsArbresCief.js` del `Kit R17.3` (fitxa oficial d'inspecció **CIEF v232** amb intervals `5 | 10 | 15 | 25` anys i Ordenança Municipal de La Torre) complementa sense xoc el contenidor genèric `revisionsPatrimoni` de `R17.2B`.

### Matriu d'entregues i defectes caçats en el bucle Gauntlet (`MCR`)

- **`T1` · `AH-R17-01`, `AH-R17-03`, `AH-R17-04` (Maquetació Pedra Seca i vinyeta a sang)**
  - **Scope:** `public/assets/ui/plugins/avisador_vinyeta.webp`, `src/sections/multimedia/voresImatges.json`, `src/css/{components,layout,modules}.css`, `.agents/skills/{sdp-pedra-seca,core-identitat-visual,core-calibratge-visual-nano,sdp-clon-loiverse}/SKILL.md`.
  - **Evidència reproduïble:** `voresImatges.test.js` (`90/90`) certifica `1200×703 px` (`246.358 B`) amb `[0, 0]` píxels de blanc i filet a les 4 bandes; `porta:fitxa` (`9/9`) i `porta:pedra-seca` en verd.
  - **Troballa Gauntlet `G-R17.3-01` (Severitat: Alta · Resolta):** en substituir els bytes de `avisador_vinyeta.webp`, `voresImatges.test.js` va detectar l'absència de l'entrada al manifest d'integritat visual (`voresImatges.json`). Es va regenerar el manifest amb l'algorisme determinista d'inspecció de vores i les `90` proves van passar en verd. `requires_human_decision: false`.

- **`T2` · `AH-R17-05`, `AH-R17-06` (`ReceptaDetailSection.jsx` amb capçalera hero i pestanyes `96×96 px`)**
  - **Scope:** `src/sections/patrimoni/ReceptaDetailSection.jsx`, `src/sections/patrimoni/ReceptesQueDinem.test.jsx`, `src/css/components.css`.
  - **Evidència reproduïble:** `ReceptesQueDinem.test.jsx` (`35/35`) i `ReceptaDetailSection.motor.test.jsx` (`5/5`) verifiquen `heroImage` (foto pròpia o fallback `/assets/patrimoni/portada_que_dinem_muro.webp`), pestanyes `role="tablist"` amb `.sdp-fitxa-emoji-xl` (`96×96 px`), atribució literal `CC BY-NC-SA 4.0 Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»` i contracte intacte amb `candidatsAlergens.js`.
  - **Troballa Gauntlet `G-R17.3-04` (Severitat: Mitjana · Resolta):** les icones compostes podien eixamplar la caixa més enllà de `96 px`; es va fixar `width: 96px; height: 96px; flex-shrink: 0` en `.sdp-fitxa-emoji-xl`. `requires_human_decision: false`.

- **`T3` · `AH-R17-09`, `AH-R17-10` (Accés Admin Testers a `/app` + Dossier Constitutiu d'*El Rentonar*)**
  - **Scope:** `src/apps/plataforma/{PortalApps,RutaApps,VistaBotiguesSistema}.jsx`, `src/sections/control/PanellsAdministracioSistema.jsx`, `src/data/patrimoni/actaRentonar.js`, `src/sections/profile/{DocumentacioHistoricaRentonar,PerfilPublicSection}.jsx`.
  - **Evidència reproduïble:** `PortalApps.test.jsx` (`6/6`), `RutaApps.test.jsx` (`23/23`) i `DocumentacioHistoricaRentonar.test.jsx` (`3/3`) certifiquen que només els administradors veuen els enllaços verificats a `https://groups.google.com/g/socdepoble-testers`, `Google Play Testing` i `App Store (id6826441844)`, i que `/rentonar` exposa l'acta constitutiva de `17/02/1991`, registre `GVA nº 4444 Secció 1a`, atribució `CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.` i **zero PII** (cap NIF/DNI físic ni domicili privat). `requires_human_decision: false`.

- **`T4` · `P0-86` (Catàleg Universitari dels 19 Arbres Monumentals 2020 + Fitxa Viva CIEF v232)**
  - **Scope:** `src/data/patrimoni/{arbresMonumentals2020,revisionsArbresCief}.js`, `public/assets/uploads/patrimoni/arbres-2020/*.webp` (`64` actius), `src/sections/patrimoni/{FitxaArbreMonumental,arbresMonumentals2020.test}.jsx`.
  - **Evidència reproduïble:** `arbresMonumentals2020.test.jsx` (`3/3`) certifica els **19/19 exemplars** del llibre universitari de 2020 (144 pàgines), l'existència a disc dels `64` `.webp`, la fitxa d'inspecció **CIEF v232** amb intervals configurables (`5 | 10 | 15 | 25` anys), les deltes longitudinals `2007 → 2020 → 2026`, l'alerta fitosanitària del `22/09/2024` per *Xylella fastidiosa* en l'Alborç `#2` i l'Ordenança de Protecció d'Arbres de La Torre.
  - **Troballa Gauntlet `G-R17.3-05` (Severitat: Mitjana · Resolta amb honestedat documental):** en l'exemplar `#12 Pi de la Foia Boix` (pàg. 92 del PDF 2020), l'equip universitari va registrar perímetre i capçada el 2020 però no va consignar una nova mesura d'altura total. S'ha preservat `alturaM: null` en la sèrie 2020 mantenint visible la mesura històrica de 2007 (`10,00 m`), sense inventar cap dada. `requires_human_decision: false`.

- **`T5` · `AH-R17-13`, `AH-R17-15`, `P0-95` (2 Workspaces Multi-Llibre Diferits i Closca Pura)**
  - **Scope:** `src/sections/patrimoni/{NaturaPatrimoniWorkspaceSection,BancLlavorsWorkspaceSection,CalendariAgricolaLlavorsView,WorkspacesMultiLlibreR17.test}.jsx`, `src/sections/page/PageDetailSection.jsx`.
  - **Evidència reproduïble:** `WorkspacesMultiLlibreR17.test.jsx` (`3/3`) i `PageDetailSection.patrimoniR9.test.jsx` (`6/6`) certifiquen el selector multi-llibre `Natura i Patrimoni` (19 Arbres + 117 Herbari + 6 Rutes) i `Banc de Llavors` (125 Varietats + Calendari Agrícola + Pou de la Neu 3D), carregats en chunks diferits amb `0 B` de sobrecàrrega a l'arrencada (`243.334 B gzip -9`, `+11 B` sobre `HEAD`).
  - **Troballa Gauntlet `G-R17.3-02` (Severitat: Alta · Resolta):** en navegar des d'un cultiu del Calendari Agrícola cap a una varietat del Banc de Llavors, l'efecte de muntatge intern d'`UniversalWorkspace` (`resetNavigation()`) netejava `selectedItemId` just després del `selectItem()` del pont. S'ha diferit l'aplicació en `PontSeleccioVarietat` amb `queueMicrotask` cancel·lable i la prova de salt directe queda 100% verda. `requires_human_decision: false`.

- **`T6` · `P0-89` i `P0-93` (Dossier Doctoral FinTech *La Figuera* + Coherència Editorial Viva)**
  - **Scope:** `DOSSIER_FINTECH_LA_FIGUERA_CARBON.md` (dins el Kit CAS), `_wiki_de_poble/01_ser/{agents_equip_ia,03_equip_ia,04_taula_potencia_models}.md`, `src/sections/text/{pageContent,pageContent.r10}.js`, `.agents/contingut_estructural.json`.
  - **Troballa Gauntlet `G-R17.3-06` (Severitat: Alta · Esmenada al Dossier FinTech):** l'auditoria jurídica i tècnica de `ESTUDI_DOCTORAL_PAGAMENTS_SQUARE_MERCAT_NODE0.md` va detectar **4 desviacions crítiques** en l'esborrany local del Node 0: (1) comissions d'EUA/UK en lloc de les tarifes oficials de **Square Espanya/EEE** (`1,25% + 0,05 €` amb targeta física i `1,4% + 0,25 €` en línia per a targetes EEE); (2) risc de suplantació de cobrament si es confia només en el callback d'URL client de Square Point of Sale sense webhook signat ni conciliació via `Orders/Payments API` + RLS; (3) omissió de l'obligació de CIF propi i adaptació **Veri\*Factu (RD 1007/2023)** per a associacions amb activitat econòmica recurrent al Nivell 3; (4) omissió de la fi del llindar anual de `3.000 €` en el **Model 170 per a Bizum professional (RD 253/2025, vigent des de febrer 2026)** i del marc de venda directa agroalimentària (**Decret 201/2017 GVA**). Totes quatre queden corregides amb arquitectura de referència al dossier del kit. `requires_human_decision: true` (elecció final de proveïdor i visat per gestoria col·legiada abans d'activar cobraments reals).
  - **Troballa Gauntlet `G-R17.3-03` (Severitat: Mitjana · Resolta):** l'actualització pentalingüe d'`aiTeler` amb `Gemini 4 Carbon (High)` i `Claude Fable 5.2` superava inicialment el sostre de `8` etiquetes `<strong>` per bloc (`pageContent.fediversity.test.js`); es va calibrar a `7` negretes per idioma (`42/42` verd) i es va resegellar `anima` a `contingut_estructural.json` (`27/27`). `requires_human_decision: true` (re-aprovació nominal del Mestre a la Frontissa en fusionar a l'arbre viu).

### Proposta de millora per a la plantilla `prompt_local.md`

En clons aïllats nets (`/private/tmp/...`) no existeix `.env.local`, de manera que `npm run build:web` exigeix un parell sintètic amb el format públic validat per `src/config/publicCredentials.js` (`VITE_DATA_MODE=seed VITE_SUPABASE_URL=https://seed.supabase.co VITE_SUPABASE_ANON_KEY=sb_publishable_seed_test_only`). Es proposa incorporar esta línia canònica i el recordatori de regenerar `src/sections/multimedia/voresImatges.json` quan es retallen imatges `.webp` dins la secció de verificació de `prompt_local.md`. `requires_human_decision: true`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Kit CAS i integritat criptogràfica

- **Ruta del Kit:** `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/`
- **`kit-carril.mjs check --target /private/tmp/sdp_r17_base_0027b698d`:** `valid: true`, `files: 102`, `frontissa.report.valid: true` (`27/27` claus correctes, `0` errors).
- **`R17.3.patch`:** `10.612.605 B`, SHA-256 `d406ec6b1ec669dc26477a929d2d09acbca4719473aa817e795b8fff446f9ea3`, `git apply --check` sobre `0027b698d`: **PASSA (`exit 0`)**.
- **`shasum -a 256 -c SHA256SUMS`:** **`136/136` fitxers OK (`exit 0`)**.

### Portes executables i suites de proves al clon candidat (`/private/tmp/sdp_r17_carbon`)

- **Portes estàtiques i de disseny (`exit 0` totes):** `npm run lint` (`0` errors, `0` warnings), `porta:fitxa` (`9/9`), `porta:pedra-seca` (`0` estils/colors en línia, `0` errors i18n), `porta:inlinestyles` (`0`), `porta:vocabulari` (`0` violacions noves), `porta:design-guard` (`0` crítics, `0` avisos en `3.657` fitxers), `porta:tokens` (`6/6`), `porta:promesa` (`P1=0, P3=0`), `porta:frontissa`, `porta:enxufe` (`E1–E4`), `porta:importacions`, `porta:graella`, `porta:tdz`, `porta:innerhtml`, `porta:cens` (`5/5`), `porta:orfandat`, `porta:frontmatter`, `porta:rutes`, `porta:rutes-web`, `porta:cataleg` i `check:secret-literals` (`0` troballes en `5.287` fitxers).
- **Proves Node (`31/31` passades):** `tests/t11-equip-contracte.test.mjs` i `tests/t11-retrieval-provenance.test.mjs`.
- **Suites Vitest (`21/21` fitxers · `339` passades, `0` fallades):** `arbresMonumentals2020.test.jsx` (`3`), `WorkspacesMultiLlibreR17.test.jsx` (`3`), `DocumentacioHistoricaRentonar.test.jsx` (`3`), `PortalApps.test.jsx` (`6`), `RutaApps.test.jsx` (`23`), `ReceptesQueDinem.test.jsx` (`35`), `ReceptaDetailSection.motor.test.jsx` (`5`), `voresImatges.test.js` (`90`), `paquetDArrencada.test.js` (`55`), `pesDelNucli.test.js` (`1`), `pageContent.fediversity.test.js` (`42`), `pageContent.r10.test.js` (`23`), `PatrimoniR9Sections.test.jsx` (`25`), `HerbariWorkspaceSection.test.jsx` (`7`), `PageDetailSection.patrimoniR9.test.jsx` (`6`), `PageDetailSection.patrimoni.test.jsx` (`2`), `BancLlavorsWorkspaceSection.{focus,tornada,projeccio}.test.jsx` (`6`), `anima.sanejament.test.js` (`2`) i `coherenciaAranyaNode0.test.js` (`2`).
- **Pressupost Closca Pura (`npm run build:web`):** entrada inicial `dist/assets/index-CCF0dALV.js` de **`243.334 B gzip -9`** (`6.666 B` de marge sota el sostre de `250.000 B`; `+11 B` respecte a `HEAD`). Tots els nous workspaces i dossiers surten en chunks diferits (`NaturaPatrimoniWorkspaceSection` `89.443 B`, `DocumentacioHistoricaRentonar` `16.004 B`, `BancLlavorsWorkspaceSection` `6.451 B`, `CalendariAgricolaLlavorsView` `4.951 B`).

### Portes documentals a l'arbre viu (`socdepoble.org`)

- `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261111_0136_auditoria_gemini_carbon.md`: **PASSA (`exit 0`, `valid: true`, `0` errors)**.
- `node tooling/gates/porta-olivera.mjs`: **PASSA (`exit 0`, `12` documents solts vius ancorats, safata d'entrada buida)**.
- Contrast amb portes globals de Wiki a l'arbre viu vs clon net: mentre que al clon candidat `/private/tmp/sdp_r17_carbon` `tractor-cens.mjs`, `porta:frontmatter` i `porta:orfandat` ixen amb **`exit 0`**, a l'arbre viu no comitejat de `socdepoble.org` reporten `rc=1` per arxius preexistents aliens a este carril (`_wiki_de_poble/10_actes/261110_0618_acta_marmota_...md`, `.agents/ESTAT.md:164`, una captura a `01_produccio/` i `02_investigacio_ia/261108_marato_r12_...`), amb **`0` infraccions en `261111_0136_auditoria_gemini_carbon.md` ni al relleu del Llibre Mestre** (no es modifiquen fitxers aliens en compliment estricte de la frontera d'efectes).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Les proves d'interfície s'han executat sobre **Vitest + JSDOM** i compilació real de producció Vite (`build:web`), sense obrir un navegador físic ni autenticar-se contra les consoles externes de `Google Groups`, `Google Play Console` o `App Store Connect`.
- El `Kit R17.3` queda segellat i verificat al dipòsit extern `_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/`, pendent que l'integrador o el Mestre l'aplique sobre l'arbre viu (`git apply --3way R17.3.patch`), regenere `wikiManifest.js` (`compile-wiki-to-app.mjs`) i emeta l'aprovació nominal humana de `frontissa-contingut.mjs` per a `anima` (juntament amb les claus de `R17.2B`).
- En l'exemplar `#12 Pi de la Foia Boix`, el PDF universitari de 2020 no consigna nova mesura d'altura total; la fitxa ho explicita amb honestedat (`null` el 2020 + referència a `10,00 m` de 2007) a l'espera d'una mesura amb hipsòmetre en la campanya local 2026.
- El `DOSSIER_FINTECH_LA_FIGUERA_CARBON.md` constitueix enginyeria jurídica i d'arquitectura de pagaments, però no substitueix l'assessorament vinculant d'una gestoria fiscal col·legiada abans d'obrir cobraments comercials en viu.
- L'arnés local d'Antigravity no exposa per API el percentatge instantani de la barra visual de quota de **Google AI Ultra**; s'ha registrat la telemetria física exacta de l'execució (`90 min`, `996` passos, `737` tool calls, `8,28 MB` de transcripció, `0,00 USD` sobrecost marginal amb `Overages OFF`) i queda pendent contrastar la resta visual a la barra del client respecte al baseline `t0` (`53%` setmanal / `98%` 5h).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[261111_0004_prompt_gemini_carbon_onada_r17_workspaces_maquetacio_i_arbres_2020]]
- [[261111_0032_auditoria_claude]]
- [[261111_0012_auditoria_codex]]
- [[261111_0104_auditoria_codex]]
- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]

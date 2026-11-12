---
type: prompt
status: esborrany
description: 'Ordre executiva sense retallades per a Gemini 4 Carbon (High) en Carril 3 aïllat: Kit R17.3 Workspaces Multi-Llibre, 19 arbres PDF 2020 + CIEF v232, ReceptaDetailSection i Pedra Seca.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:51b16ebb-1c5b-46e2-8d6b-8cd71ce10a34
---
# Prompt d'Execució Local — Gemini 4 Carbon (High) · Onada R17: Workspaces Multi-Llibre, 19 Arbres 2020 CIEF i Maquetació Pedra Seca

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` i totes les àncores declarades a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-95 / IDEA-226`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 3 exclusiu per a `Gemini 4 Carbon (High)` operant sobre clon aïllat `/private/tmp/sdp_r17_carbon` i lliurant Kit CAS segellat amb `SHA-256` a `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/`.
- [x] **Pla d'Implementació** generat i vinculat al torn (`261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Creat amb `document.mjs context` + `create` preservant al 100% els blocs fixos.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Zero estils inline (`tractor-inline-styles`), zero hexadecimals fora de tokens Pedra Seca, sanejament de contingut patrimonial i càrrega diferida `lazyRoute` (`P0-95` Closca Pura).
- [x] **Enginyeria Inversa i Paritat amb REA**: Activat per a paritat visual amb el maquetat original de 144 pàgines del PDF de 2020 i la fitxa oficial CIEF v232.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:51b16ebb-1c5b-46e2-8d6b-8cd71ce10a34 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T23:04:16.492Z |
| Modificació | 2026-11-10T23:05:30.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | ~38.000 tokens (Quota inicial Google AI Ultra: 53% setmanal restant — prova de rendiment i despesa real de Carbon) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-10T23:04:16.492Z:** Esborrany creat sobre tall d'evidència `COMMIT R16b · 0027b698d` (`v1.1.12`).
- **2026-11-10T23:05:30.000Z:** Ordre executiva íntegra i sense cap retallada per a `Gemini 4 Carbon (High)` (`Carril 3 · Kit R17.3`): maquetació Pedra Seca (`AH-R17-01, 03, 04, 05, 06`), El Rentonar + `/app` admin (`AH-R17-09, 10`), Catàleg Universitari dels 19 Arbres de 2020 amb Fitxa Viva + Revisions Longitudinals CIEF v232 (`P0-86`), 2 Workspaces Multi-Llibre modulars (`P0-95`), síntesi doctoral FinTech de *La Figuera* (`P0-89`) i Coherència Editorial Viva (`P0-93`).

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_builds_de_poble/`, `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_menjar_i_beure_de_poble/`, `_multimedia_de_poble/`, `_oficina_de_poble/`, `_raw_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`), Claude Code (`Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i `Claude Opus · Ultracode` reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (`GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i contractes, i `GPT Astra` per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre `socdepoble.org`, cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net `.patch` a `_wiki_de_poble/04_escriptori/` o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

**Pla de referència vinculat:** `[[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]` i Llibre Mestre `[[03_llibre_mestre_tasques_i_idees]]` (`P0-78..P0-95`).
**Tall d'evidència i Aïllament Estricte de Carril 3:** Parteix exclusivament d'`HEAD 0027b698d` (`COMMIT R16b`). Clona l'arbre net a `/private/tmp/sdp_r17_carbon` (mai mutes `src/` de l'arbre viu de `socdepoble.org/`, reservat a Claude en Carril 1!) i lliura el teu treball com a **Kit CAS segellat amb manifest `SHA-256` i totes les proves verdes** a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/`.
**REGRA CRÍTICA ANTI-BLOQUEIG D'ANTIGRAVITY (`preShell`):** **MAI** combines en una mateixa línia de shell rutes protegides (`tooling/`, `.agents/`, `scripts/`) amb comandes destructives (`rm`, `mv`) ni `node -e` inline; executa sempre comandes simples i separades.
**OBJECTIU DE PROVA DE POTÈNCIA (`Gemini 4 Carbon High`):** Aquesta és la teua estrena com a enginyera del Trident de Frontera de Sóc de Poble. No retalles cap detall: demostra la màxima precisió acadèmica, fidelitat Pedra Seca i rigor arquitectònic de Closca Pura (`P0-95` — tots els Workspaces i catàlegs nous van en mòduls diferits `lazyRoute` amb **`0 B` d'engordament al tros d'arrencada**), i registra al teu informe final la telemetria exacta de passos i tokens/quota emprats per comparar el rendiment real de Carbon!

**Mètode d'Execució Obligatori (Mètode MIT de 5 Fases + Quàdruple Tècnica: MIT + Google EGM + REA + craft-anything):**
1. *Fase 1 (Mapa Semàntic i Lectura de Fonts Primàries):* Llig les skills `sdp-pedra-seca`, `sdp-universal-page`, `sdp-app-grid-shell`, `core-coherencia-editorial-viva`, el PDF original de 144 pàgines de 2020 (`/Users/javillinares/Documents/05 Treball/La Torre de les Maçanes/¡¡¡Catàleg Arbres La Torre 2020/2020-cataleg-d-arbres-de-la-torre-2020.pdf`), la fitxa oficial CIEF v232 (`/Users/javillinares/Documents/05 Treball/La Torre de les Maçanes/¡¡¡Catàleg Arbres La Torre 2020/Fitxa d'Inventari - Inspecció..pdf`) i el dictamen acabat d'emetre per les 8 Escoles del Node 0 (`/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/ESTUDI_DOCTORAL_PAGAMENTS_SQUARE_MERCAT_NODE0.md`).
2. *Fase 2 (Hipòtesis i Disseny Modular Nivell 4 `P0-95`):* Dissenya l'estructura de dades longitudinal dels 19 arbres i dels 2 Workspaces Multi-Llibre com a mòduls 100% desacoblats i carregats sota demanda (`import()`), sense tocar mai els fitxers de Carril 1 (`ReceptorCompartit`, `PerfilShell`, `AndroidManifest.xml`, `vite.*.config.js`) ni de Carril 2 (`AvisadorPage`, `paginaDeText.js`, `llicencies.js`, `CopyrightPage.jsx`, `candidatsAlergens.js`).
3. *Fase 3 (Construcció Quirúrgica al Clon `/private/tmp/sdp_r17_carbon`):* Executa les 6 tasques completes amb zero estils inline i 100% tokens CSS Pedra Seca.
4. *Fase 4 (Gauntlet Adversarial Intern + Portes):* Passa les 5 lents EGM, `npm run lint`, `npx vitest run`, `tractor-pedra-seca`, `tractor-inline-styles`, `tractor-vocabulari` (zero adjectiu *"sobirà/sobirana"* per a IAIA o targetes; usar sempre *"La IAIA Sabuda"*, mai *"Nodrir la IAIA"*) i `pressupost-paquet.mjs` (`<= 250.000 B gzip`).
5. *Fase 5 (Empaquetat CAS + Informe Canònic):* Desa el Kit complet amb `LLEGEIX_ME.md` + manifest `SHA-256` a `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/` i emet la teua auditoria canònica a `_wiki_de_poble/04_escriptori/` mitjançant `obrir_torn.mjs` + `document.mjs`.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (Maquetació Pedra Seca d'Alta Definició · `AH-R17-01`, `AH-R17-03`, `AH-R17-04`):**
  1. **`avisador_vinyeta.webp` full-bleed (`AH-R17-01`):** Elimina qualsevol marc o vora blanca residual de la imatge i assegura encaix `object-fit: cover` a sang (`100%`) tant a la targeta com al hero de la pàgina.
  2. **Unificació `.sdp-gestor-fitxa` (`AH-R17-03`):** Unifica l'arquitectura CSS de capçalera, cos i pestanyes de fitxa entre Notes, Mercat, Banc d'Importació i Fitxa de Recepta (`tractor-fitxa-gestor.mjs` en verd).
  3. **Geometria `90°` pura en targetes/rajoles crema (`AH-R17-04`):** Garanteix `border-radius: 0` i `border: none` en les rajoles crema del sistema segons el reglament matemàtic de `sdp-pedra-seca`.
- **T2 (`ReceptaDetailSection.jsx` · `AH-R17-05` i `AH-R17-06`):**
  1. Incorpora `heroImage` a `src/sections/recepta/ReceptaDetailSection.jsx` mostrant la fotografia real del plat quan en tinga o el fallback canònic a la vinyeta il·lustrada de *Què dinem?*.
  2. Aplica `.sdp-fitxa-emoji-xl` a les 3 pestanyes de la fitxa de recepta i mantín el consum net de `candidatsAlergens.js` (sense editar `candidatsAlergens.js`, que pertany al Carril 2 de Codex).
- **T3 (Patrimoni Institucional *El Rentonar* i Enllaç Admin a `/app` · `AH-R17-09`, `AH-R17-10`):**
  1. A la vista `/app` (per a perfils amb rol d'administració), incorpora l'accés directe de gestió al grup de verificadors `socdepoble-testers` de Google Groups i verifica dues vegades els enllaços (`core-certificacio-enllacos`).
  2. Incorpora íntegrament l'Acta constitutiva històrica d'*El Rentonar* (2012) dins la documentació/fitxa pública de l'entitat respectant l'atribució exacta `CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.`.
- **T4 (Obra Mestra Universitària: Catàleg dels 19 Arbres de La Torre 2020 + Fitxa Viva i Revisions Longitudinals CIEF v232 · `P0-86`):**
  1. Extrau del PDF de 144 pàgines de 2020 i de la `Fitxa d'Inventari - Inspecció..pdf` (CIEF v232) **tots els 19 arbres singulars de La Torre de les Maçanes** sense deixar-te cap camp: nom popular i científic, paratge, polígon i parcel·la, coordenades UTM, propietat, perímetre de tronc (`1,30 m` i base), alçària total, diàmetre de capçada, edat estimada, estat sanitari, motiu de singularitat, descripció històrica/etnobotànica completa i l'Ordenança Municipal de Protecció.
  2. Construeix el model universitari de **«Fitxa Viva Actual + Revisions Periòdiques d'Estat de Salut Configurables (`cada 10, 15 o 25 anys`) i Històric Longitudinal ($\Delta$ 2007 → 2020 → 2026)»**: la vista principal mostra l'estat vigent de l'arbre i el panell d'Històric Longitudinal mostra les inspeccions anteriors (`2007`, `2020`, futures revisions o data de baixa/mort d'exemplars caiguts) calculant automàticament el $\Delta$ de creixement, salut, podes i comparativa fotogràfica entre èpoques.
- **T5 (2 Workspaces Multi-Llibre Enxufables Sota Demanda · `AH-R17-13`, `AH-R17-15`, `P0-95`):**
  1. Configura sobre `UniversalWorkspace` dos espais multi-llibre carregats amb `lazyRoute` (`0 B` al paquet d'entrada):
     - **Workspace 1 · Natura i Patrimoni Viu:** Catàleg dels 19 Arbres Singulars (CIEF v232) + Herbari Etnobotànic de La Torre + Rutes i Camins Tradicionals.
     - **Workspace 2 · Biblioteca Agrícola i Banc de Llavors:** Calendari Agrícola de Cultius i Tomaques + Catàleg del Banc de Llavors Tradicionals + Anatomia Rural.
- **T6 (Síntesi Doctoral FinTech per a Sofía «La Figuera» `P0-89` + Coherència Editorial Viva `P0-93`):**
  1. Llig `ESTUDI_DOCTORAL_PAGAMENTS_SQUARE_MERCAT_NODE0.md` (ja generat per les 8 Escoles del Node 0) i inclou al teu Kit un dossier executiu contrastat (`DOSSIER_FINTECH_LA_FIGUERA_CARBON.md`) validant o esmenant jurídicament i tècnicament els 4 Nivells de Pagament Legal (Tracte directe Xat exempt DAC7, Enllaç extern Square/SumUp + Model 036 puntual sense RETA `< SMI` + Decret 201/2017 GVA, Escrow C2C Mangopay, i TPV Loiverse + Square Tap to Pay per a associacions amb CIF).
  2. Prepara dins del Kit l'actualització didàctica de Coherència Editorial Viva (`agents_equip_ia`, `/page/node-zero`, `/anima`) incorporant oficialment `Gemini 4 Carbon (High)` i `Claude Fable 5.2` a l'equip de frontera.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (verificació de tests, build i pressupost de paquet sobre el clon `/private/tmp/sdp_r17_carbon`).
- **Criteris d'Acceptació:**
  1. Els **19/19 arbres** del PDF de 2020 estan exportats amb dades reals completes (zero invencions, zero placeholders) i amb càlcul longitudinal `2007 → 2020` operatiu i cobert per tests Vitest.
  2. Els 2 Workspaces Multi-Llibre, `ReceptaDetailSection.jsx`, `avisador_vinyeta.webp` i `.sdp-gestor-fitxa` passen `npm run lint`, `tractor-pedra-seca`, `tractor-inline-styles`, `tractor-vocabulari` i `pressupost-paquet.mjs` (`entrada <= 250.000 B gzip`, zero increment indegut de la Closca Pura).
  3. Kit CAS complet amb `LLEGEIX_ME.md` i manifest `SHA-256` a `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/` + còpia del resum executiu i auditoria canònica a `_wiki_de_poble/04_escriptori/` amb el recompte real de consum de `Gemini 4 Carbon (High)`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Fidelitat de dades botàniques i cadastrals (`CRÍTIC`):** Prohibit inventar cap coordenada UTM, edat o perímetre d'arbre; cada dada dels 19 exemplars ha d'eixir literalment del PDF de 2020. Si un camp figura buit a l'original de 2007 o 2020, es declara explícitament com a no mesurat en aquella inspecció.
- **Engordament accidental del paquet inicial (`ALT`):** El JSON/mòdul dels 19 arbres i l'Acta d'*El Rentonar* han d'importar-se exclusivament dins dels seus components diferits (`lazy`), mai des de `main.jsx`, `App.jsx` o `trossos-arrencada.mjs`.
- **Exclusivitat de Carrils (`ALT`):** Prohibit tocar fitxers de Carril 1 (Claude) o Carril 2 (Codex).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md` mitjançant el circuit formal (`node tooling/gates/obrir_torn.mjs` + `node tooling/wiki/document.mjs context` + `create` + `check`), declarant al Registre el vostre `Model IA` exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[taxonomia_documental]]

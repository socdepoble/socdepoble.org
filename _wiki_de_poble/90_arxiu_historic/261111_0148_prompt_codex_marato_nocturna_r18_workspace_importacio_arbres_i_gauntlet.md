---
type: prompt
status: esborrany
description: 'Ordre nocturna autònoma (~5h, parada neta 06:45 CET) per a Codex GPT-6.1 Sol Ultra: ressituar pàgina WP d''arbres dins UniversalWorkspace, fitxes doctorals import/export i Gauntlet creuat.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:251c9e28-31c5-414c-85a7-515ca069cca5
---
# Prompt Marató Nocturna R18 — Codex: UniversalWorkspace d'Arbres, Ressituació WP i Fitxes Doctorals

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` conté exclusivament el Pla i els 3 Prompts vius de l'Onada R18 (`0148`); els 12 documents anteriors estan arxivats a `90_arxiu_historic/`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-103 / IDEA-234`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 2 (`GPT-6.1 Sol Ultra`) en clon efímer aïllat `/tmp/sdp_codex_r18` (zero mutació de `src/` a l'arbre viu mentre Claude integra).
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Coacció primitiva en importació/exportació de fitxes doctorals, zero ReDoS, zero `dangerouslySetInnerHTML` sense sanejament estricte.
- [x] **Enginyeria Inversa i Paritat amb REA**: Paritat d'experiència de 4 columnes amb `/page/receptes`, `/wikidepoble` i `/disseny`.
- [x] **Cron de vigilància finit**: Finestra acotada amb parada neta obligatòria a les `06:45 CET` (`0` dimonis zombies).
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:251c9e28-31c5-414c-85a7-515ca069cca5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:52:00.146Z |
| Modificació | 2026-11-11T00:53:15.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada en conversa 261111 01:38-01:46 CET (Mode Automàtic Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | 26800 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T00:52:00.146Z:** Prompt canònic per a `Codex GPT-6.1 Sol Ultra` (Carril 2) vinculat al Pla `_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`.

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

Ets **`Codex GPT-6.1 Sol Ultra`**, titular del **Carril 2 (Enginyeria de Workspaces, Ressituació d'Importació WordPress, Esquema Doctoral Import/Export i Verificació Extrema)** en la **Marató Nocturna Autònoma `R18`** (~5 hores, **hora límit dura d'aturada: `2026-11-11T06:45:00+01:00`**, zero dimonis zombies).

1. Crea un clon net `/tmp/sdp_codex_r18` a partir de l'`HEAD c07f78b83` de `socdepoble.org` i aplica-hi d'entrada els 3 pegats ja segellats (`Kit R17.2`, `Kit R17.2B` i `Kit R17.3` de `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/R17.3.patch`) perquè construïsques directament damunt dels 19 arbres 2020 i de `revisionsPatrimoni`!
2. Aplica la **Quàdruple Tècnica (`Mètode MIT` + `Google EGM` + `REA` + `craft-anything`)** i coordina't amb Claude, Gemini Carbon i el Node 0 a través del Tauler Sinàptic `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/ESTAT_SINAPTIC.json` (sense llançar crons infinits).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`P0-100 / IDEA-231` · Unificació de `UniversalWorkspace` amb `/page/receptes` + Ressituació de la Pàgina Ja Importada de `socdepoble.net` sense Duplicar res):**
  1. **Alineació 100% amb la lògica del Mestre:** Nosaltres JA tenim importat el blog `socdepoble.net` (`src/data/importacio/paginesTrilogiaIMoliWp.corpus.json`, `paginesTrilogiaIMoliWp.mitjans.js`, `transformadorEditorialWpBlogger.js` i `src/sections/profile/admin/BancImportacioEditorial.jsx`). **NO tornes a crear ni duplicar de zero la notícia de La Torre fora del sistema d'importació!**
  2. Dins de `/page/arbres-monumentals` (`NaturaPatrimoniWorkspaceSection.jsx` sobre `UniversalWorkspace`, amb la mateixa arquitectura clara de 4 columnes que `/page/receptes` de Pep Cascant, `/wikidepoble` i `/disseny`: `CONTROL` · `Llibreria de Llibres/Pobles` · `Exemplars Catalogats` · `Portada o Fitxa UniversalPage`):
     - Quan no hi ha cap poble triat (o es punxa «Pàgina principal»), la 4a columna mostra la **Pàgina de Presentació General Multipoble** (on els pobles podran afegir els seus propis llibres d'arbres emblemàtics o monumentals a la Llibreria).
     - Quan a la **Llibreria (2a columna)** es tria el llibre *«Arbres Emblemàtics i Monumentals de La Torre de les Maçanes»*, la **primera entrada / portada d'eixe llibre** ressitua i renderitza **la pròpia pàgina ja importada de WordPress (`socdepoble.net`)** del nostre corpus d'importació, i la **3a columna** mostra tots els 19 arbres i dissenys del catàleg igual que es veuen els plats del llibre de cuina *Què dinem?*.
  3. A `BancImportacioEditorial.jsx` + `transformadorEditorialWpBlogger.js`, afig el suport net de **Destinació de Publicació (`destinacio_workspace`: `mur`, `arbres-monumentals`, `herbari`, `receptes`, `pagina`)** perquè quan el Mestre entre demà a Administració del Sistema puga governar i aprendre amb MarIA a quin Workspace es publica cada entrada importada de `socdepoble.net`!
- **T2 (`P0-100` + `P0-101` · Estàndard de Tesi Doctoral Universitària per a Fitxes d'Arbres + Importació/Exportació Bidireccional + Separació 10/10 Continguts vs Estructura):**
  1. Dissenya i implementa `src/data/patrimoni/esquemaDoctoralArbres.js` i integra'l a `FitxaArbreMonumental.jsx` sobre els 19 arbres de `arbresMonumentals2020.js` i el teu motor `revisionsPatrimoni`:
     - Blocs científics complets: Taxonomia `APG IV / POWO / Flora Iberica`, Georeferenciació `ETRS89 + altitud + bioclimatologia Rivas-Martínez`, Biometria `CIEF v232 GVA + Norma Granada` (amb sèrie temporal multianual i càlcul $\Delta$), Avaluació Biomecànica i Fitosanitària `VTA Mattheck` (`Xylella`, cavitats, risc), Protecció Jurídica `Llei 4/2006 GVA + Ordenança Municipal`, i Etnobotànica/Memòria Oral (distingint amb rigor universitari dades mesurades de `"Pendent de campanya"`, sense inventar mai cap número).
     - **Importació i Exportació Bidireccional Verificada (vàlida per a qualsevol doctorat universitari):** Exportadors i validador/importador pur amb coacció primitiva (`core-seguretat-audit`) en 4 formats: **`JSON-LD (sdp.dendrologia.doctoral.v1)`**, **`Darwin Core CSV (TDWG / GBIF)`**, **`GeoJSON (RFC 7946)`** i citació acadèmica **`BibTeX / DataCite`**.
  2. Verifica i desacobla el contracte de dades (`Data Package` de llibre/catàleg) del motor estructural de `UniversalWorkspace` perquè afegir el llibre d'arbres d'un segon poble siga `100%` injectar dades i `0%` tocar codi d'estructura!
- **T3 (Kit CAS Segellat + Bucle Gauntlet Adversarial Creuat + Parada Neta):**
  1. Segella el teu kit amb `kit-carril.mjs` a `../_investigacio_ia_de_poble/261111_kit_codex_r18_workspace_importacio_arbres_i_dades/` (`LLEGEIX_ME.md`, `PROVES.md`, `SHA256SUMS`, pegat aplicable).
  2. Audita adversarialment en mode Gauntlet `Kit R17.3` / `Kit R18.3` de Gemini Carbon i la integració `R18a`/`R18b` de Claude, registra els hashes i el teu veredicte a `ESTAT_SINAPTIC.json`, emet la teua auditoria canònica a `_wiki_de_poble/04_escriptori/` i **ATURA'T NETAMENT sense deixar cap procés ni dimoni en marxa NOMÉS QUAN TOTA LA FAENA (`P0-107..P0-116`) I L'AUDITORIA ADVERSARIAL CREUADA UNÀNIME AMB TOTES LES IAs ESTIGUEN 100% ACABADES AMB EXCEL·LÈNCIA (ORDRE DEL MESTRE 04:41 CET: eliminat el límit de les `06:45 CET`; cap parada per rellotge fins que totes acordeu que és el millor codi possible!)**.
- **T4 (Addendum en viu del Mestre `04:22–04:26 CET` · `P0-114b` Investigació Arbre Genealògic Privat amb ChatGPT/Codex + `P0-115` Autoria de Dos Nivells):**
  1. **`P0-114b` (Motor i Investigació Genealògica Privada amb `ChatGPT/Codex`):** Llig `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/genealogia_privada_mestre/LLAVOR_I_PISTES_VERIFICADES_MARIA.json` i `genealogia_doctoral_node0/`. Investiga a fons la llavor real del Mestre (branques `Llinares / Llinares` i `García / Alcaraz` entre La Torre de les Maçanes i Xixona — pista clau `Berlubia García Alcaraz` / *Ca Berlubia*), diposita el teu enriquiment d'arxius i GEDCOM 7.0 **exclusivament fora de Git** a `genealogia_privada_mestre/ENRIQUIMENT_ARXIUS_CODEX.json` (`0` noms personals en Git!), i lliura/verifica el carregador local d'1 clic (`IndexedDB` estil `Gestoria`) per a `/app/genealogia`.
  2. **`P0-115` + `P0-116` (Llei Universal d'Autoria de Dos Nivells + 3 Vistes de Card amb Sangrat `0 px` i Filet Interior + Carpeta Desplegable per Catàleg):** Verifica en el teu Kit i tests que: (a) la pàgina d'entrada `/page/arbres-monumentals` i la card del `/mur` porten autoria i copyright de **`Sóc de Poble`** (`COPYRIGHT_SDP`), mentre que **totes les `20` pàgines** del Llibre `Arbres Monumentals de La Torre de les Maçanes` (`1` presentació `#619` + `19` arbres `#1..#19`) porten autoria d'**`Associació El Rentonar`** i **`Pedro Ferrer Rodríguez`** (`DRETS_CATALEG_ARBRES`); (b) capçaleres `Catàlegs` i `Arbres` amb 3 modes de vista (`canonica` per defecte · `gran` · `rajola`) sense `border-left: 3px` blanc (`0 px` sangrat fins a la vora del frame + filet interior `inset` bidireccional); i (c) Columna 1 amb carpeta desplegable `Catàleg d'Arbres Monumentals de La Torre de les Maçanes` (`parentId` + `expandOnSelect: true` + `inclouDescendents: true`) que obri la portada `#619` i desplega les 4 seccions, substituint `DestinsCataleg` pel botó únic `+ Afegir catàleg`.

### Criteris d'acceptació i reproducció
- **URL de proves locals:** `http://localhost:3340/page/arbres-monumentals` i `http://localhost:3340/page/receptes`.
- **Criteris d'Acceptació:** Round-trip 100% fidel `export -> import` dels 19 arbres en `JSON-LD / Darwin Core CSV / GeoJSON`; portada del llibre de La Torre alimentada directament pel registre importat de `socdepoble.net` sense duplicar dades; `BancImportacioEditorial.jsx` amb destinació de Workspace; `Nucli Verge <= 250.000 B gzip`; `0` errors Vitest/Node/portes.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Injecció d'HTML o prototips en importar JSON-LD/CSV externs d'altres universitats o pobles: aplicar sanejament i coacció primitiva estricta (`Object.create(null)` / validació camp a camp).
- Engreixar el bundle inicial: tot l'esquema doctoral, exportadors i dades han de carregar exclusivament dins el chunk diferit de patrimoni (`0 B` al nucli inicial).

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

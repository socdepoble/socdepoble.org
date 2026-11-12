---
type: prompt
status: esborrany
description: 'Ordre nocturna autònoma (~5h, parada neta 06:45 CET) per a Claude Opus 5.5 / Fable 5.2: integració R17.2+R17.2B+R17.3, alliberament d''eines en beta desendollables i consens Gauntlet.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:05116f31-2964-4110-a7b0-a1d09b3f0c81
---
# Prompt Marató Nocturna R18 — Claude: Integració R17, Plugins sobre Nucli Verge i Gauntlet Creuat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` conté exclusivament el Pla i els 3 Prompts vius de l'Onada R18 (`0148`); els 12 documents d'onades anteriors han sigut arxivats amb `porta-olivera.mjs --arxiva` i ancorats a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-103 / IDEA-234`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 1 (`Claude Opus 5.5 / Fable 5.2 · Ultracode` a l'arbre viu), Carril 2 (`GPT-6.1 Sol Ultra` al clon `/tmp/sdp_codex_r18`), Carril 3 (`Gemini 4 Carbon High` al clon `/private/tmp/sdp_r18_carbon`) i Carril 4 (`8 Escoles del Node 0` + `IAIA MarIA`).
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Coacció primitiva JSONB, zero regex amb backtracking, RLS per columna i zero exposició de `.env*`.
- [x] **Enginyeria Inversa i Paritat amb REA**: Ús de `reverse-engineer-anything` i `storytold/craft-anything` sobre geometria `@container`.
- [x] **Cron de vigilància finit**: MarIA manté 1 cron espaiat (`45` min, `MaxIterations: 6`, `IsDaemon: false`) amb parada neta a les `06:45 CET`.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:05116f31-2964-4110-a7b0-a1d09b3f0c81 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:51:59.975Z |
| Modificació | 2026-11-11T00:53:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada en conversa 261111 01:38 CET (Mode Automàtic Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | 26500 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T00:51:59.975Z:** Prompt canònic per a `Claude Opus 5.5 / Fable 5.2 · Ultracode` (Carril 1) vinculat al Pla `_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`.

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

Ets **`Claude Opus 5.5 / Fable 5.2 · Ultracode`**, titular del **Carril 1 (Arbre Viu `socdepoble.org/`)** durant la **Marató Nocturna Autònoma `R18`** mentre el Mestre Javi descansa (~5 hores, **hora límit dura d'aturada: `2026-11-11T06:45:00+01:00`**, zero dimonis zombies).

> **QUÀDRUPLE TÈCNICA + SISTEMA NERVIÓS SINÀPTIC (`ESTAT_SINAPTIC.json`):**
> Aplica les 5 fases del **Mètode MIT** (acumulació multidireccional, graf semàntic de 5 nuclis, filtre Feynman, test socràtic i consolidació) combinades amb **Google EGM (`🐘 Elefant + 🐠 8 Peixos Daurats`)**, **REA** i **`craft-anything`**.
> **Diàleg entre IAs sense cremar tokens amb crons bojos:** Comunica cada avanç escrivint l'estat i l'empremta `SHA-256` a `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/ESTAT_SINAPTIC.json`. Recorda que `hooks-local.mjs` NO es toca: tu prepares l'arbre viu verificat amb Vitest i tractors de lectura, i la **IAIA MarIA** executa automàticament `lint + build + build:wp + build:natiu + cap sync + deploy socdepoble.org / socdepoble.cat + commit + push` cada vegada que marques `llest_per_deploy: true` a `ESTAT_SINAPTIC.json`!

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`COMMIT R18a` · Assimilació Reconciliada dels 3 Kits Segellats d'Onada R17 sobre `HEAD c07f78b83`):**
  1. Fes assaig previ en sec i integra a l'arbre viu els 3 kits ja segellats i verificats:
     - `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/` (`Kit R17.2`)
     - `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/` (`Kit R17.2B`)
     - `../_investigacio_ia_de_poble/261111_kit_carbon_r17_workspaces_maquetacio_i_arbres_2020/` (`Kit R17.3`)
  2. Preserva intactes les fixes de `c07f78b83` a `src/utils/useLocalSandbox.js` (`isHydrated` + `sanejaDrets`), conciliant netament els fitxers compartits descrits a `PROVES.md` de `R17.2B` i `R17.3`.
  3. Passa Vitest focal sobre tots els fitxers tocats i marca `r18a_llest_per_deploy: true` (amb la llista de claus de Frontissa i migracions SQL `2611110010`, `2611110100`, `2611110110`) a `ESTAT_SINAPTIC.json` perquè MarIA el desplegue immediatament!
- **T2 (`P0-101 / IDEA-232` · Alliberament Total d'Eines al Panell de Control amb Avís Honest «En proves · Beta oberta» + Atomització sobre Nucli Verge):**
  1. Revisa i consolida el registre modular de plugins (`src/config/registrePlugins.js` / `navigation.js` / `ControlSection.jsx` / `PortalApps.jsx`) perquè **TOTES les eines preparades estiguen visibles i accessibles ja per als usuaris**: `Avisador d'Incidències i Catàstrofes (/page/avisador)`, `TPV Cooperatiu (/tpv)`, `El Rebost (/rebost)`, `Arbres Emblemàtics i Monumentals (/page/arbres-monumentals)`, `Receptari Què Dinem? (/page/receptes)`, `Banc de Llavors i Calendari Agrícola (/page/banc-de-llavors)`, `Pou de la Neu 3D`, `Bloc de Notes (/notes)`, `Arbre Genealògic`, `El Rentonar (/rentonar)`.
  2. Afegeix una insígnia/avís clar, honest i discret d'**«En proves · Beta oberta»** a les eines en fase experimental (complint `tractor-promesa` amb `0` infraccions: mai prometre persistència remota on encara és sandbox local).
  3. Garanteix que tots els plugins estan **endollats per defecte (`enabled: true`)** però són **100% desendollables (`React.lazy` + flag declaratiu)** deixant el **Nucli Verge (`dist/assets/index-*.js <= 250.000 B gzip -9`)** intacte i extirpant codi mort/brossa.
- **T3 (`COMMIT R18b` · Bucle Gauntlet Adversarial Creuat amb Codex, Gemini Carbon i Node 0 fins a l'Excel·lència + Parada Neta):**
  1. Inspecciona al Tauler Sinàptic quan Codex (`261111_kit_codex_r18_workspace_importacio_arbres_i_dades/`) i Gemini Carbon (`261111_kit_carbon_r18_presentacio_multipoble_panell_i_versions/`) dipositen els seus Kits R18 i els dossiers del Node 0 (`DOSSIER_NODE0_R18_*.md`).
  2. Audita'ls amb ulls d'Àrbitre Implacable (`0 P0`, `0 P1`, zero duplicació d'importació de WordPress, zero adjectiu vetat per a la IAIA, marca `Sóc de Poble` intacta), assimila'ls, passa les suites Vitest, marca `r18b_llest_per_deploy: true` i `ACORD_EXCEL_LENCIA: true` a `ESTAT_SINAPTIC.json`, emet la teua auditoria canònica a `_wiki_de_poble/04_escriptori/` i **ATURA'T NETAMENT sense deixar cap cron ni procés resident NOMÉS QUAN TOTA LA FAENA (`P0-107..P0-116`) I L'AUDITORIA ADVERSARIAL UNÀNIME ENTRE TOTES LES IAs ESTIGUEN 100% COMPLETADES AMB EXCEL·LÈNCIA (ORDRE DEL MESTRE 04:41 CET: s'elimina el tall de les `06:45 CET`; a les `07:15 CET` fem balanç i prorroguem el temps que calga fins acabar al 10/10!)**.
- **T5 (Addendum en viu del Mestre `04:06–04:26 CET` · `P0-114`, `P0-114b` i `P0-115` — OBLIGATORI ABANS DEL DEPLOY):**
  1. **`P0-114` (`La llar` a `/control` 100% operativa i unificada amb `ClosaAplicacio`):** Restituïx `avisador` (`L'Avisador · Batec de Vida`, `avisador_vinyeta.webp` ja a `public/assets/ui/plugins/`, sense xifres en dígits als camps validats per `R1` de `registrePlugins.test.js`) i activa `genealogia` (`/app/genealogia`, `estat: ESTAT_PROVES`) sobre `ClosaAplicacio` (3 columnes fixes idèntiques a `/app/salut`, pentalingüe `ca/es/en/eu/gl`).
  2. **`P0-114b` (Investigació Privada de l'Arbre del Mestre + Carregador Local d'1 Clic estil `Gestoria`):** Llig `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/genealogia_privada_mestre/LLAVOR_I_PISTES_VERIFICADES_MARIA.json` (i la Tesi Doctoral de `genealogia_doctoral_node0/`), enriqueix el dossier privat fora de Git amb la teua investigació d'arxius i habilita dins de `/app/genealogia` el botó privat local d'1 clic (carregant via middleware dev-only en `localhost:3340` o selector local `.json`/`.ged` cap a `IndexedDB`, amb **ZERO dades personals del Mestre dins de `src/`, `public/` o commits de GitHub**!).
  3. **`P0-115` (Llei Universal d'Autoria de Dos Nivells — Pàgina Marc `Sóc de Poble` vs 20 Pàgines del Llibre `El Rentonar` + `Pedro Ferrer Rodríguez`):**
     - **Nivell 1 (Pàgina Principal d'Entrada `/page/arbres-monumentals` sense ítem seleccionat + Card del `/mur`):** Autoria **`Sóc de Poble`**! Elimina el bug de `src/sections/text/pageContent.patrimoniR9.js:154` (`copyright: DRETS_CATALEG_ARBRES` -> ha de portar `COPYRIGHT_SDP`, mai el copyright de Pedro Ferrer sota el logo de Sóc de Poble!) i redacta en les 5 llengües una presentació clara a primera vista on expliquem que posem com a exemple el catàleg del nostre poble (`La Torre de les Maçanes`, fet per `El Rentonar` i `Pedro Ferrer Rodríguez`) i convidem qualsevol persona, associació o ajuntament de qualsevol altre poble a crear ací el seu propi catàleg dels seus arbres.
     - **Nivell 2 (Les `20` Pàgines del Llibre `Arbres Monumentals de La Torre de les Maçanes` = `1` Presentació `#619` + `19` Arbres `#1..#19`, incloent `#2014` Xiprers del Cementeri):** Totes 20 pàgines porten autoria, barra/entitat i copyright de **`Associació El Rentonar`** + estudi tècnic de **`Pedro Ferrer Rodríguez`** (`DRETS_CATALEG_ARBRES`) — corregint `NaturaPatrimoniWorkspaceSection.jsx:193` perquè en obrir qualsevol de les 20 pàgines del llibre NO aparega embolicada sota la barra/logo de `Sóc de Poble`!
  4. **`P0-116` (Cànon de 3 Vistes + Sangrat `0 px` amb Filet Interior `inset` + Carpeta Desplegable per Llibre + Botó `+ Afegir catàleg`):**
     - **Capçaleres i 3 Modes de Card a `CatalegWorkspace.jsx` + `vistaCataleg.js` + Documentació a `/disseny`:** Capçalera Col 1 = `Catàlegs`, Capçalera Col 2 = `Arbres` (deixa lloc per a les 3 icones). Els 3 modes són: **(1) Per defecte `canonica`** (`DefaultItemCard` `.sdp-gestor-fitxa`, com `/disseny` i `/wikidepoble`), **(2) `gran`** (card vertical amb imatge gran), i **(3) `rajola`** (quadrícula 2x2). Documenta els 3 formats a `/disseny`!
     - **Sangrat `0 px` fins a la vora del frame i Filet Interior (`src/css/modules.css:15620-15664`):** Elimina `border-left: 3px solid transparent` (que deixava una ratlla blanca de 3 px!) i qualsevol marge extern: les imatges/cards han de tocar la vora exacta del frame (`0 px`) en els 3 formats, marcant la card activa per dins (`::after` / overlay `inset: 0`) amb filet interior negre pur + contra-filet blanc adaptatiu (`box-shadow: inset 0 0 0 3px #000, inset 0 0 0 4px rgba(255,255,255,0.92)` en clar i l'invers en fosc).
     - **Arbre desplegable natiu a Columna 1 (`parentId` + `expandOnSelect: true` + `inclouDescendents: true`) i Peu Net:** Dalt `Tots els arbres` (torna a la pàgina marc de `Sóc de Poble`); sota, carpeta desplegable `Catàleg d'Arbres Monumentals de La Torre de les Maçanes` que en clicar-la obri a la dreta la Pàgina Principal del Llibre (`WP #619`, signada per `El Rentonar`) i desplega les 4 subseccions (`Monumentals`, `Emblemàtics`, `Accés lliure`, `Seguiment fotogràfic`). Elimina el selector confús `Pàgina de destinació + Obri la pàgina` (`DestinsCataleg`) i deixa un sol botó centrat `+ Afegir catàleg`!

### Criteris d'acceptació i reproducció
- **URL de proves locals:** `http://localhost:3340`.
- **Criteris d'Acceptació:** Kits `R17.2 + R17.2B + R17.3` i `R18.2 + R18.3` reconciliats sense regressions; plugins visibles amb avís honest d'estat de prova i arquitectura desendollable; `Nucli Verge <= 250.000 B gzip`; `0` errors Vitest/portes; parada neta sense dimonis.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Sobreescriure `src/utils/useLocalSandbox.js` de `c07f78b83` en aplicar un kit basat en `0027b698d`: comprovar sempre el diff 3-way abans de donar per bo.
- Trencar `tractor-promesa` en mostrar eines noves al Panell de Control: declarar amb veritat nua què és local/en proves.

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

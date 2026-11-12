---
type: prompt
status: esborrany
description: 'Encàrrec autònom multi-bucle per a Codex al Carril 2 (/tmp/sdp_codex_r20): executar tests SQL AAL2 reals sense skip, oblit individual IAIA, 7 apps del Panell i reparació de suite global.'
tags:
  - govern
visibility: private
reflex: sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:f0fb96f1-c189-477a-980a-9484fc5153b9
---
# Prompt Carril 2 (Codex GPT-6.1 Sol/Astra Ultra) — Onada R20 Nocturna · Porta SQL AAL2 Real, Oblit IAIA, Panell i Suite Verda

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Opus 5.5 Extra · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini 4 Carbon High`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`): `_wiki_de_poble/04_escriptori/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio.md`.
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: Coordinació asíncrona mitjançant `04_escriptori/` i `../_investigacio_ia_de_poble/261111_2112_mesa_consens_nocturna_r20/TAULER_CONVERSA_I_CONSENS_R20.md`.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:f0fb96f1-c189-477a-980a-9484fc5153b9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T20:15:18.240Z |
| Modificació | 2026-11-11T20:18:00.000Z |
| Propietari | GPT Codex · GPT-6.1 Sol/Astra Ultra (Carril 2 · Clon /tmp/sdp_codex_r20) |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-11-11 21:05 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA (Orquestradora) -> GPT-6.1 Sol Ultra / Astra |
| Tokens consumits | ~26.000 (preparació d'orquestració R20) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T20:15:18Z (v1.0.0):** Convocatòria canònica de l'`Onada R20` per a **Codex (`GPT-6.1 Sol/Astra Ultra`)** al Carril 2 operant en clon efímer aïllat `/tmp/sdp_codex_r20` amb lliurament CAS a `../_investigacio_ia_de_poble/`.

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

**ORDRE DIRECTA DEL MESTRE JAVI LLINARES (`Onada R20 Nocturna · Zero Deute Tècnic, SQL AAL2 Real, Panell 10/10 i Suite Verda`):**
Ets **Codex (`GPT-6.1 Sol / Astra Ultra`)** al **Carril 2**. Claude (`Carril 1`) està integrant el teu `Kit R19 Revisió 2` a l'arbre viu `socdepoble.org/` i tancant el `COMMIT R18 + R19`. Per tant, **NO mutes mai `src/`, `tooling/`, `tests/` ni `.git/` de `socdepoble.org/`** (només hi escrius el teu informe canònic a `_wiki_de_poble/04_escriptori/` i actualitzes el Llibre Mestre quan corresponga). Treballa íntegrament sobre un clon fresc `/tmp/sdp_codex_r20` (rebased sobre l'estat post-Kit-R19 o l'últim `HEAD` de Claude) en **bucles continus fins a esgotar els teus tokens restants**, auto-compactant al 75% sense parar i actualitzant el teu Kit CAS idempotent `../_investigacio_ia_de_poble/261111_kit_codex_r20_sql_aal2_panell_i_suite_verda/`. **PROHIBIT afegir funcionalitats noves d'aparador**: tot va a eliminar deute tècnic i deixar el que ja tenim 10/10!

**Lectures obligatòries d'entrada:**
1. `_wiki_de_poble/04_escriptori/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio.md`
2. `_wiki_de_poble/04_escriptori/261111_1741_auditoria_claude.md` (especialment l'observació de Claude sobre el `skip` de `copublicacio-postgres.test.mjs`)
3. `_wiki_de_poble/04_escriptori/261111_1822_auditoria_codex.md` + `_wiki_de_poble/04_escriptori/261111_1951_auditoria_gemini_carbon.md`
4. `../_investigacio_ia_de_poble/261111_2112_mesa_consens_nocturna_r20/TAULER_CONVERSA_I_CONSENS_R20.md`

**Quàdruple Tècnica Cognitiva Obligatòria (`Mètode MIT 5 Fases + Google EGM Elefant i 8 Peixos + REA + craft-anything`):**
Recorre sempre les 5 fases MIT (Acumulació multidireccional, Graf semàntic dels 5 nuclis, Filtre Feynman sense argot innecessari, Test Socràtic de concurrència/corrupció/quota, i Gauntlet Loop amb el Node 0 `http://192.168.0.23:11434` verificant respostes `>= 120` caràcters nets).

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Execució Real sense `skip` de `tests/copublicacio-postgres.test.mjs` + Concurrència PostgreSQL AAL2:**
  1. Claude ha assenyalat amb raó que `tests/copublicacio-postgres.test.mjs` fa `skip` silenciós si no es defineix `SDP_PGLITE_MODULE` i no s'executa a `test:precommit`. Resol la càrrega automàtica d'un motor PostgreSQL local real disponible a l'entorn (localitza PGlite/Postgres disponible a la màquina o al Node 0/entorn local sense afegir dependències trencades, i si usa Postgres real o PGlite documenta i automatitza l'execució determinista amb transaccions rollback).
  2. Verifica dinàmicament tots els casos crítics de `2611111735_copublicacio_registrada.sql` i `2611112005_mur_lectura_publica_foraster.sql`: lectura pública `Foraster` d'`approved/published`, bloqueig d'esborranys privats, exigència estricta d'`AAL2`, anti-autoaprovació, revocació i **concurrència entre dues transaccions/connexions simultànies** sobre la mateixa publicació.
- **T2 · Oblit Individual de Títols de Conversa IAIA (`IndexedDB`) + Blindatge 10/10 de les 7 Apps del Panell:**
  1. Tanca el deute que tu mateix vas deixar anotat en R19: implementa l'**esborrat/oblit individual** d'un fil auto-titulat al xat amb la IAIA (`titolsConversesIaia` + acció d'UI neta i accessible), mantenint la purga total en tancar sessió i la prohibició absoluta de desar el cos dels missatges.
  2. Audita i fortifica a nivell de dades, transaccions `IndexedDB`, Web Locks, fuites de memòria/timers i importació/exportació (`JSON`, `CSV`, `GEDCOM 5.5.1/7.0`, `OPML`) les **7 aplicacions obertes del Panell** (`Genealogia`, `Gestoria`, `TPV Bar`, `Rebost/Nevera`, `Salut`, `Lector RSS`, `L'Avisador`): prova fitxers truncats, dades malformades, quota plena i recuperació neta sense pantalles en blanc.
- **T3 · Triatge i Reparació per Lots de les Fallades i Timeouts de la Suite Global Vitest:**
  1. En R19 vas documentar que la suite sencera acumula fallades heretades i timeouts sota càrrega. Aïlla per dominis les suites que fallen (evitant col·lisionar amb els fitxers visuals d'UX de `/notes` que porta Gemini Carbon al Carril 3), identifica'n la causa arrel (mocks obsolets, `fakeTimers` no restaurats, promeses penjades, rutes antigues) i repara tants lots com et permeten els tokens restants.
  2. Empaqueta i actualitza incrementalment després de cada bucle el teu **Kit CAS Executable** a `../_investigacio_ia_de_poble/261111_kit_codex_r20_sql_aal2_panell_i_suite_verda/` (`fitxers/`, `pegats/`, `MANIFEST.json`, `SHA256SUMS`, `verifica_i_aplica.py` i `README_INTEGRACIO.md`) rebasat contra l'últim `HEAD` de Claude perquè Claude el puga aplicar amb `0` deriva CAS!

### Criteris d’acceptació i reproducció

- **URL de proves locals:** Servidor efímer en port lliure si cal E2E, tancat obligatòriament en acabar.
- **Criteris d'Acceptació:**
  1. `tests/copublicacio-postgres.test.mjs` s'executa realment (`0 skipped`) amb proves d'AAL2, `Foraster` públic i concurrència verda.
  2. Oblit individual de títols del xat IAIA cobert per tests deterministes + 7 apps del Panell auditades amb `0` fuites ni corrupcions d'`IndexedDB`.
  3. Kit CAS `261111_kit_codex_r20_sql_aal2_panell_i_suite_verda` verificat amb `SHA256SUMS`, `eslint --max-warnings=0`, `build:web` `<= 250.000 B` gzip-9 i auditoria canònica `261111_HHMM_auditoria_codex.md` amb matriu `D01–D15`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Deriva CAS amb el `COMMIT R18 + R19` de Claude:** Quan Claude avance `HEAD` al Bucle 1, refresca el teu clon `/tmp/sdp_codex_r20` des del nou `HEAD` de `socdepoble.org/` abans de segellar el teu Kit CAS R20.
- ** Col·lisió amb Carril 3 (Gemini Carbon):** No toques els estils/controls visuals d'edició de `NotesSection` / `BarraEinesEditorUniversal` ni `pageContent.r10.js` (reservats a Carbon); centra't en ports de dades, SQL, `IndexedDB`, `Xat IAIA`, lògica transaccional del Panell i reparació de tests.
- **Esgotament de tokens:** Segella el Kit CAS després de cada bucle completat (`T1` -> segella v1; `T2` -> segella v2; `T3` -> segella v3) perquè mai es perda feina a mitges!

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

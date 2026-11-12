---
type: prompt
status: esborrany
description: 'Encàrrec autònom multi-bucle per a Gemini Carbon al Carril 3 (/tmp/sdp_carbon_r20): UX inequívoca Publicar al Mur a /notes, auditoria CDP de 7 apps i tancament òptic Commons.'
tags:
  - govern
visibility: private
reflex: sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:7a7366b2-85b4-459a-b3fa-ac8b879dfd3d
---
# Prompt Carril 3 (Gemini 4 Carbon High) — Onada R20 Nocturna · UX Publicar al Mur (/notes), Geometria CDP 7 Apps i Òptica Commons

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
| Identificador | sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:7a7366b2-85b4-459a-b3fa-ac8b879dfd3d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T20:15:18.444Z |
| Modificació | 2026-11-11T20:18:00.000Z |
| Propietari | Gemini 4 Carbon High (Carril 3 · Clon /tmp/sdp_carbon_r20) |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-11-11 21:05 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA (Orquestradora) -> Gemini 4 Carbon High |
| Tokens consumits | ~26.000 (preparació d'orquestració R20) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T20:15:18Z (v1.0.0):** Convocatòria canònica de l'`Onada R20` per a **Gemini 4 Carbon High** al Carril 3 operant en clon efímer aïllat `/tmp/sdp_carbon_r20` amb lliurament CAS a `../_investigacio_ia_de_poble/`.

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

**ORDRE DIRECTA DEL MESTRE JAVI LLINARES (`Onada R20 Nocturna · UX 10/10 Publicar al Mur, Geometria CDP Completa i Patrimoni 100% Òptic`):**
Ets **Gemini 4 Carbon High** al **Carril 3**. Claude (`Carril 1`) està integrant el teu `Kit R19` + el `Kit R19` de Codex a l'arbre viu `socdepoble.org/`, i Codex (`Carril 2`) fortifica SQL/PGlite, l'oblit individual del xat IAIA i les transaccions del Panell en `/tmp/sdp_codex_r20`. Tu operes **exclusivament en un clon efímer aïllat `/tmp/sdp_carbon_r20`** (sense tocar `src/` ni `.git/` de `socdepoble.org/`).
- **REGLA CRÍTICA D'AUTONOMIA NOCTURNA (`Zero Botons Humans`):** Està **terminantment prohibit** emetre artefactes amb `RequestFeedback: true` o barrejar en una mateixa ordre de shell rutes de `SECURITY_PATHS` (`tooling/`, `.agents/`, `scripts/`) amb `rm`, `mv` o `node -e` (perquè `antigravity-hook.mjs` obriria `force_ask` i et congelaria tota la nit!). Auto-compacta al 75% volcant el teu progrés i encadena els bucles sense parar!
- **LLEI 0 D'HONESTEDAT RADICAL BOTÀNICA:** Unanimitat absoluta de Claude, Codex i MarIA: **ZERO imatges botàniques sintètiques generades per IA (`mflux` / `Z-Image`) al patrimoni científic!** Qualsevol reemplaçament fotogràfic de patrimoni ha de ser **100% fotografia òptica real verificada de Wikimedia Commons** amb autor, URL font, llicència lliure compatible, SHA-256 i validació visual real amb `gemma3:12b` al Node 0. Si una espècie encara no té fotografia òptica verificada, es manté en estat honest sense imatge sintètica!

**Lectures obligatòries d'entrada:**
1. `_wiki_de_poble/04_escriptori/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio.md`
2. `_wiki_de_poble/04_escriptori/261111_1741_auditoria_claude.md` + `_wiki_de_poble/04_escriptori/261111_1822_auditoria_codex.md` + `_wiki_de_poble/04_escriptori/261111_1951_auditoria_gemini_carbon.md`
3. `.agents/skills/sdp-pedra-seca/SKILL.md`, `.agents/skills/sdp-universal-editor/SKILL.md` i `.agents/skills/core-versions-i-notes-llancament/SKILL.md`
4. `../_investigacio_ia_de_poble/261111_2112_mesa_consens_nocturna_r20/TAULER_CONVERSA_I_CONSENS_R20.md`

**Quàdruple Tècnica Cognitiva Obligatòria (`Mètode MIT 5 Fases + Google EGM Elefant i 8 Peixos + REA + craft-anything`):**
Aplica en cada bucle les 5 fases MIT + inspecció DOM/CSS real amb Chromium CDP (`280px`, `375px`, `768px`, `1440px` × clar i fosc) + contrast amb el Node 0 (`http://192.168.0.23:11434`, `gemma3:12b`, `mistral-nemo:12b`, `iaia-maria:latest`).

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **Bucle 1 · UX Pedra Seca 10/10 a `/notes` per «Publicar al Mur» (Cas Real de Damià Llorens Jordà):**
  1. Damià ha escrit 2 notes a `/notes` però cap ha eixit al `/mur` perquè romanen com a esborranys privats (`notes_publicades: 0, notes_totals: 2`) i l'opció per fer-les públiques passa desapercebuda.
  2. Inspecciona `src/sections/notes/` i `BarraEinesEditorUniversal` i dissenya una experiència **cristal·lina, empàtica i 100% Pedra Seca** (zero modals flotants, botons centrats `>= 48px`, icona clara de ploma/llapis en lloc de `...`):
     - Commutador/selector explícit i autoexplicatiu entre **`🔒 Esborrany privat (només per a tu)`** i **`📣 Públic al Mur del poble`**, amb selector integrat del **poble de destinació** quan l'usuari té més d'un poble vinculat (cas real de Damià amb dos pobles!).
     - Estats semàntics estrictes del botó principal (`iaia-maria-core §12.2`): **Blau (`--sdp-accio`) amb «Publicar» / «Publicar al Mur»** quan hi ha canvis pendents o quan es passa d'esborrany privat a públic, i **Verd (`--sdp-exit`) amb «Publicat»** (`Publicado`, `Published`, `Argitaratua`) quan ja és viu i sincronitzat al Mur, amb enllaç directe per veure la publicació al Mur.
     - Paritat completa en les **5 llengües (`ca, es, en, eu, gl`)** i tests Vitest de component i flux complet.
- **Bucle 2 · Auditoria i Poliment Chromium CDP (`280 / 375 / 768 / 1440 px × Clar/Fosc`) de Totes les Funcionalitats Clau:**
  1. Audita amb navegador real Chromium CDP (zero suposicions) i corregeix qualsevol fricció visual, desbordament horitzontal, falta de contrast WCAG AAA, falta de `<h1>` o botó descentrat en:
     - **Entrada 1-Clic (`EntradaSocial.jsx` / pantalla d'accés):** botons `Continua amb Apple` i `Continua amb Google` centrats, proporcionats i nítids en web i contenidor mòbil `375px`/`280px`.
     - **Mur públic (`/mur` en mode `Foraster` sense sessió i en mode veí autenticat)** + targetes i fitxes de detall (`UniversalCard` + `UniversalPage`).
     - **Perfil (`El teu poble` multi-poble + «Edició avançada de la fitxa» integrada dins del bloc decoratiu blanc del títol amb `24px` menys d'ample per costat i icona blava alineada a dalt)**.
     - **Les 7 aplicacions obertes del Panell (`/app/genealogia`, `/app/gestoria`, `/app/bar`, `/app/nevera`, `/app/salut`, `/app/lector`, `/app/avisador`):** maquetació `@container`, cap text xafat en `280px`/`375px` i botonera centrada.
- **Bucle 3 · Tancament 100% Òptic Wikimedia Commons de les 3 Objeccions Botàniques + 6 Llicències `CC-BY-3.0-US` + Coherència Editorial Viva:**
  1. Resol les 3 objeccions òptiques pendents del consens R19 (`atles-14-all-v3-llavor` cabeça/bulb vs grill d'all, `cv-04-alberginia-blanca` precisió d'abast espècie vs varietat local, `herbari-046-espigol` confirmació taxonòmica exacta `Lavandula latifolia` vs `angustifolia`) i normalitza les 6 entrades `CC-BY-3.0-US` amb verificació visual real `gemma3:12b` al Node 0 i TASL + SHA-256 complets (**zero imatges sintètiques**).
  2. Sincronitza `/versions` (`FITA_R20` i revisió honesta de `FITA_R19`), `/page/node-zero`, `/page/fediversity` i `/disseny` en les 5 llengües amb els avenços reals verificats (`Sign in with Apple`, `Google OAuth Web+iOS+Android`, lectura pública `Foraster` al Mur, UX de publicació des de `/notes`, co-publicació AAL2 i les 7 apps obertes del Panell).
  3. Empaqueta i actualitza en cada bucle el teu **Kit CAS Idempotent** a `../_investigacio_ia_de_poble/261111_kit_carbon_r20_notes_mur_ux_panell_i_optica/` (`fitxers/`, `pegats/`, `MANIFEST.json`, `SHA256SUMS`, `verifica_i_aplica.py` i `README_INTEGRACIO.md`) rebasat sobre l'últim `HEAD` de Claude.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** Servidor Vite efímer al clon `/tmp/sdp_carbon_r20` en port lliure, aturat netament en acabar.
- **Criteris d'Acceptació:**
  1. `/notes` mostra de forma inequívoca en les 5 llengües l'estat `Privat` vs `Públic al Mur`, el poble de publicació i el botó semàntic Blau `Publicar` → Verd `Publicat`, cobert per tests Vitest i captures CDP.
  2. Matriu CDP a `280px / 375px / 768px / 1440px` (clar i fosc) amb `0` desbordaments horitzontals, `0` errors de consola i `0` violacions de `tractor-pedra-seca.mjs` / `design_guard`.
  3. Zero imatges sintètiques no verificades; Kit CAS `261111_kit_carbon_r20_notes_mur_ux_panell_i_optica` segellat amb `SHA256SUMS` i auditoria canònica `261111_HHMM_auditoria_gemini_carbon.md` amb matriu `D01–D15`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Disparar `force_ask` per error:** Recorda no mesclar mai rutes `tooling/`, `.agents/` o `scripts/` amb `rm`, `mv` o `node -e` dins d'una ordre shell, i mantín sempre `RequestFeedback: false`.
- **Deriva CAS amb Claude (`COMMIT R18 + R19`):** Un cop Claude segelle el `COMMIT R18 + R19` al repositori viu, sincronitza la base del teu clon `/tmp/sdp_carbon_r20` amb el nou `HEAD` abans d'emetre el Kit CAS R20 definitiu perquè `verifica_i_aplica.py` entre amb `0` deriva!
- **Col·lisió amb Codex (`Carril 2`):** No modifiques `copublicacio-postgres.test.mjs`, migracions SQL ni el magatzem `IndexedDB` del xat IAIA (carril exclusiu de Codex).

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

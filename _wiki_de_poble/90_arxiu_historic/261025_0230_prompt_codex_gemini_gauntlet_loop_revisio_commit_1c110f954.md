---
type: prompt
status: esborrany
description: Prompt d'auditoria adversarial per a Codex i Gemini sobre el commit 1c110f954 de Claude (diàlegs d'un sol scroll, retall compacte, G-P11-01 i Connectar B2B)
tags:
  - govern
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:af13d345-401a-40cd-ab89-651ee2e468b5
---
# Gauntlet Loop (Codex Sol Ultra & Gemini 4 Argon) · Auditoria Adversarial del commit 1c110f954 (IDEA-21, IDEA-22, G-P11-01)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquest torn obri el Gauntlet Loop adversarial post-commit per a **Codex Sol Ultra** i **Gemini 4 Argon** sobre el commit **`1c110f954`** (`feat(idea-21,idea-22): diàlegs d'un sol scroll, retall compacte, G-P11-01 i Connectar com a entitat`).
Llibre Mestre actualitzat amb `1c110f954`. Informe de referència de Claude: `261025_0100_implementacio_claude.md`.
**CLÀUSULA DE DIRECCIÓ AUTÒNOMA:** El Mestre Javi ha delegat la Direcció Tècnica Plenipotenciària a la **IAIA MarIA**. Cap agent s'ha d'aturar a demanar aprovació humana; totes les decisions i dubtes es resolen directament amb MarIA.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:af13d345-401a-40cd-ab89-651ee2e468b5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T00:54:03.501Z |
| Modificació | 2026-10-25T00:56:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~15.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T00:54:03.501Z: esborrany creat.
- 2026-10-25T00:56:00.000Z: instrucció tancada per a l'auditoria post-commit de Codex i Gemini.

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
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

El commit **`1c110f954`** (`feat(idea-21,idea-22): diàlegs d'un sol scroll, retall compacte, G-P11-01 i Connectar com a entitat`) ja és a `HEAD`.
El Mestre Javi ha ordenat activar el **Gauntlet Loop adversarial implacable** a dues bandes:

1. **Directiva de Direcció Autònoma (`core-direccio-autonoma`):**
   - El Mestre Javi està descansant. La **IAIA MarIA** assumeix la Direcció Tècnica per resoldre qualsevol consulta o decisió d'arquitectura.
   - **Cap agent no s'ha d'aturar** esperant cap botó ni aprovació humana: avanceu de forma autònoma i bolqueu les vostres troballes a l'Escriptori.
2. **Objectiu del Gauntlet:** Fortificació radical, blindatge de privacitat i zero regressions per a la publicació a botigues (App Store, Google Play i WordPress.org).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Codex Sol Ultra (Auditor Forense, SQL Concurrency i Seguretat)
- Executar `git show 1c110f954` i auditar els 38 fitxers modificats (+2.371 / -180).
- **A. Auditoria SQL i Concurrència:**
  - Inspeccionar `supabase/migrations/2610250100_seguiments_des_d_entitat.sql`.
  - Comprovar que la funció `segueix` amb `p_com` (entitat) manté la quota de 30 altes/h lligada a `auth.uid()` a `private.seguiments_altes` sense permetre cap bypass ni flood d'altes.
  - Verificar la funció `can_manage_organization` i que un membre sense rang no puga connectar en nom d'una entitat aliena.
  - Comprovar que els índexs únics per parelles (`persona_a_persona`, `persona_a_entitat`, etc.) són idempotents i no deixen bloquejos de clau.
- **B. Resolució de `G-P11-01` (`organizations.js`):**
  - Verificar que el mapa `columnesPerHost` emmagatzema les columnes absents indexades per URL efectiva d'origen i que no bloqueja servidors nous o compatibles.
- **C. Purga d'Administrar Organització de `/connectar`:**
  - Comprovar que la retirada de `BlocAdministrarOrganitzacio` de `ConnectarSection.jsx` no trenca la gestió de membres a `DetallCompte.jsx` / `GestioMembres.jsx`.
- **D. Verificació de Rendiment:**
  - Mesurar el temps de `npm run test:precommit` (límit < 30 s).
- **E. Emetre informe:** `_wiki_de_poble/04_escriptori/261025_0230_auditoria_codex.md`.

### 2. Gemini 4 Argon (Auditor Visual en Viu / DevTools a `localhost:3340`)
- Inspeccionar en viu a `http://localhost:3340`:
  - **A. Diàlegs sense doble scroll (`IDEA-21`):**
    - Obrir `/disseny?categoria=superposicions&item=superposicions-dialog`: comprovar que obrint «Obrir un diàleg» i «Obrir la finestra de la barra» només fa scroll el cos intern, i que `.sdp-dialeg` no genera doble barra de desplaçament.
    - Comprovar el comportament en pantalla curta (1280×600) i verificar que el visor d'enquadrament manté el sòl de 10rem (160px).
  - **B. Mida adaptativa de Visibilitat:**
    - Obrir `/disseny?categoria=superposicions&item=superposicions-visibilitat`: verificar que `SelectorVisibilitat` mesura `896px` d'amplada (mida `g`) i que el contingut no fa cap scroll vertical innecessari a 1280×800.
  - **C. Selector compacte de 9 píndoles:**
    - Obrir `/disseny?categoria=superposicions&item=superposicions-enquadrament`: verificar que les 9 píndoles de ràtio mesuren 48px d'alt, es mostren en una sola fila compacta i mantenen el canvas del visor sempre visible.
  - **D. Connectar com a Entitat (`IDEA-22`):**
    - Obrir `/connectar`: verificar que el selector «Connectar com a» permet commutar entre el perfil personal i les entitats administrades, i que en connectar com a entitat s'informa prèviament que no s'envia missatge privat al xat per protegir la identitat de qui administra.
- **E. Emetre informe:** `_wiki_de_poble/04_escriptori/261025_0230_auditoria_gemini.md`.

### 3. El Repte de l'Automillora del Sistema: Maduració del Flux d'Higiene i Orquestració Autònoma (Trio d'IAs)
El Mestre Javi planteja un repte fonamental de maduresa per a tot el Consell (Codex, Gemini, Claude):
- **Diagnosi del coll d'ampolla:** Cada cicle d'auditoria que s'inicia genera fricció repetitiva si no s'arxiven automàticament els documents consumits del torn anterior. La Porta Olivera donava codi 0 perquè `document.mjs create` inseria cada nou document a «## Activitat en curs» (indultant-los perpètuament), i la categoria `implementacio` de Claude quedava bloquejada per la regex de la porta.
- **La Consulta a les IAs de Frontera:**
  1. Com proposeu estructurar i madurar el cicle de vida dels documents (des del naixement del prompt/pla, passant per l'auditoria, fins a l'arxivament transparent després de consolidar el commit) per assolir **zero fricció humana**?
  2. Quins altres fluxos de treball, tractors cognitius o protocols d'orquestració autònoma detecteu que són millorables per acompanyar la maduració del sistema i estalviar temps al Mestre?
  - Bolqueu les vostres reflexions, anàlisi de causa arrel i opcions d'arquitectura als vostres informes respectius (`261025_0230_auditoria_codex.md` i `261025_0230_auditoria_gemini.md`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de migració no aplicada:**
   - Recordar que `2610250100_seguiments_des_d_entitat.sql` està escrita i assajada al test unitari de migracions, però NO està executada al PostgreSQL de producció (és potestat del Mestre).
2. **Risc de regressió visual en mòbil:**
   - Gemini ha de validar que a 375×812 px el peu del retallador i els botons del full inferior continuen sent 100% accessibles al polze.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 1186c19e82c2aa1a29514c64220e45b495e1abfb77a4c3acd27716c1affc5c4c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

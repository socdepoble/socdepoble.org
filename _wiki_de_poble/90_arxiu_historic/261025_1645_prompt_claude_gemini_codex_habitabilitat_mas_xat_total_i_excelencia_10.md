---
type: prompt
status: esborrany
description: 'Prompt d''execució i auditoria adversarial en Gauntlet Loop per a Gemini 4 Argon i Codex Sol Ultra: portar el Mas a l''habitabilitat 10/10, depuració de deutes i xat complet'
tags:
  - govern
visibility: private
reflex: sdp:torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c:2fd481dc-d405-40b3-ba17-a23dd25995db
---
# Convocatòria Gauntlet Loop (Gemini & Codex): Habitabilitat del Mas, Xat Total estil WhatsApp, Depuració del Llibre Mestre i Excel·lència 10/10

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` té únicament els documents vius de la sessió actual. Porta Olivera verificada en codi 0.
- [x] **Crash de Notes resolt**: Resolt el desfasament de `@tiptap/react` amb `dedupe: ['react', 'react-dom']` a `vite.config.js`. Panell aixecat i comprovat en viu al navegador sense errors.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit permanent d'idees (`IDEA-01` a `IDEA-31`).
- [x] **Pla d'Implementació canònic generat**: `_wiki_de_poble/04_escriptori/261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10.md`.
- [x] **Bateria de proves verificada**: `npm run test:precommit` passant 3.391 proves verdes (3.132 Vitest + 259 Node, 0 fallades).
- [x] **Rebut obtingut**: sdp:torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c:2fd481dc-d405-40b3-ba17-a23dd25995db.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c:2fd481dc-d405-40b3-ba17-a23dd25995db |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T15:41:14.179Z |
| Modificació | 2026-10-25T16:45:00.000Z |
| Propietari | MarIA |
| Aprovació humana | en revisió pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Antigravity 2.0 (IAIA MarIA) |
| Tokens consumits | ~5.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T15:41:14.179Z: esborrany canònic creat amb obertura de torn `torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c`.
- 2026-10-25T16:45:00.000Z: instrucció i tasques del Gauntlet Loop per a Gemini 4 Argon i Codex Sol Ultra redactades seguint les directives d'àudio del Mestre (habitabilitat del Mas, depuració del Llibre Mestre i objectiu 10/10).

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

> **Directiva del Mestre Javi Llinares (Àudios d'Hui):**
> *«Quan parle del Mas, estic parlant del Mas electrònic, no digues mai masia, per favor. [...] El que vull és que l'auditoria següent la dirigisques a aquest tipus de coses: Port neutral 9,5 no es pot millorar ja? no es pot aspirar al 10? Bateria de proves igual; Pedra Seca 8,5 falten coses que millorar? El xat m'agradaria completament operatiu a tots els nivells i amb totes les funcionalitats de WhatsApp (àudio, vídeo fins a 20MB per usuari...). El connector de WordPress: definir la versió per a instal·lacions antigues per fer-ho d'arrel i no tornar-hi. Connexió amb botigues d'Apple i Google: binàris antics, posar-los al dia. I la Intel·ligència del bot: d'on es trau la seua intel·ligència, planificat i clar perquè jo ho entenga. Vull que anem traient els obrers del Mas electrònic, netejar la pols de l'obra, depurar el Llibre Mestre per esborrar les tasques tècniques ja resoltes i moblar el Mas perquè siga usable i habitable.»*

Com a membres del **Trio de la Colmena**, convoquem conjuntament a **Claude** (rol d'obrera/artesana executiva de codi) i a **Gemini 4 Argon** i **Codex Sol Ultra** (auditories adversarials extremes en **Gauntlet Loop**). L'objectiu no és afegir més capes d'obra bruta, sinó polir la casa: que no caiga mai més cap panell, tancar el deute tècnic del Llibre Mestre, i moblar l'habitabilitat 10/10 del Mas.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### A. Repartiment Operatiu del Trio

- **Claude (L'Obrera / Artesana de Codi):** Execució tècnica, maquetació fina de components, implementació d'interfície per al xat fluid (àudio, vídeo, tics), i poliment d'espaiats Apple HIG a Pedra Seca.
- **Gemini 4 Argon & Codex Sol Ultra (Gauntlet Loop Adversarial Extrem):** Auditories creuades sense complaença, verificació de regressió, proves de concurrència i de límits de xarxa, contrast fotomètric de taules, i dictamen rigorós sobre el Llibre Mestre.

### B. Tasques Específiques d'Habitabilitat 10/10

1. **Auditoria del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`):**
   - Validar la depuració i arxivament de les tasques tècniques ja resoltes (`P1-16` taules, `P1-17` xat seqüencial, `P1-18` ReDoS, unificació de slug WP, i correcció del crash de Notes a `vite.config.js`).
   - Confirmar que el Llibre Mestre queda net com una patena, conservant únicament les idees vives d'habitabilitat (`IDEA-01` a `IDEA-31`).

2. **Full de Ruta per a l'Excel·lència 10/10 als 7 Mòduls:**
   - **Port Neutral (ara 9,5 -> 10/10):** Auditar com garantir la supervivència total del client en condicions de desconnexió o respostes hostils, sense cap dependència no aïllada.
   - **Bateria de Proves (10/10):** Certificar el conjunt de 3.391 proves verdes, optimització de temps i absència de solapaments.
   - **Pedra Seca (ara 8,5 -> 10/10):** Proposar els retocs concrets d'Apple HIG, ritme vertical (espaiats 8px/16px/24px), View Transitions natives i eliminació de qualsevol soroll cognitiu.
   - **Xat Fluid estil WhatsApp (10/10):**
     * Dissenyar la integració nativa d'**enregistrament de veu (àudio)** al costat del camp de text amb MediaRecorder/Web Audio API.
     * Dissenyar la pujada de **vídeo i documents fins a 20MB** amb compressió automàtica i emmagatzematge al bucket de Supabase.
     * Dissenyar el sistema de **doble tic** (enviat, entregat, llegit) i reaccions ràpides.
   - **Connector de WordPress:** Validar el paquet definitiu retrocompatible per a PHP 7.4+ i WP 5.8+ sota el slug unificat `socdepoble`, llest per tancar i no tornar-hi mai més.
   - **Botigues Apple i Google:** Auditar els binaris d'iOS i Android per alinear-los amb els requisits vigents d'iOS 18+ i Android 15+.
   - **Arquitectura de la Intel·ligència de la IAIA MarIA:**
     * Validar el model de 3 capes: 1) Rebost Canònic (Wiki + BM25 local a `iaiaLocal.js`); 2) Raonament amb Genotip valencià via LLM; 3) Finestra física amb el número de telèfon mòbil dedicat del Mestre (`IDEA-01`) per atendre veïns per WhatsApp.

3. **🔥 INCIDÈNCIA GRAVÍSSIMA DE GOVERN: El Misteri de l'Escriptori que no es Neteja Sol (`porta-olivera.mjs` i `core-higiene-escriptori`)**
   - **Diagnòstic Forense del Mestre Javi:** L'Escriptori acumula documents consumits de la mateixa jornada que generen soroll cognitiu i confonen les IAs, mentre la porta Olivera diu que està «neta» amb codi 0.
   - **La Raó Tècnica (El biaix del JavaScript a `porta-olivera.mjs:220`):** La funció `ranci()` defineix un document obsolet exclusivament si `d.data < dia` (data anterior a avui). Per tant, els documents d'avui (`261025_0545_...`, `261025_0607_...`, `261025_0610_...`) **mai es consideren rancis pel rellotge**, encara que ja s'hagen consumit en el commit `b842160ac`. A més, `porta-olivera.mjs --arxiva` sense arguments només mou allò que `ranci()` marca; per a moure documents d'avui cal passar `--arxiva --nom <fitxer>`, cosa que l'orquestradora ometia en confiar cegament en el codi 0.
   - **Missió per al Trio (Claude, Gemini i Codex):** Auditar i proposar la millora del tractor `porta-olivera.mjs` i la skill `core-higiene-escriptori` perquè la noció de «document consumit» no depenga només de la mitjanit, sinó del cicle de vida del torn (si el torn està tancat, commitejat o substituït per un nou pla d'implementació, ha de ser detectat com a consumit i proposar el seu trasllat immediat a `90_arxiu_historic/`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Risc de sobreenginyeria:** No afegir llibreries pesades noves ni dependències innecessàries. Pedra Seca manxarà sempre amb primitives natives del navegador i del sistema.
- **Risc de desincronització de context:** Llegir sempre l'última Acta Marmota (`261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp.md`) i el Pla d'Implementació vigent (`261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10.md`).

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
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp]]

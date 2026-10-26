---
type: prompt
status: esborrany
description: Instruccions quirúrgiques per a Claude Code per aplicar els 4 pegats acordats al Gauntlet Loop i passar precommit
tags:
  - govern
visibility: private
reflex: sdp:torn_c8d1838b-8395-43ad-9707-958049493c09:79c1ed97-ecd5-4c7e-b824-5b0c315e6a90
---
# Implementació dels 4 Pegats de Consens de Codex i Gemini per al 10/10 Absolut

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` té únicament els documents vius de la sessió actual. Porta Olivera verificada en codi 0.
- [x] **Consens del Gauntlet Loop assolit**: Codex Sol Ultra (`261025_2120_auditoria_codex.md`) i Gemini 4 Argon (`261025_2120_auditoria_gemini.md` v1.1.0) han acordat el paquet únic dels 4 pegats.
- [x] **Bateria de proves verdes**: `npm run test:precommit` passant **3.410 proves en verd** sobre el commit `20d11564e`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` amb les troballes P1/P2 i l'objectiu de depurar deutes tècnics.
- [x] **Rebut de torn obtingut**: sdp:torn_c8d1838b-8395-43ad-9707-958049493c09:79c1ed97-ecd5-4c7e-b824-5b0c315e6a90.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c8d1838b-8395-43ad-9707-958049493c09:79c1ed97-ecd5-4c7e-b824-5b0c315e6a90 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T21:29:04.676Z |
| Modificació | 2026-10-25T22:30:00.000Z |
| Propietari | MarIA |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Claude Opus 5.5 / Claude Code |
| Tokens consumits | ~3.800 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T21:29:04.676Z: esborrany creat sota torn `torn_c8d1838b-8395-43ad-9707-958049493c09`.
- 2026-10-25T22:30:00.000Z: instrucció per a Claude Code per implementar el paquet dels 4 pegats de consens de Codex i Gemini per al 10/10 definitiu.

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

Hola, Claude! L'auditoria adversarial extrema del Gauntlet Loop sobre el teu commit `20d11564e` ha sigut un èxit rotund. Gemini 4 Argon i Codex Sol Ultra han treballat a fons i han arribat a un **consens del 100%** (`Addenda v1.1.0`).

La teua obra anterior és magnífica (3.410 tests en verd, crash de Notes erradicat per aïllament de Vite, Android Back natiu operatiu i ports purs). Ara cal executar el tancament definitiu: **aplicar els 4 pegats quirúrgics de consens** acordats per la Colmena per assolir el **10/10 absolut**.

Són només 3 fitxers de codi font a tocar.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Pegat 1 (`C2120-01` · P2): Concurrència A→B→A a `src/sections/profile/GestioMembres.jsx` (`TriaTitular`)**:
   - Problema detectat per Codex: quan es demana canviar el consentiment a l'entitat A, es passa ràpidament a B i es torna a A abans de resoldre la xarxa, la guarda `!vigent()` descarta la resposta d'A perquè la tria ha canviat, però el servidor sí que ha aplicat el canvi, deixant la casella d'A desfasada en fals.
   - Solució: Serialitzar i mantindre les operacions pendents per organització (`orgId`). Si es torna a A mentre l'escriptura d'A continua en vol, mantindre l'estat `desant` i, quan confirme la xarxa, reconciliar l'estat d'A amb el valor real del servidor (sense tocar mai B). Afegir la prova de regressió a la suite de proves corresponent.

2. **Pegat 2 (`G2120-01` · P2): Silenciar la veu activa en gravar àudio**:
   - A `src/sections/xat/components/AdjuntXat.jsx`: exportar la funció `callaVeuActiva()`:
     ```javascript
     export function callaVeuActiva() {
       if (veus.activa) {
         const anterior = veus.activa;
         veus.activa = null;
         anterior.calla();
       }
     }
     ```
   - A `src/sections/xat/components/ControlsAdjunt.jsx`: importar `callaVeuActiva` i cridar-la a la primera línia de `grava()` (abans d'`iniciaGravacioVeu` / `gravaVeu`) perquè començar a gravar un àudio silencie immediatament qualsevol nota de veu que estiga sonant.

3. **Pegat 3 (`C2120-04` + `G2120-04` · P3): Cursa de signatures a `src/sections/xat/components/AdjuntXat.jsx` (`ReproductorActiu`)**:
   - Afegir un comptador de generació d'intent (`intentRef = useRef(0)`).
   - Incrementar `intentRef.current++` en `nota.calla()`, en pausar i en cada `carrega(renova)`.
   - Comprovar que l'intent és vigent (`intentRef.current === intent && volSonar.current && viu.current`) en `.then()`, `.catch()` i `.finally()` per evitar que un error antic o una signatura tardana reactive o bloquegi l'àudio.
   - A `fallaCarrega()`: afegir la guarda `if (!volSonar.current) return;` a l'inici.

4. **Pegat 4 (`G2120-05` · P3): Reafirmar velocitat a `AdjuntXat.jsx` per a Safari/WebKit**:
   - Dins de `metadades` (`onLoadedMetadata`) i d'`onPlay`, reafirmar explícitament:
     ```javascript
     e.currentTarget.defaultPlaybackRate = velocitatVeu();
     e.currentTarget.playbackRate = velocitatVeu();
     ```

5. **Verificació de Precommit i Commit**:
   - Executa `npm run test:precommit` (les 3.410 proves han de seguir 100% verdes).
   - Executa `git diff` per comprovar que només s'han tocat els 3 fitxers i les seues proves.
   - Fes el commit a la branca `backup-notes-publish` amb un missatge clar (ex: `fix(connectar,xat): consens gauntlet 2120 - cursa A-B-A, silenci de veu en gravar i signatures`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **No reintroduir la contaminació A→B:** Assegura't que la reconciliació d'A en tornar no escriga mai sobre l'estat de B.
- **Listeners del DOM:** Recorda que la coordinació de veus és a través del singleton de mòdul `veus`, no d'un event global de finestra.
- **Port Neutral i Model B:** Cap d'aquests canvis ha de tocar ni dependre d'adaptadors concrets de Supabase; continuen sent components purs de presentació i estat local.

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

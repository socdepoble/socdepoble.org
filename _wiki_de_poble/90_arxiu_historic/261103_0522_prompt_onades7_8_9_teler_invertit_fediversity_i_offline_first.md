---
type: prompt
status: canonic
description: 'Prompt Unificat Nocturn d''Onades 7, 8 i 9 (Teler Invertit): Zero Botons Humans, Deute Tècnic Llibre Mestre, I+D Doctoral NLnet NGI Fediversity (NixOS + FEP-7628/8b32 + Offline-First Rural) i Gauntlet Loop.'
tags:
  - govern
  - saber
visibility: private
reflex: sdp:torn_21332b6e-7cf1-4102-bf01-e034959810f3:5e5854d8-0192-444a-af21-7957a4cb50d1
---
# Prompt Unificat Nocturn d'Onades 7, 8 i 9 (Teler Invertit · Fediversity · Offline-First)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` net (`porta-olivera.mjs` ix amb `0`).
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Declarat per a `Gemini 4 Argon (High)`, `GPT-6.1 Sol Ultra` i `Claude Opus 5.5 Extra · Ultracode`.
- [x] **Pla d'Implementació** generat i vinculat al torn (`261103_0522_pla_implementacio_codex_onada7.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5.
- [x] **Enginyeria Inversa i Paritat amb REA**: Actiu.
- [x] **Cron de vigilància**: Actiu cada 30 minuts (`task-287`).
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_21332b6e-7cf1-4102-bf01-e034959810f3:5e5854d8-0192-444a-af21-7957a4cb50d1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T04:40:57.423Z |
| Modificació | 2026-11-03T04:41:30.000Z |
| Propietari | maria |
| Aprovació humana | Ordre directa del Mestre (Mode Jarvis Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · GPT-6.1 Sol Ultra · Claude Opus 5.5 Extra · Ultracode |
| Tokens consumits | Telemetria contínua als informes de cada agent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-11-03T04:40:57.423Z: esborrany creat; contingut i verificació pendents.

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

### 0. PROTOCOL ANTI-BLOQUEIG I ZERO BOTONS HUMANS (`core-direccio-autonoma`)
El Mestre està dormint i **NO pot prémer cap botó de confirmació (`Submit` / `Yes` / `Allow`)**. Per tant:
1. **Prohibit disparar `forceAsk` d'`antigravity-hook.mjs` (línies 446-457):** Mai combines en una mateixa ordre de terminal (`run_command` / `Bash`) verbs destructius o intèrprets en línia (`rm`, `mv`, `rmdir`, `unlink`, `truncate`, `ln`, `node -e`, `python -c`, `sh -c`) amb paraules o rutes com `.agents`, `tooling`, `scripts`, `04_escriptori`, `AGENTS.md`, `package.json` o `$PWD`.
2. **Prohibit usar `AskUserQuestion`, `ask_question` o `EnterPlanMode`:** Tota decisió intermèdia d'arquitectura o governança es resol autònomament amb la Directora Tècnica (**IAIA MarIA**, activa cada 30 minuts) a través dels informes d'auditoria a `_wiki_de_poble/04_escriptori/`.
3. **Ús d'eines natives i ordres netes:** Feu servir les eines natives d'arxiu (`read_file`, `edit_file`, `write_file`) i ordres simples de verificació (`npx vitest run ...`, `node --test ...`).

### 1. ARQUITECTURA DEL TELER INVERTIT I BUCLE CONTINU DE 6 HORES SENSE PARAR (ONADES 7 A 21)
- **PROHIBIT ATURAR-SE ABANS DE 6 HORES:** Ens juguem la subvenció europea de **50.000 € de NLnet NGI Fediversity (`2026-08-1a6`)** i el futur de Sóc de Poble. Cap agent pot donar el seu treball per finalitzat en 30 minuts i quedar-se inactiu.
- **MECANISME D'AUTO-DESPERTADOR OBLIGATORI (PAS 0):**
  - **En Antigravity (`Gemini 4 Argon High · Turbo`):** La teua **PRIMERA** crida d'eina en rebre aquest prompt ha de ser `schedule` amb `CronExpression: "*/15 * * * *"`, `IsDaemon: true`, `MaxIterations: 24` (6 hores = 24 cicles de 15 minuts). Cada vegada que el cron dispare, reprén immediatament el següent cicle del Gauntlet Loop i construeix/audita el següent mòdul del Sistema d'Enxufes Online/Offline i Fediversity.
  - **En `GPT-6.1 Sol Ultra` (Codex) i `Claude Opus 5.5 Extra · Ultracode`:** Teniu **PROHIBIT** emetre cap resum de tancament ni finalitzar el torn fins que hàgeu executat de cap a peus els **12 Cicles del Gauntlet Loop** (Onades 7 a 18), encadenant les crides d'eines sense cap pausa.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (Codex · Onada 7 — Llibre Mestre + Deute Tècnic + Consola + Wiki MD→HTML):**
  - Escombrat fila per fila de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` contra `HEAD 1620efcc0` (`v1.1.0`).
  - Resolució del deute obert: `L2b` (preservar `?ambit=` a `NotesSection.jsx`), `D-T3-1` (`canAutoSelect` excloent la nota tutorial quan hi ha notes pròpies), `L2-A1/A2` (claus i18n a `DialegAmbit.jsx`), i actualització de la capçalera de `/versions` a `WP v1.1.12` (ja publicada a l'SVN oficial de WordPress.org: `r3781090`-`r3781093`).
  - `tooling/brain/mapa-consola.mjs` a `0` avisos rojos/ambre (caducitat `>24h` de torns antics, arnesos Antigravity/Codex acreditats, correcció de `sdp-clon-whatsapp` i purga de *"el Mas"*).
  - Compilador i maquetació de `/wikidepoble` (`tooling/wiki/compile-wiki-to-app.mjs` + `_wiki_de_poble/`): llistes `<ol>` que no es reinicien a `1.`, paràgrafs íntegres i format editorial `H2/H3/H4` + 6-8 sintagmes en `<strong>`.
- **T2 (Gemini 4 · Onada 7 — Enllaç ↔ Card estil Obsidian + Consola il·lustrada):**
  - `T2.6`: Commutació bidireccional amb 1 clic **«Enllaç ↔ Card»** a l'Editor Universal (`TargetaIncrustadaNodeView.jsx`, `DialegTriaTargeta.jsx`, `targetesIncrustades.js`) + Cards flotades a la dreta (`data-forma="sola" data-alineacio="dreta"`) i enllaços contextuals bidireccionals entre pàgines de `pageContent.js` (`projecte` ↔ `anima`, `fedivers` ↔ `fediversity`, `consola` ↔ `cervell`, `wikidepoble` ↔ `disseny`), verificats amb `tooling/seo/certifica-enllacos.mjs`.
  - Il·lustracions còmiques (estil Bruguera/Nano) en totes les targetes de «La sala de màquines de la Consola» (`src/sections/consola/`).
- **T3 (Codex + Gemini 4 · Onada 8 i Onada 9 — Investigació Doctoral i Implementació Enxufable per a NLnet NGI Fediversity `2026-08-1a6`):**
  - **Pilar 1 (Codex · NixOS Reproduïble per a Fediversity):** Mòdul declaratiu NixOS (`nix/flake.nix` + `nix/module.nix` + `tests/fediversity-nixos-module.test.mjs`) amb `services.socdepoble.enable = true;` i rutes ActivityPub, WebFinger, NodeInfo 2.1 i Open Data `1.2.0`.
  - **Pilar 2 (Gemini 4 · Portabilitat Federada Sense Lock-in `FEP-7628` + `FEP-8b32`):** Mòdul `src/data/federacio/portabilitatFediversity.js` (+ test `tests/portabilitat-fediversity.test.mjs`) amb activitat `Move` d'ActivityPub, verificació creuada `alsoKnownAs` (migració d'un poble entre WordPress, NixOS Fediversity i Sollutia sense perdre seguidors) i proves criptogràfiques `Ed25519`/`SHA-256` (`FEP-8b32`).
  - **Pilar 3 (Codex + Gemini 4 · Motor Rural 100% Offline-First i Delay-Tolerant sota `backendPort.js`):**
    - Codex: `src/data/local/persistenciaLocalRural.js` (snapshots `IndexedDB`/`OPFS` verificats amb `SHA-256`) + `src/data/local/cuaOperacionsOffline.js` (cua d'operacions signada en cadena `SHA-256`, resolució determinista `HLC/LWW` i `drainOfflineQueue(port)`) + proves `node --test`.
    - Gemini 4: `src/data/local/pontEmergenciaRural.js` (*Sneakernet* rural JSON-LD signat per a pobles incomunicats per temporal o incendi, exportable/importable per USB o LAN local) + adaptador `File System Access API` estil Obsidian (`src/data/local/sincronitzadorCarpetaLocal.js`) + actualització doctoral de la pàgina `/fediversity` (`src/sections/text/pageContent.js` + `pageContent.fediversity.test.js`).
- **T4 (Claude + Gemini + Codex · Onades 10 a 21 — Muntatge Complet del Sistema Online/Offline com un Enxufe Universal de Cap a Peus + Gauntlet Loop de 6 Hores):**
  - **Cicle 1 (Assimilació en Viu dels Kits):** Materialitzar i integrar a l'arbre viu de `socdepoble.org` els kits `261103_kit_gemini_onada7_8_9_obsidian_fediversity_i_offline`, `261103_kit_gemini_onada7_obsidian_fediversity_i_consola`, `261103_kit_codex_onada7_excel_lencia_i_llibre_mestre` i `261103_kit_codex_onada8_9_nixos_i_offline_first`, verificant que 100% dels tests passen en viu.
  - **Cicle 2 (Enxufe 1 · Sollutia Model B de Cap a Peus):** Construir i certificar de principi a fi l'enxufe amb Sollutia (`src/data/adaptadors/sollutia/` i `src/data/backendPort.js`): descoberta d'amfitrió, recepció de sessió al Web Component `<soc-de-poble>`, consum `GET` de l'API de Sollutia amb catxé local determinista, resiliència davant caiguda de l'amfitrió (fallback immediat a snapshots locals) i 100% de paritat `16/16` a `frontissa-contingut.mjs`.
  - **Cicle 3 (Enxufe 2 · WordPress `v1.1.12`, Joomla i Web Component Standalone):** Construir i blindar el cicle complet de l'enxufe `<soc-de-poble>`: lectura d'atributs i de `window.SocDePobleConfig`, aïllament estricte d'estils i rutes (`base-path`, `ruta-inicial`), pont d'hidratació inicial i verificació criptogràfica Ed25519 del canal d'actualitzacions (`stable.json`).
  - **Cicle 4 (Enxufe 3 · Node Sobirà Fediversity: NixOS + ActivityPub + WebFinger + NodeInfo 2.1 + OpenTelemetry Sobirà):** Muntar el motor complet de federació municipal sota `src/data/federacio/`: generador determinista d'actors ActivityPub per a cada poble i associació, Inbox/Outbox verificat amb signatures `FEP-8b32` (`eddsa-jcs-2022`), migració d'actor sense lock-in `FEP-7628` entre amfitrions (WordPress ↔ Sollutia ↔ NixOS), telemetria sobirana anonimitzada i exportador Open Data `DCAT-AP 1.2.0`.
  - **Cicle 5 (Enxufe 4 · Offline-First Rural connectat en Viu a `backendPort.js`):** Connectar de forma real i operativa el motor `persistenciaLocalRural.js` + `cuaOperacionsOffline.js` + `pontEmergenciaRural.js` + `sincronitzadorCarpetaLocal.js` com a decorador enxufable (`withOfflineFirstPort(port)`) de `src/data/backendPort.js`, de manera que quan `navigator.onLine === false` o el backend tarda/falla, totes les lectures isquen d'`IndexedDB`/OPFS i totes les escriptures entren a la cua signada `SHA-256` i es drenen automàticament en tornar la cobertura.
  - **Cicle 6 (Arqueologia de l'Antic Sóc de Poble + Enxufe 5 · Servidor Sobirà «Node 0 Mac mini 24 GB» i Qualsevol VPS/NixOS):**
    - **Rescat de l'Antic Sóc de Poble ( Només Lectura!):** Investigar a fons `/Users/javillinares/Documents/Antigravity/Sóc de Poble/` (`src/rhizome/`, `src/powersync/`, `src/adapters/`, `src/workers/`, `src/security/`, `src/core/`, `_services/signaling-server/`, `_services/gateway/`, `_services/server/`, `_services/api/`, `_wiki_de_poble/`, `_wiki_sosp/`, `_historico_codi/`) i `/Users/javillinares/Documents/00 Sóc de Poble NET/` (`¡¡¡¡¡TIC de Poble`, `sdp-prototip`). Extraure totes les joies d'enginyeria Offline-First, Rhizome, Ghost Node, Signaling P2P i sincronització local que vam dissenyar des de l'origen i portar-les a l'arquitectura actual.
    - **Construcció de l'Enxufe de Servidor Sobirà (`Mac mini 24 GB Apple Silicon` + Linux/NixOS) i Mapa Real de Dominis (`socdepoble.cat`):** Crear l'adaptador client (`src/data/adaptadors/nodeSobiraPoble/`) i el servidor lleuger enxufable (`tooling/node-sobira-poble/` o al kit corresponent) capaç de transformar el **Mac mini M4 de 24 GB de RAM del Mestre al poble** (ja operatiu en `192.168.0.23:3350` amb 391 GiB lliures i Time Machine net a `TimeKINGSTON`) en un **Servidor Municipal Complet Online/LAN** accessible directament pel domini sobirà **`https://socdepoble.cat`** (sense passar per l'allotjament de SiteGround, mitjançant túnel xifrat cap al Mac mini M4 / MacBook Air). Mapa canònic de dominis de Sóc de Poble (prohibit inventar dominis `.es` inexistents): `socdepoble.org` (Central pública Firebase), `socdepoble.cat` (Connexió directa al Mac / Node 0 Sobirà), `gentdelatorre.net` (WordPress + connector SDP), `socdepoble.net` (Web antiga / llavor històrica), `socdepoble.com` i `somdepoble.com` (redirigides a `socdepoble.org`), més els dominis locals del Mestre a SiteGround (`olidelatorre.es`, `olidelatorre.com`, `compromisperlatorre.net`).
  - **Cicle 7 a 12 (Gauntlet Loop Adversarial Continu en Sèrie · Excel·lència 50.000 € Fediversity + Cas d'Ús 03-11-2026 «Zero Invenció per Complaença»):** Executar rondes successives de construcció → auditoria destructiva (Claude) → reparació immediata (Gemini + Codex) sobre tot el sistema dels 5 enxufes (Sollutia, WordPress/Joomla, Fediversity NixOS, Offline-First Navegador, i Servidor Sobirà Mac mini 24 GB `socdepoble.cat`), sobre totes les targetes i seccions de l'aplicació (`/consola`, `/fediversity`, `/multimedia`, `/notes`, `/mur`, `/mercat`, `/gestoria`, `/calendari`, `/wikidepoble`), sobre les 5 llengües (`ca`, `es`, `en`, `eu`, `gl`) i sobre totes les portes del repositori fins que s'esgoten les 6 hores de la nit. **Documenteu obligatòriament als vostres informes i al Llibre Mestre el Cas d'Ús 03-11-2026 (`core-context-panic` §5 · Zero Invenció per Complaença i Saturació):** quan un agent està saturat de context o el sistema omet un adjunt (`could not be loaded and was omitted`) o s'arxiva un fitxer abans de llegir-lo amb `read_file`, està terminantment prohibit endevinar o inventar dades per complaure el Mestre; un company d'equip sempre diu la veritat nua immediatament («estic saturada / no veig la captura, passa-me-la o fem `/compact` / xat nou») i mai menteix ni inventa.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Cap canvi no pot alterar ni tocar els builds mòbils en revisió a Apple App Store i Google Play (`v1.0.0 (2)`). Tot mòdul d'Onada 8/9 ha de viure desacoplat sota `src/data/local/`, `src/data/federacio/` o `nix/` i ser desendollable en 5 segons sense efectes col·laterals.

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

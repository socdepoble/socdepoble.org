---
type: prompt
status: actiu
description: 'Prompt operatiu de verificació final (100% Read-Only sobre codi) per a Gemini CLI i GPT Codex sobre tot el serial vespertí construït per Claude Opus 5.5 abans del desplegament a producció.'
tags:
  - govern
visibility: private
reflex: sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:c29ecbd8-93d5-4ee9-81dd-b0bed94fc466
---
# Prompt QA Adversarial de Tancament Vespertí per a Gemini CLI i GPT Codex: Cicle 4, Workspace 3 Columnes, Consola Didàctica, Govern, Visor i Bloc de Notes

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `_wiki_de_poble/04_escriptori/00_index_escriptori.md` conté tots els documents actius de la sessió, incloent-hi aquest prompt (`261030_1946_prompt_qa_gemini_codex_tancament_vesperti.md`).
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu amb la Matriu Universal de les 15 Dimensions (`D01..D15`), el Cicle 4 del Gauntlet, el Workspace de 3 columnes fixes (`> 720 px`), la Consola Didàctica, les 4 portades i l'endpoint viu de «Govern del Mestre», el visor de `/multimedia` i el desplegament inicial de `/notes`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**:
  1. **Claude Code (`Claude Opus 5.5 · Ultracode`, torn actiu `torn_438fe070-961a-4576-bb08-f597a4daf763`, `scope: code`)**: Propietari exclusiu d'escriptura sobre `src/`, `tests/`, `tooling/`, `bot/` i `public/`. Ha executat tot el serial vespertí (`Cicle 4`, `workspace-3-columnes`, `workspace-usabilitat-icones`, `consola-graella-i-redaccio`, `notes-carpetes`, `f4a` i `f4b`).
  2. **Gemini CLI (`Gemini 4 Argon (High)`, `scope: documents`)**: Execució de la **Verificació Final Pre-Producció (100% Read-Only sobre el codi)** dels 5 Blocs vespertins de Claude Opus 5.5. Carril d'escriptura exclusiu: `_wiki_de_poble/04_escriptori/261030_HHMM_auditoria_vespertina_gemini.md` i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
  3. **GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`, `scope: documents`)**: Execució de la **Verificació Final Pre-Producció (100% Read-Only sobre el codi)** dels 5 Blocs vespertins de Claude Opus 5.5. Carril d'escriptura exclusiu: `_wiki_de_poble/04_escriptori/261030_HHMM_auditoria_vespertina_codex.md` i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
- [x] **Pla d'Implementació** vinculat a l'onada (`_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb la plantilla `prompt_local.md (v3.11.0)` conservant íntegres tots els spans de codi dels blocs normatius.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Verificat el Checklist §5 i les noves regles d'inspiració `cloudflare/security-audit-skill` (separació estricta entre troballes `confirmed` amb evidència de codi i `needs_validation` sense severitat inflada).
- [x] **Enginyeria Inversa i Paritat amb REA**: Autoritzat l'ús de REA (`reverse-engineer-anything`).
- [x] **Cron de vigilància**: Sense crons zombis; treball en fil principal seqüencial.
- [x] **Rebut obtingut** per a l'arxiu generat (`sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:c29ecbd8-93d5-4ee9-81dd-b0bed94fc466`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:c29ecbd8-93d5-4ee9-81dd-b0bed94fc466 |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T18:46:45.079Z |
| Modificació | 2026-10-30T18:47:30.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~28.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-10-30T18:46:45.079Z`: Esborrany creat amb rebut canònic `sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:c29ecbd8-93d5-4ee9-81dd-b0bed94fc466`.
- `2026-10-30T18:47:30.000Z`: Completat per ordre del Mestre Javi Llinares perquè **Gemini CLI** i **GPT Codex** auditen en mode 100% Read-Only tot el serial vespertí construït per **Claude Opus 5.5 · Ultracode** abans de fer el commit i el desplegament a producció.

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

Estem en l'**Auditoria de Tancament Vespertí Pre-Producció (`261030_1946`)** abans d'empaquetar les més de 640 entrades de l'arbre i desplegar a producció. Durant aquesta vesprada (`14:30 – 19:45 CET`), **Claude Opus 5.5 · Ultracode** ha construït i integrat un serial d'alta complexitat documentat als relleus de `_wiki_de_poble/04_escriptori/261029_1723_auditoria_claude.md` (línies 50–54) i `_wiki_de_poble/04_escriptori/261030_1533_informe_matinal_opus.md`:
1. **Cicle 4 del Gauntlet** (7 dels 8 CSS de secció migrats a `src/css/modules.css` excepte `MapaFotografic.css` alineat en línia base, WebFinger a `firebase.json` i `public/.well-known/`, Llibre Mestre, Push, Traductor, Xat, Viquipèdia, E2EE/Dades i Consola).
2. **Workspace de 3 columnes fixes (`> 720 px`), decisions `A1–A4` (`f4a`), usabilitat d'icones de columna i desplegament de `/notes`** (`CARPETES` arrenca oberta a `>= 1024 px` i en rail entre `721` i `1023 px`, clic a la icona esquerra plega la columna i el chevron de `CARPETES` va apegat al títol).
3. **Reparació integral i didàctica de `/consola`** (`360 px` mínim de targeta, `0` lletres òrfenes en títols, files alineades, miniatura repetida eliminada i Índex didàctic amb `13 H3` i `114 H4` explicant *Què és / Dades / Estat*).
4. **Lot `f4b` (`B1–B4`):** Les 4 portades originals de «Govern del Mestre» (`imatgesConsola.js`, `GovernConsola.jsx`), l'endpoint en viu `GET /__iaia/govern.json` (`tooling/vite/consola-iaia.mjs`, `tooling/brain/fonts-govern.mjs`), el botó «Copiar l'enllaç de la imatge» al visor de `/multimedia` (`panellDeLaFoto.js`, `VisorDeLArxiu.jsx`) i el retallat de vores blanques de les vinyetes a `public/assets/nano_cards/` i `public/assets/ui/plugins/`.

El Mestre Javi Llinares ordena que **Gemini CLI** i **GPT Codex** auditeu de manera independent i 100% Read-Only tot aquest serial per certificar que l'arbre està llest per a producció.

> **⚠️ REGLA D'OR D'EXCLUSIVITAT DE CARRILS (ZERO ESCRIPTURA AL CODI):**
> - **PROHIBIT** modificar cap fitxer de `src/`, `tests/`, `tooling/`, `scripts/`, `bot/`, `public/` o `.agents/` (excepte obrir el vostre propi torn `--scope=documents` si us cal).
> - **PROHIBIT** executar comandes destructives de Git (`git checkout`, `git restore`, `git reset`, `git clean`, `git stash`) o `npm install`.
> - **Carril d'escriptura exclusiu:** El vostre informe d'auditoria a `_wiki_de_poble/04_escriptori/261030_HHMM_auditoria_vespertina_gemini.md` (o `_codex.md`) i l'actualització de `00_index_escriptori.md` i `03_llibre_mestre_tasques_i_idees.md`.

> **MÈTODE GAUNTLET + METODOLOGIA CLOUDFLARE SECURITY AUDIT SKILL (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet* incorporant la nova doctrina canònica destil·lada de `cloudflare/security-audit-skill` (que s'integra com a §7 de `.agents/skills/core-seguretat-audit/SKILL.md`):
> 1. **Les 6 Fases d'Auditoria Estructurada:** (1) *Reconnaissance* de fronteres de confiança i superfície modificada; (2) *Coverage-Led Hunting* per unitats `superfície × frontera de confiança × classe d'atac`; (3) *Candidate Validation* exigent (un candidat sense principal afectat, frontera creuada i resultat concret observat NO és una troballa confirmada); (4) *Structured Output* amb empremta deduplicada; (5) *Independent Record Verification* (un àrbitre refutador intenta tombar cada sospita abans d'acceptar-la, eliminant falsos positius i consells genèrics de *defense-in-depth*); i (6) *Target-Neutral Report* amb el pegat mínim al darrer punt de decisió fiable.
> 2. **Regla de la Reserva del 30% de Pressupost (`Cost Budget Gate`):** Reserveu sempre el 30% del vostre pressupost d'invocacions/temps per a la **Verificació Independent i Portes Finals** abans d'expandir la caça. Prohibida qualsevol execució que gaste tot el pressupost caçant i deixe l'informe o les portes a mitges.
> 3. **Separació Estricta `confirmed` vs `needs_validation` (Zero Severitat a l'Incert):** Només les troballes `confirmed` (demostrades al codi o al sandbox local) reben severitat (`P0`/`P1`/`P2`). Si una comprovació depén d'un element extern al repositori o al sandbox (p. ex. Nix per a `flake.nix`, selector natiu del Finder en Chrome headless, política d'un servidor remot), classifiqueu-la com a `needs_validation` **SENSE severitat** i amb el pla de validació humà exacte.
> 4. **Les 4 Lents Tàctiques de Domini aplicades a Sóc de Poble:**
>    - **`CLIENT-SIDE`:** Seguretat de `blob:`, CSP (`frame-src`, embeds), `indexedDB`, File System Access API i absència de filtració de rutes locals del disc a la URL o al portapapers (`/multimedia`).
>    - **`DATA-ISOLATION-AND-LIFECYCLE`:** Aïllament entre sessió oberta i privada (Gestoria, Bloc de Notes), oblit de carpetes locals en tancar sessió (`OBLIT_CARPETES_PENDENT`) i cicle de vida de claus E2EE.
>    - **`AI-AND-LLM`:** Prevenció de *Prompt Injection* indirecte en el Traductor Sobirà (`/__iaia/traduir`), el Lector RSS i el Bot de Telegram (`P1-24`), i blindatge de l'endpoint local `GET /__iaia/govern.json` contra *path traversal* o exposició de secrets.
>    - **`SUPPLY-CHAIN-AND-RELEASE`:** Integritat de `SKILLS_SEAL.json`, signatura de `LEDGER.md`, `contingut_estructural.json` i builds reproduïbles (`SOURCE_DATE_EPOCH`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### ELS 5 BLOCS DEL SERIAL VESPERTÍ A VERIFICAR AMB EVIDÈNCIA EMPÍRICA

- **T1 · Bloc 1: Workspace de 3 columnes fixes (`> 720 px`), decisions `A1–A4` (`f4a`), icones clicables i `/notes`**
  - Fitxers: `src/components/layout/AppGridShell.jsx`, `src/components/layout/AppGridColumn.jsx`, `src/components/layout/AppGridShell.css`, `src/components/layout/graella.js`, `src/components/universal/workspace/UniversalWorkspace.jsx`, `src/sections/notes/NotesSection.jsx`, `src/sections/notes/NotesSection.lector.test.jsx` i `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md`.
  - Comproveu:
    1. **Decisió A1 (`720 px`):** A `720 px` exactes ha d'entrar la vista mòbil (`estret`, 1 columna) i a `721 px` les 3 columnes fixes (`ample`). Verifiqueu la coherència entre `@media (max-width: 720px)` i `PUNTS_DE_TALL.estret` a `graella.js`.
    2. **Decisió A2 (Separador central):** Verifiqueu que `.sdp-grid-shell__divisor--central` es puga agafar en tota l'alçada sense quedar tapat per les barres taronja i blava.
    3. **Decisió A3 (`721–761 px`) i A4 (`railMitja` / `railEsquerra`):** Verifiqueu que entre `721` i `761 px` no hi haja desbordament horitzontal i que `railMitja` i `railEsquerra` s'hagen netejat de `contracte_graella.md` mantenint `columnesFixes`.
    4. **Usabilitat d'icones i `/notes`:** Verifiqueu que clicar la icona esquerra de columna execute el mateix plegat que `[|<]` (`onReplega`), que el chevron de `CARPETES` vaja apegat al títol, i que `/notes` arranque amb `CARPETES` oberta a `>= 1024 px` i en rail entre `721` i `1023 px` (`navegacioPlegadaEnArrencar` a `graella.js`), amb `NotesSection.lector.test.jsx` en verd.

- **T2 · Bloc 2: Reparació integral i didàctica de `/consola` + «Govern del Mestre» (`B1` i `B2`)**
  - Fitxers: `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/IndexConsola.jsx`, `src/sections/consola/indexConsola.js`, `src/sections/consola/imatgesConsola.js`, `src/sections/consola/identitatImatges.json`, `src/sections/consola/govern/GovernConsola.jsx`, `src/sections/consola/govern/useGovern.js`, `src/sections/consola/govern/governContent.js`, `tooling/vite/consola-iaia.mjs` i `tooling/brain/fonts-govern.mjs`.
  - Comproveu:
    1. **Graella i targetes de `/consola`:** Mínim canònic de `360 px`, zero lletres òrfenes en títols, files amb alçades i peus alineats, i absència de la miniatura repetida a l'Índex.
    2. **Índex didàctic (`13 H3` i `114 H4`):** Verifiqueu que cada apartat explique de debò **Què és**, **Dades reals** (sense inventar xifres) i **Estat**, amb enllaços vius a cada targeta.
    3. **B1 (4 portades noves de `Govern del Mestre`):** Verifiqueu que `requeriments`, `balanc`, `certificacio` i `comunicacio` tinguen les seues 4 il·lustracions 100% úniques i sense marc blanc.
    4. **B2 (`GET /__iaia/govern.json` en viu):** Verifiqueu que l'endpoint de `tooling/vite/consola-iaia.mjs` i `tooling/brain/fonts-govern.mjs` servisca les dades reals del repositori de manera segura (sense exposar secrets ni permetre *path traversal*) i que les 4 subpàgines de `/consola/govern/*` el consumisquen netament.

- **T3 · Bloc 3: Visor de `/multimedia` (`B3`) i Vinyetes a sang sense vores blanques (`B4`)**
  - Fitxers: `src/sections/multimedia/panellDeLaFoto.js`, `src/sections/multimedia/VisorDeLArxiu.jsx`, `src/sections/multimedia/panellDeLaFoto.test.js`, `src/sections/multimedia/panellDeLaFoto.enllac.seguretat.test.js`, `src/sections/multimedia/VisorDeLArxiu.test.jsx`, `public/assets/nano_cards/` i `public/assets/ui/plugins/`.
  - Comproveu:
    1. **B3 (Copiar l'enllaç de la imatge):** Que al visor es mostre la ruta i el botó de copiar l'enllaç per a imatges públiques (en les 5 llengües), i que per a arxius de **carpetes locals** MAI s'expose ni es copie la ruta del disc ni un `blob:`. Auditeu també si la fila d'enllaç s'està mostrant innecessàriament als visors de publicacions i del perfil (on sempre diu que no hi ha enllaç públic).
    2. **B4 (Vinyetes a sang):** Que les vinyetes retallades no tinguen vores blanques i que `identitatImatges.json` i les proves associades passen en verd. Auditeu visualment i geomètricament la vinyeta de `gestoria_vinyeta` (que en retallar a sang ha perdut prop d'un 20% per l'esquerra) i el criteri de caducitat de 24 hores de `/__iaia/govern.json` (`26/86` files segellades després d'actualitzar els 4 SHA rebasejats al Llibre Mestre).

- **T4 · Bloc 4: Cicle 4 del Gauntlet (`modules.css`, WebFinger, Frontissa i Governança)**
  - Fitxers: `src/css/modules.css`, `firebase.json`, `public/.well-known/`, `.agents/contingut_estructural.json`, `.agents/governance/LEDGER.md` i `.agents/governance/SKILLS_SEAL.json`.
  - Comproveu:
    1. Migració dels 7 CSS de secció a `src/css/modules.css` i excepció documentada de `MapaFotografic.css`.
    2. Validesa dels recursos WebFinger (`public/.well-known/webfinger`, `host-meta`) i capçaleres a `firebase.json`.
    3. Empremta de `fediversity` aprovada a `.agents/contingut_estructural.json` i integritat de `LEDGER.md` + `SKILLS_SEAL.json`.

- **T5 · Bloc 5: Execució Empírica de Portes i Suites**
  - Executeu en mode lectura i registreu el codi d'eixida exacte de:
    1. `npx eslint src tooling scripts tests bot --max-warnings=0`
    2. `node tooling/gates/design_guard.mjs --arrel=src`
    3. `node tooling/gates/tractor-graella.mjs`
    4. `node tooling/gates/tractor-vocabulari.mjs`
    5. `node tooling/gates/tractor-psicopatia.mjs`
    6. `node tooling/gates/frontissa-contingut.mjs`
    7. `node tooling/gates/segella.mjs --check` i `node tooling/verify-ledger.mjs`
    8. `npx vitest run src/components/layout src/components/universal/workspace src/sections/notes src/sections/consola src/sections/multimedia tooling/vite tooling/brain tooling/seo`
  - **Classificació d'estil Cloudflare (`confirmed` vs `needs_validation`):** Separeu estrictament qualsevol defecte real de codi (`confirmed`, amb severitat `P0`/`P1`/`P2`, fitxer, línia i pegat mínim) de les comprovacions que depenen d'entorn extern (`needs_validation`, sense severitat inflada).

- **T6 · Bloc 6 (INNEGOCIABLE PER AL MESTRE): Matriu DAFO Completa + Les 15 Dimensions (`D01..D15`) cap al `10,0 / 10` d'Excel·lència + Auditoria de SEO i Compartició Social amb Imatge (`og:image` / `twitter:image`)**
  - **1. Auditoria Crítica de SEO i Compartició Social (Pilar Fonamental per a Llançar a Xarxes):**
    - Inspeccioneu `src/hooks/useSEO.js`, `src/hooks/seoHead.js`, `src/hooks/RouteSEO.jsx`, `src/config/imatgeSocial.js`, `src/config/rutaSocial.js`, `tooling/seo/build-social-manifest.mjs`, `tooling/seo/prerender-social.mjs`, `tooling/seo/projeccio-publica.mjs` i totes les pàgines amb imatge de portada (Mur, Mercat, Pobles, Esdeveniments, Wiki de Poble, `/fediversity`, `/projecte`, `/constitucio`, `/anima`, `/versions`, `/consola` i les 4 noves de `/consola/govern/*`, plugins, etc.).
    - **Exigència del Mestre:** Tota pàgina pública o compartible que tinga una imatge de portada o il·lustració **HA DE MOSTRAR OBLIGATÒRIAMENT eixa imatge en el seu SEO (`og:image`, `twitter:image`, `twitter:card = summary_large_image`, `og:title`, `og:description`, `canonical`)** tant en el DOM viu (`useSEO`) com en l'HTML prerenderitzat (`build-social-manifest.mjs` / `prerender-social.mjs`) perquè en compartir qualsevol URL a WhatsApp, Telegram, X/Twitter, Mastodon o Facebook isca la seua imatge pròpia i mai una targeta trencada o òrfena. Si alguna pàgina amb imatge pròpia encara cau per error en la imatge genèrica o no està al manifest social de prerender, llisteu-la amb fitxer i línia exacta per deixar-la al `10/10`.
  - **2. Anàlisi DAFO Global de l'Arquitectura i de la Web:**
    - Elaboreu un quadre **DAFO complet i rigorós** (**D**ebilitats, **A**menaces, **F**ortaleses i **O**portunitats) de l'estat actual de `socdepoble.org` després del tancament d'aquesta onada.
  - **3. Valoració de les 15 Dimensions (`D01..D15`) cap a l'Excel·lència (`10,0 / 10`) i Full de Ruta Zero Deute Tècnic:**
    - Avalueu una per una les **15 Dimensions del Sistema** (`D01` Arquitectura Pedra Seca i Enxufabilitat Model B, `D02` Sistema de Disseny, Graella 3 Columnes i WCAG AAA, `D03` Xat i E2EE, `D04` Multimèdia i Gestor d'Arxius Locals, `D05` Gestoria Autònoma, `D06` El Mercat i TPV, `D07` El Mur i Mapa Fotogràfic, `D08` Pobles, Comunitat i Fedivers/WebFinger, `D09` Wiki de Poble, Bloc de Notes i Lector RSS, `D10` IAIA MarIA, Traductor Sobirà i Bot Telegram, `D11` Consola, Govern del Mestre i Observabilitat, `D12` SEO Social (`og:image`), PWA, iOS/Android i WordPress `1.1.10`, `D13` Rendiment, CSS `@layer modules` i Memòria, `D14` Seguretat Cloudflare Audit, RLS i Privacitat, `D15` Portes Immunitàries, Segell Criptogràfic i Cobertura de Proves).
    - Per a cadascuna de les 15 dimensions indiqueu: **Nota actual (`/10`)**, **Evidència empírica**, **Quin deute tècnic residual la separa del `10,0 / 10` perfecte** i **Acció quirúrgica concreta** per polir-lo fins a l'excel·lència absoluta.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/notes`, `http://localhost:3340/consola`, `http://localhost:3340/consola/govern/certificacio`, `http://localhost:3340/multimedia` i `http://localhost:3340/fediversity`.
- **Criteris d'Acceptació:**
  1. Els 6 Blocs verificats amb evidència empírica de codi i proves.
  2. **DAFO complet + Taula de les 15 Dimensions (`D01..D15`) + Auditoria de SEO Social amb Imatge (`og:image`)** inclosa íntegrament a l'informe.
  3. Veredicte final explícit: `APTE PER A COMMIT I PRODUCCIÓ` o `BLOQUEJAT PER P0/P1 (llista tancada)`.
  4. Informe validat amb `node tooling/wiki/document.mjs check` i zero modificacions a `src/`, `tests/`, `tooling/`, `bot/` o `public/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Interferència amb la transacció final de Claude Opus 5.5:** Aquest prompt s'ha de llançar quan Claude Opus 5.5 haja completat el tancament de `f4a`, `f4b` i el re-segellat de `LEDGER.md`. Durant l'auditoria, l'arbre de codi és estrictament de només lectura.

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
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[261029_1605_prompt_opus_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[261029_1723_auditoria_claude]]
- [[261029_2258_prompt_gauntlet_qa_gemini_codex_blocs_ag_i_idea57]]
- [[261030_1533_informe_matinal_opus]]
